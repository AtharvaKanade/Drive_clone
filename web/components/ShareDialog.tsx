"use client";
import { useState } from 'react';
import { api } from '../lib/http';

export default function ShareDialog({ fileId, onClose }: { fileId: string; onClose: () => void }) {
  const [role, setRole] = useState<'VIEWER' | 'EDITOR'>('VIEWER');
  const [link, setLink] = useState<string | null>(null);
  const [minutes, setMinutes] = useState(60);

  async function createLink() {
    const { data } = await api.client.post('/share', {
      resourceId: fileId,
      resourceType: 'FILE',
      role,
      expiresInMinutes: minutes,
    });
    const url = `${window.location.origin}/share/${data.token}`;
    setLink(url);
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center">
      <div className="bg-white rounded p-4 w-full max-w-md space-y-3">
        <h2 className="text-lg font-semibold">Share file</h2>
        <div className="flex items-center gap-2">
          <label>Role</label>
          <select value={role} onChange={(e) => setRole(e.target.value as any)} className="border rounded p-1">
            <option value="VIEWER">Viewer</option>
            <option value="EDITOR">Editor</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label>Expires (minutes)</label>
          <input type="number" value={minutes} min={1} onChange={(e) => setMinutes(Number(e.target.value))} className="border rounded p-1 w-24" />
        </div>
        <div className="flex gap-2">
          <button onClick={createLink} className="px-3 py-2 bg-primary-600 text-white rounded">Generate link</button>
          <button onClick={onClose} className="px-3 py-2 border rounded">Close</button>
        </div>
        {link && (
          <div className="mt-2">
            <input readOnly value={link} className="w-full border rounded p-2" />
            <button className="mt-2 text-sm underline" onClick={() => navigator.clipboard.writeText(link!)}>Copy</button>
          </div>
        )}
      </div>
    </div>
  );
}


