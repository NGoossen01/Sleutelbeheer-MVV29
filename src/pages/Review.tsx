import { useMemo } from 'react';
import { useStore, selectIssuedKeys } from '../store/useStore';
import { KeyRound, User, Clock, AlertCircle, CheckCircle, RotateCcw } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { useNavigate } from 'react-router-dom';

export const Review = () => {
  const navigate = useNavigate();
  const { keys, persons, transactions, extendKey, returnKey } = useStore();
  const issuedKeys = useMemo(() => selectIssuedKeys({ keys, persons, transactions } as any), [keys, persons, transactions]);

  const expiringKeys = useMemo(() => {
    const now = Date.now();
    return issuedKeys.filter(ik => {
      if (!ik.transaction.expirationDate) return false;
      const daysUntilExpiration = differenceInDays(ik.transaction.expirationDate, now);
      // Show keys that expire within 31 days, or are already expired
      return daysUntilExpiration <= 31;
    }).sort((a, b) => (a.transaction.expirationDate || 0) - (b.transaction.expirationDate || 0));
  }, [issuedKeys]);

  const handleExtend = (keyId: string, personId: string) => {
    if (confirm('Weet u zeker dat u deze sleutel met een jaar wilt verlengen?')) {
      extendKey(keyId, personId);
    }
  };

  const handleReturn = (keyId: string) => {
    // Redirect to return page, maybe we can pass the keyId via state or just let them select it there
    // Since ReturnKey page expects the user to select a key, we can just navigate there.
    // For better UX, we could pass the keyId in the URL or state, but for now just navigating is fine.
    navigate('/return', { state: { selectedKeyId: keyId } });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Review (Verlengen of Innemen)</h2>
        <p className="text-gray-500 mt-1">Sleutels die binnen 31 dagen verlopen (of al verlopen zijn).</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center gap-3 bg-amber-50">
          <AlertCircle className="w-6 h-6 text-amber-600" />
          <h3 className="text-lg font-bold text-amber-900">Verlopen binnenkort ({expiringKeys.length})</h3>
        </div>
        
        {expiringKeys.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Er zijn momenteel geen sleutels die binnenkort verlopen.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {expiringKeys.map(({ key, person, transaction }) => {
              const daysLeft = differenceInDays(transaction.expirationDate!, Date.now());
              const isExpired = daysLeft < 0;

              return (
                <div key={key.id} className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl border ${isExpired ? 'bg-red-50 border-red-100' : 'bg-amber-50 border-amber-100'}`}>
                      <KeyRound className={`w-6 h-6 ${isExpired ? 'text-red-600' : 'text-amber-600'}`} />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-lg">{key.number}</p>
                      <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                        <User className="w-4 h-4" />
                        <span>{person.firstName} {person.lastName}</span>
                      </div>
                      <div className={`flex items-center gap-2 text-sm font-medium mt-2 ${isExpired ? 'text-red-600' : 'text-amber-600'}`}>
                        <Clock className="w-4 h-4" />
                        <span>
                          {isExpired 
                            ? `Verlopen op ${format(transaction.expirationDate!, 'dd MMM yyyy')}`
                            : `Verloopt op ${format(transaction.expirationDate!, 'dd MMM yyyy')} (${daysLeft} dagen)`}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => handleReturn(key.id)}
                      className="px-4 py-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Innemen
                    </button>
                    <button
                      onClick={() => handleExtend(key.id, person.id)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Verlengen (1 jaar)
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
