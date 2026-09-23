import { api } from "../../../../convex/_generated/api";
import { authorized, client, privateHeaders, sameOrigin, secret } from "@/lib/server";
import { demoMode, demoSnapshot, demoUpdate } from "@/lib/demo";
import { parseProgressInput } from "@/lib/progress";
import { NextResponse } from "next/server";

export async function GET() {
  if (!await authorized()) return NextResponse.json({error:"Unlock your workspace"},{status:401,headers:privateHeaders});
  if (demoMode()) return NextResponse.json(demoSnapshot(),{headers:privateHeaders});
  try { return NextResponse.json(await client().query(api.workspace.snapshot,{token:secret()}),{headers:privateHeaders}); }
  catch { return NextResponse.json({error:"Cannot reach your workspace. Please retry."},{status:503,headers:privateHeaders}); }
}
export async function PATCH(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({error:"Invalid origin"},{status:403});
  if (!await authorized()) return NextResponse.json({error:"Unlock your workspace"},{status:401});
  try {
    const input=parseProgressInput(await request.json().catch(()=>null));
    if (!input) return NextResponse.json({error:"Invalid update"},{status:400});
    if (demoMode()) return NextResponse.json(demoUpdate(input),{headers:privateHeaders});
    return NextResponse.json(await client().mutation(api.workspace.updateProgress,{token:secret(),...input}),{headers:privateHeaders});
  } catch { return NextResponse.json({error:"Could not save. Your previous version is safe; please retry."},{status:503}); }
}
