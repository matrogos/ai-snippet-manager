import { describe, test, expect } from 'vitest';
import {
  validateSuggestTags,
  validateExplainCode,
  validateGenerateDescription,
  formatValidationErrors,
} from '@/validators/ai.validator';
import { z } from 'zod';

describe('ai.validator', () => {

  describe('validateSuggestTags', () => {

    test('accepts valid code and language', () => {
      const data = {
        code: 'function sort(arr) { return arr.sort(); }',
        language: 'javascript',
      };

      const result = validateSuggestTags(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.code).toBe(data.code);
        expect(result.data.language).toBe(data.language);
      }
    });

    test('rejects empty code', () => {
      const data = {
        code: '',
        language: 'javascript',
      };

      const result = validateSuggestTags(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('empty');
      }
    });

    test('rejects code > 50000 characters', () => {
      const data = {
        code: 'a'.repeat(50001),
        language: 'javascript',
      };

      const result = validateSuggestTags(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('50000');
      }
    });

    test('requires code field', () => {
      const data = {
        language: 'javascript',
      };

      const result = validateSuggestTags(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('required');
      }
    });

    test('requires language field', () => {
      const data = {
        code: 'test code',
      };

      const result = validateSuggestTags(data);
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
          code: 'test code',
          language,
        };

        const result = validateSuggestTags(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.language).toBe(language);
        }
      });
    });

    test('rejects unsupported language', () => {
      const data = {
        code: 'test code',
        language: 'invalid_language',
      };

      const result = validateSuggestTags(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('Unsupported language');
      }
    });
  });

  describe('validateExplainCode', () => {

    test('accepts valid code and language', () => {
      const data = {
        code: 'const greeting = "Hello, World!";',
        language: 'javascript',
      };

      const result = validateExplainCode(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.code).toBe(data.code);
        expect(result.data.language).toBe(data.language);
      }
    });

    test('rejects empty code', () => {
      const data = {
        code: '',
        language: 'python',
      };

      const result = validateExplainCode(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('empty');
      }
    });

    test('rejects code > 50000 characters', () => {
      const data = {
        code: 'x'.repeat(50001),
        language: 'typescript',
      };

      const result = validateExplainCode(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('50000');
      }
    });

    test('requires code field', () => {
      const data = {
        language: 'go',
      };

      const result = validateExplainCode(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('required');
      }
    });

    test('requires language field', () => {
      const data = {
        code: 'package main',
      };

      const result = validateExplainCode(data);
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
          code: 'code example',
          language,
        };

        const result = validateExplainCode(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.language).toBe(language);
        }
      });
    });

    test('rejects unsupported language', () => {
      const data = {
        code: 'some code',
        language: 'brainfuck',
      };

      const result = validateExplainCode(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('Unsupported language');
      }
    });
  });

  describe('validateGenerateDescription', () => {

    test('accepts valid code and language', () => {
      const data = {
        code: 'def greet(name):\n    print(f"Hello, {name}!")',
        language: 'python',
      };

      const result = validateGenerateDescription(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.code).toBe(data.code);
        expect(result.data.language).toBe(data.language);
      }
    });

    test('rejects empty code', () => {
      const data = {
        code: '',
        language: 'rust',
      };

      const result = validateGenerateDescription(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('empty');
      }
    });

    test('rejects code > 50000 characters', () => {
      const data = {
        code: 'fn main() { '.repeat(5000),
        language: 'rust',
      };

      const result = validateGenerateDescription(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('50000');
      }
    });

    test('requires code field', () => {
      const data = {
        language: 'cpp',
      };

      const result = validateGenerateDescription(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('required');
      }
    });

    test('requires language field', () => {
      const data = {
        code: '#include <iostream>',
      };

      const result = validateGenerateDescription(data);
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
          code: 'sample code',
          language,
        };

        const result = validateGenerateDescription(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.language).toBe(language);
        }
      });
    });

    test('rejects unsupported language', () => {
      const data = {
        code: 'PRINT "HELLO"',
        language: 'basic',
      };

      const result = validateGenerateDescription(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('Unsupported language');
      }
    });
  });

  describe('formatValidationErrors (shared with snippet validator)', () => {

    test('formats Zod errors into API response shape', () => {
      const schema = z.object({
        code: z.string().min(1),
        language: z.string(),
      });

      const parseResult = schema.safeParse({ code: '', language: 123 });

      if (!parseResult.success) {
        const formatted = formatValidationErrors(parseResult.error);
        expect(formatted).toHaveProperty('errors');
        expect(Array.isArray(formatted.errors)).toBe(true);
        expect(formatted.errors.length).toBeGreaterThan(0);
      }
    });

    test('includes field path and message', () => {
      const schema = z.object({
        code: z.string().min(1, { message: 'Code is required' }),
      });

      const parseResult = schema.safeParse({ code: '' });

      if (!parseResult.success) {
        const formatted = formatValidationErrors(parseResult.error);
        expect(formatted.errors[0]).toHaveProperty('field');
        expect(formatted.errors[0]).toHaveProperty('message');
        expect(formatted.errors[0].field).toBe('code');
        expect(formatted.errors[0].message).toContain('Code is required');
      }
    });

    test('handles multiple errors', () => {
      const schema = z.object({
        code: z.string().min(1),
        language: z.string().min(1),
      });

      const parseResult = schema.safeParse({ code: '', language: '' });

      if (!parseResult.success) {
        const formatted = formatValidationErrors(parseResult.error);
        expect(formatted.errors.length).toBeGreaterThanOrEqual(2);
      }
    });
  });
});
