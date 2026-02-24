import { useState, useRef } from 'react';
import { useStore } from '../store/useStore';
import { Users, KeyRound, Tag, Plus, Upload, Download, DoorOpen, X } from 'lucide-react';

const KeyRoomsManager = ({ keyItem }: { keyItem: any }) => {
  const { rooms, addRoomToKey, removeRoomFromKey } = useStore();
  const [selectedRoomId, setSelectedRoomId] = useState('');

  const handleAddRoom = () => {
    if (selectedRoomId) {
      addRoomToKey(keyItem.id, selectedRoomId);
      setSelectedRoomId('');
    }
  };

  const keyRooms = (keyItem.roomIds || []).map((id: string) => rooms.find(r => r.id === id)).filter(Boolean);
  const availableRooms = rooms.filter(r => !(keyItem.roomIds || []).includes(r.id));

  return (
    <div className="mt-3 pt-3 border-t border-gray-100">
      <p className="text-xs font-semibold text-gray-500 mb-2">Extra Ruimtes voor deze sleutel:</p>
      
      {keyRooms.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {keyRooms.map((r: any) => (
            <span key={r.id} className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-md border border-blue-100">
              {r.name}
              <button onClick={() => removeRoomFromKey(keyItem.id, r.id)} className="hover:text-blue-900">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <select
          value={selectedRoomId}
          onChange={(e) => setSelectedRoomId(e.target.value)}
          className="flex-1 px-2 py-1 text-xs rounded-md border border-gray-200 focus:ring-1 focus:ring-emerald-500 outline-none bg-white"
        >
          <option value="">Selecteer ruimte...</option>
          {availableRooms.map(r => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>
        <button
          onClick={handleAddRoom}
          disabled={!selectedRoomId}
          className="px-2 py-1 bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 rounded-md text-xs font-medium transition-colors"
        >
          Toevoegen
        </button>
      </div>
    </div>
  );
};

export const Manage = () => {
  const { persons, keys, keyTypes, rooms, addKeyType, addKey, importRooms, importKeys } = useStore();

  const [newKeyTypeName, setNewKeyTypeName] = useState('');
  const [newKeyTypeRooms, setNewKeyTypeRooms] = useState('');

  const [newKeyNumber, setNewKeyNumber] = useState('');
  const [newKeyTypeId, setNewKeyTypeId] = useState('');

  const keysFileInputRef = useRef<HTMLInputElement>(null);
  const roomsFileInputRef = useRef<HTMLInputElement>(null);

  const handleAddKeyType = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyTypeName || !newKeyTypeRooms) return;
    
    addKeyType({
      name: newKeyTypeName,
      rooms: newKeyTypeRooms.split(',').map(r => r.trim()).filter(Boolean)
    });
    
    setNewKeyTypeName('');
    setNewKeyTypeRooms('');
  };

  const handleAddKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyNumber || !newKeyTypeId) return;
    
    addKey({
      number: newKeyNumber,
      keyTypeId: newKeyTypeId
    });
    
    setNewKeyNumber('');
    setNewKeyTypeId('');
  };

  const handleDownloadKeysTemplate = () => {
    const csv = "SleutelID,SleutelType\nA-01,Type A\nA-02,Type A\nB-01,Type B\n";
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sleutels_template.csv';
    a.click();
  };

  const handleDownloadRoomsTemplate = () => {
    const csv = "RuimteID,Naam\nRUIMTE001,Kleedkamer 1\nRUIMTE002,Kleedkamer 2\nRUIMTE003,Scheidsrechter\n";
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ruimtes_template.csv';
    a.click();
  };

  const handleImportKeys = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
      const newKeys = [];
      // skip header
      for (let i = 1; i < lines.length; i++) {
        const [number, typeName] = lines[i].split(',');
        if (number && typeName) {
          newKeys.push({ number: number.trim(), typeName: typeName.trim() });
        }
      }
      if (newKeys.length > 0) {
        importKeys(newKeys);
        alert(`${newKeys.length} sleutels succesvol geïmporteerd!`);
      } else {
        alert('Geen geldige sleutels gevonden in het bestand.');
      }
      if (keysFileInputRef.current) keysFileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const handleImportRooms = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
      const newRooms = [];
      // skip header
      for (let i = 1; i < lines.length; i++) {
        const [id, name] = lines[i].split(',');
        if (id && name && id.trim().startsWith('RUIMTE')) {
          newRooms.push({ id: id.trim(), name: name.trim() });
        }
      }
      if (newRooms.length > 0) {
        importRooms(newRooms);
        alert(`${newRooms.length} ruimtes succesvol geïmporteerd!`);
      } else {
        alert('Geen geldige ruimtes gevonden in het bestand. Zorg dat de RuimteID begint met "RUIMTE".');
      }
      if (roomsFileInputRef.current) roomsFileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Beheer</h2>
        <p className="text-gray-500 mt-1">Overzicht en beheer van stamgegevens.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Rooms */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
            <div className="flex items-center gap-2">
              <DoorOpen className="w-5 h-5 text-gray-600" />
              <h3 className="font-bold text-gray-900">Ruimtes ({rooms.length})</h3>
            </div>
          </div>
          
          <div className="p-4 border-b border-gray-100 bg-white space-y-3">
            <button
              onClick={handleDownloadRoomsTemplate}
              className="w-full py-2 bg-gray-50 text-gray-700 hover:bg-gray-100 font-medium rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" /> CSV Template
            </button>
            <input
              type="file"
              accept=".csv"
              className="hidden"
              ref={roomsFileInputRef}
              onChange={handleImportRooms}
            />
            <button
              onClick={() => roomsFileInputRef.current?.click()}
              className="w-full py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-medium rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
            >
              <Upload className="w-4 h-4" /> Importeer CSV
            </button>
          </div>

          <div className="p-4 space-y-3 flex-1 overflow-y-auto max-h-[400px]">
            {rooms.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">Geen ruimtes gevonden.</p>
            ) : (
              rooms.map((r) => (
                <div key={r.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="font-bold text-gray-900">{r.id}</p>
                  <p className="text-sm text-gray-600">{r.name}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Key Types */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-100 flex items-center gap-2 bg-gray-50">
            <Tag className="w-5 h-5 text-gray-600" />
            <h3 className="font-bold text-gray-900">Sleuteltypes ({keyTypes.length})</h3>
          </div>
          
          <div className="p-4 border-b border-gray-100 bg-white">
            <form onSubmit={handleAddKeyType} className="space-y-3">
              <div>
                <input
                  type="text"
                  placeholder="Naam (bijv. Type A)"
                  value={newKeyTypeName}
                  onChange={(e) => setNewKeyTypeName(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                  required
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Ruimtes (komma gescheiden)"
                  value={newKeyTypeRooms}
                  onChange={(e) => setNewKeyTypeRooms(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-medium rounded-lg text-sm transition-colors flex items-center justify-center gap-1"
              >
                <Plus className="w-4 h-4" /> Toevoegen
              </button>
            </form>
          </div>

          <div className="p-4 space-y-3 flex-1 overflow-y-auto max-h-[400px]">
            {keyTypes.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">Geen sleuteltypes gevonden.</p>
            ) : (
              keyTypes.map((t) => (
                <div key={t.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="font-bold text-gray-900 mb-1">{t.name}</p>
                  <p className="text-xs text-gray-500">{t.rooms.join(', ')}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Keys */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-100 flex items-center gap-2 bg-gray-50">
            <KeyRound className="w-5 h-5 text-gray-600" />
            <h3 className="font-bold text-gray-900">Sleutels ({keys.length})</h3>
          </div>

          <div className="p-4 border-b border-gray-100 bg-white space-y-3">
            <div className="flex gap-2">
              <button
                onClick={handleDownloadKeysTemplate}
                className="flex-1 py-2 bg-gray-50 text-gray-700 hover:bg-gray-100 font-medium rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" /> Template
              </button>
              <input
                type="file"
                accept=".csv"
                className="hidden"
                ref={keysFileInputRef}
                onChange={handleImportKeys}
              />
              <button
                onClick={() => keysFileInputRef.current?.click()}
                className="flex-1 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-medium rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
              >
                <Upload className="w-4 h-4" /> Importeer
              </button>
            </div>

            <form onSubmit={handleAddKey} className="space-y-3 pt-3 border-t border-gray-100">
              <div>
                <input
                  type="text"
                  placeholder="Sleutelnummer (bijv. A-01)"
                  value={newKeyNumber}
                  onChange={(e) => setNewKeyNumber(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                  required
                />
              </div>
              <div>
                <select
                  value={newKeyTypeId}
                  onChange={(e) => setNewKeyTypeId(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                  required
                >
                  <option value="">Selecteer type...</option>
                  {keyTypes.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                disabled={keyTypes.length === 0}
                className="w-full py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:bg-gray-50 disabled:text-gray-400 font-medium rounded-lg text-sm transition-colors flex items-center justify-center gap-1"
              >
                <Plus className="w-4 h-4" /> Toevoegen
              </button>
            </form>
          </div>

          <div className="p-4 space-y-3 flex-1 overflow-y-auto max-h-[400px]">
            {keys.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">Geen sleutels gevonden.</p>
            ) : (
              keys.map((k) => {
                const type = keyTypes.find(t => t.id === k.keyTypeId);
                return (
                  <div key={k.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex flex-col">
                    <div className="flex justify-between items-center">
                      <p className="font-bold text-gray-900">{k.number}</p>
                      <span className="text-xs font-medium bg-gray-200 text-gray-700 px-2 py-1 rounded-md">
                        {type?.name || 'Onbekend'}
                      </span>
                    </div>
                    <KeyRoomsManager keyItem={k} />
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Persons */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-100 flex items-center gap-2 bg-gray-50">
            <Users className="w-5 h-5 text-gray-600" />
            <h3 className="font-bold text-gray-900">Personen ({persons.length})</h3>
          </div>
          <div className="p-4 space-y-3 flex-1 overflow-y-auto max-h-[400px]">
            {persons.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">Geen personen gevonden.</p>
            ) : (
              persons.map((p) => (
                <div key={p.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="font-medium text-gray-900">{p.firstName} {p.lastName}</p>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
