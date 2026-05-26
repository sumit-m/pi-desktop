import { useEffect, useRef } from 'react'
import { basicSetup, EditorView } from 'codemirror'
import { oneDark } from '@codemirror/theme-one-dark'
import { getCodeEditorLanguageExtensions } from './code-editor-language'

interface CodeEditorProps {
  filePath: string
  value: string
  readOnly?: boolean
  onChange?: (value: string) => void
}

export function CodeEditor({
  filePath,
  value,
  readOnly = true,
  onChange,
}: CodeEditorProps): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const onChangeRef = useRef(onChange)

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useEffect(() => {
    if (!containerRef.current) return

    // Clear any leftover DOM from a previous view before mounting the new one
    containerRef.current.innerHTML = ''

    const view = new EditorView({
      doc: value,
      parent: containerRef.current,
      extensions: [
        basicSetup,
        ...getCodeEditorLanguageExtensions(filePath),
        oneDark,
        EditorView.editable.of(!readOnly),
        EditorView.lineWrapping,
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChangeRef.current?.(update.state.doc.toString())
          }
        }),
        EditorView.theme({
          '&': {
            height: '100%',
            backgroundColor: 'var(--color-bg-primary)',
            fontSize: '12px',
          },
          '.cm-editor': {
            height: '100%',
          },
          '.cm-scroller': {
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
          },
          '.cm-content': {
            caretColor: 'var(--color-text-primary)',
          },
          '.cm-gutters': {
            backgroundColor: 'var(--color-bg-primary)',
            color: 'var(--color-text-muted)',
            borderRight: '1px solid var(--color-border)',
          },
          '.cm-activeLine': {
            backgroundColor: 'transparent',
          },
          '.cm-activeLineGutter': {
            backgroundColor: 'transparent',
          },
          '.cm-selectionMatch': {
            backgroundColor: 'transparent',
          },
          '&.cm-focused': {
            outline: 'none',
          },
        }, { dark: true }),
      ],
    })
    viewRef.current = view

    return () => {
      view.destroy()
      viewRef.current = null
    }
  }, [filePath, readOnly])

  useEffect(() => {
    const view = viewRef.current
    if (!view) return

    const current = view.state.doc.toString()
    if (current === value) return

    view.dispatch({
      changes: {
        from: 0,
        to: current.length,
        insert: value,
      },
    })
  }, [value])

  return <div ref={containerRef} className="h-full min-h-0" />
}
