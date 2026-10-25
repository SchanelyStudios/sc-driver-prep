import Image from "next/image";
import type { Question } from "../types";
const styles = {
  image:
    "mx-auto h-auto max-h-56 w-auto rounded-lg border border-line bg-surface object-contain p-2",
};
export function QuestionImage({ question }: { question: Question }) {
  return question.image ? (
    <Image
      src={`/manual-signs/${question.image.path.split("/").at(-1)}`}
      alt={question.image.alt}
      width={320}
      height={280}
      className={styles.image}
      unoptimized
    />
  ) : null;
}
