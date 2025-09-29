import React from 'react'

function ReferralBanner() {
  return (
    <div className="mx-4 mb-6 bg-gradient-to-br from-pink-500 to-yellow-400 rounded-2xl p-5 flex justify-between items-center text-white">
      <div>
        <h3 className="text-lg font-bold mb-2">Score</h3>
        <div className="flex items-center gap-1 text-2xl font-bold mb-1">
          <span className="text-yellow-300">$</span>
          <span>4,000</span>
        </div>
        <p className="text-sm opacity-90">for every referral.</p>
      </div>
      <div>
        <p className="text-sm font-medium mb-2">Your next REWARD</p>
        <div className="flex gap-1 text-xl">
          <span className="text-yellow-300">$</span>
          <span className="text-yellow-300">$</span>
        </div>
      </div>
    </div>
  )
}

export default ReferralBanner
