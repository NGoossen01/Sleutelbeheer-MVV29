export interface Person {
  id: string;
  firstName: string;
  lastName: string;
}

export interface Room {
  id: string;
  name: string;
}

export interface KeyType {
  id: string;
  name: string;
  rooms: string[];
}

export interface Key {
  id: string;
  number: string;
  keyTypeId: string;
  roomIds?: string[];
}

export interface Transaction {
  id: string;
  keyId: string;
  personId: string;
  type: 'ISSUED' | 'RETURNED' | 'LOST' | 'BROKEN' | 'EXTENDED';
  timestamp: number;
  signature: string;
  expirationDate?: number;
}

export interface Database {
  persons: Person[];
  rooms: Room[];
  keyTypes: KeyType[];
  keys: Key[];
  transactions: Transaction[];
}
