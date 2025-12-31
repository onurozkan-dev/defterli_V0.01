'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getClients } from '@/lib/firestore';
import { createInvoice, updateInvoice } from '@/lib/firestore';
import { uploadInvoicePDF } from '@/lib/storage';
import { Client } from '@/types';
import { useRouter } from 'next/navigation';

export default function UploadPage() {
  const { userData } = useAuth();
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    clientId: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    amount: '',
    file: null as File | null,
  });
  const [error, setError] = useState('');

  useEffect(() => {
    loadClients();
  }, [userData]);

  async function loadClients() {
    if (!userData) return;
    try {
      const data = await getClients(userData.uid);
      setClients(data);
    } catch (error) {
      console.error('Error loading clients:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!userData || !formData.file) {
      setError('Lütfen tüm alanları doldurun');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      // Create invoice document first to get ID
      const invoiceId = await createInvoice({
        uid: userData.uid,
        clientId: formData.clientId,
        invoiceDate: new Date(formData.invoiceDate),
        amount: parseFloat(formData.amount),
        pdfPath: '', // Will be updated after upload
      });

      // Upload PDF with the invoice ID
      const pdfPath = await uploadInvoicePDF(
        userData.uid,
        formData.clientId,
        invoiceId,
        formData.file
      );

      // Update invoice with the PDF path
      await updateInvoice(invoiceId, { pdfPath });

      router.push('/app/invoices');
    } catch (err: any) {
      console.error('Error uploading invoice:', err);
      setError(err.message || 'Fatura yüklenirken bir hata oluştu');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="text-center py-12">Yükleniyor...</div>;
  }

  if (clients.length === 0) {
    return (
      <div className="px-4 sm:px-0">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <p className="text-yellow-800">
            Fatura yüklemek için önce bir müşteri oluşturmanız gerekiyor.{' '}
            <a href="/app/clients" className="text-blue-600 hover:underline font-medium">
              Müşteriler sayfasına git
            </a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-0">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Fatura Yükle</h1>
      </div>

      <div className="bg-white shadow rounded-lg p-6 max-w-2xl">
        <form onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="clientId" className="block text-sm font-medium text-gray-700 mb-1">
                Müşteri *
              </label>
              <select
                id="clientId"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={formData.clientId}
                onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
              >
                <option value="">Müşteri seçin</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name} ({client.taxId})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="invoiceDate" className="block text-sm font-medium text-gray-700 mb-1">
                Fatura Tarihi *
              </label>
              <input
                type="date"
                id="invoiceDate"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={formData.invoiceDate}
                onChange={(e) => setFormData({ ...formData, invoiceDate: e.target.value })}
              />
            </div>

            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                Tutar *
              </label>
              <input
                type="number"
                id="amount"
                required
                step="0.01"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              />
            </div>

            <div>
              <label htmlFor="file" className="block text-sm font-medium text-gray-700 mb-1">
                PDF Dosyası *
              </label>
              <input
                type="file"
                id="file"
                required
                accept="application/pdf"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setFormData({ ...formData, file });
                  }
                }}
              />
              {formData.file && (
                <p className="mt-2 text-sm text-gray-500">Seçilen: {formData.file.name}</p>
              )}
            </div>
          </div>

          <div className="mt-6">
            <button
              type="submit"
              disabled={submitting}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? 'Yükleniyor...' : 'Yükle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
