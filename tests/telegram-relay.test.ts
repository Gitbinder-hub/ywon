import test from 'node:test';
import assert from 'node:assert/strict';
import { setEnabled, isEnabled, notify, getOutbox, handleInbound, localFallbackExplain, clearOutbox } from '../packages/telegram-relay/src/index.ts';

test('TG вкл/выкл and notifications', () => {
  setEnabled(false); assert.equal(isEnabled(), false);
  assert.equal(notify('hi'), null);
  setEnabled(true, 'chat-1', 'ref-token');
  assert.equal(isEnabled(), true);
  const m=notify('fallback: switch_to_official');
  assert.ok(m && m.chatId==='chat-1');
  assert.ok(getOutbox().length>0);
  clearOutbox(); assert.equal(getOutbox().length,0);
});

test('whitelist inbound and local fallback', () => {
  setEnabled(true,'c','r');
  assert.equal(handleInbound('/status').ok, true);
  assert.equal(handleInbound('/switch_model official-opus').ok, true);
  assert.equal(handleInbound('/unknown_cmd').ok, false);
  assert.match(localFallbackExplain(), /локалка/);
});
