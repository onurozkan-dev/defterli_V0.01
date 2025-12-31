import { Client, Invoice } from '@/types';

const DEMO_STORAGE_KEY_CLIENTS = 'defterli_demo_clients';
const DEMO_STORAGE_KEY_INVOICES = 'defterli_demo_invoices';

// Clients
export function getDemoClients(uid: string): Client[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(DEMO_STORAGE_KEY_CLIENTS);
    if (!stored) return [];
    const allClients: any[] = JSON.parse(stored);
    const filtered = allClients.filter((c) => c.uid === uid);
    return filtered.map((client) => ({
      ...client,
      createdAt: client.createdAt ? new Date(client.createdAt) : new Date(),
    }));
  } catch (error) {
    console.error('Error reading demo clients:', error);
    return [];
  }
}

export function saveDemoClient(client: Client): void {
  if (typeof window === 'undefined') return;
  try {
    const stored = localStorage.getItem(DEMO_STORAGE_KEY_CLIENTS);
    const clients: any[] = stored ? JSON.parse(stored) : [];
    
    const clientToSave = {
      ...client,
      createdAt: client.createdAt instanceof Date ? client.createdAt.toISOString() : client.createdAt,
    };
    
    const existingIndex = clients.findIndex((c) => c.id === client.id);
    if (existingIndex !== -1) {
      clients[existingIndex] = clientToSave;
    } else {
      clients.push(clientToSave);
    }
    
    localStorage.setItem(DEMO_STORAGE_KEY_CLIENTS, JSON.stringify(clients));
  } catch (error) {
    console.error('Error saving demo client:', error);
    throw error;
  }
}

// Invoices
export function getDemoInvoices(uid: string): Invoice[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(DEMO_STORAGE_KEY_INVOICES);
    if (!stored) return [];
    const allInvoices: Invoice[] = JSON.parse(stored);
    const invoices = allInvoices.filter((i) => i.uid === uid);
    return invoices.map((inv) => ({
      ...inv,
      invoiceDate: new Date(inv.invoiceDate),
      createdAt: new Date(inv.createdAt),
    }));
  } catch (error) {
    console.error('Error reading demo invoices:', error);
    return [];
  }
}

export function saveDemoInvoice(invoice: Invoice): void {
  if (typeof window === 'undefined') return;
  try {
    const stored = localStorage.getItem(DEMO_STORAGE_KEY_INVOICES);
    const invoices: Invoice[] = stored ? JSON.parse(stored) : [];
    invoices.push(invoice);
    localStorage.setItem(DEMO_STORAGE_KEY_INVOICES, JSON.stringify(invoices));
  } catch (error) {
    console.error('Error saving demo invoice:', error);
  }
}

export function updateDemoInvoice(invoiceId: string, updates: Partial<Invoice>): void {
  if (typeof window === 'undefined') return;
  try {
    const stored = localStorage.getItem(DEMO_STORAGE_KEY_INVOICES);
    if (!stored) return;
    const invoices: Invoice[] = JSON.parse(stored);
    const index = invoices.findIndex((inv) => inv.id === invoiceId);
    if (index !== -1) {
      invoices[index] = { ...invoices[index], ...updates };
      localStorage.setItem(DEMO_STORAGE_KEY_INVOICES, JSON.stringify(invoices));
    }
  } catch (error) {
    console.error('Error updating demo invoice:', error);
  }
}

export function deleteDemoClient(clientId: string, uid: string): void {
  if (typeof window === 'undefined') return;
  try {
    const stored = localStorage.getItem(DEMO_STORAGE_KEY_CLIENTS);
    if (!stored) return;
    const clients: any[] = JSON.parse(stored);
    const filtered = clients.filter((client) => !(client.id === clientId && client.uid === uid));
    localStorage.setItem(DEMO_STORAGE_KEY_CLIENTS, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error deleting demo client:', error);
  }
}

export function deleteDemoInvoicesByClient(uid: string, clientId: string): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(DEMO_STORAGE_KEY_INVOICES);
    if (!stored) return [];
    const invoices: Invoice[] = JSON.parse(stored);
    const remaining = invoices.filter((inv) => !(inv.uid === uid && inv.clientId === clientId));
    const removedIds = invoices
      .filter((inv) => inv.uid === uid && inv.clientId === clientId)
      .map((inv) => inv.id);
    localStorage.setItem(DEMO_STORAGE_KEY_INVOICES, JSON.stringify(remaining));
    return removedIds;
  } catch (error) {
    console.error('Error deleting demo invoices:', error);
    return [];
  }
}
