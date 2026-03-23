const BLACKLIST_KEYWORDS = [
  "buy now",
  "click here",
  "free money",
  "casino",
  "viagra",
  "crypto trading",
  "earn money fast",
];

const SPAM_NAME_PATTERN = /^[a-z]+\d{3,}$/i;

export const SPAM_THRESHOLD = 70;

export function countUrls(content: string): number {
  return content.match(/https?:\/\//gi)?.length ?? 0;
}

type CalculateSpamScoreInput = {
  content: string;
  authorName: string;
  urlCount: number;
  recentCommentsByIp: number;
};

export function calculateSpamScore(input: CalculateSpamScoreInput): number {
  let score = 0;

  if (input.urlCount > 2) {
    score += 30;
  }

  const upperChars = input.content.match(/[A-Z]/g)?.length ?? 0;
  const upperRatio = upperChars / Math.max(input.content.length, 1);
  if (upperRatio > 0.5 && input.content.length > 30) {
    score += 20;
  }

  const lowerContent = input.content.toLowerCase();
  if (BLACKLIST_KEYWORDS.some((keyword) => lowerContent.includes(keyword))) {
    score += 15;
  }

  if (input.content.length < 20) {
    score += 10;
  }

  if (input.recentCommentsByIp > 3) {
    score += 10;
  }

  if (SPAM_NAME_PATTERN.test(input.authorName)) {
    score += 15;
  }

  return Math.min(score, 100);
}
