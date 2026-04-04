/**
 * Calculate points based on response time
 * Max points: 1000 (answered instantly)
 * Min points: 500 (answered at the last second)
 * 0 points if wrong answer
 */
export function calculatePoints(
  waktuResponMs: number,
  waktuSoalDetik: number,
  isCorrect: boolean
): number {
  if (!isCorrect) return 0
  
  const maxPoints = 1000
  const minPoints = 500
  
  if (waktuResponMs <= 0) return minPoints
  
  const ratio = Math.max(0, Math.min(1, 1 - waktuResponMs / (waktuSoalDetik * 1000)))
  const points = Math.round(maxPoints - (maxPoints - minPoints) * ratio)
  
  return Math.max(minPoints, points)
}

/**
 * Generate a random 6-digit PIN
 */
export function generatePIN(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

/**
 * Format time in seconds to MM:SS
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

/**
 * Get color class based on option index (1-4)
 */
export function getOptionColor(index: number): string {
  const colors = [
    'bg-blue-500',   // Option 1 - Blue
    'bg-yellow-500', // Option 2 - Yellow
    'bg-purple-500',  // Option 3 - Purple
    'bg-red-500',    // Option 4 - Red
  ]
  return colors[index - 1] || 'bg-gray-500'
}

/**
 * Get icon for option (geometric shapes like Kahoot!)
 */
export function getOptionIcon(index: number): string {
  const icons = [
    '▲',  // Triangle
    '◆',  // Diamond  
    '●',  // Circle
    '■',  // Square
  ]
  return icons[index - 1] || '?'
}

/**
 * Shuffle array (Fisher-Yates)
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}
