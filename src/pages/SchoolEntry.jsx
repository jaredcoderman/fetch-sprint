import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';

function SchoolEntry() {
  const navigate = useNavigate();
  const [schoolName, setSchoolName] = useState('');
  const [loading, setLoading] = useState(false);

  // Format school name to title case
  function formatSchoolName(name) {
    return name
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  // Search for school in universities database
  async function searchForSchool(schoolName) {
    const formattedName = formatSchoolName(schoolName.trim());
    
    // Try exact match first
    let universitiesQuery = query(
      collection(db, 'universities'),
      where('name', '==', formattedName),
      limit(1)
    );
    
    let snapshot = await getDocs(universitiesQuery);
    
    if (!snapshot.empty) {
      return snapshot.docs[0].data();
    }
    
    // Try partial match (case-insensitive)
    const allUniversitiesQuery = query(
      collection(db, 'universities'),
      orderBy('name'),
      limit(1000) // Get a reasonable number to search through
    );
    
    const allSnapshot = await getDocs(allUniversitiesQuery);
    const searchTerm = formattedName.toLowerCase();
    
    for (const doc of allSnapshot.docs) {
      const university = doc.data();
      if (university.name && university.name.toLowerCase().includes(searchTerm)) {
        return university;
      }
    }
    
    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    
    if (!schoolName.trim()) {
      alert('Please enter your school name');
      return;
    }

    setLoading(true);

    try {
      const formattedSchoolName = formatSchoolName(schoolName.trim());
      
      // For now, just navigate directly to the school page
      // We'll handle school creation in the SchoolCompetitions component
      navigate(`/school/${encodeURIComponent(formattedSchoolName)}`);
      
    } catch (error) {
      console.error('Error processing school:', error);
      alert('Failed to process school name. Please try again.');
    }
    
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">ReceiptRoyale</h1>
          <p className="text-gray-600">Enter your school to get started</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              School Name *
            </label>
            <input
              type="text"
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              placeholder="e.g., Harvard University"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              required
            />
            <p className="text-sm text-gray-500 mt-2">
              Enter your school name to access competitions
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : 'Continue'}
          </button>
        </form>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>How it works:</strong> Enter your school name to access competitions. 
            We'll search our database of universities to find your school and direct you to the right page.
          </p>
        </div>
      </div>
    </div>
  );
}

export default SchoolEntry;
