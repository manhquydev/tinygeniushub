import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

/** Generate a PDF certificate for course completion.
 *  Returns the raw PDF bytes as Uint8Array */
export async function generateCertificate(params: {
  courseTitle: string;
  completedAt: Date;
}): Promise<Uint8Array> {
  const { courseTitle, completedAt } = params;

  const pdfDoc = await PDFDocument.create();
  // A4 landscape: 842 x 595 pt
  const page = pdfDoc.addPage([842, 595]);
  const { width, height } = page.getSize();

  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const borderMargin = 24;
  const borderColor = rgb(0.2, 0.4, 0.7);
  const textColor = rgb(0.1, 0.1, 0.1);
  const accentColor = rgb(0.2, 0.4, 0.7);

  // Outer border
  page.drawRectangle({
    x: borderMargin,
    y: borderMargin,
    width: width - borderMargin * 2,
    height: height - borderMargin * 2,
    borderColor,
    borderWidth: 3,
    color: rgb(0.97, 0.97, 1),
  });

  // Inner border
  page.drawRectangle({
    x: borderMargin + 8,
    y: borderMargin + 8,
    width: width - (borderMargin + 8) * 2,
    height: height - (borderMargin + 8) * 2,
    borderColor: accentColor,
    borderWidth: 1,
  });

  // Title
  const title = "CHỨNG CHỈ HOÀN THÀNH KHÓA HỌC";
  const titleSize = 26;
  const titleWidth = boldFont.widthOfTextAtSize(title, titleSize);
  page.drawText(title, {
    x: (width - titleWidth) / 2,
    y: height - 110,
    size: titleSize,
    font: boldFont,
    color: accentColor,
  });

  // Subtitle
  const subtitle = "Được cấp cho phụ huynh của bé nhà bạn";
  const subtitleSize = 14;
  const subtitleWidth = regularFont.widthOfTextAtSize(subtitle, subtitleSize);
  page.drawText(subtitle, {
    x: (width - subtitleWidth) / 2,
    y: height - 150,
    size: subtitleSize,
    font: regularFont,
    color: textColor,
  });

  // Decorative line
  page.drawLine({
    start: { x: 120, y: height - 170 },
    end: { x: width - 120, y: height - 170 },
    thickness: 1.5,
    color: accentColor,
  });

  // Course name label
  const courseLabel = "đã hoàn thành khóa học";
  const courseLabelSize = 13;
  const courseLabelWidth = regularFont.widthOfTextAtSize(courseLabel, courseLabelSize);
  page.drawText(courseLabel, {
    x: (width - courseLabelWidth) / 2,
    y: height - 220,
    size: courseLabelSize,
    font: regularFont,
    color: textColor,
  });

  // Course title
  const courseTitleSize = 20;
  const courseTitleWidth = boldFont.widthOfTextAtSize(courseTitle, courseTitleSize);
  page.drawText(courseTitle, {
    x: (width - courseTitleWidth) / 2,
    y: height - 260,
    size: courseTitleSize,
    font: boldFont,
    color: textColor,
  });

  // Completion date
  const dateStr = completedAt.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const dateLabel = `Ngày hoàn thành: ${dateStr}`;
  const dateLabelSize = 12;
  const dateLabelWidth = regularFont.widthOfTextAtSize(dateLabel, dateLabelSize);
  page.drawText(dateLabel, {
    x: (width - dateLabelWidth) / 2,
    y: height - 310,
    size: dateLabelSize,
    font: regularFont,
    color: textColor,
  });

  // Site URL
  const siteUrl = "tinygeniushubvn.tech";
  const siteUrlSize = 11;
  const siteUrlWidth = regularFont.widthOfTextAtSize(siteUrl, siteUrlSize);
  page.drawText(siteUrl, {
    x: (width - siteUrlWidth) / 2,
    y: borderMargin + 30,
    size: siteUrlSize,
    font: regularFont,
    color: accentColor,
  });

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}
