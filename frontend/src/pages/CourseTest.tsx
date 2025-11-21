import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Loader2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
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
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <Button variant="ghost" asChild className="mb-6">
          <Link to={`/courses/${courseId}`}>
            <ArrowLeft className="size-4" />
            Back to Course
          </Link>
        </Button>

        <div className="bg-white border rounded-lg p-8">
          <h1 className="text-3xl font-bold mb-6">Test Results</h1>

          <div className="space-y-4 mb-8">
            {Object.entries(testResult.module_results).map(([moduleIndex, result]) => {
              const moduleName = course?.modules?.[parseInt(moduleIndex)]?.name || `Module ${parseInt(moduleIndex) + 1}`
              const isPassed = testResult.passed_modules.includes(parseInt(moduleIndex))

              return (
                <div
                  key={moduleIndex}
                  className={`border rounded-lg p-6 ${
                    isPassed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {isPassed ? (
                      <CheckCircle2 className="size-6 text-green-600 flex-shrink-0" />
                    ) : (
                      <XCircle className="size-6 text-red-600 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">{moduleName}</h3>
                      <p className={`text-sm ${isPassed ? 'text-green-700' : 'text-red-700'}`}>
                        {result.correct} out of {result.total} questions correct
                      </p>
                      {isPassed && (
                        <p className="text-sm text-green-600 font-medium mt-1">
                          ✓ Module completed successfully
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="flex gap-3">
            <Button asChild className="flex-1">
              <Link to={`/courses/${courseId}`}>
                View Course
              </Link>
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setHasSubmitted(false)
                setTestResult(null)
                setAnswers({})
              }}
            >
              Retake Test
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <Button variant="ghost" asChild className="mb-6">
        <Link to={`/courses/${courseId}`}>
          <ArrowLeft className="size-4" />
          Back to Course
        </Link>
      </Button>

      <div className="bg-white border rounded-lg p-8">
        <h1 className="text-3xl font-bold mb-2">Knowledge Test</h1>
        <p className="text-muted-foreground mb-8">
          {course?.name} - Answer all questions to complete the test
        </p>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="size-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div className="space-y-6">
          {questions.map((question, index) => (
            <div key={question.id} className="border rounded-lg p-6 bg-accent/5">
              <h3 className="font-semibold mb-4">
                {index + 1}. {question.question_text}
              </h3>

              <div className="space-y-3 mb-4">
                {question.options.map((option, optIndex) => (
                  <label
                    key={optIndex}
                    className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                      answers[question.id] === optIndex
                        ? 'bg-primary/10 border-primary'
                        : 'hover:bg-accent/20'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`question-${question.id}`}
                      checked={answers[question.id] === optIndex}
                      onChange={() => handleAnswerChange(question.id, optIndex)}
                      className="size-4"
                    />
                    <span className="flex-1">{option}</span>
                  </label>
                ))}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleUnsureClick(question.id)}
                className={answers[question.id] === -1 ? 'bg-accent' : ''}
              >
                {answers[question.id] === -1 ? '✓ ' : ''}I'm unsure
              </Button>
            </div>
          ))}
        </div>

        <div className="mt-8 pt-8 border-t">
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || Object.keys(answers).length < questions.length}
            className="w-full"
            size="lg"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Test'
            )}
          </Button>
          {Object.keys(answers).length < questions.length && (
            <p className="text-sm text-muted-foreground text-center mt-2">
              {questions.length - Object.keys(answers).length} question(s) remaining
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
