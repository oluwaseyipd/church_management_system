import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

export async function GET(request) {
  const tokenCookie = request.cookies.get("token");
  const token = tokenCookie ? tokenCookie.value : null;

  if (!token) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  try {
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET || "default-fallback-secret-key-32chars"
    );
    const { payload } = await jwtVerify(token, secret);
    return NextResponse.json({ 
      id: payload.id, 
      email: payload.email, 
      name: payload.name 
    });
  } catch (err) {
    return NextResponse.json({ error: "Invalid session token" }, { status: 401 });
  }
}
