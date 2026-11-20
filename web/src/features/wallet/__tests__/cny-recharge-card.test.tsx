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
import { fireEvent, render, screen } from '@testing-library/react'
import { createInstance } from 'i18next'
import { I18nextProvider, initReactI18next } from 'react-i18next'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import en from '@/i18n/locales/en.json'

import { CnyRechargeCard } from '../components/cny-recharge-card'

const i18n = createInstance()

beforeEach(async () => {
  await i18n.use(initReactI18next).init({
    lng: 'en',
    fallbackLng: false,
    nsSeparator: false,
    resources: { en },
    interpolation: { escapeValue: false },
  })
})

function renderCard(onPay = vi.fn(), groupRatio = 1) {
  render(
    <I18nextProvider i18n={i18n}>
      <CnyRechargeCard
        minTopup={10}
        rate={7.3}
        groupRatio={groupRatio}
        processing={false}
        onPay={onPay}
        redemptionCode=''
        onRedemptionCodeChange={vi.fn()}
        onRedeem={vi.fn()}
        redeeming={false}
      />
    </I18nextProvider>
  )
  return onPay
}

describe('CnyRechargeCard', () => {
  it('pays the default ¥50 preset when nothing is changed', () => {
    const onPay = renderCard()

    fireEvent.click(screen.getByRole('button', { name: /Pay ¥50/ }))

    expect(onPay).toHaveBeenCalledWith(50)
  })

  it('pays the selected preset when another preset is chosen', () => {
    const onPay = renderCard()

    fireEvent.click(
      screen.getByRole('button', { name: /¥200/, pressed: false })
    )
    fireEvent.click(screen.getByRole('button', { name: /Pay ¥200/ }))

    expect(onPay).toHaveBeenCalledWith(200)
  })

  it('blocks a custom amount below the minimum and allows a valid one', () => {
    const onPay = renderCard()
    const input = screen.getByLabelText('Custom Amount')

    fireEvent.change(input, { target: { value: '9' } })
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByRole('button', { name: /^Pay ¥/ })).toBeDisabled()

    fireEvent.change(input, { target: { value: '88' } })
    fireEvent.click(screen.getByRole('button', { name: /Pay ¥88/ }))
    expect(onPay).toHaveBeenCalledWith(88)
  })

  it('rejects decimal and exponent input instead of truncating it', () => {
    renderCard()
    const input = screen.getByLabelText('Custom Amount')

    for (const value of ['50.9', '50e2']) {
      fireEvent.change(input, { target: { value } })
      expect(input).toHaveAttribute('aria-invalid', 'true')
      expect(screen.getByRole('button', { name: /^Pay ¥/ })).toBeDisabled()
    }
  })

  it('applies the top-up group ratio to the credit shown', () => {
    renderCard(vi.fn(), 0.5)

    // ¥50 at ¥7.3 per $1 and group ratio 0.5 adds $3.42 of credit
    expect(screen.getAllByText(/3\.42/).length).toBeGreaterThan(0)
  })
})
