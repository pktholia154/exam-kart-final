'use client';
import { useState, useEffect } from 'react';
import { User, Download } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';

import Image from 'next/image';

export function HeaderActions() {
  const { user, loading } = useAuth();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(() => {
    if (typeof window !== 'undefined') {
      return (
        window.matchMedia('(display-mode: standalone)').matches ||
        window.matchMedia('(display-mode: fullscreen)').matches ||
        (window.navigator as any).standalone === true
      );
    }
    return false;
  });
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 768 : false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstalled(false);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // Fallback message if prompt is not available
      alert('To install the app, use your browser menu and select "Add to Home Screen".');
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {!isInstalled && (
        <button
          onClick={handleInstallClick}
          className="flex items-center gap-1 bg-[#3A20BA] text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-sm active:scale-95 transition-transform"
        >
          <Download className="w-3.5 h-3.5" />
          Install App
        </button>
      )}
      
      {!loading && (
        user ? (
          <Link href="/profile" className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 border border-gray-200 overflow-hidden shrink-0">
            {user.photoURL ? (
              <Image src={user.photoURL} alt="Profile" width={32} height={32} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <User className="w-4 h-4 text-gray-600" />
            )}
          </Link>
        ) : (
          <Link href="/profile" className="flex items-center gap-1 bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-full text-xs font-bold shadow-sm active:scale-95 transition-transform">
            Signin
          </Link>
        )
      )}
    </div>
  );
}
