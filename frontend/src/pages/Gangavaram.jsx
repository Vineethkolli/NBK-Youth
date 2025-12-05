import React from "react";
import { Link } from "react-router-dom";

export default function Gangavaram() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 flex flex-col items-center p-6">
      
      {/* Header Title */}
      <h1 className="text-5xl font-extrabold text-blue-800 mt-10 drop-shadow-md">
        Gangavaram 🌾
      </h1>

      <p className="text-gray-700 text-lg mt-3 max-w-2xl text-center">
        A beautiful village filled with culture, greenery, unity and tradition in Inkollu Mandal,
        Prakasam District 🇮🇳
      </p>

      {/* About Village */}
      <section className="bg-white shadow-lg rounded-2xl p-6 mt-10 max-w-3xl text-gray-700">
        <h2 className="text-2xl font-bold text-blue-700 mb-3">About Gangavaram</h2>
        <p className="leading-relaxed text-justify">
          Gangavaram is a peaceful and proud village known for agriculture, festivals,
          and our strong community bond. Surrounded by greenery and water resources,
          the village stands as a symbol of culture and devotion.
        </p>
      </section>

      {/* About App */}
      <section className="bg-white shadow-lg rounded-2xl p-6 mt-6 max-w-3xl text-gray-700">
        <h2 className="text-2xl font-bold text-blue-700 mb-3">About NBK Youth App 📱</h2>
        <p className="leading-relaxed text-justify">
          NBK Youth App connects our village people wherever they are in the world.
          Stay updated with events, culture and youth celebrations.
        </p>
      </section>

      {/* Buttons */}
      <div className="flex space-x-4 mt-10">
        <Link
          to="/signin"
          className="bg-blue-700 hover:bg-blue-800 text-white py-3 px-6 rounded-xl shadow-md transition transform hover:scale-105"
        >
          Log In
        </Link>
        <Link
          to="/signup"
          className="bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-xl shadow-md transition transform hover:scale-105"
        >
          Create Account
        </Link>
      </div>

            {/* Village Highlights */}
      <section className="bg-white shadow-lg rounded-2xl p-6 mt-6 max-w-3xl w-full">
        <h2 className="text-2xl font-bold text-blue-700 mb-4">Village Highlights ✨</h2>
        <ul className="list-disc pl-5 text-gray-700 space-y-2">
          <li><strong>Agriculture</strong> is the heartbeat of our land 🌱</li>
          <li>Celebration of festivals brings everyone together 🎉</li>
          <li>Unity and brotherhood among villagers 🫂</li>
          <li>Temples with rich history and devotion 🛕</li>
          <li>Youth power driving village development 🚀</li>
        </ul>
      </section>

      {/* Footer */}
      <footer className="mt-16 text-gray-600 text-sm">
        © 2024 Developed by Kolli Vineeth ✨
      </footer>
    </div>
  );
}
