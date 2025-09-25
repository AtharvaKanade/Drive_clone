"use client";
import React, { useState } from 'react';

interface PDFViewerProps {
  url: string;
  fileName: string;
}

export default function PDFViewer({ url, fileName }: PDFViewerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  return (
    <div className="w-full h-full">
      {loading && (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-600">Loading PDF...</p>
          </div>
        </div>
      )}
      
      {error ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-4xl mb-2">📄</div>
            <p className="text-gray-600 mb-2">PDF preview not available</p>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline"
            >
              Open PDF in new tab
            </a>
          </div>
        </div>
      ) : (
        <iframe
          src={url}
          className="w-full h-full border-0"
          title={fileName}
          onLoad={() => setLoading(false)}
          onError={() => {
            setLoading(false);
            setError(true);
          }}
        />
      )}
    </div>
  );
}
