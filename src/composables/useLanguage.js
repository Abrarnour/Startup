// src/composables/useLanguage.js
import { ref, computed } from 'vue'
import { translations } from './translations.js' // ← même dossier composables

// État global singleton — partagé entre TOUS les composants
const currentLang = ref(localStorage.getItem('app_lang') || 'fr')

export function useLanguage() {
  // t('key') → retourne la traduction
  const t = (key) => {
    return translations[currentLang.value]?.[key] || translations['fr']?.[key] || key // fallback : retourne la clé si traduction manquante
  }

  // Changer la langue
  const setLang = (lang) => {
    currentLang.value = lang
    localStorage.setItem('app_lang', lang)
    // RTL automatique pour l'arabe
    document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr')
    document.documentElement.setAttribute('lang', lang)
  }

  // Basculer FR ↔ AR
  const toggleLang = () => {
    setLang(currentLang.value === 'fr' ? 'ar' : 'fr')
  }

  // Appeler une fois dans App.vue au démarrage
  const initLang = () => {
    setLang(currentLang.value)
  }

  const isArabic = computed(() => currentLang.value === 'ar')
  const isRTL = computed(() => currentLang.value === 'ar')

  return { currentLang, t, setLang, toggleLang, initLang, isArabic, isRTL }
}
