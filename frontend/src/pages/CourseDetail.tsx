import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowLeft, BookOpen, Trash2, FileText, Loader2, ChevronDown, ChevronUp, AlertCircle, RefreshCw, ClipboardCheck, Trophy, Target, Sparkles, Award } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CourseService } from '@/services/course'
import { TestService } from '@/services/test'
import { useAuth } from '@/contexts/AuthContext'
import type { Course, CoursePDF } from '@/services/course'
import type { TestStatus } from '@/services/test'
import { CertificateDialog } from '@/components/CertificateDialog'

export default function CourseDetail() {
  const { courseId } = useParams<{ courseId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [course, setCourse] = useState<Course | null>(null)
  const [pdfs, setPdfs] = useState<CoursePDF[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isRetrying, setIsRetrying] = useState(false)
  const [error, setError] = useState('')
  const [showPdfSummaries, setShowPdfSummaries] = useState(false)
  const [testStatus, setTestStatus] = useState<TestStatus | null>(null)
  const [hasTestQuestions, setHasTestQuestions] = useState<boolean | null>(null) // null = checking, true/false = result
  const [showCertificate, setShowCertificate] = useState(false)

  useEffect(() => {
    const fetchCourseData = async () => {
      if (!courseId) return

      try {
        const [courseData, pdfData, testStatusData] = await Promise.all([
          CourseService.getCourse(parseInt(courseId)),
          CourseService.getCoursePDFs(parseInt(courseId)),
          TestService.getTestStatus(parseInt(courseId)).catch(() => ({ has_completed: false, passed_modules: [] }))
        ])
        setCourse(courseData)
        setPdfs(pdfData)
        setTestStatus(testStatusData)

        // Check if test questions exist when modules are completed
        if (courseData.modules_status === 'completed') {
          try {
            const questions = await TestService.getTestQuestions(parseInt(courseId))
            setHasTestQuestions(questions.length > 0)
          } catch {
            setHasTestQuestions(false)
          }
        } else {
          setHasTestQuestions(null)
        }

        return { courseData, pdfData }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load course')
        return null
      } finally {
        setIsLoading(false)
      }
    }

    // Initial fetch
    fetchCourseData()

    // Poll every 3 seconds for updates
    const pollInterval = setInterval(async () => {
      const result = await fetchCourseData()

      // Stop polling if all PDFs have summaries AND modules are completed or errored AND test questions are ready
      if (result) {
        const allSummariesComplete = result.pdfData.every(pdf => pdf.summary !== null)
        const modulesStatus = result.courseData.modules_status

        // Continue polling if modules are completed but test questions aren't ready yet
        if (allSummariesComplete && modulesStatus === 'error') {
          clearInterval(pollInterval)
        }

        // Stop when modules are completed AND test questions are available
        if (allSummariesComplete && modulesStatus === 'completed' && hasTestQuestions === true) {
          clearInterval(pollInterval)
        }
      }
    }, 3000)

    return () => clearInterval(pollInterval)
  }, [courseId, hasTestQuestions])

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

  const handleRetryModules = async () => {
    if (!courseId) return

    try {
      setIsRetrying(true)
      await CourseService.retryModuleGeneration(parseInt(courseId))
      // Polling will automatically pick up the new status
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to retry module generation')
    } finally {
      setIsRetrying(false)
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

  const completedModules = testStatus?.passed_modules.length || 0
  const totalModules = course?.modules?.length || 0
  const progressPercent = totalModules > 0 ? (completedModules / totalModules) * 100 : 0
  const isFullyCompleted = totalModules > 0 && completedModules === totalModules

  return (
    <div className="min-h-screen bg-gradient-to-b from-yellow-50 to-white">
      <div className="container mx-auto max-w-5xl px-4 py-8">
        <Button variant="ghost" asChild className="mb-6">
          <Link to="/courses">
            <ArrowLeft className="size-4" />
            Back to Courses
          </Link>
        </Button>

        {/* Hero Header with Progress */}
        <div className="bg-white border-2 border-yellow-200 rounded-3xl p-8 mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-6">
            <div className="flex items-center gap-4 flex-1">
              <div className="p-4 bg-yellow-100 rounded-2xl">
                <BookOpen className="size-12 text-yellow-600" />
              </div>
              <div className="flex-1">
                <div className="font-mono text-sm text-yellow-600 font-semibold mb-1">
                  {course.code}
                </div>
                <h1 className="text-4xl font-bold mb-2">{course.name}</h1>
                {course.description && (
                  <p className="text-muted-foreground">{course.description}</p>
                )}
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

          {/* Progress Section */}
          {totalModules > 0 && (
            <div className="border-t-2 border-yellow-100 pt-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Target className="size-5 text-yellow-600" />
                  <span className="font-semibold text-lg">Your Progress</span>
                </div>
                <span className="text-2xl font-bold">
                  {completedModules}/{totalModules}
                  <span className="text-sm text-muted-foreground ml-2">
                    ({Math.round(progressPercent)}%)
                  </span>
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden mb-4">
                <div
                  className={`h-full rounded-full transition-all ${
                    isFullyCompleted ? 'bg-green-500' : 'bg-yellow-500'
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              {isFullyCompleted && (
                <div className="space-y-4">
                  <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 flex items-center gap-3">
                    <Trophy className="size-8 text-green-600" />
                    <div className="flex-1">
                      <p className="font-bold text-green-900 text-lg">
                        Course Mastered!
                      </p>
                      <p className="text-green-700 text-sm">
                        Amazing work! You've completed all modules in this course.
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => setShowCertificate(true)}
                    variant="yellow"
                    size="lg"
                    className="w-full text-lg"
                  >
                    <Award className="size-6 mr-2" />
                    Download Your Certificate
                  </Button>
                </div>
              )}
              {!isFullyCompleted && completedModules > 0 && (
                <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4 flex items-center gap-3">
                  <Sparkles className="size-6 text-yellow-600" />
                  <p className="text-yellow-900 font-medium">
                    Great progress! Keep going to master this course.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Course Modules Section */}
        <div className="bg-white border-2 border-slate-200 rounded-3xl p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Course Modules</h2>
            {course.modules_status === 'completed' && course.modules && course.modules.length > 0 && (
              <>
                {hasTestQuestions === true ? (
                  <Button asChild variant="yellow" size="lg">
                    <Link to={`/courses/${courseId}/test`}>
                      <ClipboardCheck className="size-5 mr-2" />
                      Take Final Test
                    </Link>
                  </Button>
                ) : (
                  <Button disabled size="lg">
                    <Loader2 className="size-5 mr-2 animate-spin" />
                    Generating Test...
                  </Button>
                )}
              </>
            )}
          </div>

          {/* Loading State */}
          {course.modules_status === 'generating' && (
            <div className="flex items-center gap-3 p-6 border rounded-lg bg-accent/10">
              <Loader2 className="size-5 animate-spin text-primary" />
              <div>
                <p className="font-medium">Generating course modules...</p>
                <p className="text-sm text-muted-foreground">
                  Analyzing PDFs and creating structured learning modules
                </p>
              </div>
            </div>
          )}

          {/* Error State */}
          {course.modules_status === 'error' && (
            <div className="p-6 border rounded-lg bg-red-50 border-red-200">
              <div className="flex items-start gap-3 mb-4">
                <AlertCircle className="size-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-red-900">Failed to generate modules</p>
                  {course.modules_error && (
                    <p className="text-sm text-red-700 mt-1">{course.modules_error}</p>
                  )}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRetryModules}
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
                    Retry Generation
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Course Modules List */}
          {course.modules && course.modules.length > 0 && (
            <div className="space-y-4">
              {course.modules.map((module, index) => {
                const isCompleted = testStatus?.passed_modules.includes(index) || false
                // Find the first incomplete module to mark as "Start Here"
                const firstIncompleteIndex = course.modules?.findIndex((_, i) =>
                  !testStatus?.passed_modules.includes(i)
                ) ?? -1
                const isNextToComplete = !isCompleted && index === firstIncompleteIndex

                return (
                  <div key={index} className="relative">
                    {/* Connection line */}
                    {index < course.modules!.length - 1 && (
                      <div className={`absolute left-7 top-20 bottom-0 w-1 -mb-4 ${
                        isCompleted ? 'bg-green-300' : 'bg-slate-200'
                      }`}></div>
                    )}

                    <Link to={`/courses/${courseId}/modules/${index}`}>
                      <div className={`group border-2 rounded-2xl p-6 transition-all relative cursor-pointer hover:-translate-y-1 ${
                        isCompleted
                          ? 'bg-green-50 border-green-300 hover:border-green-400 hover:shadow-lg'
                          : isNextToComplete
                          ? 'bg-yellow-50 border-yellow-300 hover:border-yellow-400 hover:shadow-lg'
                          : 'bg-white border-slate-200 hover:border-yellow-300 hover:shadow-lg'
                      }`}>
                        <div className="flex items-center gap-4">
                          <div className={`flex items-center justify-center size-14 rounded-2xl text-lg font-bold flex-shrink-0 relative z-10 transition-transform group-hover:scale-110 ${
                            isCompleted
                              ? 'bg-green-600 text-white'
                              : isNextToComplete
                              ? 'bg-yellow-500 text-black'
                              : 'bg-primary text-white'
                          }`}>
                            {isCompleted ? '✓' : index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-bold text-xl group-hover:text-yellow-600 transition-colors">
                                {module.name}
                              </h3>
                              {isCompleted && (
                                <span className="text-xs font-bold text-green-700 bg-green-200 px-3 py-1 rounded-full">
                                  ✓ Completed
                                </span>
                              )}
                              {isNextToComplete && (
                                <span className="text-xs font-bold text-yellow-700 bg-yellow-200 px-3 py-1 rounded-full animate-pulse">
                                  → Start Here
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Click to {isCompleted ? 'review' : 'start'} this module
                            </p>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </div>
                )
              })}
            </div>
          )}

          {/* Pending State (waiting for PDFs) */}
          {course.modules_status === 'pending' && pdfs.some(pdf => !pdf.summary) && (
            <div className="flex items-center gap-3 p-6 border rounded-lg bg-accent/5">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
              <p className="text-muted-foreground">
                Waiting for PDF processing to complete before generating modules...
              </p>
            </div>
          )}
        </div>

        {/* Course Materials / PDFs Section */}
        {pdfs.length > 0 && (
          <div className="bg-white border-2 border-slate-200 rounded-3xl p-8 mt-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Source Materials</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPdfSummaries(!showPdfSummaries)}
                className="text-muted-foreground"
              >
                {showPdfSummaries ? (
                  <>
                    <ChevronUp className="size-4 mr-1" />
                    Hide Details
                  </>
                ) : (
                  <>
                    <ChevronDown className="size-4 mr-1" />
                    Show Details
                  </>
                )}
              </Button>
            </div>
            <div className="space-y-3">
              {pdfs.map((pdf) => (
                <div key={pdf.id} className="border rounded-lg p-4 bg-accent/5">
                  <div className="flex items-start gap-3">
                    <FileText className="size-5 text-primary flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm mb-1">{pdf.filename}</h3>
                      <p className="text-xs text-muted-foreground">
                        Uploaded {new Date(pdf.created_at).toLocaleDateString()}
                      </p>
                      {!pdf.summary && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                          <Loader2 className="size-3 animate-spin" />
                          <span>Processing...</span>
                        </div>
                      )}
                    </div>
                  </div>
                  {showPdfSummaries && pdf.summary && (
                    <div className="mt-3 pt-3 border-t">
                      <h4 className="text-xs font-semibold text-muted-foreground mb-2">
                        Content Overview
                      </h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-line">
                        {pdf.summary}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {pdfs.length === 0 && (!course.modules || course.modules.length === 0) && (
          <div className="border-t pt-6">
            <p className="text-muted-foreground text-sm">No materials uploaded yet.</p>
          </div>
        )}

        {/* Certificate Dialog */}
        {isFullyCompleted && user && (
          <CertificateDialog
            open={showCertificate}
            onOpenChange={setShowCertificate}
            userName={user.name}
            courseName={course.name}
            courseCode={course.code}
            completionDate={new Date()}
            courseId={course.id}
          />
        )}
      </div>
    </div>
  )
}
