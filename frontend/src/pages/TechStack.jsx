import { useState } from "react";
import { ExternalLink } from "lucide-react";
import { Github as LucideGithub } from "lucide-react";
import { FaWhatsapp, FaCode, FaShareAlt, FaRobot } from "react-icons/fa";
import {SiVercel, SiRender, SiMongodb, SiGmail, SiCloudinary, SiReact, SiTailwindcss, SiVite, SiNodedotjs, SiExpress,
        SiGit, SiGithub, SiGoogletranslate, SiGoogledrive, SiPostman, SiGoogle, SiOpenai, SiYoutube, SiGithubcopilot, SiInstagram } from "react-icons/si";
import Footer from '../components/Footer';

function TechStack() {
  const [websites] = useState([
    {
      name: "Current Website",
      url: "https://nbkyouth.vercel.app",
    },
    {
      name: "Old Website",
      url: "https://sites.google.com/view/nbkyouthgangavaram",
    },
    {
      name: "GitHub",
      url: "https://github.com/Vineethkolli/NBK-Youth",
      isGitHub: true,
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

  const infrastructure = [
    {
      category: "Frontend Hosting",
      name: "Vercel",
      icon: <SiVercel className="h-12 w-12 text-black-600" />,
      description: "Frontend deployment and hosting platform",
    },
    {
      category: "Backend Hosting",
      name: "Render",
      icon: <SiRender className="h-12 w-12 text-black-600" />,
      description: "Backend server deployment",
    },
    {
      category: "Database",
      name: "MongoDB",
      icon: <SiMongodb className="h-12 w-12 text-green-600" />,
      description: "NoSQL database for data storage",
    },
    {
      category: "Email Service",
      name: "Gmail SMTP",
      icon: <SiGmail className="h-12 w-12 text-red-600" />,
      description: "OTP delivery and notifications",
    },
    {
      category: "Media Storage",
      name: "Cloudinary",
      icon: <SiCloudinary className="h-12 w-12 text-blue-600" />,
      description: "Cloud storage for images and audio",
    },
    {
      category: "Photos & Images",
      name: "Google Drive",
      icon: <SiGoogledrive className="h-12 w-12 text-green-500" />,
      description: "Cloud storage for photos, images and videos",
    },
  ];

  // Split technologies into separate categories
  const frontendTech = [
    { name: "React", icon: <SiReact className="h-8 w-8 mr-2 text-blue-500" /> },
    { name: "Tailwind CSS", icon: <SiTailwindcss className="h-8 w-8 mr-2 text-teal-500" /> },
    { name: "Vite", icon: <SiVite className="h-8 w-8 mr-2 text-purple-500" /> },
  ];
  const backendTech = [
    { name: "Node.js", icon: <SiNodedotjs className="h-8 w-8 mr-2 text-green-500" /> },
    { name: "Express", icon: <SiExpress className="h-8 w-8 mr-2 text-gray-500" /> },
    { name: "MongoDB", icon: <SiMongodb className="h-8 w-8 mr-2 text-green-600" /> },
    { name: "JWT Authentication", icon: <FaCode className="h-8 w-8 mr-2 text-orange-500" /> },
  ];
  const features = [
    { name: "Web Push (Notifications)", icon: <FaCode className="h-8 w-8 mr-2 text-gray-500" /> },
    { name: "Progressive Web App (APP)", icon: <FaCode className="h-8 w-8 mr-2 text-gray-500" /> },
    { name: "Google Translate (Multi Language)", icon: <SiGoogletranslate className="h-8 w-8 mr-2 text-blue-500" /> },
    { name: "WhatsApp (Auto Load Message)", icon: <FaWhatsapp className="h-8 w-8 mr-2 text-green-500" /> },
  ];
  const tools = [
    { name: "GitHub", icon: <SiGithub className="h-8 w-8 mr-2 text-gray-800" /> },
    { name: "Git", icon: <SiGit className="h-8 w-8 mr-2 text-red-600" /> },
    { name: "VS Code", icon: <FaCode className="h-8 w-8 mr-2 text-blue-500" /> },
    { name: "Postman", icon: <SiPostman className="h-8 w-8 mr-2 text-orange-500" /> },
  ];

  const techCategories = [
    { category: "Frontend", items: frontendTech },
    { category: "Backend", items: backendTech },
    { category: "Features", items: features },
    { category: "Tools", items: tools },
  ];

  // New sources with icons
  const sources = [
    { name: "Google", icon: <SiGoogle className="h-8 w-8 mr-2 text-blue-500" /> },
    { name: "YouTube", icon: <SiYoutube className="h-8 w-8 mr-2 text-red-500" /> },
    { name: "ChatGPT", icon: <SiOpenai className="h-8 w-8 mr-2 text-green-500" /> },
    { name: "GitHub", icon: <SiGithub className="h-8 w-8 mr-2 text-gray-800" /> },
    { name: "AI Tools", icon: <FaRobot className="h-8 w-8 mr-2 text-purple-500" /> },
    { name: "Copilot", icon: <SiGithubcopilot className="h-8 w-8 mr-2 text-indigo-500" /> },
  ];

  // Share function using Web Share API
  const handleShare = (url) => {
    if (navigator.share) {
      navigator
        .share({
          title: "Check this out",
          url,
        })
        .catch((error) => console.log("Error sharing", error));
    } else {
      alert("Share not supported on this browser.");
    }
  };

  return (
<div className="space-y-6">
  {/* Header Section */}
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
          className="flex items-center justify-between text-gray-700 hover:text-indigo-600"
        >
          <span>
            {site.isGitHub ? (
              <div className="flex items-center">
                <LucideGithub className="h-4 w-4 mr-2" />
                GitHub
              </div>
            ) : (
              site.name
            )}
          </span>
          <div className="flex items-center space-x-2">
            <ExternalLink
              className="h-4 w-4 cursor-pointer"
              title="Open Link"
              onClick={() =>
                window.open(site.url, "_blank", "noopener,noreferrer")
              }
            />
            <FaShareAlt
              className="h-4 w-4 cursor-pointer"
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
            {/* Animated dashed border overlay */}
            <div className="absolute inset-0 rounded-full border-4 border-dashed border-indigo-300 animate-pulse"></div>
          </div>
          <p className="mt-4 text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 font-extrabold text-2xl">
            Kolli Vineeth - Developer
          </p>
        </div>
      </div>

      {/* Mottos Section */}
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

      {/* Infrastructure Section */}
      <section className="mb-16">
        <h2 className="text-2xl font-semibold text-gray-900 mb-8">Platforms</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {infrastructure.map((item) => (
            <div
              key={item.name}
              className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow"
            >
              <div className="mb-4">{item.icon}</div>
              <h3 className="text-lg font-semibold mb-2">{item.name}</h3>
              <p className="text-sm text-gray-600">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Technologies Section */}
      <section className="mb-16">
        <h2 className="text-2xl font-semibold text-gray-900 mb-8">Technologies</h2>
        <div className="space-y-12">
          {techCategories.map((cat) => (
            <div key={cat.category}>
              <h3 className="text-xl font-semibold mb-4">{cat.category}</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {cat.items.map((tech) => (
                  <div
                    key={tech.name}
                    className="flex items-center p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
                  >
                    {tech.icon}
                    <span className="font-medium">{tech.name}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Sources Section */}
      <section className="mt-16">
        <h2 className="text-2xl font-semibold text-gray-900 mb-8">References</h2>
        <ul className="flex flex-wrap gap-4">
          {sources.map((src) => (
            <li
              key={src.name}
              className="bg-white flex items-center px-4 py-2 rounded shadow"
            >
              {src.icon}
              <span>{src.name}</span>
            </li>
          ))}
        </ul>
      </section>
      {/* Footer */}
      <Footer />
    </div>
  );
}

export default TechStack;
