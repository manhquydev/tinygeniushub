#!/usr/bin/env python3
"""
Abeka Video Content Analysis Script
Phân tích chi tiết cấu trúc dữ liệu video Abeka
"""

import json
from collections import defaultdict, Counter
from pathlib import Path

# Đường dẫn đến dữ liệu
ABEKA_PATH = Path("C:/Users/manhquy/.gemini/antigravity/scratch/abeka_tools/api/abeka")
OUTPUT_PATH = Path("docs/research/abeka-content-mapping-analysis.md")

def load_all_data():
    """Load all.json data"""
    all_json_path = ABEKA_PATH / "all.json"
    with open(all_json_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def load_index_data():
    """Load index.json data"""
    index_path = ABEKA_PATH / "index.json"
    with open(index_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def analyze_structure(data):
    """Phân tích cấu trúc dữ liệu"""
    analysis = {
        'total_pages': len(data['pages']),
        'total_videos': data['meta']['video_count'],
        'providers': defaultdict(lambda: {'lessons': 0, 'videos': 0, 'subjects': set()}),
        'subject_stats': defaultdict(lambda: {'count': 0, 'grades': set()}),
        'lesson_videos': defaultdict(list),
    }
    
    for page in data['pages']:
        provider = page['provider']
        grade = page['grade']
        lesson = page['lesson']
        video_count = page['video_count']
        
        analysis['providers'][provider]['lessons'] += 1
        analysis['providers'][provider]['videos'] += video_count
        
        # Phân tích subjects từ videos
        for video in page['videos']:
            title = video['title']
            # Trích xuất subject từ title (phần trước dấu ":" hoặc số)
            subject = extract_subject(title)
            analysis['providers'][provider]['subjects'].add(subject)
            analysis['subject_stats'][subject]['count'] += 1
            analysis['subject_stats'][subject]['grades'].add(provider)
    
    return analysis

def extract_subject(title):
    """Trích xuất tên môn học từ title video"""
    # Các patterns phổ biến
    if ':' in title:
        return title.split(':')[0].strip()
    
    # Xử lý các trường hợp đặc biệt
    words = title.split()
    if len(words) >= 2:
        # Lấy các từ trước số (nếu có)
        subject_words = []
        for word in words:
            if word.isdigit():
                break
            subject_words.append(word)
        if subject_words:
            return ' '.join(subject_words)
    
    return title

def create_grade_mapping(analysis):
    """Tạo mapping chi tiết cho mỗi grade"""
    grade_order = ['k4', 'k5', 'g1', 'g2', 'g3', 'g4', 'g5', 'g6', 'g7', 'g8', 'g9', 'g10', 'g11', 'g12']
    
    mapping = []
    for grade in grade_order:
        if grade in analysis['providers']:
            info = analysis['providers'][grade]
            mapping.append({
                'grade': grade,
                'lessons': info['lessons'],
                'videos': info['videos'],
                'subjects': sorted(info['subjects']),
                'avg_videos_per_lesson': round(info['videos'] / info['lessons'], 1) if info['lessons'] > 0 else 0
            })
    
    return mapping

def generate_report(data, analysis, mapping):
    """Generate comprehensive markdown report"""
    
    report = """# Abeka Video Content Mapping Analysis

## Executive Summary

**Tổng quan dữ liệu Abeka Video:**

| Metric | Value |
|--------|-------|
| **Tổng số bài học (Lessons)** | {total_pages:,} |
| **Tổng số video** | {total_videos:,} |
| **Số lớp/grade** | {grade_count} |
| **Số môn học khác nhau** | {subject_count} |
| **Trung bình video/bài học** | {avg_videos_per_lesson:.1f} |

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
""".format(
        total_pages=analysis['total_pages'],
        total_videos=analysis['total_videos'],
        grade_count=len(analysis['providers']),
        subject_count=len(analysis['subject_stats']),
        avg_videos_per_lesson=analysis['total_videos'] / analysis['total_pages'] if analysis['total_pages'] > 0 else 0
    )
    
    # Grade full names mapping
    grade_names = {
        'k4': 'Kindergarten 4 (4 tuổi)',
        'k5': 'Kindergarten 5 (5 tuổi)',
        'g1': 'Grade 1 (Lớp 1)',
        'g2': 'Grade 2 (Lớp 2)',
        'g3': 'Grade 3 (Lớp 3)',
        'g4': 'Grade 4 (Lớp 4)',
        'g5': 'Grade 5 (Lớp 5)',
        'g6': 'Grade 6 (Lớp 6)',
        'g7': 'Grade 7 (Lớp 7)',
        'g8': 'Grade 8 (Lớp 8)',
        'g9': 'Grade 9 (Lớp 9)',
        'g10': 'Grade 10 (Lớp 10)',
        'g11': 'Grade 11 (Lớp 11)',
        'g12': 'Grade 12 (Lớp 12)'
    }
    
    # Add grade details
    for m in mapping:
        grade = m['grade']
        full_name = grade_names.get(grade, grade)
        report += f"| {grade.upper()} | {full_name} | {m['lessons']} | {m['videos']:,} | {m['avg_videos_per_lesson']} |\n"
    
    report += """
### 2.2 Phân bố video theo Grade

```
"""
    
    # ASCII chart
    max_videos = max(m['videos'] for m in mapping)
    chart_width = 50
    
    for m in mapping:
        bar_length = int((m['videos'] / max_videos) * chart_width)
        bar = '█' * bar_length
        report += f"{m['grade'].upper():4} │{bar:<{chart_width}}│ {m['videos']:,}\n"
    
    report += f"     └{'─' * chart_width}┘\n"
    report += "```\n\n"
    
    # 3. Phân tích môn học
    report += """## 3. Phân Tích Môn Học

### 3.1 Danh sách tất cả môn học

| Môn học | Tổng số video | Xuất hiện ở các grade | Mức độ phổ biến |
|---------|--------------|----------------------|-----------------|
"""
    
    # Sort subjects by count
    sorted_subjects = sorted(analysis['subject_stats'].items(), key=lambda x: x[1]['count'], reverse=True)
    
    for subject, info in sorted_subjects:
        grades = ', '.join(sorted(info['grades']))
        popularity = '⭐⭐⭐' if info['count'] > 5000 else '⭐⭐' if info['count'] > 1000 else '⭐'
        report += f"| {subject} | {info['count']:,} | {grades} | {popularity} |\n"
    
    # 4. Chi tiết từng grade
    report += """
## 4. Chi Tiết Từng Grade

"""
    
    for m in mapping:
        grade = m['grade']
        full_name = grade_names.get(grade, grade)
        report += f"""### 4.{list(mapping).index(m) + 1} {full_name} ({grade.upper()})

- **Số bài học:** {m['lessons']}
- **Tổng số video:** {m['videos']:,}
- **Trung bình video/bài:** {m['avg_videos_per_lesson']}

**Các môn học:**

"""
        # Group subjects
        core_subjects = [s for s in m['subjects'] if any(x in s.lower() for x in ['phonics', 'math', 'arithmetic', 'bible', 'reading', 'writing', 'science', 'history', 'english', 'literature'])]
        other_subjects = [s for s in m['subjects'] if s not in core_subjects]
        
        if core_subjects:
            report += "- **Môn chính:** " + ", ".join(sorted(core_subjects)) + "\n"
        if other_subjects:
            report += "- **Môn phụ:** " + ", ".join(sorted(other_subjects)) + "\n"
        
        report += "\n"
    
    # 5. Đề xuất nhóm bán hàng
    k4_videos = next((m['videos'] for m in mapping if m['grade'] == 'k4'), 0)
    k5_videos = next((m['videos'] for m in mapping if m['grade'] == 'k5'), 0)
    g1_to_g5_videos = sum(m['videos'] for m in mapping if m['grade'] in ['g1', 'g2', 'g3', 'g4', 'g5'])
    g6_to_g8_videos = sum(m['videos'] for m in mapping if m['grade'] in ['g6', 'g7', 'g8'])
    g9_to_g12_videos = sum(m['videos'] for m in mapping if m['grade'] in ['g9', 'g10', 'g11', 'g12'])
    
    report += """
## 5. Đề Xuất Phân Nhóm Bán Hàng

### 5.1 Phân nhóm theo cấp học

| Nhóm | Mô tả | Grades | Tổng video | Đề xuất giá |
|------|-------|--------|-----------|-------------|
| **Preschool** | Mầm non | K4, K5 | {preschool_videos:,} | $XX - $YY |
| **Elementary** | Tiểu học | G1-G5 | {elementary_videos:,} | $XX - $YY |
| **Middle School** | Trung học cơ sở | G6-G8 | {middle_videos:,} | $XX - $YY |
| **High School** | Trung học phổ thông | G9-G12 | {high_videos:,} | $XX - $YY |
| **Full K-12** | Toàn bộ chương trình | K4-G12 | {total_videos:,} | $XX - $YY |

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
""".format(
        preschool_videos=k4_videos + k5_videos,
        elementary_videos=g1_to_g5_videos,
        middle_videos=g6_to_g8_videos,
        high_videos=g9_to_g12_videos,
        total_videos=analysis['total_videos']
    )
    
    for m in mapping:
        report += f"| {m['grade'].upper()} Complete | {grade_names.get(m['grade'], m['grade'])} | {m['videos']:,} videos | $XX |\n"
    
    # 6. Thống kê chi tiết
    report += """
## 6. Thống Kê Chi Tiết

### 6.1 Phân bố video theo số lượng/bài học

"""
    
    # Count lessons by video count
    video_count_dist = Counter()
    for page in data['pages']:
        video_count_dist[page['video_count']] += 1
    
    report += "| Số video/bài | Số bài học | Tỷ lệ |\n"
    report += "|-------------|-----------|-------|\n"
    
    for vc in sorted(video_count_dist.keys()):
        count = video_count_dist[vc]
        percentage = (count / analysis['total_pages']) * 100
        report += f"| {vc} | {count} | {percentage:.1f}% |\n"
    
    # 7. Appendix
    report += """
## 7. Appendix: Sample Data Structure

### Cấu trúc JSON cho mỗi bài học

```json
{{
  "resource_root": "/abeka",
  "page_url": "https://hoctienganh.xyz/abeka/1",
  "page_key": "g1/001",
  "provider": "g1",
  "course": "lesson-001",
  "grade": "g1",
  "lesson": 1,
  "video_count": 11,
  "videos": [
    {{
      "order": 1,
      "title": "Activities 1",
      "description": "Activities 1 - Lesson: 1 - Teacher: Miss Howe",
      "video_url": "https://fileta.hoctienganh.xyz/abk/2023/01/01AC001F/01AC001F.m3u8",
      "host": "fileta.hoctienganh.xyz",
      "ext": "m3u8"
    }}
  ]
}}
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

Báo cáo này phân tích **{total_videos:,} video** từ **{total_pages:,} bài học** trong chương trình Abeka K-12.

**Các điểm chính:**
- 14 grades từ K4 đến G12
- Trung bình {avg_videos:.1f} video/bài học
- {subject_count} môn học khác nhau
- Phù hợp để chia thành các gói: Preschool, Elementary, Middle School, High School

*Generated: {timestamp}*
""".format(
        total_videos=analysis['total_videos'],
        total_pages=analysis['total_pages'],
        avg_videos=analysis['total_videos'] / analysis['total_pages'] if analysis['total_pages'] > 0 else 0,
        subject_count=len(analysis['subject_stats']),
        timestamp="2026-04-04"
    )
    
    return report

def main():
    print("Đang tải dữ liệu...")
    data = load_all_data()
    index = load_index_data()
    
    print("Đang phân tích cấu trúc...")
    analysis = analyze_structure(data)
    
    print("Đang tạo mapping...")
    mapping = create_grade_mapping(analysis)
    
    print("Đang tạo báo cáo...")
    report = generate_report(data, analysis, mapping)
    
    # Ensure output directory exists
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    
    # Write report
    with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
        f.write(report)
    
    print(f"✅ Báo cáo đã được lưu tại: {OUTPUT_PATH}")
    print(f"\nTóm tắt:")
    print(f"- Tổng số video: {analysis['total_videos']:,}")
    print(f"- Tổng số bài học: {analysis['total_pages']:,}")
    print(f"- Số grade: {len(analysis['providers'])}")
    print(f"- Số môn học: {len(analysis['subject_stats'])}")

if __name__ == "__main__":
    main()
