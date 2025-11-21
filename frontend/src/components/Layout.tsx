import { Outlet, Link } from 'react-router-dom'
import { Button } from './ui/button'
import { GraduationCap, BookOpen, LogIn } from 'lucide-react'

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="fixed w-full bg-white">
        <nav className="flex items-center justify-between p-4">
          <Button asChild variant="ghost">
            <Link to="/">
              <GraduationCap className="size-5" />
              <span className="text-lg font-medium">Cogni.lol</span>
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link to="/courses">
                <BookOpen className="size-4" />
                Courses
              </Link>
            </Button>
            <Button variant="outline" asChild className="rounded-full">
              <Link to="/login">
                <LogIn className="size-4" />
                Login
              </Link>
            </Button>
          </div>
        </nav>
      </header>

      <main className="bg-slate-100 flex-1 min-h-screen mt-18 pt-6">
        <Outlet />
      </main>
    </div>
  )
}
