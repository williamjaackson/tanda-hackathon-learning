import { Button } from '@/components/ui/button'
import { UserPlus } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <>
    <div className="grid md:grid-cols-2 p-6">
      <div className="flex flex-col justify-around">
        <div className="grid gap-4">
          <h1 className="mt-4 font-bold text-blackys text-4xl md:text-8xl leading-none">Study Smarter<br />with <span className="underline">Cogni</span>.lol</h1>
          <p className="text-muted-foreground text-xl mb-4">Learn faster. Remember longer. Study smarter. Achieve more.</p>
        </div>
        <div className="grid gap-4">
          <Button size="lg" className="w-fit" variant="yellow">
            <UserPlus className="size-4" />
            Join for free
          </Button>
          <span className="text-muted-foreground text-sm">Already have an account? <Link to="/login">Login</Link></span>
        </div>
      </div>
      <img src="https://as1.ftcdn.net/v2/jpg/02/95/95/40/1000_F_295954097_M5rS7QVO801luSnfLpKE4uIxI4jLvVF8.jpg" alt="Cogni.lol" className="w-full h-full object-cover shadow-yellow-500/50 shadow-xl rounded-2xl" />
    </div>
    </>
  );
}
