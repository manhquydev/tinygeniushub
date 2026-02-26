# Blog Upgrades — Codex Execution Guide

## Thứ tự nên làm (theo độ phức tạp tăng dần)

| Thứ tự | File | Mô tả | Phụ thuộc |
|---|---|---|---|
| 1 | [UPGRADE-1-monaco-editor.md](./UPGRADE-1-monaco-editor.md) | Rich Markdown Editor (Monaco, split-view, live preview) | Độc lập |
| 2 | [UPGRADE-2-image-upload-r2.md](./UPGRADE-2-image-upload-r2.md) | Image Upload lên R2 từ admin editor | Nên sau UPGRADE-1 |
| 3 | [UPGRADE-4-advanced-features.md](./UPGRADE-4-advanced-features.md) | Reading progress, search highlight, auto related posts, analytics | Độc lập |
| 4 | [UPGRADE-3-comment-system.md](./UPGRADE-3-comment-system.md) | Hệ thống bình luận đầy đủ với moderation | Phức tạp nhất, làm sau |

## Prompt giao cho Codex (mỗi upgrade riêng lẻ)

```
Read and implement exactly what is described in:
plans/blog-system/UPGRADE-X-xxx.md

After completing, run:
  pnpm type-check
Fix all errors before reporting done.
```

## Tóm tắt từng Upgrade

### UPGRADE-1 — Monaco Editor
- Thay textarea → Monaco Editor với split-view (Editor | Split | Preview)
- Live preview sau 600ms (POST `/api/blog/preview-markdown`)
- Toolbar: H2, H3, Bold, Italic, Code, Link, Blockquote, List

### UPGRADE-2 — Image Upload to R2
- Tái dùng signed URL pattern từ `cloudflare-r2-provider.ts`
- Admin-only route: POST `/api/blog/images/upload-url`
- Button "Them anh" → upload → tự chèn `![alt](url)` vào editor cursor
- Cover image field cũng có upload button
- Max 10MB, whitelist: JPEG/PNG/GIF/WebP/SVG

### UPGRADE-3 — Comment System  
- New Prisma models: `BlogComment` (threaded, max 1 cấp deep)
- Flow: submit → email verify → APPROVED
- Admin moderation page: `/admin/blog/comments`
- Components: CommentForm, CommentCard (with reply), CommentsSection

### UPGRADE-4 — Advanced Features
- **Reading Progress Bar**: gradient bar ở top of page
- **Search Highlight**: từ khóa được highlight vàng trong kết quả
- **Auto Related Posts**: scoring engine dựa trên shared tags + category
- **Analytics Dashboard**: `/admin/blog/analytics` với KPI cards + CSS bar charts (7d/30d/90d)
