import { useState, useEffect, useRef } from 'react';
import { cn } from '../utils';

export function MarqueeText({ text, className, containerClassName }: { text: string; className?: string; containerClassName?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  useEffect(() => {
    const checkOverflow = () => {
      if (containerRef.current && textRef.current) {
        setIsOverflowing(textRef.current.scrollWidth > containerRef.current.clientWidth);
      }
    };
    
    checkOverflow();
    window.addEventListener('resize', checkOverflow);
    return () => window.removeEventListener('resize', checkOverflow);
  }, [text]);

  if (!isOverflowing) {
    return (
      <div ref={containerRef} className={cn("overflow-hidden whitespace-nowrap w-full", containerClassName)}>
        <span ref={textRef} className={cn("inline-block truncate", className)}>{text}</span>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={cn("overflow-hidden whitespace-nowrap w-full flex", containerClassName)}>
      <div className="animate-marquee whitespace-nowrap flex w-max">
        <span ref={textRef} className={cn("inline-block pr-8", className)}>{text}</span>
        <span className={cn("inline-block pr-8", className)} aria-hidden="true">{text}</span>
      </div>
    </div>
  );
}
