# Community release

The app and Firestore rules are released separately. Apply the reviewed rules to
the intended Firebase project before promoting the app preview. Verify the
published rules and run the smoke test below using two dedicated test accounts
on the production site. Do not use real GPS or personal contact details in tests.

- Search nearby with account A: confirm the account's public profile is unchanged.
  Share an approximate region separately, find A from B, stop sharing from A,
  then refresh B's results and confirm A no longer appears there.
- Post from A and verify the open feed on B updates. Send a workout request and
  check the badge and incoming request on B, then accept and check A's status.
- Block A from B. Verify both app feeds and discovery views hide the other
  profile, and direct profile reads and new workout requests are denied.
- Publish a partner card with fictional area and availability, find it using
  the partner filter, and remove it. Cards are excluded from discovery after
  seven days; expiration is not a Firestore data deletion policy.
- Submit a report and verify an authorized operator can find it in the
  `communityReports` collection in Firebase Console. Reports have one document
  per reporter and target, and are not readable by clients. Assign an operator
  to review them before opening the feature to a wider audience.

Public profile lists and feed queries are still shared between signed-in users.
Blocking hides list results in the supported app UI; it does not make the
underlying public list records private. Enforcing that at the storage boundary
would require a server-filtered read path or per-viewer data.
