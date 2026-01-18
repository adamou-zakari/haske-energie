const axios = require('axios');

async function testAPI() {
  console.log('🧪 TEST DE L\'API FIREBASE\n');
  
  try {
    // Test 1 : Envoyer des données
    console.log('📡 Test 1 : Envoi de données...');
    const sensorData = {
      voltage: 12.5,
      current: 2.3,
      power: 3500,
      temperature: 32.5,
      battery_level: 85
    };
    
    const response1 = await axios.post('http://localhost:5000/api/sensors/data', sensorData);
    console.log('✅ Données envoyées :', response1.data);
    console.log();
    
    // Attendre 2 secondes
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test 2 : Récupérer les dernières données
    console.log('📊 Test 2 : Récupération des données...');
    const response2 = await axios.get('http://localhost:5000/api/sensors/latest');
    console.log('✅ Données récupérées :', response2.data.count, 'entrées');
    console.log('   Dernière mesure :', response2.data.data[0]);
    console.log();
    
    // Test 3 : Statistiques
    console.log('📈 Test 3 : Statistiques...');
    const response3 = await axios.get('http://localhost:5000/api/sensors/stats');
    console.log('✅ Stats :', response3.data.stats);
    console.log();
    
    // Test 4 : Alertes
    console.log('🚨 Test 4 : Alertes...');
    const response4 = await axios.get('http://localhost:5000/api/alerts');
    console.log('✅ Alertes :', response4.data.count);
    console.log();
    
    console.log('🎉 TOUS LES TESTS RÉUSSIS !');
    
  } catch (error) {
    console.error('❌ Erreur :', error.message);
  }
}

testAPI();