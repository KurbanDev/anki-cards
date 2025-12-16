<template>
  <div>
    <header class="border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-40">
      <div class="container mx-auto  py-4 flex items-center justify-between gap-3 max-[1000px]:px-4">
        <h1 class="text-2xl font-bold max-[1000px]:text-xl">ANKI CARDS</h1>
        <Button
          variant="ghost"
          size="icon"
          @click="toggleTheme"
          class="relative max-[1000px]:self-end"
        >
          <Sun class="size-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon class="absolute size-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span class="sr-only">Переключить тему</span>
        </Button>
      </div>
    </header>
    <RouterView />
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'
import { useTheme } from '@/composables/useTheme'
import Button from '@/components/ui/Button.vue'
import { Sun, Moon } from 'lucide-vue-next'

const { toggleTheme } = useTheme()

onMounted(() => {
  // Initialize theme
  const saved = localStorage.getItem('theme')
  if (saved) {
    if (saved === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  } else {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    if (prefersDark) {
      document.documentElement.classList.add('dark')
    }
  }
})
</script>

<style>
/* Ensure smooth transitions */
* {
  transition-property: color, background-color, border-color;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}
</style>
