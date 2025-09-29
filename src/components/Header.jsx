import React from 'react'
import { Link } from 'react-router-dom'

function Header() {
  return (
    <header className="flex justify-between items-center px-4 pt-5 pb-4 bg-white">
      <h1 className="text-2xl font-bold text-gray-800">Discover</h1>
      <div className="flex items-center gap-3">
        <Link 
          to="/test" 
          className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-base hover:bg-orange-600 transition-colors"
          title="Test Page"
        >
          +
        </Link>
        <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold text-base">▶</div>
        <div className="bg-yellow-400 px-3 py-1.5 rounded-full flex items-center gap-1 font-bold text-gray-800">
          <span className="text-yellow-600">$</span>
          <span>20,091</span>
        </div>
        <div className="text-pink-500 font-bold">♥ 16</div>
      </div>
    </header>
  )
}

export default Header
