import React, { useEffect, useState } from 'react';

const ColdStateMessage = ({ onServerReady }) => {
  const [timeLeft, setTimeLeft] = useState(50); // Countdown time
  const [serverReady, setServerReady] = useState(false); // Track if the server is ready
  const [showMessage, setShowMessage] = useState(false); // To toggle the message visibility
  const [timerStart, setTimerStart] = useState(false); // To control when to start the timer

  useEffect(() => {
    const checkServerStatus = async () => {
      try {
        // Correctly accessing the backend URL from .env variables
        const backendUrl = import.meta.env.VITE_BACKEND_URL; // Use import.meta.env for Vite
        const response = await fetch(backendUrl);

        if (response.ok) {
          setServerReady(true);
          onServerReady(); // Notify parent component that the server is ready
          clearInterval(intervalId); // Stop the interval once the server is ready
        } else {
          setShowMessage(true); // Show message if server is in cold state
          setTimerStart(true); // Start the countdown timer if server is in cold state
        }
      } catch (err) {
        console.error('Error connecting to server:', err);
        setShowMessage(true); // Show message in case of an error (e.g., server down)
        setTimerStart(true); // Start the countdown timer
      }
    };

    // Check the server every 5 seconds
    const intervalId = setInterval(checkServerStatus, 1000);

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, [onServerReady]);

  useEffect(() => {
    // Reverse countdown logic for the timer
    const timer = setInterval(() => {
      if (timerStart && timeLeft > 0) {
        setTimeLeft((prev) => prev - 1);
      }
    }, 1000);

    // If the server is ready, we stop the countdown and remove the message
    if (serverReady) {
      clearInterval(timer); // Clear the countdown timer once server is ready
      setShowMessage(false); // Hide the cold state message
    }

    return () => clearInterval(timer); // Cleanup the timer on unmount
  }, [timerStart, timeLeft, serverReady]);

  if (serverReady) return null; // Return null if the server is ready, stopping the cold state message

  return (
    showMessage && (
      <div className="flex flex-col items-center justify-center mt-12 p-8 bg-white rounded-xl shadow-md max-w-lg mx-auto border border-gray-200">
        {/* Heading */}
        <h1 className="text-2xl font-bold text-gray-800 mb-4 text-center">
          Server is Starting
        </h1>

        {/* Description */}
        <p className="text-lg text-gray-700 font-medium text-center mb-4">
          <span className="font-semibold text-gray-800">
            Since no one has used the app in the last 15 minutes, the server went to sleep.
          </span>
        </p>
        <p className="text-md text-gray-600 text-center mb-6">
          Server is waking up. Please wait...
        </p>

        {/* Progress Bar */}
        <div className="relative w-full h-6 bg-gray-300 rounded-full overflow-hidden mb-6">
          <div
            className="absolute top-0 left-0 h-full bg-green-500 rounded-full"
            style={{
              width: `${(timeLeft / 50) * 100}%`,
              transition: 'width 1s linear',
            }}
          ></div>
        </div>

        {/* Countdown */}
        <p className="text-lg font-bold text-center">
          <span className="text-gray-800">APP starts in:</span>{' '}
          <span className="text-green-600">{timeLeft} seconds</span>
        </p>
      </div>
    )
  );
};

export default ColdStateMessage;
