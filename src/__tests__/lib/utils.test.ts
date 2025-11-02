import { describe, test, expect, vi, beforeEach } from 'vitest';
import {
  sanitizeInput,
  validateSnippetInput,
  isValidEmail,
  isValidPassword,
  formatDate,
  getRelativeTime,
  copyToClipboard,
} from '@/lib/utils';

describe('utils', () => {

  describe('sanitizeInput', () => {

    test('removes script tags', () => {
      const input = 'Hello <script>alert("xss")</script> World';
      const result = sanitizeInput(input);
      expect(result).toBe('Hello  World');
      expect(result).not.toContain('<script>');
    });

    test('removes script tags with attributes', () => {
      const input = '<script type="text/javascript">alert("xss")</script>';
      const result = sanitizeInput(input);
      expect(result).toBe('');
      expect(result).not.toContain('<script');
    });

    test('removes multiple script tags', () => {
      const input = '<script>1</script>Text<script>2</script>';
      const result = sanitizeInput(input);
      expect(result).toBe('Text');
    });

    test('removes script tags case-insensitively', () => {
      const input = '<SCRIPT>alert("xss")</SCRIPT>';
      const result = sanitizeInput(input);
      expect(result).toBe('');
    });

    test('trims whitespace', () => {
      const input = '   Hello World   ';
      const result = sanitizeInput(input);
      expect(result).toBe('Hello World');
    });

    test('preserves other HTML tags (for now)', () => {
      const input = '<div>Hello</div>';
      const result = sanitizeInput(input);
      expect(result).toBe('<div>Hello</div>');
    });

    test('handles empty string', () => {
      const result = sanitizeInput('');
      expect(result).toBe('');
    });

    test('handles string without script tags', () => {
      const input = 'Just a normal string';
      const result = sanitizeInput(input);
      expect(result).toBe('Just a normal string');
    });

    test('handles complex nested script tags', () => {
      const input = '<script><script>alert("nested")</script></script>';
      const result = sanitizeInput(input);
      // Note: The regex removes the outer script tags, leaving the closing tag
      // This is a known limitation of the simple regex approach
      expect(result).toBe('</script>');
    });
  });

  describe('validateSnippetInput', () => {

    test('returns valid:true for valid input', () => {
      const data = {
        title: 'Test Snippet',
        code: 'console.log("test");',
        language: 'javascript',
        description: 'A test',
        tags: ['test'],
      };

      const result = validateSnippetInput(data);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    test('returns valid:false with errors for invalid input', () => {
      const data = {
        title: '',
        code: '',
        language: 'invalid',
      };

      const result = validateSnippetInput(data);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('checks title is required', () => {
      const data = {
        title: '',
        code: 'test code',
        language: 'javascript',
      };

      const result = validateSnippetInput(data);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Title is required');
    });

    test('checks title length <= 255', () => {
      const data = {
        title: 'a'.repeat(256),
        code: 'test code',
        language: 'javascript',
      };

      const result = validateSnippetInput(data);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('255'))).toBe(true);
    });

    test('checks code is required', () => {
      const data = {
        title: 'Test',
        code: '',
        language: 'javascript',
      };

      const result = validateSnippetInput(data);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Code is required');
    });

    test('checks code length <= 50000', () => {
      const data = {
        title: 'Test',
        code: 'a'.repeat(50001),
        language: 'javascript',
      };

      const result = validateSnippetInput(data);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('50000'))).toBe(true);
    });

    test('checks language is supported', () => {
      const data = {
        title: 'Test',
        code: 'test code',
        language: 'invalid_language',
      };

      const result = validateSnippetInput(data);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid programming language');
    });

    test('returns multiple errors for multiple issues', () => {
      const data = {
        title: '',
        code: '',
        language: 'invalid',
      };

      const result = validateSnippetInput(data);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBe(3);
    });

    test('accepts valid supported languages', () => {
      const languages = ['javascript', 'python', 'typescript', 'java'];

      languages.forEach(language => {
        const data = {
          title: 'Test',
          code: 'test code',
          language,
        };

        const result = validateSnippetInput(data);
        expect(result.valid).toBe(true);
      });
    });
  });

  describe('isValidEmail', () => {

    test('accepts standard email', () => {
      expect(isValidEmail('user@example.com')).toBe(true);
    });

    test('accepts email with plus sign', () => {
      expect(isValidEmail('user+tag@example.com')).toBe(true);
    });

    test('accepts email with dots in local part', () => {
      expect(isValidEmail('first.last@example.com')).toBe(true);
    });

    test('accepts email with subdomain', () => {
      expect(isValidEmail('user@mail.example.com')).toBe(true);
    });

    test('accepts email with numbers', () => {
      expect(isValidEmail('user123@example456.com')).toBe(true);
    });

    test('accepts email with hyphen in domain', () => {
      expect(isValidEmail('user@my-domain.com')).toBe(true);
    });

    test('rejects email without @', () => {
      expect(isValidEmail('userexample.com')).toBe(false);
    });

    test('rejects email without domain', () => {
      expect(isValidEmail('user@')).toBe(false);
    });

    test('rejects email without TLD', () => {
      expect(isValidEmail('user@example')).toBe(false);
    });

    test('rejects email with spaces', () => {
      expect(isValidEmail('user name@example.com')).toBe(false);
    });

    test('rejects empty string', () => {
      expect(isValidEmail('')).toBe(false);
    });

    test('rejects email with multiple @ signs', () => {
      expect(isValidEmail('user@@example.com')).toBe(false);
    });
  });

  describe('isValidPassword', () => {

    test('accepts password with 8 characters', () => {
      expect(isValidPassword('12345678')).toBe(true);
    });

    test('accepts password with > 8 characters', () => {
      expect(isValidPassword('verylongpassword123')).toBe(true);
    });

    test('accepts password with exactly 8 characters', () => {
      expect(isValidPassword('abcdefgh')).toBe(true);
    });

    test('rejects password with < 8 characters', () => {
      expect(isValidPassword('1234567')).toBe(false);
    });

    test('rejects password with 7 characters', () => {
      expect(isValidPassword('short12')).toBe(false);
    });

    test('rejects empty password', () => {
      expect(isValidPassword('')).toBe(false);
    });

    test('accepts password with special characters', () => {
      expect(isValidPassword('P@ssw0rd!')).toBe(true);
    });
  });

  describe('formatDate', () => {

    test('formats ISO date string correctly', () => {
      const date = '2025-01-20T12:00:00Z';
      const result = formatDate(date);
      expect(result).toMatch(/Jan \d{1,2}, 2025/);
    });

    test('formats date as "MMM DD, YYYY" format', () => {
      const date = '2024-12-25T00:00:00Z';
      const result = formatDate(date);
      expect(result).toMatch(/Dec \d{1,2}, 2024/);
    });

    test('handles different months', () => {
      const dates = [
        '2025-01-01T00:00:00Z',
        '2025-06-15T00:00:00Z',
        '2025-12-31T00:00:00Z',
      ];

      dates.forEach(date => {
        const result = formatDate(date);
        expect(result).toMatch(/\w{3} \d{1,2}, 2025/);
      });
    });
  });

  describe('getRelativeTime', () => {

    beforeEach(() => {
      // Mock the current time for consistent testing
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2025-01-20T12:00:00Z'));
    });

    test('returns "just now" for < 1 minute ago', () => {
      const date = new Date('2025-01-20T11:59:30Z').toISOString(); // 30 seconds ago
      expect(getRelativeTime(date)).toBe('just now');
    });

    test('returns "1 minute ago" for exactly 1 minute', () => {
      const date = new Date('2025-01-20T11:59:00Z').toISOString();
      expect(getRelativeTime(date)).toBe('1 minute ago');
    });

    test('returns "5 minutes ago" for 5 minutes', () => {
      const date = new Date('2025-01-20T11:55:00Z').toISOString();
      expect(getRelativeTime(date)).toBe('5 minutes ago');
    });

    test('returns "59 minutes ago" for 59 minutes', () => {
      const date = new Date('2025-01-20T11:01:00Z').toISOString();
      expect(getRelativeTime(date)).toBe('59 minutes ago');
    });

    test('returns "1 hour ago" for exactly 60 minutes', () => {
      const date = new Date('2025-01-20T11:00:00Z').toISOString();
      expect(getRelativeTime(date)).toBe('1 hour ago');
    });

    test('returns "2 hours ago" for 2 hours', () => {
      const date = new Date('2025-01-20T10:00:00Z').toISOString();
      expect(getRelativeTime(date)).toBe('2 hours ago');
    });

    test('returns "23 hours ago" for 23 hours', () => {
      const date = new Date('2025-01-19T13:00:00Z').toISOString();
      expect(getRelativeTime(date)).toBe('23 hours ago');
    });

    test('returns "1 day ago" for exactly 24 hours', () => {
      const date = new Date('2025-01-19T12:00:00Z').toISOString();
      expect(getRelativeTime(date)).toBe('1 day ago');
    });

    test('returns "3 days ago" for 3 days', () => {
      const date = new Date('2025-01-17T12:00:00Z').toISOString();
      expect(getRelativeTime(date)).toBe('3 days ago');
    });

    test('returns "6 days ago" for 6 days', () => {
      const date = new Date('2025-01-14T12:00:00Z').toISOString();
      expect(getRelativeTime(date)).toBe('6 days ago');
    });

    test('returns formatted date for >= 7 days', () => {
      const date = new Date('2025-01-13T12:00:00Z').toISOString(); // 7 days ago
      const result = getRelativeTime(date);
      expect(result).toMatch(/Jan \d{1,2}, 2025/);
    });

    test('uses singular "minute" for 1 minute', () => {
      const date = new Date('2025-01-20T11:59:00Z').toISOString();
      expect(getRelativeTime(date)).toBe('1 minute ago');
      expect(getRelativeTime(date)).not.toContain('minutes');
    });

    test('uses plural "minutes" for > 1 minute', () => {
      const date = new Date('2025-01-20T11:58:00Z').toISOString();
      expect(getRelativeTime(date)).toBe('2 minutes ago');
    });

    test('uses singular "hour" for 1 hour', () => {
      const date = new Date('2025-01-20T11:00:00Z').toISOString();
      expect(getRelativeTime(date)).toBe('1 hour ago');
      expect(getRelativeTime(date)).not.toContain('hours');
    });

    test('uses plural "hours" for > 1 hour', () => {
      const date = new Date('2025-01-20T10:00:00Z').toISOString();
      expect(getRelativeTime(date)).toBe('2 hours ago');
    });

    test('uses singular "day" for 1 day', () => {
      const date = new Date('2025-01-19T12:00:00Z').toISOString();
      expect(getRelativeTime(date)).toBe('1 day ago');
      expect(getRelativeTime(date)).not.toContain('days');
    });

    test('uses plural "days" for > 1 day', () => {
      const date = new Date('2025-01-18T12:00:00Z').toISOString();
      expect(getRelativeTime(date)).toBe('2 days ago');
    });
  });

  describe('copyToClipboard', () => {

    test('returns true on successful copy', async () => {
      // Mock the clipboard API
      const writeTextMock = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, {
        clipboard: {
          writeText: writeTextMock,
        },
      });

      const result = await copyToClipboard('test text');
      expect(result).toBe(true);
      expect(writeTextMock).toHaveBeenCalledWith('test text');
    });

    test('returns false on failed copy', async () => {
      // Mock clipboard API to fail
      const writeTextMock = vi.fn().mockRejectedValue(new Error('Failed'));
      Object.assign(navigator, {
        clipboard: {
          writeText: writeTextMock,
        },
      });

      const result = await copyToClipboard('test text');
      expect(result).toBe(false);
    });

    test('handles clipboard API not available', async () => {
      // Remove clipboard API
      Object.assign(navigator, {
        clipboard: undefined,
      });

      const result = await copyToClipboard('test text');
      expect(result).toBe(false);
    });
  });
});
