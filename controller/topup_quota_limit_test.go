package controller

import (
	"fmt"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strconv"
	"strings"
	"testing"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"
	"github.com/QuantumNous/new-api/setting"
	"github.com/QuantumNous/new-api/setting/operation_setting"
	"github.com/gin-gonic/gin"
	"github.com/glebarez/sqlite"
	"github.com/shopspring/decimal"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/stripe/stripe-go/v81"
	"gorm.io/gorm"
)

func TestTopUpQuotaValidation(t *testing.T) {
	oldQuotaPerUnit := common.QuotaPerUnit
	oldDisplayType := operation_setting.GetGeneralSetting().QuotaDisplayType
	common.QuotaPerUnit = 500000
	t.Cleanup(func() {
		common.QuotaPerUnit = oldQuotaPerUnit
		operation_setting.GetGeneralSetting().QuotaDisplayType = oldDisplayType
	})

	testCases := []struct {
		name        string
		displayType string
		amount      int64
		wantQuota   int
		wantErr     bool
	}{
		{
			name:        "currency amount below limit",
			displayType: operation_setting.QuotaDisplayTypeUSD,
			amount:      4294,
			wantQuota:   2_147_000_000,
		},
		{
			name:        "currency amount above limit",
			displayType: operation_setting.QuotaDisplayTypeUSD,
			amount:      4295,
			wantQuota:   2_147_500_000,
		},
		{
			name:        "token amount preserves settlement truncation",
			displayType: operation_setting.QuotaDisplayTypeTokens,
			amount:      2_147_500_000,
			wantQuota:   2_147_500_000,
		},
		{
			name:        "token amount above legacy int32 range",
			displayType: operation_setting.QuotaDisplayTypeTokens,
			amount:      4_294_500_000,
			wantQuota:   4_294_500_000,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			operation_setting.GetGeneralSetting().QuotaDisplayType = tc.displayType
			quota, err := getTopUpQuota(tc.amount)
			if tc.wantErr {
				require.Error(t, err)
				return
			}
			require.NoError(t, err)
			assert.Equal(t, tc.wantQuota, quota)
		})
	}
}

func TestValidateTopUpQuotaReturnsMaximumAmount(t *testing.T) {
	oldQuotaPerUnit := common.QuotaPerUnit
	oldDisplayType := operation_setting.GetGeneralSetting().QuotaDisplayType
	common.QuotaPerUnit = 500000
	operation_setting.GetGeneralSetting().QuotaDisplayType = operation_setting.QuotaDisplayTypeUSD
	t.Cleanup(func() {
		common.QuotaPerUnit = oldQuotaPerUnit
		operation_setting.GetGeneralSetting().QuotaDisplayType = oldDisplayType
	})

	maxAmount := decimal.NewFromInt(common.MaxWalletQuota).
		Div(decimal.NewFromFloat(common.QuotaPerUnit)).
		Floor().IntPart()

	_, err := validateTopUpQuota(maxAmount)
	require.NoError(t, err)
	_, err = validateTopUpQuota(maxAmount + 1)
	require.EqualError(t, err, fmt.Sprintf("Top-up amount cannot exceed %d", maxAmount))
}

func TestRequestAmountRejectsTopUpThatCannotBeSettled(t *testing.T) {
	oldQuotaPerUnit := common.QuotaPerUnit
	oldDisplayType := operation_setting.GetGeneralSetting().QuotaDisplayType
	common.QuotaPerUnit = 500000
	operation_setting.GetGeneralSetting().QuotaDisplayType = operation_setting.QuotaDisplayTypeUSD
	t.Cleanup(func() {
		common.QuotaPerUnit = oldQuotaPerUnit
		operation_setting.GetGeneralSetting().QuotaDisplayType = oldDisplayType
	})

	gin.SetMode(gin.TestMode)
	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	maxAmount := decimal.NewFromInt(common.MaxWalletQuota).
		Div(decimal.NewFromFloat(common.QuotaPerUnit)).
		Floor().IntPart()
	ctx.Request = httptest.NewRequest(
		http.MethodPost,
		"/api/user/amount",
		strings.NewReader(fmt.Sprintf(`{"amount":%d}`, maxAmount+1)),
	)
	ctx.Request.Header.Set("Content-Type", "application/json")

	RequestAmount(ctx)

	assert.Equal(t, http.StatusOK, recorder.Code)
	assert.JSONEq(t, fmt.Sprintf(`{"message":"error","data":"Top-up amount cannot exceed %d","message_key":"Top-up amount cannot exceed {{max}}","message_params":{"max":%d}}`, maxAmount, maxAmount), recorder.Body.String())
}

func TestRequestAmountRejectsTopUpThatWouldOverflowWallet(t *testing.T) {
	oldQuotaPerUnit := common.QuotaPerUnit
	oldDisplayType := operation_setting.GetGeneralSetting().QuotaDisplayType
	oldDB := model.DB
	common.QuotaPerUnit = 500000
	operation_setting.GetGeneralSetting().QuotaDisplayType = operation_setting.QuotaDisplayTypeUSD

	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	require.NoError(t, err)
	require.NoError(t, db.AutoMigrate(&model.User{}))
	model.DB = db
	t.Cleanup(func() {
		common.QuotaPerUnit = oldQuotaPerUnit
		operation_setting.GetGeneralSetting().QuotaDisplayType = oldDisplayType
		model.DB = oldDB
		sqlDB, dbErr := db.DB()
		if dbErr == nil {
			require.NoError(t, sqlDB.Close())
		}
	})

	require.NoError(t, model.DB.Create(&model.User{
		Id:       42,
		Username: "topup_capacity_user",
		Quota:    common.MaxWalletQuota - 100_000,
		Status:   common.UserStatusEnabled,
	}).Error)

	gin.SetMode(gin.TestMode)
	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	ctx.Set("id", 42)
	ctx.Request = httptest.NewRequest(
		http.MethodPost,
		"/api/user/amount",
		strings.NewReader(`{"amount":1}`),
	)
	ctx.Request.Header.Set("Content-Type", "application/json")

	RequestAmount(ctx)

	assert.Equal(t, http.StatusOK, recorder.Code)
	assert.JSONEq(t, `{"message":"error","data":"Top-up quota limit exceeded","message_key":"Top-up quota limit exceeded"}`, recorder.Body.String())
}

func TestValidateCreditedQuotaRejectsOverflow(t *testing.T) {
	_, err := validateCreditedQuota(decimal.NewFromInt(int64(common.MaxWalletQuota / 2)))
	require.NoError(t, err)
	_, err = validateCreditedQuota(decimal.Zero)
	require.EqualError(t, err, "Top-up quota must be greater than 0")
	_, err = validateCreditedQuota(decimal.NewFromInt(common.MaxWalletQuota + 1))
	require.EqualError(
		t,
		err,
		"Top-up quota exceeds the range the system can represent",
	)
}

func TestStripeCreditedQuotaIncludesGroupRatio(t *testing.T) {
	oldQuotaPerUnit := common.QuotaPerUnit
	oldTopupGroupRatio := common.TopupGroupRatio2JSONString()
	common.QuotaPerUnit = 500000
	require.NoError(t, common.UpdateTopupGroupRatioByJSONString(`{"vip":2}`))
	t.Cleanup(func() {
		common.QuotaPerUnit = oldQuotaPerUnit
		require.NoError(t, common.UpdateTopupGroupRatioByJSONString(oldTopupGroupRatio))
	})

	_, err := validateCreditedQuota(getStripeCreditedQuota(2147, "vip"))
	require.NoError(t, err)
	_, err = validateCreditedQuota(getStripeCreditedQuota(2148, "vip"))
	require.NoError(t, err)
	_, err = validateCreditedQuota(getStripeCreditedQuota(int64(common.MaxWalletQuota), "vip"))
	require.Error(t, err)

	require.NoError(t, common.UpdateTopupGroupRatioByJSONString(`{"free":0}`))
	assert.True(t, decimal.NewFromInt(500000).Equal(getStripeCreditedQuota(1, "free")))
}

// setupStripeTopUpTest uses a real SQLite wallet and a local Stripe HTTP endpoint.
func setupStripeTopUpTest(t *testing.T) <-chan url.Values {
	t.Helper()
	oldDB, oldLogDB := model.DB, model.LOG_DB
	oldMainType, oldLogType := common.MainDatabaseType(), common.LogDatabaseType()
	oldRedis, oldBatch := common.RedisEnabled, common.BatchUpdateEnabled
	oldPrice, oldQuota := operation_setting.Price, common.QuotaPerUnit
	oldDisplay := operation_setting.GetGeneralSetting().QuotaDisplayType
	oldDiscount := operation_setting.GetPaymentSetting().AmountDiscount
	oldRatio := common.TopupGroupRatio2JSONString()
	oldSecret, oldPriceID, oldCnyID := setting.StripeApiSecret, setting.StripePriceId, setting.StripeCnyPriceId
	oldWebhookSecret := setting.StripeWebhookSecret
	oldMin, oldCnyMin, oldUnit := setting.StripeMinTopUp, setting.StripeCnyMinTopUp, setting.StripeUnitPrice
	oldPromotion := setting.StripePromotionCodesEnabled
	oldBackend, oldKey := stripe.GetBackend(stripe.APIBackend), stripe.Key
	t.Cleanup(func() {
		model.DB, model.LOG_DB = oldDB, oldLogDB
		common.SetDatabaseTypes(oldMainType, oldLogType)
		common.RedisEnabled, common.BatchUpdateEnabled = oldRedis, oldBatch
		operation_setting.Price, common.QuotaPerUnit = oldPrice, oldQuota
		operation_setting.GetGeneralSetting().QuotaDisplayType = oldDisplay
		operation_setting.GetPaymentSetting().AmountDiscount = oldDiscount
		require.NoError(t, common.UpdateTopupGroupRatioByJSONString(oldRatio))
		setting.StripeApiSecret, setting.StripePriceId, setting.StripeCnyPriceId = oldSecret, oldPriceID, oldCnyID
		setting.StripeWebhookSecret = oldWebhookSecret
		setting.StripeMinTopUp, setting.StripeCnyMinTopUp, setting.StripeUnitPrice = oldMin, oldCnyMin, oldUnit
		setting.StripePromotionCodesEnabled = oldPromotion
		stripe.SetBackend(stripe.APIBackend, oldBackend)
		stripe.Key = oldKey
	})
	initModelListColumnNames(t)
	common.SetDatabaseTypes(common.DatabaseTypeSQLite, common.DatabaseTypeSQLite)
	common.RedisEnabled, common.BatchUpdateEnabled = false, false
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	require.NoError(t, err)
	sqlDB, err := db.DB()
	require.NoError(t, err)
	sqlDB.SetMaxOpenConns(1)
	t.Cleanup(func() { require.NoError(t, sqlDB.Close()) })
	model.DB, model.LOG_DB = db, db
	require.NoError(t, db.AutoMigrate(&model.User{}, &model.TopUp{}, &model.Log{}))
	require.NoError(t, db.Create(&model.User{Id: 42, Username: "stripe-cny-test", Group: "default", Status: common.UserStatusEnabled}).Error)
	operation_setting.Price, common.QuotaPerUnit = 7.3, 500000
	operation_setting.GetGeneralSetting().QuotaDisplayType = operation_setting.QuotaDisplayTypeUSD
	operation_setting.GetPaymentSetting().AmountDiscount = map[int]float64{50: 0.8}
	require.NoError(t, common.UpdateTopupGroupRatioByJSONString(`{"default":1,"vip":1.5,"free":0}`))
	setting.StripeApiSecret, setting.StripePriceId, setting.StripeCnyPriceId = "sk_test_fixture", "price_usd_fixture", "price_cny_fixture"
	// CNY top-up requires the same Stripe enablement as the webhook
	setting.StripeWebhookSecret = "whsec_test_fixture"
	confirmPaymentComplianceForTest(t)
	setting.StripeMinTopUp, setting.StripeCnyMinTopUp, setting.StripeUnitPrice = 1, 10, 8
	setting.StripePromotionCodesEnabled = false
	requests := make(chan url.Values, 16)
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		assert.Equal(t, "/v1/checkout/sessions", r.URL.Path)
		assert.NoError(t, r.ParseForm())
		requests <- r.PostForm
		w.Header().Set("Content-Type", "application/json")
		_, err := w.Write([]byte(`{"id":"cs_test_fixture","url":"https://checkout.stripe.com/test_fixture"}`))
		assert.NoError(t, err)
	}))
	t.Cleanup(server.Close)
	stripe.SetBackend(stripe.APIBackend, stripe.GetBackendWithConfig(stripe.APIBackend, &stripe.BackendConfig{
		URL: stripe.String(server.URL), HTTPClient: server.Client(), MaxNetworkRetries: stripe.Int64(0),
	}))
	return requests
}

func requestStripeTopUpForTest(t *testing.T, endpoint, body string) *httptest.ResponseRecorder {
	t.Helper()
	gin.SetMode(gin.TestMode)
	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	ctx.Set("id", 42)
	ctx.Request = httptest.NewRequest(http.MethodPost, "/api/user/stripe/"+endpoint, strings.NewReader(body))
	ctx.Request.Header.Set("Content-Type", "application/json")
	if endpoint == "pay" {
		RequestStripePay(ctx)
	} else {
		RequestStripeAmount(ctx)
	}
	require.Equal(t, http.StatusOK, recorder.Code)
	return recorder
}

func TestStripeCnyTopUpOrderAndCheckout(t *testing.T) {
	requests := setupStripeTopUpTest(t)
	for _, tc := range []struct {
		name, group, currency, display, method string
		amount                                 int64
		money                                  float64
		quotaProduct                           string
		quota                                  int
	}{
		{"10 yuan", "default", "cny", operation_setting.QuotaDisplayTypeUSD, "", 10, 1.36986301369863, "684931.506849315", 684932},
		{"50 yuan", "default", "CNY", operation_setting.QuotaDisplayTypeUSD, "stripe", 50, 6.8493150684931505, "3424657.53424657525", 3424658},
		{"200 yuan", "default", "cny", operation_setting.QuotaDisplayTypeUSD, "stripe_cny", 200, 27.397260273972602, "13698630.136986301", 13698630},
		{"500 yuan", "default", "cny", operation_setting.QuotaDisplayTypeUSD, "", 500, 68.4931506849315, "34246575.34246575", 34246575},
		{"group ratio", "vip", "cny", operation_setting.QuotaDisplayTypeUSD, "", 50, 10.273972602739725, "5136986.3013698625", 5136986},
		{"token display and zero ratio fallback", "free", "cny", operation_setting.QuotaDisplayTypeTokens, "", 10, 1.36986301369863, "684931.506849315", 684932},
		{"maximum yuan", "default", "cny", operation_setting.QuotaDisplayTypeUSD, "", 70000, 9589.04109589041, "4794520547.945205", 4794520548},
	} {
		t.Run(tc.name, func(t *testing.T) {
			operation_setting.GetGeneralSetting().QuotaDisplayType = tc.display
			require.NoError(t, model.DB.Model(&model.User{}).Where("id = ?", 42).Update("group", tc.group).Error)
			body := fmt.Sprintf(`{"amount":%d,"currency":%q,"payment_method":%q}`, tc.amount, tc.currency, tc.method)
			preview := requestStripeTopUpForTest(t, "amount", body)
			assert.JSONEq(t, fmt.Sprintf(`{"message":"success","data":"%d.00"}`, tc.amount), preview.Body.String())
			payment := requestStripeTopUpForTest(t, "pay", body)
			require.JSONEq(t, `{"message":"success","data":{"pay_link":"https://checkout.stripe.com/test_fixture"}}`, payment.Body.String())
			var form url.Values
			select {
			case form = <-requests:
			default:
				t.Fatal("Stripe Checkout was not requested")
			}
			assert.Equal(t, "price_cny_fixture", form.Get("line_items[0][price]"))
			assert.Equal(t, strconv.FormatInt(tc.amount, 10), form.Get("line_items[0][quantity]"))
			assert.Equal(t, "false", form.Get("managed_payments[enabled]"))
			assert.Equal(t, "web", form.Get("payment_method_options[wechat_pay][client]"))
			assert.Equal(t, "payment", form.Get("mode"))
			order := model.GetTopUpByTradeNo(form.Get("client_reference_id"))
			require.NotNil(t, order)
			assert.Equal(t, tc.amount, order.Amount)
			assert.Equal(t, tc.money, order.Money)
			assert.Equal(t, model.PaymentMethodStripeCny, order.PaymentMethod)
			assert.Equal(t, model.PaymentProviderStripe, order.PaymentProvider)
			assert.Equal(t, common.TopUpStatusPending, order.Status)
			product := decimal.NewFromFloat(order.Money).Mul(decimal.NewFromFloat(common.QuotaPerUnit))
			assert.Equal(t, tc.quotaProduct, product.String())
			quota, err := common.WalletQuotaFromDecimalStrict(product)
			require.NoError(t, err)
			assert.Equal(t, tc.quota, quota)
		})
	}
}

func TestStripeTopUpCurrencyValidation(t *testing.T) {
	requests := setupStripeTopUpTest(t)
	for _, tc := range []struct {
		name, currency, priceID, wantKey string
		amount                           int64
		rate                             float64
	}{
		{"below minimum", "cny", "price_cny_fixture", "Top-up amount cannot be less than {{min}}", 9, 7.3},
		{"over maximum", "cny", "price_cny_fixture", "Top-up amount cannot exceed {{max}}", 70001, 7.3},
		{"unknown currency", "eur", "price_cny_fixture", "Unsupported currency", 50, 7.3},
		{"missing CNY price", "cny", "", "CNY payment is not enabled", 50, 7.3},
		{"zero rate", "cny", "price_cny_fixture", "CNY payment is not enabled", 50, 0},
		{"negative rate", "cny", "price_cny_fixture", "CNY payment is not enabled", 50, -7.3},
	} {
		t.Run(tc.name, func(t *testing.T) {
			setting.StripeCnyPriceId, operation_setting.Price = tc.priceID, tc.rate
			for _, endpoint := range []string{"amount", "pay"} {
				response := requestStripeTopUpForTest(t, endpoint, fmt.Sprintf(`{"amount":%d,"currency":%q,"payment_method":"stripe"}`, tc.amount, tc.currency))
				var result map[string]any
				require.NoError(t, common.Unmarshal(response.Body.Bytes(), &result))
				assert.Equal(t, tc.wantKey, result["message_key"])
			}
			var count int64
			require.NoError(t, model.DB.Model(&model.TopUp{}).Count(&count).Error)
			assert.Zero(t, count)
			assert.Empty(t, requests)
		})
	}
}

// A CNY order must only start when the Stripe webhook can fulfil it: the
// webhook requires the full Stripe setup, including the USD price ID.
func TestStripeCnyRequiresStripeWebhookEnablement(t *testing.T) {
	requests := setupStripeTopUpTest(t)
	setting.StripePriceId = ""

	response := requestStripeTopUpForTest(t, "pay", `{"amount":50,"currency":"cny","payment_method":"stripe"}`)

	var result map[string]any
	require.NoError(t, common.Unmarshal(response.Body.Bytes(), &result))
	assert.Equal(t, "CNY payment is not enabled", result["message_key"])
	var count int64
	require.NoError(t, model.DB.Model(&model.TopUp{}).Count(&count).Error)
	assert.Zero(t, count)
	assert.Empty(t, requests)
}

func TestStripeCnyRejectsInvalidCreditedQuota(t *testing.T) {
	requests := setupStripeTopUpTest(t)
	for _, tc := range []struct {
		name    string
		rate    float64
		balance int
		wantKey string
	}{
		{"converted credit overflows wallet", 7.3, common.MaxWalletQuota - 684930, "Top-up quota limit exceeded"},
		{"converted credit exceeds domain", 0.000000000001, 0, "Top-up quota exceeds the range the system can represent"},
	} {
		t.Run(tc.name, func(t *testing.T) {
			operation_setting.Price = tc.rate
			require.NoError(t, model.DB.Model(&model.User{}).Where("id = ?", 42).Update("quota", tc.balance).Error)
			for _, endpoint := range []string{"amount", "pay"} {
				response := requestStripeTopUpForTest(t, endpoint, `{"amount":10,"currency":"cny"}`)
				var result map[string]any
				require.NoError(t, common.Unmarshal(response.Body.Bytes(), &result))
				assert.Equal(t, tc.wantKey, result["message_key"])
			}
			var count int64
			require.NoError(t, model.DB.Model(&model.TopUp{}).Count(&count).Error)
			assert.Zero(t, count)
			assert.Empty(t, requests)
		})
	}
}

func TestStripeUsdTopUpRegression(t *testing.T) {
	requests := setupStripeTopUpTest(t)
	require.NoError(t, model.DB.Model(&model.User{}).Where("id = ?", 42).Update("group", "vip").Error)
	for _, currency := range []string{"", `,"currency":"usd"`, `,"currency":"USD"`} {
		body := `{"amount":50,"payment_method":"stripe"` + currency + `}`
		preview := requestStripeTopUpForTest(t, "amount", body)
		assert.JSONEq(t, `{"message":"success","data":"480.00"}`, preview.Body.String())
		payment := requestStripeTopUpForTest(t, "pay", body)
		require.JSONEq(t, `{"message":"success","data":{"pay_link":"https://checkout.stripe.com/test_fixture"}}`, payment.Body.String())
		var form url.Values
		select {
		case form = <-requests:
		default:
			t.Fatal("Stripe Checkout was not requested")
		}
		assert.Equal(t, "price_usd_fixture", form.Get("line_items[0][price]"))
		assert.Equal(t, "50", form.Get("line_items[0][quantity]"))
		assert.Equal(t, "false", form.Get("managed_payments[enabled]"))
		assert.Empty(t, form.Get("payment_method_options[wechat_pay][client]"))
		order := model.GetTopUpByTradeNo(form.Get("client_reference_id"))
		require.NotNil(t, order)
		assert.Equal(t, int64(50), order.Amount)
		assert.Equal(t, float64(75), order.Money)
		assert.Equal(t, model.PaymentMethodStripe, order.PaymentMethod)
		assert.Equal(t, model.PaymentProviderStripe, order.PaymentProvider)
	}
}
