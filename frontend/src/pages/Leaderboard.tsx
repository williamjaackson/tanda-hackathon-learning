import { useState, useEffect } from 'react'
import { Trophy, Medal, Award, Star, BookOpen, CheckCircle2, Loader2 } from 'lucide-react'
import { LeaderboardService } from '@/services/leaderboard'
import type { LeaderboardEntry, LeaderboardResponse } from '@/services/leaderboard'
import { useAuth } from '@/contexts/AuthContext'

export default function Leaderboard() {
  const { user } = useAuth()
  const [data, setData] = useState<LeaderboardResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const leaderboardData = await LeaderboardService.getLeaderboard()
        setData(leaderboardData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load leaderboard')
      } finally {
        setIsLoading(false)
      }
    }

    fetchLeaderboard()
  }, [])

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="size-8 text-yellow-500" />
      case 2:
        return <Medal className="size-8 text-gray-400" />
      case 3:
        return <Medal className="size-8 text-orange-600" />
      default:
        return <Award className="size-6 text-slate-400" />
    }
  }

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white'
      case 2:
        return 'bg-gradient-to-r from-gray-300 to-gray-500 text-white'
      case 3:
        return 'bg-gradient-to-r from-orange-400 to-orange-600 text-white'
      default:
        return 'bg-slate-100 text-slate-700'
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-yellow-50 to-white flex items-center justify-center">
        <Loader2 className="size-12 animate-spin text-yellow-600" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-yellow-50 to-white">
        <div className="container mx-auto max-w-6xl px-4 py-8">
          <div className="text-center py-12">
            <p className="text-red-600">{error || 'Failed to load leaderboard'}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-yellow-50 to-white">
      <div className="container mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Trophy className="size-12 text-yellow-500" />
            <h1 className="text-5xl font-bold">Leaderboard</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Compete with fellow learners and track your progress
          </p>
        </div>

        {/* Current User Card */}
        {data.current_user && (
          <div className="bg-gradient-to-r from-yellow-400 to-orange-400 border-2 border-yellow-500 rounded-3xl p-6 mb-8">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                {getRankIcon(data.current_user.rank)}
                <div>
                  <p className="text-sm font-semibold text-white/80">Your Rank</p>
                  <h3 className="text-3xl font-bold text-white">#{data.current_user.rank}</h3>
                </div>
              </div>
              <div className="flex gap-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-white">{data.current_user.completed_courses}</p>
                  <p className="text-sm text-white/80">Completed Courses</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-white">{data.current_user.total_modules_passed}</p>
                  <p className="text-sm text-white/80">Modules Passed</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-white">{data.current_user.total_courses}</p>
                  <p className="text-sm text-white/80">Total Courses</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Leaderboard Table */}
        <div className="bg-white border-2 border-slate-200 rounded-3xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b-2 border-slate-200">
                  <th className="px-6 py-4 text-left text-sm font-bold">Rank</th>
                  <th className="px-6 py-4 text-left text-sm font-bold">User</th>
                  <th className="px-6 py-4 text-center text-sm font-bold">
                    <div className="flex items-center justify-center gap-2">
                      <CheckCircle2 className="size-4" />
                      Completed Courses
                    </div>
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-bold">
                    <div className="flex items-center justify-center gap-2">
                      <Star className="size-4" />
                      Modules Passed
                    </div>
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-bold">
                    <div className="flex items-center justify-center gap-2">
                      <BookOpen className="size-4" />
                      Total Courses
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.leaderboard.map((entry) => (
                  <tr
                    key={entry.id}
                    className={`border-b border-slate-100 ${
                      entry.id === user?.id ? 'bg-yellow-50' : 'hover:bg-slate-50'
                    } transition-colors`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {getRankIcon(entry.rank)}
                        <span className={`px-3 py-1 rounded-full font-bold text-sm ${getRankBadge(entry.rank)}`}>
                          #{entry.rank}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-lg">{entry.name}</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-2xl font-bold text-green-600">{entry.completed_courses}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-2xl font-bold text-blue-600">{entry.total_modules_passed}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-xl font-semibold text-slate-600">{entry.total_courses}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {data.leaderboard.length === 0 && (
            <div className="text-center py-12">
              <Trophy className="size-16 text-slate-300 mx-auto mb-4" />
              <p className="text-muted-foreground text-lg">No users on the leaderboard yet</p>
              <p className="text-muted-foreground">Be the first to complete a course!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
