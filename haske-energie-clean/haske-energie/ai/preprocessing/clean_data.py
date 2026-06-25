"""
Haské Énergie - Nettoyage et Préparation des Données
Fichier : ai/preprocessing/clean_data.py

Ce script :
1. Charge les 4 datasets
2. Nettoie les valeurs manquantes
3. Fusionne Plant 1 et Plant 2
4. Crée de nouvelles features
5. Sauvegarde les données propres
"""

import pandas as pd
import numpy as np
from datetime import datetime
import os

print("=" * 70)
print("🧹 HASKÉ ÉNERGIE - NETTOYAGE DES DONNÉES")
print("=" * 70)
print()

# ============================================================
# 1. CHARGEMENT DES DATASETS
# ============================================================

print("📁 ÉTAPE 1 : Chargement des datasets...")
print("-" * 70)

# Charger les 4 datasets
df_gen1 = pd.read_csv('../datasets/Plant_1_Generation_Data.csv')
df_gen2 = pd.read_csv('../datasets/Plant_2_Generation_Data.csv')
df_weather1 = pd.read_csv('../datasets/Plant_1_Weather_Sensor_Data.csv')
df_weather2 = pd.read_csv('../datasets/Plant_2_Weather_Sensor_Data.csv')

print(f"✅ Plant 1 Generation : {df_gen1.shape[0]:,} lignes")
print(f"✅ Plant 2 Generation : {df_gen2.shape[0]:,} lignes")
print(f"✅ Plant 1 Weather    : {df_weather1.shape[0]:,} lignes")
print(f"✅ Plant 2 Weather    : {df_weather2.shape[0]:,} lignes")
print()

# ============================================================
# 2. CONVERSION DES DATES
# ============================================================

print("📅 ÉTAPE 2 : Conversion des dates...")
print("-" * 70)

# Convertir DATE_TIME en datetime pour tous les datasets
df_gen1['DATE_TIME'] = pd.to_datetime(df_gen1['DATE_TIME'], dayfirst=True)
df_gen2['DATE_TIME'] = pd.to_datetime(df_gen2['DATE_TIME'], dayfirst=True)
df_weather1['DATE_TIME'] = pd.to_datetime(df_weather1['DATE_TIME'], dayfirst=True)
df_weather2['DATE_TIME'] = pd.to_datetime(df_weather2['DATE_TIME'], dayfirst=True)

print("✅ Toutes les dates converties au format datetime")
print()

# ============================================================
# 3. FUSION DES DATASETS
# ============================================================

print("🔗 ÉTAPE 3 : Fusion des datasets...")
print("-" * 70)

# Fusionner Generation + Weather pour Plant 1
df_plant1 = pd.merge(df_gen1, df_weather1, on='DATE_TIME', how='inner')
df_plant1['PLANT_ID'] = 1  # Ajouter un identifiant de centrale

# Fusionner Generation + Weather pour Plant 2
df_plant2 = pd.merge(df_gen2, df_weather2, on='DATE_TIME', how='inner')
df_plant2['PLANT_ID'] = 2  # Ajouter un identifiant de centrale

print(f"✅ Plant 1 fusionné : {df_plant1.shape[0]:,} lignes")
print(f"✅ Plant 2 fusionné : {df_plant2.shape[0]:,} lignes")
print()

# Combiner Plant 1 et Plant 2 en un seul dataset
df_combined = pd.concat([df_plant1, df_plant2], ignore_index=True)

print(f"✅ Dataset combiné : {df_combined.shape[0]:,} lignes")
print(f"   Colonnes : {list(df_combined.columns)}")
print()

# ============================================================
# 4. GESTION DES VALEURS MANQUANTES
# ============================================================

print("🔍 ÉTAPE 4 : Gestion des valeurs manquantes...")
print("-" * 70)

# Vérifier les valeurs manquantes
missing_before = df_combined.isnull().sum().sum()
print(f"ℹ️  Valeurs manquantes AVANT nettoyage : {missing_before}")

if missing_before > 0:
    # Afficher le détail par colonne
    missing_detail = df_combined.isnull().sum()
    for col, count in missing_detail.items():
        if count > 0:
            percentage = (count / len(df_combined)) * 100
            print(f"   - {col} : {count} ({percentage:.2f}%)")
    
    # Supprimer les lignes avec des valeurs manquantes
    df_combined = df_combined.dropna()
    
    missing_after = df_combined.isnull().sum().sum()
    print(f"\n✅ Valeurs manquantes APRÈS nettoyage : {missing_after}")
    print(f"✅ Lignes conservées : {df_combined.shape[0]:,}")
else:
    print("✅ Aucune valeur manquante détectée !")

print()

# ============================================================
# 5. SUPPRESSION DES VALEURS ABERRANTES
# ============================================================

print("🚫 ÉTAPE 5 : Suppression des valeurs aberrantes...")
print("-" * 70)

# Sauvegarder le nombre de lignes avant
lignes_avant = len(df_combined)

# Supprimer les valeurs négatives (impossible pour l'énergie)
df_combined = df_combined[df_combined['AC_POWER'] >= 0]
df_combined = df_combined[df_combined['IRRADIATION'] >= 0]
df_combined = df_combined[df_combined['AMBIENT_TEMPERATURE'] > -50]  # Température réaliste

# Supprimer les valeurs extrêmes (outliers) avec la méthode IQR
def remove_outliers(df, column):
    Q1 = df[column].quantile(0.25)
    Q3 = df[column].quantile(0.75)
    IQR = Q3 - Q1
    lower_bound = Q1 - 1.5 * IQR
    upper_bound = Q3 + 1.5 * IQR
    return df[(df[column] >= lower_bound) & (df[column] <= upper_bound)]

# Appliquer le nettoyage des outliers
df_combined = remove_outliers(df_combined, 'AC_POWER')
df_combined = remove_outliers(df_combined, 'IRRADIATION')

lignes_apres = len(df_combined)
lignes_supprimees = lignes_avant - lignes_apres

print(f"✅ Lignes supprimées : {lignes_supprimees:,}")
print(f"✅ Lignes conservées : {lignes_apres:,}")
print()

# ============================================================
# 6. CRÉATION DE NOUVELLES FEATURES (COLONNES)
# ============================================================

print("⚙️  ÉTAPE 6 : Création de nouvelles features...")
print("-" * 70)

# Feature 1 : Heure de la journée
df_combined['HOUR'] = df_combined['DATE_TIME'].dt.hour

# Feature 2 : Jour du mois
df_combined['DAY'] = df_combined['DATE_TIME'].dt.day

# Feature 3 : Mois
df_combined['MONTH'] = df_combined['DATE_TIME'].dt.month

# Feature 4 : Jour de la semaine (0=Lundi, 6=Dimanche)
df_combined['DAY_OF_WEEK'] = df_combined['DATE_TIME'].dt.dayofweek

# Feature 5 : Période de la journée (Matin, Midi, Soir, Nuit)
def get_period(hour):
    if 6 <= hour < 12:
        return 'Matin'
    elif 12 <= hour < 18:
        return 'Midi'
    elif 18 <= hour < 22:
        return 'Soir'
    else:
        return 'Nuit'

df_combined['PERIOD'] = df_combined['HOUR'].apply(get_period)

# Feature 6 : Efficacité énergétique (AC_POWER / IRRADIATION)
# Éviter la division par zéro
df_combined['EFFICIENCY'] = np.where(
    df_combined['IRRADIATION'] > 0,
    df_combined['AC_POWER'] / df_combined['IRRADIATION'],
    0
)

print("✅ Nouvelles colonnes créées :")
print("   - HOUR (heure de la journée)")
print("   - DAY (jour du mois)")
print("   - MONTH (mois)")
print("   - DAY_OF_WEEK (jour de la semaine)")
print("   - PERIOD (période : Matin, Midi, Soir, Nuit)")
print("   - EFFICIENCY (efficacité énergétique)")
print()

# ============================================================
# 7. RÉORGANISATION DES COLONNES
# ============================================================

print("📋 ÉTAPE 7 : Réorganisation des colonnes...")
print("-" * 70)

# Ordre logique des colonnes
colonnes_ordre = [
    'DATE_TIME',
    'PLANT_ID',
    'AC_POWER',
    'IRRADIATION',
    'AMBIENT_TEMPERATURE',
    'EFFICIENCY',
    'HOUR',
    'DAY',
    'MONTH',
    'DAY_OF_WEEK',
    'PERIOD'
]

df_combined = df_combined[colonnes_ordre]

print(f"✅ Colonnes réorganisées : {list(df_combined.columns)}")
print()

# ============================================================
# 8. AFFICHAGE DU RÉSUMÉ FINAL
# ============================================================

print("=" * 70)
print("📊 RÉSUMÉ DES DONNÉES NETTOYÉES")
print("=" * 70)
print()

print(f"📈 Nombre total de lignes : {df_combined.shape[0]:,}")
print(f"📊 Nombre de colonnes     : {df_combined.shape[1]}")
print()

print("📅 Période des données :")
print(f"   Du {df_combined['DATE_TIME'].min()} au {df_combined['DATE_TIME'].max()}")
print()

print("📊 Statistiques AC_POWER :")
print(f"   Min  : {df_combined['AC_POWER'].min():.2f} W")
print(f"   Max  : {df_combined['AC_POWER'].max():.2f} W")
print(f"   Moy  : {df_combined['AC_POWER'].mean():.2f} W")
print()

print("🌞 Statistiques IRRADIATION :")
print(f"   Min  : {df_combined['IRRADIATION'].min():.2f} W/m²")
print(f"   Max  : {df_combined['IRRADIATION'].max():.2f} W/m²")
print(f"   Moy  : {df_combined['IRRADIATION'].mean():.2f} W/m²")
print()

# ============================================================
# 9. SAUVEGARDE DES DONNÉES PROPRES
# ============================================================

print("💾 ÉTAPE 8 : Sauvegarde des données...")
print("-" * 70)

# Créer le dossier s'il n'existe pas
os.makedirs('../preprocessing', exist_ok=True)

# Sauvegarder le dataset nettoyé
output_file = '../preprocessing/clean_data.csv'
df_combined.to_csv(output_file, index=False)

print(f"✅ Données sauvegardées dans : {output_file}")
print(f"   Taille du fichier : {os.path.getsize(output_file) / (1024*1024):.2f} MB")
print()

# Sauvegarder aussi un aperçu (premières 1000 lignes) pour tests rapides
sample_file = '../preprocessing/clean_data_sample.csv'
df_combined.head(1000).to_csv(sample_file, index=False)
print(f"✅ Échantillon sauvegardé dans : {sample_file}")
print()

# ============================================================
# 10. FIN
# ============================================================

print("=" * 70)
print("✅ NETTOYAGE TERMINÉ AVEC SUCCÈS !")
print("=" * 70)
print()
print("🎯 Prochaine étape : Entraînement des modèles d'IA")
print()