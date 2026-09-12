import { api } from "../../../../convex/_generated/api";
import { authorized, client, privateHeaders, sameOrigin, secret } from "@/lib/server";
import { NextResponse } from "next/server";

export async function GET() {
  if (!await authorized()) return NextResponse.json({error:"Unlock your workspace"},{status:401,headers:privateHeaders});
  try { return NextResponse.json(await client().query(api.workspace.snapshot,{token:secret()}),{headers:privateHeaders}); }
  catch { return NextResponse.json({error:"Cannot reach your workspace. Please retry."},{status:503,headers:privateHeaders}); }
}
export async function PATCH(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({error:"Invalid origin"},{status:403});
  if (!await authorized()) return NextResponse.json({error:"Unlock your workspace"},{status:401});
  try {
    const {sourceId,saved,stage,notes}=await request.json();
    if (typeof sourceId!=="string" || !/^PFE-\d+$/.test(sourceId) || typeof saved!=="boolean" || typeof notes!=="string" || notes.length>10000 || !["exploring","preparing","applied","interview","offer","archived"].includes(stage)) return NextResponse.json({error:"Invalid update"},{status:400});
    return NextResponse.json(await client().mutation(api.workspace.updateProgress,{token:secret(),sourceId,saved,stage,notes}),{headers:privateHeaders});
  } catch { return NextResponse.json({error:"Could not save. Your previous version is safe; please retry."},{status:503}); }
}
