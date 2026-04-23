"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils/cn";
import { submitFeedback } from "@/lib/citizen/actions";

interface FeedbackFormProps {
  reportId: string;
}

export function FeedbackForm({ reportId }: FeedbackFormProps) {
  const t = useTranslations("citizen.feedback");
  const tc = useTranslations("citizen.errors");
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) return;
    setLoading(true);
    setError(null);

    const result = await submitFeedback(reportId, { rating, comment: comment || undefined });
    setLoading(false);

    if (!result.ok) {
      setError(tc("feedbackFailed"));
      return;
    }
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="rounded-xl bg-[#3E7D60]/10 border border-[#3E7D60]/20 p-4 text-center">
        <p className="text-sm font-semibold text-[#3E7D60]">{t("thanks")}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-[#1C2D5B]/70">{t("prompt")}</p>

      {/* Star rating */}
      <div
        className="flex gap-1"
        role="radiogroup"
        aria-label={t("title")}
      >
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={rating === n}
            aria-label={t("starLabel", { n })}
            onClick={() => setRating(n)}
            onMouseEnter={() => setHovered(n)}
            onMouseLeave={() => setHovered(0)}
            className="focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3E7D60] rounded"
          >
            <Star
              className={cn(
                "h-8 w-8 transition-colors",
                (hovered || rating) >= n
                  ? "fill-amber-400 text-amber-400"
                  : "text-[#DCE3EA]"
              )}
            />
          </button>
        ))}
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-[#1C2D5B]">
          {t("commentLabel")}
        </label>
        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={t("commentHint")}
          maxLength={500}
          rows={3}
        />
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <Button type="submit" disabled={rating === 0 || loading} className="w-full">
        {loading ? "…" : t("submit")}
      </Button>
    </form>
  );
}
