import pandas as pd, numpy as np, joblib
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import precision_score, recall_score, f1_score

df = pd.read_csv("../preprocessing/clean_data.csv")
feats = joblib.load("anomaly_model_info.pkl")["features"]

# --- Même vérité terrain que précédemment (validée) ---
jour_fort = df["IRRADIATION"] > 0.4
nuit      = df["IRRADIATION"] < 0.05
prod_fort = df.loc[jour_fort, "AC_POWER"]
eff_fort  = df.loc[jour_fort, "EFFICIENCY"]

faible_prod = jour_fort & (df["AC_POWER"]   < prod_fort.quantile(0.10))
eff_basse   = jour_fort & (df["EFFICIENCY"] < eff_fort.quantile(0.10))
nocturne    = nuit & (df["AC_POWER"] > 5)
surchauffe  = df["AMBIENT_TEMPERATURE"] > df["AMBIENT_TEMPERATURE"].quantile(0.99)

df["label"] = (faible_prod | nocturne | surchauffe | eff_basse).astype(int)
taux_reel = df["label"].mean()
print(f"Vérité terrain : {taux_reel*100:.1f}%\n")

# --- On entraîne un IsolationForest pour CHAQUE contamination à tester ---
X = StandardScaler().fit_transform(df[feats])

for c in [0.05, 0.088, 0.10, 0.15, 0.20]:
    model = IsolationForest(contamination=c, n_estimators=100, random_state=42)
    pred = (model.fit_predict(X) == -1).astype(int)
    p = precision_score(df["label"], pred, zero_division=0)
    r = recall_score(df["label"], pred, zero_division=0)
    f = f1_score(df["label"], pred, zero_division=0)
    print(f"contamination={c:<6} -> détecté={pred.sum():6} ({100*pred.mean():.1f}%) | "
          f"Précision={100*p:.1f}% | Rappel={100*r:.1f}% | F1={100*f:.1f}%")