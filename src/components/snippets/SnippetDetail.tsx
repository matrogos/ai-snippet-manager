import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import type { Snippet } from '@/types/snippet';
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';

// Import common language components
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-csharp';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-rust';
import 'prismjs/components/prism-php';
import 'prismjs/components/prism-ruby';
import 'prismjs/components/prism-swift';
import 'prismjs/components/prism-kotlin';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-scss';

interface Props {
  snippetId: string;
}

export default function SnippetDetail({ snippetId }: Props) {
  const [snippet, setSnippet] = useState<Snippet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const codeRef = useRef<HTMLElement>(null);

  useEffect(() => {
    loadSnippet();
  }, [snippetId]);

  useEffect(() => {
    if (snippet && codeRef.current) {
      Prism.highlightElement(codeRef.current);
    }
  }, [snippet]);

  async function loadSnippet() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        window.location.href = '/login';
        return;
      }

      const { data, error } = await supabase
        .from('snippets')
        .select('*')
        .eq('id', snippetId)
        .single();

      if (error) throw error;
      if (!data) {
        setError('Snippet not found');
        return;
      }

      setSnippet(data as Snippet);
    } catch (err: any) {
      setError(err.message || 'Failed to load snippet');
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!snippet) return;

    try {
      await navigator.clipboard.writeText(snippet.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }

  async function handleDelete() {
    if (!snippet) return;
    if (!confirm('Are you sure you want to delete this snippet?')) return;

    try {
      const { error } = await supabase
        .from('snippets')
        .delete()
        .eq('id', snippet.id);

      if (error) throw error;
      window.location.href = '/dashboard';
    } catch (err: any) {
      alert('Failed to delete snippet: ' + err.message);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-gray-600">Loading snippet...</p>
        </div>
      </div>
    );
  }

  if (error || !snippet) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
        {error || 'Snippet not found'}
      </div>
    );
  }

  const languageClass = `language-${snippet.language.toLowerCase()}`;

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{snippet.title}</h1>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">
                {snippet.language}
              </span>
              <span>
                Created {new Date(snippet.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <a
              href={`/snippet/${snippet.id}/edit`}
              className="btn btn-secondary px-4 py-2"
            >
              Edit
            </a>
            <button
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
            >
              Delete
            </button>
          </div>
        </div>

        {snippet.description && (
          <p className="text-gray-700 mb-4">{snippet.description}</p>
        )}

        {snippet.tags && snippet.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {snippet.tags.map((tag) => (
              <span
                key={tag}
                className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Code Block */}
      <div className="card p-0 overflow-hidden">
        <div className="flex justify-between items-center px-4 py-3 bg-gray-800 text-white">
          <span className="text-sm font-medium">{snippet.language}</span>
          <button
            onClick={handleCopy}
            className="text-sm px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
          >
            {copied ? '✓ Copied!' : 'Copy'}
          </button>
        </div>
        <pre className="!m-0 !rounded-none">
          <code ref={codeRef} className={languageClass}>
            {snippet.code}
          </code>
        </pre>
      </div>

      {/* Back Button */}
      <div className="mt-6">
        <a href="/dashboard" className="text-blue-600 hover:text-blue-700">
          ← Back to Dashboard
        </a>
      </div>
    </div>
  );
}
