const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'

export interface LeaderboardEntry {
  id: number
  name: string
  total_courses: number
  completed_courses: number
  total_modules_passed: number
  rank: number
}

export interface LeaderboardResponse {
  leaderboard: LeaderboardEntry[]
  current_user: LeaderboardEntry | null
}

export class LeaderboardService {
  static async getLeaderboard(): Promise<LeaderboardResponse> {
    const response = await fetch(`${API_URL}/api/leaderboard/`, {
      method: 'GET',
      credentials: 'include', // Include cookies for authentication
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to fetch leaderboard')
    }

    return response.json()
  }
}
