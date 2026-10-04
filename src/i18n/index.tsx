import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import { createContext, Fragment, ReactNode, useContext, useEffect, useState } from 'react';
import en from './en';
import ja from './ja';
import zhHans from './zh-Hans';

export type Lang = 'ko' | 'en' | 'ja' | 'zh-Hans';
export const LANGS: { key: Lang; label: string }[] = [
  { key: 'ko', label: '한국어' },
  { key: 'en', label: 'English' },
  { key: 'ja', label: '日本語' },
  { key: 'zh-Hans', label: '简体中文' },
];

/** Dictionaries are keyed by the Korean source string, so Korean needs no table and missing keys fall back to it. */
const DICTS: Record<Exclude<Lang, 'ko'>, Record<string, string>> = { en, ja, 'zh-Hans': zhHans };
const STORAGE_KEY = 'nyang.lang';
/** Korean overrides for keys that need disambiguation (e.g. 기타 the guitar vs 기타 "other"). */
const KO: Record<string, string> = { '기타(악기)': '기타' };

export function detectLang(): Lang {
  try {
    const code = (getLocales()[0]?.languageCode ?? '').toLowerCase();
    if (code === 'ko') return 'ko';
    if (code === 'ja') return 'ja';
    if (code.startsWith('zh')) return 'zh-Hans';
  } catch {}
  return 'en';
}

let current: Lang = detectLang();
export const getLang = () => current;

export type Params = Record<string, string | number>;
/** Translate a Korean source string. `{name}` placeholders are filled from params. */
export function t(key: string, params?: Params): string {
  const s = current === 'ko' ? KO[key] ?? key : DICTS[current][key] ?? key;
  return params ? s.replace(/\{(\w+)\}/g, (m, k) => (k in params ? String(params[k]) : m)) : s;
}

type Ctx = { lang: Lang; setLang: (l: Lang) => void; t: typeof t };
const I18nContext = createContext<Ctx>({ lang: current, setLang: () => {}, t });

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(current);
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((v) => {
      if (v && LANGS.some((l) => l.key === v) && v !== current) { current = v as Lang; setLangState(current); }
    }).catch(() => {});
  }, []);
  const setLang = (l: Lang) => {
    current = l;
    setLangState(l);
    AsyncStorage.setItem(STORAGE_KEY, l).catch(() => {});
  };
  // Keyed by language: the whole tree remounts so module-level labels passed through t() re-render too.
  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      <Fragment key={lang}>{children}</Fragment>
    </I18nContext.Provider>
  );
}

export const useI18n = () => useContext(I18nContext);
