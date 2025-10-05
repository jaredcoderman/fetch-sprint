import React from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Login from './pages/Login'
import Competitions from './pages/Competitions'
import CompetitionDetail from './pages/CompetitionDetail'
import TeamDashboard from './pages/TeamDashboard'
import CreateCompetition from './pages/CreateCompetition'
import Settings from './pages/Settings'

function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Landing Page */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center py-20">
          <h1 className="text-6xl font-bold text-gray-900 mb-6">
            Receipt Sprint
          </h1>
          <p className="text-2xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Compete with your team, scan receipts, and win prizes!
          </p>
          <p className="text-lg text-gray-500 mb-12 max-w-3xl mx-auto">
            Join exciting competitions, form teams with friends, scan your shopping receipts, 
            and earn points based on your purchases. The team with the most points wins!
          </p>
          
          <div className="flex gap-4 justify-center">
            <button 
              onClick={() => navigate('/login')}
              className="bg-indigo-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-indigo-700 transition-colors shadow-lg hover:shadow-xl"
            >
              Get Started
            </button>
            <button 
              onClick={() => navigate('/competitions')}
              className="bg-white text-indigo-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-50 transition-colors shadow-lg hover:shadow-xl border-2 border-indigo-600"
            >
              View Competitions
            </button>
          </div>
        </div>

        {/* How It Works Section */}
        <div className="mt-24">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-16">
            How It Works
          </h2>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-lg text-center">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🏆</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Find Competition</h3>
              <p className="text-gray-600">
                Browse active competitions and choose one to join
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-lg text-center">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">👥</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Join a Team</h3>
              <p className="text-gray-600">
                Create or join a team to compete together
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-lg text-center">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🧾</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Scan Receipts</h3>
              <p className="text-gray-600">
                Upload your shopping receipts to earn points
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-lg text-center">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🎉</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Win Prizes</h3>
              <p className="text-gray-600">
                Team with most points wins the competition!
              </p>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-24 bg-white rounded-2xl shadow-xl p-12">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">
            Features
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="flex items-start space-x-4">
              <div className="text-2xl">✅</div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Real-time Leaderboards</h3>
                <p className="text-gray-600">
                  Track your team's progress and see live rankings
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="text-2xl">✅</div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Easy Receipt Scanning</h3>
                <p className="text-gray-600">
                  Quick and simple receipt upload with photo capture
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="text-2xl">✅</div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Team Management</h3>
                <p className="text-gray-600">
                  Create teams, invite members, and compete together
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="text-2xl">✅</div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Multiple Competitions</h3>
                <p className="text-gray-600">
                  Participate in various competitions simultaneously
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/competitions" element={<Competitions />} />
        <Route path="/competition/:id" element={<CompetitionDetail />} />
        <Route path="/team/:id" element={<TeamDashboard />} />
        <Route path="/create-competition" element={<CreateCompetition />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </AuthProvider>
  )
}

export default App
