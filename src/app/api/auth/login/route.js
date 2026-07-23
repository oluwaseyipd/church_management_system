import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required fields" },
        { status: 400 }
      );
    }

    const users = await query("SELECT * FROM users WHERE email = ?", [email]);
    
    if (users.length === 0) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const user = users[0];
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    
    if (!isPasswordMatch) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const secretKey = new TextEncoder().encode(
      process.env.JWT_SECRET || "default-fallback-secret-key-32chars"
    );
    
    const token = await new SignJWT({ 
      id: user.id, 
      email: user.email, 
      name: user.name 
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(secretKey);

    const response = NextResponse.json({ 
      success: true, 
      message: "Log in successful",
      user: { id: user.id, email: user.email, name: user.name }
    });

    response.cookies.set({
      name: "token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 604800, // 7 days
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login API route error:", error);
    return NextResponse.json(
      { error: "Internal Server Error during authentication" },
      { status: 500 }
    );
  }
}
