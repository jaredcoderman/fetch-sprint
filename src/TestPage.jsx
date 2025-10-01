import React from 'react'
import { Link } from 'react-router-dom'

function TestPage() {
  return (
    <div className="max-w-sm mx-auto bg-white min-h-screen relative pb-20">
      <header className="flex justify-between items-center px-4 pt-5 pb-4 bg-white">
        <h1 className="text-2xl font-bold text-gray-800">Test Page</h1>
        <Link 
          to="/" 
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
        >
          Back to Home
        </Link>
      </header>
      
      <div className="px-4 py-8">
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg mb-6">
          <h2 className="text-lg font-bold mb-2">🎉 Routing Works!</h2>
          <p>This page was loaded without a full page refresh using React Router.</p>
        </div>
        
        <div className="space-y-4">
          <div className="bg-gray-100 p-4 rounded-lg">
            <h3 className="font-bold text-gray-800 mb-2">Features Tested:</h3>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              <li>Client-side routing</li>
              <li>No page refresh</li>
              <li>URL changes in browser</li>
              <li>Back/forward navigation</li>
            </ul>
          </div>
          
          <div className="bg-blue-100 p-4 rounded-lg">
            <h3 className="font-bold text-blue-800 mb-2">Navigation:</h3>
            <p className="text-blue-600">
              Use the "Back to Home" button above or the browser's back button to return to the main page.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TestPage
