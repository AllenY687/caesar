'use client';

import dynamic from 'next/dynamic';

// Use dynamic import with SSR disabled for the CaesarCipher component
const CaesarCipher = dynamic(() => import('./CaesarCipher'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[28rem] flex items-center justify-center">
      <div className="animate-pulse">
        <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-700"></div>
      </div>
    </div>
  ),
});

export default function ClientCipherWrapper() {
  return <CaesarCipher />;
} 