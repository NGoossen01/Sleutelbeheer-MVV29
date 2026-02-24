import { useState, useMemo } from 'react';
import { useStore, selectAvailableKeys } from '../store/useStore';
import { SignaturePad } from '../components/SignaturePad';
import { useNavigate } from 'react-router-dom';
import { UserPlus, KeyRound, CheckCircle2 } from 'lucide-react';

export const IssueKey = () => {
  const navigate = useNavigate();
  const { persons, keyTypes, addPerson, issueKey } = useStore();
  const keys = useStore((state) => state.keys);
  const transactions = useStore((state) => state.transactions);
  
  const availableKeys = useMemo(() => selectAvailableKeys({ keys, transactions } as any), [keys, transactions]);

  const [selectedPersonId, setSelectedPersonId] = useState('');
  const [selectedKeyId, setSelectedKeyId] = useState('');
  const [signature, setSignature] = useState('');
  
  const [isNewPerson, setIsNewPerson] = useState(false);
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');

  const selectedKey = availableKeys.find((k) => k.id === selectedKeyId);
  const selectedKeyType = selectedKey ? keyTypes.find((t) => t.id === selectedKey.keyTypeId) : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedKeyId || !signature) return;

    let personId = selectedPersonId;

    if (isNewPerson) {
      if (!newFirstName || !newLastName) return;
      const newPerson = addPerson({ firstName: newFirstName, lastName: newLastName });
      personId = newPerson.id;
    }

    if (!personId) return;

    issueKey(selectedKeyId, personId, signature);
    navigate('/');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Sleutel Uitgeven</h2>
        <p className="text-gray-500 mt-1">Registreer een nieuwe sleuteluitgifte.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100 space-y-8">
        
        {/* Person Selection */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <span className="bg-emerald-100 text-emerald-700 w-6 h-6 rounded-full flex items-center justify-center text-sm">1</span>
              Persoon
            </h3>
            <button
              type="button"
              onClick={() => setIsNewPerson(!isNewPerson)}
              className="text-sm text-emerald-600 font-medium flex items-center gap-1 hover:text-emerald-700"
            >
              <UserPlus className="w-4 h-4" />
              {isNewPerson ? 'Bestaande persoon' : 'Nieuwe persoon'}
            </button>
          </div>

          {isNewPerson ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Voornaam</label>
                <input
                  type="text"
                  required
                  value={newFirstName}
                  onChange={(e) => setNewFirstName(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                  placeholder="Bijv. Jan"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Achternaam</label>
                <input
                  type="text"
                  required
                  value={newLastName}
                  onChange={(e) => setNewLastName(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                  placeholder="Bijv. Jansen"
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Selecteer persoon</label>
              <select
                required
                value={selectedPersonId}
                onChange={(e) => setSelectedPersonId(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all bg-white"
              >
                <option value="">Kies een persoon...</option>
                {persons.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.firstName} {p.lastName}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Key Selection */}
        <div className="space-y-4 pt-6 border-t border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <span className="bg-emerald-100 text-emerald-700 w-6 h-6 rounded-full flex items-center justify-center text-sm">2</span>
            Sleutel
          </h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Selecteer beschikbare sleutel</label>
            <select
              required
              value={selectedKeyId}
              onChange={(e) => setSelectedKeyId(e.target.value)}
              className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all bg-white"
            >
              <option value="">Kies een sleutel...</option>
              {availableKeys.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.number}
                </option>
              ))}
            </select>
          </div>

          {selectedKeyType && (
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
              <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <KeyRound className="w-4 h-4" />
                Toegang tot ({selectedKeyType.name}):
              </p>
              <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                {selectedKeyType.rooms.map((room, i) => (
                  <li key={i}>{room}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Signature */}
        <div className="space-y-4 pt-6 border-t border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <span className="bg-emerald-100 text-emerald-700 w-6 h-6 rounded-full flex items-center justify-center text-sm">3</span>
            Handtekening
          </h3>
          <p className="text-sm text-gray-500">Plaats uw handtekening voor ontvangst van de sleutel.</p>
          <SignaturePad onSave={setSignature} onClear={() => setSignature('')} />
        </div>

        <button
          type="submit"
          disabled={!signature || (!selectedPersonId && !isNewPerson) || !selectedKeyId || (isNewPerson && (!newFirstName || !newLastName))}
          className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          <CheckCircle2 className="w-5 h-5" />
          Uitgifte Bevestigen
        </button>
      </form>
    </div>
  );
};
