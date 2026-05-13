import { Prisma, PrismaClient, TrackCode } from "@prisma/client";
import type { ActivitySpec } from "../../src/modules/content/activity-types";

type SeedActivityType = "MULTIPLE_CHOICE" | "FILL_BLANK" | "LISTEN_IDENTIFY" | "DRAG_SORT";

type LessonSeed = {
  orderNo: number;
  slug: string;
  title: string;
  objective: string;
  estimatedMinutes: number;
  trialEnabled: boolean;
  skillCodes: string[];
  activity: {
    type: SeedActivityType;
    prompt: string;
    spec: ActivitySpec;
  };
};

type UnitSeed = {
  orderNo: number;
  title: string;
  lessons: LessonSeed[];
};

type LevelSeed = {
  orderNo: number;
  title: string;
  units: UnitSeed[];
};

type TrackSeed = {
  code: TrackCode;
  title: string;
  levels: LevelSeed[];
};

type UpsertCounter = {
  created: number;
  updated: number;
};

export type ContentSeedSummary = {
  tracks: UpsertCounter;
  levels: UpsertCounter;
  units: UpsertCounter;
  lessons: UpsertCounter;
  activities: UpsertCounter;
  lessonSkills: { linked: number; skippedMissingSkill: number };
  totals: {
    tracks: number;
    levels: number;
    units: number;
    lessons: number;
    activities: number;
  };
};

function toActivitySpecJson(spec: ActivitySpec): Prisma.InputJsonValue {
  return spec as unknown as Prisma.InputJsonValue;
}

function mapActivityType(type: SeedActivityType): string {
  // Product requirement names this interaction "DRAG_SORT";
  // runtime engine stores sortable activities as "SORT_ORDER".
  if (type === "DRAG_SORT") return "SORT_ORDER";
  return type;
}

function buildOfflineCardMarkdown(seed: LessonSeed): string {
  return [
    `## ${seed.title}`,
    "",
    `**Mục tiêu:** ${seed.objective}`,
    "",
    "**Gợi ý hoạt động offline:**",
    "- Chuẩn bị thẻ từ/thẻ số và đồ vật quen thuộc trong nhà.",
    "- Cho bé làm 2-3 lượt ngắn, mỗi lượt 3-5 phút.",
    "- Khen ngợi nỗ lực và nhắc lại từ khóa cuối buổi.",
  ].join("\n");
}

function buildParentScriptMarkdown(seed: LessonSeed): string {
  return [
    "## Kịch bản đồng hành cho phụ huynh",
    "",
    "1. Mở bài học và cùng bé nghe hướng dẫn đầu bài.",
    `2. Nhấn mạnh mục tiêu: "${seed.objective}".`,
    "3. Khi bé trả lời sai, gợi ý bằng câu hỏi ngắn thay vì đáp án trực tiếp.",
    "4. Kết thúc buổi học bằng 1 câu nhắc lại để bé tự tin.",
  ].join("\n");
}

const TRACKS: TrackSeed[] = [
  {
    code: TrackCode.ENGLISH,
    title: "English Phonics Class 1-2",
    levels: [
      {
        orderNo: 1,
        title: "Lớp 1 - Nền Tảng Phonics",
        units: [
          {
            orderNo: 1,
            title: "Âm và Chữ Cái Cơ Bản",
            lessons: [
              {
                orderNo: 1,
                slug: "phonics-g1-u1-letter-sounds-a-m",
                title: "Âm /a/ và /m/",
                objective: "Bé nhận biết âm đầu của chữ a, m trong từ quen thuộc.",
                estimatedMinutes: 15,
                trialEnabled: true,
                skillCodes: ["PHONICS_LETTER_SOUNDS"],
                activity: {
                  type: "MULTIPLE_CHOICE",
                  prompt: "Chọn từ bắt đầu bằng âm /m/",
                  spec: {
                    type: "MULTIPLE_CHOICE",
                    question: "Từ nào bắt đầu bằng âm /m/?",
                    options: ["moon", "apple", "egg", "orange"],
                    correctIndex: 0,
                    explanation: "moon bắt đầu bằng âm /m/.",
                  },
                },
              },
              {
                orderNo: 2,
                slug: "phonics-g1-u1-fill-cat",
                title: "Điền chữ còn thiếu trong từ CVC",
                objective: "Bé hoàn thiện từ cat bằng chữ cái phù hợp.",
                estimatedMinutes: 15,
                trialEnabled: true,
                skillCodes: ["PHONICS_CVC_SHORT_A"],
                activity: {
                  type: "FILL_BLANK",
                  prompt: "Điền chữ đúng để tạo từ cat",
                  spec: {
                    type: "FILL_BLANK",
                    sentence: "c _ t",
                    answer: "a",
                    hint: "Âm ngắn /a/ nằm ở giữa từ.",
                  },
                },
              },
              {
                orderNo: 3,
                slug: "phonics-g1-u1-listen-begin-b",
                title: "Nghe và chọn từ bắt đầu bằng /b/",
                objective: "Bé nghe và phân biệt âm đầu /b/ trong nhóm từ ngắn.",
                estimatedMinutes: 15,
                trialEnabled: false,
                skillCodes: ["PHONICS_LETTER_SOUNDS"],
                activity: {
                  type: "LISTEN_IDENTIFY",
                  prompt: "Nghe âm và chọn từ đúng",
                  spec: {
                    type: "LISTEN_IDENTIFY",
                    audioUrl: "/audio/lessons/nghe-am-b/kw-ball.mp3",
                    question: "Âm vừa nghe phù hợp với từ nào?",
                    options: ["ball", "sun", "fish", "tree"],
                    correctIndex: 0,
                  },
                },
              },
            ],
          },
          {
            orderNo: 2,
            title: "Từ CVC Âm Ngắn",
            lessons: [
              {
                orderNo: 1,
                slug: "phonics-g1-u2-drag-sort-rhyme-at",
                title: "Sắp xếp nhóm vần -at",
                objective: "Bé sắp xếp đúng thứ tự các từ cùng vần -at.",
                estimatedMinutes: 15,
                trialEnabled: true,
                skillCodes: ["PHONICS_CVC_SHORT_A"],
                activity: {
                  type: "DRAG_SORT",
                  prompt: "Kéo thả để sắp theo vần từ ngắn đến dài",
                  spec: {
                    type: "SORT_ORDER",
                    items: ["bat", "at", "hat", "cat"],
                    correctOrder: [1, 0, 2, 3],
                  },
                },
              },
              {
                orderNo: 2,
                slug: "phonics-g1-u2-short-e-choice",
                title: "Âm ngắn /e/ với bed-red",
                objective: "Bé nhận diện nhóm từ chứa âm ngắn /e/.",
                estimatedMinutes: 15,
                trialEnabled: false,
                skillCodes: ["PHONICS_CVC_SHORT_E"],
                activity: {
                  type: "MULTIPLE_CHOICE",
                  prompt: "Chọn từ có âm /e/",
                  spec: {
                    type: "MULTIPLE_CHOICE",
                    question: "Từ nào có âm ngắn /e/?",
                    options: ["bed", "big", "hot", "cup"],
                    correctIndex: 0,
                    explanation: "bed phát âm âm ngắn /e/.",
                  },
                },
              },
              {
                orderNo: 3,
                slug: "phonics-g1-u2-fill-blank-short-i",
                title: "Điền âm ngắn /i/",
                objective: "Bé hoàn thiện từ sit bằng âm /i/ đúng vị trí.",
                estimatedMinutes: 15,
                trialEnabled: false,
                skillCodes: ["PHONICS_CVC_SHORT_I"],
                activity: {
                  type: "FILL_BLANK",
                  prompt: "Điền chữ cái tạo thành từ sit",
                  spec: {
                    type: "FILL_BLANK",
                    sentence: "s _ t",
                    answer: "i",
                    hint: "Âm ngắn /i/ nằm ở giữa từ.",
                  },
                },
              },
            ],
          },
        ],
      },
      {
        orderNo: 2,
        title: "Lớp 2 - Ghép Âm và Đọc Câu Ngắn",
        units: [
          {
            orderNo: 1,
            title: "Blends và Digraphs",
            lessons: [
              {
                orderNo: 1,
                slug: "phonics-g2-u1-drag-sort-blends",
                title: "Sắp xếp cụm phụ âm đầu",
                objective: "Bé sắp đúng thứ tự blend từ dễ đến khó.",
                estimatedMinutes: 18,
                trialEnabled: false,
                skillCodes: ["PHONICS_BLEND_INITIAL"],
                activity: {
                  type: "DRAG_SORT",
                  prompt: "Kéo thả để sắp xếp các blend theo thứ tự học",
                  spec: {
                    type: "SORT_ORDER",
                    items: ["dr", "bl", "cl", "fl"],
                    correctOrder: [1, 2, 3, 0],
                  },
                },
              },
              {
                orderNo: 2,
                slug: "phonics-g2-u1-listen-sh-ch",
                title: "Nghe và phân biệt sh/ch",
                objective: "Bé phân biệt âm /sh/ và /ch/ qua từ quen thuộc.",
                estimatedMinutes: 18,
                trialEnabled: false,
                skillCodes: ["PHONICS_DIGRAPH_SH", "PHONICS_DIGRAPH_CH"],
                activity: {
                  type: "LISTEN_IDENTIFY",
                  prompt: "Nghe và chọn từ có âm /sh/",
                  spec: {
                    type: "LISTEN_IDENTIFY",
                    audioUrl: "/audio/lessons/dien-chu-cvc/kw-sit.mp3",
                    question: "Từ nào có âm /sh/?",
                    options: ["ship", "chair", "thumb", "drum"],
                    correctIndex: 0,
                  },
                },
              },
              {
                orderNo: 3,
                slug: "phonics-g2-u1-th-choice",
                title: "Âm th trong từ think",
                objective: "Bé nhận biết âm /th/ ở đầu từ think.",
                estimatedMinutes: 18,
                trialEnabled: false,
                skillCodes: ["PHONICS_DIGRAPH_TH"],
                activity: {
                  type: "MULTIPLE_CHOICE",
                  prompt: "Chọn từ bắt đầu bằng /th/",
                  spec: {
                    type: "MULTIPLE_CHOICE",
                    question: "Từ nào bắt đầu bằng âm /th/?",
                    options: ["think", "ship", "cat", "blue"],
                    correctIndex: 0,
                    explanation: "think mở đầu bằng âm /th/.",
                  },
                },
              },
            ],
          },
          {
            orderNo: 2,
            title: "Sight Words và Câu Đơn Giản",
            lessons: [
              {
                orderNo: 1,
                slug: "phonics-g2-u2-fill-sight-words",
                title: "Điền sight word trong câu ngắn",
                objective: "Bé điền đúng sight word phổ biến trong câu.",
                estimatedMinutes: 18,
                trialEnabled: false,
                skillCodes: ["PHONICS_SIGHT_DOLCH_PRE"],
                activity: {
                  type: "FILL_BLANK",
                  prompt: "Điền sight word phù hợp",
                  spec: {
                    type: "FILL_BLANK",
                    sentence: "I ___ a red ball.",
                    answer: "see",
                    hint: "Từ cần điền diễn tả hành động nhìn thấy.",
                  },
                },
              },
              {
                orderNo: 2,
                slug: "phonics-g2-u2-listen-sentence-word",
                title: "Nghe câu và chọn từ còn thiếu",
                objective: "Bé nghe câu ngắn và chọn từ phù hợp với ngữ cảnh.",
                estimatedMinutes: 18,
                trialEnabled: false,
                skillCodes: ["PHONICS_SIGHT_DOLCH_PRIMER"],
                activity: {
                  type: "LISTEN_IDENTIFY",
                  prompt: "Nghe câu và chọn từ đúng",
                  spec: {
                    type: "LISTEN_IDENTIFY",
                    audioUrl: "/audio/lessons/dien-chu-cvc/step-4-activity.mp3",
                    question: "Từ nào hoàn thành câu vừa nghe?",
                    options: ["the", "run", "dog", "blue"],
                    correctIndex: 0,
                  },
                },
              },
              {
                orderNo: 3,
                slug: "phonics-g2-u2-drag-sort-simple-sentence",
                title: "Sắp xếp từ thành câu đơn",
                objective: "Bé sắp xếp từ đúng trật tự để tạo câu đơn hoàn chỉnh.",
                estimatedMinutes: 20,
                trialEnabled: false,
                skillCodes: ["PHONICS_SIGHT_DOLCH_1ST"],
                activity: {
                  type: "DRAG_SORT",
                  prompt: "Kéo thả các từ để tạo câu hoàn chỉnh",
                  spec: {
                    type: "SORT_ORDER",
                    items: ["plays", "Nam", "outside"],
                    correctOrder: [1, 0, 2],
                  },
                },
              },
            ],
          },
        ],
      },
    ],
  },
  {
    code: TrackCode.MATH,
    title: "Math Class 1-2",
    levels: [
      {
        orderNo: 1,
        title: "Lớp 1 - Số và Phép Tính Cơ Bản",
        units: [
          {
            orderNo: 1,
            title: "Đếm Số và Nhận Diện Số",
            lessons: [
              {
                orderNo: 1,
                slug: "math-g1-u1-count-1-10",
                title: "Đếm số từ 1 đến 10",
                objective: "Bé đếm đúng dãy số 1-10 trong ngữ cảnh đồ vật quen thuộc.",
                estimatedMinutes: 15,
                trialEnabled: true,
                skillCodes: ["MATH_COUNT_1_10"],
                activity: {
                  type: "MULTIPLE_CHOICE",
                  prompt: "Chọn đáp án đếm đúng",
                  spec: {
                    type: "MULTIPLE_CHOICE",
                    question: "Có bao nhiêu ngôi sao: ⭐⭐⭐⭐⭐⭐",
                    options: ["4", "5", "6", "7"],
                    correctIndex: 2,
                    explanation: "Có 6 ngôi sao.",
                  },
                },
              },
              {
                orderNo: 2,
                slug: "math-g1-u1-fill-missing-number",
                title: "Điền số còn thiếu",
                objective: "Bé điền đúng số còn thiếu trong dãy liên tiếp.",
                estimatedMinutes: 15,
                trialEnabled: true,
                skillCodes: ["MATH_COUNT_11_20"],
                activity: {
                  type: "FILL_BLANK",
                  prompt: "Điền số còn thiếu trong dãy",
                  spec: {
                    type: "FILL_BLANK",
                    sentence: "11, 12, 13, __, 15",
                    answer: "14",
                    hint: "Số cần điền đứng giữa 13 và 15.",
                  },
                },
              },
              {
                orderNo: 3,
                slug: "math-g1-u1-listen-number-identify",
                title: "Nghe số và chọn chữ số",
                objective: "Bé nghe số đọc và chọn đúng chữ số tương ứng.",
                estimatedMinutes: 15,
                trialEnabled: false,
                skillCodes: ["MATH_COUNT_1_10"],
                activity: {
                  type: "LISTEN_IDENTIFY",
                  prompt: "Nghe và chọn chữ số đúng",
                  spec: {
                    type: "LISTEN_IDENTIFY",
                    audioUrl: "/audio/lessons/so-1-5/step-4-activity.mp3",
                    question: "Số vừa nghe là số nào?",
                    options: ["6", "7", "8", "9"],
                    correctIndex: 1,
                  },
                },
              },
            ],
          },
          {
            orderNo: 2,
            title: "Cộng Trừ Trong Phạm Vi 20",
            lessons: [
              {
                orderNo: 1,
                slug: "math-g1-u2-add-single-digit",
                title: "Cộng số một chữ số",
                objective: "Bé giải đúng phép cộng một chữ số trong phạm vi 20.",
                estimatedMinutes: 15,
                trialEnabled: true,
                skillCodes: ["MATH_ADD_1DIGIT"],
                activity: {
                  type: "MULTIPLE_CHOICE",
                  prompt: "Chọn kết quả đúng của phép cộng",
                  spec: {
                    type: "MULTIPLE_CHOICE",
                    question: "8 + 5 = ?",
                    options: ["11", "12", "13", "14"],
                    correctIndex: 2,
                    explanation: "8 + 5 = 13.",
                  },
                },
              },
              {
                orderNo: 2,
                slug: "math-g1-u2-fill-subtraction",
                title: "Điền kết quả phép trừ",
                objective: "Bé hoàn thành phép trừ cơ bản trong phạm vi 20.",
                estimatedMinutes: 15,
                trialEnabled: false,
                skillCodes: ["MATH_SUB_1DIGIT"],
                activity: {
                  type: "FILL_BLANK",
                  prompt: "Điền số còn thiếu",
                  spec: {
                    type: "FILL_BLANK",
                    sentence: "14 - 6 = __",
                    answer: "8",
                    hint: "Bớt 6 từ 14 còn 8.",
                  },
                },
              },
              {
                orderNo: 3,
                slug: "math-g1-u2-drag-sort-subtraction-steps",
                title: "Sắp xếp bước giải phép trừ",
                objective: "Bé sắp đúng thứ tự các bước giải bài toán trừ ngắn.",
                estimatedMinutes: 18,
                trialEnabled: false,
                skillCodes: ["MATH_SUB_1DIGIT"],
                activity: {
                  type: "DRAG_SORT",
                  prompt: "Kéo thả các bước theo đúng thứ tự",
                  spec: {
                    type: "SORT_ORDER",
                    items: ["Đặt tính", "Trừ hàng đơn vị", "Viết kết quả"],
                    correctOrder: [0, 1, 2],
                  },
                },
              },
            ],
          },
        ],
      },
      {
        orderNo: 2,
        title: "Lớp 2 - Củng Cố Cộng Trừ, Làm Quen Nhân Chia",
        units: [
          {
            orderNo: 1,
            title: "Cộng Trừ 2 Chữ Số và Bảng Nhân 2-5",
            lessons: [
              {
                orderNo: 1,
                slug: "math-g2-u1-add-two-digit-no-carry",
                title: "Cộng 2 chữ số không nhớ",
                objective: "Bé tính đúng phép cộng 2 chữ số không nhớ.",
                estimatedMinutes: 18,
                trialEnabled: false,
                skillCodes: ["MATH_ADD_2DIGIT_NO_CARRY"],
                activity: {
                  type: "MULTIPLE_CHOICE",
                  prompt: "Chọn đáp án đúng",
                  spec: {
                    type: "MULTIPLE_CHOICE",
                    question: "23 + 14 = ?",
                    options: ["35", "36", "37", "38"],
                    correctIndex: 2,
                    explanation: "23 + 14 = 37.",
                  },
                },
              },
              {
                orderNo: 2,
                slug: "math-g2-u1-drag-sort-multiplication",
                title: "Sắp xếp bảng nhân 2-5",
                objective: "Bé sắp đúng thứ tự kết quả theo bảng nhân 2-5.",
                estimatedMinutes: 18,
                trialEnabled: false,
                skillCodes: ["MATH_MUL_TABLE_2_5"],
                activity: {
                  type: "DRAG_SORT",
                  prompt: "Kéo thả để sắp xếp kết quả từ nhỏ đến lớn",
                  spec: {
                    type: "SORT_ORDER",
                    items: ["2 x 5 = 10", "2 x 2 = 4", "2 x 4 = 8", "2 x 3 = 6"],
                    correctOrder: [1, 3, 2, 0],
                  },
                },
              },
              {
                orderNo: 3,
                slug: "math-g2-u1-listen-word-problem",
                title: "Nghe đề toán và chọn phép tính",
                objective: "Bé nghe đề toán đơn giản và chọn phép tính phù hợp.",
                estimatedMinutes: 18,
                trialEnabled: false,
                skillCodes: ["MATH_ADD_2DIGIT_NO_CARRY", "MATH_SUB_2DIGIT_NO_BORROW"],
                activity: {
                  type: "LISTEN_IDENTIFY",
                  prompt: "Nghe đề bài và chọn phép tính đúng",
                  spec: {
                    type: "LISTEN_IDENTIFY",
                    audioUrl: "/audio/lessons/hinh-tron-vuong/step-4-activity.mp3",
                    question: "Lan có 12 viên kẹo, mẹ cho thêm 5 viên. Chọn phép tính đúng:",
                    options: ["12 + 5", "12 - 5", "5 - 12", "12 x 5"],
                    correctIndex: 0,
                  },
                },
              },
            ],
          },
          {
            orderNo: 2,
            title: "Hình Học và Đo Lường Cơ Bản",
            lessons: [
              {
                orderNo: 1,
                slug: "math-g2-u2-shapes-identify",
                title: "Nhận diện hình 2D",
                objective: "Bé nhận biết hình tròn, vuông, tam giác trong thực tế.",
                estimatedMinutes: 18,
                trialEnabled: false,
                skillCodes: ["MATH_GEO_2D_SHAPES"],
                activity: {
                  type: "MULTIPLE_CHOICE",
                  prompt: "Chọn tên hình đúng",
                  spec: {
                    type: "MULTIPLE_CHOICE",
                    question: "Biển báo hình tam giác thuộc nhóm hình nào?",
                    options: ["Hình tròn", "Hình vuông", "Hình tam giác", "Hình chữ nhật"],
                    correctIndex: 2,
                    explanation: "Biển báo nêu trên là hình tam giác.",
                  },
                },
              },
              {
                orderNo: 2,
                slug: "math-g2-u2-fill-measurement-unit",
                title: "Điền đơn vị đo phù hợp",
                objective: "Bé chọn đúng đơn vị cm/m trong tình huống quen thuộc.",
                estimatedMinutes: 18,
                trialEnabled: false,
                skillCodes: ["MATH_MEAS_LENGTH"],
                activity: {
                  type: "FILL_BLANK",
                  prompt: "Điền đơn vị đo vào chỗ trống",
                  spec: {
                    type: "FILL_BLANK",
                    sentence: "Chiều dài bút chì khoảng 15 __",
                    answer: "cm",
                    hint: "Độ dài vật nhỏ thường dùng cm.",
                  },
                },
              },
              {
                orderNo: 3,
                slug: "math-g2-u2-drag-sort-time",
                title: "Sắp xếp mốc thời gian trong ngày",
                objective: "Bé sắp đúng thứ tự hoạt động theo thời gian từ sáng đến tối.",
                estimatedMinutes: 20,
                trialEnabled: false,
                skillCodes: ["MATH_MEAS_TIME"],
                activity: {
                  type: "DRAG_SORT",
                  prompt: "Kéo thả hoạt động theo thứ tự thời gian",
                  spec: {
                    type: "SORT_ORDER",
                    items: ["Ăn tối lúc 18h", "Đi học lúc 7h", "Ngủ trưa lúc 12h"],
                    correctOrder: [1, 2, 0],
                  },
                },
              },
            ],
          },
        ],
      },
    ],
  },
];

export async function seedLearningContent(prisma: PrismaClient): Promise<ContentSeedSummary> {
  const summary: ContentSeedSummary = {
    tracks: { created: 0, updated: 0 },
    levels: { created: 0, updated: 0 },
    units: { created: 0, updated: 0 },
    lessons: { created: 0, updated: 0 },
    activities: { created: 0, updated: 0 },
    lessonSkills: { linked: 0, skippedMissingSkill: 0 },
    totals: {
      tracks: TRACKS.length,
      levels: TRACKS.reduce((acc, track) => acc + track.levels.length, 0),
      units: TRACKS.reduce((acc, track) => acc + track.levels.reduce((sum, level) => sum + level.units.length, 0), 0),
      lessons: TRACKS.reduce(
        (acc, track) =>
          acc +
          track.levels.reduce(
            (lvSum, level) => lvSum + level.units.reduce((uSum, unit) => uSum + unit.lessons.length, 0),
            0,
          ),
        0,
      ),
      activities: TRACKS.reduce(
        (acc, track) =>
          acc +
          track.levels.reduce(
            (lvSum, level) => lvSum + level.units.reduce((uSum, unit) => uSum + unit.lessons.length, 0),
            0,
          ),
        0,
      ),
    },
  };

  const requestedSkillCodes = new Set<string>();
  for (const track of TRACKS) {
    for (const level of track.levels) {
      for (const unit of level.units) {
        for (const lesson of unit.lessons) {
          for (const code of lesson.skillCodes) requestedSkillCodes.add(code);
        }
      }
    }
  }

  const requestedSkillList = Array.from(requestedSkillCodes);
  const existingSkills = requestedSkillList.length
    ? await prisma.skill.findMany({ where: { code: { in: requestedSkillList } }, select: { id: true, code: true } })
    : [];
  const skillByCode = new Map(existingSkills.map((skill) => [skill.code, skill.id]));

  for (const trackSeed of TRACKS) {
    const trackExisting = await prisma.track.findUnique({ where: { code: trackSeed.code }, select: { id: true } });
    const track = await prisma.track.upsert({
      where: { code: trackSeed.code },
      update: { title: trackSeed.title, isTrialEnabled: true },
      create: { code: trackSeed.code, title: trackSeed.title, isTrialEnabled: true },
    });
    if (trackExisting) summary.tracks.updated += 1;
    else summary.tracks.created += 1;

    for (const levelSeed of trackSeed.levels) {
      const levelExisting = await prisma.level.findUnique({
        where: { trackId_orderNo: { trackId: track.id, orderNo: levelSeed.orderNo } },
        select: { id: true },
      });
      const level = await prisma.level.upsert({
        where: { trackId_orderNo: { trackId: track.id, orderNo: levelSeed.orderNo } },
        update: { title: levelSeed.title },
        create: {
          trackId: track.id,
          orderNo: levelSeed.orderNo,
          title: levelSeed.title,
        },
      });
      if (levelExisting) summary.levels.updated += 1;
      else summary.levels.created += 1;

      for (const unitSeed of levelSeed.units) {
        const unitExisting = await prisma.unit.findUnique({
          where: { levelId_orderNo: { levelId: level.id, orderNo: unitSeed.orderNo } },
          select: { id: true },
        });
        const unit = await prisma.unit.upsert({
          where: { levelId_orderNo: { levelId: level.id, orderNo: unitSeed.orderNo } },
          update: { title: unitSeed.title },
          create: {
            levelId: level.id,
            orderNo: unitSeed.orderNo,
            title: unitSeed.title,
          },
        });
        if (unitExisting) summary.units.updated += 1;
        else summary.units.created += 1;

        for (const lessonSeed of unitSeed.lessons) {
          const lessonExisting = await prisma.lesson.findUnique({
            where: { unitId_orderNo: { unitId: unit.id, orderNo: lessonSeed.orderNo } },
            select: { id: true },
          });
          const lesson = await prisma.lesson.upsert({
            where: { unitId_orderNo: { unitId: unit.id, orderNo: lessonSeed.orderNo } },
            update: {
              slug: lessonSeed.slug,
              title: lessonSeed.title,
              objective: lessonSeed.objective,
              estimatedMinutes: lessonSeed.estimatedMinutes,
              trialEnabled: lessonSeed.trialEnabled,
              offlineCardMarkdown: buildOfflineCardMarkdown(lessonSeed),
              parentScriptMarkdown: buildParentScriptMarkdown(lessonSeed),
            },
            create: {
              unitId: unit.id,
              orderNo: lessonSeed.orderNo,
              slug: lessonSeed.slug,
              title: lessonSeed.title,
              objective: lessonSeed.objective,
              estimatedMinutes: lessonSeed.estimatedMinutes,
              trialEnabled: lessonSeed.trialEnabled,
              offlineCardMarkdown: buildOfflineCardMarkdown(lessonSeed),
              parentScriptMarkdown: buildParentScriptMarkdown(lessonSeed),
            },
          });
          if (lessonExisting) summary.lessons.updated += 1;
          else summary.lessons.created += 1;

          const activityId = `activity-${lessonSeed.slug}`;
          const activityType = mapActivityType(lessonSeed.activity.type);

          await prisma.activity.deleteMany({
            where: {
              lessonId: lesson.id,
              id: { not: activityId },
            },
          });

          const activityExisting = await prisma.activity.findUnique({
            where: { id: activityId },
            select: { id: true },
          });
          await prisma.activity.upsert({
            where: { id: activityId },
            update: {
              lessonId: lesson.id,
              type: activityType,
              prompt: lessonSeed.activity.prompt,
              spec: toActivitySpecJson(lessonSeed.activity.spec),
              passCriteria: 80,
              skillId: skillByCode.get(lessonSeed.skillCodes[0] ?? "") ?? null,
            },
            create: {
              id: activityId,
              lessonId: lesson.id,
              type: activityType,
              prompt: lessonSeed.activity.prompt,
              spec: toActivitySpecJson(lessonSeed.activity.spec),
              passCriteria: 80,
              skillId: skillByCode.get(lessonSeed.skillCodes[0] ?? "") ?? null,
            },
          });
          if (activityExisting) summary.activities.updated += 1;
          else summary.activities.created += 1;

          for (const skillCode of lessonSeed.skillCodes) {
            const skillId = skillByCode.get(skillCode);
            if (!skillId) {
              summary.lessonSkills.skippedMissingSkill += 1;
              continue;
            }
            await prisma.lessonSkill.upsert({
              where: { lessonId_skillId: { lessonId: lesson.id, skillId } },
              update: { isPrimary: skillCode === lessonSeed.skillCodes[0] },
              create: {
                lessonId: lesson.id,
                skillId,
                isPrimary: skillCode === lessonSeed.skillCodes[0],
              },
            });
            summary.lessonSkills.linked += 1;
          }
        }
      }
    }
  }

  return summary;
}
