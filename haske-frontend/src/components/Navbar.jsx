import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Zap, Home, BarChart3, History, Brain, AlertTriangle } from 'lucide-react';

function Navbar() {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;
  
  const navLinks = [
    { path: '/', label: 'Accueil', icon: Home },
    { path: '/dashboard', label: 'Dashboard', icon: BarChart3 },
    { path: '/history', label: 'Historique', icon: History },
    { path: '/ai', label: 'IA', icon: Brain },
    { path: '/alerts', label: 'Alertes', icon: AlertTriangle },
  ];
  
  return (
    <nav className="text-white shadow-lg">
      <div className="container">
        <div className="flex items-center justify-between" style={{height: '64px'}}>
          <Link to="/" className="flex items-center gap-2 text-xl font-bold hover:text-blue-100 transition">
            <Zap className="w-8 h-8" />
            <span>Haské Énergie</span>
          </Link>
          
          <div className="flex gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                    isActive(link.path) ? 'bg-blue-700 text-white' : 'text-blue-100 hover:bg-blue-700'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="hidden md:inline">{link.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;