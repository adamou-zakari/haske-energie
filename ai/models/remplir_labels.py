import pandas as pd

df = pd.read_csv("a_etiqueter.csv", sep=";")
anomalies = [131042, 84809, 131035, 128982, 76012, 93597, 130925, 130935]

df["label_humain"] = 0
df.loc[df["id"].isin(anomalies), "label_humain"] = 1
df.to_csv("a_etiqueter.csv", sep=";", index=False, encoding="utf-8-sig")

print("Rempli. Anomalies (1) :", int(df["label_humain"].sum()), "/", len(df))
print(df.loc[df["label_humain"]==1, ["id","IRRADIATION","AC_POWER"]].to_string(index=False))