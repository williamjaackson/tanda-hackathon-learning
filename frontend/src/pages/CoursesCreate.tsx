import { Button } from '@/components/ui/button'
import { ArrowLeft, BookOpen } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function CoursesCreate() {
  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <Button variant="ghost" asChild className="mb-6">
        <Link to="/courses">
          <ArrowLeft className="size-4" />
          Back to Courses
        </Link>
      </Button>

      <div className="bg-white border rounded-lg p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-primary/10 rounded-lg">
            <BookOpen className="size-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Create New Course</h1>
            <p className="text-muted-foreground">Add a new course to your dashboard</p>
          </div>
        </div>

        <form className="space-y-6">
          <div>
            <label htmlFor="code" className="block text-sm font-medium mb-2">
              Course Code
            </label>
            <input
              type="text"
              id="code"
              placeholder="e.g., 1004"
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-2">
              Course Name
            </label>
            <input
              type="text"
              id="name"
              placeholder="e.g., Professional ICT Practice"
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label htmlFor="semester" className="block text-sm font-medium mb-2">
              Semester
            </label>
            <input
              type="text"
              id="semester"
              placeholder="e.g., Semester 1, 2024"
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-2">
              Description
            </label>
            <textarea
              id="description"
              rows={4}
              placeholder="Enter course description..."
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1">
              Create Course
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link to="/courses">Cancel</Link>
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
