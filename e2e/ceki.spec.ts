import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

async function setup(page: Page) {
  await page.goto('/#/atur')
  await page.getByRole('button', { name: '2 orang', exact: true }).click()
  await page.getByRole('textbox', { name: 'Pemain 1', exact: true }).fill('Ani')
  await page.getByRole('textbox', { name: 'Pemain 2', exact: true }).fill('Budi')
  await page.getByRole('button', { name: 'Buka meja main', exact: true }).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Meja kita.')
}

async function reviewAndSave(page: Page) {
  await page.getByRole('button', { name: 'Periksa semua skor', exact: true }).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Semua sudah pas?')
  await page.getByRole('button', { name: 'Simpan ronde', exact: true }).click()
}

test('welcome and setup fit narrow and wide screens', async ({ page }, info) => {
  const originalViewport = page.viewportSize()!
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Banyak cerita.')
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({ path: info.outputPath('home.png'), fullPage: true })
  for (const width of [320, 360, 390, 768, 1365]) {
    await page.setViewportSize({ width, height: 844 })
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
      ),
    ).toBe(true)
  }
  await page.setViewportSize(originalViewport)
  await page.getByRole('link', { name: 'Mulai main', exact: true }).click()
  await expect(page.getByRole('button', { name: '4 orang favorit', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await page.screenshot({ path: info.outputPath('setup.png'), fullPage: true })
})

test('repeated signed taps, undo, reset, draft recovery and one round save', async ({
  page,
}, info) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await setup(page)
  await page.getByRole('link', { name: 'Catat ronde', exact: true }).click()
  await page
    .getByRole('button', { name: 'Tambah 10 poin untuk Ani', exact: true })
    .click({ clickCount: 2 })
  await expect(page.locator('output')).toHaveText('+20')
  await page.getByRole('button', { name: 'Kurangi 25 poin untuk Ani', exact: true }).click()
  await expect(page.locator('output')).toHaveText('−5')
  await page.reload()
  await expect(page.locator('output')).toHaveText('−5')
  await page.getByRole('button', { name: 'Urungkan', exact: true }).click()
  await expect(page.locator('output')).toHaveText('+20')
  await page.getByRole('button', { name: 'Reset pemain ini', exact: true }).click()
  await expect(page.locator('output')).toHaveText('0')
  await page.getByRole('button', { name: 'Urungkan', exact: true }).click()
  await expect(page.locator('output')).toHaveText('+20')
  await page.screenshot({ path: info.outputPath('input.png'), fullPage: true })
  await page.getByRole('button', { name: 'Budi', exact: true }).click()
  await page.getByRole('button', { name: 'Kurangi 500 poin untuk Budi', exact: true }).click()
  await reviewAndSave(page)
  await expect(page.locator('.player-total')).toHaveText(['20poin', '-500poin'])
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('ceki.meja.v1')!))
  expect(saved.games[0].rounds).toHaveLength(1)
  expect(Object.keys(saved.drafts)).toHaveLength(0)
  await page.screenshot({ path: info.outputPath('table.png'), fullPage: true })
  expect(errors).toEqual([])
})

test('shared crown, correction confirmation, reopened game and a new single winner', async ({
  page,
}, info) => {
  await setup(page)
  await page.getByRole('link', { name: 'Catat ronde', exact: true }).click()
  await page.getByRole('button', { name: 'Tambah 500 poin untuk Ani', exact: true }).click()
  await expect(page.locator('output')).toHaveText('+500')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Tinggal ketuk, tercatat.')
  await page.getByRole('button', { name: 'Budi', exact: true }).click()
  await page.getByRole('button', { name: 'Tambah 500 poin untuk Budi', exact: true }).click()
  await reviewAndSave(page)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Ani&Budi')
  await expect(page.locator('.leaderboard-champion')).toHaveCount(2)
  await page.screenshot({ path: info.outputPath('shared-winners.png'), fullPage: true })
  await page.getByRole('link', { name: 'Lihat rincian', exact: true }).click()
  await page.getByRole('link', { name: 'Koreksi skor', exact: true }).click()
  await page.getByRole('button', { name: 'Kurangi 5 poin untuk Ani', exact: true }).click()
  await page.getByRole('button', { name: 'Budi', exact: true }).click()
  await page.getByRole('button', { name: 'Kurangi 5 poin untuk Budi', exact: true }).click()
  await page.getByRole('button', { name: 'Periksa semua skor', exact: true }).click()
  await page.getByRole('button', { name: 'Simpan koreksi', exact: true }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.getByRole('button', { name: 'Ya, simpan koreksi', exact: true }).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Meja kita.')
  await expect(page.locator('.player-total')).toHaveText(['495poin', '495poin'])
  await page.getByRole('link', { name: 'Catat ronde', exact: true }).click()
  await page.getByRole('button', { name: 'Tambah 5 poin untuk Ani', exact: true }).click()
  await reviewAndSave(page)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Ani')
  await expect(page.locator('.leaderboard-champion')).toHaveCount(1)
  await page.screenshot({ path: info.outputPath('winner.png'), fullPage: true })
  await page.getByRole('link', { name: 'Main lagi', exact: true }).click()
  await expect(page.getByRole('textbox', { name: 'Pemain 1', exact: true })).toHaveValue('Ani')
  await page.getByRole('button', { name: 'Buka meja main', exact: true }).click()
  await expect(page.locator('.player-total')).toHaveText(['0poin', '0poin'])
  expect(
    await page.evaluate(() => JSON.parse(localStorage.getItem('ceki.meja.v1')!).games.length),
  ).toBe(2)
})

test('manual player count and custom target', async ({ page }) => {
  await page.goto('/#/atur')
  await page.getByRole('button', { name: 'Lainnya', exact: true }).click()
  await page.getByLabel('Jumlah pemain', { exact: false }).fill('1')
  await expect(page.getByRole('button', { name: 'Buka meja main', exact: true })).toBeDisabled()
  await page.getByLabel('Jumlah pemain', { exact: false }).fill('6')
  await expect(page.locator('.player-name-field')).toHaveCount(6)
  await page.getByRole('button', { name: 'Tentukan target sendiri', exact: true }).click()
  await page.getByLabel('Target poin', { exact: true }).fill('0')
  await expect(page.getByRole('button', { name: 'Buka meja main', exact: true })).toBeDisabled()
  await page.getByLabel('Target poin', { exact: true }).fill('750')
  await page.getByRole('button', { name: 'Buka meja main', exact: true }).click()
  await expect(page.locator('.player-score-card')).toHaveCount(6)
  await expect(page.locator('.table-banner')).toContainText('750')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})

test('four-player round awards the highest score and deleting it reopens the table', async ({
  page,
}, info) => {
  await page.goto('/#/atur')
  await page.getByRole('button', { name: 'Buka meja main', exact: true }).click()
  await expect(page.locator('.player-score-card')).toHaveCount(4)
  await expect(page.locator('.player-score-card h3')).toHaveText([
    'Pemain 1',
    'Pemain 2',
    'Pemain 3',
    'Pemain 4',
  ])
  await page.screenshot({ path: info.outputPath('four-player-table.png'), fullPage: true })
  await page.getByRole('link', { name: 'Catat ronde', exact: true }).click()
  await page.getByRole('button', { name: 'Tambah 500 poin untuk Pemain 1', exact: true }).click()
  await page.getByRole('button', { name: 'Berikutnya', exact: true }).click()
  await page.getByRole('button', { name: 'Tambah 500 poin untuk Pemain 2', exact: true }).click()
  await page.getByRole('button', { name: 'Tambah 25 poin untuk Pemain 2', exact: true }).click()
  await page.getByRole('button', { name: 'Berikutnya', exact: true }).click()
  await page.getByRole('button', { name: 'Kurangi 500 poin untuk Pemain 3', exact: true }).click()
  await page.getByRole('button', { name: 'Berikutnya', exact: true }).click()
  await page.getByRole('button', { name: 'Tambah 250 poin untuk Pemain 4', exact: true }).click()
  await page.getByRole('button', { name: 'Periksa ronde', exact: true }).click()
  await page.screenshot({ path: info.outputPath('review.png'), fullPage: true })
  await page.getByRole('button', { name: 'Simpan ronde', exact: true }).dblclick()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Pemain 2')
  await expect(page.locator('.leaderboard-player strong')).toHaveText([
    'Pemain 2',
    'Pemain 1',
    'Pemain 4',
    'Pemain 3',
  ])
  await expect(page.locator('.leaderboard-total')).toHaveText(['525', '500', '250', '-500'])
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem('ceki.meja.v1')!).games[0].rounds.length,
    ),
  ).toBe(1)
  await page.getByRole('link', { name: 'Lihat rincian', exact: true }).click()
  await page.getByRole('button', { name: 'Hapus ronde', exact: true }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Hapus ronde', exact: true }).click()
  await page.getByRole('link', { name: 'Ke meja', exact: true }).click()
  await expect(page.locator('.player-total')).toHaveText(['0poin', '0poin', '0poin', '0poin'])
  await expect(page.getByRole('link', { name: 'Catat ronde', exact: true })).toBeVisible()
})

test('duplicate names can be corrected without losing setup', async ({ page }) => {
  await page.goto('/#/atur')
  await page.getByRole('button', { name: '2 orang', exact: true }).click()
  await page.getByRole('textbox', { name: 'Pemain 1', exact: true }).fill('Ani')
  await page.getByRole('textbox', { name: 'Pemain 2', exact: true }).fill(' ani ')
  await page.getByRole('button', { name: 'Buka meja main', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('berbeda')
  await page.getByRole('textbox', { name: 'Pemain 2', exact: true }).fill('Budi')
  await page.getByRole('button', { name: 'Buka meja main', exact: true }).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Meja kita.')
})

test('corrupted local data stays untouched until explicit confirmation', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('ceki.meja.v1', '{bad-json')
    localStorage.setItem('other-app', 'keep')
  })
  await page.goto('/')
  await expect(page.getByRole('alert')).toContainText('belum ditimpa')
  expect(await page.evaluate(() => localStorage.getItem('ceki.meja.v1'))).toBe('{bad-json')
  await page.getByRole('button', { name: 'Atur ulang', exact: true }).click()
  await page.getByRole('button', { name: 'Batal', exact: true }).click()
  expect(await page.evaluate(() => localStorage.getItem('ceki.meja.v1'))).toBe('{bad-json')
  await page.getByRole('button', { name: 'Atur ulang', exact: true }).click()
  await page.getByRole('button', { name: 'Hapus dan mulai ulang', exact: true }).click()
  await expect(page.getByRole('alert')).toHaveCount(0)
  expect(
    await page.evaluate(() => JSON.parse(localStorage.getItem('ceki.meja.v1')!).games),
  ).toEqual([])
  expect(await page.evaluate(() => localStorage.getItem('other-app'))).toBe('keep')
})

test('unavailable storage is clearly reported', async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException('Quota', 'QuotaExceededError')
    }
  })
  await page.goto('/')
  await expect(page.getByRole('alert')).toContainText('belum bisa disimpan')
  await expect(page.getByRole('button', { name: 'Coba simpan lagi', exact: true })).toBeVisible()
})

test('help supports Escape and delete requires explicit confirmation', async ({ page }) => {
  await setup(page)
  await page.getByRole('button', { name: 'Cara menggunakan Ceki', exact: true }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await page.getByRole('link', { name: 'Riwayat', exact: true }).click()
  await page.getByRole('button', { name: /Hapus permainan Ani, Budi/ }).click()
  await page.getByRole('button', { name: 'Batal', exact: true }).click()
  await expect(page.locator('.session-card')).toHaveCount(1)
  await page.getByRole('button', { name: /Hapus permainan Ani, Budi/ }).click()
  await page.getByRole('button', { name: 'Hapus permainan', exact: true }).click()
  await expect(page.locator('.session-card')).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Belum ada cerita.', exact: true })).toBeVisible()
})
