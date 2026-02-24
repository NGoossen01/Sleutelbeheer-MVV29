import { create } from 'zustand';
import { Database, Person, Key, Transaction, KeyType, Room } from '../types';

const DB_KEY = 'voetbalclub_sleutelbeheer_v2';

const defaultDB: Database = {
  persons: [],
  rooms: [],
  keyTypes: [],
  keys: [],
  transactions: [],
};

const loadDB = (): Database => {
  const data = localStorage.getItem(DB_KEY);
  if (data) {
    try {
      const parsed = JSON.parse(data);
      // Ensure rooms array exists for backward compatibility
      if (!parsed.rooms) parsed.rooms = [];
      return parsed;
    } catch (e) {
      console.error('Failed to parse DB from localStorage', e);
    }
  }
  return defaultDB;
};

const saveDB = (db: Database) => {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
};

const getNextAugust31st = () => {
  const date = new Date();
  const year = date.getFullYear();
  const aug31ThisYear = new Date(year, 7, 31).getTime(); // Month is 0-indexed, 7 is August
  if (date.getTime() >= aug31ThisYear) {
    return new Date(year + 1, 7, 31).getTime();
  }
  return aug31ThisYear;
};

interface StoreState extends Database {
  addPerson: (person: Omit<Person, 'id'>) => Person;
  addKey: (key: Omit<Key, 'id'>) => Key;
  addKeyType: (keyType: Omit<KeyType, 'id'>) => KeyType;
  issueKey: (keyId: string, personId: string, signature: string) => void;
  returnKey: (keyId: string, personId: string, signature: string) => void;
  extendKey: (keyId: string, personId: string) => void;
  reportLost: (keyId: string, personId: string) => void;
  reportBroken: (keyId: string, personId: string) => void;
  importRooms: (rooms: Room[]) => void;
  importKeys: (keys: { number: string; typeName: string }[]) => void;
  addRoomToKey: (keyId: string, roomId: string) => void;
  removeRoomFromKey: (keyId: string, roomId: string) => void;
}

export const useStore = create<StoreState>((set, get) => ({
  ...loadDB(),
  
  addPerson: (personData) => {
    const newPerson: Person = { ...personData, id: `p_${Date.now()}` };
    set((state) => {
      const newState = { ...state, persons: [...state.persons, newPerson] };
      saveDB(newState);
      return newState;
    });
    return newPerson;
  },

  addKey: (keyData) => {
    const newKey: Key = { ...keyData, id: `k_${Date.now()}` };
    set((state) => {
      const newState = { ...state, keys: [...state.keys, newKey] };
      saveDB(newState);
      return newState;
    });
    return newKey;
  },

  addKeyType: (keyTypeData) => {
    const newKeyType: KeyType = { ...keyTypeData, id: `t_${Date.now()}` };
    set((state) => {
      const newState = { ...state, keyTypes: [...state.keyTypes, newKeyType] };
      saveDB(newState);
      return newState;
    });
    return newKeyType;
  },

  addRoomToKey: (keyId, roomId) => {
    set((state) => {
      const keys = state.keys.map(k => {
        if (k.id === keyId) {
          const roomIds = k.roomIds || [];
          if (!roomIds.includes(roomId)) {
            return { ...k, roomIds: [...roomIds, roomId] };
          }
        }
        return k;
      });
      const newState = { ...state, keys };
      saveDB(newState);
      return newState;
    });
  },

  removeRoomFromKey: (keyId, roomId) => {
    set((state) => {
      const keys = state.keys.map(k => {
        if (k.id === keyId) {
          const roomIds = (k.roomIds || []).filter(id => id !== roomId);
          return { ...k, roomIds };
        }
        return k;
      });
      const newState = { ...state, keys };
      saveDB(newState);
      return newState;
    });
  },

  issueKey: (keyId, personId, signature) => {
    const newTransaction: Transaction = {
      id: `tr_${Date.now()}`,
      keyId,
      personId,
      type: 'ISSUED',
      timestamp: Date.now(),
      signature,
      expirationDate: getNextAugust31st(),
    };
    set((state) => {
      const newState = { ...state, transactions: [...state.transactions, newTransaction] };
      saveDB(newState);
      return newState;
    });
  },

  returnKey: (keyId, personId, signature) => {
    const newTransaction: Transaction = {
      id: `tr_${Date.now()}`,
      keyId,
      personId,
      type: 'RETURNED',
      timestamp: Date.now(),
      signature,
    };
    set((state) => {
      const newState = { ...state, transactions: [...state.transactions, newTransaction] };
      saveDB(newState);
      return newState;
    });
  },

  extendKey: (keyId, personId) => {
    const newTransaction: Transaction = {
      id: `tr_${Date.now()}`,
      keyId,
      personId,
      type: 'EXTENDED',
      timestamp: Date.now(),
      signature: '',
      expirationDate: new Date(new Date().getFullYear() + 1, 7, 31).getTime(),
    };
    set((state) => {
      const newState = { ...state, transactions: [...state.transactions, newTransaction] };
      saveDB(newState);
      return newState;
    });
  },

  reportLost: (keyId, personId) => {
    const newTransaction: Transaction = {
      id: `tr_${Date.now()}`,
      keyId,
      personId,
      type: 'LOST',
      timestamp: Date.now(),
      signature: '',
    };
    set((state) => {
      const newState = { ...state, transactions: [...state.transactions, newTransaction] };
      saveDB(newState);
      return newState;
    });
  },

  reportBroken: (keyId, personId) => {
    const newTransaction: Transaction = {
      id: `tr_${Date.now()}`,
      keyId,
      personId,
      type: 'BROKEN',
      timestamp: Date.now(),
      signature: '',
    };
    set((state) => {
      const newState = { ...state, transactions: [...state.transactions, newTransaction] };
      saveDB(newState);
      return newState;
    });
  },

  importRooms: (newRooms) => {
    set((state) => {
      const existingIds = new Set(state.rooms.map(r => r.id));
      const addedRooms = newRooms.filter(r => !existingIds.has(r.id));
      const newState = { ...state, rooms: [...state.rooms, ...addedRooms] };
      saveDB(newState);
      return newState;
    });
  },

  importKeys: (newKeys) => {
    set((state) => {
      let currentKeyTypes = [...state.keyTypes];
      const addedKeys: Key[] = [];

      newKeys.forEach(nk => {
        let kType = currentKeyTypes.find(t => t.name === nk.typeName);
        if (!kType) {
          kType = { id: `t_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, name: nk.typeName, rooms: [] };
          currentKeyTypes.push(kType);
        }

        const keyExists = state.keys.some(k => k.number === nk.number) || addedKeys.some(k => k.number === nk.number);
        if (!keyExists) {
          addedKeys.push({
            id: `k_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            number: nk.number,
            keyTypeId: kType.id
          });
        }
      });

      const newState = { 
        ...state, 
        keyTypes: currentKeyTypes,
        keys: [...state.keys, ...addedKeys] 
      };
      saveDB(newState);
      return newState;
    });
  },
}));

// Selectors
export const selectIssuedKeys = (state: StoreState) => {
  const { keys, persons, transactions } = state;
  const issued: { key: Key; person: Person; transaction: Transaction }[] = [];

  keys.forEach((key) => {
    const keyTransactions = transactions.filter((t) => t.keyId === key.id);
    if (keyTransactions.length > 0) {
      const lastTransaction = keyTransactions[keyTransactions.length - 1];
      if (lastTransaction.type === 'ISSUED' || lastTransaction.type === 'EXTENDED') {
        const person = persons.find((p) => p.id === lastTransaction.personId);
        if (person) {
          issued.push({ key, person, transaction: lastTransaction });
        }
      }
    }
  });

  return issued;
};

export const selectAvailableKeys = (state: StoreState) => {
  const { keys, transactions } = state;
  return keys.filter((key) => {
    const keyTransactions = transactions.filter((t) => t.keyId === key.id);
    if (keyTransactions.length === 0) return true;
    const lastTransaction = keyTransactions[keyTransactions.length - 1];
    return lastTransaction.type === 'RETURNED';
  });
};

export const selectKeyHistory = (state: StoreState, keyId: string) => {
  const { transactions } = state;
  return transactions.filter((t) => t.keyId === keyId).sort((a, b) => b.timestamp - a.timestamp);
};

export const selectPersonKeysHistory = (state: StoreState, personId: string) => {
  const { keys, transactions } = state;
  const personTransactions = transactions.filter((t) => t.personId === personId);
  
  const keyStatuses: { key: Key; status: Transaction['type']; lastTransaction: Transaction }[] = [];

  keys.forEach((key) => {
    const keyTrans = personTransactions.filter((t) => t.keyId === key.id);
    if (keyTrans.length > 0) {
      const lastTrans = keyTrans[keyTrans.length - 1];
      // Only include if the last transaction for this key for this person is ISSUED, EXTENDED, LOST, or BROKEN
      // If it's RETURNED, they don't have it anymore and it's not lost/broken, but maybe we want to show it in history?
      // "Daarnaast wil ik het overzicht van sleutels per persoon ook de verloren of kapot gemaakte sleutels zien."
      // Let's include all keys they ever interacted with, but show the latest status for that person.
      keyStatuses.push({ key, status: lastTrans.type, lastTransaction: lastTrans });
    }
  });

  return keyStatuses;
};
