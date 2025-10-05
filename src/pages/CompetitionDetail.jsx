import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { doc, getDoc, collection, query, where, getDocs, addDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../firebase';

function CompetitionDetail() {
  const { id } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [competition, setCompetition] = useState(null);
  const [teams, setTeams] = useState([]);
  const [userTeam, setUserTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');

  useEffect(() => {
    loadCompetitionData();
  }, [id]);

  async function loadCompetitionData() {
    try {
      // Load competition
      const compDoc = await getDoc(doc(db, 'competitions', id));
      if (compDoc.exists()) {
        setCompetition({ id: compDoc.id, ...compDoc.data() });
      }

      // Load teams
      const teamsQuery = query(collection(db, 'teams'), where('competitionId', '==', id));
      const teamsSnapshot = await getDocs(teamsQuery);
      const teamsData = teamsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTeams(teamsData);

      // Check if user is in a team
      const userTeamData = teamsData.find(team => team.members?.includes(currentUser?.uid));
      setUserTeam(userTeamData);
    } catch (err) {
      console.error('Error loading competition:', err);
    }
    setLoading(false);
  }

  async function handleCreateTeam() {
    if (!newTeamName.trim()) return;
    
    try {
      const teamData = {
        name: newTeamName,
        competitionId: id,
        members: [currentUser.uid],
        memberEmails: [currentUser.email],
        totalPoints: 0,
        receiptsCount: 0,
        createdAt: new Date().toISOString(),
        createdBy: currentUser.uid
      };

      const teamRef = await addDoc(collection(db, 'teams'), teamData);
      
      // Update competition team count
      await updateDoc(doc(db, 'competitions', id), {
        teamCount: (competition.teamCount || 0) + 1,
        participantCount: (competition.participantCount || 0) + 1
      });

      setShowCreateTeam(false);
      setNewTeamName('');
      loadCompetitionData();
    } catch (err) {
      console.error('Error creating team:', err);
      alert('Failed to create team. Please try again.');
    }
  }

  async function handleJoinTeam(teamId) {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    try {
      await updateDoc(doc(db, 'teams', teamId), {
        members: arrayUnion(currentUser.uid),
        memberEmails: arrayUnion(currentUser.email)
      });

      // Update competition participant count
      await updateDoc(doc(db, 'competitions', id), {
        participantCount: (competition.participantCount || 0) + 1
      });

      loadCompetitionData();
    } catch (err) {
      console.error('Error joining team:', err);
      alert('Failed to join team. Please try again.');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!competition) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Competition Not Found</h2>
          <button onClick={() => navigate('/competitions')} className="text-indigo-600 hover:text-indigo-700">
            ← Back to Competitions
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <button onClick={() => navigate('/competitions')} className="text-indigo-600 hover:text-indigo-700 font-medium">
            ← Back
          </button>
          <h1 className="text-2xl font-bold text-indigo-600">Receipt Sprint</h1>
          <div className="w-20"></div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Competition Header */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <span className="text-5xl">{competition.emoji || '🏆'}</span>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{competition.name}</h1>
                  <p className="text-gray-600 mt-1">{competition.description}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-6 mt-6">
                <div>
                  <p className="text-gray-500 text-sm">Teams</p>
                  <p className="text-2xl font-bold text-gray-900">{teams.length}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Participants</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {teams.reduce((sum, team) => sum + (team.members?.length || 0), 0)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Status</p>
                  <span className="inline-block bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium mt-1">
                    Active
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* User's Team Status */}
        {userTeam ? (
          <div className="bg-indigo-600 text-white rounded-xl shadow-lg p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-indigo-200 mb-1">You're on Team</p>
                <h3 className="text-2xl font-bold">{userTeam.name}</h3>
                <p className="text-indigo-200 mt-2">
                  {userTeam.members?.length || 0} members • {userTeam.totalPoints || 0} points
                </p>
              </div>
              <button
                onClick={() => navigate(`/team/${userTeam.id}`)}
                className="bg-white text-indigo-600 px-6 py-3 rounded-lg font-semibold hover:bg-indigo-50 transition-colors"
              >
                View Team Dashboard
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6 mb-8">
            <p className="text-yellow-800 font-medium">
              ⚠️ You haven't joined a team yet. Create or join a team to start competing!
            </p>
          </div>
        )}

        {/* Teams List */}
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Teams</h2>
          {!userTeam && (
            <button
              onClick={() => setShowCreateTeam(true)}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
            >
              + Create Team
            </button>
          )}
        </div>

        {/* Create Team Modal */}
        {showCreateTeam && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-xl p-8 max-w-md w-full">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Create New Team</h3>
              <input
                type="text"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                placeholder="Enter team name"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none mb-4"
              />
              <div className="flex gap-3">
                <button
                  onClick={handleCreateTeam}
                  className="flex-1 bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
                >
                  Create
                </button>
                <button
                  onClick={() => {
                    setShowCreateTeam(false);
                    setNewTeamName('');
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Teams Grid */}
        {teams.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="text-5xl mb-4">👥</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Teams Yet</h3>
            <p className="text-gray-600">Be the first to create a team!</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teams.map((team) => (
              <div key={team.id} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900">{team.name}</h3>
                  <span className="text-2xl">🎯</span>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Members:</span>
                    <span className="font-semibold">{team.members?.length || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Total Points:</span>
                    <span className="font-semibold text-indigo-600">{team.totalPoints || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Receipts:</span>
                    <span className="font-semibold">{team.receiptsCount || 0}</span>
                  </div>
                </div>

                {userTeam?.id === team.id ? (
                  <button
                    onClick={() => navigate(`/team/${team.id}`)}
                    className="w-full bg-indigo-100 text-indigo-700 py-2 rounded-lg font-semibold"
                  >
                    Your Team
                  </button>
                ) : !userTeam ? (
                  <button
                    onClick={() => handleJoinTeam(team.id)}
                    className="w-full bg-indigo-600 text-white py-2 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
                  >
                    Join Team
                  </button>
                ) : (
                  <button
                    disabled
                    className="w-full bg-gray-200 text-gray-500 py-2 rounded-lg font-semibold cursor-not-allowed"
                  >
                    Already on a Team
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Leaderboard Preview */}
        {teams.length > 0 && (
          <div className="mt-8 bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">🏆 Leaderboard</h2>
            <div className="space-y-3">
              {teams
                .sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0))
                .slice(0, 5)
                .map((team, index) => (
                  <div key={team.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <span className="text-2xl font-bold text-gray-400 w-8">#{index + 1}</span>
                      <div>
                        <p className="font-semibold text-gray-900">{team.name}</p>
                        <p className="text-sm text-gray-500">{team.members?.length || 0} members</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-indigo-600">{team.totalPoints || 0}</p>
                      <p className="text-sm text-gray-500">points</p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CompetitionDetail;

