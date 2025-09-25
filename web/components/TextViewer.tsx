"use client";
import React, { useState, useEffect } from 'react';

interface TextViewerProps {
  url: string;
  fileName: string;
}

export default function TextViewer({ url, fileName }: TextViewerProps) {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('Failed to fetch file content');
        }
        
        const text = await response.text();
        setContent(text);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load file');
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [url]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Loading text file...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-4xl mb-2">📝</div>
          <p className="text-gray-600 mb-2">Failed to load text file</p>
          <p className="text-sm text-red-600">{error}</p>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline mt-2 inline-block"
          >
            Open in new tab
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <div className="bg-gray-50 px-4 py-2 border-b flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-700">{fileName}</h4>
        <span className="text-xs text-gray-500">{content.length} characters</span>
      </div>
      <div className="p-4 h-full overflow-auto">
        <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono leading-relaxed">
          {content}
        </pre>
      </div>
    </div>
  );
}
