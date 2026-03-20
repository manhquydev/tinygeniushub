# ?? � Tu?ng K?t H?p UI/UX Cloud Garden B?ng Three.js

T�i li?u n�y tr�nh b�y c�c � tu?ng s? d?ng t�i nguy�n 2D/3D (du?c sinh ra t? t?p Prompt) k?t h?p v?i **Three.js** d? t?o ra m?t tr?i nghi?m UI/UX s?ng d?ng, t?o c?m gi�c "H?c t?p nhu m?t cu?c th�m hi?m" cho c�c b�, thay v� l� m?t trang tinh th�ng thu?ng.

---

## 1. H�nh Tr�nh Tr?i Nghi?m & K?ch B?n Three.js

### Giai do?n 1: Uom M?m Kh�a H?c (M?t d?t - Ground Level)
Khu vu?n m?t d?t l� noi kh?i d?u, ch?a c�c kh�a h?c b� dang theo h?c.
- **T�i nguy�n s? d?ng**: `bg_ground_garden.jpg`, `course_planter_base.png`, `course_sapling_level0.png`.
- **Three.js Effects (M�i tru?ng & Ho?t ?nh tinh)**:
  - Render h�nh n?n du?i d?ng Plane 3D ? kho?ng c�ch r?t xa d? l�m n?n kh�ng gian m?.
  - S? d?ng **Particle System (Three.js Points)** d? r?i c�c h?t dom d�m (Fireflies) m�u v�ng / ch�m ng?c b�ch bay lo l?ng, l?p lo� mu?t m� quanh c�c ch?u c�y kh�a h?c.
  - D�ng shader (GLSL) t?o m?t g?n s�ng (distortion) r?t m?ng l�n m?m c�y d? gi? l?p l� c�y rung rinh trong gi� nh?.
- **Tuong t�c (Hover/Click UX)**: 
  - Khi b� r� chu?t v�o m?m c�y, m?m c�y s? "h�t th?" (Scale to ra v� nh? l?i th�nh nh?p d?u d?n b?ng Sine Wave).
  - C� m?t v?ng s�ng ch?p nh? (Aura) ph�t ra quanh ch?u c�y, di k�m ti?ng "Bling" trong tr?o v?y g?i b� click.

### Giai do?n 2: C� Click Ph�p Thu?t & H?t Gi?ng B�ng N?
Thay v� chuy?n trang b�nh thu?ng, vi?c ?n v�o n? m?m s? m? ra hi?u ?ng tang r?n sinh l?c.
- **T�i nguy�n s? d?ng**: `vfx_seed_sprout.png`, `beanstalk_trunk_loop.png`.
- **Three.js Effects (Zoom & Chuy?n c?nh Parallax)**:
  - K�ch ho?t Camera trong Three.js b?t d?u **Zoom mu?t m� th?ng v�o t�m** c?a m?m c�y.
  - T?i ti�u di?m, m?m c�y thu l?i v� n? ra th�nh h�ng ng�n Particle (S? d?ng texture `vfx_seed_sprout.png` l�m material cho c�c di?m ph�t s�ng) phun tr�o l�n tr�n.
  - M�n h�nh gi? l?p m?t phuong ti?n dang bay v�t l�n cao (B?ng c�ch tru?t tr?c Y c?a Scene xu?ng du?i c?c nhanh, l�m c�c d�m m�y 2D m? ?o - Foreground Layers lu?t nhanh che khu?t g�c nh�n).

### Giai do?n 3: Cu?c Phi�u Luu D?c Th�n C�y �?u (Vertical Climbing)
M�n h�nh chuy?n sang giao di?n cu?n d?c d? hi?n th? c�c Module b�i h?c.
- **T�i nguy�n s? d?ng**: Th�n c�y d?u l?p l?i (`beanstalk_trunk_loop.png`), v� c�c t�i nguy�n b? sung (L� d? b�i h?c, N? hoa).
- **Three.js Effects (Skybox Gradient & Parallax Scroll)**:
  - Gh�p ch?ng li�n ti?p texture th�n c�y d?u tr�n m?t kh?i tr? 3D (CylinderGeometry) d? t?o c?m gi�c th�n c�y tr�n.
  - M?i khi b� vu?t (Scroll) l�n tr�n d? xem ti?n d?, th�n c�y di chuy?n xu?ng du?i. 
  - **Dynamic Background Coloring**: M�u n?n d?ng sau b?u tr?i s? n?i suy (Lerp) t? d?ng tu? v�o d? ch�nh l?ch cu?n: M?t d?t s�ng s?m ?? T?ng 1: M�y trua ?? T?ng 2: Ho�ng h�n m�u cam ?? T?ng 3: T�m ho�ng h�n ?? T?ng 4: ��m d?y sao. Three.js t? d?ng ph?i m�u b?u tr?i (Color Blending) c?c k? mu?t m�.

### Giai do?n 4: �?t Ph� L?p M�y �?t C?p �? M?i (Level Up Effect)
M?i khi k?t th�c 1 Section b�i gi?ng, c�y d?u vuon d�i ch?c th?ng 1 t?ng m�y.
- **T�i nguy�n s? d?ng**: M�y n?n t?ng (`platform_cloud_fluffy.png`), Hi?u ?ng x� m�y (`vfx_cloud_burst_levelup.png`), Huy hi?u ch�c m?ng (`vfx_tier_unlocked_badge.png`).
- **Three.js Effects (Celebration VFX)**:
  - K�ch ho?t **Camera Shake** g?n nh?, t?o ti?ng u?nh x� m�y c?c ng?u nhung kh�ng lo� m?t b�. Hai l?p m�y che m�n h�nh s? t�ch qua 2 b�n.
  - Ph�o hoa Particle (Confetti) b?n tung lo� l�n cao v� r?t d?n xu?ng (S? d?ng Physics nh? d?ng tr?ng l?c).
  - Huy hi?u (Linh v?t Kisu vuon ng�n tay c�i) bay b?t ra t? gi?a t?ng m�y du?i d?ng Mesh 2.5D c� vi?n Kim Lo?i/Ph�t s�ng (StandardMaterial), l?n nh�o v� xoay 1 v�ng quanh tr?c Y t? quay d? ch�c m?ng b�.

---

## 2. Ph�n T�ch S? Ch?t Ch? & Danh S�ch Prompt B? Sung �? Ho�n Thi?n

Sau khi r� so�t ch�o c�c t�i nguy�n ban d?u t? file `KISU_Cloud_Garden_Prompts.md` v� � tu?ng v?n h�nh giao di?n b�n tr�n, ph�t hi?n ra b? t�i nguy�n hi?n t?i **V?N C�N B? THI?U S�T** d? d?ng n�n m?t quy tr�nh UX th?c s? tho? m�n.

Th�n c�y l?p ch? l� m?t c�i ?ng, ch�ng ta chua c� **G? �?** (Platform) d? d?t c�c b�i h?c. Ch�ng ta cung chua c� h�nh th? d?i di?n cho c�c tr?ng th�i c?a B�i H?c tr�n c�y (B�i chua h?c, d� h?c, b? kho�) v� thi?u m?t tuong t�c v?i Linh V?t Kisu di theo cu?n c?nh.

**=> L?P T?C TI?N H�NH B? SUNG C�C PROMPT SAU V�O T�I LI?U CH�NH:**

1. **L� C�y �?u Kh?ng L? (Gian Bu?c / N?n T?ng B�i H?c)**: ��ng vai tr� l�m dia h?ng m?c ra t? th�n. C�c n�t Level s? r?i l�n c�c l� n�y.
2. **N? Hoa Chua N? / �ang Ng? (B�i H?c Tuong Lai/B? Kho�)**: N?u b� chua ch?m t?i b�i d�, n� ch? l� m?t n? hoa e ?p suong s?m. 
3. **Hoa �� N? R?c R? (B�i H?c Ho�n Th�nh)**: D�ng d? thay th? n? hoa, c� v?ng h�o quang b�o hi?u module n�y ho�n th�nh 100%. M?c d? n? tuong duong di?m tuy?t d?i.
4. **Kisu �i Cu`ng B� (Companion)**: Qu� tr�nh b� k�o chu?t/m�n che s? c� m?t Kisu bay khinh kh� c?u ho?c c?m d� k? b�n d? d?n du?ng. Kisu l� th? ph?n h?i l?i t?c d? scroll chu?t.

> *(H? th?ng AI d� t? d?ng ghi c�c prompt b? sung n�y v�o cu?i file `KISU_Cloud_Garden_Prompts.md` trong Ph?n 4).*

