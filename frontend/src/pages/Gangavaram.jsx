import React from "react";
import { Link } from "react-router-dom";
import LanguageToggle from '../components/auth/LanguageToggle';

export default function Gangavaram() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 flex flex-col items-center p-6">

        <div className="absolute top-3 right-4">
          <LanguageToggle />
        </div>

        <div className="flex items-center justify-center mt-10 gap-3">
        <img
          src="/logo/512.png"   // <-- Put logo.png in public folder
          alt="Gangavaram Logo"
          className="w-12 h-12 rounded-full shadow-md"
        />
        <h1 className="text-4xl font-extrabold text-blue-800 drop-shadow-md">
          GANGAVARAM
        </h1>
      </div>

      <p className="text-gray-700 text-lg mt-3 max-w-2xl text-center">
        Our Roots, Our Culture, Our Pride
      </p>
      

      {/* About App */}
      <section className="bg-white shadow-lg rounded-2xl p-6 mt-6 max-w-3xl w-full">
        <p className="leading-relaxed text-justify text-gray-700">
          This website and app are the official digital platform of Gangavaram village — connecting our people
          wherever they are in the world. Stay connected with village, culture, and youth celebrations.
        </p>
      </section>

      {/* Buttons */}
      <div className="flex space-x-4 mt-8">
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

      {/* Village Info */}
      <section className="bg-white shadow-lg rounded-2xl p-6 mt-10 max-w-3xl w-full">
        <h2 className="text-2xl font-bold text-blue-700 mb-4">My Gangavaram Village</h2>
        <p className="leading-relaxed text-justify text-gray-700">
          Gangavaram is a village in Inkollu Mandal, Prakasam district, Andhra Pradesh.  
          As per 2011 census, the village has a total population of <strong>2,949</strong> people, living in <strong>848 households</strong>.  
          The literacy rate is approximately <strong>66.4%</strong>.
        </p>
      </section>

      {/* Village Highlights */}
      <section className="bg-white shadow-lg rounded-2xl p-6 mt-6 max-w-3xl w-full">
        <h2 className="text-2xl font-bold text-blue-700 mb-4">Village Highlights ✨</h2>
        <ul className="list-disc pl-5 text-gray-700 space-y-2">
          <li>Farming is the backbone of our land 🌱</li>
          <li>Strong village bonding and neighbourly spirit 🫂</li>
          <li>We follow the rich cultural heritage 🎶🛕 </li>
          <li>Festivals and community events bring us together 🎉</li>
        </ul>
      </section>

      {/* Footer */}
      <footer className="mt-16 text-gray-600 text-sm">
        © 2024 Developed by Kolli Vineeth ✨
      </footer>
    </div>
  );
}
