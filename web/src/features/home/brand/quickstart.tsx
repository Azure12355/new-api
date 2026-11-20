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
import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { AnimateInView } from '@/components/animate-in-view'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { BRAND_BASE_URL } from './constants'

const ORIGIN = BRAND_BASE_URL.replace(/\/v1$/, '')

function k(text: string) {
  return <span className='c-k'>{text}</span>
}
function s(text: string) {
  return <span className='c-s'>{text}</span>
}
function p(text: string) {
  return <span className='c-p'>{text}</span>
}

export function Quickstart() {
  const { t } = useTranslation()
  const [step, setStep] = useState(0)
  const [lang, setLang] = useState('Python')

  const snippets: Record<string, ReactNode> = {
    Python: (
      <>
        {k('from')} openai {k('import')} OpenAI{'\n\n'}client = OpenAI({'\n'}
        {'    '}base_url={s(`"${BRAND_BASE_URL}"`)},{'\n'}
        {'    '}api_key={s('"sk-..."')}, {p('# Model Hub key')}
        {'\n)\n\n'}resp = client.chat.completions.create({'\n'}
        {'    '}model={s('"claude-sonnet-5"')},{'\n'}
        {'    '}messages=[{'{'}
        {s('"role"')}: {s('"user"')}, {s('"content"')}: {s('"Hello"')}
        {'}'}],{'\n)\n'}
        {k('print')}(resp.choices[0].message.content)
      </>
    ),
    'Node.js': (
      <>
        {k('import')} OpenAI {k('from')} {s('"openai"')};{'\n\n'}
        {k('const')} client = {k('new')} OpenAI({'{\n'}
        {'  '}baseURL: {s(`"${BRAND_BASE_URL}"`)},{'\n'}
        {'  '}apiKey: process.env.MODEL_HUB_KEY,{'\n});\n\n'}
        {k('const')} resp = {k('await')} client.chat.completions.create({'{\n'}
        {'  '}model: {s('"deepseek-v4-pro"')},{'\n'}
        {'  '}messages: [{'{'} role: {s('"user"')}, content: {s('"Hello"')}{' '}
        {'}'}],{'\n});'}
      </>
    ),
    'Claude Code': (
      <>
        {p(t('# ~/.zshrc or ~/.bashrc'))}
        {'\n'}
        {k('export')} ANTHROPIC_BASE_URL={s(`"${ORIGIN}"`)}
        {'\n'}
        {k('export')} ANTHROPIC_AUTH_TOKEN={s('"sk-..."')}
        {'\n'}
        {k('export')} ANTHROPIC_MODEL={s('"claude-opus-5-5"')}
        {'\n\n'}claude
      </>
    ),
    cURL: (
      <>
        {k('curl')} {BRAND_BASE_URL}/messages \{'\n  '}
        {p('-H')} {s('"x-api-key: $MODEL_HUB_KEY"')} \{'\n  '}
        {p('-H')} {s('"anthropic-version: 2023-06-01"')} \{'\n  '}
        {p('-H')} {s('"content-type: application/json"')} \{'\n  '}
        {p('-d')}{' '}
        {s(
          `'{"model":"claude-opus-5-5","max_tokens":512,\n       "messages":[{"role":"user","content":"Hello"}]}'`
        )}
      </>
    ),
  }

  const steps = [
    {
      title: t('Sign up and create a key'),
      body: t('Open the console and create an API key on the Tokens page.'),
    },
    {
      title: t('Swap the base URL'),
      body: t('Point your client or SDK at {{url}}.', { url: BRAND_BASE_URL }),
    },
    {
      title: t('Pick a model and call it'),
      body: t('Choose a model ID from the model square and pass it as model.'),
    },
  ]

  return (
    <section className='mh-sec'>
      <div className='mh-wrap'>
        <AnimateInView>
          <span className='mh-kicker'>{t('Quickstart')}</span>
          <h2 className='mh-h2'>
            {t('Five-minute setup: Python, Node.js, Claude Code and cURL')}
          </h2>
        </AnimateInView>
        <AnimateInView className='mh-steps' delay={120}>
          <div className='mh-step-list'>
            {steps.map((item, i) => (
              <button
                key={item.title}
                type='button'
                className='mh-step'
                data-on={step === i}
                aria-pressed={step === i}
                onPointerEnter={() => setStep(i)}
                onFocus={() => setStep(i)}
              >
                <span className='mh-n'>{String(i + 1).padStart(2, '0')}</span>
                <span>
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </span>
              </button>
            ))}
          </div>
          <div className='mh-codebox'>
            <Tabs value={lang} onValueChange={(v) => setLang(String(v))}>
              <TabsList className='mh-tabs'>
                {Object.keys(snippets).map((name) => (
                  <TabsTrigger key={name} value={name}>
                    {name}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <pre>
              <code key={lang} className='landing-animate-fade-in block'>
                {snippets[lang]}
              </code>
            </pre>
          </div>
        </AnimateInView>
      </div>
    </section>
  )
}
