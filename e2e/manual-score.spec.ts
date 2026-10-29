import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { resizeViewport } from './helpers'

async function openScorePage(page: Page) {
  await page.goto('/atur')
  await page.getByRole('button', { name: '2 orang', exact: true }).click()
  await page.getByRole('textbox', { name: 'Pemain 1', exact: true }).fill('Ani')
  await page.getByRole('textbox', { name: 'Pemain 2', exact: true }).fill('Budi')
  await page.getByRole('button', { name: 'Buka meja main', exact: true }).click()
  await page.getByRole('link', { name: 'Catat ronde', exact: true }).click()
}

async function inputManual(page: Page, score: string) {
  await page.getByRole('button', { name: 'Input manual', exact: true }).click()
  await page.getByRole('textbox', { name: 'Nilai skor', exact: true }).fill(score)
  await page.getByRole('button', { name: 'Terapkan skor', exact: true }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
}

test('manual score replaces the value and works with taps, undo and reset', async ({ page }) => {
  await openScorePage(page)
  await page
    .getByRole('button', { name: 'Tambah 10 poin untuk Ani', exact: true })
    .click({ clickCount: 2 })
  await expect(page.locator('output')).toHaveText('+20')
  await inputManual(page, '123')
  await expect(page.locator('output')).toHaveText('+123')
  await page.getByRole('button', { name: 'Kurangi 5 poin untuk Ani', exact: true }).click()
  await expect(page.locator('output')).toHaveText('+118')
  await page.getByRole('button', { name: 'Urungkan', exact: true }).click()
  await expect(page.locator('output')).toHaveText('+123')
  await page.getByRole('button', { name: 'Urungkan', exact: true }).click()
  await expect(page.locator('output')).toHaveText('+20')
  await inputManual(page, '37')
  await page.getByRole('button', { name: 'Reset pemain ini', exact: true }).click()
  await expect(page.locator('output')).toHaveText('0')
  await page.getByRole('button', { name: 'Urungkan', exact: true }).click()
  await expect(page.locator('output')).toHaveText('+37')
})

test('negative sign, pasted signed values and zero survive reload', async ({ page }) => {
  await openScorePage(page)
  await page.getByRole('button', { name: 'Input manual', exact: true }).click()
  await page.getByRole('textbox', { name: 'Nilai skor', exact: true }).fill('37')
  await page.getByRole('button', { name: 'Jadikan skor negatif', exact: true }).click()
  await page.getByRole('button', { name: 'Terapkan skor', exact: true }).click()
  await expect(page.locator('output')).toHaveText('−37')
  await page.reload()
  await expect(page.locator('output')).toHaveText('−37')
  await expect(page.getByRole('alert')).toHaveCount(0)
  await inputManual(page, '-47')
  await expect(page.locator('output')).toHaveText('−47')
  await inputManual(page, '+0')
  await expect(page.locator('output')).toHaveText('0')
  await page.reload()
  await expect(page.locator('output')).toHaveText('0')
})

test('invalid manual values cannot be applied and Enter submits a valid score', async ({
  page,
}) => {
  await openScorePage(page)
  await page.getByRole('button', { name: 'Input manual', exact: true }).click()
  const input = page.getByRole('textbox', { name: 'Nilai skor', exact: true })
  for (const invalid of ['', '1.5', '1,5', '1.000', '1e3', '9007199254740992', '-']) {
    await input.fill(invalid)
    await expect(input).toHaveAttribute('aria-invalid', 'true')
    await expect(page.getByRole('button', { name: 'Terapkan skor', exact: true })).toBeDisabled()
    await expect(page.locator('output')).toHaveText('0')
  }
  await input.fill('+123')
  await expect(input).toHaveAttribute('aria-invalid', 'false')
  await input.press('Enter')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.locator('output')).toHaveText('+123')
})

test('applying an unchanged value adds no undo step and cancellation changes nothing', async ({
  page,
}) => {
  await openScorePage(page)
  await page.getByRole('button', { name: 'Tambah 25 poin untuk Ani', exact: true }).click()
  await page.getByRole('button', { name: 'Input manual', exact: true }).click()
  await expect(page.getByRole('textbox', { name: 'Nilai skor', exact: true })).toHaveValue('25')
  await page.getByRole('button', { name: 'Terapkan skor', exact: true }).click()
  await page.getByRole('button', { name: 'Urungkan', exact: true }).click()
  await expect(page.locator('output')).toHaveText('0')
  await page.getByRole('button', { name: 'Input manual', exact: true }).click()
  await page.getByRole('textbox', { name: 'Nilai skor', exact: true }).fill('123')
  await page.getByRole('button', { name: 'Batal', exact: true }).click()
  await expect(page.locator('output')).toHaveText('0')
  await page.reload()
  await expect(page.locator('output')).toHaveText('0')
})

test('manual scores persist after saving a round and can be corrected', async ({ page }) => {
  await openScorePage(page)
  await inputManual(page, '123')
  await page.getByRole('button', { name: 'Budi', exact: true }).click()
  await inputManual(page, '-47')
  await page.getByRole('button', { name: 'Periksa semua skor', exact: true }).click()
  await page.getByRole('button', { name: 'Simpan ronde', exact: true }).click()
  await expect(page.locator('.player-total')).toHaveText(['123poin', '-47poin'])
  await page.reload()
  await expect(page.locator('.player-total')).toHaveText(['123poin', '-47poin'])
  await page.getByRole('link', { name: 'Riwayat ronde', exact: true }).click()
  await page.getByRole('link', { name: 'Koreksi skor', exact: true }).click()
  await inputManual(page, '37')
  await page.getByRole('button', { name: 'Periksa semua skor', exact: true }).click()
  await page.getByRole('button', { name: 'Simpan koreksi', exact: true }).click()
  await expect(page.locator('.player-total')).toHaveText(['37poin', '-47poin'])
  await page.reload()
  await expect(page.locator('.player-total')).toHaveText(['37poin', '-47poin'])
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('ceki.meja.v1')!))
  expect(saved.games[0].rounds).toHaveLength(1)
})

test('manual target is checked only after saving all players', async ({ page }) => {
  await openScorePage(page)
  await inputManual(page, '500')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Tinggal ketuk, tercatat.')
  await page.getByRole('button', { name: 'Budi', exact: true }).click()
  await inputManual(page, '525')
  await page.getByRole('button', { name: 'Periksa semua skor', exact: true }).click()
  await page.getByRole('button', { name: 'Simpan ronde', exact: true }).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Budi')
  await expect(page.locator('.leaderboard-total')).toHaveText(['525', '500'])
})

test('manual input fits small screens and shows the active sign clearly', async ({
  page,
}, info) => {
  await openScorePage(page)
  await page.getByRole('button', { name: 'Input manual', exact: true }).click()
  const input = page.getByRole('textbox', { name: 'Nilai skor', exact: true })
  await expect(input).toHaveAttribute('inputmode', 'numeric')
  await expect(input).toBeFocused()
  await input.fill('-123')
  await expect(input).toHaveValue('123')
  await expect(
    page.getByRole('button', { name: 'Jadikan skor positif', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true')
  for (const width of [320, 360, 390, 768, 1365]) {
    await resizeViewport(page, width)
    const box = await page.getByRole('dialog').boundingBox()
    expect(box!.x).toBeGreaterThanOrEqual(0)
    expect(box!.x + box!.width).toBeLessThanOrEqual(width)
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      width,
    )
  }
  await resizeViewport(page, 360, 800)
  await page.screenshot({ path: info.outputPath('manual-score-360.png'), fullPage: true })
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.locator('output')).toHaveText('0')
})
