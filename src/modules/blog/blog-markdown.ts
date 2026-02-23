import { remark } from "remark";
import remarkGfm from "remark-gfm";
import remarkHtml from "remark-html";
import slugify from "slugify";

export async function renderMarkdown(markdown: string): Promise<string> {
  const result = await remark().use(remarkGfm).use(remarkHtml).process(markdown);
  return String(result);
}

export function calculateReadingTime(text: string): number {
  const words = text
    .trim()
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word.length > 0).length;

  return Math.max(1, Math.ceil(words / 200));
}

export function extractToc(markdown: string): Array<{ id: string; text: string; level: number }> {
  const lines = markdown.split(/\r?\n/);

  return lines
    .map((line) => line.match(/^(#{2,6})\s+(.+)$/))
    .filter((match): match is RegExpMatchArray => match !== null)
    .map((match) => {
      const headingText = match[2].trim();
      return {
        id: slugify(headingText, { lower: true, strict: true, locale: "vi" }),
        text: headingText,
        level: match[1].length,
      };
    });
}

