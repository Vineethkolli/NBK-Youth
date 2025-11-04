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
