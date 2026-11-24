const { createHmac } = require("node:crypto");
const { parsePhoneNumberFromString } = require("libphonenumber-js");

function normalizePhone(value) {
  if (typeof value !== "string" || value.length > 80) return null;
  const phone = parsePhoneNumberFromString(value, "IL");
  return phone?.isValid() ? phone.number : null;
}
function phoneKey(number, secret) {
  return createHmac("sha256", secret).update(number).digest("hex");
}

// All collections below are server-only. No contact names or address books are stored.
function createDiscoveryService(db, secret) {
  const index = db.collection("phoneDiscoveryIndex");
  const states = db.collection("phoneDiscoveryUsers");
  async function setConsent(uid, phone, enabled) {
    const key = enabled ? phoneKey(phone, secret) : null;
    await db.runTransaction(async (tx) => {
      const state = await tx.get(states.doc(uid));
      const oldKey = state.data()?.key;
      const oldEntry = oldKey ? await tx.get(index.doc(oldKey)) : null;
      // Firebase Auth enforces one account per verified phone. Its current
      // verified owner may replace a stale directory entry after reassignment.
      if (oldKey && oldKey !== key && oldEntry?.data()?.uid === uid)
        tx.delete(index.doc(oldKey));
      if (enabled) tx.set(index.doc(key), { uid });
      tx.set(
        states.doc(uid),
        { key, enabled, updatedAt: Date.now() },
        { merge: true },
      );
    });
    return { enabled };
  }
  async function status(uid, phone) {
    const state = (await states.doc(uid).get()).data();
    const enabled =
      !!phone &&
      state?.enabled === true &&
      state.key === phoneKey(phone, secret);
    return { enabled, verified: !!phone };
  }
  async function match(uid, numbers, auth) {
    const phones = [...new Set(numbers.map(normalizePhone).filter(Boolean))];
    if (!phones.length) return { uids: [] };
    // A transaction makes the daily quota hold across instances and concurrent requests.
    await db.runTransaction(async (tx) => {
      const ref = db.collection("phoneDiscoveryQuotas").doc(uid);
      const snapshot = await tx.get(ref);
      const day = new Date().toISOString().slice(0, 10);
      const old = snapshot.data();
      const used = old?.day === day ? old.used : 0;
      if (used + phones.length > 1000)
        throw Object.assign(
          new Error("הגעת למכסת החיפוש היומית. נסה שוב מחר"),
          { status: 429 },
        );
      tx.set(ref, { day, used: used + phones.length });
    });
    const docs = await db.getAll(
      ...phones.map((n) => index.doc(phoneKey(n, secret))),
    );
    const uids = [
      ...new Set(docs.filter((d) => d.exists).map((d) => d.data().uid)),
    ].filter((id) => id !== uid);
    if (!uids.length) return { uids: [] };
    const [statesFound, users, blocks] = await Promise.all([
      db.getAll(...uids.map((id) => states.doc(id))),
      Promise.all(
        Array.from({ length: Math.ceil(uids.length / 100) }, (_, i) =>
          auth.getUsers(
            uids.slice(i * 100, (i + 1) * 100).map((id) => ({ uid: id })),
          ),
        ),
      ),
      Promise.all(
        ["ownerUid", "targetUid"].map((field) =>
          db.collection("communityBlocks").where(field, "==", uid).get(),
        ),
      ),
    ]);
    const hidden = new Set(
      blocks.flatMap((s) =>
        s.docs.map((d) =>
          d.data().ownerUid === uid ? d.data().targetUid : d.data().ownerUid,
        ),
      ),
    );
    const currentUsers = new Map(
      users.flatMap((batch) => batch.users).map((u) => [u.uid, u]),
    );
    return {
      uids: uids.filter((id, i) => {
        const state = statesFound[i].data();
        const user = currentUsers.get(id);
        return (
          !hidden.has(id) &&
          !user?.disabled &&
          state?.enabled === true &&
          user?.phoneNumber &&
          state.key === phoneKey(user.phoneNumber, secret)
        );
      }),
    };
  }
  return { setConsent, status, match };
}
module.exports = { normalizePhone, phoneKey, createDiscoveryService };
