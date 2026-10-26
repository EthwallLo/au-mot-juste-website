import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { isProductionNewsletterEnabled } from "@/app/lib/newsletterConfig";
import { getPendingProductionPublications, sendNextProductionNewsletterMail } from "@/app/lib/newsletterProduction";
import { scheduleProductionNewsletter } from "@/app/lib/newsletterSchedule";

export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const expected = process.env.CRON_SECRET ? Buffer.from(`Bearer ${process.env.CRON_SECRET}`) : null;
  const actual = Buffer.from(request.headers.get("authorization") || "");
  if (!isProductionNewsletterEnabled() || !expected || expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    return new NextResponse(null, { status: 401 });
  }
  try {
    const jobs = await getPendingProductionPublications();
    for (const job of jobs) await scheduleProductionNewsletter(job.article_id);
    for (let count = 0; count < 2; count++) if (!await sendNextProductionNewsletterMail(null)) break;
    return NextResponse.json({ scheduled: jobs.length }, { headers: { "Cache-Control": "no-store" } });
  } catch { return NextResponse.json({ message: "La reprise de la newsletter a échoué." }, { status: 503 }); }
}
