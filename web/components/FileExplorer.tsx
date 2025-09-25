"use client";
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/http';
import { useAuth } from '../lib/auth';

export default function FileExplorer({ currentFolderId, onFolderClick }: { 
  currentFolderId?: string; 
  onFolderClick?: (folderId: string) => void;
}) {
  const { user } = useAuth();
  
  const { data: folderContents, refetch } = useQuery({
    queryKey: ['folderContents', currentFolderId, user?.id],
    queryFn: async () => {
      if (!user) return { folders: [], files: [] };
      if (currentFolderId) {
        const { data } = await api.client.get(`/folders/${currentFolderId}/children`);
        return { folders: data.folders, files: data.files };
      }
      // Root folder - get root folders and files
      const [foldersRes, filesRes] = await Promise.all([
        api.client.get('/folders'),
        api.client.get('/files')
      ]);
      return { 
        folders: foldersRes.data.results, 
        files: filesRes.data.results.filter((f: any) => !f.folderId) 
      };
    },
  });

  return (
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
          <div key={f.id} className="border rounded p-3 bg-white hover:bg-gray-50">
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
  );
}


