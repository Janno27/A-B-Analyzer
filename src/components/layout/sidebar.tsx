import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { UserNav } from "./user-nav"
import {
  BarChart2,
  Blocks,
  BookOpen,
  FlaskConical,
  LayoutDashboard,
  Library,
  PlugZap,
  ScrollText,
  Settings,
  Trello,
  Clock,
} from "lucide-react"

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname()

  return (
    <div className={cn("relative pb-12 h-full", className)}>
      <div className="space-y-4 py-4 h-[calc(100%-64px)]">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">Platform</h2>
          <div className="space-y-1">
            <Button asChild variant={pathname === "/playground" ? "secondary" : "ghost"} className="w-full justify-start">
              <Link href="/playground">
                <FlaskConical className="mr-2 h-4 w-4" />
                Playground
              </Link>
            </Button>
            <Button asChild variant={pathname === "/playground/overview" ? "secondary" : "ghost"} className="w-full justify-start pl-8">
              <Link href="/playground/overview">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Overview
              </Link>
            </Button>
            <Button asChild variant={pathname === "/playground/initialization" ? "secondary" : "ghost"} className="w-full justify-start pl-8">
              <Link href="/playground/initialization">
                <ScrollText className="mr-2 h-4 w-4" />
                Initialization
              </Link>
            </Button>
            <Button asChild variant={pathname === "/playground/kanban" ? "secondary" : "ghost"} className="w-full justify-start pl-8">
              <Link href="/playground/kanban">
                <Trello className="mr-2 h-4 w-4" />
                Kanban
              </Link>
            </Button>
            <Button asChild variant={pathname === "/playground/roadmap" ? "secondary" : "ghost"} className="w-full justify-start pl-8">
              <Link href="/playground/roadmap">
                <Clock className="mr-2 h-4 w-4" />
                Roadmap
              </Link>
            </Button>
            <Button asChild variant={pathname === "/playground/analyzer" ? "secondary" : "ghost"} className="w-full justify-start pl-8">
              <Link href="/playground/analyzer">
                <BarChart2 className="mr-2 h-4 w-4" />
                A/B Test Analyzer
              </Link>
            </Button>
          </div>
        </div>

        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">Tools</h2>
          <div className="space-y-1">
            <Button asChild variant={pathname === "/library" ? "secondary" : "ghost"} className="w-full justify-start">
              <Link href="/library">
                <Library className="mr-2 h-4 w-4" />
                Library
              </Link>
            </Button>
            <Button asChild variant={pathname === "/documentation" ? "secondary" : "ghost"} className="w-full justify-start">
              <Link href="/documentation">
                <BookOpen className="mr-2 h-4 w-4" />
                Documentation
              </Link>
            </Button>
            <Button asChild variant={pathname === "/integration" ? "secondary" : "ghost"} className="w-full justify-start">
              <Link href="/integration">
                <PlugZap className="mr-2 h-4 w-4" />
                Integration
              </Link>
            </Button>
            <Button asChild variant={pathname === "/settings" ? "secondary" : "ghost"} className="w-full justify-start">
              <Link href="/settings">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Link>
            </Button>
          </div>
        </div>

        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">Projects</h2>
          <div className="space-y-1">
            <Button variant="ghost" className="w-full justify-start">
              <Blocks className="mr-2 h-4 w-4" />
              Active Tests
            </Button>
          </div>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <UserNav />
            <div>
              <p className="text-sm font-medium">Username</p>
              <p className="text-xs text-muted-foreground">user@example.com</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}