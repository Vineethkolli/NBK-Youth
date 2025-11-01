// Helper function to create a flat queue of songs from collections
export const createSongQueue = (collections) => {
  const queue = [];
  
  collections.forEach(collection => {
    const sortedSongs = [...collection.songs].sort((a, b) => 
      a.name.localeCompare(b.name)
    );
    queue.push(...sortedSongs.map(song => ({
      ...song,
      collectionName: collection.name
    })));
  });

  return queue;
};

// Helper function to find next song index
export const getNextSongIndex = (currentIndex, queue) => {
  // If we're at the end of the queue, start from beginning
  if (currentIndex >= queue.length - 1) {
    return 0;
  }
  return currentIndex + 1;
};

// Helper function to find previous song index
export const getPreviousSongIndex = (currentIndex, queue) => {
  if (currentIndex <= 0) {
    return queue.length - 1;
  }
  return currentIndex - 1;
};

// Helper function to find song index in queue
export const findSongIndex = (song, queue) => {
  return queue.findIndex(s => s._id === song._id);
};
