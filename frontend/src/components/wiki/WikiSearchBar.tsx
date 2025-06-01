
import React, { useState, useEffect } from 'react';
import { WikiSearchBarProps } from '../../types'; // Use standardized prop type

const WikiSearchBar: React.FC<WikiSearchBarProps> = React.memo(({ onQueryChange, isLoading, initialQuery }) => {
  const [localQuery, setLocalQuery] = useState(initialQuery);

  useEffect(() => {
    setLocalQuery(initialQuery);
  }, [initialQuery]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setLocalQuery(newQuery);
    onQueryChange(newQuery);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Optional: onQueryChange(localQuery); // To trigger immediate search on button press, bypassing debounce
  };

  return (
    <form onSubmit={handleSubmit} className="wiki-search-bar">
      <input
        type="text"
        value={localQuery}
        onChange={handleChange}
        placeholder="Search wiki pages..."
        aria-label="Search wiki pages"
      />
      <button type="submit" disabled={isLoading || !localQuery.trim()}>
        {isLoading ? 'Searching...' : 'Search'}
      </button>
    </form>
  );
});

export default WikiSearchBar;
