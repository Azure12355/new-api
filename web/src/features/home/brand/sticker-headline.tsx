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

import { cn } from '@/lib/utils'

interface StickerHeadlineProps {
  /** h1 on the home page; p where the page already has its own heading. */
  as?: 'h1' | 'p'
  /** Smaller type for the auth side panel. */
  size?: 'hero' | 'panel'
  className?: string
}

/**
 * Brand headline in the sticker style: plain bold words, a tilted lavender
 * sticker with a hard purple shadow, a lavender keyword, and an orange tag
 * on the sticker (CSS ::before, so it is not part of the heading text).
 */
export function StickerHeadline(props: StickerHeadlineProps) {
  const { t, i18n } = useTranslation()
  const isZh = (i18n.resolvedLanguage || i18n.language).startsWith('zh')
  const Tag = props.as ?? 'h1'
  return (
    <Tag
      className={cn(
        'mh-sh',
        props.size === 'panel' && 'mh-sh-panel',
        props.className
      )}
      data-lang={isZh ? 'zh' : 'en'}
    >
      <span className='mh-sh-line'>
        <span className='mh-sh-plain'>{t('Affordable, easy')}</span>{' '}
        <span
          className='mh-sh-sticker'
          data-note={t('Free credits on sign-up!')}
        >
          {t('AI model API')}
        </span>
      </span>
      {/* keeps the two lines apart when the heading is read as text */}
      <span className='sr-only'>{isZh ? '，' : ' '}</span>
      <span className='mh-sh-line'>
        <span className='mh-sh-plain'>{t("Try the world's")}</span>{' '}
        <span className='mh-sh-color'>{t('best models')}</span>
      </span>
    </Tag>
  )
}
