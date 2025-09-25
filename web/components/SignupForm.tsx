"use client";
import { useState } from 'react';
import { useAuth } from '../lib/auth';

export default function SignupForm() {
  const { signup, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setError(null);
        if (password.length < 8) {
          setError('Password must be at least 8 characters');
          return;
        }
        if (!name.trim()) {
          setError('Name is required');
          return;
        }
        const ok = await signup(email, password, name);
        if (!ok) setError('Sign up failed - email may already be in use');
      }}
    >
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <div>
        <label className="block text-sm mb-1">Name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} className="w-full border rounded p-2" required />
      </div>
      <div>
        <label className="block text-sm mb-1">Email</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border rounded p-2" type="email" required />
      </div>
      <div>
        <label className="block text-sm mb-1">Password</label>
        <input value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border rounded p-2" type="password" required />
      </div>
      <button disabled={loading} className="w-full bg-primary-600 text-white py-2 rounded">
        {loading ? 'Creating...' : 'Create account'}
      </button>
    </form>
  );
}


