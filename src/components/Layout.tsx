import { Link, Outlet, useLocation } from 'react-router-dom';
import { Key, KeyRound, History, Users, Menu, X, Search as SearchIcon, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { clsx } from 'clsx';

export const Layout = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: Key },
    { name: 'Uitgifte', path: '/issue', icon: KeyRound },
    { name: 'Inname', path: '/return', icon: KeyRound },
    { name: 'Zoeken', path: '/search', icon: SearchIcon },
    { name: 'Review', path: '/review', icon: AlertCircle },
    { name: 'Historie', path: '/history', icon: History },
    { name: 'Beheer', path: '/manage', icon: Users },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b border-gray-200 p-4 flex justify-between items-center sticky top-0 z-20">
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Key className="w-6 h-6 text-emerald-600" />
          Sleutelbeheer
        </h1>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2">
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar / Mobile Menu */}
      <nav className={clsx(
        "bg-white border-r border-gray-200 w-full md:w-64 flex-shrink-0 flex flex-col transition-all duration-300 ease-in-out z-10",
        isMobileMenuOpen ? "fixed inset-0 top-[73px] h-[calc(100vh-73px)]" : "hidden md:flex md:h-screen md:sticky md:top-0"
      )}>
        <div className="hidden md:flex p-6 items-center gap-3 border-b border-gray-100">
          <div className="bg-emerald-100 p-2 rounded-xl">
            <Key className="w-6 h-6 text-emerald-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Sleutelbeheer</h1>
        </div>
        
        <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={clsx(
                  "flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors",
                  isActive 
                    ? "bg-emerald-50 text-emerald-700" 
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <item.icon className={clsx("w-5 h-5", isActive ? "text-emerald-600" : "text-gray-400")} />
                {item.name}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto w-full max-w-7xl mx-auto">
        <Outlet />
      </main>
    </div>
  );
};
