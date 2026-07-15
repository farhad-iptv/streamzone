export function Footer() {
  return (
    <footer className="bg-[#1e2022] py-8 border-t border-[#2d3032] mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 opacity-50">
            <span className="font-['Oswald'] text-xl font-bold tracking-wider text-white">
              STREAM<span className="text-white">ZONE</span>
            </span>
          </div>
          
          <div className="flex gap-6 text-[13px] font-bold text-gray-400 uppercase">
            <a href="#" className="hover:text-white transition-colors">About</a>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
          </div>
        </div>
        
        <div className="mt-8 text-center text-[12px] text-gray-500">
          <p>Disclaimer: This site does not host any streams. All content is provided by third parties.</p>
          <p className="mt-1">&copy; {new Date().getFullYear()} StreamZone. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
