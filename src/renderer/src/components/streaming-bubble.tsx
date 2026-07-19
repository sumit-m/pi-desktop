import { MarkdownRenderer } from './markdown-renderer'
import { toolLabel } from '../message-grouping'
import { toolCallIconFor } from './tool-call-icon'
import { useAppStore } from '../store'
import { DEFAULT_SETTINGS } from '../../../shared/default-settings'
import { Brain, Bot, Loader2 } from 'lucide-react'
import { clsx } from 'clsx'

interface StreamingBubbleProps {
  content: string
  thinking: string
  toolCalls: Map<
    string,
    { name: string; args: string; result?: string; isExecuting: boolean; startedAt?: number; durationMs?: number }
  >
}

export function StreamingBubble({ content, thinking, toolCalls }: StreamingBubbleProps): React.JSX.Element {
  const thinkingEnabled = useAppStore(
    (state) => state.settingsDraft.showThinking ?? state.settings?.showThinking ?? DEFAULT_SETTINGS.showThinking
  )
  return (
    <div className="mb-4 animate-fade-in">
      <div className="flex items-start gap-3">
        {/* Avatar with pulse */}
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-bg">
          <Bot size={14} className="text-accent-fg animate-pulse" />
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          {/* Thinking */}
          {thinking && thinkingEnabled && (
            <div className="mb-2 rounded-lg border border-special-bg bg-special-bg p-3">
              <div className="flex items-center gap-1 text-sm text-special mb-1">
                <Brain size={12} />
                Thinking...
              </div>
              <div className="text-sm text-dim line-clamp-3">
                {thinking.slice(-200)}
              </div>
            </div>
          )}

          {/* Tool calls */}
          {toolCalls.size > 0 && (
            <div className="mb-2 space-y-1">
              {Array.from(toolCalls.entries()).map(([id, tc]) => {
                // Mirror the operation icon (matching the finalized bubble); the
                // spinner takes over while the call is executing.
                const Icon = toolCallIconFor(tc.name)
                return (
                  <div
                    key={id}
                    className={clsx(
                      'flex items-center gap-2 rounded-lg border px-3 py-2 text-sm',
                      tc.isExecuting
                        ? 'border-warning-bg bg-warning-bg text-warning'
                        : 'border-border bg-surface/50 text-muted'
                    )}
                  >
                    {tc.isExecuting ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Icon size={12} />
                    )}
                    <span className="font-jetbrains">{toolLabel(tc.name)}</span>
                    {tc.isExecuting && (
                      <span className="ml-auto text-xs text-warning">executing</span>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Streaming text */}
          {content && (
            <div className="markdown-body text-sm">
              <MarkdownRenderer content={content} />
              <span className="inline-block w-1.5 h-4 bg-accent animate-pulse ml-0.5 align-text-bottom" />
            </div>
          )}

          {/* Empty state while waiting — sized like the Thinking header and
              vertically centered against the avatar (h-7). */}
          {!content && !thinking && toolCalls.size === 0 && (
            <div className="flex h-7 items-center gap-2 text-sm text-dim">
              <Loader2 size={12} className="animate-spin" />
              Waiting for response...
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
