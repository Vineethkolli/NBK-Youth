import { Camera } from 'lucide-react';

function ProfileImage({ image, onClick }) {
  return (
    <div className="relative inline-block">
      {image ? (
        <img
          src={image}
          alt="Profile"
          onClick={onClick}
          className="w-32 h-32 rounded-full object-cover cursor-pointer"
        />
      ) : (
        <div
          onClick={onClick}
          className="w-32 h-32 rounded-full bg-gray-100 flex items-center justify-center cursor-pointer"
        >
          <Camera className="h-8 w-8 text-gray-400" />
        </div>
      )}
      <button
        onClick={onClick}
        className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-lg hover:bg-gray-50"
      >
        <Camera className="h-4 w-4 text-gray-600" />
      </button>
    </div>
  );
}

export default ProfileImage;
