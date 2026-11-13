import { createQuestionIntake } from "@/lib/question-intake";
import { SITE_URL } from "@/lib/site";

export const maxDuration = 30;

function intake(request: Request) {
  return createQuestionIntake({
    secret: process.env.QUESTIONS_SHARED_SECRET || "",
    scriptUrl: process.env.QUESTIONS_SCRIPT_URL || "",
    origin: process.env.NODE_ENV === "production" ? SITE_URL : new URL(request.url).origin,
    vercel: process.env.VERCEL === "1"
  });
}

export async function GET(request: Request) { return intake(request).GET(); }
export async function POST(request: Request) { return intake(request).POST(request); }
