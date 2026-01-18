// Haské Énergie - Point d'Entrée Serveur
// Fichier : src/server.js

require('dotenv').config();
const app = require('./app');
const { testConnection } = require('./config/firebase');

const PORT = process.env.PORT || 5000;

async function startServer() {
  console.log('='.repeat(70));
  console.log('⚡ HASKÉ ÉNERGIE - DÉMARRAGE DU SERVEUR BACKEND');
  console.log('='.repeat(70));
  console.log();
  
  // Test connexion Firebase
  console.log('🔥 Connexion à Firebase...');
  const connected = await testConnection();
  
  if (!connected) {
    console.log('\n❌ Impossible de se connecter à Firebase');
    console.log('💡 Vérifiez que serviceAccountKey.json est dans le dossier racine\n');
    process.exit(1);
  }
  
  console.log();
  
  // Démarrer le serveur Express
  app.listen(PORT, () => {
    console.log('='.repeat(70));
    console.log('✅ SERVEUR DÉMARRÉ AVEC SUCCÈS !');
    console.log('='.repeat(70));
    console.log();
    console.log(`🌐 URL du serveur     : http://localhost:${PORT}`);
    console.log(`🔗 API endpoints      : http://localhost:${PORT}/api`);
    console.log(`❤️  Health check      : http://localhost:${PORT}/health`);
    console.log();
    console.log('📡 ENDPOINTS DISPONIBLES :');
    console.log('   POST   /api/sensors/data        - Recevoir données ESP32');
    console.log('   GET    /api/sensors/latest      - Dernières données');
    console.log('   GET    /api/sensors/history     - Historique');
    console.log('   GET    /api/sensors/stats       - Statistiques');
    console.log('   GET    /api/alerts              - Alertes non résolues');
    console.log('   GET    /api/alerts/all          - Toutes les alertes');
    console.log('   PUT    /api/alerts/:id/resolve  - Résoudre une alerte');
    console.log();
    console.log('='.repeat(70));
    console.log('🎯 Backend Firebase prêt à recevoir des données !');
    console.log('='.repeat(70));
    console.log();
  });
}

startServer();

// Arrêt propre
process.on('SIGINT', () => {
  console.log('\n🛑 Arrêt du serveur...');
  process.exit(0);
});