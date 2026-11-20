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
import { PublicLayout } from '@/components/layout'

import { PixelSky } from './pixel-sky'
import { useBrandDarkDocument } from './use-brand-dark-document'

interface BrandPublicLayoutProps {
  children: React.ReactNode
  /** Pass false when the page renders its own full-bleed layout. */
  showMainContainer?: boolean
  /** Pixel-wave background; off for pages that embed an iframe. */
  sky?: boolean
}

/** PublicLayout in the Model Hub brand: deep blue, pixel waves, 12-column grid. */
export function BrandPublicLayout(props: BrandPublicLayoutProps) {
  useBrandDarkDocument()
  const sky = props.sky !== false

  return (
    <div className='dark mh-home mh-brand-page'>
      <PublicLayout
        showMainContainer={props.showMainContainer}
        showThemeSwitch={false}
      >
        {sky && <PixelSky />}
        {sky && (
          <div className='mh-cols' aria-hidden>
            {Array.from({ length: 12 }, (_, i) => (
              <i key={i} />
            ))}
          </div>
        )}
        <div className='mh-brand-content'>{props.children}</div>
      </PublicLayout>
    </div>
  )
}
