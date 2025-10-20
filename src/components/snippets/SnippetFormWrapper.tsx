import { useState, useEffect } from 'react';
import { supabase, createSnippet } from '@/lib/supabase';
import { fetchSnippetById } from '@/lib/api-client';
import SnippetForm from './SnippetForm';
import type { Snippet } from '@/types/snippet';

interface Props {
  mode: 'create' | 'edit';
  snippetId?: string;
}

export default function SnippetFormWrapper({ mode, snippetId }: Props) {
  const [loading, setLoading] = useState(true);
  const [snippet, setSnippet] = useState<Snippet | undefined>();
  const [error, setError] = useState('');

  useEffect(() => {
    checkAuthAndLoadSnippet();
  }, []);

  async function checkAuthAndLoadSnippet() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        window.location.href = '/login';
        return;
      }

      // If editing, load the snippet using API
      if (mode === 'edit' && snippetId) {
        try {
          const data = await fetchSnippetById(snippetId);
          setSnippet(data as Snippet);
        } catch (err: any) {
          setError('Snippet not found');
          setLoading(false);
          return;
        }
      }

      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Failed to load');
      setLoading(false);
    }
  }

  async function handleSubmit(data: any) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('Not authenticated');
    }

    if (mode === 'create') {
      await createSnippet({
        ...data,
        user_id: session.user.id,
      });
      window.location.href = '/dashboard';
    } else if (mode === 'edit' && snippetId) {
      const { error } = await supabase
        .from('snippets')
        .update(data)
        .eq('id', snippetId);

      if (error) throw error;
      window.location.href = `/snippet/${snippetId}`;
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-gray-600">Loading...</p>
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

  return (
    <SnippetForm
      snippet={snippet}
      onSubmit={handleSubmit}
      submitLabel={mode === 'create' ? 'Create Snippet' : 'Update Snippet'}
    />
  );
}
