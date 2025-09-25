"use client";
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/http';
import { useAuth } from '../lib/auth';
import FilePreview from './FilePreview';

export default function FileList({ currentFolderId, onFolderClick, onUploadComplete }: { 
  currentFolderId?: string; 
  onFolderClick?: (folderId: string) => void;
  onUploadComplete?: (refetch: () => void) => void;
}) {
  const { user } = useAuth();
  const [previewFile, setPreviewFile] = useState<any>(null);
  
  const { data: folderContents, refetch, isLoading, error } = useQuery({
    queryKey: ['folderContents', currentFolderId, user?.id],
    queryFn: async () => {
      console.log('FileList: Fetching data for user:', user?.id, 'folder:', currentFolderId);
      if (!user) {
        console.log('FileList: No user, returning empty data');
        return { folders: [], files: [] };
      }
      if (currentFolderId) {
        console.log('FileList: Fetching folder children for:', currentFolderId);
        const { data } = await api.client.get(`/folders/${currentFolderId}/children`);
        console.log('FileList: Folder children data:', data);
        return { folders: data.folders, files: data.files };
      }
      // Root folder - get root folders and files
      console.log('FileList: Fetching root folder data');
      const [foldersRes, filesRes] = await Promise.all([
        api.client.get('/folders'),
        api.client.get('/files')
      ]);
      console.log('FileList: Root data - folders:', foldersRes.data.results, 'files:', filesRes.data.results);
      return { 
        folders: foldersRes.data.results, 
        files: filesRes.data.results.filter((f: any) => !f.folderId) 
      };
    },
  });

  // Expose refetch function to parent component
  React.useEffect(() => {
    if (onUploadComplete) {
      onUploadComplete(refetch);
    }
  }, [onUploadComplete, refetch]);

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Loading files...</p>
      </div>
    );
  }

  if (error) {
    console.error('FileList error:', error);
    return (
      <div className="text-center py-8">
        <p className="text-red-500">Error loading files: {error.message}</p>
      </div>
    );
  }

  console.log('FileList: Rendering with data:', folderContents);

  return (
    <>
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {folderContents?.folders?.map((f: any) => (
          <div 
            key={f.id} 
            className="border rounded p-3 bg-white hover:bg-gray-50 cursor-pointer"
            onClick={() => onFolderClick?.(f.id)}
          >
            <div className="font-medium truncate" title={f.name}>{f.name}</div>
            <div className="text-xs text-gray-500">📁 Folder</div>
          </div>
        ))}
            {folderContents?.files?.map((f: any) => (
              <div 
                key={f.id} 
                className="border rounded p-3 bg-white hover:bg-gray-50 group cursor-pointer" 
                onDoubleClick={() => setPreviewFile(f)}
                title="Double-click to preview"
              >
                <div className="font-medium truncate" title={f.name}>{f.name}</div>
                <div className="text-xs text-gray-500">
                  {f.mimeType?.startsWith('image/') ? '🖼️' : 
                   f.mimeType?.startsWith('video/') ? '🎥' :
                   f.mimeType?.startsWith('audio/') ? '🎵' :
                   f.mimeType?.includes('pdf') ? '📄' :
                   f.mimeType?.includes('text') ? '📝' : '📄'} 
                  {f.mimeType}
                </div>
                <div className="text-xs text-gray-400">
                  {f.size ? `${Math.round(Number(f.size) / 1024)} KB` : ''}
                </div>
                <div className="mt-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      try {
                        console.log('Downloading file:', f.id);
                        const { data } = await api.client.get(`/files/${f.id}/download`);
                        console.log('Download URL:', data.downloadUrl);
                        
                        // Create a temporary link and trigger download
                        const link = document.createElement('a');
                        link.href = data.downloadUrl;
                        link.download = f.name;
                        link.style.display = 'none';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      } catch (error) {
                        console.error('Download failed:', error);
                        alert('Download failed: ' + ((error as any)?.response?.data?.error?.message || (error as any)?.message || 'Unknown error'));
                      }
                    }}
                    className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Download
                  </button>
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (confirm('Delete this file?')) {
                        try {
                          await api.client.delete(`/files/${f.id}`);
                          refetch();
                        } catch (error) {
                          console.error('Delete failed:', error);
                          alert('Delete failed');
                        }
                      }
                    }}
                    className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
      </div>
      {folderContents?.folders?.length === 0 && folderContents?.files?.length === 0 && (
        <div className="text-center text-gray-500 py-8">
          <p>No files or folders yet</p>
          <p className="text-sm">Drag and drop files above to upload</p>
        </div>
      )}
      </div>
      
      {/* File Preview Modal */}
      {previewFile && (
        <FilePreview
          file={previewFile}
          onClose={() => setPreviewFile(null)}
        />
      )}
    </>
  );
}