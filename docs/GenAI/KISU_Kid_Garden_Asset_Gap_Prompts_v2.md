# KISU Kid Garden Asset Gap Prompts v2

## Muc tieu
Tai lieu nay bo sung tai nguyen con thieu de UI kid garden chuyen han sang mo hinh "vuon tuong tac cho be", giam text nhe va giam pattern dashboard nguoi lon.

## Input tham chieu bat buoc
- `docs/GenAI/KISU_Character_Bible.md`
- `docs/GenAI/KISU_Cloud_Garden_Prompts.md`
- `docs/GenAI/KISU_Cloud_Garden_UIUX_Ideas.md`

## Quy tac toan ven prompt
1. Moi tai nguyen file path phai co dung 1 prompt rieng.
2. Moi prompt phai co du 8 truong nghiep vu: style, muc dich UI, bo cuc, goc nhin, nen, do doc mobile, ranh gioi "khong text/khong watermark", output format.
3. Prompt cho Kisu bat buoc giu du 5 nhan dien thuong hieu (Inkwell Eyes, Scholar's Stripe, Cham Jade Ear Mark, Living Tail, Ao Ba Ba co sao vang nguc trai).
4. Prompt asset tuong tac khong duoc nhung chu vao anh.
5. Tat ca asset object/sticker/FX uu tien `pure white background` de tach nen hau ky on dinh.
6. Moi prompt co Kisu phai dung dung cau truc "Prompt 09 style": mo ta hanh dong + nen trang + `MASCOT KISU EXACT DETAILS` day du (khong rut gon).

## Art direction chung
- Tong sang, than thien, toy-like.
- Silhouette ro o kich thuoc nho tren mobile.
- Muc do chi tiet vua du, tranh nhieu texture gay roi.

## Kisu prompt structure (bat buoc cho moi asset co Kisu)

### Kisu Core Block (copy nguyen van vao cuoi prompt)
```text
MASCOT KISU EXACT DETAILS: A cute 3D chibi anthropomorphic fox, upright bipedal, standing on two legs. Head larger than body (1.2:1 proportion). Natural fox ears, short muzzle, dark triangular nose. Micro-fluff body fur: warm amber-gold. Belly and inner ears: warm ivory. Deep ink-blue irises (#1B4F8A). Left ear has a Cham Jade sound-wave marking. Scholar's Stripe: a distinct white fur mark on the forehead, slightly left of center. Huge fluffy fox tail passing naturally through the side slit of the jacket. COSTUME (Vietnamese Ao Ba Ba Tech Edition): Wearing a sleeveless, dark navy-indigo fabric jacket with fine linen weave. Collarless V-neck. All edges trimmed with Cham Jade thread. LEFT CHEST: small gold 5-pointed star. CENTER CHEST: ivory Lotus flower motif. LIGHTING & STYLE: Pixar/Disney 3D animation quality, soft warm studio lighting, highly detailed textures.
```

### Prompt skeleton (Prompt 09 style)
```text
[Hanh dong/chu de rieng cua sticker]
Solid pure white background (#FFFFFF), no ground shadows, no text, no letters, no watermark.
MASCOT KISU EXACT DETAILS: ...
```

## Danh sach tai nguyen + prompt (1-1)

### A01
- Path: `public/images/cloud-garden/ui/sign_wood_change_child.png`
- Muc dich: Bien go doi be.
- Prompt:
```text
3D Pixar-style magical wooden signboard icon for kids app, semantic meaning "change child profile", rounded safe corners, carved child-face icon area, soft pastel amber and mint accents, front isometric view, clean silhouette for 56px mobile tap target readability, pure white background (#FFFFFF), no text, no letters, no watermark.
```

### A02
- Path: `public/images/cloud-garden/ui/sign_wood_continue_learning.png`
- Muc dich: Bien go hoc tiep.
- Prompt:
```text
3D Pixar-style magical wooden signboard icon for kids app, semantic meaning "continue learning", carved sprout-and-book icon, joyful but calm educational tone, rounded edges, front isometric view, high contrast edge lighting for mobile readability, pure white background (#FFFFFF), no text, no letters, no watermark.
```

### A03
- Path: `public/images/cloud-garden/ui/sign_wood_parent_exit.png`
- Muc dich: Bien go ve khu phu huynh.
- Prompt:
```text
3D Pixar-style magical wooden signboard icon for kids app, semantic meaning "go to parent area", carved home-door icon with subtle guardian shield motif, friendly non-threatening design, rounded wood shape, front isometric view, clear silhouette on bright backgrounds, pure white background (#FFFFFF), no text, no letters, no watermark.
```

### A04
- Path: `public/images/cloud-garden/ground/course_plot_locked.png`
- Muc dich: O dat khoa hoc trang thai locked.
- Prompt:
```text
3D stylized magical garden plot for children, locked state, small sleeping bud in center, soft mist around soil, natural lock motif integrated as tiny vine loop (not metallic padlock), toy-like material, front isometric view, pure white background (#FFFFFF), no text, no watermark.
```

### A05
- Path: `public/images/cloud-garden/ground/course_plot_active.png`
- Muc dich: O dat khoa hoc trang thai active.
- Prompt:
```text
3D stylized magical garden plot for children, active state, healthy sprout emerging from rich soil, tiny glowing particles and dew, warm morning light mood, playful rounded shapes, front isometric view, pure white background (#FFFFFF), no text, no watermark.
```

### A06
- Path: `public/images/cloud-garden/ground/course_plot_completed.png`
- Muc dich: O dat khoa hoc trang thai completed.
- Prompt:
```text
3D stylized magical garden plot for children, completed state, fully bloomed flower with gentle celebration sparkles, reward feeling without visual noise, bright and warm palette, front isometric view, pure white background (#FFFFFF), no text, no watermark.
```

### A07
- Path: `public/images/cloud-garden/vfx/vfx_tap_ring_soft.png`
- Muc dich: FX cham dung (ring pulse).
- Prompt:
```text
Mobile game touch feedback VFX sprite, soft circular glowing ring pulse expanding outward, subtle cham-jade and amber tint, designed for 200-300ms UI response, crisp edges for background removal, pure white background (#FFFFFF), no text, no watermark.
```

### A08
- Path: `public/images/cloud-garden/vfx/vfx_tap_star_pop.png`
- Muc dich: FX cham dung (star pop).
- Prompt:
```text
Mobile game touch feedback VFX sprite, tiny star burst pop with 6-10 particles, cheerful kids-education tone, short-lived energetic shape suitable for tap confirmation, crisp edges for background removal, pure white background (#FFFFFF), no text, no watermark.
```

### A09
- Path: `public/kisu-assets/stickers/sticker_point_course_plot.png`
- Muc dich: Kisu chi vao o dat khoa hoc.
- Prompt:
```text
The mascot Kisu is standing and clearly pointing toward a course plot target with the right index finger. Big expressive eyes, friendly guidance smile, and high-contrast outline for mobile UI readability.
Solid pure white background (#FFFFFF), no ground shadows, no text, no letters, no watermark.
MASCOT KISU EXACT DETAILS: A cute 3D chibi anthropomorphic fox, upright bipedal, standing on two legs. Head larger than body (1.2:1 proportion). Natural fox ears, short muzzle, dark triangular nose. Micro-fluff body fur: warm amber-gold. Belly and inner ears: warm ivory. Deep ink-blue irises (#1B4F8A). Left ear has a Cham Jade sound-wave marking. Scholar's Stripe: a distinct white fur mark on the forehead, slightly left of center. Huge fluffy fox tail passing naturally through the side slit of the jacket. COSTUME (Vietnamese Ao Ba Ba Tech Edition): Wearing a sleeveless, dark navy-indigo fabric jacket with fine linen weave. Collarless V-neck. All edges trimmed with Cham Jade thread. LEFT CHEST: small gold 5-pointed star. CENTER CHEST: ivory Lotus flower motif. LIGHTING & STYLE: Pixar/Disney 3D animation quality, soft warm studio lighting, highly detailed textures.
```

### A10
- Path: `public/kisu-assets/stickers/sticker_swipe_up_hint.png`
- Muc dich: Kisu goi y vuot len.
- Prompt:
```text
The mascot Kisu is making a clear swipe-up guidance gesture with one paw and a subtle upward motion trail cue. Expression is encouraging and playful for children, optimized for small mobile size readability.
Solid pure white background (#FFFFFF), no ground shadows, no text, no letters, no watermark.
MASCOT KISU EXACT DETAILS: A cute 3D chibi anthropomorphic fox, upright bipedal, standing on two legs. Head larger than body (1.2:1 proportion). Natural fox ears, short muzzle, dark triangular nose. Micro-fluff body fur: warm amber-gold. Belly and inner ears: warm ivory. Deep ink-blue irises (#1B4F8A). Left ear has a Cham Jade sound-wave marking. Scholar's Stripe: a distinct white fur mark on the forehead, slightly left of center. Huge fluffy fox tail passing naturally through the side slit of the jacket. COSTUME (Vietnamese Ao Ba Ba Tech Edition): Wearing a sleeveless, dark navy-indigo fabric jacket with fine linen weave. Collarless V-neck. All edges trimmed with Cham Jade thread. LEFT CHEST: small gold 5-pointed star. CENTER CHEST: ivory Lotus flower motif. LIGHTING & STYLE: Pixar/Disney 3D animation quality, soft warm studio lighting, highly detailed textures.
```

### A11
- Path: `public/kisu-assets/stickers/sticker_tap_here_smile.png`
- Muc dich: Kisu nhac "tap vao day".
- Prompt:
```text
The mascot Kisu is in a cheerful "tap here" pose with a soft smile and a clear tap gesture toward a foreground interaction point. Thick clean silhouette suitable for UI overlays.
Solid pure white background (#FFFFFF), no ground shadows, no text, no letters, no watermark.
MASCOT KISU EXACT DETAILS: A cute 3D chibi anthropomorphic fox, upright bipedal, standing on two legs. Head larger than body (1.2:1 proportion). Natural fox ears, short muzzle, dark triangular nose. Micro-fluff body fur: warm amber-gold. Belly and inner ears: warm ivory. Deep ink-blue irises (#1B4F8A). Left ear has a Cham Jade sound-wave marking. Scholar's Stripe: a distinct white fur mark on the forehead, slightly left of center. Huge fluffy fox tail passing naturally through the side slit of the jacket. COSTUME (Vietnamese Ao Ba Ba Tech Edition): Wearing a sleeveless, dark navy-indigo fabric jacket with fine linen weave. Collarless V-neck. All edges trimmed with Cham Jade thread. LEFT CHEST: small gold 5-pointed star. CENTER CHEST: ivory Lotus flower motif. LIGHTING & STYLE: Pixar/Disney 3D animation quality, soft warm studio lighting, highly detailed textures.
```

### A12
- Path: `public/images/cloud-garden/ambient/ambient_butterfly_soft.png`
- Muc dich: Lop ambience buom nhe.
- Prompt:
```text
Stylized ambient layer asset for kids garden UI, one to three soft glowing butterflies with gentle motion-friendly pose, low visual noise, pastel but readable colors, designed for parallax overlay, pure white background (#FFFFFF), no text, no watermark.
```

### A13
- Path: `public/images/cloud-garden/ambient/ambient_leaf_float.png`
- Muc dich: Lop ambience la troi nhe.
- Prompt:
```text
Stylized ambient layer asset for kids garden UI, floating magical leaves with subtle depth variation, calm movement impression, toy-like rendering, clear silhouette for bright backgrounds, pure white background (#FFFFFF), no text, no watermark.
```

### A14
- Path: `public/images/cloud-garden/ambient/ambient_cloud_strip_far.png`
- Muc dich: Lop may xa tao chieu sau.
- Prompt:
```text
Stylized distant cloud strip layer for kids garden UI, wide horizontal fluffy cloud band for far background parallax, soft edges and low contrast detail to avoid distraction, seamless-friendly composition, pure white background (#FFFFFF), no text, no watermark.
```

## Kich thuoc output khuyen nghi
- Sign / Course plot / Kisu sticker / Ambient object: `1024x1024` PNG/JPG, nen trang.
- Tap FX: `768x768` PNG/JPG, nen trang.
- Rieng A14 cloud strip: `1920x1080` PNG/JPG, nen trang.
- Sau khi gen: tach nen thanh PNG alpha de import vao app.

## Checklist QA truoc khi import vao app
- Moi path trong danh sach da co prompt tuong ung.
- Khong prompt nao thieu yeu cau "pure white background (#FFFFFF)".
- Khong prompt nao cho phep text/watermark.
- 3 state course plot (locked/active/completed) co silhouette phan biet ro.
- 3 Kisu stickers deu rang buoc dung nhan dien Character Bible.
- 3 Kisu stickers dung cau truc Prompt 09 style (co Core Block day du, khong rut gon).
- Asset doc duoc o kich thuoc nho tren man hinh mobile.

## Uu tien san xuat
1. A04-A06 (course plot states).
2. A01-A03 (wooden signs).
3. A09-A11 (Kisu guidance stickers).
4. A07-A08 (tap feedback FX).
5. A12-A14 (ambient layers).
