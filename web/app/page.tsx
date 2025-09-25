"use client";
import Link from 'next/link';
import { AuthProvider, useAuth } from '../lib/auth';
import { useEffect } from 'react';

function HomeContent() {
  const { user } = useAuth();
  
  useEffect(() => {
    if (user && typeof window !== 'undefined') {
      window.location.href = '/dashboard';
    }
  }, [user]);

  return (
    <main className="flex h-full items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <h1 className="text-3xl font-semibold">Welcome to GDrive Clone</h1>
        <p className="text-gray-600">Sign in to access your drive.</p>
        <div className="flex gap-3 justify-center">
          <Link href="/login" className="px-4 py-2 bg-primary-600 text-white rounded">Login</Link>
          <Link href="/signup" className="px-4 py-2 border rounded">Sign up</Link>
        </div>
      </div>
    </main>
  );
}

export default function Home() {
  return (
    <AuthProvider>
      <HomeContent />
    </AuthProvider>
  );
}


