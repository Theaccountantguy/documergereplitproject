import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function Debug() {
  const [sessionData, setSessionData] = useState<any>(null);

  useEffect(() => {
    const getSessionInfo = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      console.log('Full session data:', session);
      console.log('Session error:', error);
      setSessionData(session);
    };

    getSessionInfo();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Debug Session Data</h1>
      <div className="bg-gray-100 p-4 rounded">
        <h2 className="font-semibold mb-2">Session Data:</h2>
        <pre className="text-sm overflow-auto">
          {JSON.stringify(sessionData, null, 2)}
        </pre>
      </div>
      <div className="mt-4">
        <p><strong>Provider Token:</strong> {sessionData?.provider_token || 'Not available'}</p>
        <p><strong>Provider Refresh Token:</strong> {sessionData?.provider_refresh_token || 'Not available'}</p>
        <p><strong>User ID:</strong> {sessionData?.user?.id || 'Not available'}</p>
        <p><strong>Email:</strong> {sessionData?.user?.email || 'Not available'}</p>
      </div>
    </div>
  );
}