"""
API Flask pour servir les modèles d'IA
Haské Énergie - Mini-centrale solaire intelligente
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import pandas as pd
import numpy as np
from datetime import datetime
import os
import traceback

app = Flask(__name__)
CORS(app)  # Autoriser les requêtes depuis React

# Charger les modèles au démarrage
MODEL_DIR = os.path.join(os.path.dirname(__file__), '..', 'models')

try:
    prediction_model = joblib.load(os.path.join(MODEL_DIR, 'prediction_model.pkl'))
    anomaly_model = joblib.load(os.path.join(MODEL_DIR, 'anomaly_model.pkl'))
    anomaly_scaler = joblib.load(os.path.join(MODEL_DIR, 'anomaly_scaler.pkl'))
    print("✅ Modèles chargés avec succès")
except Exception as e:
    print(f"❌ Erreur chargement modèles: {e}")
    prediction_model = None
    anomaly_model = None
    anomaly_scaler = None


@app.route('/health', methods=['GET'])
def health():
    """Vérifier que l'API fonctionne"""
    return jsonify({
        'status': 'running',
        'models_loaded': prediction_model is not None and anomaly_model is not None and anomaly_scaler is not None,
        'timestamp': datetime.now().isoformat()
    })


@app.route('/predict/power', methods=['POST'])
def predict_power():
    """
    Prédire la production d'énergie
    Body: {
        "irradiation": 0.5,
        "ambient_temperature": 25,
        "module_temperature": 35
    }
    """
    try:
        data = request.get_json()
        
        print(f"📥 Données reçues: {data}")
        
        # Validation
        if not data:
            return jsonify({'error': 'Aucune donnée fournie'}), 400
        
        required_fields = ['irradiation', 'ambient_temperature']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Champ manquant: {field}'}), 400
        
        # Obtenir l'heure actuelle pour les features temporelles
        now = datetime.now()
        
        # Préparer les features EXACTEMENT dans l'ordre d'entraînement
        # ORDRE : IRRADIATION, AMBIENT_TEMPERATURE, HOUR, MONTH, DAY_OF_WEEK, PLANT_ID
        features = pd.DataFrame([{
            'IRRADIATION': float(data['irradiation']),
            'AMBIENT_TEMPERATURE': float(data['ambient_temperature']),
            'HOUR': now.hour,
            'MONTH': now.month,
            'DAY_OF_WEEK': now.weekday(),
            'PLANT_ID': 4136001
        }])
        
        print(f"🔢 Features préparées: {features.to_dict()}")
        
        # Prédiction
        if prediction_model is None:
            return jsonify({'error': 'Modèle de prédiction non chargé'}), 500
        
        prediction = prediction_model.predict(features)[0]
        
        print(f"✅ Prédiction réussie: {prediction} W")
        
        return jsonify({
            'predicted_power': float(prediction),
            'unit': 'W',
            'confidence': 'high',
            'timestamp': datetime.now().isoformat()
        })
    
    except Exception as e:
        print(f"❌ Erreur prédiction: {str(e)}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@app.route('/detect/anomaly', methods=['POST'])
def detect_anomaly():
    """
    Détecter les anomalies (modèle entraîné + scaler, voir ai/training/train_anomaly.py)
    Body: {
        "ac_power": 150,
        "irradiation": 0.5,
        "ambient_temperature": 25
    }
    """
    try:
        data = request.get_json()
        
        print(f"📥 Données anomalie reçues: {data}")
        
        if not data:
            return jsonify({'error': 'Aucune donnée fournie'}), 400
        
        required_fields = ['ac_power', 'irradiation', 'ambient_temperature']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Champ manquant: {field}'}), 400
        
        now = datetime.now()
        
        irradiation = float(data['irradiation'])
        ac_power = float(data['ac_power'])
        
        if irradiation > 0:
            efficiency = ac_power / irradiation
        else:
            efficiency = 0
        
        features = pd.DataFrame([{
            'AC_POWER': ac_power,
            'IRRADIATION': irradiation,
            'AMBIENT_TEMPERATURE': float(data['ambient_temperature']),
            'EFFICIENCY': efficiency,
            'HOUR': now.hour
        }])
        
        print(f"🔢 Features anomalie: {features.to_dict()}")
        
        if anomaly_scaler is None or anomaly_model is None:
            return jsonify({'error': 'Modèle d\'anomalie non chargé'}), 500
        
        features_scaled = anomaly_scaler.transform(features)
        prediction = anomaly_model.predict(features_scaled)[0]
        is_anomaly = prediction == -1
        
        print(f"🔍 Résultat détection: {'Anomalie' if is_anomaly else 'Normal'}")
        
        anomaly_type = None
        severity = 'normal'
        
        if is_anomaly:
            if ac_power < 50:
                anomaly_type = 'Faible production'
                severity = 'warning'
            elif float(data['ambient_temperature']) > 45:
                anomaly_type = 'Surchauffe'
                severity = 'critical'
            elif efficiency < 0.5 and irradiation > 0.5:
                anomaly_type = 'Efficacité faible'
                severity = 'warning'
            else:
                anomaly_type = 'Anomalie détectée'
                severity = 'warning'
        
        return jsonify({
            'is_anomaly': bool(is_anomaly),
            'anomaly_type': anomaly_type,
            'severity': severity,
            'timestamp': datetime.now().isoformat()
        })
    
    except Exception as e:
        print(f"❌ Erreur détection: {str(e)}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@app.route('/predict/batch', methods=['POST'])
def predict_batch():
    """
    Prédictions multiples (pour graphiques)
    Body: {
        "data": [
            {"irradiation": 0.5, "ambient_temperature": 25},
            ...
        ]
    }
    """
    try:
        request_data = request.get_json()
        
        if not request_data or 'data' not in request_data:
            return jsonify({'error': 'Format invalide'}), 400
        
        data_list = request_data['data']
        
        if len(data_list) == 0:
            return jsonify({'error': 'Liste vide'}), 400
        
        # Obtenir l'heure actuelle
        now = datetime.now()
        
        # Préparer les features dans le bon ordre
        features = pd.DataFrame([{
            'IRRADIATION': float(item['irradiation']),
            'AMBIENT_TEMPERATURE': float(item['ambient_temperature']),
            'HOUR': now.hour,
            'MONTH': now.month,
            'DAY_OF_WEEK': now.weekday(),
            'PLANT_ID': 4136001
        } for item in data_list])
        
        # Prédictions
        if prediction_model is None:
            return jsonify({'error': 'Modèle non chargé'}), 500
        
        predictions = prediction_model.predict(features)
        
        return jsonify({
            'predictions': [float(p) for p in predictions],
            'count': len(predictions),
            'timestamp': datetime.now().isoformat()
        })
    
    except Exception as e:
        print(f"❌ Erreur batch: {str(e)}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    print("🚀 Démarrage du serveur IA Flask...")
    print("📊 Modèles disponibles:")
    print(f"   - Prédiction: {'✅' if prediction_model else '❌'}")
    print(f"   - Anomalie: {'✅' if anomaly_model else '❌'}")
    print("\n🔗 Endpoints:")
    print("   - GET  /health")
    print("   - POST /predict/power")
    print("   - POST /detect/anomaly")
    print("   - POST /predict/batch")
    
    app.run(host='0.0.0.0', port=5001, debug=True)