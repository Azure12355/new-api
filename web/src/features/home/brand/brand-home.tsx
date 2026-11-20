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
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { AnimateInView } from '@/components/animate-in-view'
import { Button } from '@/components/ui/button'
import { usePricingData } from '@/features/pricing/hooks/use-pricing-data'

import { BrandHero } from './brand-hero'
import { CLIENTS, FALLBACK_MODELS } from './constants'
import { FaqSection } from './faq-section'
import { useHomeFaq, useHomeSeo } from './home-seo'
import { ModelsSection } from './models-section'
import { PixelSky } from './pixel-sky'
import { Quickstart } from './quickstart'
import { SwitchDemo } from './switch-demo'

interface BrandHomeProps {
  isAuthenticated: boolean
}

/** Model Hub home page body. Render inside `.dark.mh-home` (see styles/brand-home.css). */
export function BrandHome(props: BrandHomeProps) {
  const { t } = useTranslation()
  const [ready, setReady] = useState(false)
  const pricing = usePricingData()

  const faq = useHomeFaq()
  useHomeSeo(faq)

  // the table features Claude and DeepSeek (FALLBACK_MODELS order); the
  // heading and link use the full live count from the model square
  const { featured, total } = useMemo(() => {
    const live = new Map(
      pricing.models.map((m) => [m.model_name, m.vendor_name || '—'])
    )
    if (live.size === 0) {
      return { featured: FALLBACK_MODELS, total: FALLBACK_MODELS.length }
    }
    const picked = FALLBACK_MODELS.filter((m) => live.has(m.id)).map((m) => ({
      id: m.id,
      vendor: live.get(m.id) || m.vendor,
    }))
    return {
      featured: picked.length > 0 ? picked : FALLBACK_MODELS,
      total: live.size,
    }
  }, [pricing.models])

  // two frames so the hero's entrance transitions start from their hidden state
  useEffect(() => {
    let inner = 0
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => setReady(true))
    })
    return () => {
      cancelAnimationFrame(outer)
      cancelAnimationFrame(inner)
    }
  }, [])

  return (
    <>
      <PixelSky />
      <div className='mh-cols' aria-hidden>
        {Array.from({ length: 12 }, (_, i) => (
          <i key={i} />
        ))}
      </div>

      <main className={ready ? 'mh-page mh-ready' : 'mh-page'}>
        <BrandHero isAuthenticated={props.isAuthenticated} modelCount={total} />
        <ModelsSection models={featured} total={total} />
        <SwitchDemo />
        <Quickstart />

        <section className='mh-sec'>
          <div className='mh-wrap'>
            <AnimateInView>
              <span className='mh-kicker'>{t('Works with')}</span>
              <h2 className='mh-h2'>
                {t('Use it in Claude Code, Cursor, Cherry Studio and more')}
              </h2>
              <p className='mh-lede'>
                {t(
                  'Any tool or SDK that accepts a custom base URL and API key can connect to Model Hub.'
                )}
              </p>
            </AnimateInView>
            <div className='mh-clients'>
              {CLIENTS.map((c, i) => (
                <AnimateInView
                  key={c.name}
                  className='mh-client'
                  delay={i * 60}
                >
                  {c.name}
                  <span>{c.kind}</span>
                </AnimateInView>
              ))}
            </div>
          </div>
        </section>

        <FaqSection items={faq} />

        <section className='mh-final'>
          <AnimateInView className='mh-wrap'>
            <span className='mh-kicker'>{t('Start')}</span>
            <h2 className='mh-h2'>
              {t("Try the world's best models, starting with free credits")}
            </h2>
            <p className='mh-lede'>
              {t(
                'Sign up to get free credits and an API key. Top up when you need more, and pay only for what you use.'
              )}
            </p>
            <div className='mh-row'>
              <Button
                className='mh-btn'
                render={
                  <Link to={props.isAuthenticated ? '/keys' : '/sign-up'} />
                }
              >
                {props.isAuthenticated ? t('Create a key') : t('Sign up free')}
                <span className='mh-ar'>→</span>
              </Button>
              <Button
                variant='outline'
                className='mh-btn mh-ghost'
                render={<Link to='/dashboard' />}
              >
                {t('Open console')}
                <span className='mh-ar'>→</span>
              </Button>
            </div>
          </AnimateInView>
        </section>
      </main>
    </>
  )
}
