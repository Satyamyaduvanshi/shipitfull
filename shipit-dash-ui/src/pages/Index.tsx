import { AppSidebar } from "@/components/AppSidebar";
import { Navbar } from "@/components/Navbar";
import { StatsCards } from "@/components/StatsCards";
import { DeploymentsTable } from "@/components/DeploymentsTable";
import { LiveFeed } from "@/components/LiveFeed";
import { useEffect } from "react";

const Index = () => {
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  return (
    <div className="min-h-screen bg-background scrollbar-hide">
      <AppSidebar />
      <Navbar />

      <main className="ml-64 pt-16 min-h-screen">
        <div className="p-8 space-y-6">
          <StatsCards />
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2">
              <DeploymentsTable />
            </div>
            <div className="xl:col-span-1">
              <LiveFeed />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
