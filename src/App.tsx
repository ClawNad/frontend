import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from './pages/home-page'
import AgentPage from './pages/agent-page'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/agent" element={<AgentPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
