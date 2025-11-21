const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'

export interface CourseModule {
  name: string
  content: string
  prerequisites?: number[]
}

export interface Course {
  id: number
  name: string
  code: string
  description?: string
  modules?: CourseModule[]
  modules_status?: 'pending' | 'generating' | 'completed' | 'error'
  modules_error?: string
}

export interface CreateCourseData {
  name: string
  code: string
  description?: string
}

export interface CoursePDF {
  id: number
  filename: string
  summary: string | null
  created_at: string
}

export interface ModuleLesson {
  lesson_content: string
  video_url: string | null
  video_status: 'pending' | 'generating' | 'completed' | 'error'
  video_error?: string
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

  static async createCourse(data: CreateCourseData, files: File[] = []): Promise<{ id: number }> {
    const formData = new FormData()
    formData.append('name', data.name)
    formData.append('code', data.code)
    if (data.description) {
      formData.append('description', data.description)
    }

    // Append all PDF files
    files.forEach(file => {
      formData.append('files', file)
    })

    const response = await fetch(`${API_URL}/api/courses/`, {
      method: 'POST',
      credentials: 'include', // Include cookies for authentication
      body: formData, // Don't set Content-Type header - browser sets it with boundary
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to create course')
    }

    return response.json()
  }

  static async getCoursePDFs(courseId: number): Promise<CoursePDF[]> {
    const response = await fetch(`${API_URL}/api/courses/${courseId}/pdfs`, {
      method: 'GET',
      credentials: 'include', // Include cookies for authentication
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to fetch course PDFs')
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

  static async retryModuleGeneration(courseId: number): Promise<void> {
    const response = await fetch(`${API_URL}/api/courses/${courseId}/retry-modules`, {
      method: 'POST',
      credentials: 'include', // Include cookies for authentication
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to retry module generation')
    }
  }

  static async getModuleLesson(courseId: number, moduleIndex: number): Promise<ModuleLesson> {
    const response = await fetch(`${API_URL}/api/courses/${courseId}/modules/${moduleIndex}/lesson`, {
      method: 'GET',
      credentials: 'include', // Include cookies for authentication
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to fetch module lesson')
    }

    return response.json()
  }

  static async retryVideoGeneration(courseId: number, moduleIndex: number): Promise<void> {
    const response = await fetch(`${API_URL}/api/courses/${courseId}/modules/${moduleIndex}/retry-video`, {
      method: 'POST',
      credentials: 'include', // Include cookies for authentication
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to retry video generation')
    }
  }
}
