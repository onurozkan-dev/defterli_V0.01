'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getInvoices, getClients, deleteInvoice } from '@/lib/firestore';
import { Invoice, Client } from '@/types';
import PDFPreview from '@/components/PDFPreview';
import { getInvoicePDFUrl } from '@/lib/storage';
import { createShareLink } from '@/lib/shareLink';

export default function InvoicesPage() {
  const { userData } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [shareLink, setShareLink] = useState<{ invoiceId: string; link: string } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [userData]);

  async function loadData() {
    if (!userData) return;
    try {
      const [invoicesData, clientsData] = await Promise.all([
        getInvoices(userData.uid),
        getClients(userData.uid),
      ]);
      setInvoices(invoicesData);
      setClients(clientsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch() {
    if (!userData) return;
    setLoading(true);
    try {
      const filtered = await getInvoices(userData.uid, {
        searchQuery: searchQuery || undefined,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
      });
      setInvoices(filtered);
    } catch (error) {
      console.error('Error searching invoices:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateShareLink(invoiceId: string) {
    try {
      const token = await createShareLink(invoiceId);
      const link = `${window.location.origin}/share/${token}`;
      setShareLink({ invoiceId, link });
    } catch (error) {
      console.error('Error creating share link:', error);
      alert('Paylaşım linki oluşturulurken bir hata oluştu');
    }
  }

  function getClientName(clientId: string): string {
    const client = clients.find((c) => c.id === clientId);
    return client?.name || 'Bilinmeyen Müşteri';
  }

  async function handleDownload(invoice: Invoice) {
    try {
      const url = await getInvoicePDFUrl(invoice.pdfPath);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fatura-${invoice.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error: any) {
      console.error('Error downloading PDF:', error);
      const errorMessage = error.message || 'PDF indirilirken bir hata oluştu';
      alert(errorMessage);
      
      // If authentication error, suggest reloading
      if (errorMessage.includes('kimlik doğrulaması') || errorMessage.includes('giriş')) {
        if (window.confirm('Kimlik doğrulama hatası. Sayfayı yenilemek ister misiniz?')) {
          window.location.reload();
        }
      }
    }
  }

  async function handleDelete(invoiceId: string) {
    if (!userData) {
      alert('Lütfen giriş yapın veya demo modunda devam edin');
      return;
    }

    const confirmed = window.confirm(
      'Bu faturayı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.'
    );
    if (!confirmed) return;

    setDeletingId(invoiceId);
    try {
      await deleteInvoice(invoiceId, userData.uid);
      // Remove from local state
      setInvoices((prev) => prev.filter((invoice) => invoice.id !== invoiceId));
      
      // If previewing the deleted invoice, close preview
      if (previewInvoice?.id === invoiceId) {
        setPreviewInvoice(null);
      }
    } catch (error: any) {
      console.error('Error deleting invoice:', error);
      const errorMessage = error.message || 'Fatura silinirken bir hata oluştu. Lütfen tekrar deneyin.';
      alert(errorMessage);
      
      // If permission error, suggest reloading
      if (errorMessage.includes('yetkiniz yok') || errorMessage.includes('giriş')) {
        if (window.confirm('Yetki hatası. Sayfayı yenilemek ister misiniz?')) {
          window.location.reload();
        }
      }
    } finally {
      setDeletingId(null);
    }
  }

  if (loading && invoices.length === 0) {
    return <div className="text-center py-12">Yükleniyor...</div>;
  }

  return (
    <div className="px-4 sm:px-0">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Faturalar</h1>
      </div>

      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Arama (Müşteri, ID)
            </label>
            <input
              type="text"
              id="search"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
              Başlangıç Tarihi
            </label>
            <input
              type="date"
              id="startDate"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
              Bitiş Tarihi
            </label>
            <input
              type="date"
              id="endDate"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleSearch}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Filtrele
            </button>
          </div>
        </div>
      </div>

      {shareLink && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-green-800">Paylaşım linki oluşturuldu:</p>
              <input
                type="text"
                readOnly
                value={shareLink.link}
                className="mt-2 w-full px-3 py-2 bg-white border border-green-300 rounded text-sm"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <p className="text-xs text-green-600 mt-1">Link 24 saat geçerlidir</p>
            </div>
            <button
              onClick={() => setShareLink(null)}
              className="text-green-600 hover:text-green-800 ml-4"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {invoices.length === 0 ? (
            <li className="px-6 py-8 text-center text-gray-500">
              Fatura bulunamadı. Fatura yüklemek için{' '}
              <a href="/app/upload" className="text-blue-600 hover:underline">
                Yükle
              </a>{' '}
              sayfasını ziyaret edin.
            </li>
          ) : (
            invoices.map((invoice) => (
              <li key={invoice.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900">
                      {getClientName(invoice.clientId)}
                    </h3>
                    <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-500">
                      <div>
                        <span className="font-medium">Fatura ID:</span> {invoice.id}
                      </div>
                      <div>
                        <span className="font-medium">Tarih:</span>{' '}
                        {new Date(invoice.invoiceDate).toLocaleDateString('tr-TR')}
                      </div>
                      <div>
                        <span className="font-medium">Tutar:</span>{' '}
                        {invoice.amount.toLocaleString('tr-TR', {
                          style: 'currency',
                          currency: 'TRY',
                        })}
                      </div>
                      <div>
                        <span className="font-medium">Oluşturulma:</span>{' '}
                        {new Date(invoice.createdAt).toLocaleDateString('tr-TR')}
                      </div>
                    </div>
                  </div>
                  <div className="ml-4 flex space-x-2">
                    <button
                      onClick={() => setPreviewInvoice(invoice)}
                      className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                    >
                      Önizle
                    </button>
                    <button
                      onClick={() => handleDownload(invoice)}
                      className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                    >
                      İndir
                    </button>
                    <button
                      onClick={() => handleCreateShareLink(invoice.id)}
                      className="bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700"
                    >
                      Paylaş
                    </button>
                    <button
                      onClick={() => handleDelete(invoice.id)}
                      disabled={deletingId === invoice.id}
                      className="bg-red-50 text-red-700 px-3 py-1 rounded text-sm border border-red-200 hover:bg-red-100 disabled:opacity-50"
                    >
                      {deletingId === invoice.id ? 'Siliniyor...' : 'Sil'}
                    </button>
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>

      {previewInvoice && (
        <PDFPreview
          pdfPath={previewInvoice.pdfPath}
          onClose={() => setPreviewInvoice(null)}
        />
      )}
    </div>
  );
}
