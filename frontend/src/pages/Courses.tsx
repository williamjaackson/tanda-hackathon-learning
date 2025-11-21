import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Plus, BookOpen, Sparkles, TrendingUp } from 'lucide-react'
import { Link } from 'react-router-dom'
import { CourseService } from '@/services/course'
import { TestService } from '@/services/test'
import type { Course } from '@/services/course'

export default function Courses() {
  const [courses, setCourses] = useState<Course[]>([])
  const [courseProgress, setCourseProgress] = useState<Record<number, { total: number; completed: number }>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setIsLoading(true)
        const data = await CourseService.getCourses()
        setCourses(data)

        // Fetch progress for each course
        const progressData: Record<number, { total: number; completed: number }> = {}
        await Promise.all(
          data.map(async (course) => {
            try {
              const status = await TestService.getTestStatus(course.id)
              const totalModules = course.modules?.length || 0
              const completedModules = status.passed_modules.length
              progressData[course.id] = { total: totalModules, completed: completedModules }
            } catch {
              progressData[course.id] = { total: course.modules?.length || 0, completed: 0 }
            }
          })
        )
        setCourseProgress(progressData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load courses')
      } finally {
        setIsLoading(false)
      }
    }

    fetchCourses()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-yellow-50 to-white">
      <div className="container mx-auto max-w-6xl px-4 py-12">
        {/* Header with Stats */}
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="size-6 text-yellow-500" />
            <span className="text-yellow-600 font-semibold">Your Learning Journey</span>
          </div>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h1 className="text-5xl font-bold mb-3">
                My <span className="text-yellow-500">Courses</span>
              </h1>
              <p className="text-muted-foreground text-lg">
                {courses.length === 0
                  ? 'Start your learning journey by creating your first course'
                  : `Keep up the momentum! You're doing great.`
                }
              </p>
            </div>
            <Button asChild size="lg" variant="yellow" className="text-lg px-8">
              <Link to="/courses/create">
                <Plus className="size-5 mr-2" />
                Create Course
              </Link>
            </Button>
          </div>

          {/* Stats Cards */}
          {courses.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
              <div className="bg-white border-2 border-yellow-200 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-yellow-100 p-3 rounded-xl">
                    <BookOpen className="size-6 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold">{courses.length}</p>
                    <p className="text-sm text-muted-foreground">Active Courses</p>
                  </div>
                </div>
              </div>
              <div className="bg-white border-2 border-green-200 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-green-100 p-3 rounded-xl">
                    <TrendingUp className="size-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold">
                      {Object.values(courseProgress).reduce((sum, p) => sum + p.completed, 0)}
                    </p>
                    <p className="text-sm text-muted-foreground">Modules Completed</p>
                  </div>
                </div>
              </div>
              <div className="bg-white border-2 border-blue-200 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-blue-100 p-3 rounded-xl">
                    <Sparkles className="size-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold">
                      {Object.values(courseProgress).filter(p => p.total > 0 && p.completed === p.total).length}
                    </p>
                    <p className="text-sm text-muted-foreground">Courses Mastered</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

      {isLoading && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading courses...</p>
        </div>
      )}

      {error && (
        <div className="text-center py-12">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {!isLoading && !error && courses.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => {
            const progress = courseProgress[course.id] || { total: 0, completed: 0 }
            const progressPercent = progress.total > 0 ? (progress.completed / progress.total) * 100 : 0
            const isCompleted = progress.total > 0 && progress.completed === progress.total

            return (
              <Link
                key={course.id}
                to={`/courses/${course.id}`}
                className="group bg-white border-2 border-slate-200 rounded-2xl p-6 block hover:-translate-y-2 transition-all hover:shadow-xl hover:border-yellow-300 relative overflow-hidden"
              >
                {/* Completion Badge */}
                {isCompleted && (
                  <div className="absolute top-4 right-4 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    ✓ Mastered
                  </div>
                )}

                {/* Course Icon */}
                <div className="mb-4">
                  <div className="p-4 bg-yellow-100 rounded-xl w-fit group-hover:scale-110 transition-transform">
                    <BookOpen className="size-8 text-yellow-600" />
                  </div>
                </div>

                {/* Course Info */}
                <div className="mb-4">
                  <div className="font-mono text-sm text-yellow-600 font-semibold mb-2">
                    {course.code}
                  </div>
                  <h3 className="font-bold text-xl mb-2 group-hover:text-yellow-600 transition-colors">
                    {course.name}
                  </h3>
                  {course.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {course.description}
                    </p>
                  )}
                </div>

                {/* Progress Bar */}
                {progress.total > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-muted-foreground">
                        Progress
                      </span>
                      <span className="text-sm font-bold">
                        {progress.completed}/{progress.total} modules
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isCompleted ? 'bg-green-500' : 'bg-yellow-500'
                        }`}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* CTA Button */}
                <Button
                  variant={isCompleted ? 'outline' : 'yellow'}
                  className="w-full group-hover:scale-105 transition-transform"
                  size="lg"
                >
                  {isCompleted ? 'Review Course' : progress.completed > 0 ? 'Continue Learning' : 'Start Learning'}
                </Button>
              </Link>
            )
          })}
        </div>
      )}

      {!isLoading && !error && courses.length === 0 && (
        <div className="bg-white border-2 border-yellow-200 rounded-3xl p-16 text-center">
          <div className="bg-yellow-100 p-6 rounded-full w-fit mx-auto mb-6">
            <BookOpen className="size-16 text-yellow-600" />
          </div>
          <h3 className="text-3xl font-bold mb-4">
            Your Learning Journey <span className="text-yellow-500">Starts Here</span>
          </h3>
          <p className="text-muted-foreground text-lg mb-8 max-w-md mx-auto">
            Create your first course and transform your PDFs into an interactive learning experience with AI
          </p>
          <Button asChild size="lg" variant="yellow" className="text-lg px-10">
            <Link to="/courses/create">
              <Plus className="size-6 mr-2" />
              Create Your First Course
            </Link>
          </Button>
        </div>
      )}
    </div>
    </div>
  )
}
