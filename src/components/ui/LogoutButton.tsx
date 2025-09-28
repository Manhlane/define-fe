'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      // Call your NestJS logout API
    //   await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`, {
    //     method: 'POST',
    //     credentials: 'include', // important if using cookies
    //   });

      // Clear localStorage/sessionStorage if you stored tokens there
    //   localStorage.removeItem('accessToken');
    //   localStorage.removeItem('refreshToken');

      // Redirect to login
      router.push('/login');
    } catch (e) {
      console.error('Logout failed:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
    >
      {loading ? 'Logging out…' : 'Logout'}
    </button>
  );
}
