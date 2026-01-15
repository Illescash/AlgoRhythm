import React from 'react';
import { Settings } from 'lucide-react';

export const Sidebar: React.FC = () => {
    return (
        <aside className="w-80 bg-slate-800 border-r border-slate-700 fixed top-16 bottom-0 left-0 overflow-y-auto p-4">
            <div className="flex items-center gap-2 mb-6 text-slate-200">
                <Settings className="w-5 h-5" />
                <h2 className="text-lg font-semibold">Controles</h2>
            </div>

            <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600 border-dashed text-center">
                <p className="text-slate-400 text-sm">Configuración en Fase 5</p>
            </div>
        </aside>
    );
};
