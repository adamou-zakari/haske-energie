import pandas as pd
d = pd.read_csv("a_etiqueter.csv", sep=";")
vides = d["label_humain"].isna().sum()
print(f"Lignes : {len(d)} | remplies : {len(d)-vides} | vides : {vides}")
if vides == 0:
    print("Répartition :", d["label_humain"].astype(int).value_counts().to_dict())
    print("OK -> lance evaluer_manuel.py")
else:
    print("Il reste des cases vides à remplir.")