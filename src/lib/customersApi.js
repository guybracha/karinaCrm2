import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '../firebase';
import { generateId } from './id';
import { fetchCustomerGraphicsFromStorage } from './storage';

const USERS_COLLECTION = 'users_prod';
const ORDERS_COLLECTION = 'orders_prod';
const isTestEnv = process.env.NODE_ENV === 'test';

const memoryStore = {
  customers: [],
  orders: new Map(),
};

function nowIso() {
  return new Date().toISOString();
}

function normalizeDate(value) {
  if (!value) {
    return nowIso();
  }
  if (typeof value === 'string') {
    return value;
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value.toDate === 'function') {
    return value.toDate().toISOString();
  }
  return nowIso();
}

function defaultSteps() {
  const timestamp = nowIso();
  return [
    { id: 'step1', title: 'קבלת הזמנה', status: 'done', updatedAt: timestamp },
    { id: 'step2', title: 'עיצוב גרפי', status: 'todo', updatedAt: timestamp },
    { id: 'step3', title: 'אישור לקוח', status: 'todo', updatedAt: timestamp },
    { id: 'step4', title: 'ייצור', status: 'todo', updatedAt: timestamp },
    { id: 'step5', title: 'נשלח ללקוח', status: 'todo', updatedAt: timestamp },
  ];
}

function createMemoryOrder(userId) {
  return {
    id: generateId(),
    userId,
    graphics: [],
    productionSteps: defaultSteps(),
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
}

function normalizeGraphics(graphics = []) {
  if (!Array.isArray(graphics)) {
    return [];
  }
  return graphics.map((item) => ({
    id: item.id || generateId(),
    label: item.label || 'קובץ ללא שם',
    fileUrl: item.fileUrl || '',
    uploadedAt: normalizeDate(item.uploadedAt),
  }));
}

function normalizeSteps(steps) {
  if (!Array.isArray(steps) || steps.length === 0) {
    return defaultSteps();
  }
  return steps.map((step) => ({
    id: step.id || generateId(),
    title: step.title || 'שלב ללא שם',
    status: step.status === 'done' || step.status === 'in-progress' ? step.status : 'todo',
    updatedAt: normalizeDate(step.updatedAt),
  }));
}

function normalizeOrderItem(item) {
  if (!item) return null;
  return {
    productId: item.productId || item.id || item.slug || '',
    productName: item.productName || item.name || '',
    qty: item.qty || 0,
    unitPrice: item.unitPrice || item.price || item.baseUnit || 0,
    price: item.price || item.baseUnit || 0, // מחיר בסיס
    baseUnit: item.baseUnit || item.price || 0,
    unitAfter: item.unitAfter || item.price || item.baseUnit || 0, // מחיר אחרי הנחה
    lineTotal: item.lineTotal || 0, // סכום כולל של השורה
    color: item.color || '',
    colorHex: item.colorHex || item.colorCode || '',
    sizes: item.sizes || {}, // { "S": 2, "M": 5, "L": 3 }
    sizeSplit: item.sizeSplit || [], // פירוט מידות עם צבעים [{ size: "2XL", color: "שחור", qty: 2 }]
    variants: item.variants || null, // { byColorSize: {...}, colorTotals: {...}, sizeTotals: {...} }
    discountPct: item.discountPct || 0,
    saved: item.saved || 0,
    notes: item.notes || '',
  };
}

function mapOrderDoc(orderDoc) {
  const data = typeof orderDoc.data === 'function' ? orderDoc.data() : orderDoc;
  const items = Array.isArray(data.items) 
    ? data.items.map(normalizeOrderItem).filter(Boolean)
    : [];
  
  return {
    id: orderDoc.id || data.id,
    userId: data.userId || data.uid || data.customer?.uid, // תמיכה בכל הפורמטים: userId, uid, customer.uid
    customer: data.customer, // שמירת כל פרטי הלקוח
    status: data.status || 'draft',
    items, // פריטי ההזמנה מנורמלים
    shipping: data.shipping, // פרטי משלוח
    logos: data.logos, // לוגואים שהועלו עם ההזמנה (uploads, mockups, byItemFromCart)
    totals: data.totals, // סכומים (grandTotal, merchandiseTotal, etc.)
    notes: data.notes || '',
    createdAt: normalizeDate(data.createdAt),
    updatedAt: normalizeDate(data.updatedAt),
    graphics: normalizeGraphics(data.graphics),
    productionSteps: normalizeSteps(data.productionSteps),
  };
}

function mapToCustomer(docSnap, orderData) {
  const data = docSnap.data() || {};
  const firebaseUid = data.firebaseUid || docSnap.id;
  return {
    id: docSnap.id,
    firebaseUid,
    name: data.name || data.displayName || 'לקוח ללא שם',
    company: data.company || '',
    phone: data.phone || data.phoneNumber || '',
    email: data.email || '',
    city: data.city || '',
    notes: data.notes || '',
    graphics: normalizeGraphics(data.graphics || orderData?.graphics),
    productionSteps: normalizeSteps(orderData?.productionSteps),
  };
}

function sortCustomersList(list = []) {
  return [...list].sort((a, b) => {
    const nameA = (a?.name || '').trim().toLowerCase();
    const nameB = (b?.name || '').trim().toLowerCase();
    if (nameA === nameB) {
      return (a?.id || '').localeCompare(b?.id || '');
    }
    return nameA.localeCompare(nameB);
  });
}

async function fetchOrdersMap() {
  const snapshot = await getDocs(collection(db, ORDERS_COLLECTION));
  const map = new Map();
  snapshot.forEach((orderDoc) => {
    const order = mapOrderDoc(orderDoc);
    if (!order.userId || map.has(order.userId)) {
      return;
    }
    map.set(order.userId, order);
  });
  return map;
}

async function getOrderForUser(userId) {
  const ordersQuery = query(
    collection(db, ORDERS_COLLECTION),
    where('userId', '==', userId),
    limit(1),
  );
  const snapshot = await getDocs(ordersQuery);
  if (snapshot.empty) {
    return null;
  }
  return mapOrderDoc(snapshot.docs[0]);
}

async function runOrdersQueryForUser(userId) {
  if (!userId) {
    console.log('[runOrdersQueryForUser] No userId provided');
    return [];
  }
  console.log(`[runOrdersQueryForUser] Fetching orders for user: ${userId}`);
  const baseRef = collection(db, ORDERS_COLLECTION);
  
  // ננסה מספר אסטרטגיות לחיפוש
  try {
    // אסטרטגיה 1: חיפוש לפי uid ישירות (פורמט חדש) עם orderBy
    try {
      const ordersQuery = query(
        baseRef,
        where('uid', '==', userId),
        orderBy('updatedAt', 'desc'),
      );
      const snapshot = await getDocs(ordersQuery);
      console.log(`[runOrdersQueryForUser] Found ${snapshot.docs.length} orders with uid + orderBy`);
      if (!snapshot.empty) {
        return snapshot.docs.map((docSnap) => mapOrderDoc(docSnap));
      }
    } catch (innerError) {
      console.log('[runOrdersQueryForUser] uid + orderBy failed:', innerError.message);
    }
    
    // אסטרטגיה 2: חיפוש לפי uid ישירות בלי orderBy
    try {
      const ordersQuery = query(
        baseRef,
        where('uid', '==', userId),
      );
      const snapshot = await getDocs(ordersQuery);
      console.log(`[runOrdersQueryForUser] Found ${snapshot.docs.length} orders with uid (no orderBy)`);
      if (!snapshot.empty) {
        return snapshot.docs
          .map((docSnap) => mapOrderDoc(docSnap))
          .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
      }
    } catch (innerError) {
      console.log('[runOrdersQueryForUser] uid failed:', innerError.message);
    }
    
    // אסטרטגיה 3: חיפוש לפי customer.uid עם orderBy
    try {
      const ordersQuery = query(
        baseRef,
        where('customer.uid', '==', userId),
        orderBy('updatedAt', 'desc'),
      );
      const snapshot = await getDocs(ordersQuery);
      console.log(`[runOrdersQueryForUser] Found ${snapshot.docs.length} orders with customer.uid + orderBy`);
      if (!snapshot.empty) {
        return snapshot.docs.map((docSnap) => mapOrderDoc(docSnap));
      }
    } catch (innerError) {
      console.log('[runOrdersQueryForUser] customer.uid + orderBy failed:', innerError.message);
    }
    
    // אסטרטגיה 4: חיפוש לפי customer.uid בלי orderBy
    try {
      const ordersQuery = query(
        baseRef,
        where('customer.uid', '==', userId),
      );
      const snapshot = await getDocs(ordersQuery);
      console.log(`[runOrdersQueryForUser] Found ${snapshot.docs.length} orders with customer.uid (no orderBy)`);
      if (!snapshot.empty) {
        return snapshot.docs
          .map((docSnap) => mapOrderDoc(docSnap))
          .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
      }
    } catch (innerError) {
      console.log('[runOrdersQueryForUser] customer.uid failed:', innerError.message);
    }
    
    // אסטרטגיה 5: fallback לפורמט ישן עם userId + orderBy
    try {
      const fallbackQuery = query(
        baseRef,
        where('userId', '==', userId),
        orderBy('updatedAt', 'desc'),
      );
      const fallbackSnapshot = await getDocs(fallbackQuery);
      console.log(`[runOrdersQueryForUser] Found ${fallbackSnapshot.docs.length} orders with userId + orderBy`);
      if (!fallbackSnapshot.empty) {
        return fallbackSnapshot.docs.map((docSnap) => mapOrderDoc(docSnap));
      }
    } catch (innerError) {
      console.log('[runOrdersQueryForUser] userId + orderBy failed:', innerError.message);
    }
    
    // אסטרטגיה 6: fallback לפורמט ישן עם userId בלי orderBy
    try {
      const fallbackQuery = query(baseRef, where('userId', '==', userId));
      const fallbackSnapshot = await getDocs(fallbackQuery);
      console.log(`[runOrdersQueryForUser] Found ${fallbackSnapshot.docs.length} orders with userId (no orderBy)`);
      return fallbackSnapshot.docs
        .map((docSnap) => mapOrderDoc(docSnap))
        .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
    } catch (innerError) {
      console.log('[runOrdersQueryForUser] userId failed:', innerError.message);
      return [];
    }
  } catch (error) {
    console.error('[runOrdersQueryForUser] Error fetching orders:', error);
    return [];
  }
}

async function fetchOrdersByUser(userId, additionalUserIds = []) {
  const list = Array.isArray(additionalUserIds) ? additionalUserIds : [additionalUserIds];
  const idsToQuery = [userId, ...list].filter(Boolean);
  const uniqueIds = Array.from(new Set(idsToQuery));
  const map = new Map();
  for (const value of uniqueIds) {
    const orders = await runOrdersQueryForUser(value);
    orders.forEach((order) => {
      if (!map.has(order.id)) {
        map.set(order.id, order);
      }
    });
  }
  return Array.from(map.values()).sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
}

async function ensureOrderRef(userId, orderId) {
  if (orderId) {
    const existingRef = doc(db, ORDERS_COLLECTION, orderId);
    const snap = await getDoc(existingRef);
    if (!snap.exists()) {
      throw new Error('Order not found');
    }
    const data = snap.data();
    if (data.userId !== userId) {
      throw new Error('Order does not belong to this user');
    }
    return { ref: existingRef, data: mapOrderDoc({ id: snap.id, data: () => data }) };
  }
  const existing = await getOrderForUser(userId);
  if (existing) {
    return { ref: doc(db, ORDERS_COLLECTION, existing.id), data: existing };
  }
  const steps = defaultSteps();
  const newDoc = await addDoc(collection(db, ORDERS_COLLECTION), {
    userId,
    graphics: [],
    productionSteps: steps,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return { ref: newDoc, data: { id: newDoc.id, graphics: [], productionSteps: steps } };
}

function createMemoryCustomer(payload) {
  const id = generateId();
  const order = createMemoryOrder(id);
  memoryStore.orders.set(id, [order]);
  const customer = {
    id,
    firebaseUid: payload.firebaseUid || id,
    name: payload.name,
    company: payload.company,
    phone: payload.phone,
    email: payload.email,
    city: payload.city,
    notes: payload.notes,
    graphics: order.graphics,
    productionSteps: order.productionSteps,
    orders: [order],
  };
  memoryStore.customers.push(customer);
  return customer;
}

export async function fetchCustomers() {
  if (isTestEnv) {
    return memoryStore.customers;
  }
  const usersRef = collection(db, USERS_COLLECTION);
  const [usersSnapshot, ordersMap] = await Promise.all([
    getDocs(usersRef),
    fetchOrdersMap(),
  ]);
  const customers = usersSnapshot.docs.map((docSnap) =>
    mapToCustomer(docSnap, ordersMap.get(docSnap.id)),
  );
  return sortCustomersList(customers);
}

export function subscribeToCustomers(onData, onError) {
  if (isTestEnv) {
    onData?.(memoryStore.customers);
    return () => {};
  }
  const usersRef = collection(db, USERS_COLLECTION);
  const unsubscribe = onSnapshot(
    usersRef,
    async (snapshot) => {
      try {
        const ordersMap = await fetchOrdersMap();
        const customers = sortCustomersList(
          snapshot.docs.map((docSnap) => mapToCustomer(docSnap, ordersMap.get(docSnap.id))),
        );
        onData?.(customers);
      } catch (error) {
        onError?.(error);
      }
    },
    (error) => {
      onError?.(error);
    },
  );

  return unsubscribe;
}

export async function fetchCustomerById(id) {
  if (isTestEnv) {
    const customer = memoryStore.customers.find((entry) => entry.id === id);
    if (!customer) {
      return null;
    }
    const orders = memoryStore.orders.get(id) || [];
    return {
      ...customer,
      orders,
      graphics: orders[0]?.graphics || customer.graphics,
      productionSteps: orders[0]?.productionSteps || customer.productionSteps,
      tasks: customer.tasks || [],
    };
  }
  const userRef = doc(db, USERS_COLLECTION, id);
  const snapshot = await getDoc(userRef);
  if (!snapshot.exists()) {
    return null;
  }
  const data = snapshot.data() || {};
  
  // טעינת tasks ו-graphics ישירות מהמסמך (מהיר)
  const tasks = Array.isArray(data.tasks) ? data.tasks : [];
  const firestoreGraphics = normalizeGraphics(data.graphics);
  
  // טעינת תמונות מ-Storage והזמנות במקביל (לא חוסם)
  const firebaseUid = data.firebaseUid || id;
  const storageGraphicsPromise = fetchCustomerGraphicsFromStorage(firebaseUid).catch(() => []);
  const ordersPromise = runOrdersQueryForUser(id).catch(() => []);
  
  const mapped = mapToCustomer(snapshot, null);
  
  // טעינת הזמנות במקביל
  const orders = await ordersPromise;
  console.log(`[fetchCustomerById] Customer ${id} has ${orders.length} orders:`, orders);
  
  // אם יש תמונות ב-Firestore, נחזיר מיד, אחרת נחכה ל-Storage
  if (firestoreGraphics.length > 0) {
    // נחזיר מיד עם תמונות מ-Firestore ונעדכן ברקע
    storageGraphicsPromise.then(storageGraphics => {
      if (storageGraphics.length > 0) {
        // מיזוג וסידור לפי תאריך (מהחדש לישן)
        const allGraphics = [...storageGraphics, ...firestoreGraphics];
        const uniqueGraphics = Array.from(
          new Map(allGraphics.map(g => [g.id, g])).values()
        ).sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
      }
    });
    console.log(`[fetchCustomerById] Returning customer with ${orders.length} orders`);
    return { ...mapped, tasks, graphics: firestoreGraphics, orders };
  }
  
  // אין תמונות ב-Firestore, נחכה ל-Storage
  const storageGraphics = await storageGraphicsPromise;
  const graphics = storageGraphics.length > 0 
    ? storageGraphics.sort((a, b) => {
        const dateA = a.uploadedAt || '';
        const dateB = b.uploadedAt || '';
        return dateB.localeCompare(dateA);
      })
    : [];
  
  console.log(`[fetchCustomerById] Returning customer with ${orders.length} orders (no Firestore graphics)`);
  return { ...mapped, tasks, graphics, orders };
}

export async function createCustomer(data) {
  const payload = {
    name: data.name?.trim() || 'לקוח ללא שם',
    company: data.company?.trim() || '',
    phone: data.phone?.trim() || '',
    email: data.email?.trim() || '',
    city: data.city?.trim() || '',
    notes: data.notes?.trim() || '',
  };

  if (isTestEnv) {
    return createMemoryCustomer(payload);
  }

  try {
    console.log('מנסה ליצור לקוח חדש...', payload);
    
    // התאמת המבנה ל-Security Rules של users_prod
    const userDocData = {
      displayName: payload.name, // Rules מצפה ל-displayName
      email: payload.email || null,
      phoneNumber: payload.phone || null, // Rules מצפה ל-phoneNumber
      company: payload.company || null,
      city: payload.city || null,
      notes: payload.notes || null,
      // שדות נוספים לשימוש פנימי ב-CRM
      name: payload.name,
      phone: payload.phone,
      graphics: [], // רשימת גרפיקות
      tasks: [], // רשימת משימות
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    
    const userRef = await addDoc(collection(db, USERS_COLLECTION), userDocData);

    console.log('לקוח נוצר בהצלחה, ID:', userRef.id);

    // יצירת הזמנה ראשונית בפורמט שעומד ב-validOrderOnCreate
    // שימו לב: items חייבים להכיל לפחות פריט אחד לפי ה-Rules
    // רק שדות המותרים לפי allowedOrderKeysClient: customer, items, status, shipping, notes, createdAt, updatedAt
    const orderDocData = {
      customer: {
        uid: userRef.id,
        displayName: payload.name,
        email: payload.email || '',
        phoneNumber: payload.phone || '',
      },
      status: 'draft', // סטטוס ראשוני מותר לפי validInitialOrderStatus
      items: [
        {
          productId: 'placeholder-initial',
          qty: 1,
          unitPrice: 0,
        }
      ], // פריט placeholder כדי לעמוד בדרישת Rules (items.size() > 0)
      notes: '', // שדה notes מותר
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    try {
      await addDoc(collection(db, ORDERS_COLLECTION), orderDocData);
      console.log('הזמנה ראשונית נוצרה בהצלחה');
    } catch (orderError) {
      console.error('שגיאה ביצירת הזמנה:', orderError);
      // הלקוח כבר נוצר, אז נמשיך גם אם ההזמנה נכשלה
      console.warn('הלקוח נוצר בהצלחה אך ההזמנה הראשונית נכשלה. ניתן ליצור אותה מאוחר יותר.');
    }

    return fetchCustomerById(userRef.id);
  } catch (error) {
    console.error('שגיאה ביצירת לקוח:', error);
    console.error('קוד שגיאה:', error.code);
    console.error('הודעה:', error.message);
    
    // זריקת שגיאה עם מידע נוסף רק אם הלקוח לא נוצר
    if (error.code === 'permission-denied') {
      throw new Error(`אין הרשאה ליצור לקוח חדש. וודא שאתה מחובר כעובד פעיל (staff) או שיש לך הרשאות CRM Editor. קוד: ${error.code}`);
    }
    
    throw error;
  }
}

export async function saveCustomerGraphics(customerId, graphics) {
  if (isTestEnv) {
    const index = memoryStore.customers.findIndex((customer) => customer.id === customerId);
    if (index === -1) {
      return null;
    }
    memoryStore.customers[index] = {
      ...memoryStore.customers[index],
      graphics,
    };
    return memoryStore.customers[index];
  }

  const userRef = doc(db, USERS_COLLECTION, customerId);
  await updateDoc(userRef, {
    graphics,
    updatedAt: serverTimestamp(),
  });
  return fetchCustomerById(customerId);
}

export async function updateCustomerNotes(customerId, notes) {
  if (isTestEnv) {
    const index = memoryStore.customers.findIndex((customer) => customer.id === customerId);
    if (index === -1) {
      return null;
    }
    memoryStore.customers[index] = {
      ...memoryStore.customers[index],
      notes: notes?.trim() || '',
    };
    return memoryStore.customers[index];
  }

  const userRef = doc(db, USERS_COLLECTION, customerId);
  await updateDoc(userRef, {
    notes: notes?.trim() || '',
    updatedAt: serverTimestamp(),
  });
  return fetchCustomerById(customerId);
}

export async function updateCustomerTasks(customerId, tasks) {
  if (isTestEnv) {
    const index = memoryStore.customers.findIndex((customer) => customer.id === customerId);
    if (index === -1) {
      return null;
    }
    memoryStore.customers[index] = {
      ...memoryStore.customers[index],
      tasks: tasks || [],
    };
    return memoryStore.customers[index];
  }

  const userRef = doc(db, USERS_COLLECTION, customerId);
  await updateDoc(userRef, {
    tasks: tasks || [],
    updatedAt: serverTimestamp(),
  });
  return fetchCustomerById(customerId);
}

export async function saveProductionSteps(customerId, steps, orderId = null) {
  if (isTestEnv) {
    const index = memoryStore.customers.findIndex((customer) => customer.id === customerId);
    if (index === -1) {
      return null;
    }
    const orders = memoryStore.orders.get(customerId) || [];
    const targetIndex =
      orderId != null ? orders.findIndex((order) => order.id === orderId) : 0;
    if (targetIndex >= 0 && orders[targetIndex]) {
      orders[targetIndex] = { ...orders[targetIndex], productionSteps: steps };
      memoryStore.orders.set(customerId, orders);
    }
    memoryStore.customers[index] = {
      ...memoryStore.customers[index],
      productionSteps: steps,
      orders,
    };
    return memoryStore.customers[index];
  }

  const { ref } = await ensureOrderRef(customerId, orderId);
  await updateDoc(ref, {
    productionSteps: steps,
    updatedAt: serverTimestamp(),
  });
  return fetchCustomerById(customerId);
}

export async function deleteCustomer(customerId) {
  if (isTestEnv) {
    const index = memoryStore.customers.findIndex((customer) => customer.id === customerId);
    if (index !== -1) {
      memoryStore.customers.splice(index, 1);
      memoryStore.orders.delete(customerId);
    }
    return;
  }

  try {
    console.log('מוחק לקוח:', customerId);

    // מחיקת כל ההזמנות של הלקוח (פורמט חדש)
    const newFormatQuery = query(
      collection(db, ORDERS_COLLECTION),
      where('customer.uid', '==', customerId)
    );
    const newFormatSnapshot = await getDocs(newFormatQuery);
    
    // מחיקת הזמנות בפורמט ישן
    const oldFormatQuery = query(
      collection(db, ORDERS_COLLECTION),
      where('userId', '==', customerId)
    );
    const oldFormatSnapshot = await getDocs(oldFormatQuery);
    
    const deletePromises = [
      ...newFormatSnapshot.docs.map((orderDoc) =>
        deleteDoc(doc(db, ORDERS_COLLECTION, orderDoc.id))
      ),
      ...oldFormatSnapshot.docs.map((orderDoc) =>
        deleteDoc(doc(db, ORDERS_COLLECTION, orderDoc.id))
      ),
    ];
    
    await Promise.all(deletePromises);
    console.log(`נמחקו ${deletePromises.length} הזמנות`);

    // מחיקת הלקוח עצמו
    await deleteDoc(doc(db, USERS_COLLECTION, customerId));
    console.log('הלקוח נמחק בהצלחה');
  } catch (error) {
    console.error('שגיאה במחיקת לקוח:', error);
    throw error;
  }
}

// ייצוא פונקציה לשליפת הזמנות של לקוח ספציפי
export async function fetchCustomerOrders(customerId) {
  if (!customerId) {
    return [];
  }
  return runOrdersQueryForUser(customerId);
}

// שליפת כל ההזמנות ממסד הנתונים וממוינות לפי UID של המשתמש
export async function fetchAllOrdersSortedByUser() {
  if (isTestEnv) {
    // במצב טסט, מחזירים מהזיכרון
    return Array.from(memoryStore.orders.values())
      .sort((a, b) => {
        const uidA = (a.userId || '').toLowerCase();
        const uidB = (b.userId || '').toLowerCase();
        return uidA.localeCompare(uidB);
      });
  }

  try {
    console.log('[fetchAllOrdersSortedByUser] Fetching all orders from orders_prod');
    
    // ננסה למיין לפי uid (הפורמט החדש)
    let orders = [];
    try {
      const ordersQuery = query(
        collection(db, ORDERS_COLLECTION),
        orderBy('uid', 'asc')
      );
      const snapshot = await getDocs(ordersQuery);
      console.log(`[fetchAllOrdersSortedByUser] Found ${snapshot.docs.length} orders with uid orderBy`);
      if (snapshot.docs.length > 0) {
        orders = snapshot.docs.map((docSnap) => mapOrderDoc(docSnap));
      }
    } catch (uidError) {
      console.log('[fetchAllOrdersSortedByUser] orderBy uid failed:', uidError.message);
    }
    
    // אם נכשל, ננסה למיין לפי userId (פורמט ישן)
    if (orders.length === 0) {
      try {
        const ordersQuery = query(
          collection(db, ORDERS_COLLECTION),
          orderBy('userId', 'asc')
        );
        const snapshot = await getDocs(ordersQuery);
        console.log(`[fetchAllOrdersSortedByUser] Found ${snapshot.docs.length} orders with userId orderBy`);
        if (snapshot.docs.length > 0) {
          orders = snapshot.docs.map((docSnap) => mapOrderDoc(docSnap));
        }
      } catch (userIdError) {
        console.log('[fetchAllOrdersSortedByUser] orderBy userId failed:', userIdError.message);
      }
    }
    
    // אם orderBy נכשל לגמרי, נשלוף הכל ונמיין בצד הלקוח
    if (orders.length === 0) {
      console.log('[fetchAllOrdersSortedByUser] Fetching all orders without orderBy');
      const snapshot = await getDocs(collection(db, ORDERS_COLLECTION));
      console.log(`[fetchAllOrdersSortedByUser] Found ${snapshot.docs.length} orders (no orderBy)`);
      
      orders = snapshot.docs.map((docSnap) => mapOrderDoc(docSnap));
      
      // מיון לפי userId בצד הלקוח
      orders.sort((a, b) => {
        const uidA = (a.userId || '').toLowerCase();
        const uidB = (b.userId || '').toLowerCase();
        return uidA.localeCompare(uidB);
      });
    }
    
    // עכשיו נטען את פרטי הלקוחות לכל ההזמנות
    console.log('[fetchAllOrdersSortedByUser] Loading customer details for orders');
    const userIds = [...new Set(orders.map(order => order.userId).filter(Boolean))];
    console.log(`[fetchAllOrdersSortedByUser] Found ${userIds.length} unique user IDs`);
    
    // טעינת כל הלקוחות במקביל
    const customersMap = new Map();
    await Promise.all(
      userIds.map(async (userId) => {
        try {
          const userDoc = await getDoc(doc(db, USERS_COLLECTION, userId));
          if (userDoc.exists()) {
            customersMap.set(userId, userDoc.data());
          }
        } catch (error) {
          console.error(`[fetchAllOrdersSortedByUser] Error loading user ${userId}:`, error);
        }
      })
    );
    
    // חיבור פרטי הלקוחות להזמנות
    orders = orders.map(order => ({
      ...order,
      customer: order.customer || customersMap.get(order.userId) || null
    }));
    
    console.log('[fetchAllOrdersSortedByUser] Orders with customer details loaded:', orders);
    return orders;
  } catch (error) {
    console.error('[fetchAllOrdersSortedByUser] Error fetching orders:', error);
    return [];
  }
}

// מעקב אחר הזמנות חדשות בזמן אמת
export function subscribeToNewOrders(onNewOrder, onError) {
  if (isTestEnv) {
    console.log('[subscribeToNewOrders] Test mode - no real-time subscription');
    return () => {};
  }

  let lastOrderCount = 0;
  const existingOrderIds = new Set();

  // שליפת ההזמנות הקיימות כדי לא להתריע עליהן
  getDocs(collection(db, ORDERS_COLLECTION))
    .then((snapshot) => {
      snapshot.docs.forEach((doc) => {
        existingOrderIds.add(doc.id);
      });
      lastOrderCount = snapshot.size;
      console.log(`[subscribeToNewOrders] Initialized with ${lastOrderCount} existing orders`);
    })
    .catch((error) => {
      console.error('[subscribeToNewOrders] Error fetching initial orders:', error);
    });

  // האזנה לשינויים בזמן אמת
  const ordersRef = collection(db, ORDERS_COLLECTION);
  const q = query(ordersRef, orderBy('createdAt', 'desc'));

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const orderId = change.doc.id;
          
          // בדיקה אם זו הזמנה חדשה באמת (לא חלק מהטעינה הראשונית)
          if (!existingOrderIds.has(orderId)) {
            const order = mapOrderDoc(change.doc);
            console.log('[subscribeToNewOrders] New order detected:', order);
            
            // קריאה ל-callback עם פרטי ההזמנה החדשה
            if (onNewOrder && typeof onNewOrder === 'function') {
              onNewOrder(order);
            }
          }
          
          // הוספת ההזמנה לרשימה הקיימת
          existingOrderIds.add(orderId);
        }
      });
      
      lastOrderCount = snapshot.size;
    },
    (error) => {
      console.error('[subscribeToNewOrders] Error in snapshot listener:', error);
      if (onError && typeof onError === 'function') {
        onError(error);
      }
    }
  );

  return unsubscribe;
}

// פונקציה להצגת התרעה (ניתן להתאים למערכת ההתרעות שלך)
export function showOrderNotification(order) {
  // אם הדפדפן תומך בהתרעות
  if ('Notification' in window && Notification.permission === 'granted') {
    // נסה למצוא את שם הלקוח מכל המקורות האפשריים
    const customerName = 
      order.customer?.displayName || 
      order.customer?.name || 
      order.customer?.firstName || 
      order.shipping?.address?.firstName || 
      order.shipping?.address?.name || 
      (order.shipping?.address?.firstName && order.shipping?.address?.lastName 
        ? `${order.shipping?.address?.firstName} ${order.shipping?.address?.lastName}` 
        : null) ||
      `מספר הזמנה ${order.id.slice(-8)}`;
    
    const orderTotal = order.totals?.grandTotal || order.totals?.merchandiseTotal || 0;
    
    new Notification('הזמנה חדשה התקבלה! 🎉', {
      body: orderTotal > 0 
        ? `${customerName}\nסכום: ₪${orderTotal}\nמספר הזמנה: ${order.id.slice(-8)}`
        : `${customerName}\nמספר הזמנה: ${order.id.slice(-8)}`,
      icon: '/logo192.png', // התאם לנתיב הלוגו שלך
      tag: `order-${order.id}`,
      requireInteraction: true, // ההתרעה תישאר עד שהמשתמש יקליק עליה
    });
  }
  
  // אפשר גם להוסיף התרעה חזותית בממשק
  console.log('🔔 הזמנה חדשה:', order);
}

// פונקציה לבקש הרשאה להתרעות
export async function requestNotificationPermission() {
  if ('Notification' in window) {
    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      console.log('[Notifications] Permission:', permission);
      return permission === 'granted';
    }
    return Notification.permission === 'granted';
  }
  return false;
}
