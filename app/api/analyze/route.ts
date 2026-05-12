import Anthropic from "@anthropic-ai/sdk";

const SYSTEM_PROMPT = `Analyze quiz images. Output ONLY valid JSON, no markdown.

If a multiple choice question is visible:
{"question":"full question text","options":["A. option","B. option","C. option","D. option"],"answer":"A","explanation":"brief reason"}

"answer" is one letter: A, B, C, or D.
No question visible: {"question":null}`;

const MODEL = "claude-haiku-4-5";

interface QuizResult {
  question: string;
  options: string[];
  answer: string;
  explanation: string;
}

type AnalyzeResult = QuizResult | { question: null };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isQuizResult(value: unknown): value is QuizResult {
  if (!isRecord(value)) return false;
  return (
    typeof value.question === "string" &&
    Array.isArray(value.options) &&
    value.options.every((option) => typeof option === "string") &&
    /^[A-D]$/.test(String(value.answer)) &&
    typeof value.explanation === "string"
  );
}

function normalizeResult(value: unknown): AnalyzeResult | null {
  if (!isRecord(value)) return null;
  if (value.question === null) return { question: null };
  if (!isQuizResult(value)) return null;

  const options = value.options.map((option) => option.trim()).filter(Boolean);
  if (options.length === 0) return null;

  return {
    question: value.question.trim(),
    options,
    answer: value.answer,
    explanation: value.explanation.trim(),
  };
}

function parseJsonObject(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    return JSON.parse(match[0]);
  }
}

function parseImageData(image: string) {
  let base64Data = image;
  let mediaType: "image/jpeg" | "image/png" | "image/webp" = "image/jpeg";

  if (image.startsWith("data:")) {
    const [header, data] = image.split(",");
    if (!data) return null;

    base64Data = data;
    const match = header.match(/^data:([^;]+)/);
    if (match?.[1] === "image/png" || match?.[1] === "image/webp") {
      mediaType = match[1];
    }
  }

  return { base64Data, mediaType };
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const image = isRecord(body) ? body.image : null;

  if (!image || typeof image !== "string") {
    return Response.json({ error: "Missing image" }, { status: 400 });
  }

  const imageData = parseImageData(image);
  if (!imageData) {
    return Response.json({ error: "Invalid image data" }, { status: 400 });
  }

  try {
    const client = new Anthropic();
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 220,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: imageData.mediaType,
                data: imageData.base64Data,
              },
            },
          ],
        },
      ],
    });

    const text = response.content
      .filter((part) => part.type === "text")
      .map((part) => part.text)
      .join("")
      .trim();

    const result = normalizeResult(parseJsonObject(text));
    if (!result) {
      return Response.json(
        { error: "Unexpected AI response" },
        { status: 502 },
      );
    }

    return Response.json(result);
  } catch {
    return Response.json({ error: "Analyze request failed" }, { status: 500 });
  }
}
