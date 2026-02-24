import { useState, useMemo } from 'react';
import { useStore, selectKeyHistory } from '../store/useStore';
import { format } from 'date-fns';
import { KeyRound, ArrowRightLeft, User, Clock } from 'lucide-react';

export const History = () => {
  const { keys, persons } = useStore();
  const transactions = useStore((state) => state.transactions);
  const [selectedKeyId, setSelectedKeyId] = useState(keys[0]?.id || '');

  const history = useMemo(() => selectKeyHistory({ transactions } as any, selectedKeyId), [transactions, selectedKeyId]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Sleutel Historie</h2>
        <p className="text-gray-500 mt-1">Bekijk de tijdlijn van uitgifte en inname per sleutel.</p>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <label className="block text-sm font-medium text-gray-700 mb-2">Selecteer een sleutel</label>
        <select
          value={selectedKeyId}
          onChange={(e) => setSelectedKeyId(e.target.value)}
          className="w-full max-w-md px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all bg-white"
        >
          {keys.map((k) => (
            <option key={k.id} value={k.id}>
              {k.number}
            </option>
          ))}
        </select>
      </div>

      {history.length > 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden p-6">
          <div className="relative border-l-2 border-gray-100 ml-3 md:ml-6 space-y-8 py-4">
            {history.map((transaction, index) => {
              const person = persons.find((p) => p.id === transaction.personId);
              const isIssued = transaction.type === 'ISSUED';
              
              return (
                <div key={transaction.id} className="relative pl-8 md:pl-10">
                  {/* Timeline dot */}
                  <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-white ${isIssued ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>
                  
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                      <div>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium mb-2 ${
                          isIssued ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          <ArrowRightLeft className="w-3 h-3" />
                          {isIssued ? 'Uitgegeven' : 'Ingenomen'}
                        </span>
                        <div className="flex items-center gap-2 text-gray-900 font-medium">
                          <User className="w-4 h-4 text-gray-500" />
                          {person ? `${person.firstName} ${person.lastName}` : 'Onbekend'}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-sm text-gray-500">
                        <Clock className="w-4 h-4" />
                        {format(transaction.timestamp, 'dd MMM yyyy, HH:mm')}
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider font-semibold">Handtekening</p>
                      <div className="bg-white border border-gray-200 rounded-lg p-2 inline-block">
                        <img src={transaction.signature} alt="Handtekening" className="h-16 object-contain" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center text-gray-500">
          Geen historie gevonden voor deze sleutel.
        </div>
      )}
    </div>
  );
};
