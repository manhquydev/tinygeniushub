# CODEX UPGRADE: Blog — Image Upload to Cloudflare R2

## Context
When writing blog posts in admin, authors need to upload images directly into the article.
The project already has a working R2 signed-URL upload pattern in:
- `src/modules/platform/storage/providers/cloudflare-r2-provider.ts` — creates signed PUT URLs
- `src/components/evidence-upload-panel.tsx` — reference implementation for 2-step upload flow

We will add an Image Upload button to the blog editor that:
1. Requests a signed upload URL from `/api/blog/images/upload-url`
2. PUTs the file directly to R2
3. Inserts the markdown image tag `![filename](url)` at cursor position

## STEP 1 — Study These Files First (mandatory)
- `src/modules/platform/storage/providers/cloudflare-r2-provider.ts` — `createSignedUploadUrl()`
- `src/modules/platform/storage/providers/types.ts` — `SignedUploadRequest`, `SignedUploadResponse`
- `src/modules/platform/storage/` — how storage adapter is instantiated/exported
- `src/components/evidence-upload-panel.tsx` — copy the 2-step upload pattern exactly

## STEP 2 — Create Upload URL API Route

Create: `src/app/api/blog/images/upload-url/route.ts`

This is an ADMIN-only route. Apply the same admin auth check as existing admin routes.

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/admin-auth'  // use actual admin auth function
import { createId } from '@paralleldrive/cuid2'      // or cuid() — check project usage
import { storageAdapter } from '@/modules/platform/storage'  // find actual export path

export async function POST(request: NextRequest) {
  // Admin auth check (copy pattern from existing /api/admin/ routes)
  const session = await getAdminSession(request)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { contentType, filename, sizeBytes } = await request.json()

  // Validate
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
  if (!ALLOWED_TYPES.includes(contentType)) {
    return NextResponse.json({ error: 'Invalid file type. Only JPEG/PNG/GIF/WebP/SVG allowed.' }, { status: 400 })
  }
  if (sizeBytes > 10 * 1024 * 1024) {
    return NextResponse.json({ error: 'File too large. Maximum 10MB.' }, { status: 400 })
  }

  // Sanitize filename
  const ext = contentType.split('/')[1].replace('jpeg', 'jpg')
  const objectPath = `blog/images/${createId()}.${ext}`

  const uploadResponse = await storageAdapter.createSignedUploadUrl({
    objectPath,
    contentType,
    expiresInSeconds: 300,  // 5 minutes
  })

  const publicUrl = `${process.env.R2_PUBLIC_URL ?? ''}/${objectPath}`

  return NextResponse.json({
    ok: true,
    data: {
      upload: {
        uploadUrl: uploadResponse.uploadUrl,
        method: uploadResponse.method,
        requiredHeaders: uploadResponse.requiredHeaders,
        expiresAt: uploadResponse.expiresAt,
      },
      image: {
        objectPath,
        publicUrl,
      },
    },
  })
}
```

**Add to `.env.example` or `.env.local`:**
```
R2_PUBLIC_URL=https://pub-XXXX.r2.dev  # your R2 public bucket URL
```

## STEP 3 — Create `src/components/blog/blog-image-upload-button.tsx`

```typescript
'use client'
import { useRef } from 'react'
import { ImageIcon } from 'lucide-react'

interface Props {
  onInsert: (markdownTag: string, altText: string) => void
}

export function BlogImageUploadButton({ onInsert }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    if (!file) return

    // Step 1: Get signed URL
    const session = await fetch('/api/blog/images/upload-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contentType: file.type,
        filename: file.name,
        sizeBytes: file.size,
      }),
    })

    if (!session.ok) {
      alert('Khong lay duoc upload URL. Kiem tra lai ket noi.')
      return
    }

    const { data } = await session.json()

    // Step 2: PUT file directly to R2
    const uploadHeaders = new Headers(data.upload.requiredHeaders ?? {})
    uploadHeaders.set('content-type', file.type)

    const uploadRes = await fetch(data.upload.uploadUrl, {
      method: data.upload.method,
      headers: uploadHeaders,
      body: file,
    })

    if (!uploadRes.ok) {
      alert('Upload that bai. Thu lai sau.')
      return
    }

    // Step 3: Insert markdown at cursor
    const altText = file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ')
    const markdownTag = `![${altText}](${data.image.publicUrl})`
    onInsert(markdownTag, altText)
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
          e.target.value = ''  // reset so same file can be re-selected
        }}
      />
      <button
        type="button"
        title="Upload anh"
        onClick={() => fileInputRef.current?.click()}
        style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
      >
        <ImageIcon size={14} />
        <span style={{ fontSize: 13 }}>Them anh</span>
      </button>
    </>
  )
}
```

## STEP 4 — Integrate Upload Button into Editor Toolbar

Open `src/components/blog/blog-markdown-editor.tsx` (created in UPGRADE-1).
Add the `BlogImageUploadButton` to the toolbar row.

The `onInsert` callback should insert at Monaco cursor position:
```typescript
function handleInsertImage(markdownTag: string) {
  const editor = editorRef.current
  if (!editor) return
  const position = editor.getPosition()
  if (!position) return
  editor.executeEdits('image-upload', [{
    range: new monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column),
    text: '\n' + markdownTag + '\n',
  }])
  editor.focus()
}
```

If Monaco editor ref is not yet set up, add it:
```typescript
const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)
// In Editor component:
onMount={(editor) => { editorRef.current = editor }}
```

## STEP 5 — Cover Image Upload in Post Form

Open `src/components/admin-blog-post-form.tsx`.
The `coverImageUrl` field is currently a plain text input. Enhance it:

```typescript
// Add next to the coverImageUrl text input:
<div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
  <input
    type="text"
    placeholder="URL anh bia (tu nhap hoac upload)"
    value={formData.coverImageUrl}
    onChange={e => setFormData(prev => ({ ...prev, coverImageUrl: e.target.value }))}
    style={{ flex: 1 }}
  />
  <BlogImageUploadButton
    onInsert={(_, url) => {
      // Extract just the URL from markdown ![alt](url)
      const match = url.match(/\((.+)\)/)
      if (match) setFormData(prev => ({ ...prev, coverImageUrl: match[1] }))
    }}
  />
</div>
```

Wait — for cover image, `onInsert` receives `(markdownTag, altText)`. Adjust: expose a separate prop `onUpload(publicUrl: string)` to the button for non-markdown use cases.

Modify `BlogImageUploadButton` to accept optional:
```typescript
interface Props {
  onInsert?: (markdownTag: string) => void  // for content editor
  onUpload?: (publicUrl: string) => void    // for cover image field
}
// Call the appropriate callback after upload
```

## STEP 6 — Show Upload Progress

Enhance `BlogImageUploadButton` to show upload state:
- Button disabled during upload
- Show "Dang tai..." text with spinner (simple: use `animate-spin` class on a div or just the text)
- Show "✓" for 2 seconds on success, or error message on failure

## STEP 7 — Validation

```bash
pnpm type-check
```

Test in browser:
1. Go to `/admin/blog/posts/new`
2. Click "Them anh" button in editor toolbar
3. Select an image file
4. Verify image uploads + `![...](...)` tag appears in editor
5. Verify preview panel shows the rendered image
6. On "Anh bia" field, upload → URL auto-fills
