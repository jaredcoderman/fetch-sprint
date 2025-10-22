import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, addDoc, updateDoc, increment } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import { processReceiptImage, validateReceiptImage } from '../utils/receiptOCR';
import { determineWinner, getWinnerMessage } from '../utils/winnerDetection';
import ProfilePicture from '../components/ProfilePicture';

// Updated TeamDashboard component
function TeamDashboard() {
  const { id } = useParams();
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
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [isTeamMember, setIsTeamMember] = useState(true);
  const [showBonusModal, setShowBonusModal] = useState(false);
  const [bonusFile, setBonusFile] = useState(null);
  const [bonusPreviewUrl, setBonusPreviewUrl] = useState(null);
  const [verifyingBonus, setVerifyingBonus] = useState(false);
  const [bonusClaimed, setBonusClaimed] = useState(false);
  const [userHasClaimedBonus, setUserHasClaimedBonus] = useState(false);
  const [winnerMessage, setWinnerMessage] = useState(null);
  const [competitionCompleted, setCompetitionCompleted] = useState(false);

  useEffect(() => {
    loadUserProfile();
    loadTeamData();
  }, [id]);

  useEffect(() => {
    if (team && team.memberEmails) {
      loadMemberProfiles();
    }
  }, [team]);

  useEffect(() => {
    if (userProfile && team) {
      checkUserBonusClaimStatus();
    }
  }, [userProfile, team]);

  async function loadTeamData() {
    try {
      console.log('Loading team data for ID:', id);
      // Load team
      const teamDoc = await getDoc(doc(db, 'teams', id));
      console.log('Team doc exists:', teamDoc.exists());
      if (teamDoc.exists()) {
        const teamData = { id: teamDoc.id, ...teamDoc.data() };
        setTeam(teamData);
        
        // Load competition
        const compDoc = await getDoc(doc(db, 'competitions', teamData.competitionId));
        if (compDoc.exists()) {
          const competitionData = { id: compDoc.id, ...compDoc.data() };
          setCompetition(competitionData);
          
          // Check if competition is already completed
          if (competitionData.status === 'completed') {
            setCompetitionCompleted(true);
            // Get winner message for this team
            const message = await getWinnerMessage(competitionData.id, id);
            if (message) {
              setWinnerMessage(message);
            }
          }
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
      try {
        calculateMemberStats(receiptsData, teamData);
      } catch (statsError) {
        console.error('Error calculating member stats:', statsError);
      }
    } catch (err) {
      console.error('Error loading team:', err);
    }
    console.log('Setting loading to false');
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
          name: receipt.userName,
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

  async function loadUserProfile() {
    try {
      const savedProfile = localStorage.getItem('userProfile');
      console.log('Loading user profile from localStorage:', savedProfile);
      if (savedProfile) {
        const profile = JSON.parse(savedProfile);
        console.log('Parsed user profile:', profile);
        setUserProfile(profile);
      } else {
        console.log('No user profile found in localStorage - allowing anonymous uploads');
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      console.log('Profile data error - allowing anonymous uploads');
    }
  }

  async function loadMemberProfiles() {
    try {
      const profilesQuery = query(
        collection(db, 'userProfiles'),
        where('email', 'in', team.memberEmails)
      );
      const profilesSnapshot = await getDocs(profilesQuery);
      const profiles = {};
      
      profilesSnapshot.forEach(doc => {
        const data = doc.data();
        profiles[data.email] = data;
      });

      // Update member stats with profile pictures and names
      setMemberStats(prevStats => 
        prevStats.map(member => ({
          ...member,
          name: profiles[member.email]?.name || member.name,
          profilePictureUrl: profiles[member.email]?.profilePictureUrl || member.profilePictureUrl
        }))
      );
    } catch (err) {
      console.error('Error loading member profiles:', err);
    }
  }

  async function checkUserBonusClaimStatus() {
    if (!userProfile || !team) return;
    
    try {
      const bonusClaimsQuery = query(
        collection(db, 'bonusClaims'),
        where('teamId', '==', id),
        where('userEmail', '==', userProfile.email)
      );
      const bonusSnapshot = await getDocs(bonusClaimsQuery);
      setUserHasClaimedBonus(!bonusSnapshot.empty);
    } catch (err) {
      console.error('Error checking bonus claim status:', err);
    }
  }

  async function handleBonusUpload() {
    if (!bonusFile || !userProfile) return;

    setVerifyingBonus(true);
    
    try {
      // Upload image to Firebase Storage
      const storageRef = ref(storage, `bonus-claims/${Date.now()}-${bonusFile.name}`);
      const uploadResult = await uploadBytes(storageRef, bonusFile);
      const imageUrl = await getDownloadURL(uploadResult.ref);

      // Call Cloud Function to verify
      const verifyFunction = httpsCallable(functions, 'verifyFetchProfile');
      const result = await verifyFunction({
        imageUrl: imageUrl,
        teamId: id,
        userEmail: userProfile.email,
        userName: userProfile.name
      });

      if (result.data.success) {
        setUserHasClaimedBonus(true);
        alert('🎉 Bonus points claimed! You earned 5,000 points!');
        handleCloseBonusModal();
        loadTeamData(); // Refresh team data
      } else {
        alert('❌ Verification failed: ' + result.data.error);
      }
    } catch (err) {
      console.error('Error claiming bonus:', err);
      alert('Failed to claim bonus points. Please try again.');
    }
    
    setVerifyingBonus(false);
  }

  function handleCloseBonusModal() {
    setShowBonusModal(false);
    setBonusFile(null);
    setBonusPreviewUrl(null);
  }

  async function checkForDuplicateReceipt(newReceipt) {
    if (!newReceipt || !team?.competitionId) {
      return { isDuplicate: false };
    }

    try {
      // Get all receipts from this competition
      const receiptsQuery = query(
        collection(db, 'receipts'),
        where('competitionId', '==', team.competitionId)
      );
      const receiptsSnapshot = await getDocs(receiptsQuery);
      
      // Normalize store names for comparison
      const normalizeStoreName = (name) => {
        if (!name) return '';
        return name.toLowerCase()
          .replace(/[^a-z0-9]/g, '')
          .trim();
      };
      
      const newStoreName = normalizeStoreName(newReceipt.storeName);
      const newAmount = parseFloat(newReceipt.amount);
      const newDate = newReceipt.date ? new Date(newReceipt.date).toDateString() : '';
      
      // Check each existing receipt
      for (const docSnap of receiptsSnapshot.docs) {
        const existing = docSnap.data();
        
        const existingStoreName = normalizeStoreName(existing.storeName);
        const existingAmount = parseFloat(existing.amount);
        const existingDate = existing.createdAt ? new Date(existing.createdAt).toDateString() : '';
        
        // Check if store name matches (or very similar)
        const storeMatch = existingStoreName === newStoreName || 
                          existingStoreName.includes(newStoreName) || 
                          newStoreName.includes(existingStoreName);
        
        // Check if amount matches (within 1 cent)
        const amountMatch = Math.abs(existingAmount - newAmount) < 0.02;
        
        // Check if same day
        const dateMatch = existingDate === newDate;
        
        // If store, amount, and date all match - it's a duplicate
        if (storeMatch && amountMatch && dateMatch) {
          return {
            isDuplicate: true,
            originalUser: existing.userName || existing.userEmail || 'Unknown'
          };
        }
        
        // Alternative: If store and amount match, and text is very similar
        if (storeMatch && amountMatch && newReceipt.text && existing.ocrText) {
          const textSimilarity = calculateTextSimilarity(newReceipt.text, existing.ocrText);
          
          if (textSimilarity > 0.4) {
            return {
              isDuplicate: true,
              originalUser: existing.userName || existing.userEmail || 'Unknown'
            };
          }
        }
      }
      
      return { isDuplicate: false };
      
    } catch (error) {
      console.error('Error checking duplicates:', error);
      return { isDuplicate: false };
    }
  }

  function calculateTextSimilarity(text1, text2) {
    if (!text1 || !text2) return 0;
    
    const normalize = (text) => text.toLowerCase().replace(/\s+/g, ' ').trim();
    const words1 = new Set(normalize(text1).split(' ').filter(w => w.length > 2));
    const words2 = new Set(normalize(text2).split(' ').filter(w => w.length > 2));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  async function handleFileSelect(file) {
    if (!file) return;

    try {
      // Validate file
      validateReceiptImage(file);
      
      setUploadFile(file);
      
      // Create preview
      const preview = URL.createObjectURL(file);
      setPreviewUrl(preview);
      
      // Process receipt with OCR (server-side via Cloud Function)
      setProcessing(true);
      setIsDuplicate(false); // Reset duplicate flag
      setDuplicateWarning(null);
      
      try {
        const result = await processReceiptImage(file);
        
        // Check for duplicates immediately after OCR
        const duplicateCheck = await checkForDuplicateReceipt(result);
        
        if (duplicateCheck.isDuplicate) {
          // Mark as duplicate and show warning
          setIsDuplicate(true);
          setDuplicateWarning(`This receipt is a duplicate! Originally uploaded by ${duplicateCheck.originalUser}`);
          alert(`🚫 DUPLICATE RECEIPT DETECTED!\n\nThis receipt has already been uploaded by ${duplicateCheck.originalUser}.\n\nPlease select a different receipt.`);
          
          // Clear the form
          setUploadFile(null);
          setPreviewUrl(null);
          setOcrData(null);
          setUploadAmount('');
          setUploadDescription('');
          setProcessing(false);
          return; // Stop here, don't allow upload
        }
        
        // Not a duplicate, proceed normally
        setOcrData(result);
        setUploadAmount(result.amount.toFixed(2));
        setUploadDescription(result.storeName || '');
        alert(`✓ Receipt processed! Total found: $${result.amount.toFixed(2)}`);
        
      } catch (ocrError) {
        console.error('OCR Error:', ocrError);
        alert(`⚠️ Could not read receipt automatically: ${ocrError.message}\n\nPlease try uploading a clearer image or contact support.`);
      } finally {
        setProcessing(false);
      }
    } catch (err) {
      alert(err.message);
      setUploadFile(null);
    }
  }

  async function handleUploadReceipt() {
    // Check if this is a duplicate receipt
    if (isDuplicate) {
      alert('🚫 This receipt has been marked as a duplicate and cannot be uploaded.');
      return;
    }
    
    // Check if competition is completed
    if (competition && competition.status === 'completed') {
      alert('This competition has ended. A team has reached 50,000 points!');
      return;
    }
    
    // Allow uploads even without full profile - use anonymous data if needed
    let userEmail = 'anonymous@example.com';
    let userName = 'Anonymous User';
    
    if (userProfile) {
      userEmail = userProfile.email || 'anonymous@example.com';
      userName = userProfile.name || 'Anonymous User';
    } else {
      // Try to get basic info from localStorage
      const savedProfile = localStorage.getItem('userProfile');
      if (savedProfile) {
        try {
          const profile = JSON.parse(savedProfile);
          userEmail = profile.email || 'anonymous@example.com';
          userName = profile.name || 'Anonymous User';
        } catch (error) {
          console.error('Error parsing user profile:', error);
        }
      }
    }

    if (!uploadFile) {
      alert('Please select a receipt image');
      return;
    }

    // Handle amount - use OCR result if available, otherwise require manual entry
    let amount = 0;
    if (uploadAmount) {
      amount = parseFloat(uploadAmount);
      if (isNaN(amount) || amount <= 0) {
        alert('Please enter a valid amount');
        return;
      }
    } else {
      // If OCR failed, ask user to enter amount manually
      const manualAmount = prompt('OCR could not read the receipt amount. Please enter the total amount manually:');
      if (!manualAmount) {
        alert('Amount is required to upload receipt');
        return;
      }
      amount = parseFloat(manualAmount);
      if (isNaN(amount) || amount <= 0) {
        alert('Please enter a valid amount');
        return;
      }
    }

    setUploading(true);

    try {
      // Upload image to Firebase Storage
      const fileRef = ref(storage, `receipts/${id}/${Date.now()}_${uploadFile.name}`);
      await uploadBytes(fileRef, uploadFile);
      const imageUrl = await getDownloadURL(fileRef);

      // Calculate points (simple: $1 = 1000 points)
      const basePoints = Math.floor(amount * 1000);
      let finalPoints = basePoints;
      let pointsMultiplier = 1;
      let isCVS = false;
      let isCVSEligible = false;

      // Check for CVS bonus
      if (ocrData?.storeName) {
        const storeName = ocrData.storeName.toLowerCase();
        if (storeName.includes('cvs') || 
            storeName.includes('cvs pharmacy') || 
            storeName.includes('cvs health') ||
            storeName.includes('cvs caremark') ||
            storeName.includes('cvs minuteclinic') ||
            storeName.includes('cvs.com') ||
            storeName.includes('cvs/pharmacy') ||
            storeName.includes('cvs/health') ||
            storeName.includes('cvs care') ||
            storeName.includes('cvs store') ||
            storeName.includes('cvs retail') ||
            storeName.includes('cvs/pharmacy') ||
            storeName.includes('cvs/health') ||
            storeName.includes('cvs/caremark')) {
          isCVS = true;
          const today = new Date();
          const oct24 = new Date('2025-10-24');
          if (today <= oct24) {
            isCVSEligible = true;
            pointsMultiplier = 2;
            finalPoints = basePoints * 2;
          }
        }
      }

      // Duplicate check already performed during file selection

      // Create receipt document
      if (!team || !team.competitionId) {
        throw new Error('Team data not loaded properly. Please refresh the page and try again.');
      }
      
      await addDoc(collection(db, 'receipts'), {
        teamId: id,
        competitionId: team.competitionId,
        userId: userEmail,
        userEmail: userEmail,
        userName: userName,
        profilePictureUrl: userProfile?.profilePictureUrl || null,
        imageUrl,
        amount,
        points: finalPoints,
        basePoints,
        pointsMultiplier,
        isCVS,
        isCVSEligible,
        description: uploadDescription,
        storeName: ocrData?.storeName || uploadDescription,
        ocrVerified: !!ocrData,
        ocrConfidence: ocrData?.confidence || 'manual',
        ocrText: ocrData?.text || '',
        createdAt: new Date().toISOString(),
        status: ocrData ? 'approved' : 'pending' // Auto-approve if OCR verified
      });

      // Update team points (only if OCR verified or approved)
      if (ocrData) {
        await updateDoc(doc(db, 'teams', id), {
          totalPoints: increment(finalPoints),
          receiptsCount: increment(1)
        });

        // Check for winner using competitionId
        const winnerResult = await determineWinner(team.competitionId);
        if (winnerResult.hasWinner) {
          setWinnerMessage(winnerResult.message);
          setCompetitionCompleted(true);
          // Update the local competition state
          setCompetition(prev => ({ ...prev, status: 'completed' }));
        }
      }

      // Reset form
      handleCloseModal();
      
      // Reload data
      loadTeamData();
      
      if (ocrData) {
        let successMessage = '✓ Receipt uploaded and points added!';
        if (isCVS && isCVSEligible) {
          successMessage += ` 🎉 CVS receipt detected! Your points have been doubled!`;
        }
        successMessage += `\n\nPro tip: If you upload your receipt to the Fetch app, you may get rewards for what you already bought!`;
        alert(successMessage);
      } else {
        alert('✓ Receipt uploaded! Awaiting admin approval for points.\n\nPro tip: If you upload your receipt to the Fetch app, you may get rewards for what you already bought!');
      }
    } catch (err) {
      console.error('Error uploading receipt:', err);
      console.error('Error details:', err.message, err.code);
      alert(`Failed to upload receipt: ${err.message}. Please try again.`);
    }

    setUploading(false);
  }

  function handleCloseModal() {
    setShowUploadModal(false);
    setUploadFile(null);
    setUploadAmount('');
    setUploadDescription('');
    setOcrData(null);
    setProcessing(false);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
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

  return (
    <div className="min-h-screen bg-blue-shiny-gradient">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center">
          <div className="flex-1">
            <button 
              onClick={() => navigate(`/competition/${team.competitionId}`)} 
              className="text-yellow-700 hover:text-yellow-800 font-medium"
            >
              ← Back to Competition
            </button>
          </div>
          <div className="flex-1 text-center">
            <h1 className="text-2xl font-bold text-yellow-700">ReceiptRoyale</h1>
          </div>
          <div className="flex-1"></div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* CVS Promo Banner */}
        <div className="bg-gold text-white rounded-lg shadow-md p-4 mb-8">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-4xl">🕐</span>
              <h3 className="text-xl font-bold">Limited Time Offer!</h3>
            </div>
            <p className="text-base">
              Upload CVS receipts to get <strong>2x points</strong> until October 24, 2025
            </p>
          </div>
        </div>

        {/* Team Header */}
        <div className="bg-white text-black rounded-xl shadow-lg p-4 md:p-8 mb-8">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold mb-2 text-black">{team.name}</h1>
              <p className="text-gray-600 mb-4">
                {competition?.name}
              </p>
              <div className="grid grid-cols-3 gap-4 md:flex md:gap-8">
                <div>
                  <p className="text-gray-500 text-xs md:text-sm">Team Members</p>
                  <p className="text-2xl md:text-3xl font-bold text-blue-800">{team.members?.length || 0}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs md:text-sm">Total Points</p>
                  <p className="text-2xl md:text-3xl font-bold text-blue-800">{(team.totalPoints || 0).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs md:text-sm">Receipts</p>
                  <p className="text-2xl md:text-3xl font-bold text-blue-800">{team.receiptsCount || 0}</p>
                </div>
              </div>
            </div>
            {isTeamMember && !competitionCompleted && (
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="bg-blue-shiny text-white px-4 py-2 md:px-6 md:py-3 rounded-lg font-semibold hover:bg-blue-shiny transition-colors flex items-center justify-center gap-2 text-sm md:text-base whitespace-nowrap"
                >
                  <span className="text-xl">📸</span>
                  Upload Receipt
                </button>
                
                <button
                  onClick={() => setShowBonusModal(true)}
                  className="bg-gold text-white px-4 py-2 md:px-6 md:py-3 rounded-lg font-semibold hover:bg-gold transition-colors flex items-center justify-center gap-2 text-sm md:text-base whitespace-nowrap"
                >
                  <span className="text-xl">🎁</span>
                  Want Bonus Points?
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Goal Progress */}
        {competition && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border-2 border-yellow-300">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-blue-800 mb-4">
                {competition.hasGoal !== false ? 'Competition Goal' : 'Team Progress'}
              </h2>
              <div className="space-y-4">
                {competition.hasGoal !== false ? (
                  <>
                    <div className="text-4xl font-bold text-yellow-600">
                      {(team.totalPoints || 0).toLocaleString()} / {(competition.goal || 50000).toLocaleString()} points
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-6">
                      <div 
                        className="h-6 rounded-full transition-all duration-500 shadow-lg"
                        style={{ 
                          width: `${Math.min(100, ((team.totalPoints || 0) / (competition.goal || 50000)) * 100)}%`,
                          background: 'linear-gradient(to right, #fbbf24 0%, #f59e0b 25%, #3b82f6 75%, #2563eb 100%)'
                        }}
                      ></div>
                    </div>
                    <div className="text-lg text-blue-600">
                      {Math.max(0, (competition.goal || 50000) - (team.totalPoints || 0)).toLocaleString()} points needed to win!
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-4xl font-bold text-yellow-600">
                      {(team.totalPoints || 0).toLocaleString()} points
                    </div>
                    <div className="text-lg text-blue-600">
                      Team with the highest points wins!
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Winner Message */}
        {winnerMessage && (
          <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white rounded-xl shadow-lg p-6 mb-8 text-center">
            <div className="text-4xl mb-2">🎉</div>
            <h2 className="text-2xl font-bold mb-2">Competition Complete!</h2>
            <p className="text-lg">{winnerMessage}</p>
          </div>
        )}

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
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={(e) => handleFileSelect(e.target.files[0])}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      disabled={processing}
                      id="receipt-camera-input"
                    />
                    <button
                      type="button"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={processing}
                    >
                      Upload a photo
                    </button>
                  </div>
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
                    Total Amount ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={uploadAmount}
                    placeholder="0.00"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-gray-100"
                    disabled={true}
                    readOnly={true}
                  />
                  {uploadAmount && (
                    <p className="text-sm text-indigo-600 mt-2">
                      Points: {Math.floor(parseFloat(uploadAmount || 0) * 100)}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    Amount will be automatically detected from your receipt image
                  </p>
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
                  disabled={uploading || !uploadFile || processing}
                  className="flex-1 bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? 'Uploading...' : processing ? 'Processing...' : 'Upload Receipt'}
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
                        <div className="flex items-center gap-3">
                          {member.profilePictureUrl ? (
                            <img 
                              src={member.profilePictureUrl} 
                              alt={member.name || member.email}
                              className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-md"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-bold text-lg">
                              {(() => {
                                let displayName = member.name || member.email;
                                // Ensure the name has a period after the last name
                                if (displayName && !displayName.includes('@') && !displayName.endsWith('.')) {
                                  displayName = displayName + '.';
                                }
                                return displayName.charAt(0).toUpperCase();
                              })()}
                            </div>
                          )}
                          <div>
                            <p className={`font-bold text-lg ${textColors[index]}`}>
                              {(() => {
                                let displayName = member.name || member.email;
                                // Ensure the name has a period after the last name
                                if (displayName && !displayName.includes('@') && !displayName.endsWith('.')) {
                                  displayName = displayName + '.';
                                }
                                return displayName;
                              })()}
                            </p>
                            <p className={`text-sm ${textColors[index]} opacity-90`}>
                              {member.receiptsCount} receipt{member.receiptsCount !== 1 ? 's' : ''} uploaded
                            </p>
                          </div>
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
              const memberStat = memberStats.find(s => s.email === email);
              let memberName = team.memberNames?.[index] || memberStat?.name || email;
              // Ensure the name has a period after the last name
              if (memberName && !memberName.includes('@') && !memberName.endsWith('.')) {
                memberName = memberName + '.';
              }
              return (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {memberStat?.profilePictureUrl ? (
                      <img 
                        src={memberStat.profilePictureUrl} 
                        alt={memberName}
                        className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-md"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-semibold">
                          {memberName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-gray-900">{memberName}</p>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        {team.createdBy === team.members[index] && (
                          <span>Team Creator</span>
                        )}
                        {memberStat && (
                          <span>• {memberStat.points.toLocaleString()} pts</span>
                        )}
                      </div>
                    </div>
                  </div>
                  {memberStat && (
                    <div className="text-right">
                      <p className="text-sm font-semibold text-blue-600">
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

        {/* Bonus Points Modal */}
        {showBonusModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4 py-4">
            <div className="bg-white rounded-xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Bonus Points</h3>
              
              <div className="space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    <strong>Get 5,000 bonus points!</strong> Download the Fetch app and upload a screenshot of your profile to earn extra points.
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fetch Profile Screenshot *
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={(e) => setBonusFile(e.target.files[0])}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      disabled={verifyingBonus}
                      id="bonus-camera-input"
                    />
                    <button
                      type="button"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={verifyingBonus}
                    >
                      Upload a photo
                    </button>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Upload a photo with your camera (max 5MB, JPG/PNG)
                  </p>
                  {bonusPreviewUrl && (
                    <div className="mt-3">
                      <img 
                        src={bonusPreviewUrl} 
                        alt="Screenshot preview" 
                        className="max-h-48 rounded-lg border border-gray-300"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleBonusUpload}
                  disabled={!bonusFile || verifyingBonus}
                  className="flex-1 bg-gold text-white py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {verifyingBonus ? 'Verifying...' : 'Claim Bonus Points'}
                </button>
                <button
                  onClick={handleCloseBonusModal}
                  disabled={verifyingBonus}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TeamDashboard;

