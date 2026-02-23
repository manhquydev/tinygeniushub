"use client";

import { useState } from "react";
import { Copy, Facebook, Link2, Share2 } from "lucide-react";

export function BlogShare({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);

  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
  const twitterUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
        <Share2 size={16} /> Chia sẻ bài viết
      </p>
      <div className="flex flex-wrap gap-2">
        <a
          href={facebookUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          <Facebook size={16} /> Facebook
        </a>
        <a
          href={twitterUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          <Link2 size={16} /> X
        </a>
        <button
          type="button"
          onClick={copyLink}
          className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          <Copy size={16} /> {copied ? "Đã sao chép!" : "Sao chép link"}
        </button>
      </div>
    </div>
  );
}

