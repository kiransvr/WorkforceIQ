import React from 'react';

type Props = { size?: number; className?: string };
const base = (size:number, className?:string) => ({ width:size, height:size, className, fill:'none', stroke:'currentColor', strokeWidth:1.8, strokeLinecap:'round' as const, strokeLinejoin:'round' as const, viewBox:'0 0 24 24' });
export const Icon = ({name,size=20,className}: Props & {name:string}) => {
  const p=base(size,className);
  const paths: Record<string, React.ReactNode> = {
    grid:<><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
    users:<><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></>,
    user:<><circle cx="12" cy="7" r="4"/><path d="M5 21a7 7 0 0 1 14 0"/></>,
    wallet:<><path d="M3 7h18v13H3z"/><path d="M3 7l2-4h16v4"/><path d="M16 13h5v4h-5a2 2 0 1 1 0-4Z"/></>,
    building:<><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 21V7h10v14M10 10h1M13 10h1M10 14h1M13 14h1M10 18h1M13 18h1"/></>,
    search:<><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
    bell:<><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></>,
    chevron:<path d="m9 18 6-6-6-6"/>,
    arrow:<><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></>,
    calendar:<><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></>,
    more:<><circle cx="5" cy="12" r="1" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="19" cy="12" r="1" fill="currentColor"/></>,
    trend:<><path d="m3 17 6-6 4 4 8-9"/><path d="M15 6h6v6"/></>,
    check:<path d="m5 12 4 4L19 6"/>,
    plus:<><path d="M12 5v14M5 12h14"/></>,
    logout:<><path d="M10 17l5-5-5-5M15 12H3"/><path d="M21 3v18"/></>,
  };
  return <svg {...p}>{paths[name]}</svg>;
};
