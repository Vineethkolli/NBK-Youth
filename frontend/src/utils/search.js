export const filterCollections = (collections, searchQuery) => {
    if (!searchQuery) return collections;
  
    const query = searchQuery.toLowerCase();
    return collections.map(collection => {
      // Check if collection name matches
      const collectionMatches = collection.name.toLowerCase().includes(query);
      
      // Filter and map sub-collections
      const filteredSubCollections = collection.subCollections
        .map(subCollection => {
          // Check if sub-collection name matches
          const subCollectionMatches = subCollection.name.toLowerCase().includes(query);
          
          // Filter songs
          const filteredSongs = subCollection.songs.filter(song =>
            song.name.toLowerCase().includes(query)
          );
  
          // If collection matches, show all sub-collections and songs
          if (collectionMatches) {
            return subCollection;
          }
  
          // If sub-collection matches, show all its songs
          if (subCollectionMatches) {
            return subCollection;
          }
  
          // Return sub-collection only if it has matching songs
          if (filteredSongs.length > 0) {
            return {
              ...subCollection,
              songs: filteredSongs
            };
          }
  
          return null;
        })
        .filter(Boolean); 
  
      // Return collection if it matches or has matching sub-collections
      if (collectionMatches || filteredSubCollections.length > 0) {
        return {
          ...collection,
          subCollections: filteredSubCollections
        };
      }
      return null;
    }).filter(Boolean); 
  };