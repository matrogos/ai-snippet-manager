import { useState, type FormEvent } from 'react';
import { SUPPORTED_LANGUAGES, LANGUAGE_LABELS } from '@/config/languages';
import { validateSnippetInput } from '@/lib/utils';
import type { Snippet } from '@/types/snippet';

interface Props {
  snippet?: Snippet;
  onSubmit: (data: {
    title: string;
    code: string;
    language: string;
    description?: string;
    tags?: string[];
  }) => Promise<void>;
  submitLabel?: string;
}

export default function SnippetForm({ snippet, onSubmit, submitLabel = 'Create Snippet' }: Props) {
  const [title, setTitle] = useState(snippet?.title || '');
  const [code, setCode] = useState(snippet?.code || '');
  const [language, setLanguage] = useState(snippet?.language || 'javascript');
  const [description, setDescription] = useState(snippet?.description || '');
  const [tagsInput, setTagsInput] = useState(snippet?.tags?.join(', ') || '');
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrors([]);
    setLoading(true);

    // Parse tags
    const tags = tagsInput
      .split(',')
      .map(tag => tag.trim())
      .filter(Boolean);

    // Validate
    const validation = validateSnippetInput({
      title,
      code,
      language,
      description,
      tags,
    });

    if (!validation.valid) {
      setErrors(validation.errors);
      setLoading(false);
      return;
    }

    try {
      await onSubmit({
        title,
        code,
        language,
        description: description || undefined,
        tags: tags.length > 0 ? tags : undefined,
      });
    } catch (err: any) {
      setErrors([err.message || 'An error occurred while saving the snippet']);
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          <ul className="list-disc list-inside space-y-1">
            {errors.map((error, index) => (
              <li key={index} className="text-sm">{error}</li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
          Title <span className="text-red-500">*</span>
        </label>
        <input
          id="title"
          type="text"
          required
          maxLength={255}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="input"
          placeholder="e.g., Array sorting function"
        />
      </div>

      <div>
        <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-2">
          Programming Language <span className="text-red-500">*</span>
        </label>
        <select
          id="language"
          required
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="input"
        >
          {SUPPORTED_LANGUAGES.map((lang) => (
            <option key={lang} value={lang}>
              {LANGUAGE_LABELS[lang]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
          Code <span className="text-red-500">*</span>
        </label>
        <textarea
          id="code"
          required
          rows={12}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="input font-mono text-sm"
          placeholder="Paste your code here..."
        />
        <p className="text-xs text-gray-500 mt-1">
          {code.length} / 50,000 characters
        </p>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
          Description (Optional)
        </label>
        <textarea
          id="description"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="input"
          placeholder="Describe what this code does..."
        />
        <p className="text-xs text-gray-500 mt-1">
          You can also generate a description using AI later
        </p>
      </div>

      <div>
        <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">
          Tags (Optional)
        </label>
        <input
          id="tags"
          type="text"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          className="input"
          placeholder="e.g., algorithm, sorting, array (comma-separated)"
        />
        <p className="text-xs text-gray-500 mt-1">
          Separate tags with commas. You can also generate tags using AI later
        </p>
      </div>

      <div className="flex gap-4 pt-4">
        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary px-8 py-3 text-base"
        >
          {loading ? 'Saving...' : submitLabel}
        </button>
        <a
          href="/dashboard"
          className="btn btn-secondary px-8 py-3 text-base"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}
