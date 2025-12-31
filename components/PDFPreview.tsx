'use client';

import { useEffect, useState } from 'react';
import { getInvoicePDFUrl } from '@/lib/storage';

interface PDFPreviewProps {
  pdfPath: string;
  onClose: () => void;
}

export default function PDFPreview({ pdfPath, onClose }: PDFPreviewProps) {
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadPDF() {
      try {
        setLoading(true);
        setError('');
        const url = await getInvoicePDFUrl(pdfPath);
        setPdfUrl(url);
      } catch (err: any) {
        console.error('PDF preview error:', err);
        const errorMessage = err.message || 'PDF yüklenirken bir hata oluştu';
        setError(errorMessage);
        
        // If authentication error, suggest reloading
        if (errorMessage.includes('kimlik doğrulaması') || errorMessage.includes('giriş')) {
          setTimeout(() => {
            if (window.confirm('Kimlik doğrulama hatası. Sayfayı yenilemek ister misiniz?')) {
              window.location.reload();
            }
          }, 2000);
        }
      } finally {
        setLoading(false);
      }
    }
    loadPDF();
  }, [pdfPath]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-semibold">PDF Önizleme</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>
        <div className="flex-1 overflow-auto p-4">
          {loading && (
            <div className="flex items-center justify-center h-64">
              <div className="text-gray-500">Yükleniyor...</div>
            </div>
          )}
          {error && (
            <div className="flex items-center justify-center h-64">
              <div className="text-red-500">{error}</div>
            </div>
          )}
          {pdfUrl && !loading && (
            <iframe src={pdfUrl} className="w-full h-full min-h-[600px] border-0" />
          )}
        </div>
        {pdfUrl && (
          <div className="p-4 border-t flex justify-end">
            <a
              href={pdfUrl}
              download
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              İndir
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
