const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, 
        Header, Footer, AlignmentType, LevelFormat, TableOfContents, 
        HeadingLevel, BorderStyle, WidthType, ShadingType, VerticalAlign,
        PageNumber, PageBreak } = require('docx');
const fs = require('fs');

// Color scheme - professional blues and grays
const COLORS = {
  primary: "1F4E79",      // Dark blue
  secondary: "2E75B6",    // Medium blue  
  accent: "5B9BD5",       // Light blue
  gray: "7F7F7F",         // Gray
  lightGray: "D9D9D9",    // Light gray
  white: "FFFFFF",
  black: "000000",
  tableHeader: "D5E8F0",    // Light blue for table headers
  tableAlt: "F2F2F2"        // Alternate row color
};

// Border style for tables
const tableBorder = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const cellBorders = { top: tableBorder, bottom: tableBorder, left: tableBorder, right: tableBorder };

// Helper function to create table cell
function createCell(text, options = {}) {
  const { bold = false, header = false, width = 3000, colSpan = 1, alignment = AlignmentType.LEFT } = options;
  return new TableCell({
    borders: cellBorders,
    width: { size: width, type: WidthType.DXA },
    columnSpan: colSpan,
    shading: header ? { fill: COLORS.tableHeader, type: ShadingType.CLEAR } : undefined,
    verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({
      alignment: alignment,
      children: [new TextRun({ text: text, bold: bold || header, size: 22, font: "Arial" })]
    })]
  });
}

// Create bullet list items
function createBullet(text, numberingRef) {
  return new Paragraph({
    numbering: { reference: numberingRef, level: 0 },
    spacing: { before: 60, after: 60 },
    children: [new TextRun({ text: text, size: 22, font: "Arial" })]
  });
}

// Create the document
const doc = new Document({
  styles: {
    default: {
      document: {
        run: { font: "Arial", size: 22 } // 11pt default
      }
    },
    paragraphStyles: [
      {
        id: "Title",
        name: "Title",
        basedOn: "Normal",
        run: { size: 56, bold: true, color: COLORS.primary, font: "Arial" },
        paragraph: { spacing: { before: 400, after: 200 }, alignment: AlignmentType.CENTER }
      },
      {
        id: "Heading1",
        name: "Heading 1",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: { size: 36, bold: true, color: COLORS.primary, font: "Arial" },
        paragraph: { spacing: { before: 400, after: 200 }, outlineLevel: 0 }
      },
      {
        id: "Heading2",
        name: "Heading 2",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: { size: 28, bold: true, color: COLORS.secondary, font: "Arial" },
        paragraph: { spacing: { before: 300, after: 150 }, outlineLevel: 1 }
      },
      {
        id: "Heading3",
        name: "Heading 3",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: { size: 24, bold: true, color: COLORS.gray, font: "Arial" },
        paragraph: { spacing: { before: 200, after: 100 }, outlineLevel: 2 }
      }
    ]
  },
  numbering: {
    config: [
      {
        reference: "bullet-default",
        levels: [{
          level: 0,
          format: LevelFormat.BULLET,
          text: "•",
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } }
        }]
      },
      {
        reference: "bullet-section1",
        levels: [{
          level: 0,
          format: LevelFormat.BULLET,
          text: "•",
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } }
        }]
      },
      {
        reference: "bullet-section2",
        levels: [{
          level: 0,
          format: LevelFormat.BULLET,
          text: "•",
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } }
        }]
      },
      {
        reference: "bullet-section3",
        levels: [{
          level: 0,
          format: LevelFormat.BULLET,
          text: "•",
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } }
        }]
      },
      {
        reference: "bullet-section4",
        levels: [{
          level: 0,
          format: LevelFormat.BULLET,
          text: "•",
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } }
        }]
      },
      {
        reference: "bullet-section5",
        levels: [{
          level: 0,
          format: LevelFormat.BULLET,
          text: "•",
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } }
        }]
      },
      {
        reference: "bullet-section6",
        levels: [{
          level: 0,
          format: LevelFormat.BULLET,
          text: "•",
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } }
        }]
      }
    ]
  },
  sections: [
    // ============ COVER PAGE SECTION ============
    {
      properties: {
        page: {
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
        }
      },
      children: [
        // Spacer
        new Paragraph({ spacing: { before: 2000 }, children: [] }),
        
        // Main Title
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 400, after: 200 },
          children: [new TextRun({ 
            text: "ĐỀ XUẤT THIẾT KẾ", 
            bold: true, 
            size: 56, 
            color: COLORS.primary,
            font: "Arial"
          })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 100, after: 400 },
          children: [new TextRun({ 
            text: "HỆ THỐNG HỌC TẬP THÔNG MINH", 
            bold: true, 
            size: 56, 
            color: COLORS.primary,
            font: "Arial"
          })]
        }),
        
        // Subtitle
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 200, after: 600 },
          children: [new TextRun({ 
            text: "Tái cấu trúc nền tảng hoctienganh.xyz", 
            size: 32, 
            color: COLORS.secondary,
            font: "Arial"
          })]
        }),
        
        // Horizontal line
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 400, after: 400 },
          border: {
            bottom: { style: BorderStyle.SINGLE, size: 6, color: COLORS.accent }
          },
          children: []
        }),
        
        // Version info
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 600, after: 100 },
          children: [new TextRun({ 
            text: "Phiên bản: 1.0", 
            size: 24, 
            color: COLORS.gray,
            font: "Arial"
          })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 100, after: 100 },
          children: [new TextRun({ 
            text: "Ngày: 31 tháng 3 năm 2026", 
            size: 24, 
            color: COLORS.gray,
            font: "Arial"
          })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 100, after: 800 },
          children: [new TextRun({ 
            text: "Chuẩn bị bởi: AI Research & Planning Team", 
            size: 24, 
            color: COLORS.gray,
            font: "Arial"
          })]
        }),
        
        // Decorative box
        new Table({
          columnWidths: [6000],
          alignment: AlignmentType.CENTER,
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  borders: {
                    top: { style: BorderStyle.SINGLE, size: 12, color: COLORS.primary },
                    bottom: { style: BorderStyle.SINGLE, size: 12, color: COLORS.primary },
                    left: { style: BorderStyle.SINGLE, size: 12, color: COLORS.primary },
                    right: { style: BorderStyle.SINGLE, size: 12, color: COLORS.primary }
                  },
                  shading: { fill: "F5F5F5", type: ShadingType.CLEAR },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      spacing: { before: 200, after: 100 },
                      children: [new TextRun({ 
                        text: "TÀI LIỆU CHIẾN LƯỢC", 
                        bold: true, 
                        size: 28, 
                        color: COLORS.primary,
                        font: "Arial"
                      })]
                    }),
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      spacing: { before: 100, after: 200 },
                      children: [new TextRun({ 
                        text: "Từ video aggregation đến adaptive learning system", 
                        size: 22, 
                        italics: true,
                        color: COLORS.gray,
                        font: "Arial"
                      })]
                    })
                  ]
                })
              ]
            })
          ]
        }),
        
        // Page break after cover
        new Paragraph({ children: [new PageBreak()] })
      ]
    },
    
    // ============ MAIN CONTENT SECTION ============
    {
      properties: {
        page: {
          margin: { top: 1440, right: 1080, bottom: 1440, left: 1080 }
        }
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [new TextRun({ 
              text: "Đề Xuất Thiết Kế Hệ Thống Học Tập Thông Minh", 
              size: 20, 
              color: COLORS.gray,
              font: "Arial"
            })]
          })]
        })
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: "Trang ", size: 20, font: "Arial" }),
              new TextRun({ children: [PageNumber.CURRENT], size: 20, font: "Arial" }),
              new TextRun({ text: " / ", size: 20, font: "Arial" }),
              new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 20, font: "Arial" })
            ]
          })]
        })
      },
      children: [
        // Table of Contents
        new TableOfContents("Mục Lục", { 
          hyperlink: true, 
          headingStyleRange: "1-3",
          stylesWithLevels: [
            { styleId: "Heading1", level: 0 },
            { styleId: "Heading2", level: 1 },
            { styleId: "Heading3", level: 2 }
          ]
        }),
        
        new Paragraph({ children: [new PageBreak()] }),
        
        // ============ SECTION 1: TỔNG QUAN DỰ ÁN ============
        new Paragraph({ 
          heading: HeadingLevel.HEADING_1, 
          children: [new TextRun("1. TỔNG QUAN DỰ ÁN")] 
        }),
        
        new Paragraph({ 
          heading: HeadingLevel.HEADING_2, 
          children: [new TextRun("1.1. Tầm nhìn và mục tiêu")] 
        }),
        
        new Paragraph({
          spacing: { before: 200, after: 200 },
          children: [new TextRun({ 
            text: "Chuyển đổi hoctienganh.xyz từ một nền tảng tổng hợp video thành hệ thống học tập thông minh, thích ứng (adaptive learning system) có khả năng hướng dẫn 36,360 video giáo dục thành các hành trình học tập cá nhân hóa cho học sinh Việt Nam từ 3-18 tuổi.", 
            size: 22, 
            font: "Arial"
          })]
        }),
        
        new Paragraph({
          spacing: { before: 100, after: 100 },
          shading: { fill: "E8F4FD", type: ShadingType.CLEAR },
          children: [new TextRun({ 
            text: "Giá trị cốt lõi: \"Từ việc xem video thụ động đến học tập chủ động, có cấu trúc với kết quả đo lường được.\"", 
            italics: true,
            size: 24, 
            color: COLORS.secondary,
            font: "Arial"
          })]
        }),
        
        new Paragraph({ 
          heading: HeadingLevel.HEADING_2, 
          children: [new TextRun("1.2. Tình trạng hiện tại")] 
        }),
        
        new Paragraph({
          spacing: { before: 200, after: 200 },
          children: [new TextRun({ 
            text: "Hiện tại, hệ thống đang lưu trữ 36,360 video giáo dục từ 6 nguồn nội dung khác nhau, được tổ chức theo cơ chế thư viện video với phân loại cơ bản.", 
            size: 22, 
            font: "Arial"
          })]
        }),
        
        // Current state table
        new Table({
          columnWidths: [3500, 5860],
          rows: [
            new TableRow({
              tableHeader: true,
              children: [
                createCell("Chỉ số", { header: true, width: 3500 }),
                createCell("Giá trị", { header: true, width: 5860 })
              ]
            }),
            new TableRow({ children: [createCell("Tổng số video", { width: 3500 }), createCell("36,360", { width: 5860 })] }),
            new TableRow({ children: [createCell("Nguồn nội dung", { width: 3500 }), createCell("6 nguồn (Abeka, Littlefox EN, Littlefox CN, PlayTT, PlayGG, Phim)", { width: 5860 })] }),
            new TableRow({ children: [createCell("Bộ sưu tập", { width: 3500 }), createCell("2,659", { width: 5860 })] }),
            new TableRow({ children: [createCell("Phạm vi lớp", { width: 3500 }), createCell("K4-G12 (14 lớp)", { width: 5860 })] }),
            new TableRow({ children: [createCell("Ngôn ngữ", { width: 3500 }), createCell("Tiếng Anh, Tiếng Trung", { width: 5860 })] }),
            new TableRow({ children: [createCell("Mô hình hiện tại", { width: 3500 }), createCell("Thư viện video với phân loại cơ bản", { width: 5860 })] })
          ]
        }),
        
        new Paragraph({ 
          heading: HeadingLevel.HEADING_2, 
          spacing: { before: 300 },
          children: [new TextRun("1.3. Trạng thái mục tiêu")] 
        }),
        
        new Paragraph({
          spacing: { before: 200, after: 200 },
          children: [new TextRun({ 
            text: "Hệ thống adaptive learning với khả năng theo dõi tiến độ và cá nhân hóa lộ trình học tập:", 
            size: 22, 
            font: "Arial"
          })]
        }),
        
        // Target state table
        new Table({
          columnWidths: [2800, 3280, 3280],
          rows: [
            new TableRow({
              tableHeader: true,
              children: [
                createCell("Khả năng", { header: true, width: 2800 }),
                createCell("Hiện tại", { header: true, width: 3280 }),
                createCell("Mục tiêu", { header: true, width: 3280 })
              ]
            }),
            new TableRow({ 
              children: [
                createCell("Tổ chức nội dung", { width: 2800 }), 
                createCell("Theo nguồn", { width: 3280 }), 
                createCell("Theo learning path", { width: 3280, bold: true })
              ] 
            }),
            new TableRow({ 
              children: [
                createCell("Tiến độ học viên", { width: 2800 }), 
                createCell("Không có", { width: 3280 }), 
                createCell("5 cấp độ phân cấp với tracking", { width: 3280, bold: true })
              ] 
            }),
            new TableRow({ 
              children: [
                createCell("Cá nhân hóa", { width: 2800 }), 
                createCell("Không có", { width: 3280 }), 
                createCell("Adaptive paths dựa trên năng lực", { width: 3280, bold: true })
              ] 
            }),
            new TableRow({ 
              children: [
                createCell("Đánh giá", { width: 2800 }), 
                createCell("Không có", { width: 3280 }), 
                createCell("Milestone-based với spaced repetition", { width: 3280, bold: true })
              ] 
            }),
            new TableRow({ 
              children: [
                createCell("Khả năng hiển thị phụ huynh", { width: 2800 }), 
                createCell("Hạn chế", { width: 3280 }), 
                createCell("Dashboard tiến độ toàn diện", { width: 3280, bold: true })
              ] 
            })
          ]
        }),
        
        new Paragraph({ children: [new PageBreak()] }),
        
        // ============ SECTION 2: PHÂN TÍCH TÀI NGUYÊN ============
        new Paragraph({ 
          heading: HeadingLevel.HEADING_1, 
          children: [new TextRun("2. PHÂN TÍCH TÀI NGUYÊN")] 
        }),
        
        new Paragraph({ 
          heading: HeadingLevel.HEADING_2, 
          children: [new TextRun("2.1. Bảng thống kê 6 nguồn nội dung")] 
        }),
        
        // Content sources table
        new Table({
          columnWidths: [1600, 1600, 1600, 1400, 1800, 1360],
          rows: [
            new TableRow({
              tableHeader: true,
              children: [
                createCell("Nguồn", { header: true, width: 1600 }),
                createCell("Bộ sưu tập", { header: true, width: 1600, alignment: AlignmentType.CENTER }),
                createCell("Video", { header: true, width: 1600, alignment: AlignmentType.CENTER }),
                createCell("% Tổng", { header: true, width: 1400, alignment: AlignmentType.CENTER }),
                createCell("Mục đích chính", { header: true, width: 1800 }),
                createCell("Trạng thái", { header: true, width: 1360 })
              ]
            }),
            new TableRow({ 
              children: [
                createCell("Abeka", { width: 1600, bold: true }), 
                createCell("2,380", { width: 1600, alignment: AlignmentType.CENTER }), 
                createCell("20,195", { width: 1600, alignment: AlignmentType.CENTER }), 
                createCell("55.5%", { width: 1400, alignment: AlignmentType.CENTER }), 
                createCell("Core K-12 Curriculum", { width: 1800 }),
                createCell("Hoạt động", { width: 1360 })
              ] 
            }),
            new TableRow({ 
              children: [
                createCell("Littlefox EN", { width: 1600, bold: true }), 
                createCell("136", { width: 1600, alignment: AlignmentType.CENTER }), 
                createCell("8,718", { width: 1600, alignment: AlignmentType.CENTER }), 
                createCell("24.0%", { width: 1400, alignment: AlignmentType.CENTER }), 
                createCell("Văn học/Truyện", { width: 1800 }),
                createCell("Hoạt động", { width: 1360 })
              ] 
            }),
            new TableRow({ 
              children: [
                createCell("PlayTT", { width: 1600, bold: true }), 
                createCell("57", { width: 1600, alignment: AlignmentType.CENTER }), 
                createCell("4,938", { width: 1600, alignment: AlignmentType.CENTER }), 
                createCell("13.6%", { width: 1400, alignment: AlignmentType.CENTER }), 
                createCell("Luyện thi (IELTS)", { width: 1800 }),
                createCell("Hoạt động", { width: 1360 })
              ] 
            }),
            new TableRow({ 
              children: [
                createCell("Littlefox CN", { width: 1600, bold: true }), 
                createCell("48", { width: 1600, alignment: AlignmentType.CENTER }), 
                createCell("1,983", { width: 1600, alignment: AlignmentType.CENTER }), 
                createCell("5.5%", { width: 1400, alignment: AlignmentType.CENTER }), 
                createCell("Tiếng Trung", { width: 1800 }),
                createCell("Hoạt động", { width: 1360 })
              ] 
            }),
            new TableRow({ 
              children: [
                createCell("PlayGG", { width: 1600, bold: true }), 
                createCell("26", { width: 1600, alignment: AlignmentType.CENTER }), 
                createCell("514", { width: 1600, alignment: AlignmentType.CENTER }), 
                createCell("1.4%", { width: 1400, alignment: AlignmentType.CENTER }), 
                createCell("Bổ trợ", { width: 1800 }),
                createCell("Hoạt động", { width: 1360 })
              ] 
            }),
            new TableRow({ 
              children: [
                createCell("Phim", { width: 1600, bold: true }), 
                createCell("12", { width: 1600, alignment: AlignmentType.CENTER }), 
                createCell("12", { width: 1600, alignment: AlignmentType.CENTER }), 
                createCell("0.03%", { width: 1400, alignment: AlignmentType.CENTER }), 
                createCell("Giải trí", { width: 1800 }),
                createCell("Không khả dụng", { width: 1360 })
              ] 
            }),
            new TableRow({ 
              children: [
                createCell("TỔNG", { width: 1600, bold: true }), 
                createCell("2,659", { width: 1600, alignment: AlignmentType.CENTER, bold: true }), 
                createCell("36,360", { width: 1600, alignment: AlignmentType.CENTER, bold: true }), 
                createCell("100%", { width: 1400, alignment: AlignmentType.CENTER, bold: true }), 
                createCell("", { width: 1800 }),
                createCell("", { width: 1360 })
              ] 
            })
          ]
        }),
        
        new Paragraph({ 
          heading: HeadingLevel.HEADING_2, 
          spacing: { before: 300 },
          children: [new TextRun("2.2. Phân bổ theo độ tuổi/lớp")] 
        }),
        
        new Paragraph({
          spacing: { before: 200, after: 200 },
          children: [new TextRun({ 
            text: "Nội dung được phân bổ rộng khắp các nhóm tuổi từ mầm non đến trung học phổ thông:", 
            size: 22, 
            font: "Arial"
          })]
        }),
        
        // Age/Grade distribution
        new Table({
          columnWidths: [2340, 2340, 2340, 2340],
          rows: [
            new TableRow({
              tableHeader: true,
              children: [
                createCell("Nhóm tuổi", { header: true, width: 2340 }),
                createCell("Lớp/Cấp độ", { header: true, width: 2340 }),
                createCell("Nguồn chính", { header: true, width: 2340 }),
                createCell("Tập trung nội dung", { header: true, width: 2340 })
              ]
            }),
            new TableRow({ 
              children: [
                createCell("3-5 (Mầm non)", { width: 2340 }), 
                createCell("K4-K5, Level 1", { width: 2340 }), 
                createCell("Abeka, Littlefox", { width: 2340 }),
                createCell("Phonics, cơ bản, truyện", { width: 2340 })
              ] 
            }),
            new TableRow({ 
              children: [
                createCell("6-11 (Tiểu học)", { width: 2340 }), 
                createCell("G1-G6, Level 2-4", { width: 2340 }), 
                createCell("Abeka, Littlefox", { width: 2340 }),
                createCell("Môn học cốt lõi, văn học", { width: 2340 })
              ] 
            }),
            new TableRow({ 
              children: [
                createCell("12-14 (THCS)", { width: 2340 }), 
                createCell("G7-G9, Level 5-6", { width: 2340 }), 
                createCell("Abeka, Littlefox", { width: 2340 }),
                createCell("Môn nâng cao, kinh điển", { width: 2340 })
              ] 
            }),
            new TableRow({ 
              children: [
                createCell("15-18 (THPT)", { width: 2340 }), 
                createCell("G10-G12, Level 7-9", { width: 2340 }), 
                createCell("Abeka, PlayTT", { width: 2340 }),
                createCell("Chuẩn bị đại học, IELTS", { width: 2340 })
              ] 
            })
          ]
        }),
        
        new Paragraph({ 
          heading: HeadingLevel.HEADING_2, 
          spacing: { before: 300 },
          children: [new TextRun("2.3. Phân loại 9 lĩnh vực môn học")] 
        }),
        
        new Paragraph({
          spacing: { before: 200, after: 200 },
          children: [new TextRun({ 
            text: "Toàn bộ nội dung được phân loại vào 9 lĩnh vực chính theo hệ thống phân loại thống nhất:", 
            size: 22, 
            font: "Arial"
          })]
        }),
        
        // Subject taxonomy table
        new Table({
          columnWidths: [2340, 3120, 3900],
          rows: [
            new TableRow({
              tableHeader: true,
              children: [
                createCell("Lĩnh vực", { header: true, width: 2340 }),
                createCell("Môn thành phần", { header: true, width: 3120 }),
                createCell("Nguồn chính", { header: true, width: 3900 })
              ]
            }),
            new TableRow({ 
              children: [
                createCell("Toán học (Math)", { width: 2340, bold: true }), 
                createCell("Số học, Đại số, Hình học, Giải tích", { width: 3120 }), 
                createCell("Abeka (chính), PlayTT Numberblocks (bổ trợ)", { width: 3900 })
              ] 
            }),
            new TableRow({ 
              children: [
                createCell("Tiếng Anh (ELA)", { width: 2340, bold: true }), 
                createCell("Đọc hiểu, Viết, Ngữ âm, Chính tả", { width: 3120 }), 
                createCell("Abeka (chính), Littlefox EN (mở rộng)", { width: 3900 })
              ] 
            }),
            new TableRow({ 
              children: [
                createCell("Khoa học (Science)", { width: 2340, bold: true }), 
                createCell("Sinh học, Hóa học, Vật lý, Sức khỏe", { width: 3120 }), 
                createCell("Abeka G6-G12", { width: 3900 })
              ] 
            }),
            new TableRow({ 
              children: [
                createCell("Khoa học Xã hội", { width: 2340, bold: true }), 
                createCell("Lịch sử, Địa lý, Công dân", { width: 3120 }), 
                createCell("Abeka G1-G12", { width: 3900 })
              ] 
            }),
            new TableRow({ 
              children: [
                createCell("Ngôn ngữ (Language)", { width: 2340, bold: true }), 
                createCell("Tiếng Anh, Tiếng Trung, Tiếng Tây Ban Nha", { width: 3120 }), 
                createCell("Abeka, Littlefox CN", { width: 3900 })
              ] 
            }),
            new TableRow({ 
              children: [
                createCell("Luyện thi (Test Prep)", { width: 2340, bold: true }), 
                createCell("IELTS, TOEFL, SAT/ACT", { width: 3120 }), 
                createCell("PlayTT (TEDed IELTS)", { width: 3900 })
              ] 
            }),
            new TableRow({ 
              children: [
                createCell("Nghệ thuật & Âm nhạc", { width: 2340, bold: true }), 
                createCell("Mỹ thuật, Âm nhạc, Thủ công", { width: 3120 }), 
                createCell("Abeka K4-G5", { width: 3900 })
              ] 
            }),
            new TableRow({ 
              children: [
                createCell("Kỹ năng Sống", { width: 2340, bold: true }), 
                createCell("Kinh Thánh, Chữ viết tay, Thói quen", { width: 3120 }), 
                createCell("Abeka", { width: 3900 })
              ] 
            }),
            new TableRow({ 
              children: [
                createCell("Truyện & Văn học", { width: 2340, bold: true }), 
                createCell("Truyện cổ tích, Kinh điển, Dân gian", { width: 3120 }), 
                createCell("Littlefox EN & CN", { width: 3900 })
              ] 
            })
          ]
        }),
        
        new Paragraph({ children: [new PageBreak()] }),
        
        // ============ SECTION 3: KIẾN TRÚC ĐỀ XUẤT ============
        new Paragraph({ 
          heading: HeadingLevel.HEADING_1, 
          children: [new TextRun("3. KIẾN TRÚC ĐỀ XUẤT")] 
        }),
        
        new Paragraph({ 
          heading: HeadingLevel.HEADING_2, 
          children: [new TextRun("3.1. 5 cấp độ phân cấp")] 
        }),
        
        new Paragraph({
          spacing: { before: 200, after: 200 },
          children: [new TextRun({ 
            text: "Dựa trên nghiên cứu từ Duolingo, Coursera và Khan Academy, kiến trúc đề xuất gồm 5 cấp độ phân cấp từ nhỏ đến lớn:", 
            size: 22, 
            font: "Arial"
          })]
        }),
        
        // Hierarchy table
        new Table({
          columnWidths: [1800, 2340, 1560, 1560, 2100],
          rows: [
            new TableRow({
              tableHeader: true,
              children: [
                createCell("Cấp độ", { header: true, width: 1800 }),
                createCell("Đơn vị", { header: true, width: 2340 }),
                createCell("Thời lượng", { header: true, width: 1560 }),
                createCell("Số nội dung", { header: true, width: 1560 }),
                createCell("Mục đích", { header: true, width: 2100 })
              ]
            }),
            new TableRow({ 
              children: [
                createCell("Level 5", { width: 1800, bold: true }), 
                createCell("Learning Journey\n(Chương trình/Khóa học)", { width: 2340 }), 
                createCell("4-52 tuần", { width: 1560 }), 
                createCell("Nhiều weekly plans", { width: 1560 }),
                createCell("Hoàn thành mục tiêu dài hạn", { width: 2100 })
              ] 
            }),
            new TableRow({ 
              children: [
                createCell("Level 4", { width: 1800, bold: true }), 
                createCell("Weekly Plan\n(Tuần)", { width: 2340 }), 
                createCell("5-15 giờ", { width: 1560 }), 
                createCell("5-7 daily plans", { width: 1560 }),
                createCell("Kiểm soát tiến độ", { width: 2100 })
              ] 
            }),
            new TableRow({ 
              children: [
                createCell("Level 3", { width: 1800, bold: true }), 
                createCell("Daily Plan\n(Ngày)", { width: 2340 }), 
                createCell("10-45 phút", { width: 1560 }), 
                createCell("3-7 lessons", { width: 1560 }),
                createCell("Tải nhận thức phù hợp", { width: 2100 })
              ] 
            }),
            new TableRow({ 
              children: [
                createCell("Level 2", { width: 1800, bold: true }), 
                createCell("Lesson\n(Bài học)", { width: 2340 }), 
                createCell("15-60 phút", { width: 1560 }), 
                createCell("3-7 videos", { width: 1560 }),
                createCell("Bao phủ khái niệm đầy đủ", { width: 2100 })
              ] 
            }),
            new TableRow({ 
              children: [
                createCell("Level 1", { width: 1800, bold: true }), 
                createCell("Video\n(Đơn vị cơ bản)", { width: 2340 }), 
                createCell("3-15 phút", { width: 1560 }), 
                createCell("1", { width: 1560 }),
                createCell("Streaming & tracking", { width: 2100 })
              ] 
            })
          ]
        }),
        
        new Paragraph({ 
          heading: HeadingLevel.HEADING_2, 
          spacing: { before: 300 },
          children: [new TextRun("3.2. Mô hình dữ liệu")] 
        }),
        
        new Paragraph({
          spacing: { before: 200, after: 200 },
          children: [new TextRun({ 
            text: "Quan hệ thực thể chính (ER Diagram - Textual Representation):", 
            size: 22, 
            font: "Arial"
          })]
        }),
        
        new Paragraph({
          spacing: { before: 100, after: 100 },
          shading: { fill: "F5F5F5", type: ShadingType.CLEAR },
          children: [new TextRun({ 
            text: `[LEARNING_JOURNEY] ||--o{ [WEEKLY_PLAN] : contains
[WEEKLY_PLAN] ||--o{ [DAILY_PLAN] : contains  
[DAILY_PLAN] ||--o{ [LESSON] : contains
[LESSON] ||--o{ [VIDEO] : contains

[LEARNING_JOURNEY] {
  uuid journey_id PK
  string title
  string category
  int duration_weeks
  jsonb prerequisites
  jsonb certificate_req
}

[WEEKLY_PLAN] {
  uuid weekly_id PK
  uuid journey_id FK
  int week_number
  string theme
  int estimated_hours
  jsonb completion_criteria
}

[DAILY_PLAN] {
  uuid daily_id PK
  uuid weekly_id FK
  int day_number
  string title
  int estimated_minutes
  jsonb lessons
}

[LESSON] {
  uuid lesson_id PK
  string title
  string type
  int estimated_minutes
  jsonb learning_objectives
  float required_watch_pct
  float required_score
}

[VIDEO] {
  uuid video_id PK
  string title
  int duration_seconds
  string difficulty
  string video_url
  jsonb prerequisites
  int order_in_lesson
}`, 
            size: 18, 
            font: "Consolas"
          })]
        }),
        
        new Paragraph({ 
          heading: HeadingLevel.HEADING_2, 
          spacing: { before: 300 },
          children: [new TextRun("3.3. Thành phần hệ thống")] 
        }),
        
        // System components table
        new Table({
          columnWidths: [3120, 3120, 3120],
          rows: [
            new TableRow({
              tableHeader: true,
              children: [
                createCell("Thành phần", { header: true, width: 3120 }),
                createCell("Công nghệ", { header: true, width: 3120 }),
                createCell("Nhiệm vụ", { header: true, width: 3120 })
              ]
            }),
            new TableRow({ 
              children: [
                createCell("Content Service", { width: 3120, bold: true }), 
                createCell("Node.js/FastAPI", { width: 3120 }), 
                createCell("CRUD cho phân cấp nội dung", { width: 3120 })
              ] 
            }),
            new TableRow({ 
              children: [
                createCell("Progress Service", { width: 3120, bold: true }), 
                createCell("Node.js", { width: 3120 }), 
                createCell("Theo dõi hoàn thành, streaks, XP", { width: 3120 })
              ] 
            }),
            new TableRow({ 
              children: [
                createCell("Sequencing Service", { width: 3120, bold: true }), 
                createCell("Python", { width: 3120 }), 
                createCell("Tạo learning paths thích ứng", { width: 3120 })
              ] 
            }),
            new TableRow({ 
              children: [
                createCell("Spaced Repetition", { width: 3120, bold: true }), 
                createCell("Python", { width: 3120 }), 
                createCell("Thuật toán HLR, lên lịch review", { width: 3120 })
              ] 
            }),
            new TableRow({ 
              children: [
                createCell("Recommendation Engine", { width: 3120, bold: true }), 
                createCell("ML/Python", { width: 3120 }), 
                createCell("Đề xuất nội dung cross-source", { width: 3120 })
              ] 
            }),
            new TableRow({ 
              children: [
                createCell("Parent Dashboard", { width: 3120, bold: true }), 
                createCell("React/Next.js", { width: 3120 }), 
                createCell("Hiển thị tiến độ, điều khiển", { width: 3120 })
              ] 
            }),
            new TableRow({ 
              children: [
                createCell("Child Interface", { width: 3120, bold: true }), 
                createCell("React/Expo", { width: 3120 }), 
                createCell("Trải nghiệm học, gamification", { width: 3120 })
              ] 
            })
          ]
        }),
        
        new Paragraph({ children: [new PageBreak()] }),
        
        // ============ SECTION 4: CHIẾN LƯỢC LEARNING PATH ============
        new Paragraph({ 
          heading: HeadingLevel.HEADING_1, 
          children: [new TextRun("4. CHIẾN LƯỢC LEARNING PATH")] 
        }),
        
        new Paragraph({ 
          heading: HeadingLevel.HEADING_2, 
          children: [new TextRun("4.1. 4 loại learning path chính")] 
        }),
        
        // Path types table
        new Table({
          columnWidths: [2340, 2340, 1560, 1560, 1560],
          rows: [
            new TableRow({
              tableHeader: true,
              children: [
                createCell("Loại Path", { header: true, width: 2340 }),
                createCell("Nguồn chính", { header: true, width: 2340 }),
                createCell("Độ tuổi", { header: true, width: 1560 }),
                createCell("Thời lượng", { header: true, width: 1560 }),
                createCell("Video", { header: true, width: 1560 })
              ]
            }),
            new TableRow({ 
              children: [
                createCell("K-12 Curriculum", { width: 2340, bold: true }), 
                createCell("Abeka", { width: 2340 }), 
                createCell("3-18", { width: 1560 }), 
                createCell("14 năm", { width: 1560 }),
                createCell("20,195", { width: 1560 })
              ] 
            }),
            new TableRow({ 
              children: [
                createCell("English Stories", { width: 2340, bold: true }), 
                createCell("Littlefox EN", { width: 2340 }), 
                createCell("3-15", { width: 1560 }), 
                createCell("9 cấp", { width: 1560 }),
                createCell("8,718", { width: 1560 })
              ] 
            }),
            new TableRow({ 
              children: [
                createCell("IELTS Preparation", { width: 2340, bold: true }), 
                createCell("PlayTT", { width: 2340 }), 
                createCell("14+", { width: 1560 }), 
                createCell("12-16 tuần", { width: 1560 }),
                createCell("215+", { width: 1560 })
              ] 
            }),
            new TableRow({ 
              children: [
                createCell("Chinese Learning", { width: 2340, bold: true }), 
                createCell("Littlefox CN", { width: 2340 }), 
                createCell("6-18", { width: 1560 }), 
                createCell("5 cấp", { width: 1560 }),
                createCell("1,983", { width: 1560 })
              ] 
            })
          ]
        }),
        
        new Paragraph({ 
          heading: HeadingLevel.HEADING_2, 
          spacing: { before: 300 },
          children: [new TextRun("4.2. 5 hành trình học tập mẫu chi tiết")] 
        }),
        
        new Paragraph({ 
          heading: HeadingLevel.HEADING_3, 
          children: [new TextRun("Journey 1: Sẵn sàng Mẫu giáo (4-5 tuổi)")] 
        }),
        
        new Paragraph({
          spacing: { before: 100, after: 100 },
          children: [new TextRun({ 
            text: "Thời lượng: 36 tuần | Thời gian/ngày: 30-45 phút | Nguồn: Abeka K4-K5 + Littlefox L1", 
            size: 22, 
            color: COLORS.secondary,
            font: "Arial"
          })]
        }),
        
        createBullet("Giai đoạn 1 (Tuần 1-12): Nền tảng - Abeka K4 + Littlefox L1", "bullet-section4"),
        createBullet("Giai đoạn 2 (Tuần 13-24): Chuyển tiếp - K4→K5 + L1→L2", "bullet-section4"),
        createBullet("Giai đoạn 3 (Tuần 25-36): Sẵn sàng - Abeka K5 + Littlefox L2", "bullet-section4"),
        
        new Paragraph({
          spacing: { before: 100, after: 200 },
          children: [new TextRun({ 
            text: "Kết quả: Sẵn sàng đọc viết, tính toán cơ bản, 200+ từ vựng", 
            bold: true,
            size: 22, 
            font: "Arial"
          })]
        }),
        
        new Paragraph({ 
          heading: HeadingLevel.HEADING_3, 
          children: [new TextRun("Journey 2: Người yêu Văn học Anh (8-12 tuổi)")] 
        }),
        
        new Paragraph({
          spacing: { before: 100, after: 100 },
          children: [new TextRun({ 
            text: "Thời lượng: 52 tuần | Thời gian/ngày: 45-60 phút | Nguồn: Littlefox L3-L6 + Abeka ELA G3-G6", 
            size: 22, 
            color: COLORS.secondary,
            font: "Arial"
          })]
        }),
        
        createBullet("Học kỳ 1: Truyện cổ tích & Ngụ ngôn - Cinderella, Snow White, Aesop", "bullet-section4"),
        createBullet("Học kỳ 2: Văn học kinh điển - Shakespeare, Jane Eyre, Sherlock Holmes", "bullet-section4"),
        
        new Paragraph({
          spacing: { before: 100, after: 200 },
          children: [new TextRun({ 
            text: "Kết quả: 5,000+ từ vựng, kỹ năng phân tích văn học", 
            bold: true,
            size: 22, 
            font: "Arial"
          })]
        }),
        
        new Paragraph({ 
          heading: HeadingLevel.HEADING_3, 
          children: [new TextRun("Journey 3: Xây dựng nền tảng STEM (9-13 tuổi)")] 
        }),
        
        new Paragraph({
          spacing: { before: 100, after: 100 },
          children: [new TextRun({ 
            text: "Thời lượng: 48 tuần | Thời gian/ngày: 60-75 phút | Nguồn: Abeka G4-G7 + PlayTT", 
            size: 22, 
            color: COLORS.secondary,
            font: "Arial"
          })]
        }),
        
        createBullet("Năm 1: Toán nâng cao + Khoa học cơ bản - Phân số, hình học, sinh học", "bullet-section4"),
        createBullet("Năm 2: Đại số + Khoa học chuyên sâu - Đại số I, tế bào, di truyền", "bullet-section4"),
        
        new Paragraph({
          spacing: { before: 100, after: 200 },
          children: [new TextRun({ 
            text: "Kết quả: Qua Đại số I, nền tảng sinh học và khoa học trái đất", 
            bold: true,
            size: 22, 
            font: "Arial"
          })]
        }),
        
        new Paragraph({ 
          heading: HeadingLevel.HEADING_3, 
          children: [new TextRun("Journey 4: Đạt IELTS Band 7.0 (16-18 tuổi)")] 
        }),
        
        new Paragraph({
          spacing: { before: 100, after: 100 },
          children: [new TextRun({ 
            text: "Thời lượng: 16 tuần (cường độ cao) | Thời gian/ngày: 2-3 giờ | Nguồn: PlayTT IELTS + Littlefox L7-L9", 
            size: 22, 
            color: COLORS.secondary,
            font: "Arial"
          })]
        }),
        
        createBullet("Giai đoạn 1 (Tuần 1-4): Nền tảng - Nghe, đọc, viết Task 1, nói", "bullet-section4"),
        createBullet("Giai đoạn 2 (Tuần 5-8): Phát triển kỹ năng - Chiến lược nâng cao", "bullet-section4"),
        createBullet("Giai đoạn 3 (Tuần 9-12): Kỹ thuật nâng cao - Mock tests, viết tập trung", "bullet-section4"),
        createBullet("Giai đoạn 4 (Tuần 13-16): Hoàn thiện - Luyện điểm yếu, mô phỏng thi", "bullet-section4"),
        
        new Paragraph({
          spacing: { before: 100, after: 200 },
          children: [new TextRun({ 
            text: "Kết quả: IELTS Band 7.0+, 2,000+ từ vựng học thuật", 
            bold: true,
            size: 22, 
            font: "Arial"
          })]
        }),
        
        new Paragraph({ 
          heading: HeadingLevel.HEADING_3, 
          children: [new TextRun("Journey 5: Học giả Song ngữ (10-14 tuổi)")] 
        }),
        
        new Paragraph({
          spacing: { before: 100, after: 100 },
          children: [new TextRun({ 
            text: "Thời lượng: 40 tuần | Thời gian/ngày: 90 phút (60 Anh + 30 Trung) | Nguồn: Abeka G5-G7 + Littlefox CN L2-L4", 
            size: 22, 
            color: COLORS.secondary,
            font: "Arial"
          })]
        }),
        
        createBullet("Học kỳ 1: Nền tảng - Song song Abeka G5 và Littlefox CN L2", "bullet-section4"),
        createBullet("Học kỳ 2: Nâng cao - Abeka G6-G7 và Littlefox CN L3-L4", "bullet-section4"),
        
        new Paragraph({
          spacing: { before: 100, after: 200 },
          children: [new TextRun({ 
            text: "Kết quả: 1,500+ chữ Hán, tương đương HSK 3-4, năng lực song ngữ", 
            bold: true,
            size: 22, 
            font: "Arial"
          })]
        }),
        
        new Paragraph({ 
          heading: HeadingLevel.HEADING_2, 
          children: [new TextRun("4.3. Ma trận tích hợp nguồn")] 
        }),
        
        // Integration matrix table
        new Table({
          columnWidths: [3120, 3120, 3120],
          rows: [
            new TableRow({
              tableHeader: true,
              children: [
                createCell("Nguồn chính", { header: true, width: 3120 }),
                createCell("Nguồn bổ trợ", { header: true, width: 3120 }),
                createCell("Mục đích tích hợp", { header: true, width: 3120 })
              ]
            }),
            new TableRow({ 
              children: [
                createCell("Abeka Toán", { width: 3120 }), 
                createCell("Numberblocks (PlayTT)", { width: 3120 }), 
                createCell("Khái niệm toán trực quan", { width: 3120 })
              ] 
            }),
            new TableRow({ 
              children: [
                createCell("Abeka Đọc hiểu", { width: 3120 }), 
                createCell("Littlefox EN", { width: 3120 }), 
                createCell("Luyện đọc mở rộng", { width: 3120 })
              ] 
            }),
            new TableRow({ 
              children: [
                createCell("Abeka Khoa học", { width: 3120 }), 
                createCell("Littlefox L3-L4", { width: 3120 }), 
                createCell("Truyện chủ đề khoa học", { width: 3120 })
              ] 
            }),
            new TableRow({ 
              children: [
                createCell("PlayTT IELTS", { width: 3120 }), 
                createCell("Littlefox L6-L9", { width: 3120 }), 
                createCell("Mở rộng từ vựng học thuật", { width: 3120 })
              ] 
            }),
            new TableRow({ 
              children: [
                createCell("Littlefox CN", { width: 3120 }), 
                createCell("Abeka Viết", { width: 3120 }), 
                createCell("Luyện viết chữ Hán", { width: 3120 })
              ] 
            })
          ]
        }),
        
        new Paragraph({ children: [new PageBreak()] }),
        
        // ============ SECTION 5: KẾ HOẠCH TRIỂN KHAI ============
        new Paragraph({ 
          heading: HeadingLevel.HEADING_1, 
          children: [new TextRun("5. KẾ HOẠCH TRIỂN KHAI")] 
        }),
        
        new Paragraph({ 
          heading: HeadingLevel.HEADING_2, 
          children: [new TextRun("5.1. Lộ trình 4 phase (24 tuần)")] 
        }),
        
        // Implementation phases table
        new Table({
          columnWidths: [1800, 2340, 2340, 2880],
          rows: [
            new TableRow({
              tableHeader: true,
              children: [
                createCell("Phase", { header: true, width: 1800 }),
                createCell("Thời gian", { header: true, width: 2340 }),
                createCell("Trọng tâm", { header: true, width: 2340 }),
                createCell("Deliverable", { header: true, width: 2880 })
              ]
            }),
            new TableRow({ 
              children: [
                createCell("Phase 1", { width: 1800, bold: true }), 
                createCell("Tuần 1-5", { width: 2340 }), 
                createCell("Nền tảng - Schema DB, Content Mapping", { width: 2340 }),
                createCell("Content hierarchy API hoạt động", { width: 2880 })
              ] 
            }),
            new TableRow({ 
              children: [
                createCell("Phase 2", { width: 1800, bold: true }), 
                createCell("Tuần 6-11", { width: 2340 }), 
                createCell("Tính năng cốt lõi - Progress, Sequencing", { width: 2340 }),
                createCell("Học sinh theo path, phụ huynh xem tiến độ", { width: 2880 })
              ] 
            }),
            new TableRow({ 
              children: [
                createCell("Phase 3", { width: 1800, bold: true }), 
                createCell("Tuần 12-18", { width: 2340 }), 
                createCell("Thông minh - HLR, Recommendations", { width: 2340 }),
                createCell("Hệ thống thích ứng theo nhu cầu học viên", { width: 2880 })
              ] 
            }),
            new TableRow({ 
              children: [
                createCell("Phase 4", { width: 1800, bold: true }), 
                createCell("Tuần 19-24", { width: 2340 }), 
                createCell("Mở rộng - Mobile, Analytics", { width: 2340 }),
                createCell("Nền tảng học tập toàn diện", { width: 2880 })
              ] 
            })
          ]
        }),
        
        new Paragraph({ 
          heading: HeadingLevel.HEADING_2, 
          spacing: { before: 300 },
          children: [new TextRun("5.2. Công nghệ đề xuất")] 
        }),
        
        // Technology stack table
        new Table({
          columnWidths: [2340, 3120, 3900],
          rows: [
            new TableRow({
              tableHeader: true,
              children: [
                createCell("Lớp", { header: true, width: 2340 }),
                createCell("Công nghệ", { header: true, width: 3120 }),
                createCell("Lý do lựa chọn", { header: true, width: 3900 })
              ]
            }),
            new TableRow({ 
              children: [
                createCell("API Backend", { width: 2340, bold: true }), 
                createCell("FastAPI (Python)", { width: 3120 }), 
                createCell("Async support, type hints, auto-docs", { width: 3900 })
              ] 
            }),
            new TableRow({ 
              children: [
                createCell("Database", { width: 2340, bold: true }), 
                createCell("PostgreSQL + MongoDB", { width: 3120 }), 
                createCell("Relational cho analytics, document cho content", { width: 3900 })
              ] 
            }),
            new TableRow({ 
              children: [
                createCell("Cache", { width: 2340, bold: true }), 
                createCell("Redis", { width: 3120 }), 
                createCell("Streak tracking, session management", { width: 3900 })
              ] 
            }),
            new TableRow({ 
              children: [
                createCell("Search", { width: 2340, bold: true }), 
                createCell("Elasticsearch", { width: 3120 }), 
                createCell("Content discovery, recommendations", { width: 3900 })
              ] 
            }),
            new TableRow({ 
              children: [
                createCell("Frontend", { width: 2340, bold: true }), 
                createCell("Next.js + React", { width: 3120 }), 
                createCell("SSR cho SEO, SPA cho UX", { width: 3900 })
              ] 
            }),
            new TableRow({ 
              children: [
                createCell("Mobile", { width: 2340, bold: true }), 
                createCell("React Native", { width: 3120 }), 
                createCell("Cross-platform learning app", { width: 3900 })
              ] 
            }),
            new TableRow({ 
              children: [
                createCell("ML/AI", { width: 2340, bold: true }), 
                createCell("Python + scikit-learn", { width: 3120 }), 
                createCell("Thuật toán HLR, recommendations", { width: 3900 })
              ] 
            })
          ]
        }),
        
        new Paragraph({ 
          heading: HeadingLevel.HEADING_2, 
          spacing: { before: 300 },
          children: [new TextRun("5.3. KPI và metrics thành công")] 
        }),
        
        // KPI table
        new Table({
          columnWidths: [2340, 1560, 1560, 1560, 2340],
          rows: [
            new TableRow({
              tableHeader: true,
              children: [
                createCell("Chỉ số", { header: true, width: 2340 }),
                createCell("Baseline", { header: true, width: 1560, alignment: AlignmentType.CENTER }),
                createCell("MVP", { header: true, width: 1560, alignment: AlignmentType.CENTER }),
                createCell("Beta", { header: true, width: 1560, alignment: AlignmentType.CENTER }),
                createCell("Launch", { header: true, width: 2340, alignment: AlignmentType.CENTER })
              ]
            }),
            new TableRow({ 
              children: [
                createCell("Video trong Paths", { width: 2340 }), 
                createCell("0%", { width: 1560, alignment: AlignmentType.CENTER }), 
                createCell("25%", { width: 1560, alignment: AlignmentType.CENTER }), 
                createCell("60%", { width: 1560, alignment: AlignmentType.CENTER }),
                createCell("100%", { width: 2340, alignment: AlignmentType.CENTER })
              ] 
            }),
            new TableRow({ 
              children: [
                createCell("Học viên hoạt động", { width: 2340 }), 
                createCell("0", { width: 1560, alignment: AlignmentType.CENTER }), 
                createCell("100", { width: 1560, alignment: AlignmentType.CENTER }), 
                createCell("500", { width: 1560, alignment: AlignmentType.CENTER }),
                createCell("5,000+", { width: 2340, alignment: AlignmentType.CENTER })
              ] 
            }),
            new TableRow({ 
              children: [
                createCell("Thời gian/phiên (TB)", { width: 2340 }), 
                createCell("N/A", { width: 1560, alignment: AlignmentType.CENTER }), 
                createCell("15 phút", { width: 1560, alignment: AlignmentType.CENTER }), 
                createCell("25 phút", { width: 1560, alignment: AlignmentType.CENTER }),
                createCell("35 phút", { width: 2340, alignment: AlignmentType.CENTER })
              ] 
            }),
            new TableRow({ 
              children: [
                createCell("Tỷ lệ hoàn thành", { width: 2340 }), 
                createCell("N/A", { width: 1560, alignment: AlignmentType.CENTER }), 
                createCell("40%", { width: 1560, alignment: AlignmentType.CENTER }), 
                createCell("55%", { width: 1560, alignment: AlignmentType.CENTER }),
                createCell("80%", { width: 2340, alignment: AlignmentType.CENTER })
              ] 
            }),
            new TableRow({ 
              children: [
                createCell("Tương tác phụ huynh", { width: 2340 }), 
                createCell("0%", { width: 1560, alignment: AlignmentType.CENTER }), 
                createCell("30%", { width: 1560, alignment: AlignmentType.CENTER }), 
                createCell("50%", { width: 1560, alignment: AlignmentType.CENTER }),
                createCell("85%", { width: 2340, alignment: AlignmentType.CENTER })
              ] 
            })
          ]
        }),
        
        new Paragraph({ children: [new PageBreak()] }),
        
        // ============ SECTION 6: KẾT LUẬN & ĐỀ XUẤT ============
        new Paragraph({ 
          heading: HeadingLevel.HEADING_1, 
          children: [new TextRun("6. KẾT LUẬN & ĐỀ XUẤT")] 
        }),
        
        new Paragraph({ 
          heading: HeadingLevel.HEADING_2, 
          children: [new TextRun("6.1. Tóm tắt giá trị cốt lõi")] 
        }),
        
        createBullet("Chuyển đổi 36,360 video từ thư viện tĩnh thành hệ thống học tập động", "bullet-section6"),
        createBullet("5 cấp độ phân cấp (Video → Lesson → Daily → Weekly → Journey) với tracking đầy đủ", "bullet-section6"),
        createBullet("4 loại learning path chính phục vụ đa dạng nhu cầu: K-12, Stories, IELTS, Chinese", "bullet-section6"),
        createBullet("Cross-source integration tận dụng tối đa 6 nguồn nội dung hiện có", "bullet-section6"),
        createBullet("Adaptive learning với HLR spaced repetition và recommendation engine", "bullet-section6"),
        createBullet("Lộ trình 24 tuần từ MVP đến full launch với metrics rõ ràng", "bullet-section6"),
        
        new Paragraph({ 
          heading: HeadingLevel.HEADING_2, 
          spacing: { before: 300 },
          children: [new TextRun("6.2. Các bước tiếp theo")] 
        }),
        
        new Paragraph({ 
          heading: HeadingLevel.HEADING_3, 
          children: [new TextRun("Ngay lập tức (Tuần 1)")] 
        }),
        
        createBullet("Xác nhận và phê duyệt database schema designs", "bullet-section6"),
        createBullet("Xây dựng proof of concept: map 100 Abeka lessons sang hierarchy mới", "bullet-section6"),
        createBullet("Thiết lập môi trường development và CI/CD pipeline", "bullet-section6"),
        
        new Paragraph({ 
          heading: HeadingLevel.HEADING_3, 
          spacing: { before: 200 },
          children: [new TextRun("Ngắn hạn (Tuần 2-5)")] 
        }),
        
        createBullet("Hoàn thiện Phase 1: Database Schema + Content Mapping Layer", "bullet-section6"),
        createBullet("Triển khai CRUD APIs cho learning paths", "bullet-section6"),
        createBullet("Testing với 1,000 videos đầu tiên", "bullet-section6"),
        
        new Paragraph({ 
          heading: HeadingLevel.HEADING_3, 
          spacing: { before: 200 },
          children: [new TextRun("Trung hạn (Tuần 6-18)")] 
        }),
        
        createBullet("Xây dựng Progress Tracking và Path Sequencing", "bullet-section6"),
        createBullet("Phát triển Parent Dashboard v1", "bullet-section6"),
        createBullet("Triển khai Spaced Repetition (HLR algorithm)", "bullet-section6"),
        createBullet("Tích hợp Recommendation Engine", "bullet-section6"),
        
        new Paragraph({ 
          heading: HeadingLevel.HEADING_3, 
          spacing: { before: 200 },
          children: [new TextRun("Dài hạn (Tuần 19-24+)")] 
        }),
        
        createBullet("Tối ưu hiệu suất cho 36K+ videos", "bullet-section6"),
        createBullet("Launch mobile learning app", "bullet-section6"),
        createBullet("Analytics và reporting toàn diện", "bullet-section6"),
        createBullet("Mở rộng ra 5,000+ học viên hoạt động", "bullet-section6"),
        
        // Closing box
        new Paragraph({ spacing: { before: 400 }, children: [] }),
        
        new Table({
          columnWidths: [9360],
          alignment: AlignmentType.CENTER,
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  borders: {
                    top: { style: BorderStyle.SINGLE, size: 8, color: COLORS.primary },
                    bottom: { style: BorderStyle.SINGLE, size: 8, color: COLORS.primary },
                    left: { style: BorderStyle.SINGLE, size: 8, color: COLORS.primary },
                    right: { style: BorderStyle.SINGLE, size: 8, color: COLORS.primary }
                  },
                  shading: { fill: "E8F4FD", type: ShadingType.CLEAR },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      spacing: { before: 200, after: 100 },
                      children: [new TextRun({ 
                        text: "TÀI LIỆU CHIẾN LƯỢC", 
                        bold: true, 
                        size: 28, 
                        color: COLORS.primary,
                        font: "Arial"
                      })]
                    }),
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      spacing: { before: 100, after: 100 },
                      children: [new TextRun({ 
                        text: "Từ 36,360 videos đến hệ thống học tập thông minh", 
                        size: 22, 
                        color: COLORS.gray,
                        font: "Arial"
                      })]
                    }),
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      spacing: { before: 100, after: 200 },
                      children: [new TextRun({ 
                        text: "Chuẩn bị bởi: AI Research & Planning Team | Ngày: 31/03/2026", 
                        size: 20, 
                        italics: true,
                        color: COLORS.gray,
                        font: "Arial"
                      })]
                    })
                  ]
                })
              ]
            })
          ]
        })
      ]
    }
  ]
});

// Generate document
Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("D:\\project\\cungcontuhoc\\assets\\learning-system-design\\learning-system-design-proposal.docx", buffer);
  console.log("Document created successfully!");
});
