const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'

export interface TestQuestion {
  id: number
  module_index: number
  question_text: string
  options: string[]
}

export interface AnswerSubmission {
  question_id: number
  selected_option_index: number  // -1 for "I'm unsure"
}

export interface TestSubmission {
  answers: AnswerSubmission[]
}

export interface ModuleResult {
  total: number
  correct: number
}

export interface TestResult {
  attempt_id: number
  module_results: Record<number, ModuleResult>
  passed_modules: number[]
}

export interface TestStatus {
  has_completed: boolean
  passed_modules: number[]
  module_results?: Record<number, ModuleResult>
}

export class TestService {
  static async getTestQuestions(courseId: number): Promise<TestQuestion[]> {
    const response = await fetch(`${API_URL}/api/tests/${courseId}/questions`, {
      method: 'GET',
      credentials: 'include',
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to fetch test questions')
    }

    return response.json()
  }

  static async startTestAttempt(courseId: number): Promise<{ attempt_id: number }> {
    const response = await fetch(`${API_URL}/api/tests/${courseId}/start`, {
      method: 'POST',
      credentials: 'include',
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to start test attempt')
    }

    return response.json()
  }

  static async submitTest(courseId: number, submission: TestSubmission): Promise<TestResult> {
    const response = await fetch(`${API_URL}/api/tests/${courseId}/submit`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(submission),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to submit test')
    }

    return response.json()
  }

  static async getTestStatus(courseId: number): Promise<TestStatus> {
    const response = await fetch(`${API_URL}/api/tests/${courseId}/status`, {
      method: 'GET',
      credentials: 'include',
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to fetch test status')
    }

    return response.json()
  }
}
