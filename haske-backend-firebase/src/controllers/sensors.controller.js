// Haské Énergie - Contrôleurs Firebase
// Fichier : src/controllers/sensors.controller.js

const { SensorModel, AlertModel } = require('../models/sensor.model');

class SensorsController {
  
  // Recevoir les données de l'ESP32
  static async receiveSensorData(req, res) {
    try {
      const { voltage, current, power, temperature, battery_level } = req.body;
      
      // Validation
      if (!voltage || !current || !power || !temperature) {
        return res.status(400).json({
          success: false,
          message: 'Données manquantes (voltage, current, power, temperature requis)'
        });
      }
      
      // Sauvegarder dans Firebase
      const result = await SensorModel.create({
        voltage,
        current,
        power,
        temperature,
        battery_level
      });
      
      if (!result.success) {
        return res.status(500).json(result);
      }
      
      // Vérifier et créer des alertes
      await SensorsController.checkAndCreateAlerts({
        voltage,
        current,
        power,
        temperature,
        battery_level
      });
      
      console.log(`📊 Données reçues - Power: ${power}W, Temp: ${temperature}°C`);
      
      return res.status(201).json({
        success: true,
        message: 'Données enregistrées avec succès',
        id: result.id
      });
      
    } catch (error) {
      console.error('Erreur receiveSensorData :', error);
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
  
  // Récupérer les dernières données
  static async getLatestData(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 10;
      const result = await SensorModel.getLatest(limit);
      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
  
  // Récupérer l'historique
  static async getHistoricalData(req, res) {
    try {
      const hours = parseInt(req.query.hours) || 24;
      const result = await SensorModel.getLastHours(hours);
      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
  
  // Récupérer les statistiques
  static async getStats(req, res) {
    try {
      const result = await SensorModel.getStats();
      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
  
  // Fonction interne : Vérifier et créer des alertes
  static async checkAndCreateAlerts(data) {
    const { voltage, current, power, temperature, battery_level } = data;
    
    // Alerte 1 : Batterie faible
    if (battery_level && battery_level < 20) {
      await AlertModel.create({
        alert_type: 'battery_low',
        severity: battery_level < 10 ? 'critical' : 'high',
        message: `Niveau de batterie faible : ${battery_level}%`
      });
    }
    
    // Alerte 2 : Surchauffe
    if (temperature > 45) {
      await AlertModel.create({
        alert_type: 'overheating',
        severity: temperature > 55 ? 'critical' : 'high',
        message: `Température élevée : ${temperature}°C`
      });
    }
    
    // Alerte 3 : Production faible en journée
    const hour = new Date().getHours();
    if (hour >= 8 && hour <= 17 && power < 100) {
      await AlertModel.create({
        alert_type: 'low_production',
        severity: 'medium',
        message: `Production très faible en journée : ${power}W`
      });
    }
    
    // Alerte 4 : Tension anormale
    if (voltage < 10 || voltage > 15) {
      await AlertModel.create({
        alert_type: 'abnormal_voltage',
        severity: 'high',
        message: `Tension anormale : ${voltage}V`
      });
    }
  }
}

// Contrôleur pour les Alertes
class AlertsController {
  
  // Récupérer les alertes non résolues
  static async getUnresolvedAlerts(req, res) {
    try {
      const result = await AlertModel.getUnresolved();
      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
  
  // Récupérer toutes les alertes
  static async getAllAlerts(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 100;
      const result = await AlertModel.getAll(limit);
      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
  
  // Marquer une alerte comme résolue
  static async resolveAlert(req, res) {
    try {
      const { id } = req.params;
      const result = await AlertModel.resolve(id);
      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = {
  SensorsController,
  AlertsController
};