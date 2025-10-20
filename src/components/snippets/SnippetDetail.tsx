import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { fetchSnippetById } from '@/lib/api-client';
import type { Snippet } from '@/types/snippet';

interface Props {
  snippetId: string;
}

export default function SnippetDetail({ snippetId }: Props) {
  const [snippet, setSnippet] = useState<Snippet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [explanation, setExplanation] = useState('');
  const [explaining, setExplaining] = useState(false);
  const [highlightedCode, setHighlightedCode] = useState('');

  useEffect(() => {
    loadSnippet();
  }, [snippetId]);

  useEffect(() => {
    if (snippet && typeof window !== 'undefined') {
      highlightCode();
    }
  }, [snippet]);

  async function highlightCode() {
    if (!snippet) return;

    try {
      // Dynamically import Prism only on client side
      const Prism = (await import('prismjs')).default;

      // Import theme
      await import('prismjs/themes/prism-tomorrow.css');

      // Map language names to Prism component names
      const languageMap: Record<string, string> = {
        javascript: 'javascript',
        typescript: 'typescript',
        jsx: 'jsx',
        tsx: 'tsx',
        python: 'python',
        java: 'java',
        csharp: 'csharp',
        cpp: 'cpp',
        c: 'c',
        go: 'go',
        rust: 'rust',
        php: 'php',
        ruby: 'ruby',
        swift: 'swift',
        kotlin: 'kotlin',
        sql: 'sql',
        bash: 'bash',
        json: 'json',
        yaml: 'yaml',
        markdown: 'markdown',
        css: 'css',
        scss: 'scss',
        html: 'markup',
      };

      const lang = snippet.language.toLowerCase();
      const prismLang = languageMap[lang] || 'javascript';

      // Dynamically import only the needed language
      try {
        if (prismLang !== 'javascript' && prismLang !== 'markup') {
          await import(`prismjs/components/prism-${prismLang}`);
        }
      } catch (e) {
        console.warn(`Could not load Prism language: ${prismLang}`);
      }

      // Highlight the code
      const grammar = Prism.languages[prismLang] || Prism.languages.javascript;
      const highlighted = Prism.highlight(snippet.code, grammar, prismLang);
      setHighlightedCode(highlighted);
    } catch (err) {
      console.error('Syntax highlighting error:', err);
      // Fallback to plain code
      setHighlightedCode(snippet.code);
    }
  }

  async function loadSnippet() {
    try {
      const data = await fetchSnippetById(snippetId);
      setSnippet(data as Snippet);
    } catch (err: any) {
      setError(err.message || 'Failed to load snippet');
      // Redirect to login if not authenticated
      if (err.message?.includes('Not authenticated')) {
        window.location.href = '/login';
      }
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

  async function handleExplainCode() {
    if (!snippet) return;

    setExplaining(true);
    setError('');

    try {
      const response = await fetch('/api/ai/explain-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: snippet.code, language: snippet.language }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to explain code');
      }

      setExplanation(data.explanation);
    } catch (err: any) {
      setError(err.message || 'Failed to explain code');
    } finally {
      setExplaining(false);
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
        <pre className="!m-0 !rounded-none language-{snippet.language.toLowerCase()}">
          <code
            className={`language-${snippet.language.toLowerCase()} block overflow-x-auto`}
            dangerouslySetInnerHTML={{ __html: highlightedCode || snippet.code }}
          />
        </pre>
      </div>

      {/* AI Explanation */}
      <div className="mt-6">
        <button
          onClick={handleExplainCode}
          disabled={explaining}
          className="btn btn-secondary px-6 py-2"
        >
          {explaining ? '✨ Explaining...' : '✨ Explain Code with AI'}
        </button>

        {explanation && (
          <div className="card mt-4 bg-blue-50 border-blue-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              AI Code Explanation
            </h3>
            <div className="text-gray-700 whitespace-pre-wrap">
              {explanation}
            </div>
          </div>
        )}
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
