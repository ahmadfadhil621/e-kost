import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "@/../locales/en.json";
import id from "@/../locales/id.json";
import { AVAILABLE_LOCALES, LANGUAGE_KEY } from "@/lib/locales";
export { AVAILABLE_LOCALES, LANGUAGE_KEY };

const resources = {
  en: { translation: en },
  id: { translation: id },
};

function getPersistedLanguage(): string {
  if (typeof window === "undefined") {
    return "en";
  }
  const stored = localStorage.getItem(LANGUAGE_KEY);
  if (stored && (AVAILABLE_LOCALES as readonly string[]).includes(stored)) {
    return stored;
  }
  return AVAILABLE_LOCALES[0] ?? "en";
}

i18n.use(initReactI18next).init({
  resources,
  lng: typeof window !== "undefined" ? getPersistedLanguage() : "en",
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

if (typeof window !== "undefined") {
  const stored = getPersistedLanguage();
  if (stored !== i18n.language) {
    i18n.changeLanguage(stored);
  }
}

export default i18n;
