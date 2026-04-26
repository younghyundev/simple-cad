import { expect, test, type Locator } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'showSaveFilePicker', {
      configurable: true,
      value: undefined,
    });
  });
  await page.goto('/');
});

test('creates, edits, saves, and imports CAD work', async ({ page }) => {
  await page.getByTestId('start-new-drawing').click();
  const canvas = page.getByTestId('cad-canvas');
  await expect(canvas).toBeVisible();

  await page.getByTestId('tool-rect').click();
  await dragOnCanvas(canvas, { x: 520, y: 330 }, { x: 620, y: 390 });
  await expect(page.getByTestId('statusbar')).toContainText(/선택:/);
  await expect(page.getByTestId('statusbar')).toContainText('저장 안 됨');

  await page.getByTestId('tool-select').click();
  await dragOnCanvas(canvas, { x: 570, y: 360 }, { x: 610, y: 390 });
  await expect(page.getByTestId('statusbar')).toContainText(/선택:/);

  await canvas.click({ position: { x: 590, y: 380 } });
  await openContextMenuOnCanvas(canvas, { x: 590, y: 380 });
  await expect(page.getByTestId('cad-context-menu')).toBeVisible();
  await page.getByTestId('cad-context-menu').getByRole('menuitem', { name: '참조 복사' }).click();
  await canvas.click({ position: { x: 520, y: 330 } });
  await expect(page.getByTestId('statusbar')).toContainText('참조 기준점과 함께 복사했습니다.');

  await page.keyboard.press('ControlOrMeta+V');
  await expect(page.getByTestId('statusbar')).toContainText('대응 기준점을 선택하세요');
  await canvas.click({ position: { x: 650, y: 430 } });
  await expect(page.getByTestId('statusbar')).toContainText('참조 위치에 붙여넣었습니다.');

  await page.getByTestId('tool-text').click();
  await canvas.click({ position: { x: 680, y: 420 } });
  const textInput = page.getByTestId('canvas-text-input');
  await expect(textInput).toBeVisible();
  await textInput.fill('E2E 메모');
  await textInput.press('Enter');
  await expect(textInput).toBeHidden();

  const download = page.waitForEvent('download');
  await page.getByTestId('save-button').click();
  const savedFile = await download;
  expect(savedFile.suggestedFilename()).toMatch(/새 도면 1\.json$/);
  await expect(page.getByTestId('statusbar')).toContainText('저장됨');

  await page.getByTestId('file-input').setInputFiles('src/cad/io/fixtures/fidelity-basic.dxf');
  await expect(page.getByTestId('workspace-tab').filter({ hasText: 'fidelity-basic.dxf' })).toBeVisible();
  await expect(page.getByText('변환 상태')).toBeVisible();
  await expect(page.getByTestId('statusbar')).toContainText('fidelity-basic.dxf 파일을 열었습니다.');
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
