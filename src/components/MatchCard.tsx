import { useState, useEffect } from 'react';
import { SportsEvent } from '../types';
import { MarqueeText } from './MarqueeText';
import { getCountdownParts, getUptimeParts, cn } from '../utils';
import { Zap } from 'lucide-react';

interface MatchCardProps {
  event: SportsEvent;
  onPlay: (event: SportsEvent) => void;
}

export function MatchCard({ event, onPlay }: MatchCardProps) {
  const isLive = event.calculatedStatus === 'live';
  const isFinished = event.calculatedStatus === 'finished';
  
  const [timeLeft, setTimeLeft] = useState(getCountdownParts(event.eventInfo.startTime));
  const [upTime, setUpTime] = useState(getUptimeParts(event.eventInfo.startTime));

  useEffect(() => {
    if (isFinished) return;
    const interval = setInterval(() => {
      if (isLive) {
        setUpTime(getUptimeParts(event.eventInfo.startTime));
      } else {
        setTimeLeft(getCountdownParts(event.eventInfo.startTime));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isLive, isFinished, event.eventInfo.startTime]);

  const rawScore = event.eventInfo.score || '0 - 0';
  const scoreParts = rawScore.split('-');
  const scoreA = scoreParts[0]?.trim() || '0';
  const scoreB = scoreParts[1]?.trim() || '0';

  const formatMatchStartTime = (dateStr: string) => {
    try {
      // API date format is "YYYY/MM/DD HH:mm:ss +0000"
      // Convert it to standard ISO format
      const isoString = dateStr.replace(/\//g, '-').replace(' ', 'T').replace(' +', '+');
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return dateStr; // fallback to raw string
      
      const localHours = date.getHours().toString().padStart(2, '0');
      const localMins = date.getMinutes().toString().padStart(2, '0');
      const localDate = date.getDate().toString().padStart(2, '0');
      const localMonth = (date.getMonth() + 1).toString().padStart(2, '0');
      
      return `${localHours}:${localMins} - ${localDate}/${localMonth}`;
    } catch {
      return dateStr;
    }
  };

  const proxyImageUrl = (url?: string) => {
    if (!url) return 'https://placehold.co/32';
    return `/api/proxy-image?url=${encodeURIComponent(url)}`;
  };

  return (
    <div
      onClick={() => onPlay(event)}
      className="bg-[#1a1a1c] border border-red-600/50 hover:border-red-500 rounded-xl px-4 py-6 transition-all cursor-pointer w-full flex flex-col shadow-lg hover:shadow-xl group relative mt-4"
    >
      {/* Top Center Badge (Hanging) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 z-10 flex items-center justify-center">
         {isLive ? (
           <div 
             className="bg-gradient-to-b from-[#2cb548] to-[#1a7d2e] text-white px-8 py-1 text-[12px] font-bold shadow-[0_4px_10px_rgba(44,181,72,0.3)] border-b border-[#3de05c]/30 flex items-center gap-1.5"
             style={{ clipPath: 'polygon(0 0, 100% 0, calc(100% - 12px) 100%, 12px 100%)' }}
           >
             <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
             LIVE
           </div>
         ) : isFinished ? (
           <div 
             className="bg-gradient-to-b from-gray-600 to-gray-800 text-white px-8 py-1 text-[12px] font-bold shadow-lg border-b border-gray-500/30"
             style={{ clipPath: 'polygon(0 0, 100% 0, calc(100% - 12px) 100%, 12px 100%)' }}
           >
             FINISHED
           </div>
         ) : (
           <div 
             className="bg-gradient-to-b from-[#2cb548] to-[#1a7d2e] text-white px-8 py-1 text-[12px] font-bold shadow-[0_4px_10px_rgba(44,181,72,0.3)] border-b border-[#3de05c]/30 flex items-center gap-1.5"
             style={{ clipPath: 'polygon(0 0, 100% 0, calc(100% - 12px) 100%, 12px 100%)' }}
           >
             UPCOMING
           </div>
         )}
      </div>

      {/* Bottom Center Badge */}
      {(!isFinished) && (
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 z-10 flex items-center justify-center">
          <div 
             className="bg-[#1a1a24] text-white border-t border-x border-[#2d2d3d] px-8 py-1 text-[12px] font-bold shadow-[0_-4px_10px_rgba(0,0,0,0.3)] flex items-center gap-1.5"
             style={{ clipPath: 'polygon(12px 0, calc(100% - 12px) 0, 100% 100%, 0 100%)' }}
          >
            {isLive ? <span className="text-[#00ff88]">{upTime.totalM}'</span> : <span className="text-gray-300 tracking-widest">{timeLeft.h}:{timeLeft.m}:{timeLeft.s}</span>}
          </div>
        </div>
      )}

      {/* Top Info */}
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-2 max-w-[50%] min-w-0">
          <span className="text-[14px] shrink-0">🏆</span>
          <MarqueeText text={event.eventInfo.eventName} className="text-[12px] font-bold text-gray-400 uppercase tracking-wider" containerClassName="flex-1 min-w-0" />
        </div>

        <div className="text-[12px] text-gray-400 font-bold max-w-[45%] shrink-0 text-right tracking-wide">
          {formatMatchStartTime(event.eventInfo.startTime)}
        </div>
      </div>

      {/* Teams and Score Row */}
      <div className="flex justify-center items-center gap-4 px-2 mb-2">
        {/* Team A */}
        <div className="flex items-center justify-end gap-3 flex-1 min-w-0 w-0">
          <MarqueeText text={event.eventInfo.teamA} className="text-[16px] font-bold text-white" containerClassName="flex-1 min-w-0 flex justify-end" />
          <img src={proxyImageUrl(event.eventInfo.teamAFlag)} alt={event.eventInfo.teamA} className="w-8 h-8 md:w-10 md:h-10 object-cover shrink-0 rounded-full bg-white" />
        </div>
        
        {/* VS / Score Pill */}
        <div className="shrink-0 z-10 px-2 sm:px-4">
             <div className="flex flex-col items-center justify-center gap-1">
               <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-gray-800 to-black border border-white/10 shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                 <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-[#ffb703] fill-[#ffb703]" />
               </div>
               <span className="text-[9px] sm:text-[10px] text-gray-500 font-bold tracking-widest uppercase">VS</span>
             </div>
        </div>

        {/* Team B */}
        <div className="flex items-center justify-start gap-3 flex-1 min-w-0 w-0">
          <img src={proxyImageUrl(event.eventInfo.teamBFlag)} alt={event.eventInfo.teamB} className="w-8 h-8 md:w-10 md:h-10 object-cover shrink-0 rounded-full bg-white" />
          <MarqueeText text={event.eventInfo.teamB} className="text-[16px] font-bold text-white" containerClassName="flex-1 min-w-0 flex justify-start" />
        </div>
      </div>
    </div>
  );
}

