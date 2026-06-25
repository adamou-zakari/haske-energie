"""
Haské Énergie - Modèle de Prédiction de Production Solaire
Fichier : ai/training/train_prediction.py

Ce script entraîne un modèle pour prédire AC_POWER en fonction de :
- IRRADIATION
- AMBIENT_TEMPERATURE
- HOUR
- MONTH
- DAY_OF_WEEK
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import pickle
import os

print("=" * 70)
print("🔮 HASKÉ ÉNERGIE - MODÈLE DE PRÉDICTION AC_POWER")
print("=" * 70)
print()

# ============================================================
# 1. CHARGEMENT DES DONNÉES NETTOYÉES
# ============================================================

print("📁 ÉTAPE 1 : Chargement des données nettoyées...")
print("-" * 70)

# Charger les données nettoyées
df = pd.read_csv('../preprocessing/clean_data.csv')

print(f"✅ Données chargées : {df.shape[0]:,} lignes, {df.shape[1]} colonnes")
print(f"   Colonnes : {list(df.columns)}")
print()

# ============================================================
# 2. PRÉPARATION DES FEATURES ET TARGET
# ============================================================

print("⚙️  ÉTAPE 2 : Préparation des features (variables)...")
print("-" * 70)

# Features (variables d'entrée) : ce qui influence la production
features = ['IRRADIATION', 'AMBIENT_TEMPERATURE', 'HOUR', 'MONTH', 'DAY_OF_WEEK', 'PLANT_ID']

# Target (variable à prédire) : la production d'énergie
target = 'AC_POWER'

# Créer X (features) et y (target)
X = df[features]
y = df[target]

print(f"✅ Features sélectionnées : {features}")
print(f"✅ Target : {target}")
print()
print(f"📊 Forme de X : {X.shape}")
print(f"📊 Forme de y : {y.shape}")
print()

# ============================================================
# 3. DIVISION TRAIN / TEST
# ============================================================

print("✂️  ÉTAPE 3 : Division des données (Train/Test)...")
print("-" * 70)

# Diviser les données : 80% pour l'entraînement, 20% pour le test
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

print(f"✅ Données d'entraînement : {X_train.shape[0]:,} lignes")
print(f"✅ Données de test        : {X_test.shape[0]:,} lignes")
print()

# ============================================================
# 4. ENTRAÎNEMENT DU MODÈLE
# ============================================================

print("🤖 ÉTAPE 4 : Entraînement du modèle Random Forest...")
print("-" * 70)
print("⏳ Cela peut prendre 1-2 minutes...")
print()

# Créer le modèle Random Forest Regressor
# Random Forest = plein de petits arbres de décision qui votent ensemble
model = RandomForestRegressor(
    n_estimators=100,      # 100 arbres
    max_depth=20,          # Profondeur maximale
    min_samples_split=5,   # Minimum d'échantillons pour diviser
    random_state=42,       # Pour reproduire les résultats
    n_jobs=-1              # Utiliser tous les CPU disponibles
)

# Entraîner le modèle
model.fit(X_train, y_train)

print("✅ Modèle entraîné avec succès !")
print()

# ============================================================
# 5. ÉVALUATION DU MODÈLE
# ============================================================

print("📊 ÉTAPE 5 : Évaluation des performances...")
print("-" * 70)

# Faire des prédictions sur les données de test
y_pred = model.predict(X_test)

# Calculer les métriques de performance
mae = mean_absolute_error(y_test, y_pred)
mse = mean_squared_error(y_test, y_pred)
rmse = np.sqrt(mse)
r2 = r2_score(y_test, y_pred)

print("📈 MÉTRIQUES DE PERFORMANCE :")
print()
print(f"   MAE (Mean Absolute Error)  : {mae:.2f} W")
print(f"      → En moyenne, le modèle se trompe de {mae:.2f} W")
print()
print(f"   RMSE (Root Mean Squared Error) : {rmse:.2f} W")
print(f"      → Erreur quadratique moyenne : {rmse:.2f} W")
print()
print(f"   R² Score : {r2:.4f}")
print(f"      → Le modèle explique {r2*100:.2f}% de la variance")
print()

# Interpréter le score
if r2 > 0.9:
    print("   🌟 EXCELLENT ! Le modèle est très précis !")
elif r2 > 0.7:
    print("   ✅ BON ! Le modèle est assez précis.")
elif r2 > 0.5:
    print("   ⚠️  MOYEN. Le modèle peut être amélioré.")
else:
    print("   ❌ FAIBLE. Le modèle a besoin d'améliorations.")

print()

# ============================================================
# 6. IMPORTANCE DES FEATURES
# ============================================================

print("🔍 ÉTAPE 6 : Importance des variables...")
print("-" * 70)

# Obtenir l'importance de chaque feature
feature_importance = pd.DataFrame({
    'Feature': features,
    'Importance': model.feature_importances_
}).sort_values('Importance', ascending=False)

print("📊 IMPORTANCE DES FEATURES :")
print()
for idx, row in feature_importance.iterrows():
    print(f"   {row['Feature']:25s} : {row['Importance']:.4f} ({row['Importance']*100:.2f}%)")
print()

# Visualiser l'importance des features
plt.figure(figsize=(10, 6))
sns.barplot(data=feature_importance, x='Importance', y='Feature', palette='viridis')
plt.title('Importance des Variables - Prédiction AC_POWER', fontsize=14, fontweight='bold')
plt.xlabel('Importance', fontsize=12)
plt.ylabel('Variable', fontsize=12)
plt.tight_layout()
plt.savefig('../schemas/feature_importance.png', dpi=300, bbox_inches='tight')
print("✅ Graphique d'importance sauvegardé : ai/schemas/feature_importance.png")
print()

# ============================================================
# 7. VISUALISATION DES PRÉDICTIONS
# ============================================================

print("📊 ÉTAPE 7 : Visualisation des prédictions...")
print("-" * 70)

# Créer un graphique de comparaison
fig, axes = plt.subplots(1, 2, figsize=(16, 6))

# Graphique 1 : Prédictions vs Valeurs réelles (scatter plot)
axes[0].scatter(y_test, y_pred, alpha=0.3, s=10, color='blue')
axes[0].plot([y_test.min(), y_test.max()], [y_test.min(), y_test.max()], 
             'r--', lw=2, label='Prédiction parfaite')
axes[0].set_xlabel('Valeurs Réelles (W)', fontsize=12)
axes[0].set_ylabel('Valeurs Prédites (W)', fontsize=12)
axes[0].set_title('Prédictions vs Réalité', fontsize=14, fontweight='bold')
axes[0].legend()
axes[0].grid(True, alpha=0.3)

# Graphique 2 : Distribution des erreurs
errors = y_test - y_pred
axes[1].hist(errors, bins=50, color='green', alpha=0.7, edgecolor='black')
axes[1].set_xlabel('Erreur de Prédiction (W)', fontsize=12)
axes[1].set_ylabel('Fréquence', fontsize=12)
axes[1].set_title('Distribution des Erreurs', fontsize=14, fontweight='bold')
axes[1].axvline(x=0, color='red', linestyle='--', linewidth=2, label='Erreur = 0')
axes[1].legend()
axes[1].grid(True, alpha=0.3, axis='y')

plt.tight_layout()
plt.savefig('../schemas/prediction_results.png', dpi=300, bbox_inches='tight')
print("✅ Graphique des prédictions sauvegardé : ai/schemas/prediction_results.png")
print()

# ============================================================
# 8. SAUVEGARDE DU MODÈLE
# ============================================================

print("💾 ÉTAPE 8 : Sauvegarde du modèle...")
print("-" * 70)

# Créer le dossier models s'il n'existe pas
os.makedirs('../models', exist_ok=True)

# Sauvegarder le modèle avec pickle
model_file = '../models/prediction_model.pkl'
with open(model_file, 'wb') as f:
    pickle.dump(model, f)

print(f"✅ Modèle sauvegardé : {model_file}")
print(f"   Taille : {os.path.getsize(model_file) / (1024*1024):.2f} MB")
print()

# Sauvegarder aussi les informations du modèle
model_info = {
    'features': features,
    'target': target,
    'mae': mae,
    'rmse': rmse,
    'r2_score': r2,
    'n_samples_train': len(X_train),
    'n_samples_test': len(X_test)
}

info_file = '../models/prediction_model_info.pkl'
with open(info_file, 'wb') as f:
    pickle.dump(model_info, f)

print(f"✅ Informations sauvegardées : {info_file}")
print()

# ============================================================
# 9. TEST RAPIDE DU MODÈLE
# ============================================================

print("🧪 ÉTAPE 9 : Test rapide du modèle...")
print("-" * 70)

# Créer un exemple de prédiction
exemple = pd.DataFrame({
    'IRRADIATION': [800.0],
    'AMBIENT_TEMPERATURE': [30.0],
    'HOUR': [12],
    'MONTH': [6],
    'DAY_OF_WEEK': [2],
    'PLANT_ID': [1]
})

prediction = model.predict(exemple)[0]

print("📝 EXEMPLE DE PRÉDICTION :")
print()
print(f"   Irradiation         : {exemple['IRRADIATION'].values[0]:.2f} W/m²")
print(f"   Température         : {exemple['AMBIENT_TEMPERATURE'].values[0]:.2f} °C")
print(f"   Heure               : {exemple['HOUR'].values[0]:02d}:00")
print(f"   Mois                : {exemple['MONTH'].values[0]}")
print(f"   Jour de la semaine  : {exemple['DAY_OF_WEEK'].values[0]}")
print()
print(f"   ⚡ PRODUCTION PRÉDITE : {prediction:.2f} W")
print()

# ============================================================
# 10. RÉSUMÉ FINAL
# ============================================================

print("=" * 70)
print("✅ MODÈLE DE PRÉDICTION ENTRAÎNÉ AVEC SUCCÈS !")
print("=" * 70)
print()
print("📊 RÉSUMÉ :")
print(f"   - Précision (R²)     : {r2*100:.2f}%")
print(f"   - Erreur moyenne     : {mae:.2f} W")
print(f"   - Modèle sauvegardé  : {model_file}")
print()
print("🎯 Prochaine étape : Modèle de détection d'anomalies")
print()