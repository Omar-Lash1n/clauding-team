"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StepCategory } from "./StepCategory";
import { StepDetails } from "./StepDetails";
import { StepLocation } from "./StepLocation";
import { StepConfirm } from "./StepConfirm";
import { DuplicateWarningDialog } from "@/components/citizen/DuplicateWarningDialog";
import { createReport, checkNearbyReports } from "@/lib/citizen/actions";
import type { Category, District, PriorityLevel, NearbyReport } from "@/types/domain";

interface ReportWizardProps {
  categories: Category[];
  districts: District[];
}

const TOTAL_STEPS = 4;

export function ReportWizard({ categories, districts }: ReportWizardProps) {
  const t = useTranslations("citizen.wizard");
  const tc = useTranslations("common");
  const te = useTranslations("citizen.errors");
  const router = useRouter();
  const locale = useLocale();

  const [step, setStep] = useState(0);

  // Form state
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [priority, setPriority] = useState<PriorityLevel>("medium");
  const [photos, setPhotos] = useState<File[]>([]);
  const [description, setDescription] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [districtId, setDistrictId] = useState<string | null>(null);
  const [addressDescription, setAddressDescription] = useState("");

  // Duplicate check
  const [duplicates, setDuplicates] = useState<NearbyReport[]>([]);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);

  // Submission
  const [submitting, setSubmitting] = useState(false);

  const detectedDistrictName = (() => {
    if (!districtId) return null;
    const d = districts.find((dist) => dist.id === districtId);
    if (!d) return null;
    return locale === "ar" ? d.name_ar : d.name_en;
  })();

  const handleLocationChange = useCallback(
    (latitude: number, longitude: number, dId: string | null) => {
      setLat(latitude);
      setLng(longitude);
      setDistrictId(dId);
    },
    []
  );

  function canGoNext(): boolean {
    switch (step) {
      case 0:
        return selectedCategory !== null;
      case 1:
        return photos.length >= 1 && description.length >= 20;
      case 2:
        return lat !== null && lng !== null;
      case 3:
        return true;
      default:
        return false;
    }
  }

  async function handleNext() {
    if (step < TOTAL_STEPS - 1) {
      // Before going to confirm step, check for duplicates
      if (step === 2 && lat !== null && lng !== null && selectedCategory) {
        const nearby = await checkNearbyReports(lat, lng, selectedCategory.id);
        if (nearby.length > 0) {
          setDuplicates(nearby);
          setShowDuplicateDialog(true);
          return;
        }
      }
      setStep(step + 1);
    }
  }

  function handleBack() {
    if (step > 0) {
      setStep(step - 1);
    }
  }

  function handleContinuePastDuplicates() {
    setShowDuplicateDialog(false);
    setStep(step + 1);
  }

  async function handleSubmit() {
    if (!selectedCategory || lat === null || lng === null) return;
    setSubmitting(true);

    const formData = new FormData();
    formData.set("category_id", selectedCategory.id);
    formData.set("priority", priority);
    formData.set("description", description);
    formData.set("location_lat", lat.toString());
    formData.set("location_lng", lng.toString());
    if (addressDescription) {
      formData.set("address_description", addressDescription);
    }
    photos.forEach((file, i) => {
      formData.set(`photo_${i}`, file);
    });

    const result = await createReport(formData);
    setSubmitting(false);

    if (!result.ok) {
      toast.error(te("createFailed"));
      return;
    }

    toast.success(t("submittedToast"), {
      icon: <CheckCircle2 className="h-4 w-4 text-green-500" />,
    });
    router.push(`/${locale}/citizen/report/${result.data.reportId}`);
  }

  function onSelectCategory(cat: Category) {
    setSelectedCategory(cat);
    setPriority(cat.default_priority);
  }

  const stepTitles = [
    t("step1Title"),
    t("step2Title"),
    t("step3Title"),
    t("step4Title"),
  ];

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#1C2D5B]">
            {stepTitles[step]}
          </h2>
          <span className="text-xs text-[#1C2D5B]/40 font-medium">
            {step + 1}/{TOTAL_STEPS}
          </span>
        </div>
        <div className="flex gap-1.5">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i <= step ? "bg-[#3E7D60]" : "bg-[#DCE3EA]"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Step content */}
      {step === 0 && (
        <StepCategory
          categories={categories}
          selectedCategoryId={selectedCategory?.id ?? null}
          priority={priority}
          onSelectCategory={onSelectCategory}
          onChangePriority={setPriority}
        />
      )}
      {step === 1 && (
        <StepDetails
          photos={photos}
          description={description}
          onPhotosChange={setPhotos}
          onDescriptionChange={setDescription}
        />
      )}
      {step === 2 && (
        <StepLocation
          lat={lat}
          lng={lng}
          addressDescription={addressDescription}
          districts={districts}
          detectedDistrictName={detectedDistrictName}
          onLocationChange={handleLocationChange}
          onAddressChange={setAddressDescription}
        />
      )}
      {step === 3 && (
        <StepConfirm
          category={selectedCategory}
          priority={priority}
          description={description}
          photos={photos}
          lat={lat}
          lng={lng}
          districtName={detectedDistrictName}
          addressDescription={addressDescription}
        />
      )}

      {/* Navigation */}
      <div className="flex gap-3 pt-2">
        {step > 0 && (
          <Button
            type="button"
            variant="outline"
            onClick={handleBack}
            className="flex-1"
          >
            {tc("back")}
          </Button>
        )}
        {step < TOTAL_STEPS - 1 ? (
          <Button
            type="button"
            onClick={handleNext}
            disabled={!canGoNext()}
            className="flex-1"
          >
            {tc("next")}
          </Button>
        ) : (
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1"
          >
            {submitting ? t("submitting") : t("submit")}
          </Button>
        )}
      </div>

      {/* Duplicate warning */}
      <DuplicateWarningDialog
        open={showDuplicateDialog}
        onOpenChange={setShowDuplicateDialog}
        candidates={duplicates}
        onContinue={handleContinuePastDuplicates}
      />
    </div>
  );
}
