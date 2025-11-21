import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Loader2, PlayCircle, AlertCircle, RefreshCw, ClipboardCheck, Target } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { CourseService } from '@/services/course'
import { TestService } from '@/services/test'
import type { Course } from '@/services/course'
import type { TestStatus } from '@/services/test'
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
  const [testStatus, setTestStatus] = useState<TestStatus | null>(null)
  const [hasTestQuestions, setHasTestQuestions] = useState<boolean>(false)

  useEffect(() => {
    // Reset state when module changes
    setIsLoading(true)
    setError('')
    setLesson(null)

    const fetchLessonData = async () => {
      if (!courseId || moduleIndex === undefined) return

      try {
        const [courseData, lessonData, testStatusData] = await Promise.all([
          CourseService.getCourse(parseInt(courseId)),
          CourseService.getModuleLesson(parseInt(courseId), parseInt(moduleIndex)),
          TestService.getTestStatus(parseInt(courseId)).catch(() => ({ has_completed: false, passed_modules: [] }))
        ])
        setCourse(courseData)
        setLesson(lessonData)
        setTestStatus(testStatusData)

        // Check if test questions exist for this module
        try {
          const questions = await TestService.getModuleTestQuestions(parseInt(courseId), parseInt(moduleIndex))
          setHasTestQuestions(questions.length > 0)
        } catch {
          setHasTestQuestions(false)
        }

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
  const isModuleCompleted = testStatus?.passed_modules.includes(parseInt(moduleIndex!)) || false

  return (
    <div className="min-h-screen bg-gradient-to-b from-yellow-50 to-white">
      <div className="container mx-auto max-w-5xl px-4 py-8">
        <Button variant="ghost" asChild className="mb-6">
          <Link to={`/courses/${courseId}`}>
            <ArrowLeft className="size-4" />
            Back to Course
          </Link>
        </Button>

        {/* Module Header Card */}
        <div className={`border-2 rounded-3xl p-8 mb-8 ${
          isModuleCompleted
            ? 'bg-gradient-to-br from-green-50 to-green-100 border-green-300'
            : 'bg-white border-yellow-200'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className={`flex items-center justify-center size-16 rounded-2xl text-2xl font-bold transition-transform hover:scale-110 ${
                isModuleCompleted ? 'bg-green-600 text-white' : 'bg-yellow-500 text-black'
              }`}>
                {isModuleCompleted ? '✓' : parseInt(moduleIndex!) + 1}
              </div>
              <div>
                <p className="text-sm font-semibold text-yellow-600 mb-1">
                  {course.name}
                </p>
                <h1 className="text-4xl font-bold mb-2">{module?.name}</h1>
                {isModuleCompleted && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-green-700 bg-green-200 px-3 py-1 rounded-full">
                      ✓ Completed
                    </span>
                  </div>
                )}
              </div>
            </div>
            {hasTestQuestions && (
              <Button asChild variant={isModuleCompleted ? 'outline' : 'yellow'} size="lg">
                <Link to={`/courses/${courseId}/modules/${moduleIndex}/test`}>
                  <ClipboardCheck className="size-5 mr-2" />
                  {isModuleCompleted ? 'Retake Test' : 'Take Test'}
                </Link>
              </Button>
            )}
          </div>
          {!isModuleCompleted && (
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4 mt-4">
              <p className="text-yellow-900 font-medium flex items-center gap-2">
                <Target className="size-5 text-yellow-600" />
                Complete the test to master this module and continue your learning journey!
              </p>
            </div>
          )}
        </div>

        <div className="space-y-8">

        {/* Video Section */}
        <div className="bg-white border-2 border-slate-200 rounded-3xl p-8">
          <h2 className="text-2xl font-bold mb-6">Video Lesson</h2>

          {lesson.video_status === 'generating' && (
            <div className="aspect-video border-2 border-yellow-200 rounded-2xl bg-yellow-50 flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="size-16 animate-spin text-yellow-600 mx-auto mb-4" />
                <p className="font-bold text-xl">Generating your video lesson...</p>
                <p className="text-muted-foreground mt-2">
                  This may take a few minutes
                </p>
              </div>
            </div>
          )}

          {lesson.video_status === 'error' && (
            <div className="aspect-video border-2 border-red-300 rounded-2xl bg-red-50 flex items-center justify-center">
              <div className="text-center p-6">
                <AlertCircle className="size-16 text-red-600 mx-auto mb-4" />
                <p className="font-bold text-xl text-red-900 mb-2">Failed to generate video</p>
                {lesson.video_error && (
                  <p className="text-sm text-red-700 mt-2 mb-4">{lesson.video_error}</p>
                )}
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleRetryVideo}
                  disabled={isRetrying}
                  className="border-red-300 text-red-700 hover:bg-red-100"
                >
                  {isRetrying ? (
                    <>
                      <Loader2 className="size-5 mr-2 animate-spin" />
                      Retrying...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="size-5 mr-2" />
                      Retry Video Generation
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {lesson.video_status === 'completed' && lesson.video_url && (
            <div className="aspect-video border-2 border-slate-200 rounded-2xl overflow-hidden bg-black">
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
            <div className="aspect-video border-2 border-slate-200 rounded-2xl bg-slate-50 flex items-center justify-center">
              <div className="text-center">
                <PlayCircle className="size-16 text-slate-400 mx-auto mb-4" />
                <p className="text-muted-foreground font-medium">Video will be generated soon...</p>
              </div>
            </div>
          )}
        </div>

        {/* AI Learning Coach */}
        <div className="bg-white border-2 border-slate-200 rounded-3xl p-8">
          <h2 className="text-2xl font-bold mb-4">AI Learning Coach</h2>
          <AICoach
            courseId={parseInt(courseId!)}
            moduleIndex={parseInt(moduleIndex!)}
          />
        </div>

        {/* Lesson Content */}
        <div className="bg-white border-2 border-slate-200 rounded-3xl p-8">
          <h2 className="text-2xl font-bold mb-6">Lesson Content</h2>
          <div className="prose prose-sm max-w-none">
            <p className="text-muted-foreground whitespace-pre-line leading-relaxed text-lg">
              {lesson.lesson_content}
            </p>
          </div>
        </div>

        {/* Navigation */}
        <div className="bg-white border-2 border-yellow-200 rounded-3xl p-8">
          <h2 className="text-2xl font-bold mb-6 text-center">Continue Your Journey</h2>
          <div className="flex flex-col sm:flex-row gap-4">
            {parseInt(moduleIndex!) > 0 && (
              <Button variant="outline" size="lg" asChild className="flex-1">
                <Link to={`/courses/${courseId}/modules/${parseInt(moduleIndex!) - 1}`}>
                  ← Previous Module
                </Link>
              </Button>
            )}
            {course.modules && parseInt(moduleIndex!) < course.modules.length - 1 ? (
              <Button asChild variant="yellow" size="lg" className="flex-1 text-lg">
                <Link to={`/courses/${courseId}/modules/${parseInt(moduleIndex!) + 1}`}>
                  Next Module →
                </Link>
              </Button>
            ) : (
              <Button asChild variant="yellow" size="lg" className="flex-1 text-lg">
                <Link to={`/courses/${courseId}`}>
                  Back to Course
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}
