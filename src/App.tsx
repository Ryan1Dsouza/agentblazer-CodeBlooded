import { useState, lazy, Suspense, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './hooks/useTheme'
import MainLayout from './layouts/MainLayout'
import LoadingScreen from './components/LoadingScreen'

const Home = lazy(() => import('./pages/Home'))
const About = lazy(() => import('./pages/About'))
const Events = lazy(() => import('./pages/Events'))
const Join = lazy(() => import('./pages/Join'))
const Community = lazy(() => import('./pages/Community'))
const AdminGate = lazy(() => import('./components/community/AdminGate'))

function App() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (window as any).isAppLoading = loading;
  }, [loading])

  return (
    <ThemeProvider>
      {loading && <LoadingScreen onComplete={() => setLoading(false)} />}
      <MainLayout>
        <Suspense fallback={null}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/events" element={<Events />} />
            <Route path="/join" element={<Join />} />
            <Route path="/community" element={<Community />} />
            <Route path="/admin" element={<AdminGate />} />
          </Routes>
        </Suspense>
      </MainLayout>
    </ThemeProvider>
  )
}

export default App
