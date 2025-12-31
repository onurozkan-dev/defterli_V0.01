'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getClients, createClient, deleteClient } from '@/lib/firestore';
import { Client } from '@/types';

export default function ClientsPage() {
  const { userData } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', taxId: '' });
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadClients();
  }, [userData]);

  async function loadClients() {
    if (!userData) {
      setLoading(false);
      return;
    }
    try {
      const data = await getClients(userData.uid);
      setClients(data || []);
    } catch (error) {
      console.error('Error loading clients:', error);
      setClients([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!userData) {
      alert('Lütfen giriş yapın veya demo modunda devam edin');
      return;
    }
    
    if (!formData.name.trim() || !formData.taxId.trim()) {
      alert('Lütfen tüm alanları doldurun');
      return;
    }
    
    setSubmitting(true);
    try {
      console.log('Creating client with data:', {
        uid: userData.uid,
        name: formData.name.trim(),
        taxId: formData.taxId.trim(),
      });
      
      const clientId = await createClient({
        uid: userData.uid,
        name: formData.name.trim(),
        taxId: formData.taxId.trim(),
      });
      
      console.log('Client created with ID:', clientId);
      
      if (!clientId) {
        throw new Error('Müşteri ID oluşturulamadı');
      }
      
      // Clear form and hide it
      setFormData({ name: '', taxId: '' });
      setShowForm(false);
      
      // Reload clients immediately
      await loadClients();
      
      console.log('Clients reloaded');
    } catch (error: any) {
      console.error('Error creating client:', error);
      alert(error.message || 'Müşteri oluşturulurken bir hata oluştu. Lütfen konsolu kontrol edin.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(clientId: string) {
    if (!userData) {
      alert('Lütfen giriş yapın veya demo modunda devam edin');
      return;
    }

    const confirmed = window.confirm(
      'Bu müşteriyi ve müşteriye ait faturaları silmek istediğinize emin misiniz?'
    );
    if (!confirmed) return;

    setDeletingId(clientId);
    try {
      await deleteClient(clientId, userData.uid);
      setClients((prev) => prev.filter((client) => client.id !== clientId));
    } catch (error) {
      console.error('Error deleting client:', error);
      alert('Müşteri silinirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return <div className="text-center py-12">Yükleniyor...</div>;
  }

  return (
    <div className="px-4 sm:px-0">
      <div className="mb-8 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Müşteriler</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          {showForm ? 'İptal' : '+ Yeni Müşteri'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Yeni Müşteri Ekle</h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Müşteri Adı
                </label>
                <input
                  type="text"
                  id="name"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label htmlFor="taxId" className="block text-sm font-medium text-gray-700 mb-1">
                  Vergi No / TCKN
                </label>
                <input
                  type="text"
                  id="taxId"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={formData.taxId}
                  onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                />
              </div>
            </div>
            <div className="mt-4">
              <button
                type="submit"
                disabled={submitting}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {clients.length === 0 ? (
            <li className="px-6 py-8 text-center text-gray-500">
              Henüz müşteri eklenmemiş. Yeni müşteri eklemek için yukarıdaki butonu kullanın.
            </li>
          ) : (
            clients.map((client) => (
              <li key={client.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{client.name}</h3>
                    <p className="text-sm text-gray-500">Vergi No: {client.taxId}</p>
                    <p className="text-xs text-gray-400">
                      Oluşturulma: {new Date(client.createdAt).toLocaleDateString('tr-TR')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDelete(client.id)}
                      disabled={deletingId === client.id}
                      className="bg-red-50 text-red-700 px-3 py-1 rounded-md text-sm border border-red-200 hover:bg-red-100 disabled:opacity-50"
                    >
                      {deletingId === client.id ? 'Siliniyor...' : 'Sil'}
                    </button>
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
