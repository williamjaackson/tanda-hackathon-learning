import { Button } from '@/components/ui/button'
import { Plus, BookOpen } from 'lucide-react'
import { Link } from 'react-router-dom'

// Mock data for courses
const courses = [
  {
    id: 1,
    code: '1004ICT',
    name: 'Professional ICT Practice',
    progress: 65,
  },
  {
    id: 2,
    code: '2107ICT',
    name: 'Database Systems',
    progress: 45,
  },
  {
    id: 3,
    code: '3305ICT',
    name: 'Software Engineering',
    progress: 80,
  },
]

export default function Courses() {
  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">My Courses</h1>
          <p className="text-muted-foreground">
            Manage and track your enrolled courses
          </p>
        </div>
        <Button asChild size="lg">
          <Link to="/courses/create">
            <Plus className="size-5" />
            Create Course
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <div
            key={course.id}
            className="bg-white border rounded-lg p-6 cursor-pointer hover:-translate-y-1 transition-all hover:shadow-md"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <BookOpen className="size-5 text-primary" />
                </div>
                <div>
                  <div className="font-mono text-sm text-muted-foreground">
                    {course.code}
                  </div>
                  <h3 className="font-semibold text-lg">{course.name}</h3>
                </div>
              </div>
            </div>
            <div className="mb-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-semibold">{course.progress}%</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div
                  className="bg-primary rounded-full h-2 transition-all"
                  style={{ width: `${course.progress}%` }}
                />
              </div>
            </div>

            <Button variant="outline" className="w-full">
              View Course
            </Button>
          </div>
        ))}
      </div>

      {courses.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="size-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No courses yet</h3>
          <p className="text-muted-foreground mb-4">
            Get started by creating your first course
          </p>
          <Button asChild>
            <Link to="/courses/create">
              <Plus className="size-5" />
              Create Course
            </Link>
          </Button>
        </div>
      )}
    </div>
  )
}
