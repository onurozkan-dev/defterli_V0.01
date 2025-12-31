import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { User, Client, Invoice } from '@/types';
import {
  getDemoClients,
  saveDemoClient,
  getDemoInvoices,
  saveDemoInvoice,
  updateDemoInvoice,
  deleteDemoClient,
  deleteDemoInvoicesByClient,
} from './demoStorage';

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
const DEMO_STORAGE_KEY_INVOICES = 'defterli_demo_invoices';

// Users
export async function createUser(uid: string, userData: Partial<User>): Promise<void> {
  if (!db) {
    return;
  }
  try {
    const userRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const updateData: any = {
        ...userData,
        role: 'accountant',
      };
      if (userData.trialExpiresAt instanceof Date) {
        updateData.trialExpiresAt = Timestamp.fromDate(userData.trialExpiresAt);
      }
      await updateDoc(userRef, updateData);
    } else {
      const setData: any = {
        ...userData,
        role: 'accountant',
        createdAt: Timestamp.now(),
      };
      if (userData.trialExpiresAt instanceof Date) {
        setData.trialExpiresAt = Timestamp.fromDate(userData.trialExpiresAt);
      }
      await setDoc(userRef, setData);
    }
  } catch (error) {
    console.error('Error creating/updating user:', error);
    throw error;
  }
}

export async function getUser(uid: string): Promise<User | null> {
  if (!db) {
    return null;
  }
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (!userDoc.exists()) return null;
    const data = userDoc.data();
    return { 
      uid, 
      ...data,
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
      trialExpiresAt: data.trialExpiresAt?.toDate ? data.trialExpiresAt.toDate() : data.trialExpiresAt,
    } as User;
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
}

// Clients
export async function createClient(clientData: Omit<Client, 'id' | 'createdAt'>): Promise<string> {
  if (DEMO_MODE || !db) {
    const clientId = 'demo-client-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
    const client: Client = {
      id: clientId,
      ...clientData,
      createdAt: new Date(),
    };
    saveDemoClient(client);
    return clientId;
  }
  try {
    const docRef = await addDoc(collection(db, 'clients'), {
      ...clientData,
      createdAt: Timestamp.now(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating client:', error);
    throw error;
  }
}

export async function getClient(clientId: string): Promise<Client | null> {
  if (DEMO_MODE || !db) {
    return null;
  }
  try {
    const clientDoc = await getDoc(doc(db, 'clients', clientId));
    if (!clientDoc.exists()) return null;
    const data = clientDoc.data();
    return {
      id: clientDoc.id,
      ...data,
      createdAt: (data.createdAt as Timestamp).toDate(),
    } as Client;
  } catch (error) {
    console.error('Error getting client:', error);
    return null;
  }
}

export async function getClients(uid: string): Promise<Client[]> {
  if (DEMO_MODE || !db) {
    const clients = getDemoClients(uid);
    return clients.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  try {
    const q = query(
      collection(db, 'clients'),
      where('uid', '==', uid),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: (data.createdAt as Timestamp).toDate(),
      } as Client;
    });
  } catch (error) {
    console.error('Error getting clients:', error);
    return [];
  }
}

// Invoices
export async function createInvoice(invoiceData: Omit<Invoice, 'id' | 'createdAt'>): Promise<string> {
  if (DEMO_MODE || !db) {
    const invoiceId = 'demo-invoice-' + Date.now();
    const invoice: Invoice = {
      id: invoiceId,
      ...invoiceData,
      createdAt: new Date(),
    };
    saveDemoInvoice(invoice);
    return invoiceId;
  }
  try {
    const docRef = await addDoc(collection(db, 'invoices'), {
      ...invoiceData,
      invoiceDate: Timestamp.fromDate(invoiceData.invoiceDate),
      createdAt: Timestamp.now(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating invoice:', error);
    throw error;
  }
}

export async function getInvoice(invoiceId: string): Promise<Invoice | null> {
  if (DEMO_MODE || !db) {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('defterli_demo_invoices') : null;
    if (!stored) return null;
    try {
      const allInvoices: Invoice[] = JSON.parse(stored);
      const invoice = allInvoices.find((inv) => inv.id === invoiceId);
      if (!invoice) return null;
      return {
        ...invoice,
        invoiceDate: new Date(invoice.invoiceDate),
        createdAt: new Date(invoice.createdAt),
      };
    } catch (error) {
      console.error('Error reading demo invoice:', error);
      return null;
    }
  }
  try {
    const invoiceDoc = await getDoc(doc(db, 'invoices', invoiceId));
    if (!invoiceDoc.exists()) return null;
    const data = invoiceDoc.data();
    return {
      id: invoiceDoc.id,
      ...data,
      invoiceDate: (data.invoiceDate as Timestamp).toDate(),
      createdAt: (data.createdAt as Timestamp).toDate(),
    } as Invoice;
  } catch (error) {
    console.error('Error getting invoice:', error);
    return null;
  }
}

export async function getInvoices(
  uid: string,
  filters?: {
    clientId?: string;
    startDate?: Date;
    endDate?: Date;
    searchQuery?: string;
  }
): Promise<Invoice[]> {
  if (DEMO_MODE || !db) {
    let invoices = getDemoInvoices(uid);
    invoices = invoices.sort((a, b) => b.invoiceDate.getTime() - a.invoiceDate.getTime());
    if (filters?.clientId) {
      invoices = invoices.filter((inv) => inv.clientId === filters.clientId);
    }
    if (filters?.startDate) {
      invoices = invoices.filter((inv) => inv.invoiceDate >= filters.startDate!);
    }
    if (filters?.endDate) {
      invoices = invoices.filter((inv) => inv.invoiceDate <= filters.endDate!);
    }
    if (filters?.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      const clients = await getClients(uid);
      const clientMap = new Map(clients.map((c) => [c.id, c]));
      invoices = invoices.filter((inv) => {
        const client = clientMap.get(inv.clientId);
        return (
          inv.id.toLowerCase().includes(query) ||
          client?.name.toLowerCase().includes(query) ||
          client?.taxId.toLowerCase().includes(query)
        );
      });
    }

    return invoices;
  }
  try {
    let q = query(
      collection(db, 'invoices'),
      where('uid', '==', uid),
      orderBy('invoiceDate', 'desc')
    );

    if (filters?.clientId) {
      q = query(q, where('clientId', '==', filters.clientId));
    }

    const querySnapshot = await getDocs(q);
    let invoices = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        invoiceDate: (data.invoiceDate as Timestamp).toDate(),
        createdAt: (data.createdAt as Timestamp).toDate(),
      } as Invoice;
    });

    if (filters?.startDate) {
      invoices = invoices.filter((inv) => inv.invoiceDate >= filters.startDate!);
    }
    if (filters?.endDate) {
      invoices = invoices.filter((inv) => inv.invoiceDate <= filters.endDate!);
    }
    if (filters?.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      const clients = await getClients(uid);
      const clientMap = new Map(clients.map((c) => [c.id, c]));
      invoices = invoices.filter((inv) => {
        const client = clientMap.get(inv.clientId);
        return (
          inv.id.toLowerCase().includes(query) ||
          client?.name.toLowerCase().includes(query) ||
          client?.taxId.toLowerCase().includes(query)
        );
      });
    }

    return invoices;
  } catch (error) {
    console.error('Error getting invoices:', error);
    return [];
  }
}

export async function updateInvoice(invoiceId: string, updates: Partial<Invoice>): Promise<void> {
  if (DEMO_MODE || !db) {
    updateDemoInvoice(invoiceId, updates);
    return;
  }
  try {
    const invoiceRef = doc(db, 'invoices', invoiceId);
    const updateData: any = { ...updates };
    if (updates.invoiceDate) {
      updateData.invoiceDate = Timestamp.fromDate(updates.invoiceDate);
    }
    delete updateData.id;
    delete updateData.createdAt;
    await updateDoc(invoiceRef, updateData);
  } catch (error) {
    console.error('Error updating invoice:', error);
    throw error;
  }
}

export async function deleteInvoice(invoiceId: string, uid: string): Promise<void> {
  if (DEMO_MODE || !db) {
    if (typeof window === 'undefined') {
      throw new Error('localStorage sadece tarayıcıda kullanılabilir');
    }
    
    try {
      const stored = localStorage.getItem(DEMO_STORAGE_KEY_INVOICES);
      if (!stored) {
        console.warn('No invoices found in localStorage');
        return;
      }
      
      const invoices: Invoice[] = JSON.parse(stored);
      const filtered = invoices.filter((inv) => !(inv.id === invoiceId && inv.uid === uid));
      
      if (filtered.length === invoices.length) {
        console.warn(`Invoice ${invoiceId} not found in localStorage`);
        return;
      }
      
      localStorage.setItem(DEMO_STORAGE_KEY_INVOICES, JSON.stringify(filtered));
      
      const storageKey = `defterli_demo_pdf_${invoiceId}`;
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.error('Error deleting invoice from localStorage:', error);
      throw error;
    }
    return;
  }

  try {
    const invoiceRef = doc(db, 'invoices', invoiceId);
    const invoiceSnapshot = await getDoc(invoiceRef);

    if (!invoiceSnapshot.exists()) {
      throw new Error('Fatura bulunamadı');
    }

    const invoiceData = invoiceSnapshot.data();
    if (invoiceData.uid !== uid) {
      throw new Error('Bu faturayı silme yetkiniz yok');
    }

    if (invoiceData.pdfPath) {
      const { deleteInvoicePDF } = await import('./storage');
      try {
        await deleteInvoicePDF(invoiceData.pdfPath);
      } catch (error: any) {
        console.error('Error deleting PDF from storage:', error);
        if (error.code !== 'storage/object-not-found') {
          console.warn('PDF deletion failed but continuing with invoice deletion');
        }
      }
    }

    await deleteDoc(invoiceRef);
  } catch (error: any) {
    console.error('Error deleting invoice:', error);
    
    if (error.code === 'permission-denied') {
      throw new Error('Bu faturayı silme yetkiniz yok. Lütfen tekrar giriş yapın.');
    } else if (error.message) {
      throw error;
    } else {
      throw new Error('Fatura silinirken bir hata oluştu');
    }
  }
}

export async function deleteClient(clientId: string, uid: string): Promise<void> {
  if (DEMO_MODE || !db) {
    deleteDemoClient(clientId, uid);
    deleteDemoInvoicesByClient(uid, clientId);
    return;
  }

  try {
    const clientRef = doc(db, 'clients', clientId);
    const clientSnapshot = await getDoc(clientRef);

    if (!clientSnapshot.exists()) {
      throw new Error('Müşteri bulunamadı');
    }

    const clientData = clientSnapshot.data();
    if (clientData.uid !== uid) {
      throw new Error('Bu müşteriyi silme yetkiniz yok');
    }

    const invoicesQuery = query(
      collection(db, 'invoices'),
      where('uid', '==', uid),
      where('clientId', '==', clientId)
    );
    const invoicesSnapshot = await getDocs(invoicesQuery);
    await Promise.all(invoicesSnapshot.docs.map((invDoc) => deleteDoc(invDoc.ref)));

    await deleteDoc(clientRef);
  } catch (error) {
    console.error('Error deleting client:', error);
    throw error;
  }
}
