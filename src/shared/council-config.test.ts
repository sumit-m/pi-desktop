import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  validateCouncilConfig,
  DEFAULT_COUNCIL_CONFIG,
  type CouncilConfig,
} from './council-config'

test('default config is valid', () => {
  assert.deepEqual(validateCouncilConfig(DEFAULT_COUNCIL_CONFIG), [])
})

test('default config is disabled', () => {
  assert.equal(DEFAULT_COUNCIL_CONFIG.enabled, false)
})

test('flags timeout below minimum', () => {
  const cfg: CouncilConfig = { ...DEFAULT_COUNCIL_CONFIG, timeoutSeconds: 1 }
  assert.ok(validateCouncilConfig(cfg).some((e) => e.toLowerCase().includes('timeout')))
})

test('flags timeout above maximum', () => {
  const cfg: CouncilConfig = { ...DEFAULT_COUNCIL_CONFIG, timeoutSeconds: 10_000 }
  assert.ok(validateCouncilConfig(cfg).some((e) => e.toLowerCase().includes('timeout')))
})

test('flags non-finite timeout', () => {
  const cfg: CouncilConfig = { ...DEFAULT_COUNCIL_CONFIG, timeoutSeconds: Number.NaN }
  assert.ok(validateCouncilConfig(cfg).some((e) => e.toLowerCase().includes('timeout')))
})

test('flags unknown consensus mode', () => {
  const cfg = { ...DEFAULT_COUNCIL_CONFIG, consensusMode: 'loop' } as unknown as CouncilConfig
  assert.ok(validateCouncilConfig(cfg).some((e) => e.toLowerCase().includes('consensus')))
})

import {
  resolveActiveMembers,
  hasQuorum,
  type MemberResolution,
  type ConsultantResult,
} from './council-config'

const allDetected = { claude: true, codex: true }

test('resolves checked-and-detected consultants', () => {
  const r = resolveActiveMembers(DEFAULT_COUNCIL_CONFIG_ENABLED(), allDetected)
  assert.deepEqual(r.active.sort(), ['claude', 'codex'])
  assert.equal(r.canRun, true)
})

test('excludes unchecked members', () => {
  const cfg = DEFAULT_COUNCIL_CONFIG_ENABLED()
  cfg.members.codex = false
  const r = resolveActiveMembers(cfg, allDetected)
  assert.deepEqual(r.active, ['claude'])
  assert.equal(r.canRun, true)
})

test('excludes undetected members', () => {
  const r = resolveActiveMembers(DEFAULT_COUNCIL_CONFIG_ENABLED(), { claude: true, codex: false })
  assert.deepEqual(r.active, ['claude'])
})

test('refuses when no consultant is available (only PI)', () => {
  const r = resolveActiveMembers(DEFAULT_COUNCIL_CONFIG_ENABLED(), { claude: false, codex: false })
  assert.equal(r.canRun, false)
  assert.ok((r.reason ?? '').toLowerCase().includes('at least one'))
})

test('refuses when feature disabled', () => {
  const r = resolveActiveMembers(DEFAULT_COUNCIL_CONFIG, allDetected)
  assert.equal(r.canRun, false)
})

test('hasQuorum true when any consultant contributed', () => {
  const results: ConsultantResult[] = [
    { id: 'claude', status: 'errored', error: 'x' },
    { id: 'codex', status: 'contributed', plan: 'p' },
  ]
  assert.equal(hasQuorum(results), true)
})

test('hasQuorum false when none contributed', () => {
  const results: ConsultantResult[] = [
    { id: 'claude', status: 'errored', error: 'x' },
    { id: 'codex', status: 'timed-out' },
  ]
  assert.equal(hasQuorum(results), false)
})

// helper: an enabled copy of the default config
function DEFAULT_COUNCIL_CONFIG_ENABLED(): CouncilConfig {
  return { ...DEFAULT_COUNCIL_CONFIG, enabled: true, members: { claude: true, codex: true } }
}
