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

import { AnimateInView } from '@/components/animate-in-view'
import { Button } from '@/components/ui/button'

interface ModelsSectionProps {
  /** Featured models shown in the table. */
  models: Array<{ id: string; vendor: string }>
  /** Number of models available in total (model square). */
  total: number
}

export function ModelsSection(props: ModelsSectionProps) {
  const { t } = useTranslation()

  return (
    <section className='mh-sec'>
      <div className='mh-wrap'>
        <div className='mh-sec-head'>
          <AnimateInView>
            <span className='mh-kicker'>{t('Models')}</span>
            <h2 className='mh-h2'>
              {t('Claude, DeepSeek and {{count}} models in one API', {
                count: props.total,
              })}
            </h2>
            <p className='mh-lede'>
              {t(
                'Popular models are listed below. Input and output prices for every model are on the model square.'
              )}
            </p>
          </AnimateInView>
          <Button
            variant='outline'
            className='mh-btn mh-ghost'
            render={<Link to='/pricing' />}
          >
            {t('See all {{count}} models and prices', { count: props.total })}
            <span className='mh-ar'>→</span>
          </Button>
        </div>
        <div className='mh-mtable'>
          {props.models.map((m, i) => (
            <AnimateInView key={m.id} className='mh-mrow' delay={(i % 2) * 80}>
              <span className='mh-i'>{String(i + 1).padStart(2, '0')}</span>
              <span className='mh-id' title={m.id}>
                {m.id}
              </span>
              <span className='mh-p'>
                <i aria-hidden />
                {m.vendor}
              </span>
            </AnimateInView>
          ))}
        </div>
      </div>
    </section>
  )
}
