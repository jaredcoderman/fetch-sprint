import React from 'react'

function SearchBar() {
  return (
    <div className="mx-4 mb-6 bg-gray-100 rounded-xl px-4 py-3 flex items-center gap-3">
      <div className="text-lg text-gray-500">🔍</div>
      <input 
        type="text" 
        placeholder="Search for 'checklists'" 
        className="border-none bg-transparent outline-none flex-1 text-base text-gray-500 placeholder-gray-400"
      />
    </div>
  )
}

export default SearchBar
