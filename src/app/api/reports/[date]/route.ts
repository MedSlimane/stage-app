import { api } from "../../../../../convex/_generated/api";
import { authorized, client, secret } from "@/lib/server";
export async function GET(_request: Request, { params }: { params: Promise<{date:string}> }) {
  if (!await authorized()) return new Response("Unlock your workspace",{status:401});
  const {date}=await params;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return new Response("Not found",{status:404});
  try {
    const url=await client().query(api.workspace.reportUrl,{token:secret(),date});
    if (!url) return new Response("Report not found",{status:404});
    const file=await fetch(url);
    if (!file.ok) throw new Error("Storage unavailable");
    return new Response(file.body,{headers:{"Content-Type":"application/pdf","Content-Disposition":`inline; filename="internship-report-${date}.pdf"`,"Cache-Control":"private, no-store"}});
  } catch { return new Response("Report unavailable. Please retry when online.",{status:503}); }
}
