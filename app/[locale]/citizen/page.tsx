import { useTranslations } from "next-intl";

export default function CitizenPlaceholder() {
  return <Placeholder role="citizen" />;
}

function Placeholder({ role }: { role: string }) {
  const t = useTranslations("common");
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center p-8">
      <div className="rounded-2xl bg-[#C7E1D4] px-6 py-3 text-[#3E7D60] font-semibold text-sm uppercase tracking-wide">
        {t("loading")}
      </div>
      <h2 className="text-2xl font-bold text-[#1C2D5B]">
        {role} dashboard — built by Prompt 1
      </h2>
      <p className="text-[#1C2D5B]/50 text-sm max-w-md">
        This page will be implemented by the Citizen feature prompt. The
        foundation skeleton is in place.
      </p>
    </div>
  );
}
