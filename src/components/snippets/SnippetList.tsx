import { useState, useEffect } from 'react';
import { supabase, getSnippets } from '@/lib/supabase';
import SnippetCard from './SnippetCard';
import type { Snippet } from '@/types/snippet';

export default function SnippetList() {
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadSnippets();
  }, []);

  async function loadSnippets() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        window.location.href = '/login';
        return;
      }

      const data = await getSnippets(session.user.id);
      setSnippets(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load snippets');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-gray-600">Loading snippets...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
        {error}
      </div>
    );
  }

  if (snippets.length === 0) {
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
      <div className="mb-6 flex justify-between items-center">
        <p className="text-gray-600">
          {snippets.length} snippet{snippets.length !== 1 ? 's' : ''} found
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {snippets.map((snippet) => (
          <SnippetCard key={snippet.id} snippet={snippet} />
        ))}
      </div>
    </div>
  );
}
