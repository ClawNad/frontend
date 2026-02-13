import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

const HomePage = lazy(() => import('./pages/home-page'))
const AgentsPage = lazy(() => import('./pages/agents-page'))
const AgentDetailPage = lazy(() => import('./pages/agent-detail-page'))
const LaunchPage = lazy(() => import('./pages/launch-page'))
const ActivityPage = lazy(() => import('./pages/activity-page'))
const CreatorPage = lazy(() => import('./pages/creator-page'))

function PageLoader() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/agents" element={<AgentsPage />} />
          <Route path="/agents/:agentId" element={<AgentDetailPage />} />
          <Route path="/launch" element={<LaunchPage />} />
          <Route path="/activity" element={<ActivityPage />} />
          <Route path="/creator/:address" element={<CreatorPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App
