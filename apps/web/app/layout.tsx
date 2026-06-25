import type { Metadata } from "next"
import "./globals.css"
import Sidebar from "@/components/Sidebar"

export const metadata: Metadata = {
  title: "MyBrain",
  description: "Gamified Productivity Dashboard",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-6 overflow-y-auto" style={{ maxHeight: "100vh" }}>
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
