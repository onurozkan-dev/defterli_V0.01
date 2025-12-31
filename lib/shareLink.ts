import { collection, doc, setDoc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from './firebase';

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
const DEMO_STORAGE_KEY_SHARE_LINKS = 'defterli_demo_share_links';

function generateToken(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

interface ShareLinkData {
  invoiceId: string;
  expiresAt: string;
  createdAt: string;
}

export async function createShareLink(invoiceId: string): Promise<string> {
  if (DEMO_MODE || !db) {
    const token = generateToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const shareLink: ShareLinkData = {
      invoiceId,
      expiresAt: expiresAt.toISOString(),
      createdAt: new Date().toISOString(),
    };

    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(DEMO_STORAGE_KEY_SHARE_LINKS);
        const links: Record<string, ShareLinkData> = stored ? JSON.parse(stored) : {};
        links[token] = shareLink;
        localStorage.setItem(DEMO_STORAGE_KEY_SHARE_LINKS, JSON.stringify(links));
      } catch (error) {
        console.error('Error saving demo share link:', error);
      }
    }

    return token;
  }
  try {
    const token = generateToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    await setDoc(doc(db, 'shareLinks', token), {
      invoiceId,
      expiresAt: Timestamp.fromDate(expiresAt),
      createdAt: Timestamp.now(),
    });

    return token;
  } catch (error) {
    console.error('Error creating share link:', error);
    throw error;
  }
}

export async function getShareLink(token: string): Promise<{ invoiceId: string; expiresAt: Date } | null> {
  if (DEMO_MODE || !db) {
    if (typeof window === 'undefined') return null;
    try {
      const stored = localStorage.getItem(DEMO_STORAGE_KEY_SHARE_LINKS);
      if (!stored) return null;
      const links: Record<string, ShareLinkData> = JSON.parse(stored);
      const linkData = links[token];
      if (!linkData) return null;

      const expiresAt = new Date(linkData.expiresAt);
      if (expiresAt < new Date()) {
        return null;
      }

      return {
        invoiceId: linkData.invoiceId,
        expiresAt,
      };
    } catch (error) {
      console.error('Error getting demo share link:', error);
      return null;
    }
  }
  try {
    const shareLinkDoc = await getDoc(doc(db, 'shareLinks', token));
    if (!shareLinkDoc.exists()) return null;

    const data = shareLinkDoc.data();
    const expiresAt = (data.expiresAt as Timestamp).toDate();

    if (expiresAt < new Date()) {
      return null;
    }

    return {
      invoiceId: data.invoiceId,
      expiresAt,
    };
  } catch (error) {
    console.error('Error getting share link:', error);
    return null;
  }
}
