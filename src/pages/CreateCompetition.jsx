import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { collection, addDoc, updateDoc, doc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

function CreateCompetition() {
  const navigate = useNavigate();
  const { schoolName } = useParams();
  
  // Check if this is for a group or school
  const isGroup = !schoolName;
  
  const [formData, setFormData] = useState({
    name: '',
    emoji: '🏆',
    endDate: '',
    goal: 50000,
    hasGoal: true
  });
  const [creating, setCreating] = useState(false);

  const emojiOptions = ['🏆', '🎯', '⚡', '🔥', '🌟', '💎', '🎪', '🎨', '🚀', '🎉'];

  async function handleSubmit(e) {
    e.preventDefault();
    
    if (!formData.name || !formData.endDate) {
      alert('Please fill in all required fields');
      return;
    }

    if (formData.hasGoal && (!formData.goal || formData.goal < 1000)) {
      alert('Please enter a valid goal (minimum 1000 points)');
      return;
    }

    setCreating(true);

    try {
      // Get group name from localStorage if this is for a group
      let groupName = null;
      if (isGroup) {
        const savedProfile = localStorage.getItem('userProfile');
        if (savedProfile) {
          const profile = JSON.parse(savedProfile);
          groupName = profile.groupName;
        }
        if (!groupName) {
          alert('Group information not found. Please go back and select your group again.');
          navigate('/profile');
          return;
        }
      }

      // Check for duplicate competition names at the same school/group
      const duplicateQuery = query(
        collection(db, 'competitions'),
        where(isGroup ? 'groupName' : 'schoolName', '==', isGroup ? groupName : schoolName),
        where('name', '==', formData.name)
      );
      const duplicateSnapshot = await getDocs(duplicateQuery);
      
      if (!duplicateSnapshot.empty) {
        const existingCompetition = duplicateSnapshot.docs[0];
        const locationName = isGroup ? groupName : schoolName;
        alert(`A competition named "${formData.name}" already exists at ${locationName}. Redirecting to existing competition.`);
        navigate(`/competition/${existingCompetition.id}`);
        setCreating(false);
        return;
      }

      const competitionData = {
        name: formData.name,
        emoji: formData.emoji,
        endDate: formData.endDate,
        ...(isGroup ? { groupName } : { schoolName }),
        teamCount: 0,
        participantCount: 0,
        status: 'active',
        createdAt: new Date().toISOString(),
        hasGoal: formData.hasGoal,
        goal: formData.hasGoal ? formData.goal : null
      };
      
      const docRef = await addDoc(collection(db, 'competitions'), competitionData);
      
      // Update school's competition count (only for schools, not groups)
      if (!isGroup) {
        const schoolsQuery = query(
          collection(db, 'schools'),
          where('name', '==', schoolName)
        );
        const schoolsSnapshot = await getDocs(schoolsQuery);
        if (!schoolsSnapshot.empty) {
          const schoolDoc = schoolsSnapshot.docs[0];
          await updateDoc(doc(db, 'schools', schoolDoc.id), {
            competitionCount: (schoolDoc.data().competitionCount || 0) + 1
          });
        } else {
          // Create school entry if it doesn't exist
          await addDoc(collection(db, 'schools'), {
            name: schoolName,
            competitionCount: 1,
            participantCount: 0,
            createdAt: new Date().toISOString()
          });
        }
      }
      
      alert(`Competition "${formData.name}" created successfully!`);
      navigate(`/competition/${docRef.id}`);
    } catch (err) {
      console.error('Error creating competition:', err);
      alert('Failed to create competition. Please try again.');
    }

    setCreating(false);
  }

  return (
    <div className="min-h-screen bg-blue-shiny-gradient">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center">
          <div className="flex-1">
            <button 
              onClick={() => navigate(`/school/${encodeURIComponent(schoolName)}`)} 
              className="text-yellow-700 hover:text-yellow-800 font-medium"
            >
              ← Back to {schoolName}
            </button>
          </div>
          <div className="flex-1 text-center">
            <h1 className="text-2xl font-bold text-yellow-700">ReceiptRoyale</h1>
          </div>
          <div className="flex-1"></div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Create Competition</h2>
          <p className="text-gray-600 mb-8">Set up a new receipt scanning competition</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Competition Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Summer Shopping Challenge"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none"
                required
              />
            </div>


            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Choose an Emoji
              </label>
              <div className="grid grid-cols-5 gap-3">
                {emojiOptions.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setFormData({ ...formData, emoji })}
                    className={`text-4xl p-4 rounded-lg border-2 transition-colors flex items-center justify-center ${
                      formData.emoji === emoji
                        ? 'border-yellow-500 bg-yellow-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date *
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none"
                required
              />
            </div>

            <div>
              <div className="flex items-center mb-3">
                <input
                  type="checkbox"
                  id="hasGoal"
                  checked={formData.hasGoal}
                  onChange={(e) => setFormData({ ...formData, hasGoal: e.target.checked })}
                  className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
                />
                <label htmlFor="hasGoal" className="ml-2 block text-sm font-medium text-gray-700">
                  Set a goal
                </label>
              </div>
              
              {formData.hasGoal && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Winning Goal (points) *
                  </label>
                  <input
                    type="number"
                    value={formData.goal}
                    onChange={(e) => setFormData({ ...formData, goal: parseInt(e.target.value) || 0 })}
                    placeholder="50000"
                    min="1000"
                    step="1000"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none"
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    First team to reach this many points wins the competition
                  </p>
                </div>
              )}
              
              {!formData.hasGoal && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    <strong>No Goal Set:</strong> The team with the highest points by the end date will win the competition.
                  </p>
                </div>
              )}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> After creating the competition, teams can join and start uploading receipts. 
                Points are calculated automatically based on receipt amounts ($1 = 1000 points). 
                {formData.hasGoal 
                  ? `The first team to reach ${formData.goal.toLocaleString()} points wins the competition!`
                  : 'The team with the highest points by the end date wins the competition!'
                }
              </p>
            </div>

            <button
              type="submit"
              disabled={creating}
              className="w-full bg-gold text-white py-4 rounded-lg font-semibold hover:bg-gold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-lg transform hover:scale-105"
            >
              {creating ? 'Creating...' : 'Create Competition'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default CreateCompetition;

