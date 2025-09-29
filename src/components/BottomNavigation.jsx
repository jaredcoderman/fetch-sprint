import React from 'react'

function BottomNavigation() {
  const navItems = [
    { icon: '🏠', label: 'Home', active: true },
    { icon: '🏪', label: 'Store' },
    { icon: '📷', label: 'Camera', hasBadge: true },
    { icon: '📋', label: 'Checklist' },
    { icon: '🎵', label: 'Music' }
  ]

  return (
    <nav className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-sm bg-white border-t border-gray-200 flex justify-around py-3 shadow-lg">
      {navItems.map((item, index) => (
        <div key={index} className="flex flex-col items-center gap-1 cursor-pointer">
          <div className={`text-2xl ${item.active ? 'text-blue-500' : 'text-gray-500'} ${item.hasBadge ? 'relative' : ''}`}>
            {item.icon}
            {item.hasBadge && (
              <span className="absolute -top-2 -right-2 bg-amber-500 text-white rounded-full w-4 h-4 text-xs flex items-center justify-center font-bold">
                e
              </span>
            )}
          </div>
        </div>
      ))}
    </nav>
  )
}

export default BottomNavigation
