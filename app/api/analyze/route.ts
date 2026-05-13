import Anthropic, { AuthenticationError as AnthropicAuthError } from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { GoogleGenerativeAI, GoogleGenerativeAIError } from "@google/generative-ai";

const SYSTEM_PROMPT = `You are a fast quiz-answer extractor.

Return ONLY compact JSON. No markdown. No prose.

Task:
1. Read the visible multiple-choice question and answer choices.
2. Choose the most likely correct answer.
3. If the question or choices are not readable, return {"question":null}.

Schema when readable:
{"question":"text","options":["A. text","B. text","C. text","D. text"],"answer":"A","explanation":"short reason"}

Rules:
- answer must be one uppercase letter from the visible choices.
- Keep question/options concise but faithful.
- Keep explanation under 14 words.
- If unsure because the image is unclear, return {"question":null}.`;

type Provider = "anthropic" | "google" | "openai";

const ALLOWED_MODELS: Record<Provider, Set<string>> = {
  anthropic: new Set(["claude-haiku-4-5", "claude-sonnet-4-6", "claude-opus-4-7"]),
  google: new Set(["gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro"]),
  openai: new Set(["gpt-4o-mini", "gpt-4o"]),
};

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
    value.options.every((o) => typeof o === "string") &&
    /^[A-D]$/.test(String(value.answer)) &&
    typeof value.explanation === "string"
  );
}

function normalizeResult(value: unknown): AnalyzeResult | null {
  if (!isRecord(value)) return null;
  if (value.question === null) return { question: null };
  if (!isQuizResult(value)) return null;
  const options = value.options.map((o) => o.trim()).filter(Boolean);
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

interface ImageData {
  base64Data: string;
  mediaType: "image/jpeg" | "image/png" | "image/webp";
}

function parseImageData(image: string): ImageData | null {
  let base64Data = image;
  let mediaType: ImageData["mediaType"] = "image/jpeg";
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

async function analyzeWithAnthropic(
  apiKey: string,
  model: string,
  img: ImageData,
): Promise<AnalyzeResult | null> {
  const client = new Anthropic({ apiKey });
  const response = await client.messages.create({
    model,
    max_tokens: 160,
    temperature: 0,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: img.mediaType, data: img.base64Data },
          },
        ],
      },
    ],
  });
  const text = response.content
    .filter((p) => p.type === "text")
    .map((p) => p.text)
    .join("")
    .trim();
  return normalizeResult(parseJsonObject(text));
}

async function analyzeWithGoogle(
  apiKey: string,
  model: string,
  img: ImageData,
): Promise<AnalyzeResult | null> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const genModel = genAI.getGenerativeModel({
    model,
    systemInstruction: SYSTEM_PROMPT,
  });
  const result = await genModel.generateContent([
    { inlineData: { data: img.base64Data, mimeType: img.mediaType } },
  ]);
  const text = result.response.text().trim();
  return normalizeResult(parseJsonObject(text));
}

async function analyzeWithOpenAI(
  apiKey: string,
  model: string,
  img: ImageData,
): Promise<AnalyzeResult | null> {
  const client = new OpenAI({ apiKey });
  const response = await client.chat.completions.create({
    model,
    max_tokens: 160,
    temperature: 0,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: {
              url: `data:${img.mediaType};base64,${img.base64Data}`,
              detail: "low",
            },
          },
        ],
      },
    ],
  });
  const text = response.choices[0]?.message?.content?.trim() ?? "";
  return normalizeResult(parseJsonObject(text));
}

function isAuthError(e: unknown, provider: Provider): boolean {
  if (provider === "anthropic") return e instanceof AnthropicAuthError;
  if (provider === "openai") return e instanceof OpenAI.AuthenticationError;
  if (provider === "google") {
    return (
      e instanceof GoogleGenerativeAIError &&
      (e.message.includes("API_KEY_INVALID") ||
        e.message.includes("API key not valid") ||
        e.message.includes("401"))
    );
  }
  return false;
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

  const img = parseImageData(image);
  if (!img) {
    return Response.json({ error: "Invalid image data" }, { status: 400 });
  }

  const providerRaw = isRecord(body) && typeof body.provider === "string" ? body.provider : null;
  const provider: Provider =
    providerRaw && providerRaw in ALLOWED_MODELS
      ? (providerRaw as Provider)
      : "anthropic";

  const modelRaw = isRecord(body) && typeof body.model === "string" ? body.model : null;
  const allowedForProvider = ALLOWED_MODELS[provider];
  const model =
    modelRaw && allowedForProvider.has(modelRaw)
      ? modelRaw
      : [...allowedForProvider][0];

  const apiKey = req.headers.get("X-Api-Key")?.trim();

  if (!apiKey) {
    return Response.json({ error: "No API key configured" }, { status: 401 });
  }

  try {
    let result: AnalyzeResult | null = null;
    if (provider === "anthropic") {
      result = await analyzeWithAnthropic(apiKey, model, img);
    } else if (provider === "google") {
      result = await analyzeWithGoogle(apiKey, model, img);
    } else {
      result = await analyzeWithOpenAI(apiKey, model, img);
    }

    if (!result) {
      return Response.json({ error: "Unexpected AI response" }, { status: 502 });
    }
    return Response.json(result);
  } catch (e) {
    if (isAuthError(e, provider)) {
      return Response.json({ error: "Invalid API key" }, { status: 401 });
    }
    return Response.json({ error: "Analyze request failed" }, { status: 500 });
  }
}
