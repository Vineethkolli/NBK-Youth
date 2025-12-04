import { Navigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Gangavaram() {
  const { user } = useAuth();

  // Redirect if user logged in
  if (user) return <Navigate to="/home" replace />;

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-600 to-green-50 flex flex-col">

      {/* Header */}
      <header className="py-6 text-center text-white drop-shadow-lg">
        <h1 className="text-4xl font-extrabold tracking-wide">
          Gangavaram 🌾
        </h1>
        <p className="text-lg opacity-90">
          Inkollu Mandal • Prakasam District • Andhra Pradesh
        </p>
      </header>

      {/* Hero Section */}
      <section className="flex-1 flex flex-col justify-center items-center text-center p-6 text-white">
        <img
          src="https://cdn-icons-png.flaticon.com/512/6934/6934661.png"
          alt="Village Illustration"
          className="w-52 mb-6 animate-bounce"
        />

        <h2 className="text-3xl font-bold mb-3 drop-shadow-lg">
          Welcome to Our Village
        </h2>
        <p className="max-w-xl text-lg opacity-95">
          Unity, Culture, Festivals & Young Spirit — Join us to stay connected
          with every update happening in Gangavaram! ✨
        </p>

        {/* Buttons */}
        <div className="mt-8 flex gap-5">
          <Link
            to="/signin"
            className="bg-yellow-400 text-gray-900 px-8 py-3 rounded-xl font-bold hover:bg-yellow-500 transition-all"
          >
            Sign In
          </Link>
          <Link
            to="/signup"
            className="bg-white text-green-700 px-8 py-3 rounded-xl font-bold hover:bg-gray-100 transition-all"
          >
            Create Account
          </Link>
        </div>
      </section>

      {/* Info Section */}
      <section className="bg-white rounded-t-3xl shadow-2xl p-8 text-center">
        <h3 className="text-2xl font-bold text-green-700 mb-4">About Gangavaram</h3>
        <p className="text-gray-700 max-w-2xl mx-auto">
          Gangavaram is a culturally rich village known for peaceful living,
          agriculture, and strong youth participation. Our village continues to
          grow with unity, technology, and development.
        </p>
      </section>

      {/* Footer */}
      <footer className="py-4 text-center text-sm text-gray-200 bg-green-700">
        © {new Date().getFullYear()} NBK Youth Gangavaram
      </footer>

    </div>
  );
}
