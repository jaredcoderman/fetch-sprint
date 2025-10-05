import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';

function CreateCompetition() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    emoji: '🏆',
    endDate: ''
  });
  const [creating, setCreating] = useState(false);

  const emojiOptions = ['🏆', '🎯', '⚡', '🔥', '🌟', '💎', '🎪', '🎨', '🚀', '🎉'];

  async function handleSubmit(e) {
    e.preventDefault();
    
    if (!formData.name || !formData.description) {
      alert('Please fill in all required fields');
      return;
    }

    setCreating(true);

    try {
      const competitionData = {
        ...formData,
        teamCount: 0,
        participantCount: 0,
        status: 'active',
        createdBy: currentUser.uid,
        createdAt: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, 'competitions'), competitionData);
      navigate(`/competition/${docRef.id}`);
    } catch (err) {
      console.error('Error creating competition:', err);
      alert('Failed to create competition. Please try again.');
    }

    setCreating(false);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <button 
            onClick={() => navigate('/competitions')} 
            className="text-indigo-600 hover:text-indigo-700 font-medium"
          >
            ← Back
          </button>
          <h1 className="text-2xl font-bold text-indigo-600">Receipt Sprint</h1>
          <div className="w-20"></div>
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the competition..."
                rows="4"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
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
                    className={`text-4xl p-4 rounded-lg border-2 transition-colors ${
                      formData.emoji === emoji
                        ? 'border-indigo-500 bg-indigo-50'
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
                End Date (optional)
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> After creating the competition, teams can join and start uploading receipts. 
                Points are calculated automatically based on receipt amounts ($1 = 100 points).
              </p>
            </div>

            <button
              type="submit"
              disabled={creating}
              className="w-full bg-indigo-600 text-white py-4 rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-lg"
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

