import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import SnippetList from './SnippetList';

export default function DashboardContent() {
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      window.location.href = '/login';
      return;
    }

    setUserEmail(session.user.email || '');
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Snippets</h1>
            <p className="text-gray-600">
              Welcome back! You're logged in as <span className="font-medium">{userEmail}</span>
            </p>
          </div>
          <a href="/snippet/new" className="btn btn-primary px-6 py-3">
            + New Snippet
          </a>
        </div>
      </div>

      <SnippetList />
    </>
  );
}
