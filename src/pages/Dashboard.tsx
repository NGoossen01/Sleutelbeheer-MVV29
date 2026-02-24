import { useMemo } from 'react';
import { useStore, selectIssuedKeys, selectAvailableKeys } from '../store/useStore';
import { format, differenceInDays } from 'date-fns';
import { KeyRound, Clock, User, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Dashboard = () => {
  const keys = useStore((state) => state.keys);
  const persons = useStore((state) => state.persons);
  const transactions = useStore((state) => state.transactions);

  const issuedKeys = useMemo(() => selectIssuedKeys({ keys, persons, transactions } as any), [keys, persons, transactions]);
  const availableKeys = useMemo(() => selectAvailableKeys({ keys, transactions } as any), [keys, transactions]);

  const expiringKeysCount = useMemo(() => {
    const now = Date.now();
    return issuedKeys.filter(ik => {
      if (!ik.transaction.expirationDate) return false;
      return differenceInDays(ik.transaction.expirationDate, now) <= 31;
    }).length;
  }, [issuedKeys]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-gray-500 mt-1">Overzicht van alle sleutels.</p>
      </div>

      {expiringKeysCount > 0 && (
        <Link to="/review" className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-center justify-between hover:bg-amber-100 transition-colors">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-amber-600" />
            <div>
              <p className="font-bold text-amber-900">Let op: {expiringKeysCount} sleutel(s) verlopen binnenkort</p>
              <p className="text-sm text-amber-700">Ga naar Review om deze te verlengen of in te nemen.</p>
            </div>
          </div>
        </Link>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="bg-amber-100 p-4 rounded-full">
            <KeyRound className="w-8 h-8 text-amber-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Uitgegeven Sleutels</p>
            <p className="text-3xl font-bold text-gray-900">{issuedKeys.length}</p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="bg-emerald-100 p-4 rounded-full">
            <KeyRound className="w-8 h-8 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Beschikbare Sleutels</p>
            <p className="text-3xl font-bold text-gray-900">{availableKeys.length}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">Actueel Uitgegeven</h3>
        </div>
        
        {issuedKeys.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Er zijn momenteel geen sleutels uitgegeven.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {issuedKeys.map(({ key, person, transaction }) => (
              <div key={key.id} className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <KeyRound className="w-6 h-6 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-lg">{key.number}</p>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                      <User className="w-4 h-4" />
                      <span>{person.firstName} {person.lastName}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 px-3 py-2 rounded-lg w-fit">
                  <Clock className="w-4 h-4" />
                  <span>{format(transaction.timestamp, 'dd MMM yyyy HH:mm')}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
