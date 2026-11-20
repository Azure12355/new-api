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
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { PixelWordmark } from '@/components/pixel-wordmark'
import { FALLBACK_MODELS } from '@/features/home/brand/constants'
import { PixelSky } from '@/features/home/brand/pixel-sky'
import { StickerHeadline } from '@/features/home/brand/sticker-headline'

/** Models shown in the ticker; the highlighted row moves every few seconds. */
const TICKER_MODELS = FALLBACK_MODELS.filter((m) =>
  [
    'claude-opus-5-5',
    'claude-sonnet-5',
    'claude-haiku-4-5-20251001',
    'deepseek-v4-pro',
  ].includes(m.id)
)

interface AuthBrandPanelProps {
  systemName: string
  logo: string
}

/**
 * Left half of the sign-in / sign-up screens (desktop only): the home page's
 * interactive pixel waves, the stacked-sticker headline and the main
 * selling points. Always rendered in the dark brand palette.
 */
export function AuthBrandPanel(props: AuthBrandPanelProps) {
  const { t } = useTranslation()
  const [ready, setReady] = useState(false)
  const [active, setActive] = useState(0)

  useEffect(() => {
    const raf = requestAnimationFrame(() => setReady(true))
    const reduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches
    const id = reduced
      ? 0
      : window.setInterval(
          () => setActive((i) => (i + 1) % TICKER_MODELS.length),
          2600
        )
    return () => {
      cancelAnimationFrame(raf)
      window.clearInterval(id)
    }
  }, [])

  return (
    <aside className='dark mh-home mh-auth-art'>
      <PixelSky contained />
      <div className='mh-auth-cols' aria-hidden>
        {Array.from({ length: 8 }, (_, i) => (
          <i key={i} />
        ))}
      </div>

      <div className={ready ? 'mh-auth-inner mh-ready' : 'mh-auth-inner'}>
        <Link to='/' className='mh-auth-brand'>
          {props.logo && <img src={props.logo} alt='' />}
          <PixelWordmark text={props.systemName} scale={3} />
        </Link>

        <div className='mh-auth-copy'>
          <span className='mh-kicker'>Model Hub / API Gateway</span>
          <StickerHeadline as='p' size='panel' />
          <ul className='mh-auth-points'>
            <li>{t('Free credits when you sign up')}</li>
            <li>{t('Pay only for the tokens you use')}</li>
            <li>{t('Works with the code you already have')}</li>
          </ul>
        </div>

        <div className='mh-auth-ticker' aria-hidden>
          <div className='mh-auth-ticker-bar'>
            <span className='mh-sq3'>
              <i />
              <i />
              <i />
            </span>
            <span>POST /v1/chat/completions</span>
            <span className='mh-auth-ticker-live'>stream: true</span>
          </div>
          {TICKER_MODELS.map((m, i) => (
            <div
              key={m.id}
              className='mh-auth-ticker-row'
              data-active={i === active}
            >
              <span className='mh-auth-ticker-id'>{m.id}</span>
              <span className='mh-auth-ticker-vendor'>{m.vendor}</span>
              <span className='mh-auth-ticker-state'>
                {i === active ? '200 OK' : 'ready'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  )
}
