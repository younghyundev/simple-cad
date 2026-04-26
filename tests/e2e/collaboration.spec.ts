import { expect, test, type Locator } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'showSaveFilePicker', {
      configurable: true,
      value: undefined,
    });
  });
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test('creates an embedded share link, opens it read-only, and preserves comments', async ({ page }) => {
  await page.getByTestId('start-new-drawing').click();
  const canvas = page.getByTestId('cad-canvas');
  await expect(canvas).toBeVisible();
  await expect(page.getByTestId('server-save-button')).toHaveCount(0);

  await page.getByTestId('tool-rect').click();
  await dragOnCanvas(canvas, { x: 520, y: 330 }, { x: 620, y: 390 });

  page.once('dialog', async (dialog) => {
    await dialog.accept('검토 메모');
  });
  await openContextMenuOnCanvas(canvas, { x: 580, y: 360 });
  await page.getByTestId('add-comment-button').click();
  await expect(page.getByTestId('comment-marker')).toBeVisible();
  await expect(page.getByText('검토 메모')).toBeVisible();

  await page.getByTestId('share-link-button').click();
  await expect(page.getByTestId('statusbar')).toContainText('공유 링크를 만들었습니다.');
  await expect(page.getByTestId('copy-share-link-button')).toBeVisible();
  await page.getByTestId('copy-share-link-button').click();
  await expect(page.getByTestId('statusbar')).toContainText('공유 링크를 복사했습니다.');
  const shareHash = new URL(page.url()).hash;
  expect(shareHash).toContain('share=');

  await page.goto('/');
  await page.goto(`/${shareHash}`);
  await expect(page.getByTestId('readonly-banner')).toContainText('읽기 전용 공유 문서');
  await expect(page.getByTestId('share-link-button')).toBeDisabled();
  await expect(page.getByTestId('comment-marker')).toBeVisible();
  await expect(page.getByText('검토 메모')).toBeVisible();
});

test('deletes a locally registered embedded share link', async ({ page }) => {
  await page.getByTestId('start-new-drawing').click();
  await expect(page.getByTestId('cad-canvas')).toBeVisible();

  await page.getByTestId('share-link-button').click();
  await expect(page.getByTestId('copy-share-link-button')).toBeVisible();
  const shareHash = new URL(page.url()).hash;

  await page.getByTestId('delete-share-link-button').click();
  await expect(page.getByTestId('statusbar')).toContainText('공유 링크를 삭제했습니다.');
  await expect(page.getByText('생성된 공유 링크가 없습니다.')).toBeVisible();
  await expect(page.evaluate((hash) => {
    const token = hash.replace(/^#share=/, '');
    const links = JSON.parse(localStorage.getItem('simplecad.shareLinks') ?? '[]') as Array<{
      token: string;
      deletedAt?: string;
    }>;
    return links.some((link) => link.token === token && Boolean(link.deletedAt));
  }, shareHash)).resolves.toBe(true);
});

async function dragOnCanvas(
  canvas: Locator,
  start: { x: number; y: number },
  end: { x: number; y: number },
): Promise<void> {
  const box = await canvas.boundingBox();
  if (!box) throw new Error('Canvas bounding box is not available.');
  await canvas.page().mouse.move(box.x + start.x, box.y + start.y);
  await canvas.page().mouse.down();
  await canvas.page().mouse.move(box.x + end.x, box.y + end.y, { steps: 8 });
  await canvas.page().mouse.up();
}

async function openContextMenuOnCanvas(
  canvas: Locator,
  point: { x: number; y: number },
): Promise<void> {
  await canvas.evaluate(
    (element, position) => {
      const rect = element.getBoundingClientRect();
      element.dispatchEvent(
        new MouseEvent('contextmenu', {
          bubbles: true,
          cancelable: true,
          clientX: rect.left + position.x,
          clientY: rect.top + position.y,
        }),
      );
    },
    point,
  );
}
