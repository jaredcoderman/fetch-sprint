import React, { useState } from "react";
import { Link } from "react-router-dom";
import BottomNavigation from "./components/BottomNavigation";

function ChecklistItem({ item, isChecked, onToggle }) {
  return (
    <div className="flex items-start gap-4 p-4 bg-white border-b border-gray-100">
      {/* Checkbox */}
      <button
        onClick={onToggle}
        className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
          isChecked
            ? "bg-orange-500 border-orange-500"
            : "bg-white border-gray-300"
        }`}
      >
        {isChecked && (
          <svg
            className="w-4 h-4 text-white"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </button>

      {/* Product Display */}
      <div className="flex-1">
        <div className="w-full h-32 bg-gray-100 rounded-lg mb-3 flex items-center justify-center text-gray-500 text-sm">
          {item.image}
        </div>
        <div className="flex items-center gap-1 mb-2">
          <span className="text-yellow-600 font-bold">$</span>
          <span className="text-yellow-600 font-bold">$</span>
          <span className="font-bold">{item.points}</span>
        </div>
        <p className="text-sm text-gray-800 leading-tight">{item.title}</p>
        {item.retailer && (
          <p className="text-xs text-gray-500 mt-1">@{item.retailer}</p>
        )}
      </div>
    </div>
  );
}

function ChecklistShow() {
  const [checkedItems, setCheckedItems] = useState([0]); // First item is checked by default

  const checklistItems = [
    {
      image: "M&M's Peanut Butter Chocolate Candy",
      points: "1,200",
      title: "M&M's Peanut Butter Chocolate Candy",
      retailer: "Walmart",
    },
    {
      image: "Butterfinger Marshmallow",
      points: "500 per $1",
      title: "Butterfinger Marshmallow",
    },
    {
      image: "Twix Ice Cream Bars",
      points: "800",
      title: "Twix Ice Cream Bars",
    },
  ];

  const toggleItem = (index) => {
    setCheckedItems((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  return (
    <div className="max-w-sm mx-auto bg-white min-h-screen relative pb-20">
      {/* Header */}
      <header className="flex justify-between items-center px-4 pt-5 pb-4 bg-white">
        <h1 className="text-3xl font-serif font-bold text-gray-800">
          My Checklists
        </h1>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm">
              ▶
            </div>
            <span className="text-blue-500 font-medium text-sm">Play</span>
          </div>
          <div className="bg-yellow-400 px-3 py-1.5 rounded-full flex items-center gap-1 font-bold text-gray-800">
            <span className="text-yellow-600">$</span>
            <span className="text-yellow-600">$</span>
            <span>20,091</span>
          </div>
        </div>
      </header>

      {/* Sub-Header */}
      <div className="flex items-center justify-between px-4 pb-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Link
            to="/my-checklists"
            className="text-gray-600 hover:text-gray-800 transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </Link>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-medium text-gray-800">
              My Movie Night
            </h2>
            <span className="text-lg">🎬</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="text-gray-600 hover:text-gray-800 transition-colors">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
              />
            </svg>
          </button>
          <div className="flex items-center gap-1 bg-white border border-red-200 rounded-full px-2 py-1">
            <span className="text-red-500 text-sm">♥</span>
            <span className="text-xs font-medium text-gray-700">102</span>
          </div>
        </div>
      </div>

      {/* Checklist Items */}
      <div className="flex-1">
        {checklistItems.map((item, index) => (
          <ChecklistItem
            key={index}
            item={item}
            isChecked={checkedItems.includes(index)}
            onToggle={() => toggleItem(index)}
          />
        ))}
      </div>

      <BottomNavigation />
    </div>
  );
}

export default ChecklistShow;
