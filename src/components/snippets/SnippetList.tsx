import { useState, useEffect, useMemo } from 'react';
import { fetchSnippets } from '@/lib/api-client';
import SnippetCard from './SnippetCard';
import { SUPPORTED_LANGUAGES, LANGUAGE_LABELS } from '@/config/languages';
import type { Snippet } from '@/types/snippet';
import type { PaginationMetadata } from '@/types/snippet.dto';

export default function SnippetList() {
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [pagination, setPagination] = useState<PaginationMetadata | null>(null);

  // Debounce search query to avoid triggering API on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500); // Wait 500ms after user stops typing

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    loadSnippets();
  }, [debouncedSearchQuery, selectedLanguage, selectedTag]);

  async function loadSnippets() {
    try {
      setLoading(true);
      setError('');

      const result = await fetchSnippets({
        page: 1,
        limit: 100, // Load all for now (client-side pagination not implemented yet)
        language: selectedLanguage !== 'all' ? selectedLanguage : undefined,
        tags: selectedTag !== 'all' ? selectedTag : undefined,
        search: debouncedSearchQuery || undefined,
      });

      setSnippets(result.data);
      setPagination(result.pagination);
    } catch (err: any) {
      setError(err.message || 'Failed to load snippets');
      // Redirect to login if not authenticated
      if (err.message?.includes('Not authenticated')) {
        window.location.href = '/login';
      }
    } finally {
      setLoading(false);
    }
  }

  // Get all unique tags from snippets (for tag filter dropdown)
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    snippets.forEach(snippet => {
      snippet.tags?.forEach(tag => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, [snippets]);

  // Snippets are already filtered server-side, no need for client-side filtering
  const filteredSnippets = snippets;

  // Show initial loading state only on first load
  if (loading && snippets.length === 0 && !error) {
    return (
      <div className="flex justify-center items-center py-16">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-gray-600">Loading snippets...</p>
        </div>
      </div>
    );
  }

  if (error && snippets.length === 0) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
        {error}
      </div>
    );
  }

  // Show "no snippets yet" only when there are truly no snippets (no filters applied)
  if (snippets.length === 0 && !searchQuery && !debouncedSearchQuery && selectedLanguage === 'all' && selectedTag === 'all' && !loading) {
    return (
      <div className="card text-center py-16">
        <div className="text-6xl mb-4">📝</div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">No snippets yet</h2>
        <p className="text-gray-600 mb-6">Create your first code snippet to get started</p>
        <a href="/snippet/new" className="btn btn-primary px-8 py-3 inline-flex">
          Create your first snippet
        </a>
      </div>
    );
  }

  return (
    <div>
      {/* Search and Filter Bar */}
      <div className="card mb-6">
        <div className="grid gap-4 md:grid-cols-3">
          {/* Search Input */}
          <div className="md:col-span-3 lg:col-span-1">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
              Search {loading && searchQuery !== debouncedSearchQuery && <span className="text-gray-500 text-xs">(searching...)</span>}
            </label>
            <input
              id="search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search title, description, code, or tags..."
              className="input"
            />
          </div>

          {/* Language Filter */}
          <div>
            <label htmlFor="language-filter" className="block text-sm font-medium text-gray-700 mb-2">
              Language
            </label>
            <select
              id="language-filter"
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="input"
            >
              <option value="all">All Languages</option>
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang} value={lang}>
                  {LANGUAGE_LABELS[lang as keyof typeof LANGUAGE_LABELS]}
                </option>
              ))}
            </select>
          </div>

          {/* Tag Filter */}
          <div>
            <label htmlFor="tag-filter" className="block text-sm font-medium text-gray-700 mb-2">
              Tag
            </label>
            <select
              id="tag-filter"
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="input"
              disabled={allTags.length === 0}
            >
              <option value="all">All Tags</option>
              {allTags.map((tag) => (
                <option key={tag} value={tag}>
                  #{tag}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Active Filters Display */}
        {(searchQuery || selectedLanguage !== 'all' || selectedTag !== 'all') && (
          <div className="mt-4 flex flex-wrap gap-2 items-center">
            <span className="text-sm text-gray-600">Active filters:</span>
            {searchQuery && (
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                Search: "{searchQuery}"
                <button
                  onClick={() => setSearchQuery('')}
                  className="hover:text-blue-900"
                >
                  ×
                </button>
              </span>
            )}
            {selectedLanguage !== 'all' && (
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                Language: {LANGUAGE_LABELS[selectedLanguage as keyof typeof LANGUAGE_LABELS] || selectedLanguage}
                <button
                  onClick={() => setSelectedLanguage('all')}
                  className="hover:text-green-900"
                >
                  ×
                </button>
              </span>
            )}
            {selectedTag !== 'all' && (
              <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                Tag: #{selectedTag}
                <button
                  onClick={() => setSelectedTag('all')}
                  className="hover:text-purple-900"
                >
                  ×
                </button>
              </span>
            )}
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedLanguage('all');
                setSelectedTag('all');
              }}
              className="text-sm text-gray-600 hover:text-gray-900 underline"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Results Count */}
      <div className="mb-6 flex justify-between items-center">
        <p className="text-gray-600">
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="inline-block animate-spin">⏳</span>
              Loading...
            </span>
          ) : pagination ? (
            <>
              {pagination.total} snippet{pagination.total !== 1 ? 's' : ''} found
              {pagination.total_pages > 1 && (
                <span className="text-gray-500"> (page {pagination.page} of {pagination.total_pages})</span>
              )}
            </>
          ) : (
            <>
              {filteredSnippets.length} snippet{filteredSnippets.length !== 1 ? 's' : ''} found
            </>
          )}
        </p>
      </div>

      {/* Snippets Grid */}
      {filteredSnippets.length === 0 ? (
        <div className="card text-center py-16">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">No snippets found</h2>
          <p className="text-gray-600 mb-6">Try adjusting your search or filters</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedLanguage('all');
              setSelectedTag('all');
            }}
            className="btn btn-secondary px-6 py-2"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredSnippets.map((snippet) => (
            <SnippetCard key={snippet.id} snippet={snippet} />
          ))}
        </div>
      )}
    </div>
  );
}
