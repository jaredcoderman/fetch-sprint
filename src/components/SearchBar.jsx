import React from 'react'

function SearchBar() {
  return (
    <div className="mx-4 mb-6 flex items-center gap-3">
      <div className="flex-1 bg-gray-100 rounded-xl px-4 py-3 flex items-center gap-3">
        <div className="text-lg text-gray-500">🔍</div>
        <input 
          type="text" 
          placeholder="Search for 'checklists'" 
          className="border-none bg-transparent outline-none flex-1 text-base text-gray-500 placeholder-gray-400"
        />
      </div>
      <div className="text-pink-500 bg-pink-100 rounded-2xl px-2 py-2 font-bold">♥ 16</div>
    </div>
  )
}

export default SearchBar
