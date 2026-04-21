import { createContext, useContext, useState } from 'react'
import tr from './tr'
import en from './en'

const LOCALES = { tr, en }
const STORAGE_KEY = 'parcadar_lang'

export const LANGUAGE_LABELS = {
  tr: 'Türkçe',
  en: 'English',
}

const I18nContext = createContext(null)

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(
    () => localStorage.getItem(STORAGE_KEY) || 'tr'
  )

  const setLang = (l) => {
    localStorage.setItem(STORAGE_KEY, l)
    setLangState(l)
  }

  const t = (key, vars = {}) => {
    const parts = key.split('.')
    let val = LOCALES[lang]
    for (const p of parts) {
      val = val?.[p]
      if (val === undefined) break
    }
    if (typeof val !== 'string') return key
    return val.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '')
  }

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  return useContext(I18nContext)
}
