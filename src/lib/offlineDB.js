// IndexedDB wrapper for offline data storage
const DB_NAME = 'SilaOfflineDB';
const DB_VERSION = 1;

const STORES = {
  cabins: 'cabins',
  transports: 'transports',
  userProfile: 'userProfile',
  bookings: 'bookings',
  chats: 'chats',
  messages: 'messages',
  queuedActions: 'queuedActions',
};

let db = null;

async function initDB() {
  if (db) return db;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = event.target.result;

      Object.values(STORES).forEach((storeName) => {
        if (!database.objectStoreNames.contains(storeName)) {
          const store = database.createObjectStore(storeName, { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      });
    };
  });
}

export async function cacheData(storeName, data, ttl = 24 * 60 * 60 * 1000) {
  const db = await initDB();
  const transaction = db.transaction([storeName], 'readwrite');
  const store = transaction.objectStore(storeName);

  const item = {
    ...data,
    id: data.id || `${storeName}_${Date.now()}`,
    timestamp: Date.now(),
    expiresAt: Date.now() + ttl,
  };

  return new Promise((resolve, reject) => {
    const request = store.put(item);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(item);
  });
}

export async function getCachedData(storeName, id) {
  const db = await initDB();
  const transaction = db.transaction([storeName], 'readonly');
  const store = transaction.objectStore(storeName);

  return new Promise((resolve, reject) => {
    const request = store.get(id);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const item = request.result;
      if (item && item.expiresAt > Date.now()) {
        resolve(item);
      } else {
        resolve(null);
      }
    };
  });
}

export async function getAllCachedData(storeName) {
  const db = await initDB();
  const transaction = db.transaction([storeName], 'readonly');
  const store = transaction.objectStore(storeName);

  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const items = request.result.filter((item) => !item.expiresAt || item.expiresAt > Date.now());
      resolve(items);
    };
  });
}

export async function clearCachedData(storeName) {
  const db = await initDB();
  const transaction = db.transaction([storeName], 'readwrite');
  const store = transaction.objectStore(storeName);

  return new Promise((resolve, reject) => {
    const request = store.clear();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

// Queued actions for offline operations
export async function queueAction(action) {
  const actionWithMeta = {
    ...action,
    id: action.id || `action_${Date.now()}_${Math.random()}`,
    timestamp: Date.now(),
    status: 'pending',
    retries: 0,
  };

  return cacheData(STORES.queuedActions, actionWithMeta, 30 * 24 * 60 * 60 * 1000); // 30 days
}

export async function getQueuedActions() {
  return getAllCachedData(STORES.queuedActions);
}

export async function updateQueuedActionStatus(actionId, status) {
  const db = await initDB();
  const transaction = db.transaction([STORES.queuedActions], 'readwrite');
  const store = transaction.objectStore(STORES.queuedActions);

  return new Promise((resolve, reject) => {
    const request = store.get(actionId);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const action = request.result;
      if (action) {
        action.status = status;
        const updateRequest = store.put(action);
        updateRequest.onerror = () => reject(updateRequest.error);
        updateRequest.onsuccess = () => resolve(action);
      } else {
        reject(new Error('Action not found'));
      }
    };
  });
}

export async function removeQueuedAction(actionId) {
  const db = await initDB();
  const transaction = db.transaction([STORES.queuedActions], 'readwrite');
  const store = transaction.objectStore(STORES.queuedActions);

  return new Promise((resolve, reject) => {
    const request = store.delete(actionId);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}