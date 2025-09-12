import { SiYoutube, SiInstagram } from "react-icons/si";

function WatchMore() {
  const openLink = (url) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="text-center mt-2 mb-6">
      <span className="block font-semibold text-gray-400 mb-2">
        Watch More
      </span>
      <div className="flex justify-center items-center space-x-6">
        <SiInstagram
          className="cursor-pointer h-6 w-6 text-pink-500 hover:scale-110 transition"
          title="Instagram"
          onClick={() =>
            openLink("https://www.instagram.com/gvrm_legendz?igsh=MTNjeThoZGtiNTFjNQ==")
          }
        />
        <SiYoutube
          className="cursor-pointer h-6 w-6 text-red-500 hover:scale-110 transition"
          title="YouTube"
          onClick={() => openLink("https://youtube.com/@sivakoniki7335?si=qW0des74LGOFuf3t")}
        />
        <SiInstagram
          className="cursor-pointer h-6 w-6 text-pink-500 hover:scale-110 transition"
          title="Instagram"
          onClick={() =>
            openLink("https://www.instagram.com/mana_station_gangavaram?igsh=MXU5cjM1ajVpemJm")
          }
        />
      </div>
    </div>
  );
}

export default WatchMore;
