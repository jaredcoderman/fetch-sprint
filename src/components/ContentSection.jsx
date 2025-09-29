import React from 'react'
import ProductCard from './ProductCard'

function ContentSection({ title, products }) {
  return (
    <section className="mb-6">
      <div className="flex justify-between items-center px-4 pb-4">
        <h2 className="text-xl font-bold text-gray-800">{title}</h2>
        <a href="#" className="text-blue-500 text-sm font-medium">See more</a>
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
