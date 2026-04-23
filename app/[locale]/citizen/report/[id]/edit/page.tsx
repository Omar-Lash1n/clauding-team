import { redirect, notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { getReport, getActiveCategories, getAllDistricts } from "@/lib/citizen/queries";
import { ReportEditForm } from "./EditForm";

interface EditPageProps {
  params: Promise<{ id: string; locale: string }>;
}

export default async function EditReportPage({ params }: EditPageProps) {
  const { id, locale } = await params;

  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/${locale}/login`);

  const report = await getReport(id);
  if (!report) notFound();

  if (report.reporter_id !== user.id || report.status !== "submitted") {
    redirect(`/${locale}/citizen/report/${id}`);
  }

  const categories = await getActiveCategories();
  const districts = await getAllDistricts();

  // Generate signed URLs for existing photos
  const existingPhotos: { id: string; url: string }[] = [];
  for (const photo of report.photos) {
    const { data } = await supabase.storage
      .from("reports")
      .createSignedUrl(photo.storage_path, 3600);
    if (data?.signedUrl) {
      existingPhotos.push({ id: photo.id, url: data.signedUrl });
    }
  }

  return (
    <ReportEditForm
      report={{
        id: report.id,
        categoryId: report.category?.id ?? "",
        priority: report.priority,
        description: report.description,
        addressDescription: report.address_description ?? "",
        lat: report.location_lat,
        lng: report.location_lng,
      }}
      existingPhotos={existingPhotos}
      categories={categories}
      districts={districts}
    />
  );
}
