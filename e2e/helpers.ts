import type { Page } from '@playwright/test'

export async function resizeViewport(page: Page, width: number, height = 844) {
  await page.setViewportSize({ width, height })
  // Let responsive media queries settle before measuring or capturing the page.
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
      }),
  )
}
