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
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import { formatCurrencyFromUSD } from '@/lib/currency'
import {
  displayTypeForLanguage,
  syncCurrencyWithLanguage,
} from '@/lib/status-query'
import {
  DEFAULT_CURRENCY_CONFIG,
  useSystemConfigStore,
} from '@/stores/system-config-store'

let stopSync: () => void
beforeAll(() => {
  stopSync = syncCurrencyWithLanguage()
})
afterAll(() => stopSync())

afterEach(async () => {
  useSystemConfigStore.getState().setConfig({
    currency: { ...DEFAULT_CURRENCY_CONFIG },
  })
  await i18next.changeLanguage('en')
})

describe('displayTypeForLanguage', () => {
  it.each([
    ['CNY', 'zhCN', 'CNY'],
    ['CNY', 'zhTW', 'CNY'],
    ['CNY', 'en', 'USD'],
    ['CNY', 'ja', 'USD'],
    ['CNY', undefined, 'USD'],
    ['USD', 'zhCN', 'USD'],
    ['TOKENS', 'en', 'TOKENS'],
    ['CUSTOM', 'en', 'CUSTOM'],
  ] as const)('site %s in language %s shows %s', (site, language, shown) => {
    expect(displayTypeForLanguage(site, language)).toBe(shown)
  })
})

describe('language switch on a CNY site', () => {
  it('shows ¥ in Chinese and $ in English for the same balance', async () => {
    await i18next.init({ lng: 'zhCN', resources: {} })
    useSystemConfigStore.getState().setConfig({
      currency: {
        ...DEFAULT_CURRENCY_CONFIG,
        displayInCurrency: true,
        quotaDisplayType: 'CNY',
        siteQuotaDisplayType: 'CNY',
        usdExchangeRate: 7.3,
      },
    })
    expect(formatCurrencyFromUSD(10)).toContain('¥')
    expect(formatCurrencyFromUSD(10)).toContain('73')

    await i18next.changeLanguage('en')
    expect(
      useSystemConfigStore.getState().config.currency.quotaDisplayType
    ).toBe('USD')
    expect(formatCurrencyFromUSD(10)).toContain('$10')

    await i18next.changeLanguage('zhCN')
    expect(
      useSystemConfigStore.getState().config.currency.quotaDisplayType
    ).toBe('CNY')
  })
})
