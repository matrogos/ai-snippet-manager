import { useState, type FormEvent } from 'react';
import { signIn } from '@/lib/supabase';
import { isValidEmail } from '@/lib/utils';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validation
    if (!isValidEmail(email)) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }

    if (!password) {
      setError('Password is required');
      setLoading(false);
      return;
    }

    try {
      console.log('Attempting login...');
      const { data, error: signInError } = await signIn(email, password);

      console.log('Login response:', { data, error: signInError });

      if (signInError) {
        setError(signInError.message);
        setLoading(false);
        return;
      }

      // Check if session was created
      if (!data.session) {
        console.error('No session in response:', data);
        setError('Login failed - no session created');
        setLoading(false);
        return;
      }

      console.log('Session created successfully:', data.session);
      console.log('Access token:', data.session.access_token ? 'Present' : 'Missing');

      // Small delay to ensure session is stored
      await new Promise(resolve => setTimeout(resolve, 500));

      console.log('Redirecting to dashboard...');
      // Redirect to dashboard
      window.location.href = '/dashboard';
    } catch (err) {
      console.error('Login error:', err);
      setError('An unexpected error occurred');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Login to your account</h2>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input"
          placeholder="you@example.com"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input"
          placeholder="••••••••"
        />
      </div>

      <div>
        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary w-full px-4 py-3 text-base"
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </div>

      <div className="text-center text-sm">
        <span className="text-gray-600">Don't have an account? </span>
        <a href="/register" className="text-primary-600 hover:text-primary-700 font-medium">
          Sign up
        </a>
      </div>
    </form>
  );
}
