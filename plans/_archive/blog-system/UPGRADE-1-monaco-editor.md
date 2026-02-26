# CODEX UPGRADE: Blog — Rich Markdown Editor (Monaco)

## Context
The admin blog post form currently uses a plain `<textarea>` for `contentMarkdown`.
We will replace it with a Monaco Editor instance — the same editor that powers VS Code.
Zero breaking changes. The underlying data (markdown string) stays the same.

## PREREQUISITE
Study these files:
- `src/components/admin-blog-post-form.tsx` — the form that currently has the plain textarea
- `src/app/globals.css` — editor wrapper should match existing dark/light mode

## STEP 1 — Install

```bash
pnpm add @monaco-editor/react
```

## STEP 2 — Create `src/components/blog/blog-markdown-editor.tsx`

```typescript
'use client'

import { useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'

// Monaco is very large — load lazily without SSR
const Editor = dynamic(() => import('@monaco-editor/react').then(m => m.Editor), {
  ssr: false,
  loading: () => (
    <div style={{ height: 450, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1e1e1e', color: '#888', borderRadius: 8 }}>
      Dang tai editor...
    </div>
  ),
})

interface BlogMarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  height?: number
}

export function BlogMarkdownEditor({ value, onChange, height = 500 }: BlogMarkdownEditorProps) {
  return (
    <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
      <Editor
        height={height}
        defaultLanguage="markdown"
        value={value}
        onChange={(val) => onChange(val ?? '')}
        theme="vs-dark"
        options={{
          wordWrap: 'on',
          lineNumbers: 'on',
          minimap: { enabled: false },
          fontSize: 14,
          lineHeight: 22,
          scrollBeyondLastLine: false,
          renderWhitespace: 'none',
          padding: { top: 16, bottom: 16 },
          // Markdown-specific settings
          quickSuggestions: false,
          folding: true,
          foldingHighlight: false,
        }}
      />
    </div>
  )
}
```

## STEP 3 — Create `src/components/blog/blog-markdown-preview.tsx`

Live preview panel showing rendered HTML beside the editor.

```typescript
'use client'
import { useEffect, useState } from 'react'

interface Props { markdown: string }

export function BlogMarkdownPreview({ markdown }: Props) {
  const [html, setHtml] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!markdown.trim()) { setHtml(''); return }
      setLoading(true)
      try {
        const res = await fetch('/api/blog/preview-markdown', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ markdown }),
        })
        const { html } = await res.json()
        setHtml(html)
      } catch { /* ignore */ }
      finally { setLoading(false) }
    }, 600)
    return () => clearTimeout(timer)
  }, [markdown])

  return (
    <div style={{ position: 'relative', minHeight: 200 }}>
      {loading && <div style={{ position: 'absolute', top: 8, right: 8, fontSize: 12, color: '#888' }}>Rendering...</div>}
      <div
        className="prose max-w-none"
        style={{ padding: '1rem', border: '1px solid #e2e8f0', borderRadius: 8, minHeight: 200, background: '#fff' }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  )
}
```

## STEP 4 — Create Preview API Route

Create: `src/app/api/blog/preview-markdown/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { renderMarkdown } from '@/modules/blog/blog-markdown'

export async function POST(request: NextRequest) {
  const { markdown } = await request.json()
  if (typeof markdown !== 'string') return NextResponse.json({ error: 'Invalid' }, { status: 400 })
  // Limit to 50kb to prevent abuse
  if (markdown.length > 50_000) return NextResponse.json({ error: 'Too large' }, { status: 413 })
  const html = await renderMarkdown(markdown)
  return NextResponse.json({ html })
}
```

## STEP 5 — Create Split-pane Editor Wrapper

Create: `src/components/blog/blog-editor-split.tsx`
`'use client'` — two column layout, resizable only via CSS (no drag needed).

```typescript
'use client'
import { useState } from 'react'
import { BlogMarkdownEditor } from './blog-markdown-editor'
import { BlogMarkdownPreview } from './blog-markdown-preview'

interface Props { value: string; onChange: (v: string) => void }

export function BlogEditorSplit({ value, onChange }: Props) {
  const [tab, setTab] = useState<'editor' | 'preview' | 'split'>('split')

  return (
    <div>
      {/* Tab switcher */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
        {(['editor', 'split', 'preview'] as const).map(t => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            style={{
              padding: '4px 12px', borderRadius: 4, fontSize: 13,
              background: tab === t ? '#3b82f6' : '#f1f5f9',
              color: tab === t ? 'white' : '#475569',
              border: 'none', cursor: 'pointer',
            }}
          >
            {t === 'editor' ? 'Editor' : t === 'split' ? 'Split' : 'Preview'}
          </button>
        ))}
      </div>

      {/* Content area */}
      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: tab === 'split' ? '1fr 1fr' : '1fr' }}>
        {tab !== 'preview' && <BlogMarkdownEditor value={value} onChange={onChange} />}
        {tab !== 'editor' && <BlogMarkdownPreview markdown={value} />}
      </div>
    </div>
  )
}
```

## STEP 6 — Integrate into Admin Form

Open `src/components/admin-blog-post-form.tsx`.
Find the `contentMarkdown` textarea. Replace it with:

```typescript
import { BlogEditorSplit } from '@/components/blog/blog-editor-split'

// Replace the textarea:
<BlogEditorSplit
  value={formData.contentMarkdown}
  onChange={(val) => setFormData(prev => ({ ...prev, contentMarkdown: val }))}
/>
```

## STEP 7 — Add Toolbar Above Editor (Optional Enhancement)

Add a simple markdown toolbar above the Monaco editor (insert snippets on click):

```typescript
// In blog-markdown-editor.tsx, add toolbar with:
// [H2] [H3] [Bold] [Italic] [Code] [Link] [Image] [Quote] [List] [---]
// Each button uses editor.executeEdits or editor.trigger('source', 'type', { text: '**' })
// Get editor ref: editorRef.current via useRef + onMount={(editor) => { editorRef.current = editor }}
```

Buttons: H2 (`## `), H3 (`### `), **B** (wrap `**text**`), *I* (wrap `*text*`), `Code` (wrap `` `text` ``), Link (`[text](url)`), Blockquote (`> `), Unordered list (`- `).

## STEP 8 — Validation

```bash
pnpm type-check
```

Navigate to `http://localhost:3000/admin/blog/posts/new` — editor should load with Monaco, split view, toolbar.
Test: write markdown on left, see rendered preview on right within 600ms.
