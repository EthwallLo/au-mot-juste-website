import { timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { setAdminSessionCookie } from "@/app/lib/adminSession";

function safeCompare(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

export async function POST(request: NextRequest) {
  const { username, password } = (await request.json().catch(() => ({}))) as {
    username?: string;
    password?: string;
  };

  const expectedUsername = process.env.ADMIN_USERNAME ?? "";
  const expectedPassword = process.env.ADMIN_PASSWORD ?? "";

  if (!expectedUsername || !expectedPassword) {
    return NextResponse.json(
      { message: "Les identifiants admin ne sont pas configurés." },
      { status: 500 },
    );
  }

  const isValid =
    typeof username === "string" &&
    typeof password === "string" &&
    safeCompare(username, expectedUsername) &&
    safeCompare(password, expectedPassword);

  if (!isValid) {
    return NextResponse.json(
      { message: "Identifiants incorrects." },
      { status: 401 },
    );
  }

  const response = NextResponse.json({ message: "Connexion réussie." });
  setAdminSessionCookie(response, username);
  return response;
}

