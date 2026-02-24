import { useState, useMemo } from 'react';
import { useStore, selectIssuedKeys, selectPersonKeysHistory } from '../store/useStore';
import { KeyRound, User, Clock, AlertTriangle, XCircle, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { clsx } from 'clsx';
import { useNavigate } from 'react-router-dom';

export const Search = () => {
  const navigate = useNavigate();
  const { persons, keys, keyTypes, transactions, reportLost, reportBroken } = useStore();
  const issuedKeys = useMemo(() => selectIssuedKeys({ keys, persons, transactions } as any), [keys, persons, transactions]);

  const [searchType, setSearchType] = useState<'person' | 'key'>('person');
  const [selectedPersonId, setSelectedPersonId] = useState('');
  const [selectedKeyId, setSelectedKeyId] = useState('');

  const personKeyHistory = useMemo(() => {
    if (!selectedPersonId) return [];
    return selectPersonKeysHistory({ keys, transactions } as any, selectedPersonId);
  }, [keys, transactions, selectedPersonId]);

  const keyPerson = useMemo(() => {
    if (!selectedKeyId) return null;
    return issuedKeys.find(ik => ik.key.id === selectedKeyId);
  }, [issuedKeys, selectedKeyId]);

  const selectedKeyType = useMemo(() => {
    if (!selectedKeyId) return null;
    const key = keys.find(k => k.id === selectedKeyId);
    if (!key) return null;
    return keyTypes.find(t => t.id === key.keyTypeId);
  }, [keys, keyTypes, selectedKeyId]);

  const handleLost = (keyId: string, personId: string) => {
    if (confirm('Weet u zeker dat deze sleutel verloren is?')) {
      reportLost(keyId, personId);
      navigate('/issue');
    }
  };

  const handleBroken = (keyId: string, personId: string) => {
    if (confirm('Weet u zeker dat deze sleutel kapot is?')) {
      reportBroken(keyId, personId);
      navigate('/issue');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Zoeken & Beheren</h2>
        <p className="text-gray-500 mt-1">Zoek op persoon of sleutel om de huidige status te bekijken of acties uit te voeren.</p>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
        {/* Tabs */}
        <div className="flex p-1 bg-gray-100 rounded-xl w-fit">
          <button
            onClick={() => setSearchType('person')}
            className={clsx(
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2",
              searchType === 'person' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            )}
          >
            <User className="w-4 h-4" />
            Zoek op Persoon
          </button>
          <button
            onClick={() => setSearchType('key')}
            className={clsx(
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2",
              searchType === 'key' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            )}
          >
            <KeyRound className="w-4 h-4" />
            Zoek op Sleutel
          </button>
        </div>

        {/* Search by Person */}
        {searchType === 'person' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Selecteer een persoon</label>
              <select
                value={selectedPersonId}
                onChange={(e) => setSelectedPersonId(e.target.value)}
                className="w-full max-w-md px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all bg-white"
              >
                <option value="">Kies een persoon...</option>
                {persons.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.firstName} {p.lastName}
                  </option>
                ))}
              </select>
            </div>

            {selectedPersonId && (
              <div className="pt-4 border-t border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Sleutelgeschiedenis ({personKeyHistory.length})</h3>
                {personKeyHistory.length > 0 ? (
                  <div className="grid gap-3">
                    {personKeyHistory.map(({ key, status, lastTransaction }) => {
                      const isIssued = status === 'ISSUED' || status === 'EXTENDED';
                      const isLost = status === 'LOST';
                      const isBroken = status === 'BROKEN';
                      const isReturned = status === 'RETURNED';

                      return (
                        <div key={key.id} className={clsx(
                          "p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4",
                          isIssued ? "bg-emerald-50 border-emerald-100" :
                          isLost ? "bg-red-50 border-red-100" :
                          isBroken ? "bg-orange-50 border-orange-100" :
                          "bg-gray-50 border-gray-100"
                        )}>
                          <div className="flex items-center gap-3">
                            <div className={clsx(
                              "p-2 rounded-lg border",
                              isIssued ? "bg-white border-emerald-200 text-emerald-600" :
                              isLost ? "bg-white border-red-200 text-red-600" :
                              isBroken ? "bg-white border-orange-200 text-orange-600" :
                              "bg-white border-gray-200 text-gray-400"
                            )}>
                              {isLost ? <AlertTriangle className="w-5 h-5" /> :
                               isBroken ? <XCircle className="w-5 h-5" /> :
                               <KeyRound className="w-5 h-5" />}
                            </div>
                            <div>
                              <p className="font-bold text-gray-900 text-lg">{key.number}</p>
                              <p className={clsx(
                                "text-sm font-medium",
                                isIssued ? "text-emerald-700" :
                                isLost ? "text-red-700" :
                                isBroken ? "text-orange-700" :
                                "text-gray-500"
                              )}>
                                {isIssued ? 'In bezit' :
                                 isLost ? 'Verloren' :
                                 isBroken ? 'Kapot' :
                                 'Ingenomen'}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex flex-col items-end gap-2">
                            <div className="flex items-center gap-2 text-sm text-gray-500 bg-white px-3 py-1.5 rounded-lg border border-gray-200">
                              <Clock className="w-4 h-4" />
                              <span>Laatste update: {format(lastTransaction.timestamp, 'dd MMM yyyy')}</span>
                            </div>
                            
                            {isIssued && (
                              <div className="flex gap-2 mt-2">
                                <button
                                  onClick={() => handleLost(key.id, selectedPersonId)}
                                  className="text-xs px-3 py-1.5 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg font-medium transition-colors"
                                >
                                  Verloren melden
                                </button>
                                <button
                                  onClick={() => handleBroken(key.id, selectedPersonId)}
                                  className="text-xs px-3 py-1.5 bg-orange-100 text-orange-700 hover:bg-orange-200 rounded-lg font-medium transition-colors"
                                >
                                  Kapot melden
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-gray-500">Deze persoon heeft nog geen sleutelgeschiedenis.</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Search by Key */}
        {searchType === 'key' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Selecteer een sleutel</label>
              <select
                value={selectedKeyId}
                onChange={(e) => setSelectedKeyId(e.target.value)}
                className="w-full max-w-md px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all bg-white"
              >
                <option value="">Kies een sleutel...</option>
                {keys.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.number}
                  </option>
                ))}
              </select>
            </div>

            {selectedKeyId && (
              <div className="pt-4 border-t border-gray-100 space-y-6">
                
                {selectedKeyType && (
                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                    <h4 className="text-sm font-bold text-blue-900 mb-2">Toegang ({selectedKeyType.name})</h4>
                    <ul className="list-disc list-inside text-sm text-blue-800 space-y-1">
                      {selectedKeyType.rooms.map((room, i) => (
                        <li key={i}>{room}</li>
                      ))}
                      {(() => {
                        const key = keys.find(k => k.id === selectedKeyId);
                        if (!key || !key.roomIds || key.roomIds.length === 0) return null;
                        
                        // We need access to rooms from store to get the names
                        // Let's import rooms from useStore at the top of the component
                        const { rooms } = useStore.getState();
                        const extraRooms = key.roomIds.map(id => rooms.find(r => r.id === id)).filter(Boolean);
                        
                        if (extraRooms.length === 0) return null;
                        
                        return (
                          <>
                            <li className="list-none mt-2 pt-2 border-t border-blue-200 font-semibold text-xs uppercase tracking-wider text-blue-700">Extra Ruimtes:</li>
                            {extraRooms.map((r: any) => (
                              <li key={r.id} className="text-blue-900 font-medium">{r.name}</li>
                            ))}
                          </>
                        );
                      })()}
                    </ul>
                  </div>
                )}

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Huidige status</h3>
                  {keyPerson ? (
                    <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-white p-2 rounded-lg border border-emerald-200">
                          <User className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                          <p className="text-sm text-emerald-600 font-medium">In bezit van</p>
                          <p className="font-bold text-gray-900 text-lg">{keyPerson.person.firstName} {keyPerson.person.lastName}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-2 text-sm text-emerald-700 bg-white px-3 py-1.5 rounded-lg border border-emerald-200">
                          <Clock className="w-4 h-4" />
                          <span>Sinds: {format(keyPerson.transaction.timestamp, 'dd MMM yyyy')}</span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleLost(selectedKeyId, keyPerson.person.id)}
                            className="text-xs px-3 py-1.5 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg font-medium transition-colors"
                          >
                            Verloren melden
                          </button>
                          <button
                            onClick={() => handleBroken(selectedKeyId, keyPerson.person.id)}
                            className="text-xs px-3 py-1.5 bg-orange-100 text-orange-700 hover:bg-orange-200 rounded-lg font-medium transition-colors"
                          >
                            Kapot melden
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex items-center gap-3">
                      <div className="bg-white p-2 rounded-lg border border-gray-200">
                        <KeyRound className="w-5 h-5 text-gray-400" />
                      </div>
                      <p className="text-gray-600 font-medium">Deze sleutel is momenteel beschikbaar (niet uitgegeven).</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
