# ⚡ Haské Énergie — Mini-centrale solaire intelligente

Système de monitoring intelligent pour une mini-centrale solaire, avec supervision
temps réel, historique, détection d'anomalies et prédiction de production par IA.

Un microcontrôleur **ESP32-S3** mesure tension, courant, puissance, température,
niveau de batterie et ensoleillement, puis envoie ces données à une API **Node.js +
Firestore**. Une **API Flask (scikit-learn)** fournit la prédiction de puissance et la
détection d'anomalies. Le **frontend React** affiche le tout (accueil, dashboard,
historique, page IA, alertes).

Projet capstone — BSc Artificial Intelligence, African Development University, Niamey.

## 🏗️ Structure

```
haske-energie/
├── haske-firmware/          # Firmware ESP32-S3 (haske_esp32.ino)
├── ai/                      # Intelligence artificielle (Flask, entraînement, modèles)
├── haske-backend-firebase/  # API Node.js + Firebase (Firestore)
└── haske-frontend/          # Application web React
```

> ⚠️ Le `.gitignore` exclut `*.pkl` et `*.csv`. Un dépôt fraîchement cloné ne contient
> donc **ni les modèles entraînés, ni `clean_data.csv`**. Régénérez-les avec
> `clean_data.py`, `train_prediction.py` et `train_anomaly.py`, ou copiez-les à la main.

## 🚀 Installation

### Firmware (ESP32-S3)

Ouvrir `haske-firmware/haske_esp32/haske_esp32.ino` dans l'Arduino IDE.
- Carte : **ESP32S3 Dev Module** — Vitesse moniteur : **115200**
- USB CDC On Boot : **Enabled** — USB Mode : **Hardware CDC and JTAG**
- Adapter `WIFI_SSID`, `WIFI_PASSWORD` et l'IP du PC dans `SERVER_URL`
  (relever l'IP réelle avec `ipconfig`), puis téléverser.

> 🔐 Les identifiants WiFi sont dans le fichier `.ino`. Ce dépôt étant public,
> n'y laissez jamais un mot de passe que vous utilisez ailleurs.

### Backend (Node.js + Firestore)

```bash
cd haske-backend-firebase
npm install
npm start
```

Nécessite `serviceAccountKey.json` à la racine du dossier (exclu du dépôt).

### Frontend (React)

```bash
cd haske-frontend
npm install
npm start
```

Fichier `.env` optionnel, à créer à côté de `package.json` :

```
REACT_APP_API_URL=http://localhost:5000/api
```

Sans ce fichier, l'application se rabat sur `http://localhost:5000/api`.
Create React App ne lit le `.env` qu'au démarrage : relancer `npm start` après l'avoir créé.

### IA (Flask)

```bash
cd ai/api
pip install -r requirements.txt
python app.py
```

## 🔗 Ports et points d'accès

- Frontend : <http://localhost:3000>
- Backend : <http://localhost:5000>
- IA : <http://localhost:5001>

**API Node** — onze routes capteurs et alertes :
`POST /api/sensors/data` · `GET /api/sensors/latest` · `GET /api/sensors/history` ·
`GET /api/sensors/stats` · `GET /api/alerts` · `GET /api/alerts/all` ·
`PUT /api/alerts/:id/resolve` · plus la route racine `GET /`

**API Node → IA** — six routes relayées vers Flask :
`GET /api/ai/health` · `POST /api/ai/predict/power` · `POST /api/ai/detect/anomaly` ·
`POST /api/ai/detect/anomaly/realtime` · `POST /api/ai/predict/batch` ·
`GET /api/ai/forecast` (prévision Open-Meteo sur Niamey — **nécessite internet**)

**API Flask** — cinq points d'accès :
`GET /health` · `POST /predict/power` · `POST /detect/anomaly` ·
`POST /detect/anomaly/realtime` · `POST /predict/batch`

## 🧰 Matériel

- Panneau solaire 50 W · Batterie 12 V / 4 Ah
- Régulateur de charge PWM 10 A · Convertisseur buck 5 V
- ESP32-S3 DevKitC
- Capteur de courant ACS712 (20 A) · Pont diviseur de tension (43 kΩ / 4,7 kΩ)
- Capteur de température DS18B20 · Photorésistance (LDR) pour l'ensoleillement

Brochage (toutes sur ADC1, seul convertisseur compatible WiFi) :
`GPIO1` diviseur de tension · `GPIO2` ACS712 · `GPIO4` DS18B20 · `GPIO5` LDR

## 🛠️ Stack technique

- **Firmware** : C++ (Arduino / ESP32)
- **Backend** : Node.js, Express, Firebase Firestore
- **IA** : Python, Flask, scikit-learn (Random Forest, Isolation Forest)
- **Frontend** : React (Create React App), Recharts, lucide-react

## 📊 Évaluation des modèles

Dataset : **136 293 observations** issues de deux centrales solaires publiques
(entraînement 109 034 / test 27 259).

**Random Forest — prédiction de puissance**

Cible `AC_POWER`, sans fuite de `DC_POWER`. Six variables, dominées par
`IRRADIATION` (**94,84 %** de l'importance).

| Protocole d'évaluation | R² |
|---|---|
| Découpage aléatoire | 0,846 |
| Découpage chronologique | 0,868 |
| **Validation temporelle croisée (annoncé)** | **0,830** |
| Heures d'ensoleillement uniquement | 0,686 |

MAE = 39,45 W · RMSE = 118,49 W

La proximité des trois premiers chiffres montre qu'il n'y a pas de fuite temporelle
massive. Le dernier est le plus exigeant : en retirant les zéros de nuit, triviaux à
prédire, la performance réelle du modèle apparaît.

> L'erreur de 39,45 W s'entend à l'échelle des installations d'entraînement, dont la
> production moyenne en journée atteint 484,5 W — soit 8,1 % d'erreur relative.
> L'API applique un ratio de calibration explicite (50 W / 1000 W = 0,05) pour ramener
> les prédictions à l'échelle du prototype.

**Isolation Forest — détection d'anomalies** (non supervisé, `contamination = 0.05`)

- **6 814 anomalies** détectées (5,0 % des observations)
- Validation triangulée :
  - vs règles métier par quantiles (136 293 obs) : précision 70,1 %, rappel 39,7 %, **F1 50,7 %**
  - vs étiquetage manuel (échantillon de 200 obs) : **F1 75,0 %**
- Paramètre de contamination validé par recherche par grille (0,05 → 0,20)

> ⚠️ **Piège d'unités** : `IRRADIATION` est exprimée en kW/m² et plafonne vers 0,95.
> Des seuils écrits en W/m² ne se déclenchent jamais et produisent des métriques nulles.
> Les règles de `train_anomaly.py` et de `evaluate_anomaly.py` raisonnent en quantiles
> et doivent donner les mêmes chiffres.

> ⚠️ Évaluation **indicative** : il n'existe pas de jeu d'anomalies étiqueté par expert.
> Une vérité terrain a été construite par règles métier, puis confirmée par un échantillon
> annoté manuellement. Les modèles sont entraînés sur des données externes ; une collecte
> locale étiquetée est identifiée comme amélioration future.

## 🔬 Scripts d'évaluation

Dans `ai/models/` :

- `evaluate_anomaly.py` — métriques contre les règles métier
- `test_contamination.py` — recherche par grille sur le paramètre de contamination
- `preparer_etiquetage.py` — tire 200 observations et masque les prédictions
- `evaluer_manuel.py` — compare l'étiquetage humain aux prédictions masquées

## 👥 Auteurs

**Adamou Zakari** & **Sallah Alkassoum**
African Development University (ADU/ILIMI) — Niamey, Niger
BSc Artificial Intelligence — 2025-2026