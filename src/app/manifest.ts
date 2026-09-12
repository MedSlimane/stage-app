import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return { id:"/",name:"Stage — your internship workspace",short_name:"Stage",description:"Discover internships, build your shortlist and take the next step.",start_url:"/",scope:"/",display:"standalone",background_color:"#f5f6f8",theme_color:"#16745c",orientation:"portrait-primary",icons:[{src:"/icons/icon-192.png",sizes:"192x192",type:"image/png",purpose:"any"},{src:"/icons/icon-512.png",sizes:"512x512",type:"image/png",purpose:"any"},{src:"/icons/maskable-512.png",sizes:"512x512",type:"image/png",purpose:"maskable"}],shortcuts:[{name:"Saved opportunities",url:"/?view=saved"},{name:"Daily reports",url:"/?view=reports"}] };
}
