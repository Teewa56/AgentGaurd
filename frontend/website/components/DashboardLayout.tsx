import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <Sidebar />
            <main className="lg:pl-64 pt-16 pb-20 lg:pb-0 min-h-screen">
                <div className="p-6 md:p-8 max-w-7xl mx-auto text-foreground">
                    {children}
                </div>
            </main>
            <div className="block lg:hidden">
                <BottomNav />
            </div>
        </div>
    );
}
