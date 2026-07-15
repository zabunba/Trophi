import en from "../lang/en.json";
//import pt from "../lang/pt.json";
//import fr from "../lang/fr.json";

import { DeviceEventEmitter } from "react-native";

export const translations = {
  en,
  //pt,
  //fr
};

let currentLang = "en";

export const setLanguage = (lang) => {
  if (translations[lang]) {
    if (currentLang !== lang) {
      currentLang = lang;
      DeviceEventEmitter.emit("language_changed", lang);
    }
  }
};

export const getLanguage = () => currentLang;

export const t = (key) => {
  const keys = key.split(".");
  let value = translations[currentLang];
  
  for (const k of keys) {
    if (value && value[k]) {
      value = value[k];
    } else {
      let fallback = translations["en"];
      for (const fk of keys) {
        if (fallback && fallback[fk]) {
          fallback = fallback[fk];
        } else {
          return key;
        }
      }
      return fallback;
    }
  }
  return value;
};
