"use client";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import DragDropZone from '../../components/DragDropZone';
import FileList from '../../components/FileList';
import { AuthProvider, useAuth } from '../../lib/auth';
import { api } from '../../lib/http';
import Link from 'next/link';

const qc = new QueryClient();

function Content() {
  const { user, logout } = useAuth();
  
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
          <div className="mb-4">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Required</h2>
          <p className="text-gray-600 mb-6">Please log in to access your file dashboard.</p>
          <Link 
            href="/login" 
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-2">
                <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
                <span className="text-xl font-bold text-gray-900">CloudDrive</span>
              </Link>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link 
                href="/" 
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Go Home
              </Link>
              
              <div className="flex items-center space-x-3">
                <div className="text-sm text-gray-600">
                  Welcome, <span className="font-medium text-gray-900">{user.email}</span>
                </div>
                <button 
                  onClick={logout}
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Page Header */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">File Dashboard</h1>
            <p className="mt-2 text-lg text-gray-600">
              Upload, manage, and organize your files securely in the cloud.
            </p>
          </div>

           {/* Upload Section */}
           <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
             <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload Files</h2>
             <DragDropZone onUploadComplete={() => window.location.reload()} />
           </div>

           {/* File Management Section */}
           <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
             <div className="flex justify-between items-center mb-4">
               <h2 className="text-xl font-semibold text-gray-900">Your Files</h2>
               <button 
                 onClick={async () => {
                   const name = prompt('Folder name:');
                   if (name) {
                     try {
                       const { data } = await api.client.post('/folders', { name });
                       console.log('Created folder:', data.folder);
                       // Refresh the file list
                       window.location.reload();
                     } catch (error) {
                       console.error('Failed to create folder:', error);
                       alert('Failed to create folder');
                     }
                   }
                 }}
                 className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
               >
                 + New Folder
               </button>
             </div>
             <FileList />
           </div>
        </div>
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <AuthProvider>
      <QueryClientProvider client={qc}>
        <Content />
      </QueryClientProvider>
    </AuthProvider>
  );
}