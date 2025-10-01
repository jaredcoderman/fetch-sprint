import React from 'react'
import { Link, useLocation } from 'react-router-dom'

function BottomNavigation() {
  const location = useLocation()
  
  const navItems = [
    { icon: '🏠', label: 'Home', path: '/', active: location.pathname === '/' },
    { icon: '🏪', label: 'Store', path: '/store' },
    { icon: '📷', label: 'Camera', path: '/camera', hasBadge: true, active: location.pathname === '/checklist-show' || location.pathname === '/all-checklists' || location.pathname === '/all-checklists-show' },
    { icon: '📋', label: 'Checklist', path: '/checklists', active: location.pathname === '/checklists' || location.pathname === '/my-checklists' },
    { icon: '🎵', label: 'Music', path: '/music' }
  ]

  return (
    <nav className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-sm bg-white border-t border-gray-200 flex justify-around py-3 shadow-lg">
      {navItems.map((item, index) => (
        <Link 
          key={index} 
          to={item.path} 
          className="flex flex-col items-center gap-1 cursor-pointer"
        >
          <div className={`text-2xl ${item.active ? 'text-blue-500' : 'text-gray-500'} ${item.hasBadge ? 'relative' : ''}`}>
            {item.icon}
            {item.hasBadge && (
              <span className="absolute -top-2 -right-2 bg-amber-500 text-white rounded-full w-4 h-4 text-xs flex items-center justify-center font-bold">
                e
              </span>
            )}
          </div>
        </Link>
      ))}
    </nav>
  )
}

export default BottomNavigation
