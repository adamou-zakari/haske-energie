"""
Haské Énergie - Modèle de Détection d'Anomalies
Fichier : ai/training/train_anomaly.py

Ce script entraîne un modèle pour détecter :
- Production trop faible
- Surchauffe
- Valeurs anormales
- Défaillances du système
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import classification_report, confusion_matrix
import pickle
import os

print("=" * 70)
print("🚨 HASKÉ ÉNERGIE - MODÈLE DE DÉTECTION D'ANOMALIES")
print("=" * 70)
print()

# ============================================================
# 1. CHARGEMENT DES DONNÉES
# ============================================================

print("📁 ÉTAPE 1 : Chargement des données...")
print("-" * 70)

df = pd.read_csv('../preprocessing/clean_data.csv')

print(f"✅ Données chargées : {df.shape[0]:,} lignes")
print()

# ============================================================
# 2. CRÉATION DES LABELS D'ANOMALIES
# ============================================================

print("🏷️  ÉTAPE 2 : Création des labels d'anomalies...")
print("-" * 70)

# Nous allons créer des labels basés sur des règles métier
# Une anomalie = une situation anormale

def detect_anomalies(row):
    """
    Fonction pour détecter les anomalies basée sur des règles
    Retourne 1 si anomalie, 0 si normal
    """
    anomaly = 0
    
    # Règle 1 : Production trop faible avec forte irradiation
    # Si irradiation > 500 W/m² mais AC_POWER < 1000 W → problème
    if row['IRRADIATION'] > 500 and row['AC_POWER'] < 1000:
        anomaly = 1
    
    # Règle 2 : Température trop élevée
    # Si température > 45°C → surchauffe possible
    if row['AMBIENT_TEMPERATURE'] > 45:
        anomaly = 1
    
    # Règle 3 : Efficacité très faible
    # Si efficacité < 0.5 → problème de conversion
    if row['EFFICIENCY'] < 0.5 and row['IRRADIATION'] > 100:
        anomaly = 1
    
    # Règle 4 : Production en pleine nuit (impossible)
    # Si heure entre 22h et 5h et AC_POWER > 100 W → anomalie
    if (row['HOUR'] >= 22 or row['HOUR'] <= 5) and row['AC_POWER'] > 100:
        anomaly = 1
    
    return anomaly

# Appliquer la détection
df['ANOMALY'] = df.apply(detect_anomalies, axis=1)

# Compter les anomalies
n_anomalies = df['ANOMALY'].sum()
n_normal = len(df) - n_anomalies
pct_anomalies = (n_anomalies / len(df)) * 100

print(f"✅ Anomalies détectées : {n_anomalies:,} ({pct_anomalies:.2f}%)")
print(f"✅ Données normales    : {n_normal:,} ({100-pct_anomalies:.2f}%)")
print()

# ============================================================
# 3. PRÉPARATION DES DONNÉES POUR LE MODÈLE
# ============================================================

print("⚙️  ÉTAPE 3 : Préparation des features...")
print("-" * 70)

# Features pour la détection d'anomalies
features_anomaly = [
    'AC_POWER', 
    'IRRADIATION', 
    'AMBIENT_TEMPERATURE', 
    'EFFICIENCY',
    'HOUR'
]

X = df[features_anomaly]
y = df['ANOMALY']

print(f"✅ Features sélectionnées : {features_anomaly}")
print(f"✅ Forme de X : {X.shape}")
print()

# ============================================================
# 4. NORMALISATION DES DONNÉES
# ============================================================

print("📏 ÉTAPE 4 : Normalisation des données...")
print("-" * 70)

# Normaliser les données (mettre toutes les valeurs sur la même échelle)
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

print("✅ Données normalisées (moyenne=0, écart-type=1)")
print()

# ============================================================
# 5. ENTRAÎNEMENT DU MODÈLE ISOLATION FOREST
# ============================================================

print("🤖 ÉTAPE 5 : Entraînement du modèle Isolation Forest...")
print("-" * 70)
print("⏳ Cela peut prendre 30 secondes à 1 minute...")
print()

# Isolation Forest : algorithme spécialisé dans la détection d'anomalies
# Il "isole" les points anormaux des points normaux
model = IsolationForest(
    n_estimators=100,        # 100 arbres
    contamination=0.05,      # On estime 5% d'anomalies
    random_state=42,
    n_jobs=-1
)

# Entraîner le modèle
model.fit(X_scaled)

print("✅ Modèle entraîné avec succès !")
print()

# ============================================================
# 6. PRÉDICTIONS
# ============================================================

print("🔮 ÉTAPE 6 : Prédiction des anomalies...")
print("-" * 70)

# Faire des prédictions (-1 = anomalie, 1 = normal)
predictions = model.predict(X_scaled)

# Convertir en format binaire (1 = anomalie, 0 = normal)
predictions_binary = np.where(predictions == -1, 1, 0)

# Ajouter les prédictions au dataframe
df['PREDICTED_ANOMALY'] = predictions_binary

# Compter les anomalies prédites
n_pred_anomalies = predictions_binary.sum()
pct_pred = (n_pred_anomalies / len(df)) * 100

print(f"✅ Anomalies prédites : {n_pred_anomalies:,} ({pct_pred:.2f}%)")
print()

# ============================================================
# 7. ÉVALUATION DU MODÈLE
# ============================================================

print("📊 ÉTAPE 7 : Évaluation des performances...")
print("-" * 70)

# Matrice de confusion
cm = confusion_matrix(y, predictions_binary)

print("🔢 MATRICE DE CONFUSION :")
print()
print(f"                    Prédit Normal  |  Prédit Anomalie")
print(f"   Normal réel  :        {cm[0,0]:6d}      |      {cm[0,1]:6d}")
print(f"   Anomalie réelle:      {cm[1,0]:6d}      |      {cm[1,1]:6d}")
print()

# Calculer les métriques
true_negatives = cm[0, 0]
false_positives = cm[0, 1]
false_negatives = cm[1, 0]
true_positives = cm[1, 1]

# Précision et rappel
if (true_positives + false_positives) > 0:
    precision = true_positives / (true_positives + false_positives)
else:
    precision = 0

if (true_positives + false_negatives) > 0:
    recall = true_positives / (true_positives + false_negatives)
else:
    recall = 0

if (precision + recall) > 0:
    f1_score = 2 * (precision * recall) / (precision + recall)
else:
    f1_score = 0

print("📈 MÉTRIQUES :")
print(f"   Précision : {precision:.2%}")
print(f"      → {precision*100:.0f}% des anomalies détectées sont réelles")
print()
print(f"   Rappel    : {recall:.2%}")
print(f"      → {recall*100:.0f}% des anomalies réelles ont été détectées")
print()
print(f"   F1-Score  : {f1_score:.2%}")
print()

# ============================================================
# 8. VISUALISATION
# ============================================================

print("📊 ÉTAPE 8 : Visualisation des résultats...")
print("-" * 70)

# Créer les graphiques
fig, axes = plt.subplots(2, 2, figsize=(16, 12))
fig.suptitle('Haské Énergie - Détection d\'Anomalies', fontsize=16, fontweight='bold')

# Graphique 1 : Matrice de confusion
sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', ax=axes[0, 0],
            xticklabels=['Normal', 'Anomalie'],
            yticklabels=['Normal', 'Anomalie'])
axes[0, 0].set_title('Matrice de Confusion', fontweight='bold')
axes[0, 0].set_ylabel('Valeurs Réelles')
axes[0, 0].set_xlabel('Valeurs Prédites')

# Graphique 2 : Distribution des anomalies
anomaly_counts = pd.DataFrame({
    'Type': ['Normales', 'Anomalies'],
    'Réelles': [n_normal, n_anomalies],
    'Prédites': [len(df) - n_pred_anomalies, n_pred_anomalies]
})
x = np.arange(len(anomaly_counts))
width = 0.35
axes[0, 1].bar(x - width/2, anomaly_counts['Réelles'], width, label='Réelles', color='blue', alpha=0.7)
axes[0, 1].bar(x + width/2, anomaly_counts['Prédites'], width, label='Prédites', color='red', alpha=0.7)
axes[0, 1].set_xlabel('Type')
axes[0, 1].set_ylabel('Nombre')
axes[0, 1].set_title('Comparaison Anomalies Réelles vs Prédites', fontweight='bold')
axes[0, 1].set_xticks(x)
axes[0, 1].set_xticklabels(anomaly_counts['Type'])
axes[0, 1].legend()
axes[0, 1].grid(True, alpha=0.3, axis='y')

# Graphique 3 : AC_POWER avec anomalies
sample_size = 2000
sample_df = df.head(sample_size)
normal = sample_df[sample_df['PREDICTED_ANOMALY'] == 0]
anomalies = sample_df[sample_df['PREDICTED_ANOMALY'] == 1]

axes[1, 0].scatter(range(len(normal)), normal['AC_POWER'], 
                   c='green', s=5, alpha=0.5, label='Normal')
axes[1, 0].scatter(anomalies.index, anomalies['AC_POWER'], 
                   c='red', s=20, marker='x', label='Anomalie')
axes[1, 0].set_xlabel('Index')
axes[1, 0].set_ylabel('AC_POWER (W)')
axes[1, 0].set_title(f'Production avec Anomalies Détectées (échantillon {sample_size})', fontweight='bold')
axes[1, 0].legend()
axes[1, 0].grid(True, alpha=0.3)

# Graphique 4 : Efficacité avec anomalies
axes[1, 1].scatter(range(len(normal)), normal['EFFICIENCY'], 
                   c='blue', s=5, alpha=0.5, label='Normal')
axes[1, 1].scatter(anomalies.index, anomalies['EFFICIENCY'], 
                   c='red', s=20, marker='x', label='Anomalie')
axes[1, 1].set_xlabel('Index')
axes[1, 1].set_ylabel('Efficacité')
axes[1, 1].set_title(f'Efficacité avec Anomalies Détectées (échantillon {sample_size})', fontweight='bold')
axes[1, 1].legend()
axes[1, 1].grid(True, alpha=0.3)

plt.tight_layout()
plt.savefig('../schemas/anomaly_detection.png', dpi=300, bbox_inches='tight')
print("✅ Graphiques sauvegardés : ai/schemas/anomaly_detection.png")
print()

# ============================================================
# 9. SAUVEGARDE DU MODÈLE
# ============================================================

print("💾 ÉTAPE 9 : Sauvegarde du modèle...")
print("-" * 70)

# Sauvegarder le modèle
model_file = '../models/anomaly_model.pkl'
with open(model_file, 'wb') as f:
    pickle.dump(model, f)

# Sauvegarder le scaler
scaler_file = '../models/anomaly_scaler.pkl'
with open(scaler_file, 'wb') as f:
    pickle.dump(scaler, f)

# Sauvegarder les informations
model_info = {
    'features': features_anomaly,
    'precision': precision,
    'recall': recall,
    'f1_score': f1_score,
    'n_anomalies_detected': n_pred_anomalies
}

info_file = '../models/anomaly_model_info.pkl'
with open(info_file, 'wb') as f:
    pickle.dump(model_info, f)

print(f"✅ Modèle sauvegardé       : {model_file}")
print(f"✅ Scaler sauvegardé       : {scaler_file}")
print(f"✅ Informations sauvegardées : {info_file}")
print()

# ============================================================
# 10. TEST RAPIDE
# ============================================================

print("🧪 ÉTAPE 10 : Test rapide du modèle...")
print("-" * 70)

# Exemple 1 : Situation NORMALE
exemple_normal = pd.DataFrame({
    'AC_POWER': [5000.0],
    'IRRADIATION': [800.0],
    'AMBIENT_TEMPERATURE': [30.0],
    'EFFICIENCY': [6.25],
    'HOUR': [12]
})

exemple_normal_scaled = scaler.transform(exemple_normal)
pred_normal = model.predict(exemple_normal_scaled)[0]
result_normal = "🚨 ANOMALIE" if pred_normal == -1 else "✅ NORMAL"

print("📝 EXEMPLE 1 - Situation normale :")
print(f"   AC_POWER : {exemple_normal['AC_POWER'].values[0]:.0f} W")
print(f"   IRRADIATION : {exemple_normal['IRRADIATION'].values[0]:.0f} W/m²")
print(f"   TEMPÉRATURE : {exemple_normal['AMBIENT_TEMPERATURE'].values[0]:.0f} °C")
print(f"   → Résultat : {result_normal}")
print()

# Exemple 2 : Situation ANORMALE
exemple_anomalie = pd.DataFrame({
    'AC_POWER': [500.0],      # Production très faible
    'IRRADIATION': [800.0],   # Mais irradiation forte
    'AMBIENT_TEMPERATURE': [50.0],  # Surchauffe !
    'EFFICIENCY': [0.6],
    'HOUR': [12]
})

exemple_anomalie_scaled = scaler.transform(exemple_anomalie)
pred_anomalie = model.predict(exemple_anomalie_scaled)[0]
result_anomalie = "🚨 ANOMALIE" if pred_anomalie == -1 else "✅ NORMAL"

print("📝 EXEMPLE 2 - Situation anormale :")
print(f"   AC_POWER : {exemple_anomalie['AC_POWER'].values[0]:.0f} W (TRÈS FAIBLE !)")
print(f"   IRRADIATION : {exemple_anomalie['IRRADIATION'].values[0]:.0f} W/m²")
print(f"   TEMPÉRATURE : {exemple_anomalie['AMBIENT_TEMPERATURE'].values[0]:.0f} °C (SURCHAUFFE !)")
print(f"   → Résultat : {result_anomalie}")
print()

# ============================================================
# 11. RÉSUMÉ FINAL
# ============================================================

print("=" * 70)
print("✅ MODÈLE DE DÉTECTION D'ANOMALIES ENTRAÎNÉ AVEC SUCCÈS !")
print("=" * 70)
print()
print("📊 RÉSUMÉ :")
print(f"   - Précision       : {precision*100:.1f}%")
print(f"   - Rappel          : {recall*100:.1f}%")
print(f"   - F1-Score        : {f1_score*100:.1f}%")
print(f"   - Modèle sauvegardé : {model_file}")
print()
print("🎉 LES DEUX MODÈLES D'IA SONT PRÊTS !")
print()
print("🎯 Prochaine étape : Créer un script d'inférence pour utiliser les modèles")
print()