import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import Layout from './components/Layout'
import Home from './pages/Home'
import Courses from './pages/Courses'
import CoursesCreate from './pages/CoursesCreate'
import CourseDetail from './pages/CourseDetail'
import CourseTest from './pages/CourseTest'
import ModuleLesson from './pages/ModuleLesson'
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
        element: <Courses />,
      },
      {
        path: 'courses/create',
        element: <CoursesCreate />,
      },
      {
        path: 'courses/:courseId',
        element: <CourseDetail />,
      },
      {
        path: 'courses/:courseId/modules/:moduleIndex',
        element: <ModuleLesson />,
      },
      {
        path: 'courses/:courseId/test',
        element: <CourseTest />,
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
