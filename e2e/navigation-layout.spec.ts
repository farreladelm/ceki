import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { resizeViewport } from './helpers'

async function expectNoHorizontalOverflow(page: Page) {
  const viewportWidth = page.viewportSize()!.width
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    document: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
    rootOverflow: [document.documentElement, document.body, document.querySelector('#root')!].map(
      (element) => getComputedStyle(element).overflowX,
    ),
  }))
  expect(dimensions.document).toBeLessThanOrEqual(dimensions.viewport)
  expect(dimensions.document).toBeLessThanOrEqual(viewportWidth)
  expect(dimensions.body).toBeLessThanOrEqual(viewportWidth)
  expect(dimensions.rootOverflow).not.toContain('hidden')
  expect(dimensions.rootOverflow).not.toContain('clip')
}

test('setup form fits narrow viewports and the two-column breakpoint', async ({ page }, info) => {
  // Keeping the legacy URL here also checks that old bookmarks continue to open the form.
  await page.goto('/#/atur')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Siapa yang ikut main?')
  await page.evaluate(() => document.fonts.ready)
  for (const width of [320, 360, 375, 390, 414, 640, 768, 959, 960, 1024, 1365]) {
    await resizeViewport(page, width)
    await expectNoHorizontalOverflow(page)
    await expect(page.locator('legend.sr-only')).toHaveCSS('width', '1px')
  }
  await resizeViewport(page, 360, 800)
  await page.screenshot({ path: info.outputPath('setup-360.png'), fullPage: true })
  await resizeViewport(page, 960)
  await page.screenshot({ path: info.outputPath('setup-960.png'), fullPage: true })
})

test('custom setup fields remain inside the viewport', async ({ page }) => {
  await page.goto('/atur')
  await page.getByRole('button', { name: 'Lainnya', exact: true }).click()
  await page.getByLabel('Jumlah pemain', { exact: false }).fill('24')
  await page
    .getByRole('textbox', { name: 'Pemain 1', exact: true })
    .fill('NamaTemanYangPanjangSekali')
  await page.getByRole('button', { name: 'Tentukan target sendiri', exact: true }).click()
  await page.getByLabel('Target poin', { exact: true }).fill('1000000')
  for (const width of [320, 360, 390, 768, 960, 1024]) {
    await resizeViewport(page, width)
    await expectNoHorizontalOverflow(page)
  }
  await expect(page.locator('.player-name-field')).toHaveCount(24)
})

test('clean links use client navigation and support Back, Forward and direct reload', async ({
  page,
}) => {
  await page.goto('/')
  await page.evaluate(() => {
    document.documentElement.dataset.navigationProbe = 'same-document'
  })
  await expect(page.getByRole('link', { name: 'Mulai main', exact: true })).toHaveAttribute(
    'href',
    '/atur',
  )
  await page.getByRole('link', { name: 'Mulai main', exact: true }).click()
  await expect(page).toHaveURL(/\/atur$/)
  expect(await page.evaluate(() => document.documentElement.dataset.navigationProbe)).toBe(
    'same-document',
  )
  await page.getByRole('textbox', { name: 'Pemain 1', exact: true }).fill('Ani')
  await page.getByRole('button', { name: 'Buka meja main', exact: true }).click()
  await expect(page).toHaveURL(/\/meja\/[^/#]+$/)
  const tableUrl = page.url()
  const saved = await page.evaluate(() => localStorage.getItem('ceki.meja.v1'))
  await page.reload()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Meja kita.')
  expect(await page.evaluate(() => localStorage.getItem('ceki.meja.v1'))).toBe(saved)
  await page.getByRole('link', { name: 'Riwayat', exact: true }).click()
  await expect(page).toHaveURL(/\/riwayat$/)
  await page.goBack()
  await expect(page).toHaveURL(tableUrl)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Meja kita.')
  await page.goForward()
  await expect(page).toHaveURL(/\/riwayat$/)
  await expect(page.locator('.session-card')).toHaveCount(1)
})

test('legacy hash links migrate without losing a saved game or draft', async ({ page }) => {
  await page.goto('/atur')
  await page.getByRole('button', { name: 'Buka meja main', exact: true }).click()
  await page.getByRole('link', { name: 'Catat ronde', exact: true }).click()
  await page.getByRole('button', { name: 'Tambah 25 poin untuk Pemain 1', exact: true }).click()
  await expect(page.locator('output')).toHaveText('+25')
  const saved = await page.evaluate(() => localStorage.getItem('ceki.meja.v1'))
  const cleanPath = new URL(page.url()).pathname
  await page.goto(`/#${cleanPath}`)
  await expect(page).toHaveURL(new RegExp(`${cleanPath}$`))
  await expect(page.locator('output')).toHaveText('+25')
  expect(await page.evaluate(() => localStorage.getItem('ceki.meja.v1'))).toBe(saved)
})

test('modified clicks preserve native new-tab navigation', async ({ page, context }) => {
  await page.goto('/')
  const opened = context.waitForEvent('page')
  await page
    .getByRole('link', { name: 'Mulai main', exact: true })
    .click({ modifiers: ['Control'] })
  const tab = await opened
  await tab.waitForLoadState()
  await expect(tab).toHaveURL(/\/atur$/)
  await expect(tab.getByRole('heading', { level: 1 })).toHaveText('Siapa yang ikut main?')
  await expect(page).toHaveURL(/\/$/)
  await tab.close()
})
