import type { Metadata } from "next"
import "./globals.css"
import Sidebar from "@/components/Sidebar"
import StreakBar from "@/components/StreakBar"

export const metadata: Metadata = {
  title: "MyBrain",
  description: "Gamified Productivity Dashboard",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="flex h-screen">
          <Sidebar />
          <div className="flex-1 flex flex-col overflow-hidden">
            <StreakBar />
            <main className="flex-1 p-6 overflow-y-auto">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  )
}
