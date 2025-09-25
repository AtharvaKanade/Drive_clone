"use client";
import { useState, useEffect } from 'react';
import { api } from '../lib/http';

export default function SearchBar() {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<any | null>(null);
  useEffect(() => {
    const id = setTimeout(async () => {
      if (!q) return setResults(null);
      const { data } = await api.client.get('/search', { params: { q } });
      setResults(data.results);
    }, 300);
    return () => clearTimeout(id);
  }, [q]);
  return (
    <div className="w-full">
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" className="w-full border rounded p-2" />
      {results && (
        <div className="mt-2 bg-white border rounded p-2 text-sm">
          <div className="font-medium mb-1">Results</div>
          <div className="grid gap-1">
            {results.files.slice(0, 5).map((f: any) => (
              <div key={f.id}>File: {f.name}</div>
            ))}
            {results.folders.slice(0, 5).map((f: any) => (
              <div key={f.id}>Folder: {f.name}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


