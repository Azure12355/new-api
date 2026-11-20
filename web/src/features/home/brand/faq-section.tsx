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
import { useTranslation } from 'react-i18next'

import { AnimateInView } from '@/components/animate-in-view'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

import type { HomeFaqItem } from './home-seo'

interface FaqSectionProps {
  items: HomeFaqItem[]
}

/**
 * FAQ with every answer kept in the DOM (`keepMounted` + `hiddenUntilFound`),
 * so crawlers and in-page search can read collapsed answers.
 */
export function FaqSection(props: FaqSectionProps) {
  const { t } = useTranslation()

  return (
    <section className='mh-sec' id='faq' aria-labelledby='mh-faq-title'>
      <div className='mh-wrap mh-faq'>
        <AnimateInView className='mh-faq-head'>
          <span className='mh-kicker'>FAQ</span>
          <h2 id='mh-faq-title' className='mh-h2'>
            {t('Frequently asked questions')}
          </h2>
          <p className='mh-lede'>
            {t(
              'Pricing, free credits, supported models and how to connect your tools.'
            )}
          </p>
        </AnimateInView>
        <Accordion className='mh-faq-list' defaultValue={[0]}>
          {props.items.map((item, i) => (
            <AccordionItem
              key={item.question}
              value={i}
              className='mh-faq-item'
            >
              <AccordionTrigger className='mh-faq-q'>
                <span className='mh-faq-n'>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className='mh-faq-qt'>{item.question}</span>
              </AccordionTrigger>
              <AccordionContent
                keepMounted
                hiddenUntilFound
                className='mh-faq-a'
              >
                <p>{item.answer}</p>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}
