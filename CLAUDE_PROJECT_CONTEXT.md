# Haské Énergie — Contexte pour Claude (v7 — 23 Juin 2026)

## Résumé en une phrase
> Projet **Haské Énergie** : monitoring d'une mini-centrale solaire au Niger — un **ESP32-S3** envoie tension / courant / puissance / température / batterie / ensoleillement vers **Node.js + Firestore** ; une **API Flask** sert des modèles **scikit-learn** (prédiction de puissance + détection d'anomalies) ; le **frontend React** affiche accueil, dashboard, historique, page IA et alertes. Trois services : React `:3000`, Node `:5000`, Flask `:5001`.

> ⚡ **Changements majeurs depuis la v6 (session du 23/06 après-midi)** :
> - **FRONTEND ENTIÈREMENT REDESIGNÉ** au niveau pro. Palette disciplinée : **marine #0B1F3A = défaut, or #F5B301 = énergie uniquement, vert/orange/rouge = états seulement**. Sentence case partout. 9 fichiers refaits (voir §17).
> - **Base Firestore vidée** (collections `sensor_data` + `alerts` supprimées) → **plus de pic fantôme à 360 W**. À régénérer avec l'ESP branché.
> - **Pas de Tailwind** : le frontend reste en **styles inline** (Tailwind n'apporterait rien visuellement, n'a pas été installé — décision assumée).
> - Le hardware reste **complet et validé** (inchangé depuis v6).

---

## 1. Structure du dépôt

```
haske-energie/
├── haske-firmware/
│   └── haske_esp32/
│       └── haske_esp32.ino            ← firmware (CAL_V=1.122, ACS validé)
├── ai/
│   ├── api/ (app.py — calibration 50W + seuils, requirements.txt)
│   ├── datasets/  (Plant_1/2_Generation + Weather_Sensor .csv)
│   ├── preprocessing/ (clean_data.py, clean_data.csv)
│   ├── training/ (train_prediction.py ← CORRIGÉ, train_anomaly.py)
│   ├── inference/predict.py
│   ├── models/ (prediction_model.pkl, anomaly_model.pkl, anomaly_scaler.pkl, *_info.pkl)
│   └── schemas/ (feature_importance.png, prediction_results.png, etc.)
├── haske-backend-firebase/
│   └── src/
│       ├── server.js, app.js, config/firebase.js
│       ├── controllers/ (sensors.controller.js ← cache mémoire + resolveAlert durci, ai.controller.js)
│       ├── models/sensor.model.js  (NON utilisé — code mort)
│       └── routes/ (sensors.routes.js, ai.routes.js)
└── haske-frontend/
    └── src/
        ├── App.js, config/firebase.js, services/api.js
        ├── components/ (Card.jsx, Chart.jsx, Footer.jsx, Navbar.jsx)  ← TOUS redesignés
        └── pages/ (Home.jsx, Dashboard.js, History.jsx, AI.js, Alerts.js)  ← TOUS redesignés
```

---

## 2. Ports et rôles

| Service | Dossier | Port | Lancement |
|---------|---------|------|-----------|
| React | `haske-frontend/` | 3000 | `npm start` |
| Node API | `haske-backend-firebase/` | 5000 | `npm start` |
| Flask IA | `ai/api/` | 5001 | `python app.py` |

---

## 3. DESIGN SYSTEM (À JOUR — appliqué le 23/06)

```
COULEURS (règle d'or : couleur = sens, pas décoration) :
  #0B1F3A  marine   → couleur PAR DÉFAUT (texte, valeurs, header, footer, bordures actives)
  #F5B301  or       → ÉNERGIE UNIQUEMENT (Puissance = métrique-héros, logo, barre batterie, courbe prod)
  #1D9E75  vert     → état OK seulement
  #BA7517  orange   → état "élevé" seulement
  #C0392B  rouge    → état critique / hors ligne seulement
  #F8FAFC  fond     | #FFFFFF surfaces | #E2E8F0 bordures fines | #475569 / #94A3B8 textes secondaires

PRINCIPES APPLIQUÉS :
  - Sentence case ("Tableau de bord", pas "DASHBOARD") — fini les MAJUSCULES
  - Une seule carte "hero" (Puissance) en or ; toutes les autres valeurs en marine
  - Bordures fines (0,5px) + filet or en haut SEULEMENT sur la carte Puissance
  - Icônes lucide-react monochromes discrètes (pas de pastilles colorées)
  - Largeur 1280px alignée sur toutes les pages ; grilles 3 colonnes (2×3, pas d'orphelin)
  - Boutons "Actualiser" en contour marine (l'or reste réservé à l'action principale / énergie)
  - PAS de Tailwind → tout en styles inline React (style={{...}})
```

Composant `Card` : props `hero` (or, pour Puissance) et `status` ("normal"/"warning"/"danger" → petit badge). Plus de prop `color`.

---

## 4. Hardware utilisé (À JOUR — inchangé depuis v6)

```
- Panneau solaire 50W
- Batterie 12V / 4AH (moto YB4L-BS)        ← mesurée ~12,1 V (OK)
- Régulateur PWM 10A (Solar Charge Controller)
- Buck converter fixe 5V (entrée VIN+/VIN-, sortie 5V/GND + USB) → sort ~5,33 V
- ESP32-S3 (DevKitC)                         ← carte neuve (l'originale est morte le 21/06)
- ACS712 (20A) — capteur courant            ← VALIDÉ SAIN (OUT repos 2,50 V, offset 2,517 V)
- 2e ACS712 (20A)                            ← PIÈCE DE SECOURS (testée, non montée)
- Pont diviseur tension : R1=43kΩ + R2=4.7kΩ
- LDR (photorésistance) + sa résistance      ← ensoleillement (proxy, GPIO5)
- DS18B20 (température OneWire) + pull-up 4.7kΩ
- Breadboard + Multimètre ALDA AVD-830D
```

### Historique d'ingénierie (à raconter dans le rapport = atouts narratifs)
1. **INA219 mort** (BusVoltage = 0 V en I2C alors que 12,66 V présents) → remplacé par **diviseur + ACS712**.
2. **ESP32-S3 d'origine morte** (connecteur USB / alim parasite) → **remplacée** par même modèle, reflashée.
3. **Bug de masse (21/06)** : un fil **+5 V** branché par erreur dans le GND → tous les pins railaient (35 V/31 A) → corrigé par une vraie masse (0 V).
4. **ACS712 cru grillé (22/06)** : OUT lisait 5,33 V. Diagnostic méthodique (isolation, continuité) → en fait **câblage/contact**, pas le chip. Capteur **sain**, courant récupéré.

---

## 5. Branchement hardware (VALIDÉ — inchangé depuis v6)

```
MASSE COMMUNE = ligne bleue (−) de la breadboard
  = BAT- = GND buck = GND ESP = GND ACS = GND DS18B20 = bas diviseur = bas LDR

CIRCUIT PUISSANCE :
  Panneau +/- → Régulateur PV+/PV-
  Batterie +/- → Régulateur BAT+/BAT-
  BAT+ → IP+ ACS712 … IP- → buck VIN+      (ACS712 en série = courant charge)
  buck VIN- → BAT-

ALIMENTATION ESP : USB → ESP UNIQUEMENT (le buck n'alimente JAMAIS l'ESP)
  + un fil GND ESP → ligne bleue (−)

ACS712 (courant, GPIO2) :  VALIDÉ ✅   VCC → 5V buck | GND → ligne bleue | OUT → GPIO2 (repos 2,50 V)
DIVISEUR TENSION (GPIO1) : VALIDÉ ✅   BAT+ → R1(43k) → milieu → R2(4,7k) → ligne bleue ; milieu → GPIO1
DS18B20 (GPIO4) :          VCC → 3.3V | GND → ligne bleue | DATA → GPIO4 | pull-up 4,7kΩ DATA↔3.3V
LDR (GPIO5) :              3.3V → LDR → milieu → résistance → ligne bleue ; milieu → GPIO5
```

> ⚠️ **LEÇONS CLÉS :** un fil ne rentre dans GND que s'il lit ~0 V (DC) ; une seule masse commune ;
> le 5V des broches ESP32-S3 ne sort rien (~0,3 V) → ACS712 alimenté par le 5V du buck (ratiométrique) ;
> OUT ne va sur GPIO2 qu'après validation à ~2,5 V en isolation.

### Validation multimètre (DCV 20) — tous ✅ : M1 batterie ~12,1V | M2 buck ~5,33V | M3 rail ~0V | M4 GND ESP ~0V | M5a VCC ACS ~5,33V | M5b OUT ACS **2,50V** | M6 diviseur ~1,06V

---

## 6. Firmware ESP32 (haske_esp32.ino — À JOUR)

```cpp
WIFI_SSID = "Iphone" | WIFI_PASSWORD = "00000001"
SERVER_URL = "http://192.168.43.88:5000/api/sensors/data"
// ⚠️ SSID / mot de passe / IP CHANGENT selon le hotspot et l'IP du PC du jour (ipconfig).
INTERVALLE_MS = 30000
VBAT_PIN=1 | ACS_PIN=2 | TEMP_PIN=4 | LDR_PIN=5   (toutes ADC1 = compatible WiFi)
Tension : R1=43000 ; R2=4700 ; CAL_V=1.122   (Vpin~1,063 V → 12,107 V)
Courant : ACS_SENS=0.100 ; ACS_OFFSET auto au boot SANS charge (~2,517 V) ; garde-fou [2,0–3,0]V
LDR : LDR_DARK=0 ; LDR_BRIGHT=4095 (proxy 0..1) ; "soleil=3057" non appliqué (garder 4095)
Batterie % : BATT_MAX_V=12.7 / BATT_MIN_V=10.5 ; lissée + figée sous charge (>0.3A)
Données envoyées : voltage, current, power, temperature, battery_level, irradiation
```

---

## 7. Flux de données

```
ESP32 → POST /api/sensors/data (30s)
  → Node (sensors.controller.js) → Firestore sensor_data + checkAndCreateAlerts() + Flask :5001 anomalie
Frontend React (:3000) :
  /dashboard → /api/sensors/latest (INSTANTANÉ)
  /history   → /api/sensors/history + /stats (MOYENNES)
  /alerts    → /api/alerts + /api/alerts/all
  /ai        → /api/ai/predict/power, /api/ai/detect/anomaly, /api/ai/forecast
Lectures servies depuis le CACHE MÉMOIRE backend (quota Firestore préservé).
```

> ℹ️ **Dashboard ≠ Historique = NORMAL** : Dashboard = instantané, Historique = moyenne sur période.

---

## 8. API Node (routes)

`POST /api/sensors/data` · `GET /api/sensors/latest` · `GET /api/sensors/history?hours=` · `GET /api/sensors/stats` · `GET /api/alerts` · `GET /api/alerts/all` · `PUT /api/alerts/:id/resolve` (durci) · `GET /api/ai/health` · `POST /api/ai/predict/power` · `POST /api/ai/detect/anomaly` · `GET /api/ai/forecast` (Open-Meteo Niamey)

---

## 9. API Flask IA (app.py)

```python
prediction_final = prediction_raw * (50 / 1000)   # calibration 50W, clampé 0..50W
# Seuils anomalies : faible prod <5W ; surchauffe >45°C ; nocturne (h<6 ou >20) ; efficacité faible
# Endpoints : /health, /predict/power, /detect/anomaly, /predict/batch
```

---

## 10. Modèles IA — ÉVALUATION HONNÊTE

```
Random Forest (puissance) — features : IRRADIATION, AMBIENT_TEMPERATURE, HOUR, MONTH, DAY_OF_WEEK, PLANT_ID
  Target AC_POWER (pas de fuite DC_POWER) ; dataset 136 293 lignes (Inde)
  R² aléatoire 0.846 (gonflé) | chrono 0.868 | de jour 0.686 | CV temporelle 0.830 (→ À ANNONCER)
  MAE 39W global / 83W jour ; IRRADIATION = 94,8% de l'importance (→ piloté par le LDR, PAS le courant)
Isolation Forest (anomalies) : F1=90% (annoncé) — À RE-VÉRIFIER comme le R²
```

> ℹ️ La prédiction IA **n'utilise PAS l'ACS712** (irradiation/LDR + temp + heure). Sur la page IA :
> R² affiché traduit en "Confiance · Élevée (R² 0.83)" pour rester lisible non-technicien + crédible jury.
> Score de santé = **calculé** (100 − pénalités selon anomalies/staleness), PAS codé en dur.

---

## 11. Alertes (sensors.controller.js)

```
Batterie <10% CRITIQUE | <20% ÉLEVÉ | <35% MOYEN
Temp >65°C CRITIQUE | >50°C ÉLEVÉ
Tension <10V ÉLEVÉ | >30V MOYEN
Puissance=0 + voltage>5 + temp>20 → ÉLEVÉ
Tendance batterie (pente <-0.5) → MOYEN | IA anomalie → MOYEN | Anti-doublon : 1 alerte active/type
```
Page Alertes : compteurs uniformes (bordures identiques), gravité sémantique (Critique = ROUGE, pas jaune), historique repliable.

---

## 12. Collections Firestore

```
sensor_data → voltage, current, power, temperature, battery_level, irradiation, timestamp
alerts      → type, severity, message, data, resolved, timestamp
```

> ✅ **VIDÉES le 23/06** (sensor_data + alerts supprimées). Seul `_test` reste (doc connexion, à garder).
> Se recréent automatiquement dès que l'ESP poste / qu'une alerte se déclenche.
> ⚠️ Si un pic 360 V/W réapparaît : c'est une vieille donnée ré-enregistrée OU un fil ADC qui flotte → vérifier.

---

## 13. État des mesures (À JOUR)

```
✅ Tension 12,107 V (CAL_V=1.122) | ✅ Courant (ACS712 sain, offset 2,517 V) | ✅ Puissance V×I
✅ Batterie % (~73%, lissé/figé sous charge) | ✅ Température ~30°C | ✅ Ensoleillement LDR ~0,18-0,44
✅ Backend / Firestore / Dashboard / IA → chaîne complète [HTTP] OK
```
> **Aucune simulation.** Valeurs = vraies lectures. CAL_V/ACS_SENS/LDR = constantes de calibration.

---

## 14. CE QUI RESTE À FAIRE (par priorité)

```
🔴 RAPPORT (priorité 1 absolue — n'a PAS encore avancé, plus gros levier de note) :
   - Section 5 (Réflexion & Conclusion)
   - Citations APA + liste de références
   - Section Hardware : raconter INA219 mort → diviseur+ACS712 → carte ESP remplacée →
     bug de masse → ACS cru grillé puis diagnostiqué SAIN (démarche de débogage = très valorisé)
   - R² honnête (~0,83) à la place de l'ancien 0,99
   - Section "Limites" : LDR=proxy (pas pyranomètre) ; courant côté charge seulement ;
     OUT ACS direct sur GPIO2 (limite ~6A, diviseur sur OUT plus propre) ; prototype breadboard ;
     % batterie estimé par tension

🟠 AVANT SOUTENANCE :
   - SOUDER / sécuriser les fils (VCC/GND/OUT ACS + point milieu → GPIO1) — un fil = toute la galère
   - Régénérer des données propres : ESP branché + laisser tourner (base vidée le 23/06)
   - Vérifier WiFi + IP du PC (ipconfig) le jour J dans SERVER_URL
   - Répétition : boot SANS charge (offset ACS), puis brancher la charge

🟡 OPTIONNEL (bonus visuel, seulement si rapport fini + énergie) :
   - Améliorations design : police Inter, animations douces (fondu cartes) — discuté, non codé
   - 2e ACS712 sur panneau → "production mesurée vs prédite" (NON nécessaire)
   - Re-vérifier Isolation Forest (F1) ; vérifier R1/R2 réelles
   - NE PAS installer Tailwind (aucun gain visuel, risque inutile)
```

---

## 15. Lancer le projet

```bash
cd ai/api && python app.py                    # Flask :5001
cd haske-backend-firebase && npm start         # Node :5000
cd haske-frontend && npm start                 # React :3000
# ESP32 : Arduino IDE → haske_esp32.ino → ESP32S3 Dev Module → 115200 → Téléverser
#   USB Mode "Hardware CDC and JTAG" | USB CDC On Boot "Enabled" | UART0/Hardware CDC
#   16MB (3MB APP/9.9MB FATFS) | 240MHz
# WiFi/IP : mettre SSID + IP réelle du PC (ipconfig) dans le .ino
```

---

## 16. Historique des sessions

```
✅ Antérieur : INA219→diviseur+ACS712 ; R² ré-évalué honnêtement ; cache anti-quota Firestore ;
   resolveAlert durci ; calibration Flask 50W ; rapport sections 1-4 ; prévision Open-Meteo
✅ 21/06 : carte ESP morte→remplacée ; bug masse (+5V dans GND) corrigé ; CAL_V 1.1277→2.12 ; LDR doc
✅ 22-23/06 nuit : ACS712 diagnostiqué SAIN (OUT 2,50V, offset 2,517V) ; diviseur remonté
   (Vpin 0,56→1,063V) → CAL_V 2.12→1.122 → 12,107V ; système validé M1→M6 ; 2e ACS = secours
✅ 23/06 après-midi : FRONTEND REDESIGNÉ (9 fichiers, palette marine+or) ; Firestore vidé (pic 360W
   éliminé) ; pas de Tailwind (inline conservé)
```

---

## 17. Fichiers frontend redesignés le 23/06 (palette marine+or, inline, structure préservée)

```
✅ components/Navbar.jsx   → fond marine uni, liens sobres, badge alerte discret. LOGO d'origine (rond jaune) intact.
✅ components/Card.jsx     → props hero (or) + status (badge). Plus de prop color. Icône grise discrète.
✅ components/Footer.jsx   → fond marine, titres colonnes gris, logo d'origine intact.
✅ components/Chart.jsx    → palette marine+or ; YAxis domain ['auto','auto'] (échelle auto = fini les lignes plates).
✅ pages/Home.jsx         → titre marine (plus l'or géant), cartes Monitoring(or)/IA(marine), bouton or (CTA).
✅ pages/Dashboard.js     → grille 3 colonnes (2×3), Puissance en hero, bouton Actualiser contour marine,
                            bandeau hors-ligne conservé (point fort), batterie barre or + valeur marine.
✅ pages/History.jsx      → largeur 1280, stats 3 colonnes (Puissance hero), graphes marine sauf Puissance(or),
                            calendrier/périodes en marine, export CSV conservé.
✅ pages/AI.js            → DOUBLON capteurs SUPPRIMÉ ; score de santé (calculé) + diagnostic + prédiction
                            (barres) + prévision Open-Meteo mise en valeur ; R² traduit "Élevée" ;
                            "tendance 20 mesures" cachée si <4 points (évite courbe plate).
✅ pages/Alerts.js        → compteurs uniformes, gravité sémantique (Critique=rouge), cartes filet gauche,
                            bouton Résoudre contour vert, historique repliable.
```

---

## 18. Auteurs
**Adamou Zakari & Sallah Alkassoum** — African Development University (ADU/ILIMI), Niamey, Niger — BSc Artificial Intelligence 2025-2026. Soutenance ~juillet 2026.

*v7 — 23 juin 2026 — hardware validé + frontend redesigné (pro) + base nettoyée. Priorité restante : LE RAPPORT.*