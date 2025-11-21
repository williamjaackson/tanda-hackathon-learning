import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Loader2, CheckCircle2, XCircle, AlertCircle, Trophy, Target, Sparkles } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { TestService } from '@/services/test'
import { CourseService } from '@/services/course'
import type { TestQuestion, AnswerSubmission, ModuleTestResult } from '@/services/test'
import type { Course } from '@/services/course'

export default function ModuleTest() {
  const { courseId, moduleIndex } = useParams<{ courseId: string; moduleIndex: string }>()
  // const navigate = useNavigate()
  const [course, setCourse] = useState<Course | null>(null)
  const [questions, setQuestions] = useState<TestQuestion[]>([])
  const [answers, setAnswers] = useState<Record<number, number>>({}) // questionId -> selectedOptionIndex (-1 for unsure)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [testResult, setTestResult] = useState<ModuleTestResult | null>(null)

  useEffect(() => {
    const fetchTestData = async () => {
      if (!courseId || moduleIndex === undefined) return

      try {
        const [courseData, questionsData] = await Promise.all([
          CourseService.getCourse(parseInt(courseId)),
          TestService.getModuleTestQuestions(parseInt(courseId), parseInt(moduleIndex))
        ])
        setCourse(courseData)
        setQuestions(questionsData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load module test')
      } finally {
        setIsLoading(false)
      }
    }

    fetchTestData()
  }, [courseId, moduleIndex])

  const handleAnswerChange = (questionId: number, optionIndex: number) => {
    setAnswers(prev => ({ ...prev, [questionId]: optionIndex }))
  }

  const handleUnsureClick = (questionId: number) => {
    setAnswers(prev => ({ ...prev, [questionId]: -1 }))
  }

  const handleSubmit = async () => {
    if (!courseId || moduleIndex === undefined) return

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

      const result = await TestService.submitModuleTest(
        parseInt(courseId),
        parseInt(moduleIndex),
        submission
      )
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
          <Link to={`/courses/${courseId}/modules/${moduleIndex}`}>
            <ArrowLeft className="size-4" />
            Back to Module
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
          <Link to={`/courses/${courseId}/modules/${moduleIndex}`}>
            <ArrowLeft className="size-4" />
            Back to Module
          </Link>
        </Button>
        <div className="text-center py-12">
          <p className="text-muted-foreground">No test questions available yet for this module.</p>
        </div>
      </div>
    )
  }

  const module = course?.modules?.[parseInt(moduleIndex!)]

  if (hasSubmitted && testResult) {
    return (
      <div className="min-h-screen">
        <div className="container mx-auto max-w-4xl px-4 py-8">
          <Button variant="ghost" asChild className="mb-6">
            <Link to={`/courses/${courseId}/modules/${moduleIndex}`}>
              <ArrowLeft className="size-4" />
              Back to Module
            </Link>
          </Button>

          <div className="bg-white border-2 border-yellow-200 rounded-3xl p-10">
            {testResult.is_passed ? (
              <>
                {/* Success Celebration */}
                <div className="text-center mb-8">
                  <div className="bg-yellow-100 p-6 rounded-full w-fit mx-auto mb-4 animate-bounce">
                    <Trophy className="size-16 text-yellow-600" />
                  </div>
                  <h1 className="text-5xl font-bold mb-3">
                    <span className="text-yellow-500">Amazing!</span> You Did It!
                  </h1>
                  <p className="text-xl text-muted-foreground">
                    Perfect score on this module!
                  </p>
                </div>

                <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-8 mb-8">
                  <div className="flex items-center gap-4 mb-4">
                    <CheckCircle2 className="size-12 text-green-600" />
                    <div className="flex-1">
                      <h3 className="font-bold text-2xl mb-1">{module?.name}</h3>
                      <p className="text-lg text-green-700 font-semibold">
                        {testResult.correct}/{testResult.total} questions correct
                      </p>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl p-4 border-2 border-green-200">
                    <p className="text-green-900 font-medium flex items-center gap-2">
                      <Sparkles className="size-5 text-green-600" />
                              Keep up this momentum! You're on your way to mastering this course.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button asChild variant="outline" size="lg" className="flex-1">
                    <Link to={`/courses/${courseId}/modules/${moduleIndex}`}>
                      Review Module
                    </Link>
                  </Button>
                  <Button asChild variant="yellow" size="lg" className="flex-1 text-lg">
                    <Link to={`/courses/${courseId}`}>
                      Continue Learning →
                    </Link>
                  </Button>
                </div>
              </>
            ) : (
              <>
                {/* Encouragement for Retry */}
                <div className="text-center mb-8">
                  <div className="bg-red-100 p-6 rounded-full w-fit mx-auto mb-4">
                    <Target className="size-16 text-red-600" />
                  </div>
                  <h1 className="text-4xl font-bold mb-3">
                    <span className="text-yellow-500">Almost There!</span>
                  </h1>
                  <p className="text-xl text-muted-foreground">
                    You're making progress. Let's try again!
                  </p>
                </div>

                <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-8 mb-8">
                  <div className="flex items-center gap-4 mb-4">
                    <XCircle className="size-12 text-red-600 " />
                    <div className="flex-1">
                      <h3 className="font-bold text-2xl mb-1">{module?.name}</h3>
                      <p className="text-lg text-red-700 font-semibold">
                        {testResult.correct}/{testResult.total} questions correct
                      </p>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl p-4 border-2 border-red-200">
                    <p className="text-red-900 font-medium">
                      You need all questions correct to pass. Review the module material and try again when you're ready!
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button asChild variant="outline" size="lg" className="flex-1">
                    <Link to={`/courses/${courseId}/modules/${moduleIndex}`}>
                      Review Module
                    </Link>
                  </Button>
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
                    Try Again
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <Button variant="ghost" asChild className="mb-6">
          <Link to={`/courses/${courseId}/modules/${moduleIndex}`}>
            <ArrowLeft className="size-4" />
            Back to Module
          </Link>
        </Button>

        <div className="bg-white border-2 border-yellow-200 rounded-3xl p-8">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="bg-yellow-100 p-4 rounded-2xl w-fit mx-auto mb-4">
              <div className="flex items-center justify-center size-12 rounded-xl bg-yellow-500 text-white text-xl font-bold">
                {parseInt(moduleIndex!) + 1}
              </div>
            </div>
            <h1 className="text-4xl font-bold mb-3">
              Module <span className="text-yellow-500">Test</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-2">
              {module?.name}
            </p>
            <p className="text-muted-foreground">
              Answer all questions correctly to complete this module
            </p>
          </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="size-5 text-red-600  mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div className="space-y-6">
          {questions.map((question, index) => {
            const isAnswered = answers[question.id] !== undefined
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
                  <div className={`flex items-center justify-center size-8 rounded-lg text-sm font-bold  ${
                    isAnswered ? 'bg-yellow-500 text-black' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {index + 1}
                  </div>
                  <h3 className="font-semibold text-lg flex-1">
                    {question.question_text}
                  </h3>
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
              'Submit Test'
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
