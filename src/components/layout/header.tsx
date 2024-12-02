"use client"

import { ChevronRight, HomeIcon } from "lucide-react"
import { usePathname } from "next/navigation"
import Link from "next/link"

export function Header() {
  const pathname = usePathname()
  const segments = pathname.split('/').filter(Boolean)

  const getBreadcrumbs = () => {
    return segments.map((segment, index) => {
      const path = `/${segments.slice(0, index + 1).join('/')}`
      const title = segment.charAt(0).toUpperCase() + segment.slice(1)
      
      return {
        title,
        path,
        isLast: index === segments.length - 1
      }
    })
  }

  const breadcrumbs = getBreadcrumbs()

  return (
    <div className="flex items-center px-4 py-4 border-b">
      <div className="flex items-center text-sm text-muted-foreground">
        <Link href="/" className="hover:text-primary transition-colors">
          <HomeIcon className="h-4 w-4" />
        </Link>
        {breadcrumbs.map((breadcrumb, index) => (
          <div key={breadcrumb.path} className="flex items-center">
            <ChevronRight className="h-4 w-4 mx-2" />
            {breadcrumb.isLast ? (
              <span className="text-foreground font-medium">{breadcrumb.title}</span>
            ) : (
              <Link
                href={breadcrumb.path}
                className="hover:text-primary transition-colors"
              >
                {breadcrumb.title}
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
