# Research: Video Upload & Interactive Activities
Date: 2026-02-26 | Researcher: researcher-01

---

## Topic 1: Bunny Stream TUS Direct Upload

### How It Works
1. Backend creates a video object via Bunny Stream API → receives `videoId`
2. Backend generates SHA256 signature (never expose API key to browser)
3. Frontend uploads via `tus-js-client` with signed headers

### Endpoint & Headers
```
POST/PATCH https://video.bunnycdn.com/tusupload
```
Required headers:
- `AuthorizationSignature` — SHA256(`libraryId + apiKey + expirationTime + videoId`)
- `AuthorizationExpire` — Unix timestamp (e.g., now + 3600s)
- `VideoId` — video ID from Bunny
- `LibraryId` — your library ID

### Signature Generation (server-side only)
```js
const sig = crypto.createHash('sha256')
  .update(libraryId + apiKey + expirationTime + videoId)
  .digest('hex');
```

### tus-js-client Usage
```js
import * as tus from 'tus-js-client';

const upload = new tus.Upload(file, {
  endpoint: "https://video.bunnycdn.com/tusupload",
  retryDelays: [0, 3000, 5000, 10000, 20000, 60000],
  headers: { AuthorizationSignature: sig, AuthorizationExpire: exp, VideoId, LibraryId },
  metadata: { filetype: file.type, title: file.name },
  onProgress: (uploaded, total) => setProgress(uploaded / total * 100),
  onSuccess: () => console.log("done"),
});

// Resume interrupted uploads
const prev = await upload.findPreviousUploads();
if (prev.length) upload.resumeFromPreviousUpload(prev[0]);
upload.start();
```

### CORS
- Bunny Stream's CDN handles CORS server-side — no client config needed
- Required methods: `OPTIONS, POST, PATCH, HEAD`
- Browser auto-handles preflight; if CORS errors appear, check Bunny dashboard settings
- API key stays server-side; frontend only receives `{ videoId, libraryId, expirationTime, signature }`

### Refs
- [Bunny Stream TUS Docs](https://docs.bunny.net/stream/tus-resumable-uploads)
- [tus-js-client npm](https://www.npmjs.com/package/tus-js-client)

---

## Topic 2: Drag & Drop for Kids (Tablet/Touch)

### Library Comparison

| Library | Touch | Maintained | Complexity | Verdict |
|---|---|---|---|---|
| `@dnd-kit/core` | Native, first-class | Yes (2025) | Medium | **Recommended** |
| `react-beautiful-dnd` | Limited, buggy | No (deprecated) | Low | Avoid |
| Plain HTML5 dnd API | No touch support | N/A | High | Avoid for tablets |

### Why dnd-kit for Kids/Tablets
- Built from ground up for touch, mouse, keyboard — sensor abstraction handles all 3
- Scroll-lock during drag (critical on tablets — prevents accidental page scroll)
- Custom drag overlay for visual feedback
- No scroll conflicts that plague `react-beautiful-dnd`
- Smaller bundle, better perf on mobile hardware

### MVP Setup
```bash
npm install @dnd-kit/core @dnd-kit/sortable
```
```jsx
import { DndContext, useDraggable, useDroppable } from '@dnd-kit/core';
// TouchSensor + PointerSensor covers both tablet and desktop
import { useSensor, useSensors, PointerSensor, TouchSensor } from '@dnd-kit/core';

const sensors = useSensors(
  useSensor(PointerSensor),
  useSensor(TouchSensor)
);
<DndContext sensors={sensors} onDragEnd={handleDrop}>...</DndContext>
```

### Refs
- [dnd-kit Docs](https://dndkit.com/)
- [dnd-kit vs rbd discussion](https://github.com/clauderic/dnd-kit/discussions/481)

---

## Topic 3: Canvas Drawing/Coloring for Kids

### Use Case: Coloring pre-drawn shapes (not free draw)

### Library Comparison

| Library | Touch | React Integration | Coloring Shapes | Complexity |
|---|---|---|---|---|
| `react-canvas-draw` | Built-in | Native | Free draw + bg image | Very easy |
| `fabric.js` | Robust | Manual (useRef) | SVG fill + shapes | Moderate |
| Plain canvas API | Manual | Manual | Full control | High |
| `react-konva` | Built-in | Native | Vector shapes | Medium |

### Recommendation for MVP (Coloring pre-drawn shapes)
**Use `react-konva`** — best balance for shape-based coloring:
- Konva shapes (Circle, Rect, Path) support `fill` color change on click/tap
- Native touch events via `onTap`/`onClick`
- No free-draw complexity; just swap `fill` state on shape click
- Clean React component model

```bash
npm install react-konva konva
```
```jsx
import { Stage, Layer, Path } from 'react-konva';

function ColorShape({ d, color, onColorChange }) {
  return (
    <Path
      data={d}
      fill={color}
      stroke="#333"
      strokeWidth={2}
      onClick={() => onColorChange(selectedColor)}
      onTap={() => onColorChange(selectedColor)}
    />
  );
}
```

**Fallback:** `react-canvas-draw` with `imgSrc` overlay is simpler but limited to bitmap flood-fill which needs extra lib.

### Key CSS for touch
```css
canvas { touch-action: none; }
```

### Refs
- [react-konva docs](https://konvajs.org/docs/react/)
- [Konva Mobile Events](https://konvajs.org/docs/events/Mobile_Events.html)
- [fabric.js](https://fabricjs.com/)

---

## Summary Recommendations

| Feature | Pick |
|---|---|
| Video upload (resumable) | `tus-js-client` + Bunny Stream TUS endpoint |
| Drag & drop (tablet) | `@dnd-kit/core` with PointerSensor + TouchSensor |
| Shape coloring (kids) | `react-konva` — click-to-color SVG/vector shapes |

---

## Unresolved Questions
1. Does the project already have a Bunny Stream library ID configured? Need to confirm env vars.
2. For coloring: are pre-drawn shapes SVG paths (vector) or raster PNG? Determines konva vs flood-fill approach.
3. dnd-kit: what specific drag activity types are needed (sort lists, drop zones, match pairs)?
