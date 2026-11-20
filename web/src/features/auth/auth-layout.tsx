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

import { PixelWordmark } from '@/components/pixel-wordmark'
import { Skeleton } from '@/components/ui/skeleton'
import { useSystemConfig } from '@/hooks/use-system-config'

import { AuthBrandPanel } from './components/auth-brand-panel'

type AuthLayoutProps = {
  children: React.ReactNode
}

/**
 * Model Hub auth screens: brand panel with pixel waves on the left (lg+),
 * the form on the right. Below lg only the form column is shown.
 */
export function AuthLayout({ children }: AuthLayoutProps) {
  const { t } = useTranslation()
  const { systemName, logo, loading } = useSystemConfig()

  return (
    <div className='mh-auth'>
      <AuthBrandPanel systemName={systemName} logo={logo} />

      <div className='mh-auth-main'>
        <div className='mh-auth-top'>
          <Link to='/' className='mh-auth-mobile-brand'>
            {loading ? (
              <Skeleton className='h-8 w-32' />
            ) : (
              <>
                <img src={logo} alt={t('Logo')} />
                <PixelWordmark text={systemName} scale={2} />
              </>
            )}
          </Link>
          <Link to='/' className='mh-auth-back'>
            <span aria-hidden>←</span> {t('Back to Home')}
          </Link>
        </div>

        <div className='mh-auth-body'>
          <span className='mh-auth-pixels' aria-hidden />
          {children}
        </div>

        <div className='mh-auth-foot'>
          <span>
            © {new Date().getFullYear()} {systemName}
          </span>
          <span>OpenAI + Anthropic</span>
        </div>
      </div>
    </div>
  )
}
