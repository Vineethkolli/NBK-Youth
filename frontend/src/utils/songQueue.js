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


// Helper function to filter collections and songs based on search query
export const filterCollections = (collections, searchQuery) => {
  if (!searchQuery) return collections;

  const query = searchQuery.toLowerCase();

  return collections
    .map((collection) => {
      const collectionMatches = collection.name.toLowerCase().includes(query);
      const filteredSongs = collection.songs.filter((song) =>
        song.name.toLowerCase().includes(query)
      );

      if (collectionMatches) return collection;
      if (filteredSongs.length > 0)
        return { ...collection, songs: filteredSongs };

      return null;
    })
    .filter(Boolean);
};
