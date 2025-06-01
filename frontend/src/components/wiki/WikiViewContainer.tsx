
import React, { useState, useEffect, useCallback } from 'react';
import WikiSearchBar from './WikiSearchBar';
import WikiSearchResults from './WikiSearchResults';
import WikiPageDisplay from './WikiPageDisplay';
import WikiPageForm from './WikiPageForm';
import { WikiPage, WikiSearchResultItem } from '../../types';
import * as wikiService from '../../services/wikiService';
import { API_BASE_URL, loadingSVG, errorSVG, PLUS_SVG_ICON, WIKI_SVG_ICON } from '../../utils';
import { useDebounce } from '../../hooks/useDebounce';

const formatErrorMessage = (err: unknown, context: string): string => {
  if (err instanceof TypeError && err.message === 'Failed to fetch') {
    return `Failed to connect to the server at ${API_BASE_URL} for ${context}. Please ensure the backend server (server.js) is running and accessible.`;
  } else if (err instanceof Error) {
    return `Error during ${context}: ${err.message}. Please check the backend server or network.`;
  }
  return `An unknown error occurred during ${context}. Please check the backend server.`;
};

const WikiViewContainer: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<WikiSearchResultItem[]>([]);
  const [selectedPage, setSelectedPage] = useState<WikiPage | null>(null);
  const [editingPage, setEditingPage] = useState<WikiPage | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingPage, setIsLoadingPage] = useState(false);
  const [isSavingPage, setIsSavingPage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  const clearErrorsAndSelection = () => {
    setError(null);
    setSelectedPage(null);
    setShowForm(false);
  };

  const fetchInitialPages = useCallback(async () => {
    setIsSearching(true);
    setError(null);
    try {
      const results = await wikiService.listSampleWikiPages();
      setSearchResults(results);
    } catch (err) {
      console.error("Error fetching initial pages:", err);
      setError(formatErrorMessage(err, "listing initial wiki pages"));
      setSearchResults([]); 
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => { // Initial fetch
    fetchInitialPages();
  }, [fetchInitialPages]);

  const handleSearchInternal = useCallback(async (query: string) => {
    clearErrorsAndSelection();
    if (!query.trim()) {
      fetchInitialPages();
      return;
    }
    setIsSearching(true);
    try {
      const results = await wikiService.searchWikiPages(query);
      setSearchResults(results);
    } catch (err) {
      console.error("Search error:", err);
      setError(formatErrorMessage(err, "wiki search"));
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [fetchInitialPages]);

  useEffect(() => { // Debounced search effect
    if (debouncedSearchQuery.trim()) {
      handleSearchInternal(debouncedSearchQuery);
    } else if (searchQuery === '' && !debouncedSearchQuery.trim()) { // Only fetch initial if actual input is also empty
      fetchInitialPages();
    } else if (!debouncedSearchQuery.trim()) {
        setSearchResults([]); // Clear if debounced is empty but original might not be (e.g. during typing clear)
    }
  }, [debouncedSearchQuery, searchQuery, handleSearchInternal, fetchInitialPages]);

  const handleSelectPage = useCallback(async (id: string) => {
    clearErrorsAndSelection();
    setIsLoadingPage(true);
    try {
      const page = await wikiService.getWikiPageById(id);
      setSelectedPage(page);
    } catch (err) {
      console.error("Error fetching page:", err);
      setError(formatErrorMessage(err, "loading wiki page content"));
    } finally {
      setIsLoadingPage(false);
    }
  }, []);

  const handleSavePage = useCallback(async (pageData: { title: string; content_md: string; id?: string }) => {
    setError(null); // Clear previous errors
    setIsSavingPage(true);
    try {
      const savedPage = await wikiService.upsertWikiPage(pageData);
      setShowForm(false);
      setEditingPage(null);
      setSelectedPage(savedPage); // Show the newly saved/updated page
      // Refresh search results or initial list to reflect changes
      if (searchQuery.trim()) handleSearchInternal(searchQuery);
      else fetchInitialPages();
    } catch (err) {
      console.error("Error saving page:", err);
      setError(formatErrorMessage(err, "saving wiki page"));
    } finally {
      setIsSavingPage(false);
    }
  }, [searchQuery, handleSearchInternal, fetchInitialPages]);

  const handleAddNewPage = useCallback(() => {
    clearErrorsAndSelection();
    setEditingPage(null);
    setShowForm(true);
  }, []);

  const handleEditPage = useCallback((page: WikiPage) => {
    clearErrorsAndSelection();
    setEditingPage(page);
    setShowForm(true);
  }, []);

  const handleCancelForm = useCallback(() => {
    setShowForm(false);
    setEditingPage(null);
    // Optionally, re-select previously selected page if applicable, or clear selection
    // setSelectedPage(null); // Or restore a previous state if needed
  }, []);

  const renderPageContent = () => {
    if (isLoadingPage) return <div className="loading-state" style={{position: 'relative'}} dangerouslySetInnerHTML={{ __html: loadingSVG + '<p>Loading page...</p>' }} />;
    if (showForm) return <WikiPageForm initialPage={editingPage} onSave={handleSavePage} onCancel={handleCancelForm} isSaving={isSavingPage} />;
    if (selectedPage) return <WikiPageDisplay page={selectedPage} onEdit={handleEditPage} onClose={() => setSelectedPage(null)} />;
    
    const message = (searchResults.length > 0 || searchQuery.trim()) 
      ? 'Select a page from the search results to view its content.' 
      : 'Use the search bar to find wiki pages or add a new one.';
    if (!isSearching && !isLoadingPage) return <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-secondary)'}}><p>{message}</p></div>;
    return null; // Avoids showing message during active search if no page is selected
  };

  return (
    <div className="view-container wiki-view-container"> {/* Use generic view-container */}
      <div className="view-header wiki-header"> {/* Use generic view-header and specific wiki-header for buttons etc */}
        <div className="view-title-group">
            <span className="view-icon" dangerouslySetInnerHTML={{__html: WIKI_SVG_ICON}} aria-hidden="true"/>
            <h1>Company Wiki</h1>
        </div>
        <button className="button-primary" onClick={handleAddNewPage} disabled={showForm}>
          <span dangerouslySetInnerHTML={{__html: PLUS_SVG_ICON}} aria-hidden="true" /> Add New Page
        </button>
      </div>

      <WikiSearchBar onQueryChange={setSearchQuery} isLoading={isSearching} initialQuery={searchQuery} />

      {error && <div className="error-state" style={{position: 'relative', padding: '1rem', background: 'rgba(var(--color-text-error-rgb, 248, 113, 113), 0.1)', borderRadius: 'var(--border-radius-md)', border: '1px solid rgba(var(--color-text-error-rgb, 248, 113, 113), 0.3)', color: 'var(--color-text-error)'}} dangerouslySetInnerHTML={{ __html: errorSVG + `<p>${error}</p>`}} />}

      <div className="wiki-content-area">
        <div className="wiki-search-results glass-panel">
          <WikiSearchResults results={searchResults} onSelectPage={handleSelectPage} isLoading={isSearching && searchResults.length === 0 && !error} />
        </div>
        <div className="wiki-page-display glass-panel">
          {renderPageContent()}
        </div>
      </div>
    </div>
  );
};

export default WikiViewContainer;