'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { MouseEvent as ReactMouseEvent, ReactElement } from 'react'
import { cx } from '../utils'
import styles from './TextEditor.module.css'

export type TextEditorVariant = 'outline' | 'filled' | 'borderless'

export type EditorTool =
  | 'bold'
  | 'italic'
  | 'underline'
  | 'strikeThrough'
  | 'heading'
  | 'quote'
  | 'bulletList'
  | 'numberedList'
  | 'link'
  | 'clearFormatting'

const TOOL_COMMANDS: Record<Exclude<EditorTool, 'heading' | 'quote' | 'link'>, string> = {
  bold: 'bold',
  italic: 'italic',
  underline: 'underline',
  strikeThrough: 'strikeThrough',
  bulletList: 'insertUnorderedList',
  numberedList: 'insertOrderedList',
  clearFormatting: 'removeFormat',
}

export const DEFAULT_TOOLBAR: EditorTool[] = [
  'bold',
  'italic',
  'underline',
  'strikeThrough',
  'heading',
  'quote',
  'bulletList',
  'numberedList',
  'link',
  'clearFormatting',
]

export interface TextEditorProps {
  value?: string
  defaultValue?: string
  onChange?: (html: string) => void
  placeholder?: string
  variant?: TextEditorVariant
  toolbar?: EditorTool[] | false
  minHeight?: number
  disabled?: boolean
  readOnly?: boolean
  className?: string
}

interface ToolButtonDef {
  id: EditorTool
  label: string
  icon: ReactElement
}

function Icon({ path }: { path: string }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d={path} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const ICONS: Record<EditorTool, string> = {
  bold: 'M7 5h6a3.5 3.5 0 0 1 0 7H7V5zm0 7h7a3.5 3.5 0 0 1 0 7H7v-7z',
  italic: 'M10 4h8m-12 16h8m.5-16l-5 16',
  underline: 'M7 4v6a5 5 0 0 0 10 0V4M5 20h14',
  strikeThrough: 'M4 12h16M8 6.5C8 5 9.8 4 12 4s4 1 4 2.5S14.2 10 12 10m-.5 4c-2.5 0-5.5 1-5.5 3s3 3 6 3 5.5-1 5.5-3',
  heading: 'M6 4v16M18 4v16M6 12h12',
  quote: 'M7 7h4v6H7c0 2 1 3 3 3v2c-3.5 0-6-2-6-6V7h3zm9 0h4v6h-4c0 2 1 3 3 3v2c-3.5 0-6-2-6-6V7h3z',
  bulletList: 'M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01',
  numberedList: 'M10 6h10M10 12h10M10 18h10M4 5l1.5-1v5M4 15h2l-2 3h2',
  link: 'M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7',
  clearFormatting: 'M4 7h10M9 7v10m5 3l4-8 4 8m-6.5-2h5',
}

export function TextEditor({
  value,
  defaultValue = '',
  onChange,
  placeholder = 'Start typing…',
  variant = 'outline',
  toolbar = DEFAULT_TOOLBAR,
  minHeight = 180,
  disabled = false,
  readOnly = false,
  className,
}: TextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const [activeTools, setActiveTools] = useState<Set<EditorTool>>(new Set())
  const [empty, setEmpty] = useState(defaultValue.replace(/<[^>]*>/g, '').trim() === '')

  const emitChange = useCallback(() => {
    const el = editorRef.current
    if (!el) return
    setEmpty((el.textContent ?? '').trim() === '' && !el.querySelector('img'))
    onChange?.(el.innerHTML)
  }, [onChange])

  useEffect(() => {
    const el = editorRef.current
    if (!el || document.activeElement === el) return
    if (value !== undefined && el.innerHTML !== value) {
      el.innerHTML = value
      setEmpty(value.replace(/<[^>]*>/g, '').trim() === '')
    }
  }, [value])

  useEffect(() => {
    const el = editorRef.current
    if (!el || el.innerHTML !== '') return
    const initial = value ?? defaultValue
    if (initial) {
      el.innerHTML = initial
      setEmpty(initial.replace(/<[^>]*>/g, '').trim() === '')
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [])

  const refreshActiveTools = useCallback(() => {
    const el = editorRef.current
    if (!el || document.activeElement !== el) return
    const next = new Set<EditorTool>()
    try {
      for (const tool of ['bold', 'italic', 'underline', 'strikeThrough'] as const) {
        if (document.queryCommandState(TOOL_COMMANDS[tool])) next.add(tool)
      }
      if (document.queryCommandState('insertUnorderedList')) next.add('bulletList')
      if (document.queryCommandState('insertOrderedList')) next.add('numberedList')
      const block = String(document.queryCommandValue('formatBlock') ?? '').toLowerCase()
      if (block === 'h2' || block === 'h3') next.add('heading')
      if (block === 'blockquote') next.add('quote')
    } catch {
      /* query commands unsupported */
    }
    setActiveTools(next)
  }, [])

  useEffect(() => {
    document.addEventListener('selectionchange', refreshActiveTools)
    return () => document.removeEventListener('selectionchange', refreshActiveTools)
  }, [refreshActiveTools])

  const exec = useCallback(
    (command: string, commandValue?: string) => {
      document.execCommand(command, false, commandValue)
      refreshActiveTools()
      emitChange()
    },
    [emitChange, refreshActiveTools],
  )

  const runTool = useCallback(
    (tool: EditorTool) => {
      switch (tool) {
        case 'heading': {
          const block = String(document.queryCommandValue('formatBlock') ?? '').toLowerCase()
          exec('formatBlock', block === 'h2' ? 'p' : 'h2')
          break
        }
        case 'quote':
          exec('formatBlock', 'blockquote')
          break
        case 'link': {
          const selection = window.getSelection()
          if (!selection || selection.isCollapsed) break
          const url = window.prompt('Enter a URL', 'https://')
          if (url) exec('createLink', url)
          break
        }
        default:
          exec(TOOL_COMMANDS[tool])
      }
    },
    [exec],
  )

  const onToolMouseDown = (event: ReactMouseEvent<HTMLButtonElement>, tool: EditorTool) => {
    event.preventDefault()
    runTool(tool)
  }

  const tools = toolbar === false ? [] : toolbar

  return (
    <div
      className={cx(
        styles.editor,
        styles[variant],
        disabled && styles.disabled,
        empty && styles.empty,
        className,
      )}
      data-placeholder={placeholder}
    >
      {tools.length > 0 && (
        <div className={styles.toolbar} role="toolbar" aria-label="Text formatting" aria-controls="mui-text-editor-area">
          {tools.map((tool) => (
            <button
              key={tool}
              type="button"
              className={cx(styles.tool, activeTools.has(tool) && styles.toolActive)}
              aria-label={tool}
              aria-pressed={activeTools.has(tool)}
              disabled={disabled}
              onMouseDown={(event) => onToolMouseDown(event, tool)}
            >
              <Icon path={ICONS[tool]} />
            </button>
          ))}
        </div>
      )}
      <div
        ref={editorRef}
        id="mui-text-editor-area"
        role="textbox"
        aria-multiline="true"
        aria-disabled={disabled || undefined}
        className={styles.area}
        style={{ minHeight }}
        contentEditable={!disabled && !readOnly}
        suppressContentEditableWarning
        onInput={emitChange}
        onBlur={emitChange}
        onKeyUp={refreshActiveTools}
        onMouseUp={refreshActiveTools}
      />
    </div>
  )
}
