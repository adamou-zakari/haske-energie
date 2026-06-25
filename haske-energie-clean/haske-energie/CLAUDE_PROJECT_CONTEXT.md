# Haské Énergie — Contexte pour Claude (v2 — après implémentation IT)

## Ce que tu peux dire à Claude en une phrase

> « Projet **Haské Énergie** : monitoring d'une mini-centrale solaire au Niger — **ESP32** envoie tension/courant/puissance/température/batterie vers **Node.js + Firestore** ; une **API Flask** sert des modèles **scikit-learn** (prédiction de puissance + détection d'anomalies) ; le **frontend React** affiche dashboard, historique, page IA et alertes. Trois services : React `:3000`, Node `:5000`, Flask `:5001`. »

---

## ✅ CE QUI EST FAIT (après session IT)

### [A] Firmware ESP32
- Fichier : `haske-firmware/haske_esp32/haske_esp32.ino`
- Lit **INA219** (tension + courant → puissance calculée), **DS18B20** (température), **diviseur résistif** (niveau batterie %)
- Envoie toutes les **30 secondes** un `POST` JSON vers `/api/sensors/sensors/data` avec les champs : `voltage, current, power, temperature, battery_level`
- Gestion reconnexion WiFi automatique
- **À faire côté hardware** : brancher INA219 (I2C SDA=21 SCL=22), DS18B20 (pin 4), diviseur de tension batterie (pin 34)
- **À modifier dans le .ino** : `WIFI_SSID`, `WIFI_PASSWORD`, `NODE_SERVER_URL` (IP locale du PC)

### [B] Appel Flask automatique à chaque POST capteur
- Fichier : `haske-backend-firebase/src/controllers/sensors.controller.js`
- À chaque réception de données ESP32 → appel automatique `POST http://localhost:5001/detect/anomaly`
- Mapping des champs : `ac_power = power`, `ambient_temperature = temperature`, `irradiation = 400` (défaut si non fourni)
- Si Flask détecte une anomalie (`is_anomaly: true`) → création automatique d'une alerte de type `ia_anomaly` dans Firestore
- Timeout 5s : si Flask est éteint, le flux capteur n'est pas bloqué
- Message d'alerte IA : `"Comportement anormal détecté par l'IA (score : X.XXX) — puissance : XW, température : X°C. Vérification conseillée."`

### [C] Alertes enrichies + tendance batterie 7 jours
- Fichier : même `sensors.controller.js`
- **Règles seuils** :
  - Batterie < 10% → CRITIQUE → `"Batterie critique : X% — Risque de coupure imminente. Intervention urgente requise."`
  - Batterie < 20% → ÉLEVÉ → `"Batterie faible : X% — Surveiller la charge..."`
  - Batterie < 35% → MOYEN → `"Batterie à X% — Niveau bas. Vérification conseillée..."`
  - Température > 65°C → CRITIQUE → `"Surchauffe critique..."`
  - Température > 50°C → ÉLEVÉ → `"Température élevée..."`
  - Tension < 10V → ÉLEVÉ → `"Tension anormalement basse..."`
  - Tension > 30V → MOYEN → `"Tension élevée..."`
  - Puissance = 0 + temp > 20°C → ÉLEVÉ → `"Production nulle détectée..."`
- **Tendance batterie 7 jours** : analyse régression linéaire sur les données Firestore → si pente < -0.5 → alerte `battery_degradation_trend` : `"Comportement inhabituel détecté — La batterie baisse régulièrement depuis 7 jours (de X% à Y%). Vérification conseillée."`
- **Anti-doublon** : une alerte du même type n'est créée que si aucune alerte non résolue du même type n'existe déjà

### [Frontend] Page Alertes (Alerts.js)
- Fichier : `haske-frontend/src/pages/Alerts.js`
- Affiche les alertes actives avec couleur par sévérité (rouge critique, orange élevé, jaune moyen, vert faible)
- Icônes par type (🔋 batterie, 🌡️ température, ⚡ tension, ☀️ puissance, 🤖 IA)
- Compteurs : alertes actives / critiques / élevées / détections IA
- Bouton "✓ Résoudre" par alerte
- Historique complet pliable/dépliable
- Auto-refresh toutes les 30 secondes

### [Frontend] Page Historique (History.js)
- Fichier : `haske-frontend/src/pages/History.js`
- Graphiques Recharts pour : puissance, batterie, température, tension, courant
- Filtres de période : 6h / 24h / 48h / 7 jours
- Résumé statistiques 24h (moyennes) + affichage tendance batterie 7 jours
- Message clair si aucune donnée

---

## ❌ CE QUI N'EST PAS ENCORE FAIT (hors portée immédiate ou à vérifier)

### [A] Côté matériel
- L'ESP32 physique n'est pas encore câblé avec les capteurs réels (INA219, DS18B20)
- Les valeurs `WIFI_SSID`, `WIFI_PASSWORD`, `NODE_SERVER_URL` dans le .ino sont des placeholders — **à personnaliser avant de flasher**
- La calibration du diviseur de tension batterie dépend des résistances utilisées (le code suppose R1=R2=10kΩ)

### [B] Dépendance Flask
- Si Flask (`ai/api/app.py`) n'est pas démarré, la détection IA ne fonctionne pas (les alertes de règles fonctionnent quand même)
- Les modèles `.pkl` (`prediction_model.pkl`, `anomaly_model.pkl`, `anomaly_scaler.pkl`) doivent exister dans `ai/models/`
- Le champ `irradiation` n'est pas mesuré par l'ESP32 → valeur fixe 400 W/m² utilisée (à améliorer avec un capteur pyranomètre ou estimation)

### [D] Prédiction « X jours avant panne » (Vision IT long terme — NON FAIT)
- Nécessite des données historiques labellisées (panne / normal) sur plusieurs semaines/mois
- Nécessite un modèle entraîné sur fenêtres temporelles (LSTM ou Random Forest sur features agrégées)
- **Cette fonctionnalité reste une vision cible V2**, pas encore implémentée ni défendable avec les données actuelles

### [Frontend] Dashboard (page d'accueil)
- Non fourni dans cette session — le Dashboard existant devrait déjà afficher les dernières mesures via `getLatestData`
- Si le Dashboard ne s'affiche pas : vérifier que `App.js` importe bien `History` et `Alerts` depuis `./pages/History` et `./pages/Alerts`

### Déploiement
- Non traité (à voir plus tard)

---

## 2. Structure du dépôt (réelle)

```
haske-energie/
├── README.md
├── CLAUDE_PROJECT_CONTEXT.md          ← ce document (v2)
├── haske-firmware/
│   └── haske_esp32/
│       └── haske_esp32.ino            ← NOUVEAU [A]
├── ai/
│   ├── api/
│   │   ├── app.py
│   │   └── requirements.txt
│   ├── models/                        # prediction_model.pkl, anomaly_model.pkl, anomaly_scaler.pkl
│   ├── preprocessing/
│   ├── training/
│   ├── inference/
│   ├── datasets/
│   └── notebooks/
├── haske-backend-firebase/
│   ├── package.json
│   ├── serviceAccountKey.json
│   └── src/
│       ├── server.js
│       ├── app.js
│       ├── config/firebase.js
│       ├── controllers/
│       │   ├── sensors.controller.js  ← MODIFIÉ [B] + [C]
│       │   └── ai.controller.js
│       ├── models/sensor.model.js
│       └── routes/
└── haske-frontend/
    ├── package.json
    └── src/
        ├── index.js
        ├── App.js
        ├── components/
        ├── pages/
        │   ├── Alerts.js              ← MODIFIÉ (alertes enrichies) [C]
        │   └── History.js             ← MODIFIÉ (graphiques + tendance) [C]
        └── services/api.js
```

---

## 3. Ports et rôles

| Service   | Dossier                    | Port |
|-----------|----------------------------|------|
| React     | `haske-frontend/`          | 3000 |
| Node API  | `haske-backend-firebase/`  | 5000 |
| Flask IA  | `ai/api/` (`python app.py`)| 5001 |

---

## 4. Flux de données (mis à jour)

```
ESP32 (haske_esp32.ino)
  └─ POST /api/sensors/sensors/data (toutes les 30s)
       └─ Node.js (sensors.controller.js)
            ├─ Firestore : sauvegarde sensor_data
            ├─ checkAndCreateAlerts() → règles seuils → Firestore alerts
            └─ callFlaskAnomalyDetection() → POST Flask :5001/detect/anomaly
                 └─ Si is_anomaly: true → Firestore alerts (type: ia_anomaly)

Frontend React (:3000)
  ├─ /dashboard → GET /api/sensors/latest
  ├─ /history   → GET /api/sensors/history?hours=N + /api/sensors/stats
  ├─ /alerts    → GET /api/sensors/alerts + /api/sensors/alerts/all
  └─ /ai        → POST /api/ai/predict/power, /api/ai/detect/anomaly
```

---

## 5. API Node (inchangée)

### Capteurs & alertes (`/api/sensors/...`)

| Méthode | Chemin complet | Rôle |
|---------|----------------|------|
| POST | `/api/sensors/sensors/data` | Réception données ESP32 |
| GET  | `/api/sensors/sensors/latest?limit=` | Dernières mesures |
| GET  | `/api/sensors/sensors/history?hours=` | Historique |
| GET  | `/api/sensors/sensors/stats` | Statistiques + tendance batterie |
| GET  | `/api/sensors/alerts` | Alertes non résolues |
| GET  | `/api/sensors/alerts/all` | Toutes les alertes |
| PUT  | `/api/sensors/alerts/:id/resolve` | Résoudre une alerte |

### IA (`/api/ai/...`)

| Méthode | Chemin | Rôle |
|---------|--------|------|
| GET  | `/api/ai/health` | Pont vers Flask `/health` |
| POST | `/api/ai/predict/power` | Prédiction puissance |
| POST | `/api/ai/detect/anomaly` | Détection anomalie |
| POST | `/api/ai/predict/batch` | Prédictions multiples |

---

## 6. API Flask (inchangée)

| Route | Description |
|-------|-------------|
| GET `/health` | `models_loaded` si les 3 `.pkl` sont chargés |
| POST `/predict/power` | Body : `irradiation`, `ambient_temperature` |
| POST `/detect/anomaly` | Body : `ac_power`, `irradiation`, `ambient_temperature` |
| POST `/predict/batch` | Liste `{ data: [ { irradiation, ambient_temperature }, ... ] }` |

---

## 7. Lancer le projet en local

```bash
# Terminal 1 — Flask
cd ai/api && pip install -r requirements.txt && python app.py

# Terminal 2 — Node
cd haske-backend-firebase && npm install && npm start

# Terminal 3 — React
cd haske-frontend && npm install && npm start

# ESP32 — Arduino IDE
# Ouvrir haske-firmware/haske_esp32/haske_esp32.ino
# Modifier WIFI_SSID, WIFI_PASSWORD, NODE_SERVER_URL
# Flasher sur la carte ESP32
```

---

## 8. Collections Firestore

- `sensor_data` : mesures brutes ESP32
- `alerts` : alertes (type, severity, message, resolved, timestamp)

---

## 9. Auteurs

Adamou Zakari & Sallah Alkassoum

---

*v2 — Mise à jour après implémentation des recommandations IT : [A] firmware ESP32, [B] appel Flask automatique, [C] alertes enrichies + tendance batterie 7 jours.*