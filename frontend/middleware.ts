import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const url = req.nextUrl;

  if (url.pathname === "/") {
    const hasVisited = req.cookies.get("visited");

    if (!hasVisited) {
      const res = NextResponse.redirect(new URL("/landing", req.url));
      res.cookies.set("visited", "true", {
        path: "/",
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });
      return res;
    }
  }

  return NextResponse.next();
}
