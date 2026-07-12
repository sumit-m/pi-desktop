import { test } from 'node:test'
import assert from 'node:assert/strict'
import { shouldHideToTray, trayIsSupported } from './tray-decision'

test('trayIsSupported is true on Windows and Linux, false on macOS', () => {
  assert.equal(trayIsSupported('win32'), true)
  assert.equal(trayIsSupported('linux'), true)
  assert.equal(trayIsSupported('darwin'), false)
})

test('shouldHideToTray hides when enabled, not quitting, tray available, on a supported platform', () => {
  assert.equal(shouldHideToTray({ isQuitting: false, enabled: true, platform: 'win32', trayAvailable: true }), true)
  assert.equal(shouldHideToTray({ isQuitting: false, enabled: true, platform: 'linux', trayAvailable: true }), true)
})

test('shouldHideToTray never hides when the tray is not actually available', () => {
  // e.g. GNOME without the AppIndicator extension, minimal WM, or no session bus.
  assert.equal(shouldHideToTray({ isQuitting: false, enabled: true, platform: 'linux', trayAvailable: false }), false)
  assert.equal(shouldHideToTray({ isQuitting: false, enabled: true, platform: 'win32', trayAvailable: false }), false)
})

test('shouldHideToTray never hides during a real quit', () => {
  assert.equal(shouldHideToTray({ isQuitting: true, enabled: true, platform: 'win32', trayAvailable: true }), false)
  assert.equal(shouldHideToTray({ isQuitting: true, enabled: true, platform: 'linux', trayAvailable: true }), false)
})

test('shouldHideToTray does nothing when the setting is off', () => {
  assert.equal(shouldHideToTray({ isQuitting: false, enabled: false, platform: 'win32', trayAvailable: true }), false)
})

test('shouldHideToTray never hides on macOS even when enabled and available', () => {
  assert.equal(shouldHideToTray({ isQuitting: false, enabled: true, platform: 'darwin', trayAvailable: true }), false)
})
