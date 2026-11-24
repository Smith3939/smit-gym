import { Platform } from "react-native";
import { auth } from "../config/firebase";
import { parsePhoneNumberFromString } from "libphonenumber-js";

export function normalizeContactNumber(value) {
  const phone = parsePhoneNumberFromString(value, "IL");
  return phone?.isValid() ? phone.number : null;
}
export async function discoveryRequest(action, data = {}) {
  const user = auth.currentUser;
  if (!user) throw new Error("יש להתחבר מחדש");
  const base = Platform.OS === "web" ? "" : "https://smit-gym.vercel.app";
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(`${base}/api/phoneDiscovery`, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${await user.getIdToken()}`,
      },
      body: JSON.stringify({ action, ...data }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "הפעולה נכשלה");
    return result;
  } catch (error) {
    if (error.name === "AbortError")
      throw new Error("החיבור לשרת ארך יותר מדי זמן. נסה שוב");
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
export function supportsContactPicker() {
  return (
    Platform.OS !== "web" ||
    (typeof navigator !== "undefined" && !!navigator.contacts?.select)
  );
}
export async function pickContactNumbers() {
  let numbers;
  if (Platform.OS === "web") {
    const contacts = await navigator.contacts.select(["tel"], {
      multiple: true,
    });
    numbers = contacts.flatMap((c) => c.tel || []);
  } else {
    const Contacts = await import("expo-contacts");
    const permission = await Contacts.requestPermissionsAsync();
    if (!permission.granted) throw new Error("לא ניתנה גישה לאנשי קשר");
    const { data } = await Contacts.getContactsAsync({
      fields: [Contacts.Fields.PhoneNumbers],
    });
    numbers = data.flatMap((c) => (c.phoneNumbers || []).map((p) => p.number));
  }
  return [...new Set(numbers.map(normalizeContactNumber).filter(Boolean))];
}
