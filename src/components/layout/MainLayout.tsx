import { useStore } from '../../store';
import { TopBar } from './TopBar';
import { Visualizer } from '../../engine/visual/Visualizer';
import { StatStrip } from './StatStrip';
import { SortSidebar } from './SortSidebar';
import { SearchSidebar } from './SearchSidebar';

export function MainLayout() {
    const mode = useStore(s => s.mode);

    return (
        <div
            className="fixed inset-0 grid"
            style={{
                gridTemplateRows: '48px 1fr',
                background:
                    'radial-gradient(1200px 600px at 80% -10%, rgba(99,102,241,0.10), transparent 60%),' +
                    'radial-gradient(900px 500px at -10% 110%, rgba(59,130,246,0.08), transparent 60%),' +
                    'var(--bg-0)',
            }}
        >
            <TopBar/>

            <div className="grid min-h-0"
                 style={{ gridTemplateColumns: '1fr 340px' }}>
                <section className="grid min-h-0 overflow-hidden"
                         style={{
                             gridTemplateRows: '1fr auto',
                             borderRight: '1px solid var(--line-soft)',
                         }}>
                    <div className="relative min-h-0">
                        <Visualizer/>
                    </div>
                    <StatStrip/>
                </section>

                <aside className="min-h-0 flex flex-col"
                       style={{
                           background: 'linear-gradient(180deg, rgba(15,20,32,0.8), rgba(10,14,26,0.98))',
                           borderLeft: '1px solid var(--line-soft)',
                       }}>
                    {mode === 'sort' ? <SortSidebar/> : <SearchSidebar/>}
                </aside>
            </div>
        </div>
    );
}
