# Abeka Video Content Mapping Analysis

## Executive Summary

**Tổng quan dữ liệu Abeka Video:**

| Metric | Value |
|--------|-------|
| **Tổng số bài học (Lessons)** | 2,380 |
| **Tổng số video** | 20,195 |
| **Số lớp/grade** | 14 |
| **Số môn học khác nhau** | 206 |
| **Trung bình video/bài học** | 8.5 |

## 1. Cấu Trúc Thư Mục

```
api/abeka/
├── index.json          # Index chính
├── all.json            # Tất cả dữ liệu (20,195 videos)
├── all_raw.json        # Dữ liệu raw
├── providers/          # Provider indexes
│   ├── k4/index.json
│   ├── k5/index.json
│   ├── g1/index.json
│   ├── g2/index.json
│   ├── ...
│   └── g12/index.json
├── 1/                  # Grade 1 lessons
│   ├── 001.json
│   ├── 002.json
│   ├── ...
│   └── 170.json
├── 2/                  # Grade 2 lessons
│   ├── 001.json
│   └── ...
├── ...
└── 14/                 # Grade K5 (mapped as 14)
    ├── 001.json
    └── ...
```

## 2. Phân Tích Theo Grade

### 2.1 Tổng quan các Grade

| Grade | Tên đầy đủ | Số bài học | Số video | Video/bài học (TB) |
|-------|----------|-----------|----------|-------------------|
| K4 | Kindergarten 4 (4 tuổi) | 170 | 1,595 | 9.4 |
| K5 | Kindergarten 5 (5 tuổi) | 170 | 1,710 | 10.1 |
| G1 | Grade 1 (Lớp 1) | 170 | 2,699 | 15.9 |
| G2 | Grade 2 (Lớp 2) | 170 | 2,063 | 12.1 |
| G3 | Grade 3 (Lớp 3) | 170 | 1,564 | 9.2 |
| G4 | Grade 4 (Lớp 4) | 170 | 1,394 | 8.2 |
| G5 | Grade 5 (Lớp 5) | 170 | 1,391 | 8.2 |
| G6 | Grade 6 (Lớp 6) | 170 | 1,394 | 8.2 |
| G7 | Grade 7 (Lớp 7) | 170 | 872 | 5.1 |
| G8 | Grade 8 (Lớp 8) | 170 | 882 | 5.2 |
| G9 | Grade 9 (Lớp 9) | 170 | 891 | 5.2 |
| G10 | Grade 10 (Lớp 10) | 170 | 1,061 | 6.2 |
| G11 | Grade 11 (Lớp 11) | 170 | 1,404 | 8.3 |
| G12 | Grade 12 (Lớp 12) | 170 | 1,275 | 7.5 |

### 2.2 Phân bố video theo Grade

```
K4   │█████████████████████████████                     │ 1,595
K5   │███████████████████████████████                   │ 1,710
G1   │██████████████████████████████████████████████████│ 2,699
G2   │██████████████████████████████████████            │ 2,063
G3   │████████████████████████████                      │ 1,564
G4   │█████████████████████████                         │ 1,394
G5   │█████████████████████████                         │ 1,391
G6   │█████████████████████████                         │ 1,394
G7   │████████████████                                  │ 872
G8   │████████████████                                  │ 882
G9   │████████████████                                  │ 891
G10  │███████████████████                               │ 1,061
G11  │██████████████████████████                        │ 1,404
G12  │███████████████████████                           │ 1,275
     └──────────────────────────────────────────────────┘
```

## 3. Phân Tích Môn Học

### 3.1 Danh sách tất cả môn học

| Môn học | Tổng số video | Xuất hiện ở các grade | Mức độ phổ biến |
|---------|--------------|----------------------|-----------------|
| Bible | 1,360 | g1, g2, g3, g4, g5, g6, g7, g8 | ⭐⭐ |
| English | 1,020 | g10, g11, g12, g7, g8, g9 | ⭐⭐ |
| Spelling | 1,019 | g1, g2, g3, g4, g5, g6 | ⭐⭐ |
| Reading 1 | 996 | g1 | ⭐ |
| History | 849 | g3, g4, g5, g6, g8 | ⭐ |
| Reading 2 | 704 | g2 | ⭐ |
| Writing | 680 | g2, g3, g4, g5 | ⭐ |
| Arithmetic | 680 | g3, g4, g5, g6 | ⭐ |
| Language | 680 | g3, g4, g5, g6 | ⭐ |
| Reading | 680 | g3, g4, g5, g6 | ⭐ |
| K5 Activities | 615 | k5 | ⭐ |
| K4 Activities | 566 | k4 | ⭐ |
| Science/Health | 510 | g3, g4, g5 | ⭐ |
| Activities | 472 | g1, g2, g3, g4, g5, g6 | ⭐ |
| Science | 464 | g6, g7, g8 | ⭐ |
| Arithmetic 1 | 340 | g1 | ⭐ |
| Seatwork 1 | 340 | g1 | ⭐ |
| Writing 1 | 340 | g1 | ⭐ |
| Algebra | 340 | g10, g9 | ⭐ |
| World History | 340 | g10, g7 | ⭐ |
| Spanish | 340 | g11, g12 | ⭐ |
| Arithmetic 2 | 340 | g2 | ⭐ |
| Seatwork | 340 | g2, g3 | ⭐ |
| K4 Writing | 270 | k4 | ⭐ |
| K5 Phonics | 256 | k5 | ⭐ |
| K5 Writing | 233 | k5 | ⭐ |
| K4 Arithmetic | 223 | k4 | ⭐ |
| K4 Phonics | 222 | k4 | ⭐ |
| K5 Reading | 198 | k5 | ⭐ |
| Phonics | 170 | g1 | ⭐ |
| Bible Doctrines | 170 | g10 | ⭐ |
| Biology | 170 | g10 | ⭐ |
| Consumer Mathematics | 170 | g10 | ⭐ |
| Business Mathematics | 170 | g11 | ⭐ |
| Chemistry | 170 | g11 | ⭐ |
| Keyboarding | 170 | g11 | ⭐ |
| Plane Geometry | 170 | g11 | ⭐ |
| U. S. History | 170 | g11 | ⭐ |
| Physics | 170 | g12 | ⭐ |
| Precalculus | 170 | g12 | ⭐ |
| Phonics and Language | 170 | g2 | ⭐ |
| Penmanship | 170 | g6 | ⭐ |
| Intermediate Mathematics | 170 | g7 | ⭐ |
| Pre-Algebra | 170 | g8 | ⭐ |
| Hebrew History | 170 | g9 | ⭐ |
| Physical Science | 170 | g9 | ⭐ |
| K4 Bible | 170 | k4 | ⭐ |
| K5 Bible | 170 | k5 | ⭐ |
| K5 Numbers | 170 | k5 | ⭐ |
| K4 Reading | 144 | k4 | ⭐ |
| Health | 131 | g6, g9 | ⭐ |
| Life Management | 85 | g11 | ⭐ |
| New Testament | 85 | g11 | ⭐ |
| American Government | 85 | g12 | ⭐ |
| Culinary Life Skills | 85 | g12 | ⭐ |
| Document Processing | 85 | g12 | ⭐ |
| Economics | 85 | g12 | ⭐ |
| Old Testament | 85 | g12 | ⭐ |
| Revelation | 85 | g12 | ⭐ |
| Speech | 85 | g12 | ⭐ |
| World Geography | 85 | g9 | ⭐ |
| Elementary Spanish A | 68 | k5 | ⭐ |
| Additional Practice | 36 | g11 | ⭐ |
| Classroom Routines | 5 | g1, g2 | ⭐ |
| Additional Review 1.3 | 2 | g10, g9 | ⭐ |
| Additional Review 6.6 | 2 | g10, g9 | ⭐ |
| Additional Review 1.1 | 1 | g10 | ⭐ |
| Additional Review 1.2 | 1 | g10 | ⭐ |
| Additional Review 1.4 | 1 | g10 | ⭐ |
| Optional Section 1.6 | 1 | g10 | ⭐ |
| Additional Review 1.7 | 1 | g10 | ⭐ |
| Additional Review 1.8 | 1 | g10 | ⭐ |
| Additional Review 2.4 | 1 | g10 | ⭐ |
| Additional Review 2.5 | 1 | g10 | ⭐ |
| Additional Review 2.6 | 1 | g10 | ⭐ |
| Additional Review 3.1 | 1 | g10 | ⭐ |
| Additional Review 3.2 | 1 | g10 | ⭐ |
| Additional Review 4.2 | 1 | g10 | ⭐ |
| Additional Review 4.6-4.7 | 1 | g10 | ⭐ |
| Additional Review 4.8 | 1 | g10 | ⭐ |
| Optional Section 4.9 | 1 | g10 | ⭐ |
| Additional Review 5.3 | 1 | g10 | ⭐ |
| Optional Section 5.4 | 1 | g10 | ⭐ |
| Additional Review 5.7 | 1 | g10 | ⭐ |
| Additional Review 6.2 | 1 | g10 | ⭐ |
| Additional Review 6.3 | 1 | g10 | ⭐ |
| Optional Section 6.7 | 1 | g10 | ⭐ |
| Additional Review 7.4 | 1 | g10 | ⭐ |
| Additional Review 7.5 | 1 | g10 | ⭐ |
| Additional Review 8.4 | 1 | g10 | ⭐ |
| Additional Review 9.2 | 1 | g10 | ⭐ |
| Additional Review 9.3 | 1 | g10 | ⭐ |
| Additional Review 9.4 | 1 | g10 | ⭐ |
| Optional Section 9.7 | 1 | g10 | ⭐ |
| Optional Section 10.3 | 1 | g10 | ⭐ |
| Additional Review 10.6 | 1 | g10 | ⭐ |
| Additional Review 10.7 | 1 | g10 | ⭐ |
| Additional Review 11.3 | 1 | g10 | ⭐ |
| Additional Review 11.4 | 1 | g10 | ⭐ |
| Additional Review 11.5 | 1 | g10 | ⭐ |
| Optional Section 11.6 | 1 | g10 | ⭐ |
| Additional Review 12.3 | 1 | g10 | ⭐ |
| Additional Review 12.4 | 1 | g10 | ⭐ |
| Optional Section 12.5A | 1 | g10 | ⭐ |
| Optional Section 12.5B | 1 | g10 | ⭐ |
| Additional Practice 21a | 1 | g11 | ⭐ |
| Additional Practice 21b | 1 | g11 | ⭐ |
| Additional Review A | 1 | g11 | ⭐ |
| Additional Review B | 1 | g11 | ⭐ |
| Additional Review C | 1 | g11 | ⭐ |
| Additional Review D | 1 | g11 | ⭐ |
| Additional Practice 153a | 1 | g11 | ⭐ |
| Additional Practice 153b | 1 | g11 | ⭐ |
| Fast Facts 1.1 - Estimation | 1 | g7 | ⭐ |
| Fast Facts 1.3a - Numbers Prime to Each Other | 1 | g7 | ⭐ |
| Fast Facts 1.3b - Factor Tree | 1 | g7 | ⭐ |
| Fast Facts 1.4 - Factorial | 1 | g7 | ⭐ |
| Fast Facts 2.2 - Equivalent Fraction Method | 1 | g7 | ⭐ |
| Fast Facts 2.3 - Simple Interest | 1 | g7 | ⭐ |
| Fast Facts 2.5 - Discount vs Coupon | 1 | g7 | ⭐ |
| Fast Facts 3.6 - Visual Sequences | 1 | g7 | ⭐ |
| Fast Facts 5.4 - Subtraction and Complex Figures | 1 | g7 | ⭐ |
| Fast Facts 5.5 - Surface Area of Square Pyramids | 1 | g7 | ⭐ |
| Fast Facts 6.1 - Length in the Bible | 1 | g7 | ⭐ |
| Fast Facts 6.1 - Weight and Money in the Bible | 1 | g7 | ⭐ |
| Fast Facts 6.5 - Converting Square Measures | 1 | g7 | ⭐ |
| Fast Facts 7.2 - Probability of the Complement | 1 | g7 | ⭐ |
| Fast Facts 7.3 - Dependent Events | 1 | g7 | ⭐ |
| Fast Facts 7.4 - Avoiding Biased Questions | 1 | g7 | ⭐ |
| Fast Facts 8.1 - Constructing a Bar Graph | 1 | g7 | ⭐ |
| Fast Facts 8.2 - Constructing a Circle Graph | 1 | g7 | ⭐ |
| Fast Facts 9.2 - Reflections | 1 | g7 | ⭐ |
| Fast Facts 9.3 - Parallel and Perpendicular Lines | 1 | g7 | ⭐ |
| Fast Facts 9.4 - Graphing from Slope Intercept Form | 1 | g7 | ⭐ |
| Fast Facts 9.5 - Nonproportional Relationships | 1 | g7 | ⭐ |
| Level Up 1.9 | 1 | g8 | ⭐ |
| Level Up 2.2 | 1 | g8 | ⭐ |
| Level Up 2.4 | 1 | g8 | ⭐ |
| Level Up 2.5 | 1 | g8 | ⭐ |
| Level Up 2.6 | 1 | g8 | ⭐ |
| Level Up 3.2 | 1 | g8 | ⭐ |
| Level Up 3.5 | 1 | g8 | ⭐ |
| Level Up 3.6 | 1 | g8 | ⭐ |
| Level Up 4.2 | 1 | g8 | ⭐ |
| Level Up 4.3 | 1 | g8 | ⭐ |
| Level Up 4.4 | 1 | g8 | ⭐ |
| Level Up 4.5 | 1 | g8 | ⭐ |
| Level Up 5.1 | 1 | g8 | ⭐ |
| Level Up 5.4 | 1 | g8 | ⭐ |
| Level Up 5.5 | 1 | g8 | ⭐ |
| Level Up 6.3 | 1 | g8 | ⭐ |
| Level Up 6.6 | 1 | g8 | ⭐ |
| Level Up 7.2 | 1 | g8 | ⭐ |
| Level Up 7.4 | 1 | g8 | ⭐ |
| Level Up 7.5 | 1 | g8 | ⭐ |
| Level Up 7.9 | 1 | g8 | ⭐ |
| Level Up 8.4 | 1 | g8 | ⭐ |
| Level Up 9.2 | 1 | g8 | ⭐ |
| Level Up 9.5 | 1 | g8 | ⭐ |
| Level Up 10.1 | 1 | g8 | ⭐ |
| Level Up 10.2 | 1 | g8 | ⭐ |
| Level Up 10.3 | 1 | g8 | ⭐ |
| Level Up 10.5 | 1 | g8 | ⭐ |
| Level Up 11.2 | 1 | g8 | ⭐ |
| Level Up 11.4 | 1 | g8 | ⭐ |
| Level Up 12.1 | 1 | g8 | ⭐ |
| Level Up 12.3 | 1 | g8 | ⭐ |
| Additional Review 1.5 | 1 | g9 | ⭐ |
| Additional Review 2.2 | 1 | g9 | ⭐ |
| Additional Review Ch.1-2 | 1 | g9 | ⭐ |
| Build Up 2.7 | 1 | g9 | ⭐ |
| Additional Review 2.8 | 1 | g9 | ⭐ |
| Additional Review _CH3 | 1 | g9 | ⭐ |
| Tech Connect 3.4 | 1 | g9 | ⭐ |
| Additional Review 3.6 | 1 | g9 | ⭐ |
| Additional Review 3.7 | 1 | g9 | ⭐ |
| Additional Review _CH1-4 | 1 | g9 | ⭐ |
| Additional Review 4.5 | 1 | g9 | ⭐ |
| Additional Review _CH5-6 | 1 | g9 | ⭐ |
| Tech Connect 5.4 | 1 | g9 | ⭐ |
| Additional Review 5.5 | 1 | g9 | ⭐ |
| Additional Review 5.6 | 1 | g9 | ⭐ |
| Tech Connect 5.6 | 1 | g9 | ⭐ |
| Additional Review 6.1 | 1 | g9 | ⭐ |
| Build Up 6.1 | 1 | g9 | ⭐ |
| Additional Review _CH7 | 1 | g9 | ⭐ |
| Build Up 6.4 | 1 | g9 | ⭐ |
| Additional Review _CH1-8 | 1 | g9 | ⭐ |
| Additional Review 7.6 | 1 | g9 | ⭐ |
| Additional Review _CH9-10 | 1 | g9 | ⭐ |
| Additional Review 8.6 | 1 | g9 | ⭐ |
| Build Up 8.6 | 1 | g9 | ⭐ |
| Additional Review _CH11 | 1 | g9 | ⭐ |
| Additional Review 9.1-9.2 | 1 | g9 | ⭐ |
| Additional Review _CH9-12 | 1 | g9 | ⭐ |
| Build Up 10.3 | 1 | g9 | ⭐ |
| Additional Review 10.4 | 1 | g9 | ⭐ |
| Build Up 11.1 | 1 | g9 | ⭐ |
| Additional Review _CH13-14 | 1 | g9 | ⭐ |
| Additional Review 11.1-11.3 | 1 | g9 | ⭐ |
| Build Up 12.1 | 1 | g9 | ⭐ |
| Tech Connect 12.2 | 1 | g9 | ⭐ |
| Additional Review 12.2-12.3 | 1 | g9 | ⭐ |
| Build Up 12.4 | 1 | g9 | ⭐ |
| Additional Review _CH15 | 1 | g9 | ⭐ |
| Additional Review _CH1-16 | 1 | g9 | ⭐ |

## 4. Chi Tiết Từng Grade

### 4.1 Kindergarten 4 (4 tuổi) (K4)

- **Số bài học:** 170
- **Tổng số video:** 1,595
- **Trung bình video/bài:** 9.4

**Các môn học:**

- **Môn chính:** K4 Arithmetic, K4 Bible, K4 Phonics, K4 Reading, K4 Writing
- **Môn phụ:** K4 Activities

### 4.2 Kindergarten 5 (5 tuổi) (K5)

- **Số bài học:** 170
- **Tổng số video:** 1,710
- **Trung bình video/bài:** 10.1

**Các môn học:**

- **Môn chính:** K5 Bible, K5 Phonics, K5 Reading, K5 Writing
- **Môn phụ:** Elementary Spanish A, K5 Activities, K5 Numbers

### 4.3 Grade 1 (Lớp 1) (G1)

- **Số bài học:** 170
- **Tổng số video:** 2,699
- **Trung bình video/bài:** 15.9

**Các môn học:**

- **Môn chính:** Arithmetic 1, Bible, Phonics, Reading 1, Writing 1
- **Môn phụ:** Activities, Classroom Routines, Seatwork 1, Spelling

### 4.4 Grade 2 (Lớp 2) (G2)

- **Số bài học:** 170
- **Tổng số video:** 2,063
- **Trung bình video/bài:** 12.1

**Các môn học:**

- **Môn chính:** Arithmetic 2, Bible, Phonics and Language, Reading 2, Writing
- **Môn phụ:** Activities, Classroom Routines, Seatwork, Spelling

### 4.5 Grade 3 (Lớp 3) (G3)

- **Số bài học:** 170
- **Tổng số video:** 1,564
- **Trung bình video/bài:** 9.2

**Các môn học:**

- **Môn chính:** Arithmetic, Bible, History, Reading, Science/Health, Writing
- **Môn phụ:** Activities, Language, Seatwork, Spelling

### 4.6 Grade 4 (Lớp 4) (G4)

- **Số bài học:** 170
- **Tổng số video:** 1,394
- **Trung bình video/bài:** 8.2

**Các môn học:**

- **Môn chính:** Arithmetic, Bible, History, Reading, Science/Health, Writing
- **Môn phụ:** Activities, Language, Spelling

### 4.7 Grade 5 (Lớp 5) (G5)

- **Số bài học:** 170
- **Tổng số video:** 1,391
- **Trung bình video/bài:** 8.2

**Các môn học:**

- **Môn chính:** Arithmetic, Bible, History, Reading, Science/Health, Writing
- **Môn phụ:** Activities, Language, Spelling

### 4.8 Grade 6 (Lớp 6) (G6)

- **Số bài học:** 170
- **Tổng số video:** 1,394
- **Trung bình video/bài:** 8.2

**Các môn học:**

- **Môn chính:** Arithmetic, Bible, History, Reading, Science
- **Môn phụ:** Activities, Health, Language, Penmanship, Spelling

### 4.9 Grade 7 (Lớp 7) (G7)

- **Số bài học:** 170
- **Tổng số video:** 872
- **Trung bình video/bài:** 5.1

**Các môn học:**

- **Môn chính:** Bible, English, Fast Facts 6.1 - Length in the Bible, Fast Facts 6.1 - Weight and Money in the Bible, Intermediate Mathematics, Science, World History
- **Môn phụ:** Fast Facts 1.1 - Estimation, Fast Facts 1.3a - Numbers Prime to Each Other, Fast Facts 1.3b - Factor Tree, Fast Facts 1.4 - Factorial, Fast Facts 2.2 - Equivalent Fraction Method, Fast Facts 2.3 - Simple Interest, Fast Facts 2.5 - Discount vs Coupon, Fast Facts 3.6 - Visual Sequences, Fast Facts 5.4 - Subtraction and Complex Figures, Fast Facts 5.5 - Surface Area of Square Pyramids, Fast Facts 6.5 - Converting Square Measures, Fast Facts 7.2 - Probability of the Complement, Fast Facts 7.3 - Dependent Events, Fast Facts 7.4 - Avoiding Biased Questions, Fast Facts 8.1 - Constructing a Bar Graph, Fast Facts 8.2 - Constructing a Circle Graph, Fast Facts 9.2 - Reflections, Fast Facts 9.3 - Parallel and Perpendicular Lines, Fast Facts 9.4 - Graphing from Slope Intercept Form, Fast Facts 9.5 - Nonproportional Relationships

### 4.10 Grade 8 (Lớp 8) (G8)

- **Số bài học:** 170
- **Tổng số video:** 882
- **Trung bình video/bài:** 5.2

**Các môn học:**

- **Môn chính:** Bible, English, History, Science
- **Môn phụ:** Level Up 1.9, Level Up 10.1, Level Up 10.2, Level Up 10.3, Level Up 10.5, Level Up 11.2, Level Up 11.4, Level Up 12.1, Level Up 12.3, Level Up 2.2, Level Up 2.4, Level Up 2.5, Level Up 2.6, Level Up 3.2, Level Up 3.5, Level Up 3.6, Level Up 4.2, Level Up 4.3, Level Up 4.4, Level Up 4.5, Level Up 5.1, Level Up 5.4, Level Up 5.5, Level Up 6.3, Level Up 6.6, Level Up 7.2, Level Up 7.4, Level Up 7.5, Level Up 7.9, Level Up 8.4, Level Up 9.2, Level Up 9.5, Pre-Algebra

### 4.11 Grade 9 (Lớp 9) (G9)

- **Số bài học:** 170
- **Tổng số video:** 891
- **Trung bình video/bài:** 5.2

**Các môn học:**

- **Môn chính:** English, Hebrew History, Physical Science
- **Môn phụ:** Additional Review 1.3, Additional Review 1.5, Additional Review 10.4, Additional Review 11.1-11.3, Additional Review 12.2-12.3, Additional Review 2.2, Additional Review 2.8, Additional Review 3.6, Additional Review 3.7, Additional Review 4.5, Additional Review 5.5, Additional Review 5.6, Additional Review 6.1, Additional Review 6.6, Additional Review 7.6, Additional Review 8.6, Additional Review 9.1-9.2, Additional Review Ch.1-2, Additional Review _CH1-16, Additional Review _CH1-4, Additional Review _CH1-8, Additional Review _CH11, Additional Review _CH13-14, Additional Review _CH15, Additional Review _CH3, Additional Review _CH5-6, Additional Review _CH7, Additional Review _CH9-10, Additional Review _CH9-12, Algebra, Build Up 10.3, Build Up 11.1, Build Up 12.1, Build Up 12.4, Build Up 2.7, Build Up 6.1, Build Up 6.4, Build Up 8.6, Health, Tech Connect 12.2, Tech Connect 3.4, Tech Connect 5.4, Tech Connect 5.6, World Geography

### 4.12 Grade 10 (Lớp 10) (G10)

- **Số bài học:** 170
- **Tổng số video:** 1,061
- **Trung bình video/bài:** 6.2

**Các môn học:**

- **Môn chính:** Bible Doctrines, Consumer Mathematics, English, World History
- **Môn phụ:** Additional Review 1.1, Additional Review 1.2, Additional Review 1.3, Additional Review 1.4, Additional Review 1.7, Additional Review 1.8, Additional Review 10.6, Additional Review 10.7, Additional Review 11.3, Additional Review 11.4, Additional Review 11.5, Additional Review 12.3, Additional Review 12.4, Additional Review 2.4, Additional Review 2.5, Additional Review 2.6, Additional Review 3.1, Additional Review 3.2, Additional Review 4.2, Additional Review 4.6-4.7, Additional Review 4.8, Additional Review 5.3, Additional Review 5.7, Additional Review 6.2, Additional Review 6.3, Additional Review 6.6, Additional Review 7.4, Additional Review 7.5, Additional Review 8.4, Additional Review 9.2, Additional Review 9.3, Additional Review 9.4, Algebra, Biology, Optional Section 1.6, Optional Section 10.3, Optional Section 11.6, Optional Section 12.5A, Optional Section 12.5B, Optional Section 4.9, Optional Section 5.4, Optional Section 6.7, Optional Section 9.7

### 4.13 Grade 11 (Lớp 11) (G11)

- **Số bài học:** 170
- **Tổng số video:** 1,404
- **Trung bình video/bài:** 8.3

**Các môn học:**

- **Môn chính:** Business Mathematics, English, U. S. History
- **Môn phụ:** Additional Practice, Additional Practice 153a, Additional Practice 153b, Additional Practice 21a, Additional Practice 21b, Additional Review A, Additional Review B, Additional Review C, Additional Review D, Chemistry, Keyboarding, Life Management, New Testament, Plane Geometry, Spanish

### 4.14 Grade 12 (Lớp 12) (G12)

- **Số bài học:** 170
- **Tổng số video:** 1,275
- **Trung bình video/bài:** 7.5

**Các môn học:**

- **Môn chính:** English
- **Môn phụ:** American Government, Culinary Life Skills, Document Processing, Economics, Old Testament, Physics, Precalculus, Revelation, Spanish, Speech


## 5. Đề Xuất Phân Nhóm Bán Hàng

### 5.1 Phân nhóm theo cấp học

| Nhóm | Mô tả | Grades | Tổng video | Đề xuất giá |
|------|-------|--------|-----------|-------------|
| **Preschool** | Mầm non | K4, K5 | 3,305 | $XX - $YY |
| **Elementary** | Tiểu học | G1-G5 | 9,111 | $XX - $YY |
| **Middle School** | Trung học cơ sở | G6-G8 | 3,148 | $XX - $YY |
| **High School** | Trung học phổ thông | G9-G12 | 4,631 | $XX - $YY |
| **Full K-12** | Toàn bộ chương trình | K4-G12 | 20,195 | $XX - $YY |

### 5.2 Phân nhóm theo môn học chuyên sâu

| Gói | Môn học | Grades | Video ước tính | Giá đề xuất |
|-----|---------|--------|---------------|-------------|
| **Phonics Foundation** | Phonics + Reading + Spelling | K4-G2 | ~X,XXX | $XX |
| **Math Mastery** | Arithmetic/Math tất cả grades | K4-G12 | ~X,XXX | $XX |
| **Bible Studies** | Bible tất cả grades | K4-G12 | ~X,XXX | $XX |
| **Language Arts** | Writing, Literature, English | G3-G12 | ~X,XXX | $XX |
| **STEM Bundle** | Math + Science | G3-G12 | ~X,XXX | $XX |
| **Social Studies** | History, Geography, Economics | G4-G12 | ~X,XXX | $XX |

### 5.3 Gói theo năm học (Annual Packages)

| Gói | Grade | Số video | Giá đề xuất |
|-----|-------|---------|-------------|
| K4 Complete | Kindergarten 4 (4 tuổi) | 1,595 videos | $XX |
| K5 Complete | Kindergarten 5 (5 tuổi) | 1,710 videos | $XX |
| G1 Complete | Grade 1 (Lớp 1) | 2,699 videos | $XX |
| G2 Complete | Grade 2 (Lớp 2) | 2,063 videos | $XX |
| G3 Complete | Grade 3 (Lớp 3) | 1,564 videos | $XX |
| G4 Complete | Grade 4 (Lớp 4) | 1,394 videos | $XX |
| G5 Complete | Grade 5 (Lớp 5) | 1,391 videos | $XX |
| G6 Complete | Grade 6 (Lớp 6) | 1,394 videos | $XX |
| G7 Complete | Grade 7 (Lớp 7) | 872 videos | $XX |
| G8 Complete | Grade 8 (Lớp 8) | 882 videos | $XX |
| G9 Complete | Grade 9 (Lớp 9) | 891 videos | $XX |
| G10 Complete | Grade 10 (Lớp 10) | 1,061 videos | $XX |
| G11 Complete | Grade 11 (Lớp 11) | 1,404 videos | $XX |
| G12 Complete | Grade 12 (Lớp 12) | 1,275 videos | $XX |

## 6. Thống Kê Chi Tiết

### 6.1 Phân bố video theo số lượng/bài học

| Số video/bài | Số bài học | Tỷ lệ |
|-------------|-----------|-------|
| 4 | 156 | 6.6% |
| 5 | 310 | 13.0% |
| 6 | 255 | 10.7% |
| 7 | 129 | 5.4% |
| 8 | 446 | 18.7% |
| 9 | 448 | 18.8% |
| 10 | 123 | 5.2% |
| 11 | 236 | 9.9% |
| 12 | 15 | 0.6% |
| 13 | 16 | 0.7% |
| 14 | 81 | 3.4% |
| 16 | 165 | 6.9% |

## 7. Appendix: Sample Data Structure

### Cấu trúc JSON cho mỗi bài học

```json
{
  "resource_root": "/abeka",
  "page_url": "https://hoctienganh.xyz/abeka/1",
  "page_key": "g1/001",
  "provider": "g1",
  "course": "lesson-001",
  "grade": "g1",
  "lesson": 1,
  "video_count": 11,
  "videos": [
    {
      "order": 1,
      "title": "Activities 1",
      "description": "Activities 1 - Lesson: 1 - Teacher: Miss Howe",
      "video_url": "https://fileta.hoctienganh.xyz/abk/2023/01/01AC001F/01AC001F.m3u8",
      "host": "fileta.hoctienganh.xyz",
      "ext": "m3u8"
    }
  ]
}
```

### Mã môn học trong tên file

| Mã | Môn học | Ví dụ |
|----|---------|-------|
| AC | Activities | 01AC001F |
| AT | Arithmetic | 01AT001F |
| AB | Arithmetic Combination | 01AB001F |
| BI | Bible | 01BI001F |
| PH | Phonics | 01PH001F |
| SP | Spelling | 01SP001F |
| CW | Cursive Writing | 01CW001F |
| MW | Manuscript Writing | 01MW001F |
| SE | Seatwork Explanation (Cursive) | 01SE001F |
| SM | Seatwork Explanation (Manuscript) | 01SM001F |
| EA | Reading AM Elephants | 01EA001F |
| GA | Reading AM Giraffes | 01GA001F |
| MA | Reading AM Monkeys | 01MA001F |
| EP | Reading PM Elephants | 01EP001F |
| GP | Reading PM Giraffes | 01GP001F |
| MP | Reading PM Monkeys | 01MP001F |

---

## Tóm tắt

Báo cáo này phân tích **20,195 video** từ **2,380 bài học** trong chương trình Abeka K-12.

**Các điểm chính:**
- 14 grades từ K4 đến G12
- Trung bình 8.5 video/bài học
- 206 môn học khác nhau
- Phù hợp để chia thành các gói: Preschool, Elementary, Middle School, High School

*Generated: 2026-04-04*
