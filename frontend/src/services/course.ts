const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'

export interface Course {
  id: number
  name: string
  code: string
  description?: string
}

export interface CreateCourseData {
  name: string
  code: string
  description?: string
}

export class CourseService {
  static async getCourses(): Promise<Course[]> {
    const response = await fetch(`${API_URL}/api/courses/`, {
      method: 'GET',
      credentials: 'include', // Include cookies for authentication
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to fetch courses')
    }

    return response.json()
  }

  static async getCourse(courseId: number): Promise<Course> {
    const response = await fetch(`${API_URL}/api/courses/${courseId}`, {
      method: 'GET',
      credentials: 'include', // Include cookies for authentication
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to fetch course')
    }

    return response.json()
  }

  static async createCourse(data: CreateCourseData): Promise<{ id: number }> {
    const response = await fetch(`${API_URL}/api/courses/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Include cookies for authentication
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to create course')
    }

    return response.json()
  }

  static async deleteCourse(courseId: number): Promise<void> {
    const response = await fetch(`${API_URL}/api/courses/${courseId}`, {
      method: 'DELETE',
      credentials: 'include', // Include cookies for authentication
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to delete course')
    }
  }
}
