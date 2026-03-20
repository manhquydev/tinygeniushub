"use client";

import type { ReactNode } from "react";

export type KidAvatarId = "basic" | "girl-bow" | "nerdy-glasses" | "sporty-cap" | "astro-helmet";

export interface KidAvatarOption {
  id: KidAvatarId;
  label: string;
  description: string;
  accessory?: ReactNode;
}

export const KID_AVATAR_OPTIONS: KidAvatarOption[] = [
  {
    id: "basic",
    label: "Cáo Con Cơ Bản",
    description: "Phiên bản tiêu chuẩn",
  },
  {
    id: "girl-bow",
    label: "Cáo Con Nơ Hồng",
    description: "Nữ tính, dịu dàng",
    accessory: (
      <g>
        <path d="M 189 133 C 181 126, 172 128, 170 136 C 168 145, 176 150, 186 148 Z" fill="#f472b6" />
        <path d="M 211 133 C 219 126, 228 128, 230 136 C 232 145, 224 150, 214 148 Z" fill="#f472b6" />
        <circle cx="200" cy="142" r="7.5" fill="#ec4899" />
        <circle cx="198.2" cy="140.4" r="1.2" fill="#fce7f3" />
        <path d="M 178 150 C 181 147, 184 147, 187 150" stroke="#7f1d1d" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M 184 149 C 187 146, 190 146, 193 149" stroke="#7f1d1d" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M 207 150 C 210 147, 213 147, 216 150" stroke="#7f1d1d" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M 213 149 C 216 146, 219 146, 222 149" stroke="#7f1d1d" strokeWidth="1.8" strokeLinecap="round" />
      </g>
    ),
  },
  {
    id: "nerdy-glasses",
    label: "Cáo Con Kính Cận",
    description: "Thông minh, ham học",
    accessory: (
      <g>
        <circle cx="186" cy="160" r="12.5" fill="none" stroke="#1e293b" strokeWidth="2.4" />
        <circle cx="214" cy="160" r="12.5" fill="none" stroke="#1e293b" strokeWidth="2.4" />
        <path d="M 198 160 L 202 160" stroke="#1e293b" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M 172 156 L 175 156" stroke="#1e293b" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M 225 156 L 228 156" stroke="#1e293b" strokeWidth="2.2" strokeLinecap="round" />
      </g>
    ),
  },
  {
    id: "sporty-cap",
    label: "Cáo Con Năng Động",
    description: "Mũ lưỡi trai cá tính",
    accessory: (
      <g>
        <path d="M 170 144 C 175 129, 189 122, 201 122 C 214 122, 226 128, 230 143" fill="#f59e0b" />
        <path d="M 170 144 C 178 148, 186 149, 200 149 C 214 149, 222 148, 230 144" fill="#b45309" />
        <path d="M 158 141 C 169 136, 178 134, 188 136 C 180 141, 171 144, 160 145 Z" fill="#1e293b" />
        <rect x="196.5" y="122" width="7" height="8.4" rx="2" fill="#334155" />
      </g>
    ),
  },
  {
    id: "astro-helmet",
    label: "Cáo Con Phi Hành Gia",
    description: "Mơ mộng, khám phá",
    accessory: (
      <g>
        <ellipse cx="200" cy="166.5" rx="35.5" ry="33.5" fill="none" stroke="#e0f2fe" strokeWidth="2.1" />
        <ellipse cx="200" cy="166.5" rx="31.8" ry="30.6" fill="none" stroke="#7dd3fc" strokeWidth="1.2" opacity="0.55" />
        <ellipse cx="189" cy="148" rx="8.8" ry="5" fill="#f8fafc" opacity="0.16" />
      </g>
    ),
  },
];
