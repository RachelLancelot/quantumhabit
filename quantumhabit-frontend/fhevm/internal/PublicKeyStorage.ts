// Use IndexedDB for storing large FHEVM public keys and params
// LocalStorage has a 5-10MB limit which is insufficient for FHEVM data

type FhevmStoredPublicKey = {
  publicKeyId: string;
  publicKey: Uint8Array;
};

type FhevmStoredPublicParams = {
  publicParamsId: string;
  publicParams: Uint8Array;
};

type FhevmInstanceConfigPublicKey = {
  data: Uint8Array | null;
  id: string | null;
};

type FhevmInstanceConfigPublicParams = {
  "2048": {
    publicParamsId: string;
    publicParams: Uint8Array;
  };
};

const DB_NAME = "fhevm-storage";
const DB_VERSION = 1;
const STORE_NAME = "keys-and-params";

let dbPromise: Promise<IDBDatabase> | null = null;

function _getDB(): Promise<IDBDatabase> {
  if (dbPromise) {
    return dbPromise;
  }

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });

  return dbPromise;
}

async function getFromIndexedDB(key: string): Promise<any> {
  try {
    const db = await _getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(key);

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (e) {
    console.error(`Failed to get ${key} from IndexedDB:`, e);
    return null;
  }
}

async function setToIndexedDB(key: string, value: any): Promise<void> {
  try {
    const db = await _getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(value, key);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (e) {
    console.error(`Failed to set ${key} to IndexedDB:`, e);
    throw e;
  }
}

export async function publicKeyStorageGet(aclAddress: `0x${string}`): Promise<{
  publicKey?: FhevmInstanceConfigPublicKey;
  publicParams: FhevmInstanceConfigPublicParams | null;
}> {
  try {
    const pkKey = `fhevm.publicKey.${aclAddress}`;
    const ppKey = `fhevm.publicParams.${aclAddress}`;

    const storedPublicKey: FhevmStoredPublicKey | null = await getFromIndexedDB(pkKey);
    const storedPublicParams: FhevmStoredPublicParams | null = await getFromIndexedDB(ppKey);

    const publicKeyData = storedPublicKey?.publicKey;
    const publicKeyId = storedPublicKey?.publicKeyId;
    const publicParams = storedPublicParams
      ? {
          "2048": storedPublicParams,
        }
      : null;

    let publicKey: FhevmInstanceConfigPublicKey | undefined = undefined;

    if (publicKeyId && publicKeyData) {
      publicKey = {
        id: publicKeyId,
        data: publicKeyData,
      };
    }

    return {
      ...(publicKey !== undefined && { publicKey }),
      publicParams,
    };
  } catch (e) {
    console.error("Failed to get public key/params from IndexedDB:", e);
    return { publicParams: null };
  }
}

export async function publicKeyStorageSet(
  aclAddress: `0x${string}`,
  publicKey: FhevmStoredPublicKey | null,
  publicParams: FhevmStoredPublicParams | null
) {
  try {
    if (publicKey) {
      const pkKey = `fhevm.publicKey.${aclAddress}`;
      await setToIndexedDB(pkKey, publicKey);
      console.log(`[PublicKeyStorage] Saved public key for ${aclAddress}`);
    }

    if (publicParams) {
      const ppKey = `fhevm.publicParams.${aclAddress}`;
      await setToIndexedDB(ppKey, publicParams);
      console.log(`[PublicKeyStorage] Saved public params for ${aclAddress} (size: ${publicParams.publicParams.byteLength} bytes)`);
    }
  } catch (e) {
    console.error("Failed to save public key/params to IndexedDB:", e);
    // Don't throw - allow app to continue even if storage fails
  }
}
