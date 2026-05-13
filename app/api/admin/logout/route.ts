import { NextResponse } from "next/server";
import { clearAdminSessionCookie } from "@/app/lib/adminSession";

export async function POST() {
  const response = NextResponse.json({ message: "Déconnexion réussie." });
  clearAdminSessionCookie(response);
  return response;
}

