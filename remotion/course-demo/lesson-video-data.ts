import type {
  MascotVariant,
  MascotSequenceStep,
} from "../../src/components/mascot/types";

export interface VideoSection {
  type: "intro" | "teach" | "activity" | "celebrate" | "outro";
  durationMs: number;
  label: string;
  sublabel?: string;
  mascotSequence: MascotSequenceStep[];
}

export interface LessonVideoData {
  id: string;
  title: string;
  objective: string;
  mascotVariant: MascotVariant;
  durationSeconds: number;
  sections: VideoSection[];
}

export const lessonVideoData: LessonVideoData[] = [
  {
    id: "lesson-01",
    title: "Âm /a/ và /m/",
    objective: "Nhận biết và phát âm đúng âm /a/ và /m/",
    mascotVariant: "big",
    durationSeconds: 28,
    sections: [
      {
        type: "intro",
        durationMs: 3000,
        label: "Bài 1: Âm /a/ và /m/",
        sublabel: "Cùng học với Cú Mẹ nhé!",
        mascotSequence: [
          { state: "happy", gesture: "waving", duration: 3000 },
        ],
      },
      {
        type: "teach",
        durationMs: 10000,
        label: "Học âm /a/",
        sublabel: "Miệng mở rộng, phát âm: A - A - A",
        mascotSequence: [
          { state: "idle", gesture: "pointing", actionProp: "flashcard", duration: 4000 },
          { state: "thinking", gesture: "nodding", actionProp: "flashcard", duration: 3000 },
          { state: "happy", gesture: "raise-hand", actionProp: "flashcard", duration: 3000 },
        ],
      },
      {
        type: "activity",
        durationMs: 9000,
        label: "Thực hành",
        sublabel: "Con hãy lặp lại theo Cú Mẹ: /a/ /m/ /am/",
        mascotSequence: [
          { state: "playful", gesture: "clapping", duration: 3000 },
          { state: "excited", gesture: "nodding", actionProp: "flashcard", duration: 3000 },
          { state: "proud", gesture: "raise-hand", duration: 3000 },
        ],
      },
      {
        type: "celebrate",
        durationMs: 3000,
        label: "Xuất sắc!",
        sublabel: "Con đã học được âm /a/ và /m/",
        mascotSequence: [
          { state: "celebrating", gesture: "clapping", duration: 3000 },
        ],
      },
      {
        type: "outro",
        durationMs: 3000,
        label: "Hẹn gặp lại!",
        mascotSequence: [
          { state: "happy", gesture: "waving", duration: 3000 },
        ],
      },
    ],
  },
  {
    id: "lesson-02",
    title: "Điền chữ CVC",
    objective: "Luyện tập điền chữ vào mẫu phụ âm - nguyên âm - phụ âm",
    mascotVariant: "sister",
    durationSeconds: 30,
    sections: [
      {
        type: "intro",
        durationMs: 3000,
        label: "Bài 2: Điền chữ CVC",
        sublabel: "Cú Chị hướng dẫn con nhé!",
        mascotSequence: [
          { state: "happy", gesture: "waving", duration: 3000 },
        ],
      },
      {
        type: "teach",
        durationMs: 11000,
        label: "Cấu trúc CVC",
        sublabel: "C - V - C: phụ âm + nguyên âm + phụ âm",
        mascotSequence: [
          { state: "idle", gesture: "pointing", actionProp: "writing", duration: 4000 },
          { state: "thinking", gesture: "thinking-scratch", actionProp: "writing", duration: 4000 },
          { state: "happy", gesture: "nodding", actionProp: "writing", duration: 3000 },
        ],
      },
      {
        type: "activity",
        durationMs: 10000,
        label: "Điền vào chỗ trống",
        sublabel: "c_t → cat, d_g → dog, b_d → bed",
        mascotSequence: [
          { state: "playful", gesture: "pointing", actionProp: "writing", duration: 4000 },
          { state: "excited", gesture: "raise-hand", duration: 3000 },
          { state: "proud", gesture: "clapping", duration: 3000 },
        ],
      },
      {
        type: "celebrate",
        durationMs: 3000,
        label: "Giỏi lắm!",
        sublabel: "Con đã biết điền chữ CVC rồi!",
        mascotSequence: [
          { state: "celebrating", gesture: "clapping", duration: 3000 },
        ],
      },
      {
        type: "outro",
        durationMs: 3000,
        label: "Hẹn gặp lại!",
        mascotSequence: [
          { state: "love", gesture: "waving", duration: 3000 },
        ],
      },
    ],
  },
  {
    id: "lesson-03",
    title: "Nghe âm /b/",
    objective: "Nhận biết âm /b/ trong các từ tiếng Anh",
    mascotVariant: "dad",
    durationSeconds: 29,
    sections: [
      {
        type: "intro",
        durationMs: 3000,
        label: "Bài 3: Nghe âm /b/",
        sublabel: "Cú Bố cùng con luyện tai nhé!",
        mascotSequence: [
          { state: "happy", gesture: "waving", duration: 3000 },
        ],
      },
      {
        type: "teach",
        durationMs: 10000,
        label: "Âm /b/ nghe như thế nào?",
        sublabel: "Ball - Bus - Book - Baby",
        mascotSequence: [
          { state: "idle", gesture: "pointing", actionProp: "pointing-stick", duration: 4000 },
          { state: "thinking", gesture: "nodding", actionProp: "pointing-stick", duration: 3000 },
          { state: "proud", gesture: "raise-hand", actionProp: "pointing-stick", duration: 3000 },
        ],
      },
      {
        type: "activity",
        durationMs: 10000,
        label: "Con nghe và chọn",
        sublabel: "Từ nào bắt đầu bằng âm /b/?",
        mascotSequence: [
          { state: "playful", gesture: "pointing", duration: 3000 },
          { state: "surprised", gesture: "nodding", duration: 4000 },
          { state: "excited", gesture: "clapping", duration: 3000 },
        ],
      },
      {
        type: "celebrate",
        durationMs: 3000,
        label: "Tuyệt vời!",
        sublabel: "Con đã nhận ra âm /b/ rồi!",
        mascotSequence: [
          { state: "celebrating", gesture: "clapping", duration: 3000 },
        ],
      },
      {
        type: "outro",
        durationMs: 3000,
        label: "Hẹn gặp lại!",
        mascotSequence: [
          { state: "proud", gesture: "waving", duration: 3000 },
        ],
      },
    ],
  },
  {
    id: "lesson-04",
    title: "Vần -at",
    objective: "Đọc và viết các từ có vần -at",
    mascotVariant: "small",
    durationSeconds: 27,
    sections: [
      {
        type: "intro",
        durationMs: 3000,
        label: "Bài 4: Vần -at",
        sublabel: "Cú Con cùng học vần nhé!",
        mascotSequence: [
          { state: "excited", gesture: "waving", duration: 3000 },
        ],
      },
      {
        type: "teach",
        durationMs: 9000,
        label: "Vần -at",
        sublabel: "cat - bat - hat - mat - rat",
        mascotSequence: [
          { state: "idle", gesture: "pointing", actionProp: "flashcard", duration: 3000 },
          { state: "happy", gesture: "nodding", actionProp: "flashcard", duration: 3000 },
          { state: "playful", gesture: "raise-hand", actionProp: "flashcard", duration: 3000 },
        ],
      },
      {
        type: "activity",
        durationMs: 9000,
        label: "Đọc to nào!",
        sublabel: "Con đọc to từng từ: cat, bat, hat",
        mascotSequence: [
          { state: "excited", gesture: "pointing", duration: 3000 },
          { state: "happy", gesture: "clapping", duration: 3000 },
          { state: "proud", gesture: "nodding", duration: 3000 },
        ],
      },
      {
        type: "celebrate",
        durationMs: 3000,
        label: "Xuất sắc!",
        sublabel: "Con đọc vần -at rất giỏi!",
        mascotSequence: [
          { state: "celebrating", gesture: "clapping", duration: 3000 },
        ],
      },
      {
        type: "outro",
        durationMs: 3000,
        label: "Hẹn gặp lại!",
        mascotSequence: [
          { state: "happy", gesture: "waving", duration: 3000 },
        ],
      },
    ],
  },
  {
    id: "lesson-05",
    title: "Âm ngắn /e/",
    objective: "Nhận biết và phát âm chính xác nguyên âm ngắn /e/",
    mascotVariant: "duo",
    durationSeconds: 32,
    sections: [
      {
        type: "intro",
        durationMs: 3000,
        label: "Bài 5: Âm ngắn /e/",
        sublabel: "Cú Mẹ và Cú Em dạy con nhé!",
        mascotSequence: [
          { state: "happy", gesture: "waving", duration: 3000 },
        ],
      },
      {
        type: "teach",
        durationMs: 12000,
        label: "Nguyên âm /e/",
        sublabel: "egg - bed - red - ten - hen",
        mascotSequence: [
          { state: "idle", gesture: "pointing", actionProp: "flashcard", duration: 4000 },
          { state: "thinking", gesture: "nodding", duration: 4000 },
          { state: "excited", gesture: "raise-hand", actionProp: "flashcard", duration: 4000 },
        ],
      },
      {
        type: "activity",
        durationMs: 11000,
        label: "Tìm từ có âm /e/",
        sublabel: "egg, apple, bed, cat, ten → chọn từ có âm /e/",
        mascotSequence: [
          { state: "playful", gesture: "thinking-scratch", duration: 4000 },
          { state: "surprised", gesture: "pointing", duration: 4000 },
          { state: "celebrating", gesture: "clapping", duration: 3000 },
        ],
      },
      {
        type: "celebrate",
        durationMs: 3000,
        label: "Tuyệt lắm!",
        sublabel: "Con đã thuộc âm /e/ rồi đó!",
        mascotSequence: [
          { state: "celebrating", gesture: "clapping", duration: 3000 },
        ],
      },
      {
        type: "outro",
        durationMs: 3000,
        label: "Hẹn gặp lại!",
        mascotSequence: [
          { state: "love", gesture: "waving", duration: 3000 },
        ],
      },
    ],
  },
  {
    id: "lesson-06",
    title: "Blends và Digraphs",
    objective: "Phân biệt blends (ch, sh, th) và digraphs (bl, cl, fl)",
    mascotVariant: "dad",
    durationSeconds: 33,
    sections: [
      {
        type: "intro",
        durationMs: 3000,
        label: "Bài 6: Blends và Digraphs",
        sublabel: "Cú Bố giải thích sự khác biệt!",
        mascotSequence: [
          { state: "proud", gesture: "waving", duration: 3000 },
        ],
      },
      {
        type: "teach",
        durationMs: 12000,
        label: "Blends: 2 âm ghép lại",
        sublabel: "bl → black, cl → clock, fl → flag",
        mascotSequence: [
          { state: "idle", gesture: "pointing", actionProp: "magnifying-glass", duration: 4000 },
          { state: "thinking", gesture: "thinking-scratch", actionProp: "magnifying-glass", duration: 4000 },
          { state: "happy", gesture: "nodding", actionProp: "magnifying-glass", duration: 4000 },
        ],
      },
      {
        type: "activity",
        durationMs: 12000,
        label: "Digraphs: 2 chữ = 1 âm mới",
        sublabel: "ch → chair, sh → ship, th → three",
        mascotSequence: [
          { state: "excited", gesture: "pointing", actionProp: "magnifying-glass", duration: 4000 },
          { state: "playful", gesture: "raise-hand", duration: 4000 },
          { state: "proud", gesture: "clapping", duration: 4000 },
        ],
      },
      {
        type: "celebrate",
        durationMs: 3000,
        label: "Thông minh quá!",
        sublabel: "Con phân biệt được blends và digraphs!",
        mascotSequence: [
          { state: "celebrating", gesture: "clapping", duration: 3000 },
        ],
      },
      {
        type: "outro",
        durationMs: 3000,
        label: "Hẹn gặp lại!",
        mascotSequence: [
          { state: "proud", gesture: "waving", duration: 3000 },
        ],
      },
    ],
  },
  {
    id: "lesson-07",
    title: "Sight Words",
    objective: "Nhận diện ngay lập tức các sight words phổ biến",
    mascotVariant: "big",
    durationSeconds: 34,
    sections: [
      {
        type: "intro",
        durationMs: 3000,
        label: "Bài 7: Sight Words",
        sublabel: "Cả nhà cùng ôn tổng kết!",
        mascotSequence: [
          { state: "excited", gesture: "waving", duration: 3000 },
        ],
      },
      {
        type: "teach",
        durationMs: 12000,
        label: "Sight Words là gì?",
        sublabel: "the, a, and, is, it, in, on, at, to, of",
        mascotSequence: [
          { state: "idle", gesture: "pointing", actionProp: "trophy", duration: 4000 },
          { state: "happy", gesture: "nodding", actionProp: "flashcard", duration: 4000 },
          { state: "proud", gesture: "raise-hand", actionProp: "trophy", duration: 4000 },
        ],
      },
      {
        type: "activity",
        durationMs: 13000,
        label: "Đọc nhanh như chớp!",
        sublabel: "Nhìn và đọc ngay: the - is - and - to - a",
        mascotSequence: [
          { state: "excited", gesture: "clapping", duration: 4000 },
          { state: "playful", gesture: "pointing", actionProp: "trophy", duration: 5000 },
          { state: "celebrating", gesture: "raise-hand", duration: 4000 },
        ],
      },
      {
        type: "celebrate",
        durationMs: 3000,
        label: "Chúc mừng!",
        sublabel: "Con đã hoàn thành khóa học!",
        mascotSequence: [
          { state: "celebrating", gesture: "clapping", actionProp: "trophy", duration: 3000 },
        ],
      },
      {
        type: "outro",
        durationMs: 3000,
        label: "Cảm ơn và hẹn gặp lại!",
        mascotSequence: [
          { state: "love", gesture: "waving", actionProp: "trophy", duration: 3000 },
        ],
      },
    ],
  },
];
