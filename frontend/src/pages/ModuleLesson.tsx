import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Loader2, PlayCircle, AlertCircle, RefreshCw } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { CourseService } from '@/services/course'
import type { Course } from '@/services/course'
import { AICoach } from '@/components/AICoach'

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'

interface ModuleLesson {
  lesson_content: string
  video_url: string | null
  video_status: 'pending' | 'generating' | 'completed' | 'error'
  video_error?: string
}

export default function ModuleLesson() {
  const { courseId, moduleIndex } = useParams<{ courseId: string; moduleIndex: string }>()
  const [course, setCourse] = useState<Course | null>(null)
  const [lesson, setLesson] = useState<ModuleLesson | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRetrying, setIsRetrying] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    // Reset state when module changes
    setIsLoading(true)
    setError('')
    setLesson(null)

    const fetchLessonData = async () => {
      if (!courseId || moduleIndex === undefined) return

      try {
        const [courseData, lessonData] = await Promise.all([
          CourseService.getCourse(parseInt(courseId)),
          CourseService.getModuleLesson(parseInt(courseId), parseInt(moduleIndex))
        ])
        setCourse(courseData)
        setLesson(lessonData)
        return lessonData
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load lesson')
        return null
      } finally {
        setIsLoading(false)
      }
    }

    // Initial fetch
    fetchLessonData()

    // Poll every 3 seconds if video is being generated
    const pollInterval = setInterval(async () => {
      const lessonData = await fetchLessonData()

      // Stop polling if video is completed or errored
      if (lessonData && (lessonData.video_status === 'completed' || lessonData.video_status === 'error')) {
        clearInterval(pollInterval)
      }
    }, 3000)

    return () => clearInterval(pollInterval)
  }, [courseId, moduleIndex])

  const handleRetryVideo = async () => {
    if (!courseId || moduleIndex === undefined) return

    try {
      setIsRetrying(true)
      await CourseService.retryVideoGeneration(parseInt(courseId), parseInt(moduleIndex))
      // Polling will automatically pick up the new status
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to retry video generation')
    } finally {
      setIsRetrying(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <p className="text-center text-muted-foreground">Loading lesson...</p>
      </div>
    )
  }

  if (error || !course || !lesson) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <Button variant="ghost" asChild className="mb-6">
          <Link to={`/courses/${courseId}`}>
            <ArrowLeft className="size-4" />
            Back to Course
          </Link>
        </Button>
        <div className="text-center py-12">
          <p className="text-red-600">{error || 'Lesson not found'}</p>
        </div>
      </div>
    )
  }

  const module = course.modules?.[parseInt(moduleIndex!)]

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <Button variant="ghost" asChild className="mb-6">
        <Link to={`/courses/${courseId}`}>
          <ArrowLeft className="size-4" />
          Back to Course
        </Link>
      </Button>

      <div className="bg-white border rounded-lg p-8">
        {/* Module Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center justify-center size-10 rounded-full bg-primary text-white text-sm font-bold">
              {parseInt(moduleIndex!) + 1}
            </div>
            <h1 className="text-3xl font-bold">{module?.name}</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            {course.name} - Module {parseInt(moduleIndex!) + 1}
          </p>
        </div>

        {/* Video Section */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Video Lesson</h2>

          {lesson.video_status === 'generating' && (
            <div className="aspect-video border rounded-lg bg-accent/10 flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="size-12 animate-spin text-primary mx-auto mb-4" />
                <p className="font-medium">Generating video lesson...</p>
                <p className="text-sm text-muted-foreground mt-2">
                  This may take a few minutes
                </p>
              </div>
            </div>
          )}

          {lesson.video_status === 'error' && (
            <div className="aspect-video border rounded-lg bg-red-50 border-red-200 flex items-center justify-center">
              <div className="text-center p-6">
                <AlertCircle className="size-12 text-red-600 mx-auto mb-4" />
                <p className="font-medium text-red-900 mb-2">Failed to generate video</p>
                {lesson.video_error && (
                  <p className="text-sm text-red-700 mt-2 mb-4">{lesson.video_error}</p>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRetryVideo}
                  disabled={isRetrying}
                  className="border-red-300 text-red-700 hover:bg-red-100"
                >
                  {isRetrying ? (
                    <>
                      <Loader2 className="size-4 mr-2 animate-spin" />
                      Retrying...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="size-4 mr-2" />
                      Retry Video Generation
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {lesson.video_status === 'completed' && lesson.video_url && (
            <div className="aspect-video border rounded-lg overflow-hidden bg-black">
              <video
                key={`${courseId}-${moduleIndex}`}
                controls
                className="w-full h-full"
              >
                <source src={`${API_URL}${lesson.video_url}`} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
          )}

          {lesson.video_status === 'pending' && (
            <div className="aspect-video border rounded-lg bg-accent/10 flex items-center justify-center">
              <div className="text-center">
                <PlayCircle className="size-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Video will be generated soon...</p>
              </div>
            </div>
          )}
        </div>

        {/* Lesson Content */}
        <div className="border-t pt-8">
          <h2 className="text-lg font-semibold mb-4">Lesson Content</h2>
          <div className="prose prose-sm max-w-none">
            <p className="text-muted-foreground whitespace-pre-line leading-relaxed">
              {lesson.lesson_content}
            </p>
          </div>
        </div>

        {/* AI Learning Coach */}
        <div className="border-t pt-8 mt-8">
          <h2 className="text-lg font-semibold mb-4">AI Learning Coach</h2>
          <AICoach
            courseId={parseInt(courseId!)}
            moduleIndex={parseInt(moduleIndex!)}
          />
        </div>

        {/* Navigation */}
        <div className="flex gap-3 mt-8 pt-8 border-t">
          {parseInt(moduleIndex!) > 0 && (
            <Button variant="outline" asChild>
              <Link to={`/courses/${courseId}/modules/${parseInt(moduleIndex!) - 1}`}>
                Previous Module
              </Link>
            </Button>
          )}
          {course.modules && parseInt(moduleIndex!) < course.modules.length - 1 && (
            <Button asChild className="ml-auto">
              <Link to={`/courses/${courseId}/modules/${parseInt(moduleIndex!) + 1}`}>
                Next Module
              </Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
