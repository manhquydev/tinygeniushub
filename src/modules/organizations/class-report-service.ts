import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { format } from "date-fns";
import { getOrgStudentProgress } from "./organization-service";
import { getOrganization } from "./organization-service";

/** Generate an A4 portrait PDF class report for teacher admin. */
export async function generateClassReport(orgId: string, teacherParentId: string): Promise<Uint8Array> {
  const [org, progressRows] = await Promise.all([
    getOrganization(orgId),
    getOrgStudentProgress(orgId, teacherParentId),
  ]);

  const orgName = org?.name ?? orgId;
  const dateStr = format(new Date(), "dd/MM/yyyy");

  const pdfDoc = await PDFDocument.create();
  // A4 portrait: 595 x 842 pt
  const page = pdfDoc.addPage([595, 842]);
  const { width, height } = page.getSize();

  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const margin = 40;
  const accentColor = rgb(0.31, 0.27, 0.9);
  const textColor = rgb(0.1, 0.1, 0.1);
  const lightGray = rgb(0.9, 0.9, 0.9);

  // Header background
  page.drawRectangle({ x: 0, y: height - 70, width, height: 70, color: accentColor });

  // Org name
  page.drawText(orgName, {
    x: margin,
    y: height - 30,
    size: 16,
    font: boldFont,
    color: rgb(1, 1, 1),
  });

  // Report title
  const subtitle = `Báo cáo lớp học — ${dateStr}`;
  page.drawText(subtitle, {
    x: margin,
    y: height - 52,
    size: 11,
    font: regularFont,
    color: rgb(0.9, 0.9, 1),
  });

  // Table headers
  const tableTop = height - 90;
  const colWidths = [120, 120, 100, 80, 95];
  const colHeaders = ["Tên học sinh", "Email phụ huynh", "Bài học (30 ngày)", "Streak (ngày)", "Hoạt động cuối"];
  const rowHeight = 20;

  let x = margin;
  page.drawRectangle({ x: margin, y: tableTop - rowHeight, width: width - margin * 2, height: rowHeight, color: lightGray });

  colHeaders.forEach((header, i) => {
    page.drawText(header, {
      x: x + 4,
      y: tableTop - rowHeight + 6,
      size: 8,
      font: boldFont,
      color: textColor,
    });
    x += colWidths[i];
  });

  // Table rows — flatten children
  let currentY = tableTop - rowHeight * 2;

  for (const student of progressRows) {
    if (student.children.length === 0) {
      // Parent with no children
      if (currentY < margin + 30) break;
      const cols = ["—", student.email, "0", "0", "—"];
      let cx = margin;
      cols.forEach((val, i) => {
        page.drawText(val, { x: cx + 4, y: currentY + 4, size: 8, font: regularFont, color: textColor });
        cx += colWidths[i];
      });
      currentY -= rowHeight;
      continue;
    }

    for (const child of student.children) {
      if (currentY < margin + 30) break;
      const lastActive = child.lastActiveAt ? format(child.lastActiveAt, "dd/MM/yy") : "—";
      const cols = [
        child.nickname.slice(0, 18),
        student.email.slice(0, 20),
        String(child.lessonsCompleted),
        String(child.streakDays),
        lastActive,
      ];
      let cx = margin;
      cols.forEach((val, i) => {
        page.drawText(val, { x: cx + 4, y: currentY + 4, size: 8, font: regularFont, color: textColor });
        cx += colWidths[i];
      });
      currentY -= rowHeight;
    }
  }

  // Footer
  page.drawLine({ start: { x: margin, y: 28 }, end: { x: width - margin, y: 28 }, thickness: 0.5, color: lightGray });
  page.drawText("tinygeniushubvn.tech", {
    x: (width - regularFont.widthOfTextAtSize("tinygeniushubvn.tech", 9)) / 2,
    y: 14,
    size: 9,
    font: regularFont,
    color: rgb(0.5, 0.5, 0.5),
  });

  return pdfDoc.save();
}

