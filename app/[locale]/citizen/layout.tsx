import { Header } from "@/components/layout/Header";
import { RoleNav } from "@/components/layout/RoleNav";

interface CitizenLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function CitizenLayout({
  children,
}: CitizenLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header role="citizen" />
      <div className="flex flex-1">
        <RoleNav role="citizen" />
        <main className="flex-1 mx-auto max-w-3xl px-4 py-6 pb-20 md:pb-6 w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
