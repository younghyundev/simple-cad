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
  await page.getByRole('button', { name: /미해결/ }).click();
  await expect(page.getByTestId('review-comment')).toContainText('검토 메모');
  await page.getByTestId('review-comment').click();
  await expect(page.getByTestId('statusbar')).toContainText('주석 위치로 이동했습니다.');
  await page.getByTestId('review-comment').getByRole('button', { name: '해결됨' }).click();
  await page.getByTestId('review-filters').getByRole('button', { name: '해결됨' }).click();
  await expect(page.getByTestId('review-comment')).toContainText('검토 메모');
  await page.getByRole('button', { name: '전체' }).click();

  await page.getByTestId('share-link-button').click();
  await expect(page.getByTestId('share-dialog')).toBeVisible();
  await page.getByTestId('share-title-input').fill('현장 검토 공유');
  await page.getByTestId('share-description-input').fill('치수 확인 필요');
  await page.getByTestId('confirm-share-link-button').click();
  await expect(page.getByTestId('statusbar')).toContainText('공유 링크를 만들었습니다.');
  await expect(page.getByText('현장 검토 공유')).toBeVisible();
  await expect(page.getByText('치수 확인 필요')).toBeVisible();
  await expect(page.getByTestId('copy-share-link-button')).toBeVisible();
  await page.getByTestId('copy-share-link-button').click();
  await expect(page.getByTestId('statusbar')).toContainText('공유 링크를 복사했습니다.');
  const shareHash = new URL(page.url()).hash;
  expect(shareHash).toContain('share=');

  await page.goto('/');
  await page.goto(`/${shareHash}`);
  await expect(page.getByTestId('readonly-banner')).toContainText('읽기 전용 공유 문서');
  await expect(page.getByTestId('readonly-banner')).toContainText('현장 검토 공유');
  await expect(page.getByTestId('readonly-banner')).toContainText('치수 확인 필요');
  await expect(page.getByTestId('share-link-button')).toBeDisabled();
  await expect(page.getByTestId('comment-marker')).toBeVisible();
  await expect(page.getByText('검토 메모')).toBeVisible();
});

test('deletes a locally registered embedded share link', async ({ page }) => {
  await page.getByTestId('start-new-drawing').click();
  await expect(page.getByTestId('cad-canvas')).toBeVisible();

  await page.getByTestId('share-link-button').click();
  await page.getByTestId('confirm-share-link-button').click();
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

test('blocks expired embedded share links', async ({ page }) => {
  const expiredShare = await page.evaluate(() => {
    const payload = {
      version: 1,
      title: '만료 테스트',
      expiresAt: '2000-01-01T23:59:59.999Z',
      document: {
        id: 'expired-doc',
        name: 'Expired',
        units: 'mm',
        layers: [{ id: 'default', name: 'Default', color: '#111827', visible: true, locked: false }],
        entities: [],
      },
      comments: [],
    };
    const bytes = new TextEncoder().encode(JSON.stringify(payload));
    let binary = '';
    for (let index = 0; index < bytes.length; index += 0x8000) {
      binary += String.fromCharCode(...bytes.slice(index, index + 0x8000));
    }
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  });

  await page.goto(`/?expired=${Date.now()}#share=${expiredShare}`);
  await expect(page.getByTestId('statusbar')).toContainText('만료된 공유 링크입니다.');
  await expect(page.getByTestId('readonly-banner')).toHaveCount(0);
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
