'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Icon } from './Icons';
import apiClient, { AuthenticatedUser, clearAccessToken } from '../lib/api/client';

const nav=[['/dashboard','Dashboard','grid'],['/employees','Employees','users'],['/payroll','Payroll Runs','wallet'],['/organizations','Organizations','building']];
export default function DemoShell({children,title,subtitle}:{children:React.ReactNode;title:string;subtitle:string}){
 const path=usePathname();
 const router=useRouter();
 const [user,setUser]=useState<AuthenticatedUser|null>(null);
 const [sessionError,setSessionError]=useState('');
 useEffect(()=>{
  let active=true;
  if(!window.localStorage.getItem('access_token')){router.replace('/login');return;}
  apiClient.get<{user:AuthenticatedUser}>('/auth/me')
   .then(({data})=>{if(active)setUser(data.user);})
   .catch(()=>{if(active)setSessionError('Unable to verify your session. Check that the API is available, then retry.');});
  return()=>{active=false;};
 },[router]);
 function signOut(){clearAccessToken();router.replace('/login');}
 if(!user){
  return <div className="grid min-h-screen place-items-center bg-slate-50 p-6 text-center">
   <div className="max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
    {sessionError?<><h1 className="font-semibold text-slate-900">Session unavailable</h1><p role="alert" className="mt-2 text-sm text-rose-700">{sessionError}</p><button onClick={()=>window.location.reload()} className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white">Retry</button><button onClick={signOut} className="ml-2 mt-4 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold">Sign out</button></>:<p className="text-sm text-slate-500">Checking your session…</p>}
   </div>
  </div>;
 }
 return <div className="min-h-screen bg-slate-50 text-slate-900">
  <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-[#0b1630] text-white lg:flex">
   <div className="flex h-20 items-center gap-3 px-7 border-b border-white/10"><div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-500 font-bold text-lg shadow-lg shadow-blue-500/20">W</div><div><div className="text-lg font-bold tracking-tight">WorkforceIQ</div><div className="text-[10px] uppercase tracking-[.2em] text-blue-200/70">HR Intelligence</div></div></div>
   <div className="px-4 py-7"><div className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[.18em] text-slate-500">Workspace</div>{nav.map(([href,label,icon])=><Link key={href} href={href} className={`mb-1 flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${path===href||path.startsWith(href+'/')?'bg-white/10 text-white':'text-slate-400 hover:bg-white/5 hover:text-white'}`}><Icon name={icon} size={18}/>{label}</Link>)}</div>
   <div className="mt-auto p-4"><div className="rounded-2xl bg-white/5 p-4"><div className="text-xs text-slate-400">Organization workspace</div><div className="mt-1 break-all text-sm font-semibold">{user.organizationId ?? 'No organization assigned'}</div><div className="mt-3 text-[11px] capitalize text-slate-500">{user.role.replaceAll('_',' ')}</div></div><button onClick={signOut} className="mt-4 flex items-center gap-3 px-3 py-3 text-sm text-slate-400 hover:text-white"><Icon name="logout" size={17}/>Sign out</button></div>
  </aside>
  <div className="lg:pl-64"><header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur"><div className="flex h-20 items-center justify-between px-5 sm:px-8"><div><h1 className="text-xl font-bold tracking-tight">{title}</h1><p className="mt-0.5 text-xs text-slate-500">{subtitle}</p></div><div className="flex items-center gap-3"><div className="hidden h-8 w-px bg-slate-200 sm:block"/><div className="flex items-center gap-2"><div className="grid h-9 w-9 place-items-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">{user.email.slice(0,2).toUpperCase()}</div><div className="hidden sm:block"><div className="text-xs font-semibold">{user.email}</div><div className="text-[10px] capitalize text-slate-500">{user.role.replaceAll('_',' ')}</div></div></div></div></div></header><main className="p-5 sm:p-8">{children}</main></div>
 </div>
}
