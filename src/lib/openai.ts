import OpenAI from 'openai';
import { AI_REQUEST_TIMEOUT, AI_MAX_RETRIES } from '@/config/constants';

const apiKey = import.meta.env.OPENAI_API_KEY;

if (!apiKey) {
  throw new Error('Missing OpenAI API key');
}

const openai = new OpenAI({
  apiKey,
  timeout: AI_REQUEST_TIMEOUT,
  maxRetries: AI_MAX_RETRIES,
});

export async function generateDescription(
  code: string,
  language: string
): Promise<string> {
  const prompt = `Analyze this ${language} code and provide a concise 1-2 sentence description of what it does. Focus on the main functionality.

Code:
${code}

Description:`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 150,
    temperature: 0.7,
  });

  return completion.choices[0].message.content?.trim() || '';
}

export async function explainCode(
  code: string,
  language: string
): Promise<string> {
  const prompt = `Explain this ${language} code step by step. Break down the logic and explain what each important section does.

Code:
${code}

Explanation:`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 800,
    temperature: 0.7,
  });

  return completion.choices[0].message.content?.trim() || '';
}

export async function suggestTags(
  code: string,
  language: string
): Promise<string[]> {
  const prompt = `Suggest 3-5 relevant tags for this ${language} code snippet. Tags should describe the functionality, patterns, or technologies used. Return only comma-separated tags.

Code:
${code}

Tags:`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 50,
    temperature: 0.5,
  });

  const tagsString = completion.choices[0].message.content?.trim() || '';
  return tagsString
    .split(',')
    .map(tag => tag.trim())
    .filter(Boolean)
    .slice(0, 5); // Limit to 5 tags
}

// Error handling with retry logic
export async function callOpenAIWithRetry<T>(
  apiCall: () => Promise<T>,
  maxRetries = AI_MAX_RETRIES,
  delay = 1000
): Promise<T> {
  let lastError: Error;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await apiCall();
    } catch (error: any) {
      lastError = error;

      // Don't retry on client errors (4xx)
      if (error.status && error.status >= 400 && error.status < 500) {
        throw error;
      }

      // Wait before retry (exponential backoff)
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
      }
    }
  }

  throw lastError!;
}
