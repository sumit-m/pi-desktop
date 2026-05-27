import assert from 'node:assert/strict'
import { buildPlanningPrompt } from './planning-prompt'

const prompt = buildPlanningPrompt('Delete unused files')

assert.match(prompt, /read-only planning mode/i)
assert.match(prompt, /inspect/i)
assert.match(prompt, /do not edit files/i)
assert.match(prompt, /step-by-step plan/i)
assert.match(prompt, /Delete unused files/)
