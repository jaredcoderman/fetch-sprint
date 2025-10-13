import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { doc, getDoc, collection, query, where, getDocs, addDoc, updateDoc, increment } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import { processReceiptImage, validateReceiptImage, reserveReceiptHash, releaseReceiptHash } from '../utils/receiptOCR';

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
  const [processing, setProcessing] = useState(false);
  const [ocrData, setOcrData] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [memberStats, setMemberStats] = useState([]);
  const [imageHash, setImageHash] = useState(null);

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
      
      // Calculate member stats for leaderboard
      calculateMemberStats(receiptsData, teamData);
    } catch (err) {
      console.error('Error loading team:', err);
    }
    setLoading(false);
  }

  function calculateMemberStats(receiptsData, teamData) {
    // Group receipts by user
    const statsByUser = {};
    
    receiptsData.forEach(receipt => {
      if (!statsByUser[receipt.userId]) {
        statsByUser[receipt.userId] = {
          userId: receipt.userId,
          email: receipt.userEmail,
          points: 0,
          receiptsCount: 0
        };
      }
      statsByUser[receipt.userId].points += receipt.points || 0;
      statsByUser[receipt.userId].receiptsCount += 1;
    });

    // Convert to array and sort by points
    const statsArray = Object.values(statsByUser)
      .sort((a, b) => b.points - a.points);

    setMemberStats(statsArray);
  }

  // Compute SHA-256 hash for duplicate detection
  async function computeFileSHA256(file) {
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  }

  async function handleFileSelect(file) {
    if (!file) return;

    try {
      // Validate file
      validateReceiptImage(file);

      // Ensure team/competition is loaded before duplicate check
      if (!team?.competitionId) {
        throw new Error('Team/competition not loaded yet. Please wait a moment and try again.');
      }

      // Compute content hash and check for duplicates in this competition
      const hash = await computeFileSHA256(file);

      const dupQuery = query(collection(db, 'receipts'), where('imageHash', '==', hash));
      const dupSnapshot = await getDocs(dupQuery);
      const duplicateInCompetition = dupSnapshot.docs.some(d => d.data()?.competitionId === team.competitionId);
      if (duplicateInCompetition) {
        alert('This receipt has already been uploaded in this competition.');
        return;
      }

      // No duplicate: keep hash and continue
      setImageHash(hash);
      setUploadFile(file);

      // Create preview
      const preview = URL.createObjectURL(file);
      setPreviewUrl(preview);

      // Process receipt with OCR (server-side via Cloud Function)
      setProcessing(true);
      try {
        const result = await processReceiptImage(file);
        setOcrData(result);
        setUploadAmount(result.amount.toFixed(2));
        setUploadDescription(result.storeName || '');
        alert(`✓ Receipt processed! Total found: $${result.amount.toFixed(2)}`);
      } catch (ocrError) {
        console.error('OCR Error:', ocrError);
        alert(`⚠️ Could not read receipt automatically: ${ocrError.message}\n\nYou can still enter the amount manually, but it may require admin approval.`);
      } finally {
        setProcessing(false);
      }
    } catch (err) {
      alert(err.message);
      setUploadFile(null);
    }
  }

  async function handleUploadReceipt() {
    if (!uploadFile) {
      alert('Please select a receipt image');
      return;
    }

    if (!uploadAmount) {
      alert('Please wait for OCR processing or enter the amount manually');
      return;
    }

    const amount = parseFloat(uploadAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    setUploading(true);

    try {
      // Double-check for duplicates right before upload to avoid races
      if (team?.competitionId && imageHash) {
        const dupQuery = query(collection(db, 'receipts'), where('imageHash', '==', imageHash));
        const dupSnapshot = await getDocs(dupQuery);
        const duplicateInCompetition = dupSnapshot.docs.some(d => d.data()?.competitionId === team.competitionId);
        if (duplicateInCompetition) {
          alert('This receipt has already been uploaded in this competition.');
          setUploading(false);
          return;
        }
      }

      // Reserve server-side now to ensure uniqueness across clients
      if (team?.competitionId && imageHash) {
        try {
          await reserveReceiptHash(team.competitionId, imageHash);
        } catch (e) {
          // Only block if it's an actual duplicate; otherwise continue best-effort
          if (e && (e.code === 'already-exists' || e.message?.includes('already'))) {
            alert('This receipt has already been uploaded in this competition.');
            setUploading(false);
            return;
          }
          console.warn('reserveReceiptHash failed; continuing without reservation', e);
        }
      }

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
        imageHash: imageHash || null,
        amount,
        points,
        description: uploadDescription,
        storeName: ocrData?.storeName || uploadDescription,
        ocrVerified: !!ocrData,
        ocrConfidence: ocrData?.confidence || 'manual',
        createdAt: new Date().toISOString(),
        status: ocrData ? 'approved' : 'pending' // Auto-approve if OCR verified
      });

      // Update team points (only if OCR verified or approved)
      if (ocrData) {
        await updateDoc(doc(db, 'teams', id), {
          totalPoints: increment(points),
          receiptsCount: increment(1)
        });
      }

      // Reset form
      handleCloseModal();
      
      // Reload data
      loadTeamData();
      
      if (ocrData) {
        alert('✓ Receipt uploaded and points added!');
      } else {
        alert('✓ Receipt uploaded! Awaiting admin approval for points.');
      }
    } catch (err) {
      console.error('Error uploading receipt:', err);
      // Release reservation if we made one
      if (team?.competitionId && imageHash) {
        try { await releaseReceiptHash(team.competitionId, imageHash); } catch (_) {}
      }
      alert('Failed to upload receipt. Please try again.');
    }

    setUploading(false);
  }

  function handleCloseModal() {
    setShowUploadModal(false);
    setUploadFile(null);
    setUploadAmount('');
    setUploadDescription('');
    setOcrData(null);
    setImageHash(null);
    setProcessing(false);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  }

  // Note: We reserve server-side only during upload. On failure we release immediately.

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
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl shadow-lg p-4 md:p-8 mb-8">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold mb-2">{team.name}</h1>
              <p className="text-indigo-100 mb-4">
                {competition?.name}
              </p>
              <div className="grid grid-cols-3 gap-4 md:flex md:gap-8">
                <div>
                  <p className="text-indigo-200 text-xs md:text-sm">Team Members</p>
                  <p className="text-2xl md:text-3xl font-bold">{team.members?.length || 0}</p>
                </div>
                <div>
                  <p className="text-indigo-200 text-xs md:text-sm">Total Points</p>
                  <p className="text-2xl md:text-3xl font-bold">{team.totalPoints || 0}</p>
                </div>
                <div>
                  <p className="text-indigo-200 text-xs md:text-sm">Receipts</p>
                  <p className="text-2xl md:text-3xl font-bold">{team.receiptsCount || 0}</p>
                </div>
              </div>
            </div>
            {isTeamMember && (
              <button
                onClick={() => setShowUploadModal(true)}
                className="bg-white text-indigo-600 px-4 py-2 md:px-6 md:py-3 rounded-lg font-semibold hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2 text-sm md:text-base whitespace-nowrap self-start md:self-auto"
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
                    onChange={(e) => handleFileSelect(e.target.files[0])}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                    disabled={processing}
                  />
                  {processing && (
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                        <p className="text-sm text-blue-800">Processing receipt with AI...</p>
                      </div>
                    </div>
                  )}
                  {previewUrl && (
                    <div className="mt-3">
                      <img 
                        src={previewUrl} 
                        alt="Receipt preview" 
                        className="max-h-48 rounded-lg border border-gray-300"
                      />
                    </div>
                  )}
                  {ocrData && (
                    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-800">
                        ✓ Receipt verified! Store: {ocrData.storeName} | Confidence: {ocrData.confidence}
                      </p>
                    </div>
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
                    disabled={processing}
                    readOnly={!!ocrData}
                  />
                  {uploadAmount && (
                    <p className="text-sm text-indigo-600 mt-2">
                      Points: {Math.floor(parseFloat(uploadAmount || 0) * 100)}
                    </p>
                  )}
                  {!ocrData && uploadAmount && (
                    <p className="text-xs text-yellow-600 mt-2">
                      ⚠️ Manual entry - requires admin approval
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
                    <strong>Point System:</strong> $1 = 100 points<br/>
                    <strong>AI Verification:</strong> Receipts are automatically verified using GPT-4 Vision<br/>
                    <strong>Secure:</strong> All processing happens server-side for your security
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
                  onClick={handleCloseModal}
                  disabled={uploading || processing}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Top Contributors Leaderboard */}
        {memberStats.length > 0 && (
          <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl shadow-lg p-8 mb-8 border-2 border-yellow-200">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-4xl">🏆</span>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Top Contributors</h2>
                <p className="text-gray-600">Team MVP's earning the most points!</p>
              </div>
            </div>
            
            <div className="space-y-4">
              {memberStats.slice(0, 3).map((member, index) => {
                const medals = ['🥇', '🥈', '🥉'];
                const colors = [
                  'from-yellow-400 to-yellow-500',
                  'from-gray-300 to-gray-400', 
                  'from-orange-400 to-orange-500'
                ];
                const textColors = ['text-yellow-900', 'text-gray-900', 'text-orange-900'];
                
                return (
                  <div 
                    key={member.userId} 
                    className={`relative bg-gradient-to-r ${colors[index]} rounded-xl p-5 shadow-md transform transition-transform hover:scale-[1.02]`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="text-5xl">{medals[index]}</div>
                        <div>
                          <p className={`font-bold text-lg ${textColors[index]}`}>
                            {member.email}
                            {member.userId === currentUser?.uid && (
                              <span className="ml-2 text-sm">(You!)</span>
                            )}
                          </p>
                          <p className={`text-sm ${textColors[index]} opacity-90`}>
                            {member.receiptsCount} receipt{member.receiptsCount !== 1 ? 's' : ''} uploaded
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-3xl font-bold ${textColors[index]}`}>
                          {member.points.toLocaleString()}
                        </p>
                        <p className={`text-sm ${textColors[index]} opacity-90`}>points</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Team Members */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">👥 All Team Members</h2>
          <div className="space-y-3">
            {team.memberEmails?.map((email, index) => {
              const memberStat = memberStats.find(s => s.userId === team.members[index]);
              return (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                      <span className="text-indigo-600 font-semibold">
                        {email.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{email}</p>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        {team.createdBy === team.members[index] && (
                          <span>Team Creator</span>
                        )}
                        {memberStat && (
                          <span>• {memberStat.points} pts</span>
                        )}
                      </div>
                    </div>
                  </div>
                  {memberStat && (
                    <div className="text-right">
                      <p className="text-sm font-semibold text-indigo-600">
                        {memberStat.receiptsCount} receipt{memberStat.receiptsCount !== 1 ? 's' : ''}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
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

