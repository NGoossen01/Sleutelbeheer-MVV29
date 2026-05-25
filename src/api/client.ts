// Centrale API client — alle calls gaan via /api/ (Nginx reverse proxy)
const BASE = '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) throw new Error(`API fout ${res.status}: ${await res.text()}`);
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  // Persons
  getPersons:    ()                                    => request<any[]>('/persons'),
  addPerson:     (body: { firstName: string; lastName: string }) => request<any>('/persons', { method: 'POST', body: JSON.stringify(body) }),

  // Rooms
  getRooms:      ()                                    => request<any[]>('/rooms'),
  importRooms:   (rooms: any[])                        => request<any>('/rooms/import',   { method: 'POST', body: JSON.stringify({ rooms }) }),

  // Key types
  getKeyTypes:   ()                                    => request<any[]>('/keytypes'),
  addKeyType:    (body: { name: string; rooms: string[] }) => request<any>('/keytypes', { method: 'POST', body: JSON.stringify(body) }),

  // Keys
  getKeys:       ()                                    => request<any[]>('/keys'),
  addKey:        (body: { number: string; keyTypeId: string }) => request<any>('/keys', { method: 'POST', body: JSON.stringify(body) }),
  importKeys:    (keys: any[])                         => request<any>('/keys/import',    { method: 'POST', body: JSON.stringify({ keys }) }),
  addRoomToKey:  (keyId: string, roomId: string)       => request<void>(`/keys/${keyId}/rooms/${roomId}`, { method: 'POST' }),
  removeRoomFromKey: (keyId: string, roomId: string)   => request<void>(`/keys/${keyId}/rooms/${roomId}`, { method: 'DELETE' }),

  // Transactions
  getTransactions: ()                                  => request<any[]>('/transactions'),
  issueKey:      (body: { keyId: string; personId: string; signature: string }) => request<any>('/transactions/issue',  { method: 'POST', body: JSON.stringify(body) }),
  returnKey:     (body: { keyId: string; personId: string; signature: string }) => request<any>('/transactions/return', { method: 'POST', body: JSON.stringify(body) }),
  extendKey:     (body: { keyId: string; personId: string })                    => request<any>('/transactions/extend', { method: 'POST', body: JSON.stringify(body) }),
  reportLost:    (body: { keyId: string; personId: string })                    => request<any>('/transactions/lost',   { method: 'POST', body: JSON.stringify(body) }),
  reportBroken:  (body: { keyId: string; personId: string })                    => request<any>('/transactions/broken', { method: 'POST', body: JSON.stringify(body) }),
};
