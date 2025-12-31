import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage, auth } from './firebase';

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

export async function uploadInvoicePDF(
  uid: string,
  clientId: string,
  invoiceId: string,
  file: File
): Promise<string> {
  if (DEMO_MODE || !storage) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const path = `invoices/${uid}/${clientId}/${year}/${month}/${invoiceId}.pdf`;
    
    const blobUrl = URL.createObjectURL(file);
    const storageKey = `defterli_demo_pdf_${invoiceId}`;
    localStorage.setItem(storageKey, blobUrl);
    
    return path;
  }
  try {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const path = `invoices/${uid}/${clientId}/${year}/${month}/${invoiceId}.pdf`;
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    return path;
  } catch (error) {
    console.error('Error uploading PDF:', error);
    throw error;
  }
}

export async function getInvoicePDFUrl(pdfPath: string): Promise<string> {
  if (DEMO_MODE || !storage) {
    const invoiceIdMatch = pdfPath.match(/\/([^/]+)\.pdf$/);
    if (invoiceIdMatch) {
      const invoiceId = invoiceIdMatch[1];
      const storageKey = `defterli_demo_pdf_${invoiceId}`;
      const blobUrl = localStorage.getItem(storageKey);
      if (blobUrl) {
        return blobUrl;
      }
    }
    throw new Error('PDF URL is not available in demo mode');
  }
  
  try {
    if (auth && auth.currentUser === null) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      if (auth.currentUser === null) {
        throw new Error('Kullanıcı kimlik doğrulaması gerekli. Lütfen giriş yapın.');
      }
    }
    
    const storageRef = ref(storage, pdfPath);
    const url = await getDownloadURL(storageRef);
    return url;
  } catch (error: any) {
    console.error('Error getting PDF URL:', error);
    
    if (error.code === 'storage/unauthorized') {
      throw new Error('PDF dosyasına erişim yetkiniz yok. Lütfen tekrar giriş yapın.');
    } else if (error.code === 'storage/object-not-found') {
      throw new Error('PDF dosyası bulunamadı.');
    } else if (error.message?.includes('auth')) {
      throw new Error('Kullanıcı kimlik doğrulaması gerekli. Lütfen sayfayı yenileyin ve tekrar giriş yapın.');
    }
    
    throw new Error(error.message || 'PDF yüklenirken bir hata oluştu');
  }
}

export async function deleteInvoicePDF(pdfPath: string): Promise<void> {
  if (DEMO_MODE || !storage) {
    return;
  }
  try {
    const storageRef = ref(storage, pdfPath);
    await deleteObject(storageRef);
  } catch (error) {
    console.error('Error deleting PDF:', error);
    throw error;
  }
}
