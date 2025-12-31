'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getShareLink } from '@/lib/shareLink';
import { getInvoice } from '@/lib/firestore';
import { getInvoicePDFUrl } from '@/lib/storage';
import PDFPreview from '@/components/PDFPreview';
import { Invoice } from '@/types';

export default function SharePage() {
  const params = useParams();
  const token = params.token as string;
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    async function loadShareLink() {
      try {
        const shareData = await getShareLink(token);
        if (!shareData) {
          setError('Paylaşım linki geçersiz veya süresi dolmuş.');
          setLoading(false);
          return;
        }

        const invoiceData = await getInvoice(shareData.invoiceId);
        if (!invoiceData) {
          setError('Fatura bulunamadı.');
          setLoading(false);
          return;
        }

        setInvoice(invoiceData);
      } catch (err) {
        console.error('Error loading share link:', err);
        setError('Bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    }

    if (token) {
      loadShareLink();
    }
  }, [token]);

  async function handleDownload() {
    if (!invoice) return;
    try {
      const url = await getInvoicePDFUrl(invoice.pdfPath);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fatura-${invoice.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('PDF indirilirken bir hata oluştu');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">Yükleniyor...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white shadow rounded-lg p-8 max-w-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Hata</h1>
          <p className="text-gray-700">{error}</p>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Fatura Görüntüleme</h1>
          
          <div className="space-y-4 mb-6">
            <div>
              <dt className="text-sm font-medium text-gray-500">Fatura ID</dt>
              <dd className="mt-1 text-sm text-gray-900">{invoice.id}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Fatura Tarihi</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {new Date(invoice.invoiceDate).toLocaleDateString('tr-TR')}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Tutar</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {invoice.amount.toLocaleString('tr-TR', {
                  style: 'currency',
                  currency: 'TRY',
                })}
              </dd>
            </div>
          </div>

          <div className="flex space-x-4">
            <button
              onClick={() => setShowPreview(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              PDF Önizle
            </button>
            <button
              onClick={handleDownload}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
            >
              PDF İndir
            </button>
          </div>
        </div>
      </div>

      {showPreview && invoice && (
        <PDFPreview pdfPath={invoice.pdfPath} onClose={() => setShowPreview(false)} />
      )}
    </div>
  );
}
