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
import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

import { CopyButton } from '@/components/copy-button'
import { Button } from '@/components/ui/button'

import { BRAND_BASE_URL } from './constants'
import { useTopUpRate } from './home-seo'
import { StickerHeadline } from './sticker-headline'

interface BrandHeroProps {
  isAuthenticated: boolean
  modelCount: number
}

export function BrandHero(props: BrandHeroProps) {
  const { t } = useTranslation()
  const rate = useTopUpRate()
  // H1 carries the primary keyword; the sticker line carries the brand promise

  return (
    <header className='mh-hero'>
      <div className='mh-wrap mh-hero-main'>
        <div className='mh-meta mh-stage'>
          <span>Model Hub / API Gateway</span>
          <span>
            <b>● {t('All systems running')}</b>
          </span>
          <span>OpenAI + Anthropic</span>
        </div>
        <span className='mh-tag mh-stage mh-d1'>
          <i />
          <span>
            {t('{{count}} models live · free credits on sign-up', {
              count: props.modelCount,
            })}
          </span>
        </span>

        <div className='mh-hero-grid'>
          <div className='mh-stage mh-d1'>
            <StickerHeadline />
            <p className='mh-sh-sub'>
              {t('One key for Claude, DeepSeek and')}{' '}
              <span className='mh-sh-chip'>
                {t('{{count}} models', { count: props.modelCount })}
              </span>
            </p>
            <p className='mh-sh-promise'>
              <span className='mh-sh-yen' aria-hidden>
                ¥
              </span>
              {t('Whatever price you need, we have it!')}
            </p>
          </div>

          <div className='mh-side'>
            <p className='mh-lede mh-stage mh-d2'>
              {t(
                'Model Hub is an affordable AI model API gateway. One base URL and one API key give you Claude, DeepSeek and {{count}} models in total, in the OpenAI or Anthropic format. Pay per token, with free credits when you sign up.',
                { count: props.modelCount }
              )}
            </p>
            <div className='mh-row mh-stage mh-d3'>
              <Button
                className='mh-btn'
                render={
                  <Link
                    to={props.isAuthenticated ? '/dashboard' : '/sign-up'}
                  />
                }
              >
                {props.isAuthenticated ? t('Open console') : t('Sign up free')}
                <span className='mh-ar'>→</span>
              </Button>
              <Button
                variant='outline'
                className='mh-btn mh-ghost'
                render={<Link to='/pricing' />}
              >
                {t('Models & pricing')}
                <span className='mh-ar'>→</span>
              </Button>
              <div className='mh-url'>
                <span>base_url</span>
                <span>{BRAND_BASE_URL.replace('https://', '')}</span>
                <CopyButton
                  value={BRAND_BASE_URL}
                  className='mh-copy'
                  aria-label={t('Copy base URL')}
                />
              </div>
            </div>
          </div>
        </div>

        <div className='mh-spacer' />

        <div className='mh-cells mh-stage mh-d4'>
          <div className='mh-cell'>
            <span className='mh-n'>01 / {t('Affordable')}</span>
            <h3>{t('Pay only for the tokens you use')}</h3>
            <p>
              {t(
                "Billed per token, with every model's price listed publicly. Top-ups convert at ¥{{rate}} per $1 of credit.",
                { rate }
              )}
            </p>
            <code>tokens × price / model</code>
          </div>
          <div className='mh-cell'>
            <span className='mh-n'>02 / {t('Free credits')}</span>
            <h3>{t('Free credits when you sign up')}</h3>
            <p>
              {t(
                'New accounts get free trial credits, and we run regular credit promotions and top-up bonuses.'
              )}
            </p>
            <code>sign up → free credits → first request</code>
          </div>
          <div className='mh-cell'>
            <span className='mh-n'>03 / {t('Easy to use')}</span>
            <h3>{t('Works with the code you already have')}</h3>
            <p>
              {t(
                'OpenAI and Anthropic compatible, with automatic retries across upstream routes. Plug it into Claude Code, Cursor or Cherry Studio.'
              )}
            </p>
            <code>/v1/chat/completions · /v1/messages</code>
          </div>
        </div>
      </div>
    </header>
  )
}
