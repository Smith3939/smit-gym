const { test } = require("node:test");
const assert = require("node:assert/strict");
const {
  normalizePhone,
  phoneKey,
  createDiscoveryService,
} = require("../server/phoneDiscovery");

// Models atomic transaction order. Exercises service behavior without real user data.
function fixture() {
  const rows = new Map();
  const snap = (path) => ({
    exists: rows.has(path),
    data: () => rows.get(path),
  });
  const reference = (path) => ({ path, get: async () => snap(path) });
  let pending = Promise.resolve();
  const db = {
    collection: (name) => ({
      doc: (id) => reference(`${name}/${id}`),
      where: (field, op, value) => ({
        get: async () => ({
          docs: [...rows.entries()]
            .filter(
              ([key, row]) =>
                key.startsWith(name + "/") && row[field] === value,
            )
            .map(([path]) => snap(path)),
        }),
      }),
    }),
    getAll: async (...refs) => refs.map((ref) => snap(ref.path)),
    runTransaction: (callback) => {
      const next = pending.then(async () => {
        const writes = [];
        const value = await callback({
          get: async (ref) => snap(ref.path),
          delete: (ref) => writes.push(() => rows.delete(ref.path)),
          set: (ref, data, options) =>
            writes.push(() =>
              rows.set(ref.path, {
                ...(options?.merge ? rows.get(ref.path) : {}),
                ...data,
              }),
            ),
        });
        writes.forEach((write) => write());
        return value;
      });
      pending = next.catch(() => {});
      return next;
    },
  };
  const users = new Map();
  const auth = {
    getUsers: async (ids) => {
      assert.ok(ids.length <= 100);
      return { users: ids.map(({ uid }) => users.get(uid)).filter(Boolean) };
    },
  };
  return {
    rows,
    users,
    auth,
    service: createDiscoveryService(
      db,
      "test-secret-that-is-long-enough-for-hmac",
    ),
  };
}
const phone = "+972501234567";
test("normalizes international and Israeli local numbers and rejects invalid input", () => {
  assert.equal(normalizePhone("050-123-4567"), phone);
  assert.equal(normalizePhone("+1 202 555 0123"), "+12025550123");
  assert.equal(normalizePhone("123"), null);
  assert.equal(normalizePhone({}), null);
  assert.notEqual(phoneKey(phone, "first"), phoneKey(phone, "second"));
});
test("default is private, opt-in allows a match, revocation removes it", async () => {
  const { service, users, auth, rows } = fixture();
  users.set("b", { uid: "b", phoneNumber: phone });
  assert.deepEqual(await service.status("b", phone), {
    enabled: false,
    verified: true,
  });
  assert.deepEqual(await service.match("a", [phone], auth), { uids: [] });
  await service.setConsent("b", phone, true);
  assert.deepEqual(await service.match("a", ["0501234567", phone], auth), {
    uids: ["b"],
  });
  assert.ok(!JSON.stringify([...rows.entries()]).includes(phone));
  await service.setConsent("b", null, false);
  assert.deepEqual(await service.match("a", [phone], auth), { uids: [] });
});
test("filters blocked, disabled, self and stale phone associations", async () => {
  const { service, users, auth, rows } = fixture();
  await service.setConsent("b", phone, true);
  users.set("b", { uid: "b", phoneNumber: phone });
  assert.deepEqual(await service.match("b", [phone], auth), { uids: [] });
  rows.set("communityBlocks/block", { ownerUid: "b", targetUid: "a" });
  assert.deepEqual(await service.match("a", [phone], auth), { uids: [] });
  rows.delete("communityBlocks/block");
  users.set("b", { uid: "b", phoneNumber: phone, disabled: true });
  assert.deepEqual(await service.match("a", [phone], auth), { uids: [] });
  users.set("b", { uid: "b", phoneNumber: "+972501234568" });
  assert.deepEqual(await service.match("a", [phone], auth), { uids: [] });
  assert.equal((await service.status("b", "+972501234568")).enabled, false);
});
test("changing a verified phone atomically removes old index after a phone change", async () => {
  const { service, users, auth } = fixture();
  await service.setConsent("b", phone, true);
  const changed = "+972501234568";
  await service.setConsent("b", changed, true);
  users.set("b", { uid: "b", phoneNumber: changed });
  assert.deepEqual(await service.match("a", [phone], auth), { uids: [] });
  assert.deepEqual(await service.match("a", [changed], auth), { uids: ["b"] });
});
test("daily budget holds across concurrent requests and duplicate numbers are counted once", async () => {
  const { service, auth } = fixture();
  const numbers = Array.from(
    { length: 250 },
    (_, i) => `+97250${String(1234000 + i)}`,
  );
  const results = await Promise.allSettled(
    Array.from({ length: 5 }, () => service.match("a", numbers, auth)),
  );
  assert.equal(results.filter((r) => r.status === "fulfilled").length, 4);
  assert.equal(results.find((r) => r.status === "rejected").reason.status, 429);
});
test("large match result uses Firebase Auth batches of at most 100", async () => {
  const { service, users, auth } = fixture();
  const numbers = [];
  for (let i = 0; i < 101; i++) {
    const n = `+97250${1234000 + i}`;
    numbers.push(n);
    await service.setConsent(`u${i}`, n, true);
    users.set(`u${i}`, { uid: `u${i}`, phoneNumber: n });
  }
  assert.equal((await service.match("a", numbers, auth)).uids.length, 101);
});
test("API fails closed when configuration is missing and rejects unsupported methods", async () => {
  const handler = require("../api/phoneDiscovery");
  let status, body;
  const response = {
    setHeader() {},
    status(n) {
      status = n;
      return this;
    },
    json(value) {
      body = value;
      return this;
    },
  };
  await handler({ method: "GET" }, response);
  assert.equal(status, 405);
  await handler({ method: "POST" }, response);
  assert.equal(status, 503);
  assert.ok(body.error);
});

test("a reassigned number survives revocation by its former owner", async () => {
  const { service, users, auth } = fixture();
  await service.setConsent("old", phone, true);
  await service.setConsent("new", phone, true);
  users.set("new", { uid: "new", phoneNumber: phone });
  await service.setConsent("old", null, false);
  assert.deepEqual(await service.match("a", [phone], auth), { uids: ["new"] });
});
