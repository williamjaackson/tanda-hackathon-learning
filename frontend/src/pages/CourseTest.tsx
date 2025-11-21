import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Loader2, CheckCircle2, XCircle, AlertCircle, Trophy, Target, Sparkles, Award } from 'lucide-react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { TestService } from '@/services/test'
import { CourseService } from '@/services/course'
import type { TestQuestion, AnswerSubmission } from '@/services/test'
import type { Course } from '@/services/course'

export default function CourseTest() {
  const { courseId } = useParams<{ courseId: string }>()
  const navigate = useNavigate()
  const [course, setCourse] = useState<Course | null>(null)
  const [questions, setQuestions] = useState<TestQuestion[]>([])
  const [answers, setAnswers] = useState<Record<number, number>>({}) // questionId -> selectedOptionIndex (-1 for unsure)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [testResult, setTestResult] = useState<{
    module_results: Record<number, { total: number; correct: number }>
    passed_modules: number[]
  } | null>(null)

  useEffect(() => {
    const fetchTestData = async () => {
      if (!courseId) return

      try {
        const [courseData, questionsData] = await Promise.all([
          CourseService.getCourse(parseInt(courseId)),
          TestService.getTestQuestions(parseInt(courseId))
        ])
        setCourse(courseData)

        // Shuffle questions to mix modules
        const shuffled = [...questionsData].sort(() => Math.random() - 0.5)
        setQuestions(shuffled)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load test')
      } finally {
        setIsLoading(false)
      }
    }

    fetchTestData()
  }, [courseId])

  const handleAnswerChange = (questionId: number, optionIndex: number) => {
    setAnswers(prev => ({ ...prev, [questionId]: optionIndex }))
  }

  const handleUnsureClick = (questionId: number) => {
    setAnswers(prev => ({ ...prev, [questionId]: -1 }))
  }

  const handleSubmit = async () => {
    if (!courseId) return

    // Check if all questions are answered
    const unansweredQuestions = questions.filter(q => answers[q.id] === undefined)
    if (unansweredQuestions.length > 0) {
      setError('Please answer all questions before submitting')
      return
    }

    try {
      setIsSubmitting(true)
      setError('')

      const submission = {
        answers: Object.entries(answers).map(([questionId, selectedOptionIndex]) => ({
          question_id: parseInt(questionId),
          selected_option_index: selectedOptionIndex
        })) as AnswerSubmission[]
      }

      const result = await TestService.submitTest(parseInt(courseId), submission)
      setTestResult(result)
      setHasSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit test')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <p className="text-center text-muted-foreground">Loading test...</p>
      </div>
    )
  }

  if (error && !hasSubmitted) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <Button variant="ghost" asChild className="mb-6">
          <Link to={`/courses/${courseId}`}>
            <ArrowLeft className="size-4" />
            Back to Course
          </Link>
        </Button>
        <div className="text-center py-12">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <Button variant="ghost" asChild className="mb-6">
          <Link to={`/courses/${courseId}`}>
            <ArrowLeft className="size-4" />
            Back to Course
          </Link>
        </Button>
        <div className="text-center py-12">
          <p className="text-muted-foreground">No test questions available yet. Please wait for modules to be generated.</p>
        </div>
      </div>
    )
  }

  if (hasSubmitted && testResult) {
    const allPassed = testResult.passed_modules.length === Object.keys(testResult.module_results).length
    const totalCorrect = Object.values(testResult.module_results).reduce((sum, r) => sum + r.correct, 0)
    const totalQuestions = Object.values(testResult.module_results).reduce((sum, r) => sum + r.total, 0)
    const scorePercent = Math.round((totalCorrect / totalQuestions) * 100)

    return (
      <div className="min-h-screen bg-gradient-to-b from-yellow-50 to-white">
        <div className="container mx-auto max-w-4xl px-4 py-8">
          <Button variant="ghost" asChild className="mb-6">
            <Link to={`/courses/${courseId}`}>
              <ArrowLeft className="size-4" />
              Back to Course
            </Link>
          </Button>

          <div className="bg-white border-2 border-yellow-200 rounded-3xl p-10">
            {allPassed ? (
              <>
                {/* Ultimate Success Celebration */}
                <div className="text-center mb-8">
                  <div className="bg-gradient-to-br from-yellow-100 to-yellow-200 p-8 rounded-full w-fit mx-auto mb-6 animate-bounce">
                    <Award className="size-20 text-yellow-600" />
                  </div>
                  <h1 className="text-6xl font-bold mb-4">
                    <span className="text-yellow-500">Congratulations!</span>
                  </h1>
                  <p className="text-2xl font-semibold mb-2">
                    🎉 Course Mastered! 🎉
                  </p>
                  <p className="text-xl text-muted-foreground">
                    Perfect score across all modules!
                  </p>
                </div>

                {/* Score Display */}
                <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-300 rounded-3xl p-8 mb-8">
                  <div className="text-center mb-6">
                    <div className="text-7xl font-bold text-green-600 mb-2">
                      {scorePercent}%
                    </div>
                    <p className="text-lg text-green-800 font-semibold">
                      {totalCorrect}/{totalQuestions} questions correct
                    </p>
                  </div>
                  <div className="bg-white rounded-2xl p-6">
                    <p className="text-green-900 font-medium flex items-center justify-center gap-2 text-lg">
                      <Sparkles className="size-6 text-green-600" />
                      You've mastered every concept in this course. Outstanding work!
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Partial Success */}
                <div className="text-center mb-8">
                  <div className="bg-yellow-100 p-6 rounded-full w-fit mx-auto mb-4">
                    <Trophy className="size-16 text-yellow-600" />
                  </div>
                  <h1 className="text-5xl font-bold mb-3">
                    <span className="text-yellow-500">Great Effort!</span>
                  </h1>
                  <p className="text-xl text-muted-foreground">
                    You scored {scorePercent}%
                  </p>
                </div>

                <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-6 mb-8 text-center">
                  <p className="text-yellow-900 font-medium text-lg">
                    {testResult.passed_modules.length} of {Object.keys(testResult.module_results).length} modules completed
                  </p>
                </div>
              </>
            )}

            {/* Module Results */}
            <div className="space-y-4 mb-8">
              <h2 className="text-2xl font-bold mb-4 text-center">Module Results</h2>
              {Object.entries(testResult.module_results).map(([moduleIndex, result]) => {
                const moduleName = course?.modules?.[parseInt(moduleIndex)]?.name || `Module ${parseInt(moduleIndex) + 1}`
                const isPassed = testResult.passed_modules.includes(parseInt(moduleIndex))

                return (
                  <div
                    key={moduleIndex}
                    className={`border-2 rounded-2xl p-6 transition-all ${
                      isPassed ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`flex items-center justify-center size-12 rounded-xl text-lg font-bold flex-shrink-0 ${
                        isPassed ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                      }`}>
                        {isPassed ? '✓' : parseInt(moduleIndex) + 1}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-xl mb-1">{moduleName}</h3>
                        <p className={`text-lg font-semibold ${isPassed ? 'text-green-700' : 'text-red-700'}`}>
                          {result.correct}/{result.total} questions correct
                        </p>
                      </div>
                      {isPassed ? (
                        <CheckCircle2 className="size-8 text-green-600" />
                      ) : (
                        <XCircle className="size-8 text-red-600" />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button asChild variant="outline" size="lg" className="flex-1">
                <Link to={`/courses/${courseId}`}>
                  View Course
                </Link>
              </Button>
              {!allPassed && (
                <Button
                  onClick={() => {
                    setHasSubmitted(false)
                    setTestResult(null)
                    setAnswers({})
                  }}
                  variant="yellow"
                  size="lg"
                  className="flex-1 text-lg"
                >
                  Retake Test
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-yellow-50 to-white">
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <Button variant="ghost" asChild className="mb-6">
          <Link to={`/courses/${courseId}`}>
            <ArrowLeft className="size-4" />
            Back to Course
          </Link>
        </Button>

        <div className="bg-white border-2 border-yellow-200 rounded-3xl p-8">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="bg-yellow-100 p-6 rounded-2xl w-fit mx-auto mb-4">
              <Trophy className="size-16 text-yellow-600" />
            </div>
            <h1 className="text-5xl font-bold mb-3">
              Final <span className="text-yellow-500">Knowledge Test</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-2">
              {course?.name}
            </p>
            <p className="text-muted-foreground">
              Answer questions from all modules to complete the course
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl flex items-start gap-3">
              <AlertCircle className="size-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="space-y-6">
            {questions.map((question, index) => {
              const isAnswered = answers[question.id] !== undefined
              const moduleName = course?.modules?.[question.module_index]?.name

              return (
                <div
                  key={question.id}
                  className={`border-2 rounded-2xl p-6 transition-all ${
                    isAnswered
                      ? 'bg-yellow-50 border-yellow-300'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-start gap-3 mb-4">
                    <div className={`flex items-center justify-center size-8 rounded-lg text-sm font-bold flex-shrink-0 ${
                      isAnswered ? 'bg-yellow-500 text-black' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="text-xs font-semibold text-yellow-600 mb-1">
                        {moduleName || `Module ${question.module_index + 1}`}
                      </div>
                      <h3 className="font-semibold text-lg">
                        {question.question_text}
                      </h3>
                    </div>
                  </div>

                  <div className="space-y-3 mb-4">
                    {question.options.map((option, optIndex) => (
                      <label
                        key={optIndex}
                        className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                          answers[question.id] === optIndex
                            ? 'bg-yellow-500 border-yellow-500 text-black font-semibold scale-[1.02]'
                            : 'bg-white border-slate-200 hover:border-yellow-300 hover:bg-yellow-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`question-${question.id}`}
                          checked={answers[question.id] === optIndex}
                          onChange={() => handleAnswerChange(question.id, optIndex)}
                          className="size-5"
                        />
                        <span className="flex-1">{option}</span>
                      </label>
                    ))}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUnsureClick(question.id)}
                    className={answers[question.id] === -1 ? 'bg-slate-200' : ''}
                  >
                    {answers[question.id] === -1 ? '✓ ' : ''}I'm unsure
                  </Button>
                </div>
              )
            })}
          </div>

          <div className="mt-8 pt-8 border-t-2 border-yellow-200">
            <div className="mb-4 text-center">
              <p className="text-lg font-semibold mb-2">
                {Object.keys(answers).length} of {questions.length} questions answered
              </p>
              <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden max-w-md mx-auto">
                <div
                  className="h-full bg-yellow-500 rounded-full transition-all"
                  style={{ width: `${(Object.keys(answers).length / questions.length) * 100}%` }}
                />
              </div>
            </div>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || Object.keys(answers).length < questions.length}
              variant="yellow"
              className="w-full text-lg"
              size="lg"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-5 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Final Test'
              )}
            </Button>
            {Object.keys(answers).length < questions.length && (
              <p className="text-sm text-muted-foreground text-center mt-3">
                Answer all questions to submit
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
