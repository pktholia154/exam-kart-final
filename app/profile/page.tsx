"use client";

import { useAuth } from "@/lib/auth-context";
import { signInWithPopup, googleProvider, auth, signOut } from "@/lib/firebase";

export default function ProfilePage() {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (!user) {
    return (
      <main className="min-h-screen pt-20 pb-8 max-w-md mx-auto px-6 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-[#3A20BA]/10 text-[#3A20BA] rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Sign in to your account</h2>
        <p className="text-xs text-gray-500 mb-8">Access refer and earn, manage your profile and view transaction history.</p>
        <button 
          onClick={() => signInWithPopup(auth, googleProvider)}
          className="w-full py-3.5 bg-[#3A20BA] text-white rounded-xl text-sm font-bold active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5 bg-white rounded-full p-1 text-[#3A20BA]" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Continue with Google
        </button>
      </main>
    );
  }

  return (
    <main className="min-h-screen pt-4 pb-8 max-w-md mx-auto px-4">
      <h1 className="text-xl font-bold text-gray-900 mb-6 tracking-tight">Profile</h1>
      
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 flex items-center gap-4 mb-6">
        <div className="w-14 h-14 bg-[#3A20BA] rounded-full flex items-center justify-center text-white text-xl font-bold shrink-0">
          {user.displayName?.[0] || "U"}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-bold text-gray-900 truncate">{user.displayName}</h2>
          <p className="text-xs text-gray-500 truncate">{user.email}</p>
        </div>
      </div>

      <div className="bg-gradient-to-br from-[#8720BA] to-[#3A20BA] rounded-3xl p-5 text-white shadow-md mb-6 relative overflow-hidden">
        <div className="relative z-10">
          <h3 className="text-base font-bold mb-1">Refer & Earn</h3>
          <p className="text-xs text-white/80 mb-4">Invite friends and earn ₹50 on their first purchase.</p>
          <button className="bg-white text-[#8720BA] px-4 py-2 rounded-full text-xs font-bold active:scale-95 transition-transform">Share Invite Link</button>
        </div>
      </div>

      <div className="space-y-2">
        <button className="w-full bg-white p-4 rounded-2xl flex items-center justify-between shadow-sm border border-gray-100 active:scale-[0.98] transition-transform">
          <span className="text-sm font-bold text-gray-900">Account Settings</span>
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </button>
        <button className="w-full bg-white p-4 rounded-2xl flex items-center justify-between shadow-sm border border-gray-100 active:scale-[0.98] transition-transform">
          <span className="text-sm font-bold text-gray-900">Help & Support</span>
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </button>
        <button onClick={() => signOut(auth)} className="w-full bg-white p-4 rounded-2xl flex items-center justify-between shadow-sm border border-gray-100 active:scale-[0.98] transition-transform mt-4">
          <span className="text-sm font-bold text-[#BA8720]">Sign Out</span>
        </button>
      </div>
    </main>
  );
}
