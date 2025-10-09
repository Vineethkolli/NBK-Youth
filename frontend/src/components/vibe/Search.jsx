import { Search } from 'lucide-react';

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
      if (filteredSongs.length > 0) return { ...collection, songs: filteredSongs };
      return null;
    })
    .filter(Boolean);
};

function SearchBar({ value, onChange }) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search songs, collections..."
        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
    </div>
  );
}

export default SearchBar;
