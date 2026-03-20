"use client";

import * as m from "motion/react-m";

interface MusicPropProps {
  target: "big" | "small";
  reducedMotion: boolean;
}

export function MusicProp({ target, reducedMotion }: MusicPropProps) {
  if (target === "big") {
    return (
      <m.g
        initial={{ opacity: 0, y: 2 }}
        animate={reducedMotion ? { opacity: 1 } : { opacity: [0.45, 1, 0.45], y: [0, -5, 0] }}
        transition={reducedMotion ? undefined : { duration: 1.9, ease: "easeInOut", repeat: Infinity }}
      >
        <path d="M 132 72 L 132 106 C 132 113 124 117 118 113 C 114 110 114 104 118 101 C 121 99 126 99 128 101 L 128 76 L 154 69 L 154 98 C 154 105 146 109 140 105 C 136 102 136 96 140 93 C 143 91 148 91 150 93 L 150 66 Z" fill="#312e81" opacity="0.95" />
        <path d="M 252 86 L 252 117 C 252 123 246 127 241 124 C 237 122 237 116 241 113 C 244 111 248 111 250 113 L 250 89 L 272 83 L 272 109 C 272 115 266 119 261 116 C 257 114 257 108 261 105 C 264 103 268 103 270 105 L 270 80 Z" fill="#4338ca" opacity="0.9" />
      </m.g>
    );
  }

  return (
    <m.g
      initial={{ opacity: 0, y: 1 }}
      animate={reducedMotion ? { opacity: 1 } : { opacity: [0.5, 1, 0.5], y: [0, -3, 0] }}
      transition={reducedMotion ? undefined : { duration: 1.8, ease: "easeInOut", repeat: Infinity }}
    >
      <path d="M 174 140 L 174 156 C 174 159 171 161 168 160 C 166 158 166 155 168 154 C 170 153 172 153 173 154 L 173 142 L 184 139 L 184 152 C 184 155 181 157 178 156 C 176 155 176 152 178 151 C 180 150 182 150 183 151 L 183 137 Z" fill="#3730a3" />
      <path d="M 218 148 L 218 163 C 218 166 215 168 212 167 C 210 166 210 163 212 162 C 214 161 216 161 217 162 L 217 150 L 227 147 L 227 160 C 227 163 224 165 221 164 C 219 163 219 160 221 159 C 223 158 225 158 226 159 L 226 145 Z" fill="#4338ca" />
    </m.g>
  );
}
