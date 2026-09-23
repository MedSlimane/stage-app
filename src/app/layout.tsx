import type { Metadata, Viewport } from 'next';
import { Geist, Instrument_Serif } from 'next/font/google';
import './globals.css';
const geist=Geist({subsets:['latin'],variable:'--font-geist'});
const serif=Instrument_Serif({subsets:['latin'],weight:'400',style:['normal','italic'],variable:'--font-serif'});
// Applies a saved theme before paint so dark mode never flashes light.
const themeScript=`try{var t=localStorage.getItem('stage-theme');if(t==='dark'||t==='light')document.documentElement.dataset.theme=t}catch(e){}`;
export const metadata:Metadata={title:'Stage — your next chapter',description:'Your personal workspace for six-month AI and software internships.',applicationName:'Stage',appleWebApp:{capable:true,statusBarStyle:'default',title:'Stage'},icons:{icon:'/icons/icon-192.png',apple:'/icons/apple-touch-icon.png'}};
export const viewport:Viewport={width:'device-width',initialScale:1,viewportFit:'cover',themeColor:[{media:'(prefers-color-scheme: light)',color:'#f6f5f1'},{media:'(prefers-color-scheme: dark)',color:'#0f1412'}]};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{__html:themeScript}}/></head><body className={`${geist.variable} ${serif.variable}`}><a className="skip-link" href="#main-content">Skip to content</a>{children}</body></html>;}
