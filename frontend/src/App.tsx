import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { useStore } from './store/useStore';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { IssueKey } from './pages/IssueKey';
import { ReturnKey } from './pages/ReturnKey';
import { History } from './pages/History';
import { Manage } from './pages/Manage';
import { Search } from './pages/Search';
import { Review } from './pages/Review';

function AppLoader({ children }: { children: React.ReactNode }) {
  const loadAll = useStore(s => s.loadAll);
  const loading = useStore(s => s.loading);

  useEffect(() => { loadAll(); }, [loadAll]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-500">Gegevens laden...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <AppLoader>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="issue" element={<IssueKey />} />
            <Route path="return" element={<ReturnKey />} />
            <Route path="search" element={<Search />} />
            <Route path="review" element={<Review />} />
            <Route path="history" element={<History />} />
            <Route path="manage" element={<Manage />} />
          </Route>
        </Routes>
      </AppLoader>
    </BrowserRouter>
  );
}
