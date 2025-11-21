import { useState, useEffect } from 'react'
import { Loader2, PlayCircle, AlertCircle } from 'lucide-react'
import { useParams } from 'react-router-dom'
import { CourseService } from '@/services/course'
import type { Course } from '@/services/course'

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'

interface ModuleLesson {
  lesson_content: string
  video_url?: string
  video_status: 'pending' | 'generating' | 'completed' | 'error'
  video_error?: string
}

export default function ModuleView() {
  const { courseId, moduleIndex } = useParams<{ courseId: string; moduleIndex: string }>()
  const [course, setCourse] = useState<Course | null>(null)
  const [lesson, setLesson] = useState<ModuleLesson | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchLessonData = async () => {
      if (!courseId || moduleIndex === undefined) return

      try {
        const [courseData, lessonData] = await Promise.all([
          CourseService.getCourse(parseInt(courseId)),
          CourseService.getModuleLesson(parseInt(courseId), parseInt(moduleIndex))
        ])
        setCourse(courseData)
        setLesson(lessonData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load lesson')
      } finally {
        setIsLoading(false)
      }
    }

    fetchLessonData()
  }, [courseId, moduleIndex])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-yellow-50 to-white flex items-center justify-center">
        <Loader2 className="size-12 animate-spin text-yellow-600" />
      </div>
    )
  }

  if (error || !lesson || !course) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-yellow-50 to-white flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="size-12 text-red-600 mx-auto mb-4" />
          <p className="text-red-600">{error || 'Failed to load lesson'}</p>
        </div>
      </div>
    )
  }

  const module = course.modules?.[parseInt(moduleIndex!)]

  return (
    <div className="min-h-screen bg-gradient-to-b from-yellow-50 to-white">
      <div className="container mx-auto max-w-5xl px-4 py-8">
        {/* Module Header */}
        <div className="bg-white border-2 border-yellow-200 rounded-3xl p-8 mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center justify-center size-16 rounded-2xl text-2xl font-bold bg-yellow-500 text-black">
              {parseInt(moduleIndex!) + 1}
            </div>
            <div>
              <p className="text-sm font-semibold text-yellow-600 mb-1">
                {course.name}
              </p>
              <h1 className="text-4xl font-bold">{module?.name}</h1>
            </div>
          </div>
        </div>

        {/* Video Section */}
        <div className="bg-white border-2 border-slate-200 rounded-3xl p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6">Video Lesson</h2>

          {lesson.video_status === 'generating' && (
            <div className="aspect-video border-2 border-yellow-200 rounded-2xl bg-yellow-50 flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="size-16 animate-spin text-yellow-600 mx-auto mb-4" />
                <p className="font-bold text-xl">Generating video lesson...</p>
              </div>
            </div>
          )}

          {lesson.video_status === 'error' && (
            <div className="aspect-video border-2 border-red-300 rounded-2xl bg-red-50 flex items-center justify-center">
              <div className="text-center p-6">
                <AlertCircle className="size-16 text-red-600 mx-auto mb-4" />
                <p className="font-bold text-xl text-red-900">Video not available</p>
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
                <p className="text-muted-foreground font-medium">Video will be available soon</p>
              </div>
            </div>
          )}
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

        {/* Footer Branding */}
        <div className="text-center mt-8 text-muted-foreground text-sm">
          <p>Powered by Cogni.lol - AI-Powered Learning</p>
        </div>
      </div>
    </div>
  )
}
