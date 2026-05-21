# Review Cockpit Design

## Purpose

PI Desktop should stand apart from other PI desktop apps by making controlled agent work the product identity. The app should not feel like another sidebar-plus-chat client. It should feel like a review cockpit where the user can see what PI is allowed to do, what it is doing now, what it changed, and what needs approval.

## Product Direction

The primary direction is **Safety and Review Studio**. The first concrete expression of that direction is a **Review Cockpit** layout with an always-visible desktop review rail.

This direction prioritizes:

- Clear permission modes similar in spirit to Claude, Codex, and Kilo.
- Visible approval and review state.
- Fast inspection of changed files and pending actions.
- A layout that visually separates this app from simple chat-first PI GUIs.

## Layout

The desktop layout has three main regions plus the existing status bar.

### Left Rail

The left rail remains the navigation and context area:

- Workspaces.
- Sessions.
- Session tags.
- Primary app views.

The left rail should stay compact and operational. It should not compete with the review rail for safety controls.

### Center Work Area

The center remains the main PI interaction surface:

- Chat transcript.
- Streaming responses.
- Thinking and tool-call visualization.
- Composer.

The center should remain usable as a normal PI chat surface, but it is no longer the only meaningful part of the screen.

### Right Review Rail

The right rail is always visible by default on desktop. It may collapse on narrow windows or small screens.

The rail order is:

1. Permissions.
2. Pending approvals.
3. Changed files and diff status.
4. Risk/status notes.
5. Quick review actions.

The right rail is the app's signature surface. A user should understand within a few seconds that PI Desktop is built around controlled, reviewable agent work.

### Status Bar

The status bar remains a compact runtime surface for:

- Connection state.
- Current model and thinking level.
- Active workspace/session state.
- Background activity.

It should not become the primary permission control. Permissions belong in the right rail where they are harder to miss.

## Permissions

Permissions are the first control in the right rail.

The control may be a dropdown, segmented control, or compact mode selector. It should be visible, scannable, and easy to change without opening settings.

Initial modes:

- **Plan / Read-only**: PI may inspect and propose, but should not edit files or run risky commands.
- **Ask before edits**: PI requests approval before writing files.
- **Ask before commands**: PI requests approval before running shell commands.
- **Trusted**: PI may proceed with fewer prompts for workflows the user has accepted.

The implementation should start with UI and state plumbing that matches the current PI runtime capabilities. If the runtime cannot enforce every mode yet, the UI should clearly represent only enforceable behavior, with unenforced future modes omitted or disabled.

## Review Behavior

The right rail should make pending work visible without forcing the user to switch views.

It should support:

- Seeing the current permission mode.
- Seeing whether PI is waiting for approval.
- Seeing changed files for the active session or workspace.
- Opening diff review from the rail.
- Applying, rejecting, or investigating changes when supported by existing app behavior.

The first version can be incremental. The rail does not need to solve rollback or full audit history immediately, but it should be structured so those features can be added later.

## Visual Character

The app should feel more like a controlled operations cockpit than a generic chat app.

Design constraints:

- Keep the visual language dense, calm, and developer-focused.
- Avoid oversized marketing-style panels.
- Avoid making the right rail look like a secondary settings drawer.
- Keep controls compact and persistent.
- Use clear section headers, small status indicators, and direct action buttons.

The goal is distinctiveness through workflow and layout, not decoration.

## Data Flow

The renderer needs permission mode state available to the components that render the right rail and composer behavior.

Expected flow:

1. App initializes workspace/session state.
2. Permission mode is loaded from settings or workspace/session state.
3. User changes mode from the right rail.
4. Renderer persists the selected mode through the existing store and IPC/settings path.
5. Main process or PI runtime adapter applies the mode where enforcement is available.
6. Rail updates pending approvals and changed-file state from existing session, diff, and runtime events.

The final implementation should follow existing store, IPC, and settings patterns in the repo.

## Error Handling

If permission state cannot be loaded, default to the safest available enforceable mode.

If a selected mode cannot be enforced by the current runtime, the UI should avoid claiming enforcement. It should either:

- Disable the mode with a short unavailable label, or
- Hide the mode until enforcement exists.

If changed-file or approval data is unavailable, the rail should show an empty or unavailable state without blocking chat.

## Testing

Testing should cover:

- Permission mode state changes.
- Persistence of selected permission mode.
- Right rail rendering on desktop widths.
- Right rail collapse or fallback behavior on narrow widths if implemented.
- Diff/changed-file links from the rail when those actions are wired.

The first implementation should include focused tests for any new state helpers or layout behavior with meaningful branching.

## Out of Scope For First Pass

- Full rollback system.
- Full audit-log database.
- Multi-agent orchestration.
- Replacing the existing chat panel.
- Runtime enforcement for modes the PI backend cannot currently support.

These can be layered onto the Review Cockpit later.
