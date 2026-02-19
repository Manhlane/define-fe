import { Suspense } from 'react';
import MobileAuthPageClient from './page.client';

export default function MobileAuthPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <MobileAuthPageClient />
    </Suspense>
  );
}
