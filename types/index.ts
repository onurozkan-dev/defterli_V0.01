export interface User {
  uid: string;
  role: 'accountant';
  email?: string;
  displayName?: string;
  photoURL?: string;
  plan?: string;
  storageUsed?: number;
  storageLimit?: number;
  giftCodeUsed?: boolean;
  trialExpiresAt?: Date;
  createdAt?: Date;
}

export interface Client {
  id: string;
  uid: string;
  name: string;
  taxId: string;
  createdAt: Date;
}

export interface Invoice {
  id: string;
  uid: string;
  clientId: string;
  invoiceDate: Date;
  amount: number;
  pdfPath: string;
  createdAt: Date;
}

export interface ShareLink {
  token: string;
  invoiceId: string;
  expiresAt: Date;
  createdAt: Date;
}
