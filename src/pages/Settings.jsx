import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { initializeOpenAI } from '../utils/receiptOCR';

function Settings() {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const [apiKey, setApiKey] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Load saved API key from localStorage
    const savedKey = localStorage.getItem('openai_api_key');
    if (savedKey) {
      setApiKey(savedKey);
      initializeOpenAI(savedKey);
    }
  }, []);

  function handleSave() {
    if (!apiKey.trim()) {
      alert('Please enter an API key');
      return;
    }

    // Save to localStorage
    localStorage.setItem('openai_api_key', apiKey);
    
    // Initialize OpenAI
    initializeOpenAI(apiKey);
    
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  async function handleLogout() {
    try {
      await logout();
      navigate('/');
    } catch (err) {
      console.error('Failed to logout:', err);
    }
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
          <h1 className="text-2xl font-bold text-indigo-600">Settings</h1>
          <div className="w-20"></div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Account Info */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Account</h2>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-500">Email</label>
              <p className="text-lg font-medium text-gray-900">{currentUser?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>

        {/* OpenAI API Configuration */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Receipt OCR Settings</h2>
          <p className="text-gray-600 mb-6">
            Configure OpenAI API for automatic receipt processing
          </p>

          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-yellow-800">
              <strong>⚠️ Important:</strong> This is stored in your browser's localStorage. 
              In production, API keys should be stored securely on a backend server.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                OpenAI API Key *
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none font-mono text-sm"
              />
              <p className="text-xs text-gray-500 mt-2">
                Get your API key from{' '}
                <a 
                  href="https://platform.openai.com/api-keys" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:text-indigo-700"
                >
                  OpenAI Platform
                </a>
              </p>
            </div>

            <button
              onClick={handleSave}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
            >
              {saved ? '✓ Saved!' : 'Save Settings'}
            </button>
          </div>

          <div className="mt-8 border-t pt-6">
            <h3 className="font-semibold text-gray-900 mb-3">How it works:</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• Upload a receipt image</li>
              <li>• GPT-4 Vision automatically extracts the total amount</li>
              <li>• The amount is verified before points are awarded</li>
              <li>• This prevents users from entering fake amounts</li>
            </ul>
          </div>

          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">💡 Cost Estimate:</h3>
            <p className="text-sm text-blue-800">
              Using GPT-4o-mini: ~$0.01 per receipt<br/>
              Using GPT-4o: ~$0.05 per receipt<br/>
              (Current implementation uses gpt-4o-mini for cost efficiency)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;

