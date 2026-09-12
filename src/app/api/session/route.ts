import { NextResponse } from "next/server";
import { sameOrigin, safeEqual, sign } from "@/lib/server";
export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({error:"Invalid origin"},{status:403});
  const body=await request.json().catch(()=>null);
  const code=body?.code;
  const expected=process.env.STAGE_ACCESS_CODE;
  if (!expected || typeof code!=="string" || !safeEqual(code,expected)) {
    await new Promise(resolve=>setTimeout(resolve,700));
    return NextResponse.json({error:"That access code did not match."},{status:401});
  }
  const expiry=String(Date.now()+30*24*60*60*1000);
  const response=NextResponse.json({ok:true});
  response.cookies.set("stage_session",expiry+"."+sign(expiry),{httpOnly:true,sameSite:"strict",secure:!!process.env.VERCEL || new URL(request.url).protocol==="https:",path:"/",maxAge:30*24*60*60});
  return response;
}
export async function DELETE(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({error:"Invalid origin"},{status:403});
  const response=NextResponse.json({ok:true});response.cookies.delete("stage_session");return response;
}
