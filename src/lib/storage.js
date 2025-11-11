import { deleteObject, getDownloadURL, getMetadata, listAll, ref, uploadBytes } from 'firebase/storage';
import { storage } from '../firebase';

const USERS_ROOT = 'users_prod';
const LEGACY_LOGOS_ROOT = 'logos';

function deriveLabel(item, metadata) {
  if (metadata?.customMetadata?.label) {
    return metadata.customMetadata.label;
  }
  if (metadata?.name) {
    return metadata.name;
  }
  const parts = item.fullPath?.split('/') || [];
  if (parts.length >= 2) {
    return `${parts[parts.length - 2]} · ${parts[parts.length - 1]}`;
  }
  return item.name.replace(/\.[^.]+$/, '').replace(/[_-]/g, ' ').trim();
}

function deriveUploadedAt(metadata) {
  if (!metadata) {
    return new Date().toISOString();
  }
  return metadata.timeCreated || metadata.updated || new Date().toISOString();
}

async function collectItemsRecursively(folderRef) {
  const result = await listAll(folderRef);
  const nested = await Promise.all(result.prefixes.map((child) => collectItemsRecursively(child)));
  return [...result.items, ...nested.flat()];
}

function buildLegacyPath(uid) {
  return `${LEGACY_LOGOS_ROOT}/${uid}`;
}

function buildOrdersPath(uid) {
  return `${USERS_ROOT}/${uid}/orders_prod`;
}

function buildUserLogoPath(uid) {
  return `${USERS_ROOT}/${uid}/logos`;
}

async function fetchAllGraphicsForPath(path) {
  const folderRef = ref(storage, path);
  const allItems = await collectItemsRecursively(folderRef);
  const graphics = await Promise.all(
    allItems.map(async (item) => {
      const [url, metadata] = await Promise.all([
        getDownloadURL(item),
        getMetadata(item).catch(() => null),
      ]);
      return {
        id: metadata?.customMetadata?.id || item.fullPath || item.name,
        label: deriveLabel(item, metadata),
        fileUrl: url,
        uploadedAt: deriveUploadedAt(metadata),
        path: item.fullPath,
      };
    }),
  );
  return graphics;
}

export async function fetchCustomerGraphicsFromStorage(folderId) {
  if (!folderId || !storage) {
    return [];
  }

  const safeId = folderId.trim().replace(/^\/+/, '').replace(/\/+$/, '');
  if (!safeId) {
    return [];
  }

  try {
    const [ordersGraphics, userLogos, legacyLogos] = await Promise.all([
      fetchAllGraphicsForPath(buildOrdersPath(safeId)).catch((error) => {
        if (error.code === 'storage/object-not-found') {
          return [];
        }
        throw error;
      }),
      fetchAllGraphicsForPath(buildUserLogoPath(safeId)).catch((error) => {
        if (error.code === 'storage/object-not-found') {
          return [];
        }
        throw error;
      }),
      fetchAllGraphicsForPath(buildLegacyPath(safeId)).catch((error) => {
        if (error.code === 'storage/object-not-found') {
          return [];
        }
        throw error;
      }),
    ]);
    return [...ordersGraphics, ...userLogos, ...legacyLogos];
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Failed loading graphics from Storage', error);
    }
    throw error;
  }
}

export async function uploadCustomerGraphic(folderId, file, metadata) {
  if (!folderId || !storage) {
    throw new Error('לא ניתן לשמור קובץ ללא חיבור ל-Storage.');
  }
  if (!file) {
    throw new Error('לא נבחר קובץ להעלאה.');
  }
  const safeId = folderId.trim().replace(/^\/+/, '').replace(/\/+$/, '');
  const timestamp = Date.now();
  const sanitizedName = file.name?.replace(/\s+/g, '_') || `graphic-${timestamp}`;
  const path = `${USERS_ROOT}/${safeId}/logos/${timestamp}-${sanitizedName}`;
  const fileRef = ref(storage, path);
  await uploadBytes(fileRef, file, metadata);
  const fileUrl = await getDownloadURL(fileRef);
  return { fileUrl, path };
}

export async function deleteCustomerGraphic(path) {
  if (!path || !storage) {
    throw new Error('לא ניתן למחוק קובץ ללא נתיב תקין.');
  }
  try {
    const fileRef = ref(storage, path);
    await deleteObject(fileRef);
  } catch (error) {
    if (error.code === 'storage/unauthorized' || error.code === 'storage/retry-limit-exceeded') {
      throw new Error('אין הרשאות למחיקה מ-Firebase Storage. בדקו את חוקי האבטחה.');
    }
    if (error.code === 'storage/object-not-found') {
      return;
    }
    throw error;
  }
}
