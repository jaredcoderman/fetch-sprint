import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, getDocs, query, where, orderBy, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { checkExpiredCompetitions } from '../utils/winnerDetection';

function GroupCompetitions() {
  const { groupName } = useParams();
  const navigate = useNavigate();
  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [groupData, setGroupData] = useState(null);
  const [competitionPoints, setCompetitionPoints] = useState({});
  const [competitionParticipants, setCompetitionParticipants] = useState({});

  function handleChangeGroup() {
    // Clear only the group from localStorage, keep other profile info
    const savedProfile = localStorage.getItem('userProfile');
    if (savedProfile) {
      const profile = JSON.parse(savedProfile);
      // Remove only the groupName, keep firstName, lastName, email, etc.
      const { groupName, ...profileWithoutGroup } = profile;
      localStorage.setItem('userProfile', JSON.stringify(profileWithoutGroup));
    }
    // Redirect to group selection with changeGroup parameter
    navigate('/profile?changeGroup=true');
  }

  useEffect(() => {
    loadGroupData();
    loadCompetitions();
    // Check for expired competitions when component loads
    checkExpiredCompetitions();
    
    // Set up a timer to check for expired competitions every 30 seconds
    const interval = setInterval(async () => {
      await checkExpiredCompetitions();
      // Reload competitions to show updated winner info
      loadCompetitions();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [groupName]);

  useEffect(() => {
    if (competitions.length > 0) {
      loadCompetitionPoints();
    }
  }, [competitions]);

  async function loadGroupData() {
    try {
      // For groups, we don't need to create group entries like we do for schools
      // Just set basic group data
      setGroupData({ 
        name: groupName,
        competitionCount: 0,
        participantCount: 0
      });
    } catch (err) {
      console.error('Error loading group data:', err);
      // Fallback: set basic data
      setGroupData({ 
        name: groupName,
        competitionCount: 0,
        participantCount: 0
      });
    }
  }

  async function loadCompetitions() {
    try {
      // Only show competitions for this specific group
      const groupCompetitionsQuery = query(
        collection(db, 'competitions'),
        where('groupName', '==', groupName)
      );
      
      const competitionsSnapshot = await getDocs(groupCompetitionsQuery);
      const comps = competitionsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data
        };
      });
      
      // Sort by creation date
      comps.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0);
        const dateB = new Date(b.createdAt || 0);
        return dateB - dateA;
      });
      
      setCompetitions(comps);
    } catch (err) {
      console.error('Error loading competitions:', err);
      setCompetitions([]);
    }
    setLoading(false);
  }

  async function loadCompetitionPoints() {
    try {
      const pointsData = {};
      const participantsData = {};
      
      for (const comp of competitions) {
        // Get all teams for this competition
        const teamsQuery = query(
          collection(db, 'teams'),
          where('competitionId', '==', comp.id)
        );
        const teamsSnapshot = await getDocs(teamsQuery);
        
        let totalPoints = 0;
        let totalParticipants = 0;
        
        teamsSnapshot.forEach(teamDoc => {
          const teamData = teamDoc.data();
          totalPoints += teamData.totalPoints || 0;
          // Count unique participants across all teams
          if (teamData.memberEmails) {
            totalParticipants += teamData.memberEmails.length;
          }
        });
        
        pointsData[comp.id] = totalPoints;
        participantsData[comp.id] = totalParticipants;
      }
      
      setCompetitionPoints(pointsData);
      setCompetitionParticipants(participantsData);
    } catch (err) {
      console.error('Error loading competition points:', err);
    }
  }

  function handleCreateCompetition() {
    navigate('/create-competition');
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-100 to-blue-200 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading competitions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-shiny-gradient">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center">
          <div className="flex-1">
            <button 
              onClick={handleChangeGroup}
              className="text-yellow-700 hover:text-yellow-800 font-medium"
            >
              ← Change Group
            </button>
          </div>
          <div className="flex-1 text-center">
            <h1 className="text-2xl font-bold text-yellow-700">ReceiptRoyale</h1>
          </div>
          <div className="flex-1"></div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Group Header */}
        <div className="bg-white text-black rounded-xl shadow-lg p-8 mb-8 text-center border-2 border-yellow-300">
          <h2 className="text-4xl font-bold mb-2 text-black">{groupName}</h2>
          <p className="text-xl text-yellow-700 font-semibold">ReceiptRoyale Competitions</p>
        </div>

        {/* Create Competition Button */}
        <div className="text-center mb-8">
          <button
            onClick={handleCreateCompetition}
            className="bg-gold text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors shadow-lg hover:shadow-xl"
          >
            + Create New Competition
          </button>
        </div>

        {/* Competitions List */}
        {competitions.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">🏆</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">No Competitions Yet</h3>
            <p className="text-gray-600 mb-8">
              Be the first to create a competition for {groupName}!
            </p>
            <button
              onClick={handleCreateCompetition}
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
            >
              Create First Competition
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
            {competitions
              .sort((a, b) => {
                const hasGoalA = a.hasGoal !== false; // Default to true for backward compatibility
                const hasGoalB = b.hasGoal !== false;
                const goalA = hasGoalA ? (a.goal || 50000) : null;
                const goalB = hasGoalB ? (b.goal || 50000) : null;
                const endPassedA = a.endDate ? new Date(a.endDate) <= new Date() : false;
                const endPassedB = b.endDate ? new Date(b.endDate) <= new Date() : false;
                const effectivelyCompletedA = a.status === 'completed' && (
                  (hasGoalA && (a.winnerPoints || 0) >= goalA) || 
                  (!hasGoalA && endPassedA) || 
                  endPassedA
                );
                const effectivelyCompletedB = b.status === 'completed' && (
                  (hasGoalB && (b.winnerPoints || 0) >= goalB) || 
                  (!hasGoalB && endPassedB) || 
                  endPassedB
                );

                // Sort effectively completed competitions to the bottom
                if (effectivelyCompletedA && !effectivelyCompletedB) return 1;
                if (!effectivelyCompletedA && effectivelyCompletedB) return -1;

                // If both are effectively completed, sort by completion date (newest first)
                if (effectivelyCompletedA && effectivelyCompletedB) {
                  const dateA = new Date(a.completedAt || 0);
                  const dateB = new Date(b.completedAt || 0);
                  return dateB - dateA;
                }

                return 0;
              })
              .map((comp) => (
              <div key={comp.id} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow flex flex-col">
                <div className="text-center mb-4">
                  <div className="text-4xl mb-2">{comp.emoji || '🏆'}</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{comp.name}</h3>
                  {(() => {
                    const hasGoal = comp.hasGoal !== false; // Default to true for backward compatibility
                    const goal = hasGoal ? (comp.goal || 50000) : null;
                    const endPassed = comp.endDate ? new Date(comp.endDate) <= new Date() : false;
                    const effectivelyCompleted = comp.status === 'completed' && (
                      (hasGoal && (comp.winnerPoints || 0) >= goal) || 
                      (!hasGoal && endPassed) || 
                      endPassed
                    );
                    return (
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        effectivelyCompleted
                          ? 'bg-gray-100 text-gray-700'
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {effectivelyCompleted ? 'Completed' : 'Active'}
                      </span>
                    );
                  })()}
                </div>
                <div className="space-y-2 mb-4 text-sm text-center flex-grow">
                  <div className="flex justify-center gap-4">
                    <span className="text-gray-500">Teams:</span>
                    <span className="font-semibold">{comp.teamCount || 0}</span>
                  </div>
                  <div className="flex justify-center gap-4">
                    <span className="text-gray-500">Participants:</span>
                    <span className="font-semibold">{competitionParticipants[comp.id] || 0}</span>
                  </div>
                  <div className="flex justify-center gap-4">
                    <span className="text-gray-500">Ends:</span>
                    <span className="font-semibold">{comp.endDate || 'TBA'}</span>
                  </div>
                </div>
                {comp.status === 'completed' && comp.winnerTeamName && (() => {
                  const hasGoal = comp.hasGoal !== false; // Default to true for backward compatibility
                  const goal = hasGoal ? (comp.goal || 50000) : null;
                  const endPassed = comp.endDate ? new Date(comp.endDate) <= new Date() : false;
                  const reachedGoal = hasGoal && (comp.winnerPoints || 0) >= goal;
                  const effectivelyCompleted = reachedGoal || endPassed;

                  if (!effectivelyCompleted) return null; // Hide banner if not truly completed

                  return (
                    <div className="bg-gold-light border border-gold rounded-lg p-2 mb-4">
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
                <button
                  onClick={() => navigate(`/competition/${comp.id}`)}
                  className="w-full bg-blue-shiny text-white py-2 rounded-lg font-semibold hover:bg-blue-shiny transition-colors"
                >
                  View Competition
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default GroupCompetitions;