'use client';

import { useState } from 'react';
import AuthCard from '../../components/ui/AuthCard';

export default function VerifyEmailPage() {
  const [resent, setResent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleResend = async () => {
    setLoading(true);
    try {
      // Call your API to resend verification email
      // await api('/auth/resend-verification', { method: 'POST' });
      setResent(true);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <AuthCard title="Verify your email">
        <div className="space-y-4 text-center">
          <p className="text-sm text-gray-600">
            We’ve sent a verification link to your email.  
            Please check your inbox (and spam folder just in case).
          </p>

          {!resent ? (
            <button
              onClick={handleResend}
              disabled={loading}
              className="w-full rounded-md bg-black text-white py-2 font-medium hover:bg-gray-900 transition"
            >
              {loading ? 'Resending…' : 'Resend verification email'}
            </button>
          ) : (
            <p className="text-sm text-green-600">
              ✅ A new verification email has been sent!
            </p>
          )}
        </div>
      </AuthCard>
    </div>
  );
}
