"use client";
import React, { useState, useEffect } from 'react';
import { api } from '../lib/http';
import PDFViewer from './PDFViewer';
import TextViewer from './TextViewer';

interface FilePreviewProps {
  file: {
    id: string;
    name: string;
    mimeType: string;
    size: string;
  };
  onClose: () => void;
}

export default function FilePreview({ file, onClose }: FilePreviewProps) {
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-load preview URL when component mounts
  useEffect(() => {
    getPreviewUrl();
  }, [file.id]);

  const getPreviewUrl = async () => {
    if (downloadUrl) return downloadUrl;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('Getting preview URL for file:', file.id);
      const { data } = await api.client.get(`/files/${file.id}/preview`);
      console.log('Preview URL received:', data.previewUrl);
      setDownloadUrl(data.previewUrl);
      return data.previewUrl;
    } catch (err: any) {
      const errorMsg = err?.response?.data?.error?.message || err?.message || 'Failed to get preview URL';
      setError(errorMsg);
      console.error('Preview error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getDownloadUrl = async () => {
    try {
      console.log('Getting download URL for file:', file.id);
      const { data } = await api.client.get(`/files/${file.id}/download`);
      console.log('Download URL received:', data.downloadUrl);
      return data.downloadUrl;
    } catch (err: any) {
      console.error('Download error:', err);
      // Fallback to stream endpoint
      return `/api/files/${file.id}/stream`;
    }
  };

  const handleDownload = async () => {
    const url = await getDownloadUrl();
    if (url) {
      const link = document.createElement('a');
      link.href = url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handlePreview = async () => {
    const url = await getDownloadUrl();
    if (url) {
      window.open(url, '_blank');
    }
  };

  const formatFileSize = (bytes: string) => {
    const size = parseInt(bytes);
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType.startsWith('video/')) return '🎥';
    if (mimeType.startsWith('audio/')) return '🎵';
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('text')) return '📝';
    if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊';
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return '📈';
    if (mimeType.includes('zip') || mimeType.includes('archive')) return '🗜️';
    return '📄';
  };

  const canPreview = (mimeType: string) => {
    return (
      mimeType.startsWith('image/') ||
      mimeType.startsWith('video/') ||
      mimeType.startsWith('audio/') ||
      mimeType.includes('pdf') ||
      mimeType.includes('text')
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{getFileIcon(file.mimeType)}</span>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 truncate" title={file.name}>
                {file.name}
              </h3>
              <p className="text-sm text-gray-500">
                {file.mimeType} • {formatFileSize(file.size)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* File Preview Area */}
          <div className="mb-6" style={{ minHeight: '400px' }}>
            {file.mimeType.startsWith('image/') && downloadUrl ? (
              <div className="text-center">
                <img
                  src={downloadUrl}
                  alt={file.name}
                  className="max-w-full max-h-96 mx-auto rounded-lg shadow-sm"
                  onError={() => setError('Failed to load image preview')}
                />
              </div>
            ) : file.mimeType.startsWith('video/') && downloadUrl ? (
              <div className="text-center">
                <video
                  src={downloadUrl}
                  controls
                  className="max-w-full max-h-96 mx-auto rounded-lg shadow-sm"
                  onError={() => setError('Failed to load video preview')}
                >
                  Your browser does not support video playback.
                </video>
              </div>
            ) : file.mimeType.startsWith('audio/') && downloadUrl ? (
              <div className="text-center">
                <audio
                  src={downloadUrl}
                  controls
                  className="w-full max-w-md mx-auto"
                  onError={() => setError('Failed to load audio preview')}
                >
                  Your browser does not support audio playback.
                </audio>
              </div>
            ) : file.mimeType.includes('pdf') && downloadUrl ? (
              <div className="border rounded-lg overflow-hidden" style={{ height: '500px' }}>
                <PDFViewer url={downloadUrl} fileName={file.name} />
              </div>
            ) : file.mimeType.includes('text') && downloadUrl ? (
              <div className="border rounded-lg overflow-hidden" style={{ height: '500px' }}>
                <TextViewer url={downloadUrl} fileName={file.name} />
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">{getFileIcon(file.mimeType)}</div>
                <p className="text-gray-600 mb-2">Preview not available for this file type</p>
                <p className="text-sm text-gray-500">
                  {file.mimeType} • {formatFileSize(file.size)}
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 justify-center">
            {canPreview(file.mimeType) && (
              <button
                onClick={handlePreview}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Loading...' : 'Preview'}
              </button>
            )}
            
            <button
              onClick={handleDownload}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Loading...' : 'Download'}
            </button>
          </div>

          {/* File Details */}
          <div className="mt-6 pt-4 border-t">
            <h4 className="text-sm font-medium text-gray-900 mb-2">File Details</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Name:</span>
                <p className="font-medium">{file.name}</p>
              </div>
              <div>
                <span className="text-gray-500">Size:</span>
                <p className="font-medium">{formatFileSize(file.size)}</p>
              </div>
              <div>
                <span className="text-gray-500">Type:</span>
                <p className="font-medium">{file.mimeType}</p>
              </div>
              <div>
                <span className="text-gray-500">ID:</span>
                <p className="font-medium font-mono text-xs">{file.id}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
