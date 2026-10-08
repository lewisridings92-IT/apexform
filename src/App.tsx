import { createHashRouter, RouterProvider } from 'react-router'
import { Layout } from './components/Layout'
import { Dashboard } from './pages/Dashboard'
import { History } from './pages/History'
import { Plan } from './pages/Plan'
import { Settings } from './pages/Settings'

// Hash routes (#/plan) so GitHub Pages never 404s on a page refresh.
const router = createHashRouter([
  {
    element: <Layout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'plan', element: <Plan /> },
      { path: 'history', element: <History /> },
      { path: 'settings', element: <Settings /> },
    ],
  },
])

export default function App() {
  return <RouterProvider router={router} />
}
