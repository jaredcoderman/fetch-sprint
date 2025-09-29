import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import SearchBar from './components/SearchBar'
import ContentSection from './components/ContentSection'
import ReferralBanner from './components/ReferralBanner'
import BottomNavigation from './components/BottomNavigation'
import TestPage from './components/TestPage'

function HomePage() {
  const forYouProducts = [
    {
      image: "M&M's Image",
      points: "1,200",
      title: "M&M's Peanut Butter Chocolate Candy"
    },
    {
      image: "EXTRA Gum Image",
      points: "800",
      title: "EXTRA Gum"
    },
    {
      image: "Third Product Image",
      points: "1,500",
      title: "Third Product"
    }
  ]

  const trendingProducts = [
    {
      image: "Brita Pitcher Image",
      points: "3,000",
      title: "Brita Pitchers or"
    },
    {
      image: "Kodiak Bars Image",
      points: "1,000",
      title: "Kodiak Bars"
    }
  ]

  return (
    <div className="max-w-sm mx-auto bg-white min-h-screen relative pb-20">
      <Header />
      <SearchBar />
      <ContentSection title="For you" products={forYouProducts} />
      <ReferralBanner />
      <ContentSection title="Trending offers" products={trendingProducts} />
      <BottomNavigation />
    </div>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/test" element={<TestPage />} />
    </Routes>
  )
}

export default App
