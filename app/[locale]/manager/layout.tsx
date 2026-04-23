import { Header } from "@/components/layout/Header";
import { RoleNav } from "@/components/layout/RoleNav";

interface ManagerLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function ManagerLayout({
  children,
}: ManagerLayoutProps) {
  return (
    <div className="min-h-screen bg-sky-white">
      <Header role="district_manager" />
      <div className="flex">
        <RoleNav role="district_manager" />
        <main className="flex-1 px-4 py-6 sm:px-6 pb-20 md:pb-6">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
