import { Suspense } from 'react';
import LandingPageClient from './page.client';

export default function LandingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--app-bg)]" />}>
      <LandingPageClient />
    </Suspense>
  );
}
