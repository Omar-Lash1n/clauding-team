"use client";

import { useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { Upload, Camera, CheckCircle } from "lucide-react";
import { resolveTask } from "@/lib/technician/actions";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface ResolveTaskFormProps {
  reportId: string;
}

export function ResolveTaskForm({ reportId }: ResolveTaskFormProps) {
  const t = useTranslations("technician");
  const [loading, setLoading] = useState(false);
  const [cost, setCost] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [workDescription, setWorkDescription] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

    if (!photo) {
      toast.error(t("resolve.photoRequired"));
      return;
    }

    const costNum = parseFloat(cost);
    if (isNaN(costNum) || costNum < 0) {
      toast.error(t("resolve.costRequired"));
      return;
    }

    setLoading(true);

    try {
      // Upload photo first
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Unauthorized");
        setLoading(false);
        return;
      }

      const timestamp = Date.now();
      const ext = photo.name.split(".").pop() || "jpg";
      const storagePath = `${reportId}/after_${timestamp}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("report-photos")
        .upload(storagePath, photo, { cacheControl: "3600", upsert: false });

      if (uploadError) {
        toast.error(t("resolve.error"));
        setLoading(false);
        return;
      }

      // Insert photo record
      await supabase.from("report_photos").insert({
        report_id: reportId,
        storage_path: storagePath,
        photo_type: "after" as const,
        uploaded_by: user.id,
      });

      // Now resolve
      const result = await resolveTask({ reportId, cost: costNum });

      if (result.ok) {
        toast.success(t("resolve.success"));
      } else {
        toast.error(t("resolve.error"));
      }
    } catch {
      toast.error(t("resolve.error"));
    }

    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-semibold text-navy">{t("resolve.title")}</h3>

      {/* Photo upload */}
      <div>
        <label className="mb-2 block text-sm font-medium text-navy">
          {t("resolve.uploadPhoto")} *
        </label>
        {photoPreview ? (
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photoPreview}
              alt="After photo preview"
              className="h-48 w-full rounded-xl border border-border-neutral object-cover"
            />
            <button
              type="button"
              onClick={() => {
                setPhoto(null);
                setPhotoPreview(null);
              }}
              className="absolute top-2 end-2 rounded-full bg-white/90 p-1 text-red-500 shadow hover:bg-white"
            >
              ✕
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex h-32 w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border-neutral bg-sky-white text-navy/50 transition-colors hover:border-nile-green hover:text-nile-green"
          >
            <Camera className="h-5 w-5" />
            <Upload className="h-5 w-5" />
            <span className="text-sm">{t("resolve.uploadPhoto")}</span>
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handlePhotoSelect}
        />
      </div>

      {/* Cost */}
      <div>
        <label htmlFor="cost" className="mb-2 block text-sm font-medium text-navy">
          {t("task.costEgp")} *
        </label>
        <input
          id="cost"
          type="number"
          min="0"
          step="0.01"
          value={cost}
          onChange={(e) => setCost(e.target.value)}
          placeholder="0.00"
          className="w-full rounded-lg border border-border-neutral bg-white px-4 py-2.5 text-sm text-navy placeholder:text-navy/30 focus:border-nile-green focus:outline-none focus:ring-1 focus:ring-nile-green"
          required
        />
      </div>

      {/* Work description */}
      <div>
        <label htmlFor="workDesc" className="mb-2 block text-sm font-medium text-navy">
          {t("task.workDescription")}
        </label>
        <textarea
          id="workDesc"
          value={workDescription}
          onChange={(e) => setWorkDescription(e.target.value.slice(0, 300))}
          placeholder={t("task.workDescriptionPlaceholder")}
          rows={3}
          className="w-full rounded-lg border border-border-neutral bg-white px-4 py-2.5 text-sm text-navy placeholder:text-navy/30 focus:border-nile-green focus:outline-none focus:ring-1 focus:ring-nile-green resize-none"
        />
        <p className="mt-1 text-xs text-navy/40">
          {workDescription.length}/300 {t("task.maxChars")}
        </p>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading || !photo || !cost}
        className="inline-flex items-center gap-2 rounded-lg bg-nile-green px-6 py-3 text-sm font-semibold text-white transition-colors hover:brightness-95 disabled:opacity-50 disabled:cursor-not-allowed w-full justify-center"
      >
        <CheckCircle className="h-4 w-4" />
        {loading ? t("resolve.button") + "..." : t("resolve.button")}
      </button>
    </form>
  );
}
