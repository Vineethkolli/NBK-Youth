import { Code2, Sparkles, Rocket, Wrench, Cpu, Clock3, Settings } from "lucide-react";

function New() {
  return (
    <>
      <style>{`
        @keyframes rotateSlow{
          from{transform:rotate(0deg);}
          to{transform:rotate(360deg);}
        }

        @keyframes rotateReverse{
          from{transform:rotate(360deg);}
          to{transform:rotate(0deg);}
        }

        @keyframes float{
          0%,100%{transform:translateY(0px);}
          50%{transform:translateY(-15px);}
        }

        @keyframes flame{
          0%,100%{
            transform:scaleY(1);
            opacity:1;
          }
          50%{
            transform:scaleY(.55);
            opacity:.6;
          }
        }

        @keyframes blink{
          50%{opacity:0;}
        }

        @keyframes typing{
          from{width:0}
          to{width:100%}
        }

        .rocketFloat{
          animation:float 3s ease-in-out infinite;
        }

        .flame{
          animation:flame .25s infinite;
          transform-origin:top;
        }

        .typing{
          overflow:hidden;
          white-space:nowrap;
          border-right:2px solid #22d3ee;
          animation:
            typing 5s steps(60,end) infinite alternate,
            blink .7s infinite;
        }

      `}</style>

      <div className="relative overflow-hidden min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-100 flex items-center justify-center">

        <div className="w-full max-w-6xl bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-100 overflow-hidden relative z-10">

          {/* HEADER */}

          <div className="relative bg-gradient-to-r from-indigo-700 via-blue-600 to-cyan-500 px-8 py-12 text-center text-white overflow-hidden">

            {/* Rocket */}

            <div className="relative w-fit mx-auto rocketFloat">

              <div className="relative w-28 h-28 rounded-full bg-white/20 flex items-center justify-center backdrop-blur shadow-2xl">

                <Rocket size={54} />

                {/* Flames */}

                <div className="absolute top-full flex flex-col items-center">

                  <div className="flame w-4 h-10 rounded-full bg-orange-500"></div>

                  <div className="flame w-2 h-6 rounded-full bg-yellow-300 -mt-2"></div>

                </div>

              </div>

            </div>

            <h1 className="text-5xl font-bold mt-10">
              Developing...
            </h1>

            <p className="mt-4 text-indigo-100 max-w-2xl mx-auto text-lg">
              We're crafting a faster, smarter and more beautiful experience.
              Great things are on the way.
            </p>

          </div>

          {/* CONTENT */}

          <div className="p-8 md:p-12">

            {/* Animated Terminal */}

            <div className="bg-gray-900 rounded-2xl overflow-hidden shadow-xl mb-12">

              <div className="flex gap-2 p-3 bg-gray-800">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>

              <div className="p-6 font-mono text-green-400 text-sm md:text-base">

                <div className="typing">
                  $ npm run build && npm run deploy...
                </div>

              </div>

            </div>

            {/* Cards */}

            <div className="grid md:grid-cols-2 gap-6">

              <div className="rounded-2xl bg-gradient-to-br from-purple-50 to-white border p-6 hover:scale-105 transition duration-300 shadow-sm hover:shadow-xl">

                <Sparkles className="text-purple-600 w-10 h-10 mb-4" />

                <h3 className="font-bold text-lg mb-2">
                  Better UI
                </h3>

                <p className="text-gray-600">
                  Smooth animations and polished interactions for every device.
                </p>

              </div>

              <div className="rounded-2xl bg-gradient-to-br from-green-50 to-white border p-6 hover:scale-105 transition duration-300 shadow-sm hover:shadow-xl">

                <Cpu className="text-green-600 w-10 h-10 mb-4" />

                <h3 className="font-bold text-lg mb-2">
                  High Performance
                </h3>

                <p className="text-gray-600">
                  Faster loading, optimized APIs and secure infrastructure.
                </p>

              </div>

            </div>

            {/* STATUS */}

            <div className="mt-12 rounded-3xl bg-gradient-to-r from-indigo-50 to-cyan-50 p-8 border">

              <div className="flex items-center gap-3 mb-8">

                <Clock3 className="text-indigo-600"/>

                <h2 className="font-bold text-2xl">
                  Development Progress
                </h2>

              </div>

              {[
                ["UI Design",80,"bg-blue-600"],
                ["Backend",65,"bg-green-500"],
                ["Testing",40,"bg-purple-600"]
              ].map(([name,width,color])=>(
                <div
                  key={name}
                  className="mb-6"
                >
                  <div className="flex justify-between mb-2">
                    <span>{name}</span>
                    <span>{width}%</span>
                  </div>

                  <div className="bg-gray-200 rounded-full h-3 overflow-hidden">

                    <div
                      className={`${color} h-3 rounded-full transition-all duration-1000`}
                      style={{width:`${width}%`}}
                    />

                  </div>

                </div>
              ))}

            </div>

            {/* FOOTER */}

            <div className="mt-12 flex flex-wrap justify-center gap-4">

              <div className="px-5 py-3 rounded-full bg-green-100 text-green-700 flex items-center gap-2 shadow">

                <Wrench size={18}/>

                Work In Progress

              </div>

              <div className="px-5 py-3 rounded-full bg-blue-100 text-blue-700 flex items-center gap-2 shadow">

                <Sparkles size={18}/>

                Exciting Features Coming Soon

              </div>

            </div>

          </div>

        </div>

      </div>
    </>
  );
}

export default New;