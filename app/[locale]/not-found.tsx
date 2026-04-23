import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-center bg-[#F0F7FF] px-4">
      <h1 className="text-6xl font-bold text-[#1C2D5B]">404</h1>
      <p className="text-[#1C2D5B]/60">الصفحة غير موجودة · Page not found</p>
      <Link
        href="/ar"
        className="mt-4 rounded-lg bg-[#3E7D60] px-6 py-2.5 text-sm text-white hover:bg-[#2d6149] transition-colors"
      >
        العودة للرئيسية · Go Home
      </Link>
    </div>
  );
}
