import { cn } from '../utils';
import { Search, Flame } from 'lucide-react';

interface HeaderProps {
  categories: string[];
  activeCategory: string;
  onSelectCategory: (cat: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  liveCount: number;
}

export function Header({ categories, activeCategory, onSelectCategory, searchQuery, onSearchChange, liveCount }: HeaderProps) {
  const navLinks = [
    "Highlights", "Rankings", "Results", "Schedule", "News"
  ];

  return (
    <header className="w-full bg-[#0a0a0f] border-b border-white/5 z-[100] h-[72px] flex items-center justify-between px-4 sm:px-8">
      <div className="flex items-center">
        {/* Logo Placeholder */}
        <div className="flex items-center gap-2.5 cursor-pointer mr-10 group">
          <div className="relative flex items-center justify-center w-8 h-8 bg-gradient-to-br from-[#e50914] to-[#ff4b2b] rounded-lg shadow-[0_0_15px_rgba(229,9,20,0.5)]">
             <Flame className="w-5 h-5 text-white animate-pulse" />
          </div>
          <span className="font-['Oswald'] text-[26px] font-bold tracking-tight text-white uppercase group-hover:text-[#e50914] transition-colors">
            StreamZone
          </span>
        </div>

        {/* Navigation Links */}
        <nav className="hidden xl:flex items-center gap-8">
          {navLinks.map(link => (
            <a
              key={link}
              href="#"
              className="text-[13px] font-bold text-gray-400 hover:text-white uppercase transition-colors tracking-wide"
            >
              {link}
            </a>
          ))}
        </nav>
      </div>

      <div className="hidden lg:flex items-center gap-4">
         <div className="relative">
           <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
           <input
             type="text"
             placeholder="Search events, teams..."
             value={searchQuery}
             onChange={(e) => onSearchChange(e.target.value)}
             className="bg-[#1a1a24] border border-white/10 rounded-full pl-9 pr-4 py-2 text-[13px] text-white placeholder:text-gray-500 focus:outline-none focus:border-[#e50914] focus:ring-1 focus:ring-[#e50914] transition-all w-[240px]"
           />
         </div>
         <button className="bg-gradient-to-r from-[#e50914] to-[#ff4b2b] text-white text-[13px] font-bold px-5 py-2 rounded-full hover:shadow-[0_0_15px_rgba(229,9,20,0.4)] transition-all uppercase tracking-wide">
           Premium
         </button>
      </div>
    </header>
  );
}
