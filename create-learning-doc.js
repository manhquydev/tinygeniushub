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
            text: "DESIGN PROPOSAL",
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
            text: "SMART LEARNING SYSTEM",
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
            text: "Restructuring the hoctienganh.xyz platform",
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
            text: "Version: 1.0",
            size: 24,
            color: COLORS.gray,
            font: "Arial"
          })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 100, after: 100 },
          children: [new TextRun({
            text: "Date: March 31, 2026",
            size: 24,
            color: COLORS.gray,
            font: "Arial"
          })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 100, after: 800 },
          children: [new TextRun({
            text: "Prepared by: AI Research & Planning Team",
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
                        text: "STRATEGIC DOCUMENT",
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
                        text: "From video aggregation to adaptive learning system",
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
              text: "Proposal for Smart Learning System Design",
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
        new TableOfContents("Table of Contents", {
          hyperlink: true,
          headingStyleRange: "1-3",
          stylesWithLevels: [
            { styleId: "Heading1", level: 0 },
            { styleId: "Heading2", level: 1 },
            { styleId: "Heading3", level: 2 }
          ]
        }),

        new Paragraph({ children: [new PageBreak()] }),

        // ============ SECTION 1: PROJECT OVERVIEW ============
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [new TextRun("1. PROJECT OVERVIEW")]
        }),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun("1.1. Vision and goals")]
        }),

        new Paragraph({
          spacing: { before: 200, after: 200 },
          children: [new TextRun({
            text: "Transform hoctienganh.xyz from a video aggregation platform into an intelligent, adaptive learning system capable of guiding 36,360 educational videos into personalized learning journeys for Vietnamese students from 3-18 years old.",
            size: 22,
            font: "Arial"
          })]
        }),

        new Paragraph({
          spacing: { before: 100, after: 100 },
          shading: { fill: "E8F4FD", type: ShadingType.CLEAR },
          children: [new TextRun({
            text: "Core values: \\\"From passive video viewing to active, structured learning with measurable results.\\\"",
            italics: true,
            size: 24,
            color: COLORS.secondary,
            font: "Arial"
          })]
        }),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun("1.2. Current status")]
        }),

        new Paragraph({
          spacing: { before: 200, after: 200 },
          children: [new TextRun({
            text: "Currently, the system is storing 36,360 educational videos from 6 different content sources, organized according to a video library mechanism with basic classification.",
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
                createCell("Index", { header: true, width: 3500 }),
                createCell("Value", { header: true, width: 5860 })
              ]
            }),
            new TableRow({ children: [createCell("Total number of videos", { width: 3500 }), createCell("36,360", { width: 5860 })] }),
            new TableRow({ children: [createCell("Content source", { width: 3500 }), createCell("6 sources (Abeka, Littlefox EN, Littlefox CN, PlayTT, PlayGG, Movies)", { width: 5860 })] }),
            new TableRow({ children: [createCell("Collection", { width: 3500 }), createCell("2,659", { width: 5860 })] }),
            new TableRow({ children: [createCell("Class scope", { width: 3500 }), createCell("K4-G12 (14 classes)", { width: 5860 })] }),
            new TableRow({ children: [createCell("Language", { width: 3500 }), createCell("English, Chinese", { width: 5860 })] }),
            new TableRow({ children: [createCell("Current model", { width: 3500 }), createCell("Video library with basic classification", { width: 5860 })] })
          ]
        }),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300 },
          children: [new TextRun("1.3. Target state")]
        }),

        new Paragraph({
          spacing: { before: 200, after: 200 },
          children: [new TextRun({
            text: "Adaptive learning system with the ability to track progress and personalize learning paths:",
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
                createCell("Possibility", { header: true, width: 2800 }),
                createCell("Currently", { header: true, width: 3280 }),
                createCell("Target", { header: true, width: 3280 })
              ]
            }),
            new TableRow({
              children: [
                createCell("Content organization", { width: 2800 }),
                createCell("According to source", { width: 3280 }),
                createCell("Theo learning path", { width: 3280, bold: true })
              ]
            }),
            new TableRow({
              children: [
                createCell("Student progress", { width: 2800 }),
                createCell("None", { width: 3280 }),
                createCell("5 levels of hierarchy with tracking", { width: 3280, bold: true })
              ]
            }),
            new TableRow({
              children: [
                createCell("Personalization", { width: 2800 }),
                createCell("None", { width: 3280 }),
                createCell("Adaptive paths are competency-based", { width: 3280, bold: true })
              ]
            }),
            new TableRow({
              children: [
                createCell("Review", { width: 2800 }),
                createCell("None", { width: 3280 }),
                createCell("Milestone-based with spaced repetition", { width: 3280, bold: true })
              ]
            }),
            new TableRow({
              children: [
                createCell("Parent visibility", { width: 2800 }),
                createCell("Limited", { width: 3280 }),
                createCell("Comprehensive progress dashboard", { width: 3280, bold: true })
              ]
            })
          ]
        }),

        new Paragraph({ children: [new PageBreak()] }),

        // ============ SECTION 2: RESOURCE ANALYSIS ============
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [new TextRun("2. RESOURCE ANALYSIS")]
        }),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun("2.1. Statistical table of 6 content sources")]
        }),

        // Content sources table
        new Table({
          columnWidths: [1600, 1600, 1600, 1400, 1800, 1360],
          rows: [
            new TableRow({
              tableHeader: true,
              children: [
                createCell("Source", { header: true, width: 1600 }),
                createCell("Collection", { header: true, width: 1600, alignment: AlignmentType.CENTER }),
                createCell("Video", { header: true, width: 1600, alignment: AlignmentType.CENTER }),
                createCell("% Total", { header: true, width: 1400, alignment: AlignmentType.CENTER }),
                createCell("Main purpose", { header: true, width: 1800 }),
                createCell("Status", { header: true, width: 1360 })
              ]
            }),
            new TableRow({
              children: [
                createCell("Abeka", { width: 1600, bold: true }),
                createCell("2,380", { width: 1600, alignment: AlignmentType.CENTER }),
                createCell("20,195", { width: 1600, alignment: AlignmentType.CENTER }),
                createCell("55.5%", { width: 1400, alignment: AlignmentType.CENTER }),
                createCell("Core K-12 Curriculum", { width: 1800 }),
                createCell("Work", { width: 1360 })
              ]
            }),
            new TableRow({
              children: [
                createCell("Littlefox EN", { width: 1600, bold: true }),
                createCell("136", { width: 1600, alignment: AlignmentType.CENTER }),
                createCell("8,718", { width: 1600, alignment: AlignmentType.CENTER }),
                createCell("24.0%", { width: 1400, alignment: AlignmentType.CENTER }),
                createCell("Literature/Stories", { width: 1800 }),
                createCell("Work", { width: 1360 })
              ]
            }),
            new TableRow({
              children: [
                createCell("PlayTT", { width: 1600, bold: true }),
                createCell("57", { width: 1600, alignment: AlignmentType.CENTER }),
                createCell("4,938", { width: 1600, alignment: AlignmentType.CENTER }),
                createCell("13.6%", { width: 1400, alignment: AlignmentType.CENTER }),
                createCell("Test Preparation (IELTS)", { width: 1800 }),
                createCell("Work", { width: 1360 })
              ]
            }),
            new TableRow({
              children: [
                createCell("Littlefox CN", { width: 1600, bold: true }),
                createCell("48", { width: 1600, alignment: AlignmentType.CENTER }),
                createCell("1,983", { width: 1600, alignment: AlignmentType.CENTER }),
                createCell("5.5%", { width: 1400, alignment: AlignmentType.CENTER }),
                createCell("Chinese", { width: 1800 }),
                createCell("Work", { width: 1360 })
              ]
            }),
            new TableRow({
              children: [
                createCell("PlayGG", { width: 1600, bold: true }),
                createCell("26", { width: 1600, alignment: AlignmentType.CENTER }),
                createCell("514", { width: 1600, alignment: AlignmentType.CENTER }),
                createCell("1.4%", { width: 1400, alignment: AlignmentType.CENTER }),
                createCell("Support", { width: 1800 }),
                createCell("Work", { width: 1360 })
              ]
            }),
            new TableRow({
              children: [
                createCell("Phim", { width: 1600, bold: true }),
                createCell("12", { width: 1600, alignment: AlignmentType.CENTER }),
                createCell("12", { width: 1600, alignment: AlignmentType.CENTER }),
                createCell("0.03%", { width: 1400, alignment: AlignmentType.CENTER }),
                createCell("Entertainment", { width: 1800 }),
                createCell("Not available", { width: 1360 })
              ]
            }),
            new TableRow({
              children: [
                createCell("TOTAL", { width: 1600, bold: true }),
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
          children: [new TextRun("2.2. Distribution by age/grade")]
        }),

        new Paragraph({
          spacing: { before: 200, after: 200 },
          children: [new TextRun({
            text: "Content is widely distributed across age groups from preschool to high school:",
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
                createCell("Age group", { header: true, width: 2340 }),
                createCell("Class/Level", { header: true, width: 2340 }),
                createCell("Primary source", { header: true, width: 2340 }),
                createCell("Focus on content", { header: true, width: 2340 })
              ]
            }),
            new TableRow({
              children: [
                createCell("3-5 (Preschool)", { width: 2340 }),
                createCell("K4-K5, Level 1", { width: 2340 }),
                createCell("Abeka, Littlefox", { width: 2340 }),
                createCell("Phonics, basics, stories", { width: 2340 })
              ]
            }),
            new TableRow({
              children: [
                createCell("6-11 (Elementary school)", { width: 2340 }),
                createCell("G1-G6, Level 2-4", { width: 2340 }),
                createCell("Abeka, Littlefox", { width: 2340 }),
                createCell("Core subject, literature", { width: 2340 })
              ]
            }),
            new TableRow({
              children: [
                createCell("12-14 (THCS)", { width: 2340 }),
                createCell("G7-G9, Level 5-6", { width: 2340 }),
                createCell("Abeka, Littlefox", { width: 2340 }),
                createCell("Advanced subjects, classics", { width: 2340 })
              ]
            }),
            new TableRow({
              children: [
                createCell("15-18 (THPT)", { width: 2340 }),
                createCell("G10-G12, Level 7-9", { width: 2340 }),
                createCell("Abeka, PlayTT", { width: 2340 }),
                createCell("College preparation, IELTS", { width: 2340 })
              ]
            })
          ]
        }),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300 },
          children: [new TextRun("2.3. Classification of 9 subject areas")]
        }),

        new Paragraph({
          spacing: { before: 200, after: 200 },
          children: [new TextRun({
            text: "All content is classified into 9 main areas according to a unified classification system:",
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
                createCell("Field", { header: true, width: 2340 }),
                createCell("Subject composition", { header: true, width: 3120 }),
                createCell("Primary source", { header: true, width: 3900 })
              ]
            }),
            new TableRow({
              children: [
                createCell("Mathematics (Math)", { width: 2340, bold: true }),
                createCell("Arithmetic, Algebra, Geometry, Calculus", { width: 3120 }),
                createCell("Abeka (main), PlayTT Numberblocks (auxiliary)", { width: 3900 })
              ]
            }),
            new TableRow({
              children: [
                createCell("English (ELA)", { width: 2340, bold: true }),
                createCell("Reading Comprehension, Writing, Phonetics, Spelling", { width: 3120 }),
                createCell("Abeka (main), Littlefox EN (extended)", { width: 3900 })
              ]
            }),
            new TableRow({
              children: [
                createCell("Science (Science)", { width: 2340, bold: true }),
                createCell("Biology, Chemistry, Physics, Health", { width: 3120 }),
                createCell("Abeka G6-G12", { width: 3900 })
              ]
            }),
            new TableRow({
              children: [
                createCell("Social Sciences", { width: 2340, bold: true }),
                createCell("History, Geography, Civics", { width: 3120 }),
                createCell("Abeka G1-G12", { width: 3900 })
              ]
            }),
            new TableRow({
              children: [
                createCell("Language (Language)", { width: 2340, bold: true }),
                createCell("English, Chinese, Spanish", { width: 3120 }),
                createCell("Abeka, Littlefox CN", { width: 3900 })
              ]
            }),
            new TableRow({
              children: [
                createCell("Test Prep", { width: 2340, bold: true }),
                createCell("IELTS, TOEFL, SAT/ACT", { width: 3120 }),
                createCell("PlayTT (TEDed IELTS)", { width: 3900 })
              ]
            }),
            new TableRow({
              children: [
                createCell("Arts & Music", { width: 2340, bold: true }),
                createCell("Arts, Music, Crafts", { width: 3120 }),
                createCell("Abeka K4-G5", { width: 3900 })
              ]
            }),
            new TableRow({
              children: [
                createCell("Life Skills", { width: 2340, bold: true }),
                createCell("Bible, Handwriting, Habits", { width: 3120 }),
                createCell("Abeka", { width: 3900 })
              ]
            }),
            new TableRow({
              children: [
                createCell("Stories & Literature", { width: 2340, bold: true }),
                createCell("Fairy tales, Classics, Folk tales", { width: 3120 }),
                createCell("Littlefox EN & CN", { width: 3900 })
              ]
            })
          ]
        }),

        new Paragraph({ children: [new PageBreak()] }),

        // ============ SECTION 3: PROPOSED ARCHITECTURE ============
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [new TextRun("3. PROPOSED ARCHITECTURE")]
        }),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun("3.1. 5 levels of hierarchy")]
        }),

        new Paragraph({
          spacing: { before: 200, after: 200 },
          children: [new TextRun({
            text: "Based on research from Duolingo, Coursera and Khan Academy, the proposed architecture includes 5 hierarchical levels from small to large:",
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
                createCell("Level", { header: true, width: 1800 }),
                createCell("Unit", { header: true, width: 2340 }),
                createCell("Duration", { header: true, width: 1560 }),
                createCell("Content number", { header: true, width: 1560 }),
                createCell("Purpose", { header: true, width: 2100 })
              ]
            }),
            new TableRow({
              children: [
                createCell("Level 5", { width: 1800, bold: true }),
                createCell("Learning Journey\\n(Program/Course)", { width: 2340 }),
                createCell("4-52 weeks", { width: 1560 }),
                createCell("Many weekly plans", { width: 1560 }),
                createCell("Accomplish long-term goals", { width: 2100 })
              ]
            }),
            new TableRow({
              children: [
                createCell("Level 4", { width: 1800, bold: true }),
                createCell("Weekly Plan\\n(Week)", { width: 2340 }),
                createCell("5-15 hours", { width: 1560 }),
                createCell("5-7 daily plans", { width: 1560 }),
                createCell("Progress control", { width: 2100 })
              ]
            }),
            new TableRow({
              children: [
                createCell("Level 3", { width: 1800, bold: true }),
                createCell("Daily Plan\\n(Date)", { width: 2340 }),
                createCell("10-45 minutes", { width: 1560 }),
                createCell("3-7 lessons", { width: 1560 }),
                createCell("Appropriate cognitive load", { width: 2100 })
              ]
            }),
            new TableRow({
              children: [
                createCell("Level 2", { width: 1800, bold: true }),
                createCell("Lesson\\n(Lesson)", { width: 2340 }),
                createCell("15-60 minutes", { width: 1560 }),
                createCell("3-7 videos", { width: 1560 }),
                createCell("Full concept coverage", { width: 2100 })
              ]
            }),
            new TableRow({
              children: [
                createCell("Level 1", { width: 1800, bold: true }),
                createCell("Video\\n(Basic unit)", { width: 2340 }),
                createCell("3-15 minutes", { width: 1560 }),
                createCell("1", { width: 1560 }),
                createCell("Streaming & tracking", { width: 2100 })
              ]
            })
          ]
        }),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300 },
          children: [new TextRun("3.2. Data model")]
        }),

        new Paragraph({
          spacing: { before: 200, after: 200 },
          children: [new TextRun({
            text: "Main Entity Relationship (ER Diagram - Textual Representation):",
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
          children: [new TextRun("3.3. System components")]
        }),

        // System components table
        new Table({
          columnWidths: [3120, 3120, 3120],
          rows: [
            new TableRow({
              tableHeader: true,
              children: [
                createCell("Ingredients", { header: true, width: 3120 }),
                createCell("Technology", { header: true, width: 3120 }),
                createCell("Mission", { header: true, width: 3120 })
              ]
            }),
            new TableRow({
              children: [
                createCell("Content Service", { width: 3120, bold: true }),
                createCell("Node.js/FastAPI", { width: 3120 }),
                createCell("CRUD for content hierarchy", { width: 3120 })
              ]
            }),
            new TableRow({
              children: [
                createCell("Progress Service", { width: 3120, bold: true }),
                createCell("Node.js", { width: 3120 }),
                createCell("Track completions, streaks, XP", { width: 3120 })
              ]
            }),
            new TableRow({
              children: [
                createCell("Sequencing Service", { width: 3120, bold: true }),
                createCell("Python", { width: 3120 }),
                createCell("Create adaptive learning paths", { width: 3120 })
              ]
            }),
            new TableRow({
              children: [
                createCell("Spaced Repetition", { width: 3120, bold: true }),
                createCell("Python", { width: 3120 }),
                createCell("HLR algorithm, schedule review", { width: 3120 })
              ]
            }),
            new TableRow({
              children: [
                createCell("Recommendation Engine", { width: 3120, bold: true }),
                createCell("ML/Python", { width: 3120 }),
                createCell("Recommend cross-source content", { width: 3120 })
              ]
            }),
            new TableRow({
              children: [
                createCell("Parent Dashboard", { width: 3120, bold: true }),
                createCell("React/Next.js", { width: 3120 }),
                createCell("Display progress and control", { width: 3120 })
              ]
            }),
            new TableRow({
              children: [
                createCell("Child Interface", { width: 3120, bold: true }),
                createCell("React/Expo", { width: 3120 }),
                createCell("Learning experiences, gamification", { width: 3120 })
              ]
            })
          ]
        }),

        new Paragraph({ children: [new PageBreak()] }),

        // ============ SECTION 4: LEARNING PATH STRATEGY ============
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [new TextRun("4. LEARNING PATH STRATEGY")]
        }),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun("4.1. 4 main types of learning paths")]
        }),

        // Path types table
        new Table({
          columnWidths: [2340, 2340, 1560, 1560, 1560],
          rows: [
            new TableRow({
              tableHeader: true,
              children: [
                createCell("Type Path", { header: true, width: 2340 }),
                createCell("Primary source", { header: true, width: 2340 }),
                createCell("Age", { header: true, width: 1560 }),
                createCell("Duration", { header: true, width: 1560 }),
                createCell("Video", { header: true, width: 1560 })
              ]
            }),
            new TableRow({
              children: [
                createCell("K-12 Curriculum", { width: 2340, bold: true }),
                createCell("Abeka", { width: 2340 }),
                createCell("3-18", { width: 1560 }),
                createCell("14 years", { width: 1560 }),
                createCell("20,195", { width: 1560 })
              ]
            }),
            new TableRow({
              children: [
                createCell("English Stories", { width: 2340, bold: true }),
                createCell("Littlefox EN", { width: 2340 }),
                createCell("3-15", { width: 1560 }),
                createCell("9 levels", { width: 1560 }),
                createCell("8,718", { width: 1560 })
              ]
            }),
            new TableRow({
              children: [
                createCell("IELTS Preparation", { width: 2340, bold: true }),
                createCell("PlayTT", { width: 2340 }),
                createCell("14+", { width: 1560 }),
                createCell("12-16 weeks", { width: 1560 }),
                createCell("215+", { width: 1560 })
              ]
            }),
            new TableRow({
              children: [
                createCell("Chinese Learning", { width: 2340, bold: true }),
                createCell("Littlefox CN", { width: 2340 }),
                createCell("6-18", { width: 1560 }),
                createCell("5 levels", { width: 1560 }),
                createCell("1,983", { width: 1560 })
              ]
            })
          ]
        }),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300 },
          children: [new TextRun("4.2. 5 detailed sample learning journeys")]
        }),

        new Paragraph({
          heading: HeadingLevel.HEADING_3,
          children: [new TextRun("Journey 1: Kindergarten Readiness (4-5 years old)")]
        }),

        new Paragraph({
          spacing: { before: 100, after: 100 },
          children: [new TextRun({
            text: "Duration: 36 weeks | Time/day: 30-45 minutes | Source: Abeka K4-K5 + Littlefox L1",
            size: 22,
            color: COLORS.secondary,
            font: "Arial"
          })]
        }),

        createBullet("Phase 1 (Weeks 1-12): Foundation - Abeka K4 + Littlefox L1", "bullet-section4"),
        createBullet("Phase 2 (Weeks 13-24): Transition - K4→K5 + L1→L2", "bullet-section4"),
        createBullet("Phase 3 (Weeks 25-36): Ready - Abeka K5 + Littlefox L2", "bullet-section4"),

        new Paragraph({
          spacing: { before: 100, after: 200 },
          children: [new TextRun({
            text: "Results: Ready to read and write, basic math, 200+ vocabulary",
            bold: true,
            size: 22,
            font: "Arial"
          })]
        }),

        new Paragraph({
          heading: HeadingLevel.HEADING_3,
          children: [new TextRun("Journey 2: English Literature Lover (8-12 years old)")]
        }),

        new Paragraph({
          spacing: { before: 100, after: 100 },
          children: [new TextRun({
            text: "Duration: 52 weeks | Time/day: 45-60 minutes | Source: Littlefox L3-L6 + Abeka ELA G3-G6",
            size: 22,
            color: COLORS.secondary,
            font: "Arial"
          })]
        }),

        createBullet("Semester 1: Fairy Tales & Fables - Cinderella, Snow White, Aesop", "bullet-section4"),
        createBullet("Semester 2: Classic literature - Shakespeare, Jane Eyre, Sherlock Holmes", "bullet-section4"),

        new Paragraph({
          spacing: { before: 100, after: 200 },
          children: [new TextRun({
            text: "Result: 5,000+ vocabulary, literary analysis skills",
            bold: true,
            size: 22,
            font: "Arial"
          })]
        }),

        new Paragraph({
          heading: HeadingLevel.HEADING_3,
          children: [new TextRun("Journey 3: Building a STEM foundation (9-13 years old)")]
        }),

        new Paragraph({
          spacing: { before: 100, after: 100 },
          children: [new TextRun({
            text: "Duration: 48 weeks | Time/day: 60-75 minutes | Source: Abeka G4-G7 + PlayTT",
            size: 22,
            color: COLORS.secondary,
            font: "Arial"
          })]
        }),

        createBullet("Year 1: Advanced Math + Basic Science - Fractions, geometry, biology", "bullet-section4"),
        createBullet("Year 2: Algebra + Intensive Science - Algebra I, cells, genetics", "bullet-section4"),

        new Paragraph({
          spacing: { before: 100, after: 200 },
          children: [new TextRun({
            text: "Results: Passed Algebra I, biology and earth science foundation",
            bold: true,
            size: 22,
            font: "Arial"
          })]
        }),

        new Paragraph({
          heading: HeadingLevel.HEADING_3,
          children: [new TextRun("Journey 4: Achieve IELTS Band 7.0 (16-18 years old)")]
        }),

        new Paragraph({
          spacing: { before: 100, after: 100 },
          children: [new TextRun({
            text: "Duration: 16 weeks (high intensity) | Time/day: 2-3 hours | Source: PlayTT IELTS + Littlefox L7-L9",
            size: 22,
            color: COLORS.secondary,
            font: "Arial"
          })]
        }),

        createBullet("Phase 1 (Weeks 1-4): Foundation - Listening, reading, writing Task 1, speaking", "bullet-section4"),
        createBullet("Phase 2 (Weeks 5-8): Skill Development - Advanced Strategies", "bullet-section4"),
        createBullet("Phase 3 (Weeks 9-12): Advanced techniques - Mock tests, focused writing", "bullet-section4"),
        createBullet("Phase 4 (Weeks 13-16): Perfection - Practice weak points, simulate exams", "bullet-section4"),

        new Paragraph({
          spacing: { before: 100, after: 200 },
          children: [new TextRun({
            text: "Result: IELTS Band 7.0+, 2,000+ academic vocabulary",
            bold: true,
            size: 22,
            font: "Arial"
          })]
        }),

        new Paragraph({
          heading: HeadingLevel.HEADING_3,
          children: [new TextRun("Journey 5: Bilingual Scholar (10-14 years old)")]
        }),

        new Paragraph({
          spacing: { before: 100, after: 100 },
          children: [new TextRun({
            text: "Duration: 40 weeks | Time/day: 90 minutes (60 English + 30 Chinese) | Source: Abeka G5-G7 + Littlefox CN L2-L4",
            size: 22,
            color: COLORS.secondary,
            font: "Arial"
          })]
        }),

        createBullet("Semester 1: Foundation - Parallel Abeka G5 and Littlefox CN L2", "bullet-section4"),
        createBullet("Semester 2: Advanced - Abeka G6-G7 and Littlefox CN L3-L4", "bullet-section4"),

        new Paragraph({
          spacing: { before: 100, after: 200 },
          children: [new TextRun({
            text: "Result: 1,500+ Chinese characters, equivalent to HSK 3-4, bilingual ability",
            bold: true,
            size: 22,
            font: "Arial"
          })]
        }),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun("4.3. Power integration matrix")]
        }),

        // Integration matrix table
        new Table({
          columnWidths: [3120, 3120, 3120],
          rows: [
            new TableRow({
              tableHeader: true,
              children: [
                createCell("Primary source", { header: true, width: 3120 }),
                createCell("Additional resources", { header: true, width: 3120 }),
                createCell("Integration purpose", { header: true, width: 3120 })
              ]
            }),
            new TableRow({
              children: [
                createCell("Abeka Math", { width: 3120 }),
                createCell("Numberblocks (PlayTT)", { width: 3120 }),
                createCell("Intuitive math concepts", { width: 3120 })
              ]
            }),
            new TableRow({
              children: [
                createCell("Abeka Reading comprehension", { width: 3120 }),
                createCell("Littlefox EN", { width: 3120 }),
                createCell("Extensive reading practice", { width: 3120 })
              ]
            }),
            new TableRow({
              children: [
                createCell("Abeka Science", { width: 3120 }),
                createCell("Littlefox L3-L4", { width: 3120 }),
                createCell("Science-themed stories", { width: 3120 })
              ]
            }),
            new TableRow({
              children: [
                createCell("PlayTT IELTS", { width: 3120 }),
                createCell("Littlefox L6-L9", { width: 3120 }),
                createCell("Expand academic vocabulary", { width: 3120 })
              ]
            }),
            new TableRow({
              children: [
                createCell("Littlefox CN", { width: 3120 }),
                createCell("Abeka Writes", { width: 3120 }),
                createCell("Practice writing Chinese characters", { width: 3120 })
              ]
            })
          ]
        }),

        new Paragraph({ children: [new PageBreak()] }),

        // ============ SECTION 5: IMPLEMENTATION PLAN ============
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [new TextRun("5. IMPLEMENTATION PLAN")]
        }),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun("5.1. 4 phase roadmap (24 weeks)")]
        }),

        // Implementation phases table
        new Table({
          columnWidths: [1800, 2340, 2340, 2880],
          rows: [
            new TableRow({
              tableHeader: true,
              children: [
                createCell("Phase", { header: true, width: 1800 }),
                createCell("Time", { header: true, width: 2340 }),
                createCell("Focus", { header: true, width: 2340 }),
                createCell("Deliverable", { header: true, width: 2880 })
              ]
            }),
            new TableRow({
              children: [
                createCell("Phase 1", { width: 1800, bold: true }),
                createCell("Weeks 1-5", { width: 2340 }),
                createCell("Platform - Schema DB, Content Mapping", { width: 2340 }),
                createCell("Content hierarchy API works", { width: 2880 })
              ]
            }),
            new TableRow({
              children: [
                createCell("Phase 2", { width: 1800, bold: true }),
                createCell("Week 6-11", { width: 2340 }),
                createCell("Core features - Progress, Sequencing", { width: 2340 }),
                createCell("Students follow the path, parents see progress", { width: 2880 })
              ]
            }),
            new TableRow({
              children: [
                createCell("Phase 3", { width: 1800, bold: true }),
                createCell("Week 12-18", { width: 2340 }),
                createCell("Smart - HLR, Recommendations", { width: 2340 }),
                createCell("The system adapts to student needs", { width: 2880 })
              ]
            }),
            new TableRow({
              children: [
                createCell("Phase 4", { width: 1800, bold: true }),
                createCell("Week 19-24", { width: 2340 }),
                createCell("Expand - Mobile, Analytics", { width: 2340 }),
                createCell("Comprehensive learning platform", { width: 2880 })
              ]
            })
          ]
        }),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300 },
          children: [new TextRun("5.2. Recommended technology")]
        }),

        // Technology stack table
        new Table({
          columnWidths: [2340, 3120, 3900],
          rows: [
            new TableRow({
              tableHeader: true,
              children: [
                createCell("Class", { header: true, width: 2340 }),
                createCell("Technology", { header: true, width: 3120 }),
                createCell("Reason for selection", { header: true, width: 3900 })
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
                createCell("HLR algorithm, recommendations", { width: 3900 })
              ]
            })
          ]
        }),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300 },
          children: [new TextRun("5.3. Successful KPIs and metrics")]
        }),

        // KPI table
        new Table({
          columnWidths: [2340, 1560, 1560, 1560, 2340],
          rows: [
            new TableRow({
              tableHeader: true,
              children: [
                createCell("Index", { header: true, width: 2340 }),
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
                createCell("Student activities", { width: 2340 }),
                createCell("0", { width: 1560, alignment: AlignmentType.CENTER }),
                createCell("100", { width: 1560, alignment: AlignmentType.CENTER }),
                createCell("500", { width: 1560, alignment: AlignmentType.CENTER }),
                createCell("5,000+", { width: 2340, alignment: AlignmentType.CENTER })
              ]
            }),
            new TableRow({
              children: [
                createCell("Time/session (TB)", { width: 2340 }),
                createCell("N/A", { width: 1560, alignment: AlignmentType.CENTER }),
                createCell("15 minutes", { width: 1560, alignment: AlignmentType.CENTER }),
                createCell("25 minutes", { width: 1560, alignment: AlignmentType.CENTER }),
                createCell("35 minutes", { width: 2340, alignment: AlignmentType.CENTER })
              ]
            }),
            new TableRow({
              children: [
                createCell("Completion rate", { width: 2340 }),
                createCell("N/A", { width: 1560, alignment: AlignmentType.CENTER }),
                createCell("40%", { width: 1560, alignment: AlignmentType.CENTER }),
                createCell("55%", { width: 1560, alignment: AlignmentType.CENTER }),
                createCell("80%", { width: 2340, alignment: AlignmentType.CENTER })
              ]
            }),
            new TableRow({
              children: [
                createCell("Parent interaction", { width: 2340 }),
                createCell("0%", { width: 1560, alignment: AlignmentType.CENTER }),
                createCell("30%", { width: 1560, alignment: AlignmentType.CENTER }),
                createCell("50%", { width: 1560, alignment: AlignmentType.CENTER }),
                createCell("85%", { width: 2340, alignment: AlignmentType.CENTER })
              ]
            })
          ]
        }),

        new Paragraph({ children: [new PageBreak()] }),

        // ============ SECTION 6: CONCLUSION & RECOMMENDATIONS ============
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [new TextRun("6. CONCLUSION & SUGGESTIONS")]
        }),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun("6.1. Summary of core values")]
        }),

        createBullet("Convert 36,360 videos from static library into dynamic learning system", "bullet-section6"),
        createBullet("5 levels of hierarchy (Video → Lesson → Daily → Weekly → Journey) with full tracking", "bullet-section6"),
        createBullet("4 main types of learning paths serving diverse needs: K-12, Stories, IELTS, Chinese", "bullet-section6"),
        createBullet("Cross-source integration takes full advantage of 6 existing content sources", "bullet-section6"),
        createBullet("Adaptive learning with HLR spaced repetition and recommendation engine", "bullet-section6"),
        createBullet("24-week roadmap from MVP to full launch with clear metrics", "bullet-section6"),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300 },
          children: [new TextRun("6.2. Next steps")]
        }),

        new Paragraph({
          heading: HeadingLevel.HEADING_3,
          children: [new TextRun("Immediately (Week 1)")]
        }),

        createBullet("Confirm and approve database schema designs", "bullet-section6"),
        createBullet("Build proof of concept: map 100 Abeka lessons to new hierarchy", "bullet-section6"),
        createBullet("Set up development environment and CI/CD pipeline", "bullet-section6"),

        new Paragraph({
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 200 },
          children: [new TextRun("Short-term (Weeks 2-5)")]
        }),

        createBullet("Complete Phase 1: Database Schema + Content Mapping Layer", "bullet-section6"),
        createBullet("Implement CRUD APIs for learning paths", "bullet-section6"),
        createBullet("Testing with the first 1,000 videos", "bullet-section6"),

        new Paragraph({
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 200 },
          children: [new TextRun("Mid-term (Weeks 6-18)")]
        }),

        createBullet("Build Progress Tracking and Path Sequencing", "bullet-section6"),
        createBullet("Developing Parent Dashboard v1", "bullet-section6"),
        createBullet("Implement Spaced Repetition (HLR algorithm)", "bullet-section6"),
        createBullet("Recommendation Engine integration", "bullet-section6"),

        new Paragraph({
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 200 },
          children: [new TextRun("Long-term (Weeks 19-24+)")]
        }),

        createBullet("Optimized performance for 36K+ videos", "bullet-section6"),
        createBullet("Launch mobile learning app", "bullet-section6"),
        createBullet("Comprehensive analytics and reporting", "bullet-section6"),
        createBullet("Expanded to 5,000+ active students", "bullet-section6"),

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
                        text: "STRATEGIC DOCUMENT",
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
                        text: "From 36,360 videos to smart learning system",
                        size: 22,
                        color: COLORS.gray,
                        font: "Arial"
                      })]
                    }),
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      spacing: { before: 100, after: 200 },
                      children: [new TextRun({
                        text: "Prepared by: AI Research & Planning Team | Date: March 31, 2026",
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
