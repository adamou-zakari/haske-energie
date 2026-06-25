"""
Haské Énergie - Modèle de Prédiction de Production Solaire (VERSION CORRIGÉE)
Fichier : ai/training/train_prediction.py

Prédit AC_POWER à partir de : IRRADIATION, AMBIENT_TEMPERATURE, HOUR, MONTH, DAY_OF_WEEK, PLANT_ID

>>> CORRECTION MÉTHODOLOGIQUE <<<
Le R²=0,99 obtenu avec un train_test_split ALÉATOIRE est GONFLÉ car :
  (1) les données sont temporelles (mesures toutes les 15 min) -> deux points
      voisins sont quasi identiques ; un shuffle en met un en train, l'autre en
      test => le modèle "reconnaît" presque les réponses (fuite temporelle).
  (2) beaucoup de zéros de nuit (irradiation=0 -> puissance=0) faciles à prédire,
      ce qui gonfle artificiellement le R².

Ce script évalue donc HONNÊTEMENT :
  - split chronologique (shuffle=False) : on teste sur le FUTUR, jamais vu
  - validation croisée temporelle (TimeSeriesSplit)
  - R² de JOUR uniquement (là où la prédiction a un vrai intérêt)
  - et affiche aussi le R² "aléatoire" pour montrer l'écart (à discuter dans le rapport)
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import train_test_split, TimeSeriesSplit, cross_val_score
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import pickle
import os

print("=" * 70)
print("HASKE ENERGIE - MODELE DE PREDICTION AC_POWER (evaluation honnete)")
print("=" * 70)

# ============================================================
# 1. CHARGEMENT
# ============================================================
df = pd.read_csv('../preprocessing/clean_data.csv')
print(f"Donnees : {df.shape[0]:,} lignes, {df.shape[1]} colonnes")

# Remettre dans l'ordre chronologique si une colonne de date existe
for col in ['DATE_TIME', 'datetime', 'timestamp', 'date_time']:
    if col in df.columns:
        df[col] = pd.to_datetime(df[col], errors='coerce')
        df = df.sort_values(col).reset_index(drop=True)
        print(f"Donnees triees chronologiquement sur '{col}'")
        break
else:
    print("ATTENTION : pas de colonne date trouvee -> on suppose le CSV deja "
          "dans l'ordre chronologique (sinon le split temporel n'est pas fiable).")

# ============================================================
# 2. FEATURES / TARGET
# ============================================================
features = ['IRRADIATION', 'AMBIENT_TEMPERATURE', 'HOUR', 'MONTH', 'DAY_OF_WEEK', 'PLANT_ID']
target = 'AC_POWER'
X = df[features]
y = df[target]
print(f"Features : {features}")
print(f"Target   : {target}")

model_params = dict(n_estimators=100, max_depth=20, min_samples_split=5,
                    random_state=42, n_jobs=-1)

# ============================================================
# 3a. (POUR COMPARAISON) SPLIT ALEATOIRE -> R2 GONFLE
# ============================================================
print("\n--- (A) Split ALEATOIRE (gonfle, NON fiable pour des donnees temporelles) ---")
Xtr_r, Xte_r, ytr_r, yte_r = train_test_split(X, y, test_size=0.2, random_state=42)
m_r = RandomForestRegressor(**model_params).fit(Xtr_r, ytr_r)
r2_random = r2_score(yte_r, m_r.predict(Xte_r))
print(f"R2 (split aleatoire) : {r2_random:.4f}   <-- c'est le 0,99 trompeur")

# ============================================================
# 3b. SPLIT CHRONOLOGIQUE (HONNETE) : on teste sur le futur
# ============================================================
print("\n--- (B) Split CHRONOLOGIQUE (honnete : test sur le futur jamais vu) ---")
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, shuffle=False)
print(f"Train : {len(X_train):,}  |  Test : {len(X_test):,}")

model = RandomForestRegressor(**model_params)
model.fit(X_train, y_train)
y_pred = model.predict(X_test)

mae = mean_absolute_error(y_test, y_pred)
rmse = np.sqrt(mean_squared_error(y_test, y_pred))
r2 = r2_score(y_test, y_pred)
print(f"MAE  : {mae:.2f} W")
print(f"RMSE : {rmse:.2f} W")
print(f"R2 (chronologique, TOUTES heures) : {r2:.4f}")

# ============================================================
# 3c. R2 DE JOUR UNIQUEMENT (les zeros de nuit gonflent le R2)
# ============================================================
jour = X_test['IRRADIATION'] > 0.05   # seuil : il y a du soleil
if jour.sum() > 10:
    r2_jour = r2_score(y_test[jour], y_pred[jour])
    mae_jour = mean_absolute_error(y_test[jour], y_pred[jour])
    print(f"R2 (chronologique, JOUR seulement) : {r2_jour:.4f}   (MAE jour : {mae_jour:.2f} W)")
else:
    r2_jour = None

# ============================================================
# 3d. VALIDATION CROISEE TEMPORELLE (robuste)
# ============================================================
print("\n--- (C) Validation croisee temporelle (TimeSeriesSplit, 5 folds) ---")
tscv = TimeSeriesSplit(n_splits=5)
cv_scores = cross_val_score(RandomForestRegressor(**model_params), X, y,
                            cv=tscv, scoring='r2', n_jobs=-1)
print(f"R2 par fold : {np.round(cv_scores, 4)}")
print(f"R2 moyen (CV temporelle) : {cv_scores.mean():.4f}  (+/- {cv_scores.std():.4f})")

# ============================================================
# 4. INTERPRETATION HONNETE
# ============================================================
print("\n" + "=" * 70)
print("INTERPRETATION (a mettre dans le rapport)")
print("=" * 70)
print(f"  R2 split aleatoire      : {r2_random:.3f}  (gonfle - fuite temporelle)")
print(f"  R2 split chronologique  : {r2:.3f}  (honnete, toutes heures)")
if r2_jour is not None:
    print(f"  R2 de jour seulement    : {r2_jour:.3f}  (performance reelle utile)")
print(f"  R2 moyen CV temporelle  : {cv_scores.mean():.3f}  (estimation robuste)")
print()
print("  -> Dans le rapport, annoncer le R2 CHRONOLOGIQUE / CV, pas le 0,99 aleatoire.")
print("  -> Mentionner que l'irradiation explique l'essentiel de la production")
print("     (relation physique forte), et que les zeros de nuit facilitent la tache.")

# ============================================================
# 5. IMPORTANCE DES FEATURES
# ============================================================
feature_importance = pd.DataFrame({
    'Feature': features, 'Importance': model.feature_importances_
}).sort_values('Importance', ascending=False)
print("\nImportance des features :")
for _, row in feature_importance.iterrows():
    print(f"   {row['Feature']:22s} : {row['Importance']*100:5.2f}%")

plt.figure(figsize=(10, 6))
sns.barplot(data=feature_importance, x='Importance', y='Feature', palette='viridis')
plt.title('Importance des Variables - Prediction AC_POWER')
plt.tight_layout()
os.makedirs('../schemas', exist_ok=True)
plt.savefig('../schemas/feature_importance.png', dpi=300, bbox_inches='tight')

# ============================================================
# 6. GRAPHIQUES PREDICTIONS (sur le test chronologique)
# ============================================================
fig, axes = plt.subplots(1, 2, figsize=(16, 6))
axes[0].scatter(y_test, y_pred, alpha=0.3, s=10, color='blue')
axes[0].plot([y_test.min(), y_test.max()], [y_test.min(), y_test.max()], 'r--', lw=2, label='Prediction parfaite')
axes[0].set_xlabel('Valeurs Reelles (W)'); axes[0].set_ylabel('Valeurs Predites (W)')
axes[0].set_title('Predictions vs Realite (test chronologique)'); axes[0].legend(); axes[0].grid(True, alpha=0.3)
errors = y_test - y_pred
axes[1].hist(errors, bins=50, color='green', alpha=0.7, edgecolor='black')
axes[1].set_xlabel('Erreur (W)'); axes[1].set_ylabel('Frequence'); axes[1].set_title('Distribution des Erreurs')
axes[1].axvline(x=0, color='red', linestyle='--', lw=2); axes[1].grid(True, alpha=0.3, axis='y')
plt.tight_layout()
plt.savefig('../schemas/prediction_results.png', dpi=300, bbox_inches='tight')

# ============================================================
# 7. SAUVEGARDE (modele entraine sur le split chronologique)
# ============================================================
os.makedirs('../models', exist_ok=True)
with open('../models/prediction_model.pkl', 'wb') as f:
    pickle.dump(model, f)
model_info = {
    'features': features, 'target': target,
    'mae': mae, 'rmse': rmse,
    'r2_random_split': r2_random,
    'r2_time_split': r2,
    'r2_daytime': r2_jour,
    'r2_cv_mean': float(cv_scores.mean()),
    'n_samples_train': len(X_train), 'n_samples_test': len(X_test),
}
with open('../models/prediction_model_info.pkl', 'wb') as f:
    pickle.dump(model_info, f)
print(f"\nModele + infos sauvegardes dans ../models/")
print("=" * 70)
print("TERMINE")
print("=" * 70)