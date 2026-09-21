'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from './Icons';

const nav=[['/dashboard','Dashboard','grid'],['/employees','Employees','users'],['/payroll','Payroll Runs','wallet'],['/organizations','Organizations','building']];
export default function DemoShell({children,title,subtitle}:{children:React.ReactNode;title:string;subtitle:string}){
 const path=usePathname();
 return <div className="min-h-screen bg-slate-50 text-slate-900">
  <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-[#0b1630] text-white lg:flex">
   <div className="flex h-20 items-center gap-3 px-7 border-b border-white/10"><div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-500 font-bold text-lg shadow-lg shadow-blue-500/20">W</div><div><div className="text-lg font-bold tracking-tight">WorkforceIQ</div><div className="text-[10px] uppercase tracking-[.2em] text-blue-200/70">HR Intelligence</div></div></div>
   <div className="px-4 py-7"><div className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[.18em] text-slate-500">Workspace</div>{nav.map(([href,label,icon])=><Link key={href} href={href} className={`mb-1 flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${path===href||path.startsWith(href+'/')?'bg-white/10 text-white':'text-slate-400 hover:bg-white/5 hover:text-white'}`}><Icon name={icon} size={18}/>{label}</Link>)}</div>
   <div className="mt-auto p-4"><div className="rounded-2xl bg-white/5 p-4"><div className="text-xs text-slate-400">Demo workspace</div><div className="mt-1 text-sm font-semibold">Acme Industries</div><div className="mt-3 h-1.5 rounded-full bg-white/10"><div className="h-1.5 w-3/4 rounded-full bg-blue-500"/></div><div className="mt-2 text-[11px] text-slate-500">1,248 of 1,600 seats</div></div><Link href="/login" className="mt-4 flex items-center gap-3 px-3 py-3 text-sm text-slate-400 hover:text-white"><Icon name="logout" size={17}/>Sign out</Link></div>
  </aside>
  <div className="lg:pl-64"><header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur"><div className="flex h-20 items-center justify-between px-5 sm:px-8"><div><h1 className="text-xl font-bold tracking-tight">{title}</h1><p className="mt-0.5 text-xs text-slate-500">{subtitle}</p></div><div className="flex items-center gap-3"><button className="relative rounded-xl p-2.5 text-slate-500 hover:bg-slate-100"><Icon name="bell" size={20}/><span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-blue-500"/></button><div className="hidden h-8 w-px bg-slate-200 sm:block"/><div className="flex items-center gap-2"><div className="grid h-9 w-9 place-items-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">AK</div><div className="hidden sm:block"><div className="text-xs font-semibold">Alex Kumar</div><div className="text-[10px] text-slate-500">HR Administrator</div></div></div></div></div></header><main className="p-5 sm:p-8">{children}</main></div>
 </div>
}
