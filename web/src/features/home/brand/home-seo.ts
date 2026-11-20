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
import { useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { useStatus } from '@/hooks/use-status'

import { BRAND_BASE_URL } from './constants'

export type HomeFaqItem = { question: string; answer: string }

/** Top-up rate (CNY per $1 of credit) from /api/status, falling back to the configured 7.3. */
export function useTopUpRate(): number {
  const { status } = useStatus()
  const price = status?.price
  return typeof price === 'number' && price > 0 ? price : 7.3
}

/**
 * Home page FAQ. Rendered on the page and emitted as FAQPage JSON-LD, so the
 * visible text and the structured data always match. Claims here must stay
 * true for the live site (free credits and top-up rate are configured in the
 * admin console).
 */
export function useHomeFaq(): HomeFaqItem[] {
  const { t } = useTranslation()
  const rate = useTopUpRate()
  const origin = BRAND_BASE_URL.replace(/\/v1$/, '')

  return useMemo(
    () => [
      {
        question: t('What is Model Hub?'),
        answer: t(
          'Model Hub is an AI model API gateway. With one base URL and one API key you can call Claude, DeepSeek and other models, using either the OpenAI or the Anthropic request format. Keys, balance and usage are managed in one console.'
        ),
      },
      {
        question: t('How much does it cost?'),
        answer: t(
          'You pay per token, only for what you use. Input and output prices for every model are listed on the model square, and top-ups convert at ¥{{rate}} per $1 of credit.',
          { rate }
        ),
      },
      {
        question: t('Are there free credits?'),
        answer: t(
          'Yes. New accounts receive free trial credits for testing models and integrations, and we regularly run credit promotions and top-up bonuses. Check the console and site announcements for current offers.'
        ),
      },
      {
        question: t('Which models are supported?'),
        answer: t(
          'Claude Opus 5.5, Claude Opus 5, Claude Sonnet 5, Claude Haiku 4.5 and other Claude models, plus DeepSeek V4 Pro and DeepSeek Flash. The model square lists every available model with its price.'
        ),
      },
      {
        question: t('How do I use Model Hub with Claude Code?'),
        answer: t(
          'Set two environment variables, ANTHROPIC_BASE_URL={{origin}} and ANTHROPIC_AUTH_TOKEN=<your Model Hub key>, then run claude. You can also set ANTHROPIC_MODEL to pick a model.',
          { origin }
        ),
      },
      {
        question: t('Does it work with the OpenAI SDK?'),
        answer: t(
          'Yes. Set base_url to {{url}} and use your Model Hub key as api_key. The Anthropic /v1/messages format is supported too, so the Anthropic SDK works the same way.',
          { url: BRAND_BASE_URL }
        ),
      },
      {
        question: t('Can I use it in Cursor, Cherry Studio, LobeChat or Dify?'),
        answer: t(
          'Yes. Any tool that lets you set a custom base URL and API key works, including Cursor, Cline, Cherry Studio, LobeChat, Dify, n8n and LangChain.'
        ),
      },
      {
        question: t('Is streaming supported?'),
        answer: t(
          'Yes. Send stream: true and responses come back as server-sent events, the same as the official APIs.'
        ),
      },
      {
        question: t('How stable is the service?'),
        answer: t(
          'Each model is served by several upstream channels. If one channel returns an error, the request is retried on another one automatically.'
        ),
      },
      {
        question: t('Can I limit what an API key can spend?'),
        answer: t(
          'Yes. On the Tokens page you can give each key its own quota, expiry time and list of allowed models, so a shared or leaked key cannot overspend.'
        ),
      },
      {
        question: t('How do I get started?'),
        answer: t(
          "Sign up and create an API key in the console, change your client's base URL to {{url}}, then pick a model ID from the model square. Most people send their first request within five minutes.",
          { url: BRAND_BASE_URL }
        ),
      },
    ],
    [t, rate, origin]
  )
}

/**
 * Home page <head> metadata: title, description, canonical, hreflang,
 * Open Graph and JSON-LD (WebPage + FAQPage).
 *
 * main.tsx sets document.title to the system name once /api/status loads, so
 * this re-applies whenever status changes and restores the previous values
 * when the home page unmounts. Tags it creates carry `data-mh-seo`.
 */
export function useHomeSeo(faq: HomeFaqItem[]): void {
  const { t, i18n } = useTranslation()
  const { status } = useStatus()
  const isZh = (i18n.resolvedLanguage || i18n.language).startsWith('zh')
  const serverAddress = status?.server_address
  const origin = (
    typeof serverAddress === 'string' && serverAddress
      ? serverAddress
      : window.location.origin
  ).replace(/\/$/, '')

  const title = t('Affordable Claude API & DeepSeek API Gateway | Model Hub')
  const description = t(
    'Affordable AI API for Claude, DeepSeek and more. One OpenAI- and Anthropic-compatible base URL, works with Claude Code, pay per token, free credits at sign-up.'
  )
  const zhUrl = `${origin}/?lang=zh-CN`
  const enUrl = `${origin}/`
  const canonical = isZh ? zhUrl : enUrl

  const jsonLd = useMemo(
    () =>
      JSON.stringify({
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'WebPage',
            '@id': `${canonical}#webpage`,
            url: canonical,
            name: title,
            description,
            inLanguage: isZh ? 'zh-CN' : 'en',
            isPartOf: { '@id': `${origin}/#website` },
            about: { '@id': `${origin}/#organization` },
          },
          {
            '@type': 'FAQPage',
            '@id': `${canonical}#faq`,
            inLanguage: isZh ? 'zh-CN' : 'en',
            mainEntity: faq.map((item) => ({
              '@type': 'Question',
              name: item.question,
              acceptedAnswer: { '@type': 'Answer', text: item.answer },
            })),
          },
        ],
      }),
    [canonical, description, faq, isZh, origin, title]
  )

  useEffect(() => {
    const head = document.head
    const restore: Array<() => void> = []

    const prevTitle = document.title
    document.title = title
    restore.push(() => {
      document.title = prevTitle
    })

    const metas: Array<[string, string, string]> = [
      ['name', 'description', description],
      ['property', 'og:type', 'website'],
      ['property', 'og:site_name', 'Model Hub'],
      ['property', 'og:title', title],
      ['property', 'og:description', description],
      ['property', 'og:url', canonical],
      ['property', 'og:locale', isZh ? 'zh_CN' : 'en_US'],
      ['name', 'twitter:card', 'summary'],
      ['name', 'twitter:title', title],
      ['name', 'twitter:description', description],
    ]
    for (const [attr, key, content] of metas) {
      const existing = head.querySelector<HTMLMetaElement>(
        `meta[${attr}="${key}"]`
      )
      if (existing) {
        const prev = existing.getAttribute('content')
        existing.setAttribute('content', content)
        restore.push(() => {
          if (prev === null) existing.removeAttribute('content')
          else existing.setAttribute('content', prev)
        })
        continue
      }
      const el = document.createElement('meta')
      el.setAttribute(attr, key)
      el.setAttribute('content', content)
      el.dataset.mhSeo = ''
      head.appendChild(el)
    }

    const links: Array<[string, string, string | null]> = [
      ['canonical', canonical, null],
      ['alternate', zhUrl, 'zh-CN'],
      ['alternate', enUrl, 'en'],
      ['alternate', enUrl, 'x-default'],
    ]
    for (const [rel, href, hreflang] of links) {
      const el = document.createElement('link')
      el.rel = rel
      el.href = href
      if (hreflang) el.hreflang = hreflang
      el.dataset.mhSeo = ''
      head.appendChild(el)
    }

    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.textContent = jsonLd
    script.dataset.mhSeo = ''
    head.appendChild(script)

    return () => {
      head.querySelectorAll('[data-mh-seo]').forEach((el) => el.remove())
      restore.reverse().forEach((undo) => undo())
    }
  }, [canonical, description, enUrl, isZh, jsonLd, status, title, zhUrl])
}
