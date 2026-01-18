// Haské Énergie - Configuration Firebase
// Fichier : src/config/firebase.js

const admin = require('firebase-admin');
const serviceAccount = require('../../serviceAccountKey.json');

// Initialiser Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Référence à Firestore
const db = admin.firestore();

// Tester la connexion
async function testConnection() {
  try {
    // Tenter d'accéder à Firestore
    const testDoc = await db.collection('_test').doc('connection').set({
      status: 'connected',
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log('✅ Firebase connecté !');
    console.log('📊 Base de données : Firestore');
    return true;
  } catch (error) {
    console.error('❌ Erreur Firebase :', error.message);
    return false;
  }
}

// Collections
const collections = {
  sensorData: db.collection('sensor_data'),
  alerts: db.collection('alerts'),
  anomalies: db.collection('anomalies'),
  predictions: db.collection('predictions')
};

module.exports = {
  admin,
  db,
  collections,
  testConnection
};