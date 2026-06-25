"""
API Flask pour servir les modèles d'IA
Haské Énergie - Mini-centrale solaire intelligente

NOTE (v5) :
- /detect/anomaly/realtime  -> détection EN DIRECT sur les signaux RÉELLEMENT
  mesurés par l'ESP32 (tension, courant, puissance, température, batterie).
  Aucune irradiation : c'est la détection opérationnelle, 100% réelle.
- /predict/power et /detect/anomaly restent pour le SIMULATEUR du modèle
  (entrées manuelles), utilisés en démonstration uniquement.
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
CORS(app)

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

# Calibration panneau réel 50W vs données entraînement (~1000W)
MAX_POWER_PANNEAU  = 50.0
MAX_POWER_TRAINING = 1000.0
CALIBRATION_RATIO  = MAX_POWER_PANNEAU / MAX_POWER_TRAINING  # 0.05


@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'running',
        'models_loaded': prediction_model is not None and anomaly_model is not None and anomaly_scaler is not None,
        'timestamp': datetime.now().isoformat()
    })


# ════════════════════════════════════════════════════════════════════
#  DÉTECTION TEMPS RÉEL — 100% RÉELLE (signaux mesurés, sans irradiation)
#  Règles physiques sur seuils réels. Pas de modèle ML ici : c'est la
#  surveillance opérationnelle de l'installation.
# ════════════════════════════════════════════════════════════════════
@app.route('/detect/anomaly/realtime', methods=['POST'])
def detect_anomaly_realtime():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Aucune donnée fournie'}), 400

        now         = datetime.now()
        voltage     = float(data.get('voltage', 0) or 0)
        current     = float(data.get('current', 0) or 0)
        power       = float(data.get('power', 0) or 0)
        temperature = float(data.get('temperature', 0) or 0)
        battery     = float(data.get('battery_level', 0) or 0)
        hour        = now.hour

        is_anomaly   = False
        anomaly_type = None
        severity     = 'normal'

        # Aucune mesure exploitable -> on ne déclenche rien
        no_data = (voltage == 0 and power == 0 and temperature == 0)

        if not no_data:
            # 1. Surchauffe (température réelle DS18B20)
            if temperature > 65:
                is_anomaly, anomaly_type, severity = True, 'Surchauffe critique', 'critical'
            elif temperature > 50:
                is_anomaly, anomaly_type, severity = True, 'Température élevée', 'warning'
            # 2. Batterie (niveau réel)
            elif 0 < battery < 10:
                is_anomaly, anomaly_type, severity = True, 'Batterie critique', 'critical'
            elif 0 < battery < 20:
                is_anomaly, anomaly_type, severity = True, 'Batterie faible', 'warning'
            # 3. Tension (diviseur réel)
            elif 0 < voltage < 10:
                is_anomaly, anomaly_type, severity = True, 'Tension basse', 'warning'
            elif voltage > 30:
                is_anomaly, anomaly_type, severity = True, 'Tension anormale', 'warning'
            # 4. Production nulle en pleine journée malgré tension présente
            elif power < 0.5 and voltage > 5 and (6 <= hour <= 18):
                is_anomaly, anomaly_type, severity = True, 'Production nulle en journée', 'warning'

        return jsonify({
            'success': True,
            'data': {
                'is_anomaly':   bool(is_anomaly),
                'anomaly_type': anomaly_type,
                'severity':     severity,
                'source':       'temps réel · signaux mesurés',
                'timestamp':    now.isoformat()
            }
        })

    except Exception as e:
        print(f"❌ Erreur détection temps réel: {str(e)}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


# ════════════════════════════════════════════════════════════════════
#  SIMULATEUR DU MODÈLE — entrées manuelles (démonstration uniquement)
# ════════════════════════════════════════════════════════════════════
@app.route('/predict/power', methods=['POST'])
def predict_power():
    try:
        data = request.get_json()
        print(f"📥 Données reçues: {data}")

        if not data:
            return jsonify({'error': 'Aucune donnée fournie'}), 400

        for field in ['irradiation', 'ambient_temperature']:
            if field not in data:
                return jsonify({'error': f'Champ manquant: {field}'}), 400

        now = datetime.now()

        features = pd.DataFrame([{
            'IRRADIATION':       float(data['irradiation']),
            'AMBIENT_TEMPERATURE': float(data['ambient_temperature']),
            'HOUR':        now.hour,
            'MONTH':       now.month,
            'DAY_OF_WEEK': now.weekday(),
            'PLANT_ID':    4136001
        }])

        if prediction_model is None:
            return jsonify({'error': 'Modèle de prédiction non chargé'}), 500

        # Prédiction brute (échelle dataset indien ~1000W)
        prediction_raw = float(prediction_model.predict(features)[0])

        # Calibration pour panneau 50W réel
        prediction_calibrated = prediction_raw * CALIBRATION_RATIO

        # Clamp entre 0 et 50W
        prediction_final = max(0.0, min(prediction_calibrated, MAX_POWER_PANNEAU))

        print(f"✅ Brut: {prediction_raw:.2f}W → Calibré: {prediction_final:.2f}W")

        return jsonify({
            'success': True,
            'data': {
                'predicted_power':     round(prediction_final, 2),
                'predicted_power_raw': round(prediction_raw, 2),
                'unit':      'W',
                'confidence': 'high',
                'timestamp': datetime.now().isoformat()
            }
        })

    except Exception as e:
        print(f"❌ Erreur prédiction: {str(e)}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@app.route('/detect/anomaly', methods=['POST'])
def detect_anomaly():
    try:
        data = request.get_json()
        print(f"📥 Données anomalie reçues: {data}")

        if not data:
            return jsonify({'error': 'Aucune donnée fournie'}), 400

        for field in ['ac_power', 'irradiation', 'ambient_temperature']:
            if field not in data:
                return jsonify({'error': f'Champ manquant: {field}'}), 400

        now = datetime.now()
        irradiation  = float(data['irradiation'])
        ac_power     = float(data['ac_power'])
        ambient_temp = float(data['ambient_temperature'])

        # Efficacité réelle : puissance / irradiation (kW/m²)
        efficiency = ac_power / irradiation if irradiation > 0 else 0

        features = pd.DataFrame([{
            'AC_POWER':           ac_power,
            'IRRADIATION':        irradiation,
            'AMBIENT_TEMPERATURE': ambient_temp,
            'EFFICIENCY':         efficiency,
            'HOUR':               now.hour
        }])

        if anomaly_scaler is None or anomaly_model is None:
            return jsonify({'error': "Modèle d'anomalie non chargé"}), 500

        features_scaled = anomaly_scaler.transform(features)
        prediction      = anomaly_model.predict(features_scaled)[0]
        is_anomaly      = prediction == -1

        print(f"🔍 Résultat: {'Anomalie' if is_anomaly else 'Normal'}")

        anomaly_type = None
        severity     = 'normal'

        if is_anomaly:
            # Surchauffe : priorité absolue
            if ambient_temp > 45:
                anomaly_type = 'Surchauffe'
                severity     = 'critical'
            # Production nocturne anormale
            elif now.hour < 6 or now.hour > 19:
                anomaly_type = 'Production nocturne anormale'
                severity     = 'critical'
            # Faible production : < 10% du max panneau (< 5W) malgré irradiation suffisante
            elif ac_power < 5 and irradiation > 0.2:
                anomaly_type = 'Faible production'
                severity     = 'warning'
            # Efficacité très faible : panneau produit peu par rapport à l'irradiation reçue
            elif efficiency < 10 and irradiation > 0.3:
                anomaly_type = 'Efficacité faible'
                severity     = 'warning'
            # Comportement anormal générique
            else:
                anomaly_type = 'Comportement anormal détecté'
                severity     = 'warning'

        return jsonify({
            'success': True,
            'data': {
                'is_anomaly':   bool(is_anomaly),
                'anomaly_type': anomaly_type,
                'severity':     severity,
                'timestamp':    datetime.now().isoformat()
            }
        })

    except Exception as e:
        print(f"❌ Erreur détection: {str(e)}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@app.route('/predict/batch', methods=['POST'])
def predict_batch():
    try:
        request_data = request.get_json()

        if not request_data or 'data' not in request_data:
            return jsonify({'error': 'Format invalide'}), 400

        data_list = request_data['data']
        if len(data_list) == 0:
            return jsonify({'error': 'Liste vide'}), 400

        now = datetime.now()

        features = pd.DataFrame([{
            'IRRADIATION':       float(item['irradiation']),
            'AMBIENT_TEMPERATURE': float(item['ambient_temperature']),
            'HOUR':        now.hour,
            'MONTH':       now.month,
            'DAY_OF_WEEK': now.weekday(),
            'PLANT_ID':    4136001
        } for item in data_list])

        if prediction_model is None:
            return jsonify({'error': 'Modèle non chargé'}), 500

        predictions_raw = prediction_model.predict(features)

        # Calibration sur toutes les prédictions
        predictions_calibrated = [
            round(max(0.0, min(float(p) * CALIBRATION_RATIO, MAX_POWER_PANNEAU)), 2)
            for p in predictions_raw
        ]

        return jsonify({
            'success': True,
            'data': {
                'predictions': predictions_calibrated,
                'count':       len(predictions_calibrated),
                'timestamp':   datetime.now().isoformat()
            }
        })

    except Exception as e:
        print(f"❌ Erreur batch: {str(e)}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    print("🚀 Démarrage du serveur IA Flask...")
    print(f"📊 Calibration: panneau {MAX_POWER_PANNEAU}W / training {MAX_POWER_TRAINING}W = ratio {CALIBRATION_RATIO}")
    print(f"   - Prédiction: {'✅' if prediction_model else '❌'}")
    print(f"   - Anomalie:   {'✅' if anomaly_model else '❌'}")
    print("\n🔗 Endpoints:")
    print("   - GET  /health")
    print("   - POST /detect/anomaly/realtime   (TEMPS RÉEL · signaux mesurés)")
    print("   - POST /predict/power             (simulateur du modèle)")
    print("   - POST /detect/anomaly            (simulateur du modèle)")
    print("   - POST /predict/batch")
    app.run(host='0.0.0.0', port=5001, debug=True)