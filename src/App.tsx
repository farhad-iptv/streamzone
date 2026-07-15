/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState, useMemo } from 'react';
import { SportsEvent } from './types';
import { fetchEvents } from './api';
import { Header } from './components/Header';
import { MatchCard } from './components/MatchCard';
import { PlayerModal } from './components/PlayerModal';
import { Footer } from './components/Footer';
import { cn, calculateEventStatus } from './utils';

export default function App() {
  const [events, setEvents] = useState<SportsEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState('All');
  const [activePlayerEvent, setActivePlayerEvent] = useState<SportsEvent | null>(null);

  useEffect(() => {
    let mounted = true;
    
    const loadData = async () => {
      try {
        const data = await fetchEvents();
        if (mounted) {
          setEvents(data);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError('Failed to load events. Please try again later.');
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    loadData();

    const interval = setInterval(loadData, 30000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const eventsWithCalculatedStatus = useMemo(() => {
    return events.map(e => ({
      ...e,
      calculatedStatus: calculateEventStatus(e.eventInfo.startTime)
    })).sort((a, b) => {
      // Sort by status priority: live > today > upcoming > finished
      const statusOrder = { 'live': 1, 'today': 2, 'upcoming': 3, 'finished': 4 };
      const statusDiff = statusOrder[a.calculatedStatus as keyof typeof statusOrder] - statusOrder[b.calculatedStatus as keyof typeof statusOrder];
      if (statusDiff !== 0) return statusDiff;
      
      // If same status, sort by time (ascending for upcoming/today, descending for finished)
      const timeA = new Date(a.eventInfo.startTime.replace(/\//g, '-').replace(' ', 'T').replace(' +', '+')).getTime();
      const timeB = new Date(b.eventInfo.startTime.replace(/\//g, '-').replace(' ', 'T').replace(' +', '+')).getTime();
      
      if (a.calculatedStatus === 'finished') return timeB - timeA;
      return timeA - timeB;
    });
  }, [events]);

  const liveEventsCount = eventsWithCalculatedStatus.filter(e => e.calculatedStatus === 'live').length;
  const todayEventsCount = eventsWithCalculatedStatus.filter(e => e.calculatedStatus === 'today').length;
  const finishedEventsCount = eventsWithCalculatedStatus.filter(e => e.calculatedStatus === 'finished').length;
  
  const filters = [
    { id: 'LIVE', label: 'LIVE', count: liveEventsCount, activeColor: 'text-[#00ff88]', borderActive: 'border-[#00ff88]' },
    { id: 'Today', label: 'Today', count: todayEventsCount, activeColor: 'text-white', borderActive: 'border-white' },
    { id: 'Finished', label: 'Finished', count: finishedEventsCount, activeColor: 'text-white', borderActive: 'border-white' },
    { id: 'All', label: 'All', count: eventsWithCalculatedStatus.length, activeColor: 'text-white', borderActive: 'border-white' },
  ];

  const filteredEvents = useMemo(() => {
    return eventsWithCalculatedStatus.filter(e => {
      if (activeFilter === 'LIVE') return e.calculatedStatus === 'live';
      if (activeFilter === 'Today') return e.calculatedStatus === 'today';
      if (activeFilter === 'Finished') return e.calculatedStatus === 'finished';
      return true; // All
    });
  }, [eventsWithCalculatedStatus, activeFilter]);

  return (
    <div className="min-h-screen bg-[#111315] text-white font-sans overflow-x-hidden flex flex-col">
      <Header 
        categories={[]}
        activeCategory={''}
        onSelectCategory={() => {}}
        searchQuery={''}
        onSearchChange={() => {}}
        liveCount={liveEventsCount}
      />

      <main className="flex-1 w-full flex flex-col">
        {/* Banner Section */}
        <div className="relative w-full bg-[#0a0a0f] border-b border-[#2d3032] overflow-hidden">
          {/* Abstract glowing backgrounds */}
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#e50914]/20 rounded-full blur-[120px] pointer-events-none -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-1/4 w-[600px] h-[400px] bg-[#00d4ff]/10 rounded-full blur-[100px] pointer-events-none translate-y-1/2"></div>
          
          <div className="max-w-[1600px] mx-auto px-4 sm:px-8 py-16 relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
             <div className="flex flex-col gap-6 max-w-2xl">
               <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full w-fit">
                 <span className="w-2 h-2 rounded-full bg-[#e50914] animate-pulse"></span>
                 <span className="text-[11px] font-bold text-white uppercase tracking-wider">Live & Upcoming</span>
               </div>
               <h1 className="text-5xl md:text-6xl font-bold tracking-tighter text-white font-['Oswald'] leading-[1.1] uppercase">
                 Experience The Game <br />
                 <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#e50914] to-[#ff4b2b]">Like Never Before</span>
               </h1>
               <p className="text-gray-400 text-lg max-w-xl">
                 Watch crystal clear live streams of your favorite sports. Instant access to football, basketball, cricket, and more.
               </p>
               <div className="flex items-center gap-4 mt-2">
                 <button className="bg-white text-black font-bold px-8 py-3.5 rounded-full hover:bg-gray-200 transition-colors uppercase tracking-wide text-sm">
                   Watch Now
                 </button>
                 <button className="bg-white/10 text-white font-bold px-8 py-3.5 rounded-full hover:bg-white/20 transition-colors uppercase tracking-wide text-sm backdrop-blur-md border border-white/5">
                   View Schedule
                 </button>
               </div>
             </div>
             
             {/* Featured Graphic placeholder */}
             <div className="hidden md:flex flex-1 justify-end relative">
                <div className="w-[400px] h-[300px] bg-gradient-to-tr from-[#1a1a24] to-[#0a0a0f] rounded-2xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden relative group">
                  <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=1200&auto=format&fit=crop')] bg-cover bg-center opacity-40 group-hover:opacity-50 transition-opacity duration-700 mix-blend-luminosity"></div>
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-transparent to-transparent"></div>
                  <div className="absolute bottom-6 left-6 right-6">
                    <div className="flex items-center justify-between mb-2">
                       <span className="text-white font-['Oswald'] text-2xl uppercase tracking-tight font-bold">Champions League</span>
                       <span className="px-2 py-1 bg-[#e50914] text-white text-[10px] font-bold rounded uppercase tracking-wider">Live</span>
                    </div>
                    <p className="text-sm text-gray-400">Real Madrid vs Manchester City</p>
                  </div>
                </div>
             </div>
          </div>
        </div>

        {/* Secondary Filter Header */}
        <div className="w-full bg-[#0a0a0f] border-b border-white/5 sticky top-0 z-10 shadow-lg">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-8 py-4 flex flex-wrap items-center gap-3">
             {filters.map(f => (
               <button
                 key={f.id}
                 onClick={() => setActiveFilter(f.id)}
                 className={cn(
                   "flex items-center gap-2 px-5 py-2 rounded-full text-[13px] font-bold transition-all border",
                   activeFilter === f.id 
                     ? `bg-white/10 ${f.borderActive} ${f.activeColor} shadow-[0_0_15px_rgba(255,255,255,0.05)]` 
                     : "bg-transparent border-transparent text-gray-500 hover:text-gray-200 hover:bg-white/5"
                 )}
               >
                 {f.id === 'LIVE' && <span className={cn("w-2 h-2 rounded-full", activeFilter === 'LIVE' ? "bg-[#e50914] animate-pulse shadow-[0_0_8px_#e50914]" : "bg-gray-500")}></span>}
                 {f.label}
                 <span className="bg-black/40 px-2.5 py-0.5 rounded-full text-[11px] text-gray-400 font-mono">{f.count}</span>
               </button>
             ))}

             <div className="flex-1"></div>

             <div className="flex items-center gap-3 hidden sm:flex">
               <div className="flex items-center gap-1.5 text-[12px] font-bold bg-white/5 px-4 py-2 rounded-full border border-white/10 text-gray-300 hover:text-white transition-colors cursor-pointer hover:bg-white/10">
                 <span className="text-[#e50914]">🔥</span> Top Leagues
               </div>
             </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 w-full bg-[#111315]">
          <div className="max-w-[1600px] mx-auto p-4 sm:p-8">
            {isLoading ? (
              <div className="flex-1 flex items-center justify-center min-h-[50vh]">
                <div className="relative">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#e50914]"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-2 w-2 bg-[#e50914] rounded-full"></div>
                  </div>
                </div>
              </div>
            ) : error ? (
              <div className="flex-1 flex items-center justify-center flex-col gap-4 text-gray-400 mt-20">
                <p className="text-lg">{error}</p>
                <button onClick={() => window.location.reload()} className="px-6 py-2 bg-[#e50914] text-white font-bold rounded-full hover:bg-opacity-90 transition-colors">Try Again</button>
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh] text-gray-500">
                 <div className="w-16 h-16 mb-4 opacity-20 border-2 border-gray-500 rounded-full flex items-center justify-center text-2xl">🏆</div>
                 <p className="text-xl font-bold text-white tracking-tight">No matches found</p>
                 <p className="text-sm mt-2">Try changing your filters to see more events.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-4 xl:gap-6">
                {filteredEvents.map(event => (
                  <MatchCard key={event.id} event={event} onPlay={setActivePlayerEvent} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />

      {activePlayerEvent && (
        <PlayerModal 
          event={activePlayerEvent} 
          onClose={() => setActivePlayerEvent(null)} 
        />
      )}
    </div>
  );
}
