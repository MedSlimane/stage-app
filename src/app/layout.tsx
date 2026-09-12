import type { Metadata, Viewport } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';
const geist=Geist({subsets:['latin'],variable:'--font-geist'});
export const metadata:Metadata={title:'Stage — your next chapter',description:'Your personal workspace for six-month AI and software internships.',applicationName:'Stage',appleWebApp:{capable:true,statusBarStyle:'default',title:'Stage'},icons:{icon:'/icons/icon-192.png',apple:'/icons/apple-touch-icon.png'}};
export const viewport:Viewport={width:'device-width',initialScale:1,viewportFit:'cover',themeColor:'#16745c'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body className={geist.variable}><a className="skip-link" href="#main-content">Skip to content</a>{children}</body></html>;}
