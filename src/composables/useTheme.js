import { ref } from 'vue'

export function useTheme() {
  const isDark = ref(false)

  const initTheme = () => {
    const saved = localStorage.getItem('theme')
    if (saved) {
      isDark.value = saved === 'dark'
    } else {
      isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    updateTheme()
  }

  const updateTheme = () => {
    if (isDark.value) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }

  const toggleTheme = () => {
    isDark.value = !isDark.value
    updateTheme()
  }

  // Initialize on import
  if (typeof window !== 'undefined') {
    initTheme()
  }

  return {
    isDark,
    toggleTheme
  }
}

