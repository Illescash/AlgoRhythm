import React from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

interface MainLayoutProps {
    children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
    return (
        <div className="min-h-screen bg-slate-900 text-slate-100">
            <Header />
            <Sidebar />
            <main className="pt-16 pl-80 min-h-screen">
                <div className="p-6 h-full">
                    {children}
                </div>
            </main>
        </div>
    );
};
