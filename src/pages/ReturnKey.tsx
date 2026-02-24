import { useState, useMemo, useEffect } from 'react';
import { useStore, selectIssuedKeys } from '../store/useStore';
import { SignaturePad } from '../components/SignaturePad';
import { useNavigate, useLocation } from 'react-router-dom';
import { KeyRound, CheckCircle2, User, Clock } from 'lucide-react';
import { format } from 'date-fns';

export const ReturnKey = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { returnKey } = useStore();
  const keys = useStore((state) => state.keys);
  const persons = useStore((state) => state.persons);
  const transactions = useStore((state) => state.transactions);

  const issuedKeys = useMemo(() => selectIssuedKeys({ keys, persons, transactions } as any), [keys, persons, transactions]);

  const [selectedKeyId, setSelectedKeyId] = useState('');
  const [signature, setSignature] = useState('');

  useEffect(() => {
    if (location.state?.selectedKeyId) {
      setSelectedKeyId(location.state.selectedKeyId);
    }
  }, [location.state]);

  const selectedIssuedKey = issuedKeys.find((ik) => ik.key.id === selectedKeyId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIssuedKey || !signature) return;

    returnKey(selectedIssuedKey.key.id, selectedIssuedKey.person.id, signature);
    navigate('/');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Sleutel Innemen</h2>
        <p className="text-gray-500 mt-1">Registreer de inname van een uitgegeven sleutel.</p>
      </div>

      {issuedKeys.length === 0 ? (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center">
          <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <KeyRound className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Geen sleutels uitgegeven</h3>
          <p className="text-gray-500 mt-1">Er zijn momenteel geen sleutels die ingenomen kunnen worden.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100 space-y-8">
          
          {/* Key Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <span className="bg-emerald-100 text-emerald-700 w-6 h-6 rounded-full flex items-center justify-center text-sm">1</span>
              Selecteer Sleutel
            </h3>
            
            <div className="grid gap-3">
              {issuedKeys.map(({ key, person, transaction }) => (
                <label
                  key={key.id}
                  className={`flex items-start p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedKeyId === key.id
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-gray-100 hover:border-gray-200 bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="keySelect"
                    value={key.id}
                    checked={selectedKeyId === key.id}
                    onChange={(e) => setSelectedKeyId(e.target.value)}
                    className="sr-only"
                  />
                  <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <p className="font-bold text-gray-900 text-lg">{key.number}</p>
                      <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                        <User className="w-4 h-4" />
                        <span>{person.firstName} {person.lastName}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      Uitgegeven: {format(transaction.timestamp, 'dd-MM HH:mm')}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Signature */}
          {selectedKeyId && (
            <div className="space-y-4 pt-6 border-t border-gray-100 animate-in fade-in slide-in-from-bottom-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <span className="bg-emerald-100 text-emerald-700 w-6 h-6 rounded-full flex items-center justify-center text-sm">2</span>
                Handtekening Inname
              </h3>
              <p className="text-sm text-gray-500">
                Laat <strong>{selectedIssuedKey?.person.firstName} {selectedIssuedKey?.person.lastName}</strong> tekenen voor het inleveren van sleutel <strong>{selectedIssuedKey?.key.number}</strong>.
              </p>
              <SignaturePad onSave={setSignature} onClear={() => setSignature('')} />
            </div>
          )}

          <button
            type="submit"
            disabled={!selectedKeyId || !signature}
            className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-5 h-5" />
            Inname Bevestigen
          </button>
        </form>
      )}
    </div>
  );
};
