import { SUPPORTED_LANGUAGES } from '@/config/languages';
import { MAX_SNIPPET_TITLE_LENGTH, MAX_SNIPPET_CODE_LENGTH } from '@/config/constants';
import type { CreateSnippetInput } from '@/types/snippet';

// Input sanitization
export function sanitizeInput(input: string): string {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .trim();
}

// Validation
export function validateSnippetInput(data: CreateSnippetInput): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!data.title || data.title.trim().length === 0) {
    errors.push('Title is required');
  } else if (data.title.length > MAX_SNIPPET_TITLE_LENGTH) {
    errors.push(`Title must be less than ${MAX_SNIPPET_TITLE_LENGTH} characters`);
  }

  if (!data.code || data.code.trim().length === 0) {
    errors.push('Code is required');
  } else if (data.code.length > MAX_SNIPPET_CODE_LENGTH) {
    errors.push(`Code must be less than ${MAX_SNIPPET_CODE_LENGTH} characters`);
  }

  if (!data.language || !SUPPORTED_LANGUAGES.includes(data.language as any)) {
    errors.push('Invalid programming language');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// Email validation
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Password validation
export function isValidPassword(password: string): boolean {
  return password.length >= 8;
}

// Date formatting
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

// Relative time
export function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

  return formatDate(dateString);
}

// Copy to clipboard
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}
