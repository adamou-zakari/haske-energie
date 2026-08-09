# Haské Énergie — Contexte pour Claude (v10 — 9 août 2026)

## Résumé en une phrase
> Projet **Haské Énergie** : monitoring d'une mini-centrale solaire au Niger — un **ESP32-S3** envoie tension / courant / puissance / température / batterie / ensoleillement vers **Node.js + Firestore** ; une **API Flask** sert des modèles **scikit-learn** (prédiction de puissance + détection d'anomalies) ; le **frontend React** affiche accueil, dashboard, historique, page IA et alertes. Trois services : React `:3000`, Node `:5000`, Flask `:5001`.

> ⚡ **Changements majeurs depuis la v9 (session du 09/08)** — audit croisé documents ↔ code :
> - **RAPPORT FINAL À 35 PAGES**, imprimé. Table des matières (68 entrées), 27 tableaux, 4 figures : zéro écart de pagination. Corps 1-30, références 31, appendices 32-35 — exactement aux deux plafonds du guideline.
> - **LE « R² = 0,99 » N'A JAMAIS EXISTÉ.** `prediction_model_info.pkl` donne aléatoire **0,846**, chronologique **0,868**, CV temporelle **0,830**, de jour **0,686**. Tous les documents qui racontaient « une découpe aléatoire gonflait à 0,99 » ont été corrigés. Le vrai argument d'honnêteté est le **0,69 restreint aux heures d'ensoleillement**.
> - **`train_anomaly.py` RÉPARÉ** : ses quatre règles testaient `IRRADIATION > 500` alors que le dataset est en kW/m² (max 0,95) → aucune étiquette → `anomaly_model_info.pkl` contenait **precision/recall/F1 = 0**. Règles remplacées par celles de `evaluate_anomaly.py` (quantiles). Résultat vérifié en exécution : **70,15 % / 39,73 % / 50,73 %**, vérité terrain 8,83 %.
> - **PLAN FINANCIER REFONDU** : VAN **+3 928 593 FCFA** à 10 % sur 5 ans (l'ancien +23 M / +125,5 M est périmé), TRI 62,8 %, IP 2,87, seuil de rentabilité 6 280 000 FCFA (97 % de l'An 1, 356ᵉ jour), résultat net positif **dès l'An 1**. Modèle = **vente** à 100 000 FCFA l'unité (coût 79 600), plus module IA facturé à part et dépannages — **plus d'abonnement AÏR/IKKEN**.
> - **7 fragments de phrase résiduels supprimés** du rapport + Tableau 1 (Porter) qui contenait deux lignes du tableau des investissements + SWOT complété (W1/W2/W3 absents).
> - **Code corrigé** : `PLANT_ID` 4136001 → 1 ; routes d'alertes dédoublonnées ; `config/firebase.js` supprimé (code mort exposant la config) ; `api.js` en variable d'environnement ; seuils de température du Dashboard alignés (50/65).

---

## 1. Structure du dépôt

```
haske-energie/
├── haske-firmware/haske_esp32/haske_esp32.ino   ← firmware (CAL_V=1.122)
├── ai/
│   ├── api/app.py                    ← 5 endpoints, PLANT_ID_REF=1, calibration 50/1000
│   ├── datasets/                     (Plant_1/2 Generation + Weather .csv)
│   ├── preprocessing/                (clean_data.py, clean_data.csv — 136 293 lignes)
│   ├── training/                     (train_prediction.py, train_anomaly.py ← RÉPARÉ)
│   ├── inference/predict.py
│   ├── models/                       (*.pkl + evaluate_anomaly.py, test_contamination.py,
│   │                                  preparer_etiquetage.py, evaluer_manuel.py)
│   └── schemas/                      (feature_importance.png, prediction_results.png…)
├── haske-backend-firebase/src/
│   ├── server.js, app.js, config/firebase.js
│   ├── controllers/ (sensors.controller.js ← cache mémoire, ai.controller.js)
│   ├── models/sensor.model.js        ← NON utilisé (code mort)
│   └── routes/ (sensors.routes.js ← alertes retirées, ai.routes.js, alerts.routes.js)
└── haske-frontend/src/
    ├── App.js, index.js, index.css, services/api.js
    ├── components/ (Card.jsx, Chart.jsx, Footer.jsx, Navbar.jsx)
    └── pages/ (Home.jsx, Dashboard.jsx, History.jsx, AI.jsx, Alerts.jsx)
```

> Tous les fichiers frontend sont en **`.jsx`** (plus de `.js` mélangés).
> `src/config/firebase.js` a été **supprimé** : personne ne l'importait.
> Le `.gitignore` exclut `*.pkl` et `*.csv` → un clone ne démarre pas sans régénérer les modèles.

---

## 2. Ports et rôles

| Service | Dossier | Port | Lancement |
|---------|---------|------|-----------|
| React | `haske-frontend/` | 3000 | `npm start` |
| Node API | `haske-backend-firebase/` | 5000 | `npm start` |
| Flask IA | `ai/api/` | 5001 | `python app.py` |

---

## 3. DESIGN SYSTEM

```
COULEURS (règle d'or : couleur = sens, pas décoration) :
  #0B1F3A  marine   → couleur PAR DÉFAUT (texte, valeurs, header, footer, bordures actives)
  #F5B301  or       → ÉNERGIE UNIQUEMENT (Puissance = métrique-héros, logo, barre batterie, courbe prod)
  #1D9E75  vert     → état OK seulement
  #BA7517  orange   → état "élevé" seulement
  #C0392B  rouge    → état critique / hors ligne seulement
  #F8FAFC  fond | #FFFFFF surfaces | #E2E8F0 bordures fines | #475569 / #94A3B8 textes secondaires

TYPO & ANIMATIONS :
  - Police Inter via Google Fonts dans public/index.html, appliquée au body.
  - Fondu-montée des cartes (@keyframes haskeFadeUp), classe .hk-card, cascade animationDelay = index*0.07s.
  - Survol géré en CSS (.hk-card:hover) — pas d'inline onMouseEnter/Leave.

PRINCIPES : sentence case ; une seule carte "hero" (Puissance) en or ; bordures 0,5px ;
icônes lucide-react monochromes ; largeur 1280px ; grilles 3 colonnes ; PAS de Tailwind.
```

`Card` : props `hero`, `status`, `index`. `Chart` : `colorFor(key)`, XAxis `created_at`, YAxis `['auto','auto']`.

---

## 4. Hardware (1 ACS monté)

```
- Panneau solaire 50W | Batterie 12V/4AH (moto YB4L-BS) ~12,1-12,18 V
- Régulateur PWM 10A | Buck 5V (sort ~5,33 V) | ESP32-S3 DevKitC
- ACS712 (20A) #1 — courant CÔTÉ CHARGE, GPIO2, offset repos 2,50 V
- Pont diviseur R1=43kΩ / R2=4,7kΩ — GPIO1 (fil point-milieu fragile, 3 incidents)
- LDR + résistance — GPIO5 (proxy ensoleillement 0..1)
- DS18B20 + pull-up 4,7kΩ — GPIO4
- Breadboard + multimètre ALDA AVD-830D
```

### Historique d'ingénierie (atouts narratifs — Section 5 du rapport)
1. **INA219 mort** (BusVoltage = 0 V) → remplacé par **diviseur + ACS712**.
2. **ESP32-S3 d'origine morte** → remplacée, reflashée.
3. **Bug de masse (21/06)** : un fil +5 V dans le GND → tous les pins railaient → vraie masse rétablie.
4. **ACS712 cru grillé (22/06)** : diagnostic méthodique → capteur **sain**, c'était le câblage.
5. **Fil diviseur débranché (25/06)** : tension à 0 + fausses alertes → réparé.

> ⚠️ **La soudure des fils est présentée partout comme une recommandation FUTURE**, pas comme faite.
> Si elle est réalisée, il faut le corriger dans le rapport (§5.3), la soutenance (diapo 5),
> la fiche branchement et l'explication simple — les quatre disent la même chose aujourd'hui.

---

## 5. Branchement (VALIDÉ)

```
MASSE COMMUNE = ligne bleue (−) de la breadboard
  = BAT- = GND buck = GND ESP = GND ACS = GND DS18B20 = bas diviseur = bas LDR

PUISSANCE : Panneau +/- → Régulateur PV+/PV- ; Batterie +/- → Régulateur BAT+/BAT-
            BAT+ → IP+ ACS712 … IP- → buck VIN+ (ACS en série = courant CHARGE) ; buck VIN- → BAT-
ALIM ESP  : USB → ESP UNIQUEMENT (le buck n'alimente JAMAIS l'ESP) + GND ESP → ligne bleue
ACS712 (GPIO2) : VCC → 5V buck | GND → ligne bleue | OUT → GPIO2 (repos 2,50 V)
DIVISEUR (GPIO1) : BAT+ → R1(43k) → milieu → R2(4,7k) → ligne bleue ; milieu → GPIO1 (~1,06 V)
DS18B20 (GPIO4) : VCC → 3.3V | GND → ligne bleue | DATA → GPIO4 | pull-up 4,7kΩ
LDR (GPIO5) : 3.3V → LDR → milieu → résistance → ligne bleue ; milieu → GPIO5
```

> Toutes les broches sont sur **ADC1**, seul convertisseur compatible WiFi sur l'ESP32-S3.
> Validation multimètre (DCV 20) : M1 ~12,1V | M2 ~5,33V | M3 ~0V | M4 ~0V | M5a ~5,33V | M5b **2,50V** | M6 ~1,06V

---

## 6. Firmware (haske_esp32.ino)

```cpp
WIFI_SSID / WIFI_PASSWORD / SERVER_URL  // ⚠️ à adapter au hotspot et à l'IP du PC (ipconfig)
INTERVALLE_MS = 30000
VBAT_PIN=1 | ACS_PIN=2 | TEMP_PIN=4 | LDR_PIN=5   (toutes ADC1)
Tension : R1=43000 ; R2=4700 ; CAL_V=1.122   (Vpin ~1,063 V → 12,107 V)
Courant : ACS_SENS=0.100 ; ACS_OFFSET auto au boot SANS charge (~2,517 V) ; garde-fou [2,0–3,0] V
Batterie % : BATT_MAX_V=12.7 / BATT_MIN_V=10.5 ; lissée, figée sous charge (>0,3 A)
Envoi : voltage, current, power, temperature, battery_level, irradiation
```

> 🔐 **Le dépôt est public et le mot de passe WiFi est en clair dans ce fichier.**
> Le retirer ne suffit pas : l'historique Git le conserve. Changer le mot de passe du hotspot.

---

## 7. Flux de données

```
ESP32 → POST /api/sensors/data (30 s)
  → Node (sensors.controller.js) → Firestore sensor_data + checkAndCreateAlerts()
Frontend React (:3000) :
  /dashboard → /api/sensors/latest (INSTANTANÉ, rafraîchi toutes les 5 s) — filtre isClean + created_at
  /history   → /api/sensors/history + /stats (MOYENNES) — filtre isClean
  /alerts    → /api/alerts + /api/alerts/all (rafraîchi toutes les 30 s)
  /ai        → /api/ai/predict/power, /detect/anomaly/realtime, /forecast, /health
Lectures servies depuis le CACHE MÉMOIRE backend (quota Firestore préservé).
```

> ℹ️ **Dashboard ≠ Historique = NORMAL** : instantané contre moyenne sur période.

---

## 8. API Node (17 routes au total)

**Capteurs et alertes (11, route racine comprise)**
`GET /` · `POST /api/sensors/data` · `GET /api/sensors/latest` · `GET /api/sensors/history?hours=|from=&to=` ·
`GET /api/sensors/stats` · `GET /api/alerts` · `GET /api/alerts/all` · `PUT /api/alerts/:id/resolve`

**Relais IA (6)**
`GET /api/ai/health` · `POST /api/ai/predict/power` · `POST /api/ai/detect/anomaly` ·
`POST /api/ai/detect/anomaly/realtime` · `POST /api/ai/predict/batch` · `GET /api/ai/forecast`

> Les routes d'alertes ne sont plus exposées en double : elles ont été retirées de
> `sensors.routes.js` et ne vivent que dans `alerts.routes.js`.
> `GET /api/ai/forecast` interroge **Open-Meteo en direct** (Niamey) → **exige internet**.
> `server.js` n'affiche que sept routes au démarrage : sa liste est incomplète, pas le code.

---

## 9. API Flask (app.py) — 5 endpoints

```python
PLANT_ID_REF = 1          # le modèle a été entraîné avec PLANT_ID ∈ {1, 2}
CALIBRATION_RATIO = 50 / 1000   # prédiction ramenée à l'échelle du panneau, clampée 0..50 W
# /health · /predict/power · /detect/anomaly · /detect/anomaly/realtime · /predict/batch
# /detect/anomaly/realtime = règles physiques sur signaux mesurés (pas de ML) : temp >65 critique,
#   >50 warning ; batterie <10 / <20 ; tension <10 / >30 ; production nulle en journée
```

> ⚠️ `debug=True` et `host='0.0.0.0'` : acceptable en démonstration, jamais en production.

---

## 10. Modèles IA — chiffres vérifiés dans les `.pkl`

```
Random Forest (puissance) — IRRADIATION, AMBIENT_TEMPERATURE, HOUR, MONTH, DAY_OF_WEEK, PLANT_ID
  Cible AC_POWER (pas de fuite DC_POWER) ; 136 293 lignes ; train 109 034 / test 27 259
  R² aléatoire 0,846 | chronologique 0,868 | CV temporelle 0,830 (ANNONCÉ) | de jour 0,686
  MAE 39,45 W / RMSE 118,49 W ; production moyenne de jour 484,5 W → 8,1 % d'erreur relative
  Importance : IRRADIATION 94,84 % | PLANT_ID 2,57 % | AMBIENT_TEMPERATURE 1,17 % | autres < 1 %
  ⚠️ Le « R² de 0,99 » raconté dans les anciennes versions n'existe dans aucun fichier.

Isolation Forest (anomalies) — AC_POWER, IRRADIATION, AMBIENT_TEMPERATURE, EFFICIENCY, HOUR
  contamination 0,05 (grid search 0,05→0,20) ; 6 814 anomalies = 5,0 %
  Vérité terrain par quantiles (8,83 %) : faible_prod 3 729 | eff_basse 3 729 | nocturne 6 996 | surchauffe 1 362
  vs règles : Précision 70,15 % | Rappel 39,73 % | F1 50,73 %
  vs étiquetage manuel (200 obs, prédictions masquées) : Précision/Rappel/F1 75,0 %
    matrice [[190 2][2 6]] — 6 anomalies sur 8 retrouvées
  ⚠️ PIÈGE D'UNITÉS : IRRADIATION est en kW/m² (max 0,95). Tout seuil écrit en W/m²
     (> 500, > 100) ne se déclenche jamais → zéro étiquette → métriques nulles.
     C'était le bug historique de train_anomaly.py, corrigé le 09/08.
```

---

## 11. Alertes (sensors.controller.js)

```
Batterie <10% CRITIQUE | <20% ÉLEVÉ | <35% MOYEN
Température >65°C CRITIQUE | >50°C ÉLEVÉ        ← mêmes seuils dans app.py et Dashboard.jsx
Tension <10V ÉLEVÉ | >30V MOYEN
Puissance=0 + voltage>5 + temp>20 → ÉLEVÉ
Tendance batterie (pente < -0.5) → MOYEN | Anti-doublon : une alerte active par type
```

---

## 12. Collections Firestore

```
sensor_data → voltage, current, power, temperature, battery_level, irradiation, timestamp
alerts      → type, severity, message, data, resolved, timestamp
```

> ⚠️ La configuration Firebase web est publique par conception : **seules les règles
> Firestore protègent la base**. Vérifier qu'elle n'est pas restée en mode test ouvert.

---

## 13. Plan financier (dossier faisant foi : `Dossier_Financier_Revise_MOsallah_Adam.xlsx`)

```
Modèle : vente de la mini-centrale complète installée à 100 000 FCFA (coût de revient 79 600),
         + module IA facturé séparément + prestations de dépannage.  (PLUS d'abonnement.)
Volumes : 50 installations en An 1 → 104 en An 5, croissance +20 %/an
Produits : 6 450 000 → 13 374 720 FCFA | Charges An 1 : 6 348 645 FCFA
Résultat net : +70 948 (An 1) → +2 976 328 (An 5)   ← POSITIF DÈS LE PREMIER EXERCICE
Cash flow : +286 894 (An 1) ; cumul 7 628 204 à l'An 5
Investissement : 1 370 433 (875 000 investissements + 495 433 fonds de roulement)
Financement : apport 425 000 + externe 945 433 (prêt d'honneur à taux quasi nul)
Seuil de rentabilité : 6 280 000 FCFA de CA = 97 % de l'An 1, point mort au 356ᵉ jour
VAN +3 928 593 FCFA (10 %, 5 ans) | TRI 62,8 % | Indice de profitabilité 2,87
Non financier : CO₂ évité 4,6 t/an (An 1), 17 t/an (An 3) ; bénéficiaires 200 → 730
```

> ⚠️ **`Dossier_Financier_Haske_Energie_CORRIGE.xlsx` porte un tout autre scénario**
> (VAN ≈ 24,7 M, investissements 912 250, cash flow négatif les deux premières années).
> C'est une version périmée : ne pas la remettre.

---

## 14. Livrables (tous alignés au 09/08)

```
Mohamed_Sallah_Alkassoum___Adamou_Zakari_Issaka_Section_Five.docx  ← rapport, 35 pages, IMPRIMÉ
Dossier_Financier_Revise_MOsallah_Adam.xlsx                        ← dossier financier faisant foi
Haske_Energie_Soutenance.pptx                                      ← 13 diapositives (guideline : 10-15)
Haske_Energie_Revision_Complete.docx        Haske_Energie_Revision_Presentation.docx
Haske_Energie_Explication_Simple.docx       Haske_Energie_Branchement_Structure.docx
Haske_Energie_Tout_comprendre_abregements.docx   Haske_Energie_Questions_sur_le_Code.docx
```

Contrôle final passé : plus aucune trace de 0,99, 748 installations, 125,5 M, 108 % de CAGR,
abonnement, actualisation à 12 %, 55 °C, « dix secondes » ni « Juin 2026 » dans aucun document.

---

## 15. Ce qui reste

```
🟠 TROIS QUESTIONS FINANCIÈRES à savoir défendre (ce ne sont PAS des corrections) :
   - Taux d'emprunt : la cellule C80 du classeur est à 0,001 (0,1 %). Nommer le dispositif
     de prêt d'honneur visé, ou renvoyer à la sensibilité à 10 % (coût 301 600 FCFA, projet
     toujours rentable) — les deux sont dans le rapport §4.4.
   - Trésorerie de décembre à 98 673 FCFA : marge mince. Deux issues notées dans le classeur —
     augmenter le fonds de roulement demandé, ou négocier un différé de six mois. En choisir une.
   - Les 50 installations de l'An 1 : hypothèse porteuse de tout le plan, non documentée.
     Une lettre d'intention ou un pilote signé changerait la nature de la réponse.

🔐 SÉCURITÉ (dépôt public) :
   - Mot de passe WiFi en clair dans le .ino → changer le mot de passe du hotspot
   - Vérifier les règles de sécurité Firestore

🟡 AVANT SOUTENANCE :
   - Emporter les .pkl et clean_data.csv sur une clé (exclus par le .gitignore)
   - Mettre à jour SSID / mot de passe / IP du PC dans le .ino, puis téléverser
   - Lancer dans l'ordre : Flask (5001), Node (5000), React (3000)
   - Prévoir une capture d'écran de la page IA : /api/ai/forecast exige internet
   - Boot de l'ESP SANS charge (offset ACS auto), puis brancher la charge

🟢 OPTIONNEL : 2e ACS712 sur GPIO3 pour mesurer la PRODUCTION du panneau (et non la charge).
   Touche 4 couches : hardware → firmware → backend → frontend. C'est la 1re recommandation §5.3.
```

---

## 16. Historique des sessions

```
✅ Antérieur : INA219→diviseur+ACS712 ; cache anti-quota Firestore ; calibration Flask 50W ;
   frontend redessiné (marine + or) ; prévision Open-Meteo ; rapport sections 1-4
✅ 28-29/06 : rapport finalisé ; faux F1=90 % retiré ; anomalies triangulées (50,7 % / 75 %)
✅ 07-08/08 : dossier financier révisé (VAN 3 928 593 à 10 %) ; pagination du rapport recalculée
✅ 09/08 : AUDIT CROISÉ DOCUMENTS ↔ CODE
   - rapport : 7 fragments résiduels, Tableau 1 pollué, SWOT incomplet → corrigés ; 35 pages, 0 écart
   - le « R² 0,99 » démenti par prediction_model_info.pkl → tous les documents réécrits
   - train_anomaly.py réparé (règles en kW/m²) → métriques réelles restaurées dans le .pkl
   - app.py : PLANT_ID 4136001 → 1 ; api.js en variable d'env ; routes d'alertes dédoublonnées ;
     config/firebase.js supprimé ; seuils Dashboard alignés (50/65)
   - abrégements : dernier document à porter les chiffres périmés, corrigé en fin de session
```

---

## 17. Auteurs
**Adamou Zakari & Sallah Alkassoum** — African Development University (ADU/ILIMI), Niamey, Niger — BSc Artificial Intelligence 2025-2026.

*v10 — 9 août 2026 — audit croisé documents ↔ code. Huit livrables alignés, quatre fichiers de code corrigés, chiffres tous vérifiés dans les fichiers sources. Reste : trois réponses financières à préparer et deux points de sécurité sur le dépôt public.*