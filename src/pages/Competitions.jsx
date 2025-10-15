import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

function Competitions() {
  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { schoolName } = useParams();

  const decodedSchoolName = schoolName
    ? decodeURIComponent(schoolName).replace(/-/g, ' ')
    : null;

  useEffect(() => {
    loadCompetitions();
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <button 
            onClick={() => navigate('/')}
            className="text-indigo-600 hover:text-indigo-700 font-medium"
          >
            ← Home
          </button>
          <h1 className="text-2xl font-bold text-indigo-600">Receipt Sprint</h1>
          <div className="w-20"></div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Active Competitions {decodedSchoolName && (
              <span className="text-indigo-600">for {decodedSchoolName}</span>
            )}
          </h2>
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
                <p className="text-gray-600 mb-4">{comp.description}</p>
                <div className="space-y-2 mb-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Teams:</span>
                    <span className="font-semibold">{comp.teamCount || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Participants:</span>
                    <span className="font-semibold">{comp.participantCount || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Ends:</span>
                    <span className="font-semibold">{comp.endDate || 'TBA'}</span>
                  </div>
                </div>
                <button
                  onClick={() => navigate(`/competition/${comp.id}`)}
                  className="w-full bg-indigo-600 text-white py-2 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
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

