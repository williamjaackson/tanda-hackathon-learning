import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowLeft, BookOpen, Trash2 } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CourseService } from '@/services/course'
import type { Course } from '@/services/course'

export default function CourseDetail() {
  const { courseId } = useParams<{ courseId: string }>()
  const navigate = useNavigate()
  const [course, setCourse] = useState<Course | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchCourse = async () => {
      if (!courseId) return

      try {
        setIsLoading(true)
        const data = await CourseService.getCourse(parseInt(courseId))
        setCourse(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load course')
      } finally {
        setIsLoading(false)
      }
    }

    fetchCourse()
  }, [courseId])

  const handleDelete = async () => {
    if (!courseId || !confirm('Are you sure you want to delete this course?')) {
      return
    }

    try {
      setIsDeleting(true)
      await CourseService.deleteCourse(parseInt(courseId))
      navigate('/courses')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete course')
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <p className="text-center text-muted-foreground">Loading course...</p>
      </div>
    )
  }

  if (error || !course) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <Button variant="ghost" asChild className="mb-6">
          <Link to="/courses">
            <ArrowLeft className="size-4" />
            Back to Courses
          </Link>
        </Button>
        <div className="text-center py-12">
          <p className="text-red-600">{error || 'Course not found'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <Button variant="ghost" asChild className="mb-6">
        <Link to="/courses">
          <ArrowLeft className="size-4" />
          Back to Courses
        </Link>
      </Button>

      <div className="bg-white border rounded-lg p-8">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-primary/10 rounded-lg">
              <BookOpen className="size-8 text-primary" />
            </div>
            <div>
              <div className="font-mono text-sm text-muted-foreground mb-1">
                {course.code}
              </div>
              <h1 className="text-3xl font-bold">{course.name}</h1>
            </div>
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={handleDelete}
            disabled={isDeleting}
            className="text-destructive hover:bg-destructive hover:text-white"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>

        {course.description && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">Description</h2>
            <p className="text-muted-foreground">{course.description}</p>
          </div>
        )}

        <div className="border-t pt-6">
          <h2 className="text-lg font-semibold mb-4">Course Materials</h2>
          <p className="text-muted-foreground text-sm">No materials uploaded yet.</p>
        </div>
      </div>
    </div>
  )
}
