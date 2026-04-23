import { Header } from "@/components/layout/Header";
import { RoleNav } from "@/components/layout/RoleNav";

interface TechnicianLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function TechnicianLayout({
  children,
}: TechnicianLayoutProps) {
  return (
    <div className="min-h-screen bg-sky-white">
      <Header role="technician" />
      <div className="flex">
        <RoleNav role="technician" />
        <main className="flex-1 px-4 py-6 sm:px-6 pb-20 md:pb-6">
          <div className="mx-auto max-w-5xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
