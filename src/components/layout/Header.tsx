import React from 'react';
import { Music } from 'lucide-react';

export const Header: React.FC = () => {
    return (
        <header className="h-16 bg-slate-800 border-b border-slate-700 flex items-center px-6 fixed top-0 left-0 right-0 z-10">
            <div className="flex items-center gap-3 text-white">
                <Music className="w-6 h-6 text-blue-400" />
                <h1 className="text-xl font-bold tracking-tight">AlgoRhythm: Sonification Engine</h1>
            </div>
        </header>
    );
};
