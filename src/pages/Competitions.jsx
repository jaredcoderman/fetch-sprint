import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { collection, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { checkExpiredCompetitions } from '../utils/winnerDetection';

function Competitions() {
  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadCompetitions();
    // Check for expired competitions when component loads
    checkExpiredCompetitions();
    
    // Set up real-time listener for competitions
    const unsubscribe = onSnapshot(collection(db, 'competitions'), (snapshot) => {
      const comps = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCompetitions(comps);
      setLoading(false);
    });
    
    // Set up a timer to check for expired competitions every 30 seconds
    const interval = setInterval(async () => {
      await checkExpiredCompetitions();
    }, 30000);
    
    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  async function loadCompetitions() {
    try {
      const querySnapshot = await getDocs(collection(db, 'competitions'));
      const comps = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCompetitions(comps);
    } catch (err) {
      console.error('Error loading competitions:', err);
    }
    setLoading(false);
  }

  async function handleLogout() {
    try {
      await logout();
      navigate('/');
    } catch (err) {
      console.error('Failed to logout:', err);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-indigo-600">ReceiptRoyale</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">{currentUser?.email}</span>
            <button
              onClick={handleLogout}
              className="text-gray-600 hover:text-gray-900"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Active Competitions</h2>
          <p className="text-gray-600">Choose a competition to join and start scanning receipts!</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            <p className="mt-4 text-gray-600">Loading competitions...</p>
          </div>
        ) : competitions.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">🏆</div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">No Active Competitions</h3>
            <p className="text-gray-600 mb-6">
              There are no competitions available at the moment. Check back soon!
            </p>
            <button 
              onClick={() => navigate('/create-competition')}
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
            >
              Create Competition
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {competitions.map((comp) => (
              <div key={comp.id} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="text-4xl">{comp.emoji || '🏆'}</div>
                  <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                    Active
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{comp.name}</h3>
                {/* Temporarily disabled description to debug the "1" issue */}
                {/* {comp.description && comp.description.trim() && comp.description.length > 1 && comp.description !== '1' && (
                  <p className="text-gray-600 mb-4">{comp.description}</p>
                )} */}
                <div className="space-y-2 mb-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-white">Teams:</span>
                    <span className="font-semibold">{String(comp.teamCount || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Participants:</span>
                    <span className="font-semibold">{comp.participantCount || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Ends:</span>
                    <span className="font-semibold">{comp.endDate || 'TBA'}</span>
                  </div>
                  {comp.hasGoal !== false && comp.goal && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Goal:</span>
                      <span className="font-semibold">{comp.goal.toLocaleString()} points</span>
                    </div>
                  )}
                  {comp.hasGoal === false && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Goal:</span>
                      <span className="font-semibold">Highest points wins</span>
                    </div>
                  )}
                  {comp.status === 'completed' && comp.winnerTeamName && (() => {
                    const hasGoal = comp.hasGoal !== false; // Default to true for backward compatibility
                    const goal = hasGoal ? (comp.goal || 50000) : null;
                    const endPassed = comp.endDate ? new Date(comp.endDate) <= new Date() : false;
                    const reachedGoal = hasGoal && (comp.winnerPoints || 0) >= goal;
                    const effectivelyCompleted = reachedGoal || endPassed;

                    if (!effectivelyCompleted) return null; // Hide banner if not truly completed

                    return (
                      <div className="bg-gold-light border border-gold rounded-lg p-2 mt-2">
                        <p className="text-yellow-800 text-sm font-semibold text-center">
                          🏆 {
                            reachedGoal
                              ? (comp.isTied && comp.tiedTeamNames && comp.tiedTeamNames.length > 1 ? 
                                  `${comp.tiedTeamNames.join(', ')} tied for first place!` :
                                  `${comp.winnerTeamName} won the competition!`)
                              : (comp.isTied && comp.tiedTeamNames && comp.tiedTeamNames.length > 1 ? 
                                  `No one won! ${comp.tiedTeamNames.join(', ')} tied for closest with ${comp.winnerPoints.toLocaleString()} points.` :
                                  `No one won! ${comp.winnerTeamName} was the closest with ${comp.winnerPoints.toLocaleString()} points.`)
                          }
                        </p>
                      </div>
                    );
                  })()}
                </div>
                <button
                  onClick={() => navigate(`/competition/${comp.id}`)}
                  className="w-full bg-blue-shiny text-white py-2 rounded-lg font-semibold hover:bg-blue-shiny transition-colors"
                >
                  View Details
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Competitions;

