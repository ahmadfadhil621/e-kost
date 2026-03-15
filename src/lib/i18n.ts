import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "@/../locales/en.json";
import id from "@/../locales/id.json";

const resources = {
  en: { translation: en },
  id: { translation: id },
};

export const AVAILABLE_LOCALES = Object.keys(resources) as string[];
export const LANGUAGE_KEY = "ekost_language";

function getPersistedLanguage(): string {
  if (typeof window === "undefined") {
    return "en";
  }
  const stored = localStorage.getItem(LANGUAGE_KEY);
  if (stored && AVAILABLE_LOCALES.includes(stored)) {
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
