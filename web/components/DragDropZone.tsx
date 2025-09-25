"use client";
import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { api } from '../lib/http';

export default function DragDropZone({ currentFolderId, onUploadComplete }: { 
  currentFolderId?: string; 
  onUploadComplete?: () => void;
}) {
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [uploading, setUploading] = useState(false);
  
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setUploading(true);
    try {
      for (const file of acceptedFiles) {
        const form = new FormData();
        form.append('file', file);
        if (currentFolderId) {
          form.append('folderId', currentFolderId);
        }
        
        await api.client.post('/files/upload', form, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (evt) => {
            if (!evt.total) return;
            setProgress((p) => ({ ...p, [file.name]: Math.round((evt.loaded / evt.total!) * 100) }));
          },
        });
      }
      // Refresh file list after successful upload
      onUploadComplete?.();
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
      // Clear progress after 3 seconds
      setTimeout(() => setProgress({}), 3000);
    }
  }, [currentFolderId, onUploadComplete]);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });
  return (
    <div {...getRootProps()} className={`border-2 border-dashed rounded p-6 text-center ${isDragActive ? 'bg-blue-50' : 'bg-white'} ${uploading ? 'opacity-50' : ''}`}>
      <input {...getInputProps()} disabled={uploading} />
      <p>{uploading ? 'Uploading...' : 'Drag & drop files here, or click to select'}</p>
      <div className="mt-4 space-y-2">
        {Object.entries(progress).map(([name, pct]) => (
          <div key={name} className="text-sm">
            <div className="flex justify-between">
              <span>{name}</span>
              <span>{pct}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${pct}%` }}></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


