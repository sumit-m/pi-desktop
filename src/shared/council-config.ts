/** Consultant agents the council can include. PI is always the builder/arbiter. */
export type CouncilAgentId = 'claude' | 'codex'

export const COUNCIL_AGENT_IDS: CouncilAgentId[] = ['claude', 'codex']

/** How PI reconciles consultant plans into one. */
export type ConsensusMode = 'arbiter' | 'debate'

export interface CouncilConfig {
  /** Master switch; off by default. */
  enabled: boolean
  /** Per-agent checkbox state (user intent, independent of detection). */
  members: Record<CouncilAgentId, boolean>
  consensusMode: ConsensusMode
  /** Per-consultant time budget in seconds. */
  timeoutSeconds: number
}

const MIN_TIMEOUT_SECONDS = 10
const MAX_TIMEOUT_SECONDS = 600

export const DEFAULT_COUNCIL_CONFIG: CouncilConfig = {
  enabled: false,
  members: { claude: true, codex: true },
  consensusMode: 'arbiter',
  timeoutSeconds: 90,
}

const VALID_CONSENSUS_MODES: ConsensusMode[] = ['arbiter', 'debate']

/** Validate a council config. Returns human-readable errors; empty means valid. */
export function validateCouncilConfig(config: CouncilConfig): string[] {
  const errors: string[] = []
  const t = config.timeoutSeconds
  if (typeof t !== 'number' || !Number.isFinite(t)) {
    errors.push('Council timeout must be a finite number')
  } else if (t < MIN_TIMEOUT_SECONDS || t > MAX_TIMEOUT_SECONDS) {
    errors.push(`Council timeout must be between ${MIN_TIMEOUT_SECONDS} and ${MAX_TIMEOUT_SECONDS} seconds`)
  }
  if (!VALID_CONSENSUS_MODES.includes(config.consensusMode)) {
    errors.push(`Unknown consensus mode: ${String(config.consensusMode)}`)
  }
  return errors
}

export type ConsultantStatus = 'contributed' | 'timed-out' | 'errored'

export interface ConsultantResult {
  id: CouncilAgentId
  status: ConsultantStatus
  plan?: string
  error?: string
}

export interface MemberResolution {
  /** True when the feature is enabled and >= 1 consultant is checked+detected. */
  canRun: boolean
  /** Consultant ids that are both checked and detected. */
  active: CouncilAgentId[]
  /** Why the run cannot proceed, when canRun is false. */
  reason?: string
}

/**
 * Resolve which consultants will run. PI is always the builder/arbiter and is
 * never in this list. Requires at least one other agent to reach consensus.
 */
export function resolveActiveMembers(
  config: CouncilConfig,
  detected: Record<CouncilAgentId, boolean>,
): MemberResolution {
  const active = COUNCIL_AGENT_IDS.filter((id) => config.members[id] && detected[id])
  if (!config.enabled) {
    return { canRun: false, active, reason: 'Council planning is disabled in Settings.' }
  }
  if (active.length < 1) {
    return {
      canRun: false,
      active,
      reason: 'Council needs at least one other agent. Install or enable Claude or Codex, or turn the council off.',
    }
  }
  return { canRun: true, active }
}

/** True when at least one consultant produced a usable plan. */
export function hasQuorum(results: ConsultantResult[]): boolean {
  return results.some((r) => r.status === 'contributed')
}
