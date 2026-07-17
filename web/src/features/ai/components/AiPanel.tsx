import { useState } from "react";
import toast from "react-hot-toast";
import { LANGUAGES } from "@dailyspark/types";
import type { FlashcardDTO, PracticeQuestionDTO } from "@dailyspark/types";
import { aiApi } from "../api/aiApi";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

type Tab = "ask" | "flashcards" | "practice" | "translate";

function errorMessage(err: any, fallback: string) {
  return err?.response?.data?.message ?? fallback;
}

export function AiPanel({ lessonId }: { lessonId: string }) {
  const [tab, setTab] = useState<Tab>("ask");

  return (
    <Card>
      <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold text-ink dark:text-paper">
        <span aria-hidden>✨</span> AI Study Tools
      </h2>

      <div className="mb-5 flex flex-wrap gap-2">
        {(["ask", "flashcards", "practice", "translate"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full border px-3.5 py-1.5 text-sm font-medium capitalize transition ${
              tab === t
                ? "border-spark-500 bg-spark-500 text-ink"
                : "border-ink/20 text-ink/70 dark:border-white/20 dark:text-paper/70"
            }`}
          >
            {t === "ask" ? "Ask a question" : t}
          </button>
        ))}
      </div>

      {tab === "ask" && <AskTab lessonId={lessonId} />}
      {tab === "flashcards" && <FlashcardsTab lessonId={lessonId} />}
      {tab === "practice" && <PracticeTab lessonId={lessonId} />}
      {tab === "translate" && <TranslateTab lessonId={lessonId} />}
    </Card>
  );
}

function AskTab({ lessonId }: { lessonId: string }) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleAsk = async () => {
    if (!question.trim()) return;
    setIsLoading(true);
    setAnswer(null);
    try {
      const result = await aiApi.explain(lessonId, question.trim());
      setAnswer(result.answer);
    } catch (err: any) {
      toast.error(errorMessage(err, "Could not get an explanation right now."));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <textarea
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="What part of this lesson would you like explained differently?"
        rows={2}
        className="w-full rounded-xl border border-ink/20 px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-spark-500 dark:border-white/20 dark:bg-ink dark:text-paper"
      />
      <Button className="mt-3" isLoading={isLoading} disabled={!question.trim()} onClick={handleAsk}>
        Ask
      </Button>
      {answer && (
        <p className="mt-4 rounded-xl bg-paper-dim/60 p-4 text-sm leading-relaxed text-ink/80 dark:bg-white/5 dark:text-paper/80">
          {answer}
        </p>
      )}
    </div>
  );
}

function FlashcardsTab({ lessonId }: { lessonId: string }) {
  const [cards, setCards] = useState<FlashcardDTO[] | null>(null);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async () => {
    setIsLoading(true);
    try {
      const result = await aiApi.generateFlashcards(lessonId);
      setCards(result.flashcards);
      setIndex(0);
      setFlipped(false);
    } catch (err: any) {
      toast.error(errorMessage(err, "Could not generate flashcards right now."));
    } finally {
      setIsLoading(false);
    }
  };

  if (!cards) {
    return (
      <Button isLoading={isLoading} onClick={handleGenerate}>
        Generate flashcards
      </Button>
    );
  }

  const card = cards[index];

  return (
    <div>
      <button
        onClick={() => setFlipped((v) => !v)}
        className="flex min-h-[120px] w-full items-center justify-center rounded-xl border border-ink/20 bg-paper-dim/60 p-6 text-center dark:border-white/20 dark:bg-white/5"
      >
        <p className="font-display text-lg font-semibold text-ink dark:text-paper">
          {flipped ? card.back : card.front}
        </p>
      </button>
      <p className="mt-2 text-center text-xs text-ink/40 dark:text-paper/40">
        Tap card to flip · {index + 1}/{cards.length}
      </p>
      <div className="mt-3 flex justify-center gap-3">
        <Button
          variant="secondary"
          disabled={index === 0}
          onClick={() => {
            setIndex((i) => i - 1);
            setFlipped(false);
          }}
        >
          Previous
        </Button>
        <Button
          variant="secondary"
          disabled={index === cards.length - 1}
          onClick={() => {
            setIndex((i) => i + 1);
            setFlipped(false);
          }}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

function PracticeTab({ lessonId }: { lessonId: string }) {
  const [questions, setQuestions] = useState<PracticeQuestionDTO[] | null>(null);
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async () => {
    setIsLoading(true);
    try {
      const result = await aiApi.generatePracticeQuestions(lessonId);
      setQuestions(result.questions);
      setRevealed(new Set());
    } catch (err: any) {
      toast.error(errorMessage(err, "Could not generate practice questions right now."));
    } finally {
      setIsLoading(false);
    }
  };

  if (!questions) {
    return (
      <Button isLoading={isLoading} onClick={handleGenerate}>
        Generate practice questions
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {questions.map((q, i) => (
        <div key={i} className="rounded-xl border border-ink/10 p-4 dark:border-white/10">
          <p className="text-sm font-semibold text-ink dark:text-paper">{q.question}</p>
          {revealed.has(i) ? (
            <p className="mt-2 text-sm text-ink/70 dark:text-paper/70">{q.answer}</p>
          ) : (
            <button
              onClick={() => setRevealed((prev) => new Set(prev).add(i))}
              className="mt-2 text-xs font-semibold text-spark-700 hover:underline dark:text-spark-300"
            >
              Reveal answer
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

function TranslateTab({ lessonId }: { lessonId: string }) {
  const [language, setLanguage] = useState(LANGUAGES[1].code);
  const [translated, setTranslated] = useState<{
    title: string;
    summary: string;
    content: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleTranslate = async () => {
    setIsLoading(true);
    try {
      const result = await aiApi.translate(lessonId, language);
      setTranslated(result);
    } catch (err: any) {
      toast.error(errorMessage(err, "Could not translate this lesson right now."));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="flex gap-2">
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="rounded-xl border border-ink/20 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-spark-500 dark:border-white/20 dark:bg-ink dark:text-paper"
        >
          {LANGUAGES.filter((l) => l.code !== "en").map((l) => (
            <option key={l.code} value={l.code}>
              {l.label}
            </option>
          ))}
        </select>
        <Button isLoading={isLoading} onClick={handleTranslate}>
          Translate
        </Button>
      </div>

      {translated && (
        <div className="mt-4 rounded-xl bg-paper-dim/60 p-4 dark:bg-white/5">
          <h3 className="font-display font-bold text-ink dark:text-paper">{translated.title}</h3>
          <p className="mt-1 text-sm italic text-ink/70 dark:text-paper/70">{translated.summary}</p>
          <p className="mt-3 whitespace-pre-line text-sm text-ink/80 dark:text-paper/80">
            {translated.content}
          </p>
        </div>
      )}
    </div>
  );
}
