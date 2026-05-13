interface LessonStartCardMockProps {
  lessonId: string;
  title: string;
  objective: string;
  estimatedMinutes: number;
  onLessonSelect?: (lessonId: string) => void;
}

export function LessonStartCard({
  lessonId,
  title,
  objective,
  estimatedMinutes,
  onLessonSelect,
}: LessonStartCardMockProps) {
  return (
    <article data-testid={`lesson-card-${lessonId}`}>
      <h3>{title}</h3>
      <p>{objective}</p>
      <span>{estimatedMinutes} minutes</span>
      <button type="button" onClick={() => onLessonSelect?.(lessonId)}>
        Start the lesson
      </button>
    </article>
  );
}
