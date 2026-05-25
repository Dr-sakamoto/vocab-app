import { evaluateAnswer } from "@/lib/answerEvaluation";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    const { input, answers } = await req.json();
    const result = await evaluateAnswer({ input, answers });
    return Response.json(result);
  } catch (error) {
    console.error("answer check failed", error);
    return Response.json(
      { status: "wrong", error: "ANSWER_CHECK_FAILED" },
      { status: 500 },
    );
  }
}
