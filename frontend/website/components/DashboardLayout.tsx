import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <Sidebar />
            <main className="lg:pl-64 pt-16 min-h-screen">
                <div className="p-6 md:p-8 max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
