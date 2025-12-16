const STORAGE_KEYS = {
  PROJECTS: 'flashcards_projects',
  PROGRESS: 'flashcards_progress'
}

export function getProjects() {
  const data = localStorage.getItem(STORAGE_KEYS.PROJECTS)
  return data ? JSON.parse(data) : []
}

export function saveProjects(projects) {
  localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects))
}

export function getProgress() {
  const data = localStorage.getItem(STORAGE_KEYS.PROGRESS)
  return data ? JSON.parse(data) : {}
}

export function saveProgress(progress) {
  localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(progress))
  // Dispatch custom event for same-tab reactivity
  window.dispatchEvent(new CustomEvent('flashcards_progress_updated', {
    detail: { key: STORAGE_KEYS.PROGRESS }
  }))
}

export function getProjectProgress(projectId) {
  const progress = getProgress()
  return progress[projectId] || {}
}

export function saveProjectProgress(projectId, cardProgress) {
  const progress = getProgress()
  progress[projectId] = cardProgress
  saveProgress(progress)
}

export function resetProjectProgress(projectId) {
  const progress = getProgress()
  delete progress[projectId]
  saveProgress(progress)
}

export function resetAllProgress() {
  localStorage.removeItem(STORAGE_KEYS.PROGRESS)
  // Dispatch custom event for same-tab reactivity
  window.dispatchEvent(new CustomEvent('flashcards_progress_updated', {
    detail: { key: STORAGE_KEYS.PROGRESS }
  }))
}

