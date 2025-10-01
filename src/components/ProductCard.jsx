import React from 'react'

function ProductCard({ image, points, title }) {
  return (
    <div className="min-w-40 bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="h-30 bg-gray-100 flex items-center justify-center text-gray-500 text-xs text-center p-2">
        {image}
      </div>
      <div className="p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1">
            <span className="text-yellow-600 font-bold">$</span>
            <span className="text-yellow-600 font-bold">$</span>
            <span className="font-bold">{points}</span>
          </div>
          <button className="w-6 h-6 bg-black rounded-full flex items-center justify-center text-white text-sm font-bold hover:bg-gray-800 transition-colors">
            +
          </button>
        </div>
        <p className="text-sm text-gray-800 leading-tight">{title}</p>
      </div>
    </div>
  )
}

export default ProductCard
