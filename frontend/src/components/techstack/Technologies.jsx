import React from "react";
import { 
  SiVercel, SiRender, SiMongodb, SiGmail, SiCloudinary, SiGoogledrive,
  SiReact, SiTailwindcss, SiVite, SiNodedotjs, SiExpress, SiGoogleanalytics, SiPostman,
  SiGit, SiGithub, SiGoogletranslate, SiGoogle, SiOpenai, SiYoutube, SiGithubcopilot,
  SiHuggingface, SiGooglecloud 
} from "react-icons/si";
import { FaCode, FaWhatsapp, FaRobot, FaClock } from "react-icons/fa";
import Footer from "../Footer";

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

const aiIntegrations = [
  { name: "Gemini API", icon: <SiGooglecloud className="h-8 w-8 mr-2 text-blue-500" /> },
  { name: "Hugging Face", icon: <SiHuggingface className="h-8 w-8 mr-2 text-yellow-500" /> }
];

const features = [
  { name: "Web Push (Notifications)", icon: <FaCode className="h-8 w-8 mr-2 text-gray-500" /> },
  { name: "Progressive Web App (APP)", icon: <FaCode className="h-8 w-8 mr-2 text-gray-500" /> },
  { name: "Google Translate (Multi Language)", icon: <SiGoogletranslate className="h-8 w-8 mr-2 text-blue-500" /> },
  { name: "WhatsApp (Auto Load Message)", icon: <FaWhatsapp className="h-8 w-8 mr-2 text-green-500" /> },
  { name: "Google Analytics (User Interactions)", icon: <SiGoogleanalytics className="h-8 w-8 mr-2 text-yellow-500" /> },
  { name: "Cron-job.org (Keeps server warm)", icon: <FaClock className="h-8 w-8 mr-2 text-orange-600" /> },
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
  { category: "AI & Integrations", items: aiIntegrations },
  { category: "Features", items: features },
  { category: "Tools", items: tools },
];

const sources = [
  { name: "Google", icon: <SiGoogle className="h-8 w-8 mr-2 text-blue-500" /> },
  { name: "YouTube", icon: <SiYoutube className="h-8 w-8 mr-2 text-red-500" /> },
  { name: "ChatGPT", icon: <SiOpenai className="h-8 w-8 mr-2 text-green-500" /> },
  { name: "GitHub", icon: <SiGithub className="h-8 w-8 mr-2 text-gray-800" /> },
  { name: "AI Tools", icon: <FaRobot className="h-8 w-8 mr-2 text-purple-500" /> },
  { name: "Copilot", icon: <SiGithubcopilot className="h-8 w-8 mr-2 text-indigo-500" /> },
];

function TechStackDetails() {
  return (
    <div>
      {/* Platforms Section */}
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

      {/* References Section */}
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

      <Footer />
    </div>
  );
}

export default TechStackDetails;
