import React from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

interface MainLayoutProps {
    children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
            <Header />

            <div className="flex flex-1 pt-16">
                <Sidebar />

                <main className="flex-1 ml-80 overflow-hidden">
                    <div className="p-8 h-full max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};
