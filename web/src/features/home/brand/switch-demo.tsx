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
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { AnimateInView } from '@/components/animate-in-view'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { BRAND_BASE_URL, DEMO_MODELS } from './constants'

const SCRAMBLE_CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789-'

/**
 * Live-looking request/response pair: the model ID scrambles into the next
 * one every few seconds and the reply streams in token by token.
 */
export function SwitchDemo() {
  const { t, i18n } = useTranslation()
  const rootRef = useRef<HTMLDivElement>(null)
  const [seen, setSeen] = useState(false)
  const [current, setCurrent] = useState(0)
  const [shownName, setShownName] = useState(DEMO_MODELS[0])
  const [typed, setTyped] = useState(0)
  const [cycle, setCycle] = useState(0)
  const isZh = (i18n.resolvedLanguage || i18n.language).startsWith('zh')
  const reduced =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const model = DEMO_MODELS[current]
  const reply = t(
    "Hi! I'm {{model}}, answering through Model Hub. Change only the model parameter to switch between models.",
    { model }
  )

  // start once the console scrolls into view
  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        setSeen(true)
        io.disconnect()
      },
      { threshold: 0.3 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  // advance to the next model every 7s; a manual pick restarts the timer
  useEffect(() => {
    if (!seen || reduced) return
    const id = window.setInterval(
      () => setCurrent((c) => (c + 1) % DEMO_MODELS.length),
      7000
    )
    return () => window.clearInterval(id)
  }, [seen, reduced, cycle])

  // scramble the model name, then stream the reply
  useEffect(() => {
    if (!seen) return
    if (reduced) {
      setShownName(model)
      setTyped(Number.MAX_SAFE_INTEGER)
      return
    }
    let frame = 0
    let raf = 0
    const tick = () => {
      frame++
      setShownName(
        [...model]
          .map((c, i) =>
            i < (frame / 16) * model.length
              ? c
              : SCRAMBLE_CHARS[
                  Math.floor(Math.random() * SCRAMBLE_CHARS.length)
                ]
          )
          .join('')
      )
      if (frame < 16) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    setTyped(0)
    const step = isZh ? 1 : 2
    const typer = window.setInterval(() => setTyped((n) => n + step), 30)
    return () => {
      cancelAnimationFrame(raf)
      window.clearInterval(typer)
    }
  }, [seen, model, reduced, isZh])

  const visible = reply.slice(0, typed)
  const tokens = Math.max(1, Math.round(visible.length / (isZh ? 1.3 : 4)))

  return (
    <section className='mh-sec'>
      <div className='mh-wrap'>
        <AnimateInView>
          <span className='mh-kicker'>{t('Switch')}</span>
          <h2 className='mh-h2'>{t('Switch models with one parameter')}</h2>
          <p className='mh-lede'>
            {t(
              'Same URL, same key. Change model to another ID and nothing else in your code moves.'
            )}
          </p>
        </AnimateInView>
        <div ref={rootRef} className='mh-demo'>
          <div className='mh-demo-bar'>
            <div className='mh-sq3' aria-hidden>
              <i />
              <i />
              <i />
            </div>
            <Tabs
              value={String(current)}
              onValueChange={(v) => {
                setCurrent(Number(v))
                setCycle((c) => c + 1)
              }}
            >
              <TabsList className='mh-tabs'>
                {DEMO_MODELS.map((m, i) => (
                  <TabsTrigger key={m} value={String(i)}>
                    {m}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <span className='mh-note'>{t('Sample request')}</span>
          </div>
          <div className='mh-pane'>
            <h4>Request</h4>
            <div className='mh-code'>
              <span className='c-k'>curl</span> {BRAND_BASE_URL}
              /chat/completions \{'\n  '}
              <span className='c-p'>-H</span>{' '}
              <span className='c-s'>
                &quot;Authorization: Bearer $MODEL_HUB_KEY&quot;
              </span>{' '}
              \{'\n  '}
              <span className='c-p'>-H</span>{' '}
              <span className='c-s'>
                &quot;Content-Type: application/json&quot;
              </span>{' '}
              \{'\n  '}
              <span className='c-p'>-d</span>{' '}
              <span className='c-s'>
                {'\'{\n    "model": "'}
                <span className='c-m'>{seen ? shownName : model}</span>
                {
                  '",\n    "stream": true,\n    "messages": [{"role": "user", "content": "'
                }
                {t('Hello')}
                {'"}]\n  }\''}
              </span>
            </div>
          </div>
          <div className='mh-pane'>
            <h4>Streaming response</h4>
            <div className='mh-stream' aria-live='polite'>
              <span>{visible}</span>
              <span className='mh-caret' aria-hidden />
            </div>
            <div className='mh-chips'>
              <span className='mh-chip'>
                <i aria-hidden />
                200 OK
              </span>
              <span className='mh-chip'>stream: true</span>
              <span className='mh-chip'>{tokens} tokens</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
