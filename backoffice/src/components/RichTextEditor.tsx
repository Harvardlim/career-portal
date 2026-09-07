import { useEffect, useRef } from 'react'
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import { ListPlugin } from '@lexical/react/LexicalListPlugin'
import { TablePlugin } from '@lexical/react/LexicalTablePlugin'
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin'
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $generateHtmlFromNodes, $generateNodesFromDOM } from '@lexical/html'
import { HeadingNode, QuoteNode } from '@lexical/rich-text'
import { ELEMENT_TRANSFORMERS, TEXT_FORMAT_TRANSFORMERS } from '@lexical/markdown'

// Only transformers whose nodes are registered below. The full TRANSFORMERS
// list also needs CodeNode (```) and LinkNode ([x](y)), which we don't use.
const MD_TRANSFORMERS = [...ELEMENT_TRANSFORMERS, ...TEXT_FORMAT_TRANSFORMERS]
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  ListItemNode,
  ListNode,
} from '@lexical/list'
import {
  INSERT_TABLE_COMMAND,
  TableCellNode,
  TableNode,
  TableRowNode,
} from '@lexical/table'
import {
  $getRoot,
  $insertNodes,
  FORMAT_TEXT_COMMAND,
  type EditorState,
  type LexicalEditor,
} from 'lexical'

const theme = {
  paragraph: 'mb-1.5 text-left last:mb-0',
  text: {
    bold: 'font-semibold',
    italic: 'italic',
    underline: 'underline',
    strikethrough: 'line-through',
    code: 'rounded bg-white/[0.08] px-1 py-0.5 font-mono text-[12px]',
  },
  heading: {
    h1: 'mb-1.5 text-[16px] font-semibold text-left',
    h2: 'mb-1.5 text-[15px] font-semibold text-left',
    h3: 'mb-1.5 text-[14px] font-semibold text-left',
  },
  list: {
    ul: 'mb-1.5 list-disc pl-5 text-left',
    ol: 'mb-1.5 list-decimal pl-5 text-left',
    listitem: 'mb-0.5',
    nested: { listitem: 'list-none' },
  },
  quote: 'mb-1.5 border-l-2 border-line pl-3 text-left text-muted',
  table: 'my-2 w-full border-collapse text-left text-[13px]',
  tableRow: '',
  tableCell: 'border border-line px-2 py-1 align-top min-w-[64px]',
  tableCellHeader: 'bg-white/[0.05] font-semibold',
}

/** Loads `html` into the empty editor once, on mount. */
function InitialHtmlPlugin({ html }: { html: string }) {
  const [editor] = useLexicalComposerContext()
  useEffect(() => {
    if (!html.trim()) return
    editor.update(() => {
      const root = $getRoot()
      root.clear()
      const dom = new DOMParser().parseFromString(html, 'text/html')
      const nodes = $generateNodesFromDOM(editor, dom)
      root.select()
      $insertNodes(nodes)
    })
    // Run once per editor instance (parent remounts via `key`).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return null
}

function Toolbar() {
  const [editor] = useLexicalComposerContext()
  const btn =
    'grid h-7 min-w-7 place-items-center rounded px-1 text-[13px] text-ink-200 hover:bg-white/[0.07]'
  const stop = (e: React.MouseEvent) => e.preventDefault()

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-line px-2 py-1.5">
      <button type="button" className={btn} onMouseDown={stop} onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold')} aria-label="Bold">
        <span className="font-semibold">B</span>
      </button>
      <button type="button" className={btn} onMouseDown={stop} onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic')} aria-label="Italic">
        <span className="italic">I</span>
      </button>
      <button type="button" className={btn} onMouseDown={stop} onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline')} aria-label="Underline">
        <span className="underline">U</span>
      </button>
      <span className="mx-1 h-4 w-px bg-line" />
      <button type="button" className={btn} onMouseDown={stop} onClick={() => editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)} aria-label="Bulleted list">
        •
      </button>
      <button type="button" className={btn} onMouseDown={stop} onClick={() => editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)} aria-label="Numbered list">
        1.
      </button>
      <span className="mx-1 h-4 w-px bg-line" />
      <button
        type="button"
        className={btn}
        onMouseDown={stop}
        onClick={() =>
          editor.dispatchCommand(INSERT_TABLE_COMMAND, {
            columns: '3',
            rows: '3',
            includeHeaders: true,
          })
        }
        aria-label="Insert table"
        title="Insert 3×3 table"
      >
        ▦
      </button>
    </div>
  )
}

type Props = {
  value: string
  onChange: (html: string) => void
  placeholder?: string
}

export const RichTextEditor = ({ value, onChange, placeholder }: Props) => {
  const onChangeRef = useRef(onChange)
  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  const handleChange = (editorState: EditorState, editor: LexicalEditor) => {
    editorState.read(() => {
      const root = $getRoot()
      const html =
        root.getTextContent().trim() === '' && root.getChildrenSize() <= 1
          ? ''
          : $generateHtmlFromNodes(editor, null)
      onChangeRef.current(html)
    })
  }

  return (
    <div className="overflow-hidden rounded-lg border border-line bg-surface-2 transition focus-within:border-brand-2">
      <LexicalComposer
        initialConfig={{
          namespace: 'job-rte',
          theme,
          nodes: [
            HeadingNode,
            QuoteNode,
            ListNode,
            ListItemNode,
            TableNode,
            TableRowNode,
            TableCellNode,
          ],
          onError: (e) => console.error('Lexical', e),
        }}
      >
        <Toolbar />
        <div className="relative">
          <RichTextPlugin
            contentEditable={
              <ContentEditable className="max-h-[280px] min-h-[110px] overflow-auto px-3 py-2 text-left text-[13px] leading-relaxed text-ink outline-none [&_table]:block [&_table]:overflow-auto" />
            }
            placeholder={
              placeholder ? (
                <div className="pointer-events-none absolute left-3 top-2 text-[13px] text-muted">
                  {placeholder}
                </div>
              ) : null
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
          <HistoryPlugin />
          <ListPlugin />
          <TablePlugin />
          <MarkdownShortcutPlugin transformers={MD_TRANSFORMERS} />
          <OnChangePlugin onChange={handleChange} ignoreSelectionChange />
          <InitialHtmlPlugin html={value} />
        </div>
      </LexicalComposer>
    </div>
  )
}
