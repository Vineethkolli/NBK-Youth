export const filterCollections = (collections, searchQuery) => {
  if (!searchQuery) return collections;

  const query = searchQuery.toLowerCase();
  return collections.map(collection => {
    // Check if collection name matches
    const collectionMatches = collection.name.toLowerCase().includes(query);
    
    // Filter songs
    const filteredSongs = collection.songs.filter(song =>
      song.name.toLowerCase().includes(query)
    );

    // If collection matches, show all songs
    if (collectionMatches) {
      return collection;
    }

    // Return collection only if it has matching songs
    if (filteredSongs.length > 0) {
      return {
        ...collection,
        songs: filteredSongs
      };
    }
    return null;
  }).filter(Boolean); 
};