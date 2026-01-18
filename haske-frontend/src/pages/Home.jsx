import React from 'react';
import { Link } from 'react-router-dom';
import { Zap, Sun, Database, Brain, ArrowRight } from 'lucide-react';

function Home() {
  const features = [
    { icon: Sun, title: 'Énergie Solaire', description: 'Mini-centrale 50W avec monitoring temps réel' },
    { icon: Database, title: 'Firebase Cloud', description: 'Stockage sécurisé avec synchronisation' },
    { icon: Brain, title: 'Intelligence Artificielle', description: 'Prédiction et détection d\'anomalies' },
    { icon: Zap, title: 'IoT & Capteurs', description: 'ESP32 avec INA219 et DS18B20' }
  ];

  return (
    <div className="min-h-screen" style={{background: 'linear-gradient(to bottom right, #eff6ff, #e0e7ff)'}}>
      <div className="container py-16">
        
        {/* Hero */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="bg-blue-600 p-4 rounded-full">
              <Zap className="w-16 h-16 text-white" />
            </div>
          </div>
          
          <h1 className="text-5xl font-bold text-gray-800 mb-4">Haské Énergie</h1>
          <p className="text-xl text-gray-600 mb-2">Mini-centrale Solaire Intelligente</p>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-8">
            Système IoT avec IA pour l'optimisation de production solaire au Niger
          </p>
          
          <div className="flex gap-4 justify-center">
            <Link to="/dashboard" className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition flex items-center gap-2">
              Dashboard <ArrowRight className="w-5 h-5" />
            </Link>
            <Link to="/ai" className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-50 transition border-2 border-blue-600">
              Voir l'IA
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div key={index} className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition">
                <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </div>
            );
          })}
        </div>

        {/* Stats */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-8">Spécifications</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <p className="text-4xl font-bold text-blue-600 mb-2">50W</p>
              <p className="text-gray-600">Panneau Solaire</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-green-600 mb-2">12V</p>
              <p className="text-gray-600">Batterie 7Ah</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-orange-600 mb-2">ESP32</p>
              <p className="text-gray-600">Microcontrôleur</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-purple-600 mb-2">2</p>
              <p className="text-gray-600">Modèles IA</p>
            </div>
          </div>
        </div>

        <div className="mt-16 text-center">
          <p className="text-gray-600">Projet réalisé par <span className="font-bold text-gray-800">@Mstate student</span></p>
        </div>
      </div>
    </div>
  );
}

export default Home;