"use client";

import { useAtom } from "jotai";
import { languageAtom } from "@/store/language";
import { useState, useCallback, useEffect } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Language } from "@/lib/translations";

export function LanguageSwitcher() {
  const [language, setLanguage] = useAtom(languageAtom);
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const supabase = createClient();
  const { user } = useAuth();

  // Sync language between localStorage atom and DB on login.
  // Priority: if the user already has a non-default preference in localStorage,
  // push it to DB (covers users who chose a language before DB-write was wired up).
  // Otherwise, if DB has a non-default value, pull it into the atom.
  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from("profiles")
      .select("language")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        const dbLang = data?.language as Language | null | undefined;
        if (language && language !== "en") {
          // Local has an explicit preference — persist it to DB if out of sync
          if (dbLang !== language) {
            supabase
              .from("profiles")
              .update({ language })
              .eq("id", user.id);
          }
        } else if (dbLang && dbLang !== "en") {
          // Local is still the default — adopt the DB value
          setLanguage(dbLang);
        }
      });
    // Run only once after user becomes available — intentionally omitting `language`
    // from the dep array to avoid a write-then-read loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const handleLanguageChange = useCallback(async (code: "en" | "es") => {
    setLanguage(code);
    setIsOpen(false);
    // Persist to DB so Edge Functions can use it for localized push notifications
    if (user?.id) {
      await supabase
        .from("profiles")
        .update({ language: code })
        .eq("id", user.id);
    }
  }, [user, supabase, setLanguage]);

  const languages = [
    { code: "en", label: "English", flag: "🇺🇸" },
    { code: "es", label: "Español", flag: "🇪🇸" },
  ] as const;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-all border border-white/5 active:scale-95"
        title={t("language")}
      >
        <svg
          className="w-5 h-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m5 8 6 6" />
          <path d="m4 14 6-6 2-3" />
          <path d="M2 5h12" />
          <path d="M7 2h1" />
          <path d="m22 22-5-10-5 10" />
          <path d="M14 18h6" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-40 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden animate-fade-in backdrop-blur-xl">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium transition-colors hover:bg-white/5 ${
                  language === lang.code ? "text-brand-400 bg-brand-400/5" : "text-slate-400"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-base">{lang.flag}</span>
                  {lang.label}
                </div>
                {language === lang.code && (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
