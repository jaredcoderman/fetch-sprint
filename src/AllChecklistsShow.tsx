import React from "react";
import { Link } from "react-router-dom";
import BottomNavigation from "./components/BottomNavigation";

function StoreLocation({
  store,
  distance,
  price,
  isOnSale = false,
  isBogo = false,
}) {
  return (
    <div className="flex flex-col items-center min-w-20">
      <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mb-2">
        <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
          <span className="text-xs font-bold text-blue-600">
            {store.charAt(0)}
          </span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-xs text-gray-600 mb-1">{distance}</p>
        <p
          className={`text-xs font-medium ${
            isOnSale || isBogo ? "text-red-500" : "text-gray-800"
          }`}
        >
          {isOnSale && "On Sale: "}
          {isBogo && "BOGO: "}
          {price}
        </p>
      </div>
    </div>
  );
}

function ProductCard({
  image,
  points,
  title,
  retailer,
  hasPlusButton = true,
  buttonColor = "orange",
}) {
  return (
    <div className="min-w-40 bg-white rounded-xl shadow-lg overflow-hidden relative">
      {hasPlusButton && (
        <button
          className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-bold z-10 ${
            buttonColor === "orange" ? "bg-orange-500" : "bg-blue-500"
          }`}
        >
          +
        </button>
      )}
      <div className="h-30 bg-gray-100 flex items-center justify-center text-gray-500 text-xs text-center p-2">
        {image}
      </div>
      <div className="p-3">
        <div className="flex items-center gap-1 mb-2">
          <span className="text-yellow-600 font-bold">$</span>
          <span className="text-yellow-600 font-bold">$</span>
          <span className="font-bold">{points}</span>
        </div>
        <p className="text-sm text-gray-800 leading-tight">{title}</p>
        {retailer && <p className="text-xs text-gray-500 mt-1">@{retailer}</p>}
      </div>
    </div>
  );
}

function AllChecklistsShow() {
  const storeLocations = [
    { store: "CVS", distance: "0.45 mi", price: "$1.99", isOnSale: true },
    { store: "Walgreens", distance: "0.50 mi", price: "$3.99" },
    { store: "7-Eleven", distance: "3.42 mi", price: "$3.69", isBogo: true },
  ];

  const products = [
    {
      image: "M&M's Peanut Butter Chocolate Candy",
      points: "1,200",
      title: "M&M's Peanut Butter Chocolate Candy",
      retailer: "Walmart",
      buttonColor: "orange",
    },
    {
      image: "Butterfinger Marshmallow",
      points: "500 per $1",
      title: "Butterfinger Marshmallow",
      retailer: "CVS",
      buttonColor: "blue",
    },
  ];

  return (
    <div className="max-w-sm mx-auto bg-white min-h-screen relative pb-20">
      {/* Header */}
      <header className="flex justify-between items-center px-4 pt-5 pb-4 bg-white">
        <h1 className="text-3xl font-serif font-bold text-gray-800">
          All Checklists
        </h1>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm">
              🎮
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
            to="/all-checklists"
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
            <h2 className="text-lg font-bold text-gray-800">
              Ava's Movie Night
            </h2>
            <span className="text-lg">🎬</span>
          </div>
        </div>
        <div className="flex items-center gap-1 bg-gray-100 rounded-full px-2 py-1">
          <span className="text-red-500 text-sm">♥</span>
          <span className="text-xs font-medium text-gray-700">102</span>
        </div>
      </div>

      {/* Product Cards */}
      <div className="px-4 py-4">
        <div className="flex gap-4 overflow-x-auto scrollbar-hide">
          {products.map((product, index) => (
            <ProductCard
              key={index}
              image={product.image}
              points={product.points}
              title={product.title}
              retailer={product.retailer}
              buttonColor={product.buttonColor}
            />
          ))}
        </div>
      </div>

      {/* Store Locations */}
      <div className="px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-800">Store Locations</h3>
          <Link
            to="/checklist-show"
            className="text-blue-500 text-sm font-medium"
          >
            See more
          </Link>
        </div>
        <div className="flex gap-4 overflow-x-auto scrollbar-hide">
          {storeLocations.map((location, index) => (
            <StoreLocation
              key={index}
              store={location.store}
              distance={location.distance}
              price={location.price}
              isOnSale={location.isOnSale}
              isBogo={location.isBogo}
            />
          ))}
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
}

export default AllChecklistsShow;
