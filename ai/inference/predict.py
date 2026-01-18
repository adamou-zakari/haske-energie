"""
Haské Énergie - Script d'Inférence (Utilisation des modèles)
Fichier : ai/inference/predict.py

Ce script permet d'utiliser les modèles entraînés pour :
1. Prédire la production d'énergie (AC_POWER)
2. Détecter les anomalies
"""

import pandas as pd
import numpy as np
import pickle
from datetime import datetime

class HaskeEnergyPredictor:
    """
    Classe pour faire des prédictions avec les modèles Haské Énergie
    """
    
    def __init__(self):
        """Initialiser et charger les modèles"""
        print("🔧 Chargement des modèles Haské Énergie...")
        
        # Charger le modèle de prédiction
        with open('../models/prediction_model.pkl', 'rb') as f:
            self.prediction_model = pickle.load(f)
        
        # Charger les infos du modèle de prédiction
        with open('../models/prediction_model_info.pkl', 'rb') as f:
            self.prediction_info = pickle.load(f)
        
        # Charger le modèle d'anomalies
        with open('../models/anomaly_model.pkl', 'rb') as f:
            self.anomaly_model = pickle.load(f)
        
        # Charger le scaler
        with open('../models/anomaly_scaler.pkl', 'rb') as f:
            self.anomaly_scaler = pickle.load(f)
        
        # Charger les infos du modèle d'anomalies
        with open('../models/anomaly_model_info.pkl', 'rb') as f:
            self.anomaly_info = pickle.load(f)
        
        print("✅ Modèles chargés avec succès !")
        print()
    
    def predict_production(self, irradiation, temperature, hour, month, day_of_week, plant_id=1):
        """
        Prédire la production d'énergie (AC_POWER)
        
        Args:
            irradiation: Irradiation solaire en W/m²
            temperature: Température ambiante en °C
            hour: Heure de la journée (0-23)
            month: Mois (1-12)
            day_of_week: Jour de la semaine (0=Lundi, 6=Dimanche)
            plant_id: ID de la centrale (1 ou 2)
        
        Returns:
            Production prédite en Watts
        """
        
        # Créer un DataFrame avec les features
        data = pd.DataFrame({
            'IRRADIATION': [irradiation],
            'AMBIENT_TEMPERATURE': [temperature],
            'HOUR': [hour],
            'MONTH': [month],
            'DAY_OF_WEEK': [day_of_week],
            'PLANT_ID': [plant_id]
        })
        
        # Faire la prédiction
        prediction = self.prediction_model.predict(data)[0]
        
        return prediction
    
    def detect_anomaly(self, ac_power, irradiation, temperature, hour):
        """
        Détecter si une situation est anormale
        
        Args:
            ac_power: Puissance AC en W
            irradiation: Irradiation solaire en W/m²
            temperature: Température ambiante en °C
            hour: Heure de la journée (0-23)
        
        Returns:
            Tuple (is_anomaly, confidence, reason)
        """
        
        # Calculer l'efficacité
        efficiency = ac_power / irradiation if irradiation > 0 else 0
        
        # Créer un DataFrame
        data = pd.DataFrame({
            'AC_POWER': [ac_power],
            'IRRADIATION': [irradiation],
            'AMBIENT_TEMPERATURE': [temperature],
            'EFFICIENCY': [efficiency],
            'HOUR': [hour]
        })
        
        # Normaliser
        data_scaled = self.anomaly_scaler.transform(data)
        
        # Prédire
        prediction = self.anomaly_model.predict(data_scaled)[0]
        score = self.anomaly_model.decision_function(data_scaled)[0]
        
        # Interpréter
        is_anomaly = (prediction == -1)
        confidence = abs(score)
        
        # Déterminer la raison
        reasons = []
        
        if irradiation > 500 and ac_power < 1000:
            reasons.append("Production faible malgré forte irradiation")
        
        if temperature > 45:
            reasons.append("Température élevée - Risque de surchauffe")
        
        if efficiency < 0.5 and irradiation > 100:
            reasons.append("Efficacité faible - Problème de conversion")
        
        if (hour >= 22 or hour <= 5) and ac_power > 100:
            reasons.append("Production nocturne anormale")
        
        reason = " | ".join(reasons) if reasons else "Valeurs dans la norme"
        
        return is_anomaly, confidence, reason
    
    def analyze_full_data(self, ac_power, irradiation, temperature, hour, month, day_of_week, plant_id=1):
        """
        Analyse complète : prédiction + détection d'anomalies
        
        Returns:
            Dictionnaire avec toutes les informations
        """
        
        # Prédiction
        predicted_power = self.predict_production(
            irradiation, temperature, hour, month, day_of_week, plant_id
        )
        
        # Détection d'anomalies
        is_anomaly, confidence, reason = self.detect_anomaly(
            ac_power, irradiation, temperature, hour
        )
        
        # Calculer l'écart entre réel et prédit
        if ac_power > 0:
            error_percentage = abs(predicted_power - ac_power) / ac_power * 100
        else:
            error_percentage = 0
        
        return {
            'measured_power': ac_power,
            'predicted_power': predicted_power,
            'error_percentage': error_percentage,
            'is_anomaly': is_anomaly,
            'anomaly_confidence': confidence,
            'anomaly_reason': reason
        }
    
    def get_model_info(self):
        """Obtenir les informations sur les modèles"""
        return {
            'prediction_model': self.prediction_info,
            'anomaly_model': self.anomaly_info
        }


# ============================================================
# EXEMPLE D'UTILISATION
# ============================================================

if __name__ == "__main__":
    print("=" * 70)
    print("⚡ HASKÉ ÉNERGIE - SYSTÈME DE PRÉDICTION ET DÉTECTION")
    print("=" * 70)
    print()
    
    # Créer le prédicteur
    predictor = HaskeEnergyPredictor()
    
    print("-" * 70)
    print("📊 INFORMATIONS SUR LES MODÈLES")
    print("-" * 70)
    
    info = predictor.get_model_info()
    print(f"🔮 Modèle de Prédiction :")
    print(f"   - R² Score : {info['prediction_model']['r2_score']:.4f}")
    print(f"   - MAE      : {info['prediction_model']['mae']:.2f} W")
    print()
    print(f"🚨 Modèle de Détection d'Anomalies :")
    print(f"   - Précision : {info['anomaly_model']['precision']:.2%}")
    print(f"   - Rappel    : {info['anomaly_model']['recall']:.2%}")
    print()
    
    print("=" * 70)
    print("🧪 TESTS D'EXEMPLES")
    print("=" * 70)
    print()
    
    # ==================== TEST 1 : Situation NORMALE ====================
    print("📝 TEST 1 - Situation normale (midi, beau temps)")
    print("-" * 70)
    
    result1 = predictor.analyze_full_data(
        ac_power=5000,           # Production mesurée
        irradiation=800,         # Bonne irradiation
        temperature=30,          # Température normale
        hour=12,                 # Midi
        month=6,                 # Juin
        day_of_week=2,           # Mercredi
        plant_id=1
    )
    
    print(f"🔌 Puissance mesurée    : {result1['measured_power']:.0f} W")
    print(f"🔮 Puissance prédite    : {result1['predicted_power']:.0f} W")
    print(f"📊 Erreur de prédiction : {result1['error_percentage']:.1f}%")
    print()
    
    if result1['is_anomaly']:
        print(f"🚨 ANOMALIE DÉTECTÉE !")
        print(f"   Raison : {result1['anomaly_reason']}")
    else:
        print(f"✅ SYSTÈME NORMAL")
        print(f"   {result1['anomaly_reason']}")
    
    print()
    print()
    
    # ==================== TEST 2 : ANOMALIE (Production faible) ====================
    print("📝 TEST 2 - Anomalie : Production trop faible")
    print("-" * 70)
    
    result2 = predictor.analyze_full_data(
        ac_power=500,            # Production TRÈS FAIBLE
        irradiation=800,         # Mais irradiation FORTE
        temperature=32,
        hour=13,
        month=6,
        day_of_week=3,
        plant_id=1
    )
    
    print(f"🔌 Puissance mesurée    : {result2['measured_power']:.0f} W")
    print(f"🔮 Puissance prédite    : {result2['predicted_power']:.0f} W")
    print(f"📊 Erreur de prédiction : {result2['error_percentage']:.1f}%")
    print()
    
    if result2['is_anomaly']:
        print(f"🚨 ANOMALIE DÉTECTÉE !")
        print(f"   Raison : {result2['anomaly_reason']}")
    else:
        print(f"✅ SYSTÈME NORMAL")
        print(f"   {result2['anomaly_reason']}")
    
    print()
    print()
    
    # ==================== TEST 3 : ANOMALIE (Surchauffe) ====================
    print("📝 TEST 3 - Anomalie : Surchauffe")
    print("-" * 70)
    
    result3 = predictor.analyze_full_data(
        ac_power=4500,
        irradiation=750,
        temperature=50,          # TEMPÉRATURE TROP ÉLEVÉE !
        hour=14,
        month=7,
        day_of_week=4,
        plant_id=1
    )
    
    print(f"🔌 Puissance mesurée    : {result3['measured_power']:.0f} W")
    print(f"🔮 Puissance prédite    : {result3['predicted_power']:.0f} W")
    print(f"📊 Erreur de prédiction : {result3['error_percentage']:.1f}%")
    print()
    
    if result3['is_anomaly']:
        print(f"🚨 ANOMALIE DÉTECTÉE !")
        print(f"   Raison : {result3['anomaly_reason']}")
    else:
        print(f"✅ SYSTÈME NORMAL")
        print(f"   {result3['anomaly_reason']}")
    
    print()
    print()
    
    # ==================== TEST 4 : Simple Prédiction ====================
    print("📝 TEST 4 - Prédiction simple pour demain 10h")
    print("-" * 70)
    
    prediction = predictor.predict_production(
        irradiation=600,
        temperature=28,
        hour=10,
        month=1,  # Janvier (maintenant)
        day_of_week=0,  # Lundi
        plant_id=1
    )
    
    print(f"🔮 Production prédite pour demain 10h : {prediction:.0f} W")
    print(f"   (avec irradiation: 600 W/m², température: 28°C)")
    print()
    
    print("=" * 70)
    print("✅ TESTS TERMINÉS AVEC SUCCÈS !")
    print("=" * 70)
    print()
    print("💡 Ce script peut être utilisé par ton application web (backend)")
    print()