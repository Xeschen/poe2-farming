// Existing feature suites inspect intermediate saved records. Explicitly save and
// reopen before those assertions now that edits no longer write automatically.
// Invalid drafts remain open so callers can assert the previous saved record.
export async function saveAndResume(page) {
  if (!await page.locator('#editor').count() || await page.locator('#form-errors').isVisible()) return;
  if (!(await page.locator('#save-status').innerText()).includes('변경 사항 있음')) return;
  const view = await page.evaluate(() => ({ x: scrollX, y: scrollY, open: [...document.querySelectorAll('#editor details[open]')].map(el => el.dataset.editorDetails).filter(Boolean) }));
  await page.locator('[data-action="finish"]').first().click();
  if (await page.locator('#editor').count()) throw Error('Expected a valid editor checkpoint to save');
  await page.getByRole('button', { name: '세팅 편집' }).click();
  for (const key of view.open) await page.locator(`[data-editor-details="${key}"]`).evaluate(el => { el.open = true; });
  await page.evaluate(({ x, y }) => scrollTo({ left: x, top: y, behavior: 'instant' }), view);
}
