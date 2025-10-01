import React from "react";
import ContentSection from "./components/ContentSection";
import BottomNavigation from "./components/BottomNavigation";

function AllChecklists() {
  const avasMovieNightProducts = [
    {
      image: "M&M's Peanut Butter Chocolate Candy",
      points: "1,200",
      title: "M&M's Peanut Butter Chocolate Candy @ Walmart",
    },
    {
      image: "TWIX Ice Cream Bars",
      points: "800",
      title: "TWIX bars @CVS",
    },
    {
      image: "Popcorn",
      points: "600",
      title: "Movie Theater Popcorn",
    },
  ];

  const tomsDormEssentialsProducts = [
    {
      image: "Brita Pitchers OR Dispensers",
      points: "3,000",
      title: "Brita Pitchers OR Dispensers @ Target",
    },
    {
      image: "SleepRight Full Size Pillows",
      points: "25,000",
      title: "SleepRight Full Size Pillows at Sleepright.com @ Target",
    },
    {
      image: "Dorm Bedding Set",
      points: "15,000",
      title: "Complete Dorm Bedding Set",
    },
  ];

  const jamesGameDayProducts = [
    {
      image: "Corn Nuts Original",
      points: "900",
      title: "Corn Nuts Original",
    },
    {
      image: "M&M's Peanut Butter",
      points: "1,200",
      title: "M&M's Peanut Butter",
    },
    {
      image: "Sports Drinks",
      points: "1,500",
      title: "Sports Energy Drinks",
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

      {/* Content Sections */}
      <ContentSection
        title="Ava's Movie night"
        emoji="🎬"
        products={avasMovieNightProducts}
      />
      <ContentSection
        title="Tom's Dorm Essentials"
        emoji="🏠"
        products={tomsDormEssentialsProducts}
      />
      <ContentSection
        title="James' Game Day"
        emoji="🏈"
        products={jamesGameDayProducts}
      />

      <BottomNavigation />
    </div>
  );
}

export default AllChecklists;
