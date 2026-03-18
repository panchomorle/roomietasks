import { atomWithStorage } from "jotai/utils";
import { type Language } from "@/lib/translations";

export const languageAtom = atomWithStorage<Language>("roomietasks_language", "en");
