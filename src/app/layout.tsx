import { Inter } from "next/font/google"
import { cn } from "@/lib/utils"
import { Sidebar } from "@/components/layout/sidebar"
import "@/styles/globals.css"

const inter = Inter({ subsets: ["latin"] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={cn("min-h-screen bg-background font-sans antialiased", inter.className)}>
        <div className="flex min-h-screen">
          <div className="hidden lg:block lg:w-72 lg:border-r">
            <div className="h-full py-6">
              <Sidebar />
            </div>
          </div>
          <div className="flex-1">
            <main className="h-full">{children}</main>
          </div>
        </div>
      </body>
    </html>
  )
}