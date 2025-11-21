import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Courses from './pages/Courses'
import CoursesCreate from './pages/CoursesCreate'

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
    ],
  },
])

function App() {
  return <RouterProvider router={router} />
}

export default App
