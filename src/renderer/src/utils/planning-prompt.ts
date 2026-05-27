export function buildPlanningPrompt(userPrompt: string): string {
  return [
    'You are in read-only planning mode.',
    '',
    'Use available read/search/list tools to inspect the workspace and build context, but do not edit files, create files, delete files, run shell commands, install packages, commit, or push.',
    '',
    'Return a step-by-step plan before any implementation. Include:',
    '- Relevant context you found',
    '- Files or areas likely involved',
    '- Proposed changes',
    '- Risks or assumptions',
    '- Verification steps',
    '',
    'User request:',
    userPrompt,
  ].join('\n')
}
