import { describe, test, expect } from 'vitest';
import {
  validateSnippetListQuery,
  validateSnippetId,
  validateCreateSnippet,
  validateUpdateSnippet,
  formatValidationErrors,
} from '@/validators/snippet.validator';
import { z } from 'zod';

describe('snippet.validator', () => {

  describe('validateSnippetListQuery', () => {

    test('accepts valid query parameters', () => {
      const query = {
        page: '1',
        limit: '20',
        sort: 'created_at',
        order: 'desc',
        language: 'javascript',
        tags: 'react,typescript',
        search: 'test',
      };

      const result = validateSnippetListQuery(query);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(20);
        expect(result.data.sort).toBe('created_at');
        expect(result.data.order).toBe('desc');
        expect(result.data.language).toBe('javascript');
        expect(result.data.tags).toBe('react,typescript');
        expect(result.data.search).toBe('test');
      }
    });

    test('applies default values for missing params', () => {
      const query = {};

      const result = validateSnippetListQuery(query);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(20);
        expect(result.data.sort).toBe('created_at');
        expect(result.data.order).toBe('desc');
      }
    });

    test('parses string numbers to integers', () => {
      const query = {
        page: '5',
        limit: '50',
      };

      const result = validateSnippetListQuery(query);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(5);
        expect(result.data.limit).toBe(50);
        expect(typeof result.data.page).toBe('number');
        expect(typeof result.data.limit).toBe('number');
      }
    });

    test('rejects page < 1', () => {
      const query = { page: '0' };

      const result = validateSnippetListQuery(query);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('positive integer');
      }
    });

    test('rejects limit < 1', () => {
      const query = { limit: '0' };

      const result = validateSnippetListQuery(query);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('at least');
      }
    });

    test('rejects limit > 100', () => {
      const query = { limit: '101' };

      const result = validateSnippetListQuery(query);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('not exceed 100');
      }
    });

    test('rejects invalid sort fields', () => {
      const query = { sort: 'invalid_field' };

      const result = validateSnippetListQuery(query);
      expect(result.success).toBe(false);
    });

    test('accepts valid sort fields', () => {
      const validSorts = ['created_at', 'updated_at', 'title'];

      validSorts.forEach(sort => {
        const result = validateSnippetListQuery({ sort });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.sort).toBe(sort);
        }
      });
    });

    test('rejects invalid order values', () => {
      const query = { order: 'invalid' };

      const result = validateSnippetListQuery(query);
      expect(result.success).toBe(false);
    });

    test('accepts valid order values', () => {
      const validOrders = ['asc', 'desc'];

      validOrders.forEach(order => {
        const result = validateSnippetListQuery({ order });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.order).toBe(order);
        }
      });
    });

    test('accepts valid language codes', () => {
      const validLanguages = ['javascript', 'typescript', 'python', 'java'];

      validLanguages.forEach(language => {
        const result = validateSnippetListQuery({ language });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.language).toBe(language);
        }
      });
    });

    test('rejects invalid language codes', () => {
      const query = { language: 'invalid_language' };

      const result = validateSnippetListQuery(query);
      expect(result.success).toBe(false);
    });

    test('accepts comma-separated tags string', () => {
      const query = { tags: 'react,typescript,nodejs' };

      const result = validateSnippetListQuery(query);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.tags).toBe('react,typescript,nodejs');
      }
    });

    test('accepts search query string', () => {
      const query = { search: 'function to sort array' };

      const result = validateSnippetListQuery(query);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.search).toBe('function to sort array');
      }
    });

    test('handles empty query object', () => {
      const result = validateSnippetListQuery({});
      expect(result.success).toBe(true);
    });

    test('handles undefined values', () => {
      const query = {
        page: undefined,
        limit: undefined,
      };

      const result = validateSnippetListQuery(query);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1); // default
        expect(result.data.limit).toBe(20); // default
      }
    });
  });

  describe('validateSnippetId', () => {

    test('accepts valid UUID v4', () => {
      const validUUIDs = [
        '550e8400-e29b-41d4-a716-446655440000',
        'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        '123e4567-e89b-12d3-a456-426614174000',
      ];

      validUUIDs.forEach(uuid => {
        const result = validateSnippetId(uuid);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.id).toBe(uuid);
        }
      });
    });

    test('rejects non-UUID strings', () => {
      const result = validateSnippetId('not-a-uuid');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('UUID');
      }
    });

    test('rejects empty string', () => {
      const result = validateSnippetId('');
      expect(result.success).toBe(false);
    });

    test('rejects numeric IDs', () => {
      const result = validateSnippetId('12345');
      expect(result.success).toBe(false);
    });

    test('rejects UUID-like strings with wrong format', () => {
      const invalidUUIDs = [
        '550e8400-e29b-41d4-a716',  // Too short
        '550e8400-e29b-41d4-a716-446655440000-extra',  // Too long
        '550e8400e29b41d4a716446655440000',  // No hyphens
      ];

      invalidUUIDs.forEach(uuid => {
        const result = validateSnippetId(uuid);
        expect(result.success).toBe(false);
      });
    });
  });

  describe('validateCreateSnippet', () => {

    test('accepts valid snippet data', () => {
      const validData = {
        title: 'Test Snippet',
        code: 'console.log("hello");',
        language: 'javascript',
        description: 'A test snippet',
        tags: ['test', 'javascript'],
      };

      const result = validateCreateSnippet(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe('Test Snippet');
        expect(result.data.code).toBe('console.log("hello");');
        expect(result.data.language).toBe('javascript');
        expect(result.data.description).toBe('A test snippet');
        expect(result.data.tags).toEqual(['test', 'javascript']);
      }
    });

    test('trims whitespace from title and code', () => {
      const data = {
        title: '  Test Snippet  ',
        code: '  console.log("hello");  ',
        language: 'javascript',
      };

      const result = validateCreateSnippet(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe('Test Snippet');
        expect(result.data.code).toBe('console.log("hello");');
      }
    });

    test('accepts optional description', () => {
      const data = {
        title: 'Test',
        code: 'test code',
        language: 'javascript',
        description: null,
      };

      const result = validateCreateSnippet(data);
      expect(result.success).toBe(true);
    });

    test('accepts optional tags array', () => {
      const data = {
        title: 'Test',
        code: 'test code',
        language: 'javascript',
        tags: ['tag1', 'tag2'],
      };

      const result = validateCreateSnippet(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.tags).toEqual(['tag1', 'tag2']);
      }
    });

    test('accepts empty tags array as default', () => {
      const data = {
        title: 'Test',
        code: 'test code',
        language: 'javascript',
      };

      const result = validateCreateSnippet(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.tags).toEqual([]);
      }
    });

    test('rejects empty title', () => {
      const data = {
        title: '',
        code: 'test code',
        language: 'javascript',
      };

      const result = validateCreateSnippet(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('empty');
      }
    });

    test('rejects title > 255 characters', () => {
      const data = {
        title: 'a'.repeat(256),
        code: 'test code',
        language: 'javascript',
      };

      const result = validateCreateSnippet(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('255');
      }
    });

    test('requires title field', () => {
      const data = {
        code: 'test code',
        language: 'javascript',
      };

      const result = validateCreateSnippet(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('required');
      }
    });

    test('rejects empty code', () => {
      const data = {
        title: 'Test',
        code: '',
        language: 'javascript',
      };

      const result = validateCreateSnippet(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('empty');
      }
    });

    test('rejects code > 50000 characters', () => {
      const data = {
        title: 'Test',
        code: 'a'.repeat(50001),
        language: 'javascript',
      };

      const result = validateCreateSnippet(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('50000');
      }
    });

    test('requires code field', () => {
      const data = {
        title: 'Test',
        language: 'javascript',
      };

      const result = validateCreateSnippet(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('required');
      }
    });

    test('accepts all supported languages', () => {
      const supportedLanguages = [
        'javascript', 'typescript', 'python', 'java', 'csharp',
        'cpp', 'go', 'rust', 'php', 'ruby', 'sql', 'html', 'css'
      ];

      supportedLanguages.forEach(language => {
        const data = {
          title: 'Test',
          code: 'test code',
          language,
        };

        const result = validateCreateSnippet(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.language).toBe(language);
        }
      });
    });

    test('rejects unsupported language', () => {
      const data = {
        title: 'Test',
        code: 'test code',
        language: 'invalid_language',
      };

      const result = validateCreateSnippet(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('Unsupported language');
      }
    });

    test('requires language field', () => {
      const data = {
        title: 'Test',
        code: 'test code',
      };

      const result = validateCreateSnippet(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('required');
      }
    });

    test('rejects tags > 20 count', () => {
      const data = {
        title: 'Test',
        code: 'test code',
        language: 'javascript',
        tags: Array(21).fill('tag'),
      };

      const result = validateCreateSnippet(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('20');
      }
    });

    test('rejects tag < 2 characters', () => {
      const data = {
        title: 'Test',
        code: 'test code',
        language: 'javascript',
        tags: ['a'],
      };

      const result = validateCreateSnippet(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('at least 2');
      }
    });

    test('rejects tag > 30 characters', () => {
      const data = {
        title: 'Test',
        code: 'test code',
        language: 'javascript',
        tags: ['a'.repeat(31)],
      };

      const result = validateCreateSnippet(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('30');
      }
    });

    test('accepts valid tags array', () => {
      const data = {
        title: 'Test',
        code: 'test code',
        language: 'javascript',
        tags: ['react', 'typescript', 'frontend'],
      };

      const result = validateCreateSnippet(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.tags).toEqual(['react', 'typescript', 'frontend']);
      }
    });

    test('accepts null description', () => {
      const data = {
        title: 'Test',
        code: 'test code',
        language: 'javascript',
        description: null,
      };

      const result = validateCreateSnippet(data);
      expect(result.success).toBe(true);
    });

    test('accepts null ai_description', () => {
      const data = {
        title: 'Test',
        code: 'test code',
        language: 'javascript',
        ai_description: null,
      };

      const result = validateCreateSnippet(data);
      expect(result.success).toBe(true);
    });

    test('accepts null ai_explanation', () => {
      const data = {
        title: 'Test',
        code: 'test code',
        language: 'javascript',
        ai_explanation: null,
      };

      const result = validateCreateSnippet(data);
      expect(result.success).toBe(true);
    });
  });

  describe('validateUpdateSnippet', () => {

    test('accepts partial updates (single field)', () => {
      const updates = { title: 'Updated Title' };

      const result = validateUpdateSnippet(updates);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe('Updated Title');
      }
    });

    test('rejects empty update object', () => {
      const result = validateUpdateSnippet({});
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('At least one field');
      }
    });

    test('allows optional title update', () => {
      const result = validateUpdateSnippet({ title: 'New Title' });
      expect(result.success).toBe(true);
    });

    test('allows optional code update', () => {
      const result = validateUpdateSnippet({ code: 'new code' });
      expect(result.success).toBe(true);
    });

    test('allows optional language update', () => {
      const result = validateUpdateSnippet({ language: 'python' });
      expect(result.success).toBe(true);
    });

    test('allows optional tags update', () => {
      const result = validateUpdateSnippet({ tags: ['new', 'tags'] });
      expect(result.success).toBe(true);
    });

    test('allows optional is_favorite update', () => {
      const result = validateUpdateSnippet({ is_favorite: true });
      expect(result.success).toBe(true);
    });

    test('validates is_favorite as boolean', () => {
      const result = validateUpdateSnippet({ is_favorite: 'true' });
      expect(result.success).toBe(false);
    });

    test('applies same validation rules as create for title', () => {
      const result = validateUpdateSnippet({ title: 'a'.repeat(256) });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('255');
      }
    });

    test('applies same validation rules as create for code', () => {
      const result = validateUpdateSnippet({ code: 'a'.repeat(50001) });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('50000');
      }
    });

    test('applies same validation rules as create for language', () => {
      const result = validateUpdateSnippet({ language: 'invalid' });
      expect(result.success).toBe(false);
    });

    test('applies same validation rules as create for tags', () => {
      const result = validateUpdateSnippet({ tags: Array(21).fill('tag') });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('20');
      }
    });

    test('accepts multiple fields in update', () => {
      const updates = {
        title: 'New Title',
        code: 'new code',
        is_favorite: true,
      };

      const result = validateUpdateSnippet(updates);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe('New Title');
        expect(result.data.code).toBe('new code');
        expect(result.data.is_favorite).toBe(true);
      }
    });
  });

  describe('formatValidationErrors', () => {

    test('formats Zod errors into API response shape', () => {
      const schema = z.object({
        name: z.string().min(1),
        age: z.number(),
      });

      const parseResult = schema.safeParse({ name: '', age: 'not a number' });

      if (!parseResult.success) {
        const formatted = formatValidationErrors(parseResult.error);
        expect(formatted).toHaveProperty('errors');
        expect(Array.isArray(formatted.errors)).toBe(true);
      }
    });

    test('includes field path and message', () => {
      const schema = z.object({
        title: z.string().min(1, { message: 'Title is required' }),
      });

      const parseResult = schema.safeParse({ title: '' });

      if (!parseResult.success) {
        const formatted = formatValidationErrors(parseResult.error);
        expect(formatted.errors[0]).toHaveProperty('field');
        expect(formatted.errors[0]).toHaveProperty('message');
        expect(formatted.errors[0].field).toBe('title');
        expect(formatted.errors[0].message).toContain('Title is required');
      }
    });

    test('handles nested field paths', () => {
      const schema = z.object({
        user: z.object({
          name: z.string().min(1),
        }),
      });

      const parseResult = schema.safeParse({ user: { name: '' } });

      if (!parseResult.success) {
        const formatted = formatValidationErrors(parseResult.error);
        expect(formatted.errors[0].field).toBe('user.name');
      }
    });

    test('handles multiple errors', () => {
      const schema = z.object({
        title: z.string().min(1),
        code: z.string().min(1),
      });

      const parseResult = schema.safeParse({ title: '', code: '' });

      if (!parseResult.success) {
        const formatted = formatValidationErrors(parseResult.error);
        expect(formatted.errors).toHaveLength(2);
      }
    });
  });
});
