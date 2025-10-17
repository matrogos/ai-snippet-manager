import type { Snippet } from '@/types/snippet';
import { getRelativeTime } from '@/lib/utils';
import { LANGUAGE_LABELS } from '@/config/languages';

interface Props {
  snippet: Snippet;
}

export default function SnippetCard({ snippet }: Props) {
  const languageLabel = LANGUAGE_LABELS[snippet.language as keyof typeof LANGUAGE_LABELS] || snippet.language;

  return (
    <a
      href={`/snippet/${snippet.id}`}
      className="card hover:shadow-md transition-shadow block"
    >
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-lg font-semibold text-gray-900 truncate flex-1">
          {snippet.title}
        </h3>
        <span className="ml-3 px-2 py-1 bg-primary-100 text-primary-700 text-xs font-medium rounded">
          {languageLabel}
        </span>
      </div>

      {(snippet.description || snippet.ai_description) && (
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {snippet.ai_description || snippet.description}
        </p>
      )}

      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-2">
          {snippet.tags && snippet.tags.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {snippet.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded"
                >
                  #{tag}
                </span>
              ))}
              {snippet.tags.length > 3 && (
                <span className="px-2 py-0.5 text-gray-500">
                  +{snippet.tags.length - 3} more
                </span>
              )}
            </div>
          )}
        </div>
        <time dateTime={snippet.created_at} className="whitespace-nowrap">
          {getRelativeTime(snippet.created_at)}
        </time>
      </div>

      <div className="mt-3 pt-3 border-t border-gray-200">
        <pre className="text-xs text-gray-700 font-mono overflow-hidden line-clamp-3">
          {snippet.code}
        </pre>
      </div>
    </a>
  );
}
