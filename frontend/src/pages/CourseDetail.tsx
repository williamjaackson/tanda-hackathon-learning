import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowLeft, BookOpen, Trash2, FileText } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CourseService } from '@/services/course'
import type { Course, CoursePDF } from '@/services/course'

export default function CourseDetail() {
  const { courseId } = useParams<{ courseId: string }>()
  const navigate = useNavigate()
  const [course, setCourse] = useState<Course | null>(null)
  const [pdfs, setPdfs] = useState<CoursePDF[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchCourseData = async () => {
      if (!courseId) return

      try {
        setIsLoading(true)
        const [courseData, pdfData] = await Promise.all([
          CourseService.getCourse(parseInt(courseId)),
          CourseService.getCoursePDFs(parseInt(courseId))
        ])
        setCourse(courseData)
        setPdfs(pdfData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load course')
      } finally {
        setIsLoading(false)
      }
    }

    fetchCourseData()
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
          {pdfs.length === 0 ? (
            <p className="text-muted-foreground text-sm">No materials uploaded yet.</p>
          ) : (
            <div className="space-y-4">
              {pdfs.map((pdf) => (
                <div key={pdf.id} className="border rounded-lg p-4 bg-accent/20">
                  <div className="flex items-start gap-3 mb-3">
                    <FileText className="size-5 text-primary flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm mb-1">{pdf.filename}</h3>
                      <p className="text-xs text-muted-foreground">
                        Uploaded {new Date(pdf.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {pdf.summary && (
                    <div className="mt-3 pt-3 border-t">
                      <h4 className="text-xs font-semibold text-muted-foreground mb-2">
                        AI Summary
                      </h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-line">
                        {pdf.summary}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
