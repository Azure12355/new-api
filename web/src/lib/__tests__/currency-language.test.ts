/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
import i18next from 'i18next'
import { afterEach, expect, it } from 'vitest'

import { getSitePricingCurrency } from '@/features/model-pricing/currency'
import { formatCurrencyFromUSD } from '@/lib/currency'
import { mapStatusDataToConfig, syncPricingCurrency } from '@/lib/status-query'
import { usePricingPreferencesStore } from '@/stores/pricing-preferences-store'
import {
  DEFAULT_CURRENCY_CONFIG,
  useSystemConfigStore,
} from '@/stores/system-config-store'

afterEach(() => {
  usePricingPreferencesStore.getState().setCurrency('USD')
  useSystemConfigStore
    .getState()
    .setConfig({ currency: DEFAULT_CURRENCY_CONFIG })
})

it('keeps USD prices across languages and converts only on explicit currency selection', async () => {
  const stop = syncPricingCurrency()
  try {
    await i18next.init({ lng: 'zhCN', resources: {} })
    const status = { quota_display_type: 'CNY', usd_exchange_rate: 7.3 }
    useSystemConfigStore.getState().setConfig(mapStatusDataToConfig(status))
    expect(formatCurrencyFromUSD(4)).toContain('$4')
    expect(
      getSitePricingCurrency(useSystemConfigStore.getState().config.currency)
        ?.label
    ).toBe('CNY')
    usePricingPreferencesStore.getState().setCurrency('site')
    expect(formatCurrencyFromUSD(4)).toContain('¥29.2')
    await i18next.changeLanguage('en')
    useSystemConfigStore.getState().setConfig(mapStatusDataToConfig(status))
    expect(formatCurrencyFromUSD(4)).toContain('¥29.2')
    usePricingPreferencesStore.getState().setCurrency('USD')
    expect(formatCurrencyFromUSD(20)).toContain('$20')
  } finally {
    stop()
  }
})
