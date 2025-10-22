import React from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import SchoolEntry from './pages/SchoolEntry'
import SchoolCompetitions from './pages/SchoolCompetitions'
import GroupCompetitions from './pages/GroupCompetitions'
import CompetitionDetail from './pages/CompetitionDetail'
import TeamDashboard from './pages/TeamDashboard'
import CreateCompetition from './pages/CreateCompetition'
import UserProfile from './pages/UserProfile'

function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      {/* Landing Page */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center py-24 max-w-6xl mx-auto">
          <h1 className="text-6xl font-bold text-blue-800 mb-10 w-full">
            ReceiptRoyale
          </h1>
          <div className="flex flex-col items-center w-full mt-8">
            <p className="text-2xl text-black mb-8 max-w-2xl w-full text-center">
              Compete with your team, scan receipts, and win!
            </p>
            <p className="text-lg text-black mb-16 max-w-3xl w-full text-center leading-relaxed">
              Join exciting competitions, form teams with friends, scan your shopping receipts, 
              and earn points based on your purchases. First team to reach 50,000 points wins!
            </p>
          </div>
          
          <div className="flex gap-4 justify-center mt-10">
            <button 
              onClick={() => navigate('/profile')}
              className="bg-gold text-white px-8 py-4 rounded-lg text-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Get Started
            </button>
          </div>
        </div>


        {/* How It Works Section */}
        <div className="mt-8">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-16 pb-12">
            How It Works
          </h2>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-lg text-center border-l-4 border-yellow-500 hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-gold rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🏆</span>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-800">Find Competition</h3>
              <p className="text-gray-600">
                Browse active competitions and choose one to join
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-lg text-center border-l-4 border-blue-400 hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-blue-300 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">👥</span>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-800">Join a Team</h3>
              <p className="text-gray-600">
                Create or join a team to compete together
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-lg text-center border-l-4 border-yellow-500 hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-gold rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🧾</span>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-800">Scan Receipts</h3>
              <p className="text-gray-600">
                Upload your shopping receipts to earn points
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-lg text-center border-l-4 border-blue-400 hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-blue-300 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🎉</span>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-800">Win</h3>
              <p className="text-gray-600">
                First team to reach 50,000 points wins the competition!
              </p>
            </div>
          </div>
        </div>

        {/* Goal Callout */}
        <div className="mt-12 bg-gold-gradient rounded-2xl shadow-xl p-12 text-center text-white">
          <h2 className="text-4xl font-bold mb-6">🎯 Competition Goal</h2>
          <p className="text-2xl mb-3">First team to reach</p>
          <p className="text-5xl font-bold mb-6">50,000 Points</p>
          <p className="text-xl opacity-90 mb-4">wins the competition!</p>
          <p className="text-base mt-6 opacity-75">($1 = 1,000 points • $50 in receipts = 50,000 points)</p>
        </div>

        {/* Features Section */}
        <div className="mt-12 bg-white rounded-2xl shadow-xl p-12">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">
            Features
          </h2>
          <div className="grid md:grid-cols-2 gap-8 mt-8">
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
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/profile" element={<UserProfile />} />
      <Route path="/school" element={<SchoolEntry />} />
      <Route path="/school/:schoolName" element={<SchoolCompetitions />} />
      <Route path="/group/:groupName" element={<GroupCompetitions />} />
      <Route path="/competition/:id" element={<CompetitionDetail />} />
      <Route path="/team/:id" element={<TeamDashboard />} />
      <Route path="/create-competition/:schoolName" element={<CreateCompetition />} />
      <Route path="/create-competition" element={<CreateCompetition />} />
    </Routes>
  )
}

export default App
