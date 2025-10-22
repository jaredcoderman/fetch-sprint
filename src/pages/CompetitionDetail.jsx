import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, addDoc, updateDoc, arrayUnion, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import ProfilePicture from '../components/ProfilePicture';
import { checkExpiredCompetitions } from '../utils/winnerDetection';

function CompetitionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [competition, setCompetition] = useState(null);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [showJoinTeam, setShowJoinTeam] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState(null);
  const [newTeamName, setNewTeamName] = useState('');
  const [userProfile, setUserProfile] = useState(null);
  const [joinedTeamId, setJoinedTeamId] = useState(null);
  const [isUserInTeam, setIsUserInTeam] = useState(false);

  useEffect(() => {
    loadUserProfile();
    loadCompetitionData();
    // Check for expired competitions when component loads
    checkExpiredCompetitions();
    
    // Set up real-time listener for competition updates
    const unsubscribeCompetition = onSnapshot(doc(db, 'competitions', id), (doc) => {
      if (doc.exists()) {
        setCompetition({ id: doc.id, ...doc.data() });
      }
    });
    
    // Set up real-time listener for teams updates
    const teamsQuery = query(collection(db, 'teams'), where('competitionId', '==', id));
    const unsubscribeTeams = onSnapshot(teamsQuery, (snapshot) => {
      const teamsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTeams(teamsData.sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0)));
    });
    
    // Set up a timer to check for expired competitions every 30 seconds
    const interval = setInterval(async () => {
      await checkExpiredCompetitions();
    }, 30000);
    
    return () => {
      unsubscribeCompetition();
      unsubscribeTeams();
      clearInterval(interval);
    };
  }, [id]);

  useEffect(() => {
    if (userProfile) {
      checkIfUserInTeam();
    }
  }, [userProfile, teams]);

  function loadUserProfile() {
    const savedProfile = localStorage.getItem('userProfile');
    if (savedProfile) {
      setUserProfile(JSON.parse(savedProfile));
    }
  }

  async function checkIfUserInTeam() {
    if (!userProfile?.email) return;
    
    try {
      // Check if user is already in any team for this competition
      const teamsQuery = query(
        collection(db, 'teams'), 
        where('competitionId', '==', id),
        where('memberEmails', 'array-contains', userProfile.email)
      );
      const teamsSnapshot = await getDocs(teamsQuery);
      setIsUserInTeam(!teamsSnapshot.empty);
    } catch (error) {
      console.error('Error checking if user is in team:', error);
      setIsUserInTeam(false);
    }
  }

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
    } catch (err) {
      console.error('Error loading competition:', err);
    }
    setLoading(false);
  }

  async function handleCreateTeam() {
    if (!newTeamName.trim()) {
      alert('Please enter a team name');
      return;
    }

    if (isUserInTeam) {
      alert('You are already part of a team in this competition. You cannot create another team.');
      return;
    }
    
    try {
      const teamData = {
        name: newTeamName,
        competitionId: id,
        members: [], // Start with empty members
        memberEmails: [],
        memberNames: [],
        totalPoints: 0,
        receiptsCount: 0,
        createdAt: new Date().toISOString(),
        createdBy: 'anonymous'
      };

      const teamRef = await addDoc(collection(db, 'teams'), teamData);
      
      // Update competition team count
      await updateDoc(doc(db, 'competitions', id), {
        teamCount: (competition.teamCount || 0) + 1
      });

      alert(`Team "${newTeamName}" created successfully! You can now join it or let others join.`);
      setShowCreateTeam(false);
      setNewTeamName('');
      loadCompetitionData();
    } catch (err) {
      console.error('Error creating team:', err);
      alert('Failed to create team. Please try again.');
    }
  }

  function handleJoinTeamClick(teamId) {
    if (!userProfile) {
      alert('Please create your profile first by clicking "Get Started" on the homepage. You can choose to save your profile for convenience.');
      navigate('/profile');
      return;
    }
    setSelectedTeamId(teamId);
    setShowJoinTeam(true);
  }

  async function handleJoinTeam() {
    if (!userProfile) {
      alert('Please create your profile first.');
      navigate('/profile');
      return;
    }

    try {
      // Check if email is already in any team in this competition
      const userAlreadyInTeam = teams.find(team => 
        team.memberEmails && team.memberEmails.includes(userProfile.email)
      );
      
      if (userAlreadyInTeam) {
        alert(`You are already a member of the "${userAlreadyInTeam.name}" team. You can only join one team per competition.`);
        return;
      }

      // Check if email is already in the specific team they're trying to join
      const teamToJoin = teams.find(team => team.id === selectedTeamId);
      if (teamToJoin && teamToJoin.memberEmails && teamToJoin.memberEmails.includes(userProfile.email)) {
        alert('This email is already in the team. Please use a different email address.');
        return;
      }

      await updateDoc(doc(db, 'teams', selectedTeamId), {
        members: arrayUnion(userProfile.email),
        memberEmails: arrayUnion(userProfile.email),
        memberNames: arrayUnion(userProfile.name)
      });

      // Update competition participant count
      await updateDoc(doc(db, 'competitions', id), {
        participantCount: (competition.participantCount || 0) + 1
      });

      alert(`Successfully joined team!`);
      setJoinedTeamId(selectedTeamId);
      setShowJoinTeam(false);
      setSelectedTeamId(null);
      loadCompetitionData();
    } catch (err) {
      console.error('Error joining team:', err);
      alert('Failed to join team. Please try again.');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-100 to-blue-200 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!competition) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-100 to-blue-200 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Competition Not Found</h2>
          <button 
            onClick={() => {
              if (competition?.schoolName) {
                navigate(`/school/${encodeURIComponent(competition.schoolName)}`);
              } else if (competition?.groupName) {
                navigate(`/group/${encodeURIComponent(competition.groupName)}`);
              } else {
                navigate('/');
              }
            }}
            className="text-yellow-700 hover:text-yellow-800"
          >
            ← Back to {competition?.schoolName || competition?.groupName || 'Home'}
          </button>
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
              onClick={() => {
                if (competition?.schoolName) {
                  navigate(`/school/${encodeURIComponent(competition.schoolName)}`);
                } else if (competition?.groupName) {
                  navigate(`/group/${encodeURIComponent(competition.groupName)}`);
                } else {
                  navigate('/');
                }
              }}
              className="text-yellow-700 hover:text-yellow-800 font-medium"
            >
              ← Back to {competition?.schoolName || competition?.groupName || 'Home'}
            </button>
          </div>
          <div className="flex-1 text-center">
            <h1 className="text-2xl font-bold text-yellow-700">ReceiptRoyale</h1>
          </div>
          <div className="flex-1"></div>
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
                  {(() => {
                    const hasGoal = competition.hasGoal !== false; // Default to true for backward compatibility
                    const goal = hasGoal ? (competition.goal || 50000) : null;
                    const endPassed = competition.endDate ? new Date(competition.endDate) <= new Date() : false;
                    const effectivelyCompleted = competition.status === 'completed' && (
                      (hasGoal && (competition.winnerPoints || 0) >= goal) || 
                      (!hasGoal && endPassed) || 
                      endPassed
                    );
                    const label = effectivelyCompleted ? 'Completed' : 'Active';
                    const classes = effectivelyCompleted ? 'bg-gray-100 text-gray-700' : 'bg-green-100 text-green-700';
                    return (
                      <span className={`inline-block ${classes} px-3 py-1 rounded-full text-sm font-medium mt-1`}>
                        {label}
                      </span>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Leader Banner */}
        {teams.length > 0 && (
          <div className="bg-gold text-white rounded-xl shadow-lg p-6 mb-8">
            <div className="text-center">
              <h3 className="text-2xl font-bold mb-1">Holding the Crown 👑 :</h3>
              <p className="text-xl">
                <strong>{teams.sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0))[0].name}</strong> with <strong>{(teams.sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0))[0].totalPoints || 0).toLocaleString()}</strong> points
              </p>
            </div>
          </div>
        )}

        {/* Success Message After Joining Team */}
        {joinedTeamId && (
          <div className="bg-white border-2 border-gray-300 rounded-xl p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-black mb-2">🎉 Successfully Joined Team!</h3>
                <p className="text-black">You can now access your team dashboard to start uploading receipts and earning points.</p>
              </div>
              <button
                onClick={() => navigate(`/team/${joinedTeamId}`)}
                className="bg-blue-shiny text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-shiny transition-colors"
              >
                View Team Dashboard
              </button>
            </div>
          </div>
        )}

        {/* Teams List */}
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">Teams</h2>
          {userProfile ? (
            isUserInTeam ? (
              <div className="bg-gray-500 text-white px-6 py-2 rounded-lg font-semibold cursor-not-allowed">
                Already in a Team
              </div>
            ) : (
              <button
                onClick={() => setShowCreateTeam(true)}
                className="bg-gold text-white px-6 py-2 rounded-lg font-semibold hover:bg-gold transition-colors"
              >
                + Create Team
              </button>
            )
          ) : (
            <button
              onClick={() => navigate('/profile')}
              className="bg-gray-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
            >
              Create Profile First
            </button>
          )}
        </div>

        {/* Create Team Modal */}
        {showCreateTeam && userProfile && !isUserInTeam && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-xl p-8 max-w-md w-full">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Create New Team</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Team Name</label>
                  <input
                    type="text"
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    placeholder="Enter team name"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none"
                  />
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> You can create a team with just a name. People can join later using their profiles.
                  </p>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleCreateTeam}
                  className="flex-1 bg-gold text-white py-3 rounded-lg font-semibold hover:bg-gold transition-colors"
                >
                  Create Team
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

        {/* Join Team Modal */}
        {showJoinTeam && userProfile && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-xl p-8 max-w-md w-full">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Join Team</h3>
              <div className="space-y-4">
                <div className="text-center">
                  <ProfilePicture
                    profilePictureUrl={userProfile.profilePictureUrl}
                    name={userProfile.name}
                    size="lg"
                    className="mx-auto mb-4"
                    showBorder={true}
                  />
                  <h4 className="text-lg font-semibold text-gray-900">{userProfile.name}</h4>
                  <p className="text-gray-600">{userProfile.email}</p>
                  <p className="text-sm text-gray-500">{userProfile.schoolName}</p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Ready to join!</strong> Click "Join Team" to add yourself to this team using your profile information.
                  </p>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleJoinTeam}
                  className="flex-1 bg-blue-shiny text-white py-3 rounded-lg font-semibold hover:bg-blue-shiny transition-colors"
                >
                  Join Team
                </button>
                <button
                  onClick={() => {
                    setShowJoinTeam(false);
                    setSelectedTeamId(null);
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
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Members:</span>
                    <span className="font-semibold">{team.members?.length || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Total Points:</span>
                    <span className="font-semibold text-yellow-700">{(team.totalPoints || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Receipts:</span>
                    <span className="font-semibold">{team.receiptsCount || 0}</span>
                  </div>
                </div>

                {joinedTeamId === team.id ? (
                  <button
                    onClick={() => navigate(`/team/${team.id}`)}
                    className="w-full bg-gold text-white py-2 rounded-lg font-semibold hover:bg-gold transition-all duration-300"
                  >
                    View Team Dashboard
                  </button>
                ) : (userProfile && userProfile.email && team.memberEmails && team.memberEmails.includes(userProfile.email)) ? (
                  <button
                    onClick={() => navigate(`/team/${team.id}`)}
                    className="w-full bg-gold text-white py-2 rounded-lg font-semibold hover:bg-gold transition-all duration-300"
                  >
                    View Team Dashboard
                  </button>
                ) : (
                  <button
                    onClick={() => handleJoinTeamClick(team.id)}
                    className="w-full bg-blue-shiny text-white py-2 rounded-lg font-semibold hover:bg-blue-shiny transition-colors"
                  >
                    Join Team
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
                      <p className="text-2xl font-bold text-yellow-700">{(team.totalPoints || 0).toLocaleString()}</p>
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

