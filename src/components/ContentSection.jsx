import React from 'react'
import { Link } from 'react-router-dom'
import ProductCard from './ProductCard'

function ContentSection({ title, emoji, heartCount = null, products }) {
  return (
    <section className="mb-6">
      <div className="flex justify-between items-center px-4 pb-4">
        <div className="flex items-center gap-2">
          {emoji && <span className="text-lg">{emoji}</span>}
          <h2 className="text-xl font-bold text-gray-800">{title}</h2>
          {heartCount && (
            <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-full px-2 py-1">
              <span className="text-red-500 text-sm">♥</span>
              <span className="text-xs font-medium text-gray-700">{heartCount}</span>
            </div>
          )}
        </div>
        <Link to="/all-checklists-show" className="text-blue-500 text-sm font-medium">See more</Link>
      </div>
      <div className="flex gap-4 px-4 overflow-x-auto scrollbar-hide">
        {products.map((product, index) => (
          <ProductCard
            key={index}
            image={product.image}
            points={product.points}
            title={product.title}
          />
        ))}
      </div>
    </section>
  )
}

export default ContentSection
