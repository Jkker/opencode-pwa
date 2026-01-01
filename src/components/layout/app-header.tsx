import { Link, useRouter, useMatches } from '@tanstack/react-router'
import { startCase } from 'lodash-es'
import { Fragment, useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'

import { AppUserMenu } from './app-user-menu'

export function AppHeader() {
  const router = useRouter()
  const matches = useMatches()
  const { t } = useTranslation('routes')

  const pathname = router.state.location.pathname

  const breadcrumbItems = useMemo(() => {
    const pathSegments = pathname.split('/').filter(Boolean)
    const items = [
      {
        path: '/',
        label: t('/', { defaultValue: 'Home' }),
        isLast: pathSegments.length === 0,
      },
    ]

    for (const [index, segment] of pathSegments.entries()) {
      const path = `/${pathSegments.slice(0, index + 1).join('/')}`
      const isLast = index === pathSegments.length - 1
      items.push({
        path,
        label: t(path, { defaultValue: startCase(segment) }),
        isLast,
      })
    }

    return items
  }, [pathname, t])

  if (matches.some((match) => match.status === 'pending')) return null

  return (
    <header className="acrylic flex sticky h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height) top-0">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            {breadcrumbItems.map(({ path, label, isLast }, index) => (
              <Fragment key={path}>
                <BreadcrumbItem>
                  {isLast ? (
                    <BreadcrumbPage>{label}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink render={<Link to={path} />}>{label}</BreadcrumbLink>
                  )}
                </BreadcrumbItem>
                {index < breadcrumbItems.length - 1 && <BreadcrumbSeparator />}
              </Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
        <div className="ml-auto flex items-center gap-2">
          <AppUserMenu />
        </div>
      </div>
    </header>
  )
}
