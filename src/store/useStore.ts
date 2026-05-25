/**
 * useStore.ts — Herschreven zonder localStorage en Gemini.
 * State wordt geladen vanuit de MySQL REST API bij opstarten.
 */
import { create } from 'zustand';
import { Database, Person, Key, Transaction, KeyType, Room } from '../types';
import { api } from '../api/client';

interface StoreState extends Database {
  loading: boolean;
  loadAll: () => Promise<void>;
  addPerson: (person: Omit<Person, 'id'>) => Promise<Person>;
  addKey: (key: Omit<Key, 'id'>) => Promise<Key>;
  addKeyType: (keyType: Omit<KeyType, 'id'>) => Promise<KeyType>;
  issueKey: (keyId: string, personId: string, signature: string) => Promise<void>;
  returnKey: (keyId: string, personId: string, signature: string) => Promise<void>;
  extendKey: (keyId: string, personId: string) => Promise<void>;
  reportLost: (keyId: string, personId: string) => Promise<void>;
  reportBroken: (keyId: string, personId: string) => Promise<void>;
  importRooms: (rooms: Room[]) => Promise<void>;
  importKeys: (keys: { number: string; typeName: string }[]) => Promise<void>;
  addRoomToKey: (keyId: string, roomId: string) => Promise<void>;
  removeRoomFromKey: (keyId: string, roomId: string) => Promise<void>;
}

export const useStore = create<StoreState>((set, get) => ({
  loading: false,
  persons: [],
  rooms: [],
  keyTypes: [],
  keys: [],
  transactions: [],

  loadAll: async () => {
    set({ loading: true });
    const [persons, rooms, keyTypes, keys, transactions] = await Promise.all([
      api.getPersons(),
      api.getRooms(),
      api.getKeyTypes(),
      api.getKeys(),
      api.getTransactions(),
    ]);
    set({ persons, rooms, keyTypes, keys, transactions, loading: false });
  },

  addPerson: async (personData) => {
    const newPerson = await api.addPerson(personData);
    set((s) => ({ persons: [...s.persons, newPerson] }));
    return newPerson;
  },

  addKey: async (keyData) => {
    const newKey = await api.addKey(keyData);
    set((s) => ({ keys: [...s.keys, newKey] }));
    return newKey;
  },

  addKeyType: async (keyTypeData) => {
    const newKeyType = await api.addKeyType(keyTypeData);
    set((s) => ({ keyTypes: [...s.keyTypes, newKeyType] }));
    return newKeyType;
  },

  addRoomToKey: async (keyId, roomId) => {
    await api.addRoomToKey(keyId, roomId);
    set((s) => ({
      keys: s.keys.map((k) =>
        k.id === keyId ? { ...k, roomIds: [...(k.roomIds || []), roomId] } : k
      ),
    }));
  },

  removeRoomFromKey: async (keyId, roomId) => {
    await api.removeRoomFromKey(keyId, roomId);
    set((s) => ({
      keys: s.keys.map((k) =>
        k.id === keyId ? { ...k, roomIds: (k.roomIds || []).filter((id) => id !== roomId) } : k
      ),
    }));
  },

  issueKey: async (keyId, personId, signature) => {
    const tx = await api.issueKey({ keyId, personId, signature });
    set((s) => ({ transactions: [...s.transactions, tx] }));
  },

  returnKey: async (keyId, personId, signature) => {
    const tx = await api.returnKey({ keyId, personId, signature });
    set((s) => ({ transactions: [...s.transactions, tx] }));
  },

  extendKey: async (keyId, personId) => {
    const tx = await api.extendKey({ keyId, personId });
    set((s) => ({ transactions: [...s.transactions, tx] }));
  },

  reportLost: async (keyId, personId) => {
    const tx = await api.reportLost({ keyId, personId });
    set((s) => ({ transactions: [...s.transactions, tx] }));
  },

  reportBroken: async (keyId, personId) => {
    const tx = await api.reportBroken({ keyId, personId });
    set((s) => ({ transactions: [...s.transactions, tx] }));
  },

  importRooms: async (newRooms) => {
    await api.importRooms(newRooms);
    const rooms = await api.getRooms();
    set({ rooms });
  },

  importKeys: async (newKeys) => {
    await api.importKeys(newKeys);
    const [keyTypes, keys] = await Promise.all([api.getKeyTypes(), api.getKeys()]);
    set({ keyTypes, keys });
  },
}));

// ─── Selectors (ongewijzigd) ────────────────────────────────────────────────

export const selectIssuedKeys = (state: Pick<StoreState, 'keys' | 'persons' | 'transactions'>) => {
  const { keys, persons, transactions } = state;
  const issued: { key: Key; person: Person; transaction: Transaction }[] = [];
  keys.forEach((key) => {
    const keyTx = transactions.filter((t) => t.keyId === key.id);
    if (keyTx.length > 0) {
      const last = keyTx[keyTx.length - 1];
      if (last.type === 'ISSUED' || last.type === 'EXTENDED') {
        const person = persons.find((p) => p.id === last.personId);
        if (person) issued.push({ key, person, transaction: last });
      }
    }
  });
  return issued;
};

export const selectAvailableKeys = (state: Pick<StoreState, 'keys' | 'transactions'>) => {
  const { keys, transactions } = state;
  return keys.filter((key) => {
    const keyTx = transactions.filter((t) => t.keyId === key.id);
    if (keyTx.length === 0) return true;
    return keyTx[keyTx.length - 1].type === 'RETURNED';
  });
};

export const selectKeyHistory = (state: Pick<StoreState, 'transactions'>, keyId: string) =>
  state.transactions.filter((t) => t.keyId === keyId).sort((a, b) => b.timestamp - a.timestamp);

export const selectPersonKeysHistory = (
  state: Pick<StoreState, 'keys' | 'transactions'>,
  personId: string
) => {
  const { keys, transactions } = state;
  const personTx = transactions.filter((t) => t.personId === personId);
  return keys
    .map((key) => {
      const keyTx = personTx.filter((t) => t.keyId === key.id);
      if (keyTx.length === 0) return null;
      const last = keyTx[keyTx.length - 1];
      return { key, status: last.type, lastTransaction: last };
    })
    .filter(Boolean) as { key: Key; status: Transaction['type']; lastTransaction: Transaction }[];
};
