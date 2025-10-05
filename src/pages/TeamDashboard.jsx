import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { doc, getDoc, collection, query, where, getDocs, addDoc, updateDoc, increment } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';

function TeamDashboard() {
  const { id } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [team, setTeam] = useState(null);
  const [competition, setCompetition] = useState(null);
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadAmount, setUploadAmount] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadTeamData();
  }, [id]);

  async function loadTeamData() {
    try {
      // Load team
      const teamDoc = await getDoc(doc(db, 'teams', id));
      if (teamDoc.exists()) {
        const teamData = { id: teamDoc.id, ...teamDoc.data() };
        setTeam(teamData);
        
        // Load competition
        const compDoc = await getDoc(doc(db, 'competitions', teamData.competitionId));
        if (compDoc.exists()) {
          setCompetition({ id: compDoc.id, ...compDoc.data() });
        }
      }

      // Load receipts
      const receiptsQuery = query(collection(db, 'receipts'), where('teamId', '==', id));
      const receiptsSnapshot = await getDocs(receiptsQuery);
      const receiptsData = receiptsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setReceipts(receiptsData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    } catch (err) {
      console.error('Error loading team:', err);
    }
    setLoading(false);
  }

  async function handleUploadReceipt() {
    if (!uploadFile || !uploadAmount) {
      alert('Please select a file and enter the receipt amount');
      return;
    }

    const amount = parseFloat(uploadAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    setUploading(true);

    try {
      // Upload image to Firebase Storage
      const fileRef = ref(storage, `receipts/${id}/${Date.now()}_${uploadFile.name}`);
      await uploadBytes(fileRef, uploadFile);
      const imageUrl = await getDownloadURL(fileRef);

      // Calculate points (simple: $1 = 100 points)
      const points = Math.floor(amount * 100);

      // Create receipt document
      await addDoc(collection(db, 'receipts'), {
        teamId: id,
        competitionId: team.competitionId,
        userId: currentUser.uid,
        userEmail: currentUser.email,
        imageUrl,
        amount,
        points,
        description: uploadDescription,
        createdAt: new Date().toISOString(),
        status: 'approved' // In production, you might want manual approval
      });

      // Update team points
      await updateDoc(doc(db, 'teams', id), {
        totalPoints: increment(points),
        receiptsCount: increment(1)
      });

      // Reset form
      setShowUploadModal(false);
      setUploadFile(null);
      setUploadAmount('');
      setUploadDescription('');
      
      // Reload data
      loadTeamData();
    } catch (err) {
      console.error('Error uploading receipt:', err);
      alert('Failed to upload receipt. Please try again.');
    }

    setUploading(false);
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

  if (!team) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Team Not Found</h2>
          <button onClick={() => navigate('/competitions')} className="text-indigo-600 hover:text-indigo-700">
            ← Back to Competitions
          </button>
        </div>
      </div>
    );
  }

  const isTeamMember = team.members?.includes(currentUser?.uid);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <button 
            onClick={() => navigate(`/competition/${team.competitionId}`)} 
            className="text-indigo-600 hover:text-indigo-700 font-medium"
          >
            ← Back to Competition
          </button>
          <h1 className="text-2xl font-bold text-indigo-600">Receipt Sprint</h1>
          <div className="w-32"></div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Team Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl shadow-lg p-8 mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">{team.name}</h1>
              <p className="text-indigo-100 mb-4">
                {competition?.name}
              </p>
              <div className="flex gap-8">
                <div>
                  <p className="text-indigo-200 text-sm">Team Members</p>
                  <p className="text-3xl font-bold">{team.members?.length || 0}</p>
                </div>
                <div>
                  <p className="text-indigo-200 text-sm">Total Points</p>
                  <p className="text-3xl font-bold">{team.totalPoints || 0}</p>
                </div>
                <div>
                  <p className="text-indigo-200 text-sm">Receipts</p>
                  <p className="text-3xl font-bold">{team.receiptsCount || 0}</p>
                </div>
              </div>
            </div>
            {isTeamMember && (
              <button
                onClick={() => setShowUploadModal(true)}
                className="bg-white text-indigo-600 px-6 py-3 rounded-lg font-semibold hover:bg-indigo-50 transition-colors flex items-center gap-2"
              >
                <span className="text-xl">📸</span>
                Upload Receipt
              </button>
            )}
          </div>
        </div>

        {/* Upload Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-xl p-8 max-w-md w-full max-h-screen overflow-y-auto">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Upload Receipt</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Receipt Image *
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={(e) => setUploadFile(e.target.files[0])}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  />
                  {uploadFile && (
                    <p className="text-sm text-gray-500 mt-2">
                      Selected: {uploadFile.name}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total Amount ($) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={uploadAmount}
                    onChange={(e) => setUploadAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  />
                  {uploadAmount && (
                    <p className="text-sm text-indigo-600 mt-2">
                      Points: {Math.floor(parseFloat(uploadAmount || 0) * 100)}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description (optional)
                  </label>
                  <textarea
                    value={uploadDescription}
                    onChange={(e) => setUploadDescription(e.target.value)}
                    placeholder="Where did you shop?"
                    rows="3"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Point System:</strong> $1 = 100 points
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleUploadReceipt}
                  disabled={uploading || !uploadFile || !uploadAmount}
                  className="flex-1 bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? 'Uploading...' : 'Upload'}
                </button>
                <button
                  onClick={() => {
                    setShowUploadModal(false);
                    setUploadFile(null);
                    setUploadAmount('');
                    setUploadDescription('');
                  }}
                  disabled={uploading}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Team Members */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">👥 Team Members</h2>
          <div className="space-y-3">
            {team.memberEmails?.map((email, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                  <span className="text-indigo-600 font-semibold">
                    {email.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{email}</p>
                  {team.createdBy === team.members[index] && (
                    <p className="text-sm text-gray-500">Team Creator</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Receipts */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">🧾 Recent Receipts</h2>
          {receipts.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-4">📸</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Receipts Yet</h3>
              <p className="text-gray-600">
                {isTeamMember ? 'Upload your first receipt to start earning points!' : 'This team hasn\'t uploaded any receipts yet.'}
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {receipts.map((receipt) => (
                <div key={receipt.id} className="border-2 border-gray-200 rounded-lg p-4 hover:border-indigo-300 transition-colors">
                  <div className="flex gap-4">
                    <img 
                      src={receipt.imageUrl} 
                      alt="Receipt" 
                      className="w-24 h-24 object-cover rounded-lg cursor-pointer"
                      onClick={() => window.open(receipt.imageUrl, '_blank')}
                    />
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold text-gray-900">${receipt.amount.toFixed(2)}</p>
                          <p className="text-sm text-indigo-600 font-medium">{receipt.points} points</p>
                        </div>
                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-medium">
                          {receipt.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {receipt.description || 'No description'}
                      </p>
                      <p className="text-xs text-gray-500">
                        By {receipt.userEmail}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(receipt.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TeamDashboard;

