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
import { Gift, Loader2, Receipt, WalletCards } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { IconBadge } from '@/components/ui/icon-badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TitledCard } from '@/components/ui/titled-card'
import { toIntlLocale } from '@/i18n/languages'
import { formatCurrencyFromUSD } from '@/lib/currency'
import { formatNumber } from '@/lib/format'
import { cn } from '@/lib/utils'

import { CNY_PRESET_AMOUNTS } from '../constants'

const PAYMENT_BADGES = ['Alipay', 'WeChat Pay', 'Bank card'] as const

interface CnyRechargeCardProps {
  /** Minimum top-up in yuan (from /api/user/topup/info). */
  minTopup: number
  /** Yuan paid per $1 of credit (from /api/user/topup/info). */
  rate: number
  /** The user's top-up group multiplier (from /api/user/topup/info). */
  groupRatio: number
  processing: boolean
  /** Starts a Stripe CNY checkout for this many yuan. */
  onPay: (yuan: number) => void
  onSwitchToUsd?: () => void
  onOpenBilling?: () => void
  redemptionCode: string
  onRedemptionCodeChange: (code: string) => void
  onRedeem: () => void
  redeeming: boolean
}

/**
 * Model Hub top-up card for Chinese-language users: whole-yuan amounts paid
 * through Stripe in CNY (Alipay, WeChat Pay or card). The credit added is
 * yuan ÷ rate dollars, the same rate the backend uses when it creates the
 * order.
 */
export function CnyRechargeCard(props: CnyRechargeCardProps) {
  const { t, i18n } = useTranslation()
  const locale = toIntlLocale(i18n.resolvedLanguage || i18n.language)
  const [yuan, setYuan] = useState<number>(CNY_PRESET_AMOUNTS[1])
  const [customInput, setCustomInput] = useState('')

  // whole yuan only: digits, no decimals or exponent notation
  const trimmedInput = customInput.trim()
  const usingCustom = trimmedInput !== ''
  let amount: number = yuan
  if (usingCustom) {
    amount = /^\d+$/.test(trimmedInput) ? Number(trimmedInput) : Number.NaN
  }
  const valid =
    Number.isInteger(amount) && amount >= props.minTopup && amount <= 70000
  // same conversion the backend uses for the order: yuan ÷ rate × group ratio
  const creditFor = (value: number) =>
    props.rate > 0 ? (value / props.rate) * props.groupRatio : 0
  const creditUsd = valid ? creditFor(amount) : 0

  return (
    <TitledCard
      title={t('Top up in CNY')}
      description={t('Pay with Alipay, WeChat Pay or a bank card')}
      icon={<WalletCards className='h-4 w-4' />}
      iconTone='success'
      disableHoverEffect
      action={
        props.onOpenBilling ? (
          <Button
            variant='outline'
            size='sm'
            onClick={props.onOpenBilling}
            className='w-full gap-2 sm:w-auto'
          >
            <Receipt className='h-4 w-4' />
            {t('Order History')}
          </Button>
        ) : null
      }
      contentClassName='space-y-5 sm:space-y-6'
    >
      <div className='space-y-2.5 sm:space-y-3'>
        <Label className='text-muted-foreground text-xs font-medium tracking-wider uppercase'>
          {t('Amount')}
        </Label>
        <div className='grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-4'>
          {CNY_PRESET_AMOUNTS.map((preset) => {
            const selected = !usingCustom && yuan === preset
            return (
              <Button
                key={preset}
                variant='outline'
                aria-pressed={selected}
                className={cn(
                  'flex min-h-[76px] flex-col items-start gap-1 px-4 py-3 text-left whitespace-normal',
                  selected
                    ? 'border-primary bg-primary/10 dark:bg-primary/20'
                    : 'border-muted'
                )}
                onClick={() => {
                  setYuan(preset)
                  setCustomInput('')
                }}
              >
                <span className='text-xl font-bold'>
                  ¥{formatNumber(preset, locale)}
                </span>
                <span className='text-muted-foreground text-xs'>
                  {t('Credit added: {{credit}}', {
                    credit: formatCurrencyFromUSD(creditFor(preset)),
                  })}
                </span>
              </Button>
            )
          })}
        </div>
      </div>

      <div className='space-y-2.5 sm:space-y-3'>
        <Label
          htmlFor='cny-topup-amount'
          className='text-muted-foreground text-xs font-medium tracking-wider uppercase'
        >
          {t('Custom Amount')}
        </Label>
        <div className='relative'>
          <span className='text-muted-foreground pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-base'>
            ¥
          </span>
          <Input
            id='cny-topup-amount'
            type='number'
            inputMode='numeric'
            min={props.minTopup}
            step={1}
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            placeholder={t('Minimum ¥{{amount}}, whole yuan', {
              amount: props.minTopup,
            })}
            aria-invalid={usingCustom && !valid}
            className='h-10 pl-7 text-base sm:text-lg'
          />
        </div>
        {usingCustom && !valid && (
          <p className='text-destructive text-xs'>
            {t('Enter a whole number of yuan, at least ¥{{amount}}', {
              amount: props.minTopup,
            })}
          </p>
        )}
      </div>

      <div className='bg-muted/30 grid gap-3 rounded-md border p-4 sm:grid-cols-[1fr_auto] sm:items-center'>
        <div className='space-y-1'>
          <div className='text-sm'>
            {t('You pay')}{' '}
            <span className='text-lg font-bold'>
              ¥{valid ? formatNumber(amount, locale) : '-'}
            </span>
            <span className='text-muted-foreground'>
              {' · '}
              {t('Credit added: {{credit}}', {
                credit: valid ? formatCurrencyFromUSD(creditUsd) : '-',
              })}
            </span>
          </div>
          <div className='flex flex-wrap gap-1.5'>
            {PAYMENT_BADGES.map((badge) => (
              <span
                key={badge}
                className='border-border text-muted-foreground border px-2 py-0.5 text-xs'
              >
                {t(badge)}
              </span>
            ))}
          </div>
        </div>
        <Button
          size='lg'
          disabled={!valid || props.processing}
          onClick={() => props.onPay(amount)}
          className='h-11 w-full gap-2 px-6 text-base font-semibold sm:w-auto'
        >
          {props.processing && <Loader2 className='h-4 w-4 animate-spin' />}
          {t('Pay ¥{{amount}}', {
            amount: valid ? formatNumber(amount, locale) : '-',
          })}
        </Button>
      </div>

      <p className='text-muted-foreground text-xs'>
        {t(
          'Rate: ¥{{rate}} = $1 credit. Prices on the model square are listed in the same credit.',
          { rate: props.rate }
        )}{' '}
        {props.onSwitchToUsd && (
          <button
            type='button'
            onClick={props.onSwitchToUsd}
            className='text-primary underline-offset-2 hover:underline'
          >
            {t('Pay in USD instead')}
          </button>
        )}
      </p>

      <div className='space-y-2.5 border-t pt-5 sm:space-y-3'>
        <div className='flex items-center gap-2'>
          <IconBadge tone='warning' size='xs'>
            <Gift />
          </IconBadge>
          <Label
            htmlFor='cny-redemption-code'
            className='text-muted-foreground text-xs font-medium tracking-wider uppercase'
          >
            {t('Have a Code?')}
          </Label>
        </div>
        <div className='flex gap-2'>
          <Input
            id='cny-redemption-code'
            value={props.redemptionCode}
            onChange={(e) => props.onRedemptionCodeChange(e.target.value)}
            placeholder={t('Enter your redemption code')}
            className='h-10'
          />
          <Button
            variant='outline'
            onClick={props.onRedeem}
            disabled={props.redeeming}
            className='h-10'
          >
            {props.redeeming && <Loader2 className='h-4 w-4 animate-spin' />}
            {t('Redeem')}
          </Button>
        </div>
      </div>
    </TitledCard>
  )
}
