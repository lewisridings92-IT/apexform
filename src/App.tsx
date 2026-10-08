import { createHashRouter, RouterProvider } from 'react-router'
import { Layout } from './components/Layout'
import { Anchors } from './pages/Anchors'
import { Dashboard } from './pages/Dashboard'
import { History } from './pages/History'
import { Onboarding } from './pages/Onboarding'
import { Plan } from './pages/Plan'
import { Settings } from './pages/Settings'

// Hash routes (#/plan) so GitHub Pages never 404s on a page refresh.
const router = createHashRouter([
  { path: 'onboarding', element: <Onboarding /> },
  {
    // Sends the user to onboarding until a profile is saved.
    element: <Layout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'anchors', element: <Anchors /> },
      { path: 'plan', element: <Plan /> },
      { path: 'history', element: <History /> },
      { path: 'settings', element: <Settings /> },
    ],
  },
])

export default function App() {
  return <RouterProvider router={router} />
}
