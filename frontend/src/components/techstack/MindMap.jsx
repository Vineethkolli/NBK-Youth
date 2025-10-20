
const roleNodes = [
  { name: "Developer", color: "bg-green-500" },
  { name: "Financier", color: "bg-indigo-500" },
  { name: "Admin", color: "bg-orange-500" },
  { name: "User", color: "bg-gray-500" },
];

const categoryNodes = [
  { name: "Youth", color: "bg-yellow-500" },
  { name: "General", color: "bg-purple-500" },

];

const MindMap = () => {
  return (
    <section className="">
    <h2 className="text-2xl font-semibold text-gray-900 mb-8">Access Management</h2>
    <div className="relative w-full h-[360px] p-4">
        
      <svg className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <line x1="50%" y1="40" x2="20%" y2="100" stroke="black" strokeWidth="2" />
        <line x1="50%" y1="40" x2="40%" y2="100" stroke="black" strokeWidth="2" />
        <line x1="50%" y1="40" x2="60%" y2="100" stroke="black" strokeWidth="2" />
        <line x1="50%" y1="40" x2="80%" y2="100" stroke="black" strokeWidth="2" />
        
        <line x1="50%" y1="240" x2="35%" y2="300" stroke="black" strokeWidth="2" />
        <line x1="50%" y1="240" x2="65%" y2="300" stroke="black" strokeWidth="2" />
      </svg>

      {/* Roles Section */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
        <div className="p-3 rounded shadow-lg bg-gray-300 text-black font-bold">
          Roles
        </div>
      </div>
      <div className="absolute" style={{ top: "100px", left: 0, right: 0 }}>
        <div className="flex justify-around items-center z-10">
          {roleNodes.map((role, index) => (
            <div
              key={index}
              className={`p-3 rounded shadow-lg ${role.color} text-white font-semibold`}
            >
              {role.name}
            </div>
          ))}
        </div>
      </div>

      {/* Category Section */}
      <div className="absolute left-1/2 transform -translate-x-1/2" style={{ top: "210px" }}>
        <div className="p-3 rounded shadow-lg bg-gray-300 text-black font-bold">
          Category
        </div>
      </div>

      <div className="absolute" style={{ top: "280px", left: 0, right: 0 }}>
        <div className="flex justify-around items-center z-10">
          {categoryNodes.map((cat, index) => (
            <div
              key={index}
              className={`p-3 rounded shadow-lg ${cat.color} text-white font-semibold`}
            >
              {cat.name}
            </div>
          ))}
        </div>
      </div>
    </div>
    </section>
  );
};

export default MindMap;
