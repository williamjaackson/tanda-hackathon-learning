import { Outlet, Link, useNavigate } from 'react-router-dom'
import { Button } from './ui/button'
import { GraduationCap, BookOpen, LogIn, LogOut, User } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

export default function Layout() {
  const { user, isAuthenticated, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = () => {
    signOut()
    navigate('/')
  }
  return (
    <div className="min-h-screen flex flex-col">
      <header className="fixed w-full bg-white z-[9999]">
        <nav className="flex items-center justify-between p-4">
          <Button asChild variant="ghost">
            <Link to="/">
              <GraduationCap className="size-5" />
              <span className="text-lg font-medium">Cogni.lol</span>
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <Button variant="ghost" asChild>
                <Link to="/courses">
                  <BookOpen className="size-4" />
                  Courses
                </Link>
              </Button>
            )}

            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-2 text-sm">
                  <User className="size-4 text-muted-foreground" />
                  <span className="font-medium">{user?.name}</span>
                </div>
                <Button variant="outline" onClick={handleSignOut} className="rounded-full">
                  <LogOut className="size-4" />
                  Sign out
                </Button>
              </div>
            ) : (
              <Button variant="outline" asChild className="rounded-full">
                <Link to="/login">
                  <LogIn className="size-4" />
                  Login
                </Link>
              </Button>
            )}
          </div>
        </nav>
      </header>

      <main className="bg-slate-100 flex-1 mt-18">
        <Outlet />
      </main>
    </div>
  )
}
