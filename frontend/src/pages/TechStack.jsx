import React, { useState } from "react";
import { ExternalLink } from "lucide-react";
import { FaShareAlt } from "react-icons/fa";
import { SiYoutube, SiInstagram } from "react-icons/si";
import TechStackDetails from "../components/techstack/Technologies";
import MindMap from "../components/techstack/MindMap";
import Access from '../components/techstack/Access';

function TechStack() {
  const [websites] = useState([
    {
      name: "Current Website",
      url: "https://nbkyouth.vercel.app",
    },
  ]);

  const mottos = [
    {
      title: "100% Transparency",
      description: "Complete visibility into all financial transactions",
      icon: "👁️",
    },
    {
      title: "Real-time Updates",
      description: "Transaction to transaction live updates",
      icon: "⚡",
    },
    {
      title: "Zero Cost",
      description: "Built entirely with free and open source technologies",
      icon: "💰",
    },
  ];


  // Share function using Web Share API
  const handleShare = (url) => {
    if (navigator.share) {
      navigator
        .share({
          title: "NBK Youth",
          text: "NBK Youth Gangavaram",
          url,
        })
        .catch((error) => console.log("Error sharing", error));
    } else {
      alert("Share not supported on this browser.");
    }
  };

  return (
<div className="space-y-6">
  <div className="flex flex-col md:flex-row items-center justify-between mb-16">
    {/* Social Media Section */}
    <div className="mb-4">
      <span className="block font-semibold text-gray-400">Follow us</span>
      <div className="flex items-center space-x-4 mt-2">
        <SiYoutube
          className="cursor-pointer h-6 w-6 text-red-500"
          title="YouTube"
          onClick={() =>
            window.open("https://www.youtube.com/@sivakoniki7335", "_blank", "noopener,noreferrer")
          }
        />
        <SiInstagram
          className="cursor-pointer h-6 w-6 text-pink-500"
          title="Instagram"
          onClick={() =>
            window.open("https://www.instagram.com/mana_station_gangavaram/?igsh=MXU5cjM1ajVpemJm#", "_blank", "noopener,noreferrer")
          }
        />
      </div>
    </div>

    {/* Website Links Section */}
    <div className="space-y-4">
        {websites.map((site) => (
          <div
            key={site.name}
            className="flex items-center justify-between text-gray-700 "
          >
            <span>{site.name}</span>
            <div className="flex items-center space-x-2 "><br></br>
              <ExternalLink
                className="h-4 w-4 cursor-pointer hover:text-indigo-600"
                title="Open Link"
                onClick={() =>
                  window.open(site.url, "_blank", "noopener,noreferrer")
                }
              />
              <FaShareAlt
                className="h-4 w-4 cursor-pointer hover:text-indigo-600"
                title="Share Link"
                onClick={() => handleShare(site.url)}
              />
            </div>
          </div>
        ))}
      </div>

    <div className="space-y-4"><br></br>  
  </div>  

        {/* Logo with Developer Name */}
        <div className="md:w-1/2 text-center  ">
          <div className="relative inline-block ">
            <img
              src="developerImage.png"
              alt="Developer"
              className="mx-auto rounded-full border-4 border-indigo-500 shadow-lg transform transition duration-500 hover:scale-105"
            />
            <div className="absolute inset-0 rounded-full border-4 border-dashed border-indigo-300 animate-pulse"></div>
          </div>
          <p className="mt-4 text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 font-extrabold text-2xl">
            Developed by Kolli Vineeth
          </p>
        </div>
      </div>

      {/* Principles Section */}
      <section className="mb-16">
        <h2 className="text-2xl font-semibold text-gray-900 mb-8">Principles</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {mottos.map((motto) => (
            <div
              key={motto.title}
              className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow"
            >
              <div className="text-4xl mb-4">{motto.icon}</div>
              <h3 className="text-xl font-semibold mb-2">{motto.title}</h3>
              <p className="text-gray-600">{motto.description}</p>
            </div>
          ))}
        </div>
      </section>
      <MindMap />
      <Access />
      {/* (Platforms, Technologies, References, Footer) */}
      <TechStackDetails />
    </div>
  );
}

export default TechStack;
