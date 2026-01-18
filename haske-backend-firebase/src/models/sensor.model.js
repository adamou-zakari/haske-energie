// Haské Énergie - Modèles de Données Firebase
// Fichier : src/models/sensor.model.js

const { collections, admin } = require('../config/firebase');

class SensorModel {
  
  // Créer une nouvelle entrée de données capteur
  static async create(data) {
    try {
      const docData = {
        voltage: data.voltage,
        current: data.current,
        power: data.power,
        temperature: data.temperature,
        battery_level: data.battery_level || null,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        created_at: new Date().toISOString()
      };
      
      const docRef = await collections.sensorData.add(docData);
      
      return {
        success: true,
        id: docRef.id,
        message: 'Données enregistrées'
      };
      
    } catch (error) {
      console.error('Erreur create :', error.message);
      return {
        success: false,
        message: error.message
      };
    }
  }
  
  // Récupérer les dernières données
  static async getLatest(limit = 10) {
    try {
      const snapshot = await collections.sensorData
        .orderBy('created_at', 'desc')
        .limit(limit)
        .get();
      
      const data = [];
      snapshot.forEach(doc => {
        data.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return {
        success: true,
        count: data.length,
        data: data
      };
      
    } catch (error) {
      console.error('Erreur getLatest :', error.message);
      return {
        success: false,
        message: error.message
      };
    }
  }
  
  // Récupérer les données des dernières X heures
  static async getLastHours(hours = 24) {
    try {
      const hoursAgo = new Date();
      hoursAgo.setHours(hoursAgo.getHours() - hours);
      
      const snapshot = await collections.sensorData
        .where('created_at', '>=', hoursAgo.toISOString())
        .orderBy('created_at', 'asc')
        .get();
      
      const data = [];
      snapshot.forEach(doc => {
        data.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return {
        success: true,
        count: data.length,
        data: data
      };
      
    } catch (error) {
      console.error('Erreur getLastHours :', error.message);
      return {
        success: false,
        message: error.message
      };
    }
  }
  
  // Obtenir les statistiques
  static async getStats() {
    try {
      const snapshot = await collections.sensorData.get();
      
      let totalPower = 0;
      let maxPower = 0;
      let minPower = Infinity;
      let totalTemp = 0;
      let maxTemp = 0;
      let count = 0;
      
      snapshot.forEach(doc => {
        const data = doc.data();
        totalPower += data.power || 0;
        totalTemp += data.temperature || 0;
        maxPower = Math.max(maxPower, data.power || 0);
        minPower = Math.min(minPower, data.power || 0);
        maxTemp = Math.max(maxTemp, data.temperature || 0);
        count++;
      });
      
      return {
        success: true,
        stats: {
          total_records: count,
          avg_power: count > 0 ? totalPower / count : 0,
          max_power: maxPower,
          min_power: minPower === Infinity ? 0 : minPower,
          avg_temperature: count > 0 ? totalTemp / count : 0,
          max_temperature: maxTemp
        }
      };
      
    } catch (error) {
      console.error('Erreur getStats :', error.message);
      return {
        success: false,
        message: error.message
      };
    }
  }
  
  // Supprimer les anciennes données
  static async deleteOldData(days = 90) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      const snapshot = await collections.sensorData
        .where('created_at', '<', cutoffDate.toISOString())
        .get();
      
      const batch = admin.firestore().batch();
      snapshot.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      
      return {
        success: true,
        deleted: snapshot.size
      };
      
    } catch (error) {
      console.error('Erreur deleteOldData :', error.message);
      return {
        success: false,
        message: error.message
      };
    }
  }
}

// Modèle pour les Alertes
class AlertModel {
  
  // Créer une nouvelle alerte
  static async create(data) {
    try {
      const docData = {
        alert_type: data.alert_type,
        severity: data.severity,
        message: data.message,
        is_resolved: false,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        created_at: new Date().toISOString()
      };
      
      const docRef = await collections.alerts.add(docData);
      
      return {
        success: true,
        id: docRef.id
      };
      
    } catch (error) {
      console.error('Erreur create alert :', error.message);
      return {
        success: false,
        message: error.message
      };
    }
  }
  
  // Récupérer les alertes non résolues
  static async getUnresolved() {
    try {
      const snapshot = await collections.alerts
        .where('is_resolved', '==', false)
        .orderBy('created_at', 'desc')
        .get();
      
      const data = [];
      snapshot.forEach(doc => {
        data.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return {
        success: true,
        count: data.length,
        data: data
      };
      
    } catch (error) {
      console.error('Erreur getUnresolved :', error.message);
      return {
        success: false,
        message: error.message
      };
    }
  }
  
  // Marquer une alerte comme résolue
  static async resolve(id) {
    try {
      await collections.alerts.doc(id).update({
        is_resolved: true,
        resolved_at: admin.firestore.FieldValue.serverTimestamp()
      });
      
      return {
        success: true,
        message: 'Alerte résolue'
      };
      
    } catch (error) {
      console.error('Erreur resolve :', error.message);
      return {
        success: false,
        message: error.message
      };
    }
  }
  
  // Récupérer toutes les alertes
  static async getAll(limit = 100) {
    try {
      const snapshot = await collections.alerts
        .orderBy('created_at', 'desc')
        .limit(limit)
        .get();
      
      const data = [];
      snapshot.forEach(doc => {
        data.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return {
        success: true,
        count: data.length,
        data: data
      };
      
    } catch (error) {
      console.error('Erreur getAll alerts :', error.message);
      return {
        success: false,
        message: error.message
      };
    }
  }
}

module.exports = {
  SensorModel,
  AlertModel
};