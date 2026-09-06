import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const projectRoot = new URL('../', import.meta.url);

async function readProjectFile(path) {
  return readFile(new URL(path, projectRoot), 'utf8');
}

test('manifest routes the requested platform shortcuts through the popup action', async () => {
  const manifest = JSON.parse(await readProjectFile('public/manifest.json'));

  assert.equal(manifest.action?.default_popup, 'popup.html');
  assert.deepEqual(Object.keys(manifest.commands ?? {}), ['_execute_action']);
  assert.deepEqual(manifest.commands._execute_action.suggested_key, {
    default: 'Ctrl+Shift+Period',
    mac: 'Command+Shift+Period',
  });
});

test('obsolete custom shortcut bridge is absent from extension source', async () => {
  const [serviceWorker, app, summaryPanel] = await Promise.all([
    readProjectFile('src/background/service-worker.js'),
    readProjectFile('src/popup/App.jsx'),
    readProjectFile('src/features/summary/SummaryPanel.jsx'),
  ]);
  const shortcutBridgeSource = `${serviceWorker}\n${app}\n${summaryPanel}`;

  assert.doesNotMatch(shortcutBridgeSource, /chrome\.commands\.onCommand/);
  assert.doesNotMatch(shortcutBridgeSource, /chrome\.action\.openPopup/);
  assert.doesNotMatch(shortcutBridgeSource, /storage\.session\.(?:get|set|remove)\([^\n]*autoSummarise/);
  assert.doesNotMatch(shortcutBridgeSource, /pendingSummarise/);
  assert.doesNotMatch(shortcutBridgeSource, /triggerSummarise/);
  assert.doesNotMatch(shortcutBridgeSource, /onTriggerConsumed/);
});
