const { getApps, initializeApp, cert } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore } = require("firebase-admin/firestore");
const { createDiscoveryService } = require("../server/phoneDiscovery");

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  if (
    !process.env.FIREBASE_SERVICE_ACCOUNT_JSON ||
    (process.env.CONTACT_DISCOVERY_SECRET || "").length < 32
  ) {
    return res
      .status(503)
      .json({ error: "חיפוש לפי אנשי קשר עדיין בהגדרה. נסה שוב מאוחר יותר" });
  }
  try {
    const app =
      getApps().find((a) => a.name === "phone-discovery") ||
      initializeApp(
        {
          credential: cert(
            JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON),
          ),
          projectId: "smith-gymai",
        },
        "phone-discovery",
      );
    const auth = getAuth(app);
    let user;
    try {
      const token = /^Bearer (.+)$/.exec(req.headers.authorization || "")?.[1];
      if (!token) throw new Error();
      const claims = await auth.verifyIdToken(token, true);
      user = await auth.getUser(claims.uid);
    } catch {
      return res.status(401).json({ error: "יש להתחבר מחדש" });
    }
    const { action, enabled, numbers } = req.body || {};
    const service = createDiscoveryService(
      getFirestore(app),
      process.env.CONTACT_DISCOVERY_SECRET,
    );
    if (action === "status")
      return res.json(await service.status(user.uid, user.phoneNumber));
    // Revocation always remains available, even after unlinking a phone.
    if (action === "consent" && enabled === false)
      return res.json(await service.setConsent(user.uid, null, false));
    if (!user.phoneNumber)
      return res.status(403).json({ error: "יש לאמת מספר טלפון תחילה" });
    if (action === "consent" && enabled === true)
      return res.json(
        await service.setConsent(user.uid, user.phoneNumber, true),
      );
    if (
      action === "match" &&
      Array.isArray(numbers) &&
      numbers.length <= 250 &&
      numbers.every((n) => typeof n === "string" && n.length <= 80)
    ) {
      return res.json(await service.match(user.uid, numbers, auth));
    }
    return res.status(400).json({ error: "בקשה לא תקינה" });
  } catch (error) {
    return res
      .status(error.status || 503)
      .json({
        error: error.status
          ? error.message
          : "החיפוש לא זמין כרגע. נסה שוב מאוחר יותר",
      });
  }
};
