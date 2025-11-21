import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Plus, BookOpen } from 'lucide-react'
import { Link } from 'react-router-dom'
import { CourseService } from '@/services/course'
import type { Course } from '@/services/course'

export default function Courses() {
  const [courses, setCourses] = useState<Course[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setIsLoading(true)
        const data = await CourseService.getCourses()
        setCourses(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load courses')
      } finally {
        setIsLoading(false)
      }
    }

    fetchCourses()
  }, [])
  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">My Courses</h1>
          <p className="text-muted-foreground">
            Manage and track your enrolled courses
          </p>
        </div>
        <Button asChild size="lg">
          <Link to="/courses/create">
            <Plus className="size-5" />
            Create Course
          </Link>
        </Button>
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
        {courses.map((course) => (
          <Link
            key={course.id}
            to={`/courses/${course.id}`}
            className="bg-white border rounded-lg p-6 block hover:-translate-y-1 transition-all hover:shadow-md"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <BookOpen className="size-5 text-primary" />
                </div>
                <div>
                  <div className="font-mono text-sm text-muted-foreground">
                    {course.code}
                  </div>
                  <h3 className="font-semibold text-lg">{course.name}</h3>
                </div>
              </div>
            </div>

            <Button variant="outline" className="w-full">
              View Course
            </Button>
          </Link>
        ))}
        </div>
      )}

      {!isLoading && !error && courses.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="size-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No courses yet</h3>
          <p className="text-muted-foreground mb-4">
            Get started by creating your first course
          </p>
          <Button asChild>
            <Link to="/courses/create">
              <Plus className="size-5" />
              Create Course
            </Link>
          </Button>
        </div>
      )}
    </div>
  )
}
