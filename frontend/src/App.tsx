import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Home from './pages/Home'
import Courses from './pages/Courses'
import CoursesCreate from './pages/CoursesCreate'
import CourseDetail from './pages/CourseDetail'
import CourseTest from './pages/CourseTest'
import ModuleLesson from './pages/ModuleLesson'
import ModuleTest from './pages/ModuleTest'
import ModuleView from './pages/ModuleView'
import Leaderboard from './pages/Leaderboard'
import Login from './pages/Login'
import Signup from './pages/Signup'

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: 'courses',
        element: (
          <ProtectedRoute>
            <Courses />
          </ProtectedRoute>
        ),
      },
      {
        path: 'courses/create',
        element: (
          <ProtectedRoute>
            <CoursesCreate />
          </ProtectedRoute>
        ),
      },
      {
        path: 'courses/:courseId',
        element: (
          <ProtectedRoute>
            <CourseDetail />
          </ProtectedRoute>
        ),
      },
      {
        path: 'courses/:courseId/modules/:moduleIndex/test',
        element: (
          <ProtectedRoute>
            <ModuleTest />
          </ProtectedRoute>
        ),
      },
      {
        path: 'courses/:courseId/modules/:moduleIndex/view',
        element: <ModuleView />,
      },
      {
        path: 'courses/:courseId/modules/:moduleIndex',
        element: (
          <ProtectedRoute>
            <ModuleLesson />
          </ProtectedRoute>
        ),
      },
      {
        path: 'courses/:courseId/test',
        element: (
          <ProtectedRoute>
            <CourseTest />
          </ProtectedRoute>
        ),
      },
      {
        path: 'leaderboard',
        element: (
          <ProtectedRoute>
            <Leaderboard />
          </ProtectedRoute>
        ),
      },
      {
        path: 'login',
        element: <Login />,
      },
      {
        path: 'signup',
        element: <Signup />,
      },
    ],
  },
])

function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  )
}

export default App
