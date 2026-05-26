import { useEffect, useRef } from 'react'
import { basicSetup, EditorView } from 'codemirror'
import { EditorState } from '@codemirror/state'
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

  useEffect(() => {
    if (!containerRef.current) return

    const view = new EditorView({
      doc: value,
      parent: containerRef.current,
      extensions: [
        basicSetup,
        ...getCodeEditorLanguageExtensions(filePath),
        EditorState.readOnly.of(readOnly),
        EditorView.editable.of(!readOnly),
        EditorView.lineWrapping,
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChange?.(update.state.doc.toString())
          }
        }),
        EditorView.theme({
          '&': {
            height: '100%',
            backgroundColor: '#0a0a0a',
            color: '#d4d4d4',
            fontSize: '12px',
          },
          '.cm-scroller': {
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
          },
          '.cm-content': {
            caretColor: '#e5e5e5',
          },
          '.cm-gutters': {
            backgroundColor: '#0a0a0a',
            color: '#737373',
            borderRight: '1px solid #262626',
          },
          '.cm-activeLine': {
            backgroundColor: '#171717',
          },
          '.cm-activeLineGutter': {
            backgroundColor: '#171717',
          },
          '&.cm-focused': {
            outline: 'none',
          },
        }, { dark: true }),
      ],
    })

    return () => view.destroy()
  }, [filePath, onChange, readOnly, value])

  return <div ref={containerRef} className="h-full min-h-0" />
}
