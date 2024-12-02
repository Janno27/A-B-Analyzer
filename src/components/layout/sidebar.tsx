import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  BarChart2,
  Blocks,
  BookOpen,
  FlaskConical,
  History,
  LayoutDashboard,
  Library,
  PlugZap,
  ScrollText,
  Settings,
  Star,
  Trello,
  TimerIcon,
} from "lucide-react"

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname()

  return (
    <div className={cn("pb-12", className)}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold">Platform</h2>
          <div className="space-y-1">
            <Link href="/playground">
              <Button variant="ghost" className="w-full justify-start">
                <FlaskConical className="mr-2 h-4 w-4" />
                Playground
              </Button>
            </Link>
            <Link href="/playground/overview">
              <Button variant="ghost" className="w-full justify-start pl-8">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Overview
              </Button>
            </Link>
            <Link href="/playground/initialization">
              <Button variant="ghost" className="w-full justify-start pl-8">
                <ScrollText className="mr-2 h-4 w-4" />
                Initialization
              </Button>
            </Link>
            <Link href="/playground/kanban">
              <Button variant="ghost" className="w-full justify-start pl-8">
                <Trello className="mr-2 h-4 w-4" />
                Kanban
              </Button>
            </Link>
            <Link href="/playground/roadmap">
              <Button variant="ghost" className="w-full justify-start pl-8">
                <TimerIcon className="mr-2 h-4 w-4" />
                Roadmap
              </Button>
            </Link>
            <Link href="/playground/analyzer">
              <Button variant="ghost" className="w-full justify-start pl-8">
                <BarChart2 className="mr-2 h-4 w-4" />
                A/B Test Analyzer
              </Button>
            </Link>
          </div>
        </div>
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold">Tools</h2>
          <div className="space-y-1">
            <Link href="/library">
              <Button variant="ghost" className="w-full justify-start">
                <Library className="mr-2 h-4 w-4" />
                Library
              </Button>
            </Link>
            <Link href="/documentation">
              <Button variant="ghost" className="w-full justify-start">
                <BookOpen className="mr-2 h-4 w-4" />
                Documentation
              </Button>
            </Link>
            <Link href="/integration">
              <Button variant="ghost" className="w-full justify-start">
                <PlugZap className="mr-2 h-4 w-4" />
                Integration
              </Button>
            </Link>
            <Link href="/settings">
              <Button variant="ghost" className="w-full justify-start">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Button>
            </Link>
          </div>
        </div>
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold">Projects</h2>
          <div className="space-y-1">
            <Button variant="ghost" className="w-full justify-start">
              <Blocks className="mr-2 h-4 w-4" />
              Active Tests
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}