import { useAtomValue } from "jotai";
import { languageAtom } from "@/store/language";
import { translations, type TranslationKey } from "@/lib/translations";

export function useTranslation() {
  const language = useAtomValue(languageAtom);

  const t = (key: TranslationKey) => {
    return translations[language][key] || translations.en[key] || key;
  };

  return { t, language };
}
