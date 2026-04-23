import { Header } from "@/components/layout/Header";
import { GovernorSidebar } from "@/components/governor/GovernorSidebar";
import { RoleNav } from "@/components/layout/RoleNav";

interface GovernorLayoutProps {
  children: React.ReactNode;
}

export default async function GovernorLayout({ children }: GovernorLayoutProps) {
  return (
    <div className="min-h-screen bg-sky-white">
      <Header role="governor" />
      <div className="flex">
        {/* Desktop sidebar */}
        <GovernorSidebar
          profileName="Amr Helmy Hassan Lashin"
          profileNameAr="عمرو حلمي حسن لاشين"
        />
        {/* Main content */}
        <main className="flex-1 pb-20 md:pb-8">{children}</main>
      </div>
      {/* Mobile bottom nav */}
      <div className="md:hidden">
        <RoleNav role="governor" />
      </div>
    </div>
  );
}
