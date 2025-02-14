import React, { useState, useEffect } from 'react';

const DataClear = () => {
  const [storageSize, setStorageSize] = useState(0);

  // Function to calculate approximate localStorage size in KB
  const calculateLocalStorageSize = () => {
    let total = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        // Multiply by 2 because each character is 2 bytes in UTF-16
        total += (key.length + localStorage.getItem(key).length) * 2;
      }
    }
    return (total / 1024).toFixed(2); // Return size in KB
  };

  useEffect(() => {
    setStorageSize(calculateLocalStorageSize());
  }, []);

  const clearData = async () => {
    // Clear local storage and session storage
    localStorage.clear();
    sessionStorage.clear();

    // If you have a service worker cache, you can clear that too:
    if (window.caches) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
    }

    // Update the displayed size after clearing
    setStorageSize(calculateLocalStorageSize());
    alert('App data has been cleared.');
  };

  return (
    <div className="data-clear">
      <button onClick={clearData} className="px-4 py-2 rounded-md bg-red-600 text-white">
        Clear Data ({storageSize} KB)
      </button>
    </div>
  );
};

export default DataClear;
