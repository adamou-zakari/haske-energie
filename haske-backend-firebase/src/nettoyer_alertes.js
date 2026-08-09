const { db } = require("./config/firebase");

async function nettoyer() {
  const snap = await db.collection("alerts").get();
  let aSupprimer = [];

  snap.forEach(doc => {
    const a = doc.data();
    const v = a.data?.voltage ?? a.data?.tension;
    const bat = a.data?.battery_level;
    // Fausses alertes de l'incident fil : tension ~0 ou batterie aberrante
    const suspecte =
      (typeof v === "number" && v < 1) ||
      (typeof bat === "number" && (bat === 0 || bat === 15));
    if (suspecte) aSupprimer.push({ id: doc.id, type: a.type, severity: a.severity, data: a.data });
  });

  console.log(`${aSupprimer.length} alerte(s) suspecte(s) trouvée(s) :`);
  aSupprimer.forEach(a => console.log(" -", a.id, "|", a.type, "|", JSON.stringify(a.data)));

  // Suppression
  for (const a of aSupprimer) {
    await db.collection("alerts").doc(a.id).delete();
    console.log("Supprimé :", a.id);
  }
  console.log("Nettoyage terminé.");

  process.exit(0);
}
nettoyer();