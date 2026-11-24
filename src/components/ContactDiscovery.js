import React, { useEffect, useRef, useState, useId } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  Switch,
  Platform,
  Linking,
  StyleSheet,
} from "react-native";
import {
  RecaptchaVerifier,
  linkWithPhoneNumber,
  PhoneAuthProvider,
  updatePhoneNumber,
} from "firebase/auth";
import { MaterialIcons } from "@expo/vector-icons";
import { auth } from "../config/firebase";
import { COLORS } from "../config/theme";
import {
  discoveryRequest,
  pickContactNumbers,
  supportsContactPicker,
  normalizeContactNumber,
} from "../services/contactDiscovery";

function messageFor(error) {
  const messages = {
    "auth/invalid-phone-number": "המספר לא תקין. הזן מספר כולל קידומת מדינה",
    "auth/invalid-verification-code": "הקוד שגוי. בדוק את ה־SMS ונסה שוב",
    "auth/code-expired": "תוקף הקוד פג. שלח קוד חדש",
    "auth/credential-already-in-use":
      "המספר משויך לחשבון אחר. התחבר לחשבון המקורי",
    "auth/requires-recent-login": "יש להתחבר מחדש כדי לעדכן מספר טלפון",
    "auth/too-many-requests": "נשלחו יותר מדי בקשות. נסה שוב מאוחר יותר",
    "auth/operation-not-allowed":
      "אימות SMS עדיין לא הופעל. נסה שוב מאוחר יותר",
  };
  return messages[error.code] || error.message || "הפעולה נכשלה. נסה שוב";
}
export default function ContactDiscovery({ onMatches }) {
  const [phone, setPhone] = useState(auth.currentUser?.phoneNumber || "");
  const [verified, setVerified] = useState(!!auth.currentUser?.phoneNumber);
  const [code, setCode] = useState("");
  const [confirmation, setConfirmation] = useState(null);
  const [enabled, setEnabled] = useState(false);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [manual, setManual] = useState("");
  const [retryAt, setRetryAt] = useState(0);
  const [clock, setClock] = useState(Date.now());
  const verifier = useRef(null);
  const id = `phone-recaptcha-${useId().replace(/[^a-z0-9]/gi, "")}`;
  const refresh = async () => {
    await auth.currentUser.reload();
    await auth.currentUser.getIdToken(true);
    setVerified(!!auth.currentUser.phoneNumber);
    const result = await discoveryRequest("status");
    setEnabled(result.enabled);
    setReady(true);
  };
  useEffect(() => {
    let active = true;
    discoveryRequest("status")
      .then((result) => {
        if (active) {
          setEnabled(result.enabled);
          setReady(true);
        }
      })
      .catch((e) => {
        if (active) setError(messageFor(e));
      });
    const interval = setInterval(() => setClock(Date.now()), 1000);
    return () => {
      active = false;
      clearInterval(interval);
      verifier.current?.clear();
    };
  }, []);
  const run = async (action) => {
    if (busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await action();
    } catch (e) {
      if (e.name !== "AbortError") setError(messageFor(e));
    } finally {
      setBusy(false);
    }
  };
  const sendCode = () =>
    run(async () => {
      const number = normalizeContactNumber(phone);
      if (!number) throw new Error("הזן מספר טלפון תקין, למשל 0501234567");
      verifier.current?.clear();
      verifier.current = new RecaptchaVerifier(auth, id, { size: "normal" });
      try {
        if (auth.currentUser.phoneNumber) {
          const verificationId = await new PhoneAuthProvider(
            auth,
          ).verifyPhoneNumber(number, verifier.current);
          setConfirmation({
            confirm: async (value) =>
              updatePhoneNumber(
                auth.currentUser,
                PhoneAuthProvider.credential(verificationId, value),
              ),
          });
        } else
          setConfirmation(
            await linkWithPhoneNumber(
              auth.currentUser,
              number,
              verifier.current,
            ),
          );
        setCode("");
        setRetryAt(Date.now() + 60000);
        setNotice("קוד נשלח ב־SMS");
      } catch (e) {
        verifier.current?.clear();
        verifier.current = null;
        throw e;
      }
    });
  const verify = () =>
    run(async () => {
      await confirmation.confirm(code.trim());
      setConfirmation(null);
      verifier.current?.clear();
      verifier.current = null;
      await refresh();
      setNotice("המספר אומת. אפשר לבחור אם לאפשר למצוא אותך");
    });
  const match = async (numbers) => {
    if (numbers.length > 250)
      throw new Error("אפשר לבחור עד 250 מספרים בכל חיפוש. בחר פחות אנשי קשר");
    if (!numbers.length) {
      setNotice("לא נבחרו מספרים תקינים");
      return;
    }
    const result = await discoveryRequest("match", { numbers });
    await onMatches(result.uids);
    setNotice(
      result.uids.length
        ? `נמצאו ${result.uids.length} משתמשים שאפשר להכיר`
        : "לא נמצאו אנשי קשר שהפעילו אפשרות גילוי באפליקציה",
    );
  };
  return (
    <View style={styles.section}>
      <View style={styles.heading}>
        <MaterialIcons name="contacts" size={24} color={COLORS.primaryDark} />
        <Text style={styles.title}>החברים שלך כבר כאן?</Text>
      </View>
      <Text style={styles.help}>
        אמת את המספר שלך כדי למצוא חברים. הגילוי לפי מספר כבוי עד שתבחר להפעיל
        אותו.
      </Text>
      {Platform.OS === "web" ? (
        <>
          <Text style={styles.label}>מספר טלפון</Text>
          <TextInput
            style={styles.input}
            accessibilityLabel="מספר טלפון לאימות"
            keyboardType="phone-pad"
            autoComplete="tel"
            maxLength={25}
            value={phone}
            onChangeText={setPhone}
            editable={!busy && !confirmation}
          />
          <Text style={styles.help}>
            בלחיצה נשלח SMS לאימות. המספר מועבר ל־Google לצורך אימות ומניעת
            שימוש לרעה. ייתכנו חיובי SMS רגילים.
          </Text>
          <View nativeID={id} />
          <Pressable
            accessibilityRole="button"
            style={styles.button}
            disabled={busy || !ready || clock < retryAt}
            onPress={sendCode}
          >
            <Text style={styles.action}>
              {busy
                ? "מבצע…"
                : clock < retryAt
                  ? `אפשר לשלוח שוב בעוד ${Math.ceil((retryAt - clock) / 1000)} שניות`
                  : verified
                    ? "אמת מספר מחדש"
                    : "שלח קוד SMS"}
            </Text>
          </Pressable>
          {confirmation && (
            <>
              <TextInput
                style={styles.input}
                accessibilityLabel="קוד האימות ב־SMS"
                keyboardType="number-pad"
                autoComplete="sms-otp"
                maxLength={6}
                value={code}
                onChangeText={setCode}
                editable={!busy}
              />
              <Pressable
                accessibilityRole="button"
                style={styles.button}
                disabled={busy || code.trim().length !== 6}
                onPress={verify}
              >
                <Text style={styles.action}>אמת קוד</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                style={styles.button}
                disabled={busy}
                onPress={() => {
                  setConfirmation(null);
                  verifier.current?.clear();
                  verifier.current = null;
                }}
              >
                <Text style={styles.action}>שנה מספר</Text>
              </Pressable>
            </>
          )}
        </>
      ) : (
        <>
          <Pressable
            style={styles.button}
            accessibilityRole="link"
            onPress={() => Linking.openURL("https://smit-gym.vercel.app")}
          >
            <Text style={styles.action}>אמת את המספר באתר Smit Gym</Text>
          </Pressable>
          <Pressable
            style={styles.button}
            accessibilityRole="button"
            disabled={busy}
            onPress={() => run(refresh)}
          >
            <Text style={styles.action}>אימתתי באתר, רענן</Text>
          </Pressable>
        </>
      )}
      <View style={styles.consent}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>אפשר למצוא אותי לפי המספר שלי</Text>
          <Text style={styles.help}>
            משתמשים שמכירים את המספר יוכלו לקבל הצעת חברות. המספר לא יוצג
            בפרופיל. אפשר לבטל בכל עת.
          </Text>
        </View>
        <Switch
          accessibilityLabel="אפשר למצוא אותי לפי המספר שלי"
          value={enabled}
          disabled={busy || !ready || (!verified && !enabled)}
          onValueChange={(value) =>
            run(async () => {
              const result = await discoveryRequest("consent", {
                enabled: value,
              });
              setEnabled(result.enabled);
            })
          }
        />
      </View>
      {verified && (
        <>
          <Text style={styles.help}>
            בחר מספרים לחיפוש. הם יישלחו לשרת Smit Gym להתאמה ולא יישמרו כרשימת
            אנשי קשר.
          </Text>
          {supportsContactPicker() ? (
            <Pressable
              style={styles.primaryButton}
              accessibilityRole="button"
              disabled={busy || !ready}
              onPress={() => run(async () => match(await pickContactNumbers()))}
            >
              <Text style={styles.primaryText}>
                {Platform.OS === "web"
                  ? "בחר אנשי קשר וחפש חברים"
                  : "אפשר גישה וחפש באנשי קשר"}
              </Text>
            </Pressable>
          ) : (
            <Text style={styles.help}>
              הדפדפן הזה אינו מאפשר בחירת אנשי קשר. אפשר להדביק מספרים בשדה הבא.
            </Text>
          )}
          <TextInput
            style={[styles.input, { minHeight: 80 }]}
            accessibilityLabel="מספרים לחיפוש, מספר בכל שורה"
            placeholder="מספרים לחיפוש, מספר בכל שורה"
            multiline
            maxLength={10000}
            value={manual}
            onChangeText={setManual}
            editable={!busy}
          />
          <Pressable
            style={styles.button}
            accessibilityRole="button"
            disabled={busy || !ready || !manual.trim()}
            onPress={() =>
              run(() =>
                match([
                  ...new Set(
                    manual
                      .split(/[\n,;]+/)
                      .map(normalizeContactNumber)
                      .filter(Boolean),
                  ),
                ]),
              )
            }
          >
            <Text style={styles.action}>חפש את המספרים שהזנתי</Text>
          </Pressable>
        </>
      )}
      {!!error && (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      )}
      {!!notice && (
        <Text accessibilityLiveRegion="polite" style={styles.help}>
          {notice}
        </Text>
      )}
      {!ready && (
        <Pressable
          style={styles.button}
          accessibilityRole="button"
          disabled={busy}
          onPress={() => run(refresh)}
        >
          <Text style={styles.action}>נסה להתחבר לשירות שוב</Text>
        </Pressable>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  section: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
    gap: 12,
  },
  heading: { flexDirection: "row-reverse", alignItems: "center", gap: 10 },
  title: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: "700",
    flex: 1,
    textAlign: "right",
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    textAlign: "right",
  },
  help: {
    fontSize: 14,
    lineHeight: 22,
    color: COLORS.textSecondary,
    textAlign: "right",
  },
  input: {
    minHeight: 48,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    color: COLORS.text,
    textAlign: "right",
  },
  consent: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderColor: COLORS.border,
  },
  button: { minHeight: 44, justifyContent: "center", alignItems: "center" },
  action: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.primaryDark,
    textAlign: "center",
  },
  primaryButton: {
    minHeight: 48,
    padding: 12,
    borderRadius: 12,
    backgroundColor: COLORS.primaryDark,
    justifyContent: "center",
    alignItems: "center",
  },
  primaryText: { fontSize: 15, fontWeight: "700", color: COLORS.textOnColor },
  error: {
    fontSize: 14,
    lineHeight: 22,
    color: COLORS.primaryDark,
    textAlign: "right",
  },
});
