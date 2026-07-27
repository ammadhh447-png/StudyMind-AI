const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

function getApiKey() {
  return process.env.OPENROUTER_API_KEY;
}

function getModel() {
  return process.env.OPENROUTER_MODEL || "google/gemini-2.5-flash-lite";
}

function getVisionModel() {
  return (
    process.env.OPENROUTER_VISION_MODEL ||
    "google/gemini-2.5-flash-image"
  );
}

function openRouterHeaders() {
  const headers = {
    Authorization: `Bearer ${getApiKey()}`,
    "Content-Type": "application/json",
  };
  if (process.env.CLIENT_URL) {
    headers["HTTP-Referer"] = process.env.CLIENT_URL;
  }
  headers["X-Title"] = "StudyMind AI";
  return headers;
}

function getMaxTokens(override) {
  if (override !== undefined) return override;
  const parsed = parseInt(process.env.OPENROUTER_MAX_TOKENS || "2048", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 2048;
}

async function chatCompletion(messages, model, maxTokens) {
  const apiKey = getApiKey();
  if (!apiKey) {
    return null;
  }

  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: openRouterHeaders(),
    body: JSON.stringify({
      model: model || getModel(),
      messages,
      max_tokens: getMaxTokens(maxTokens),
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenRouter request failed: ${errText.slice(0, 300)}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || "";
}

export async function generateAIResponse({ prompt, context = "", mode = "chat" }) {
  const apiKey = getApiKey();
  if (!apiKey) {
    return `[${mode}] Configure OPENROUTER_API_KEY to enable live AI responses. Prompt received: ${prompt.slice(0, 120)}...`;
  }

  const systemBase =
    mode === "chat"
      ? "You are StudyMind AI, a helpful learning tutor. Write clear, professional answers using short paragraphs and simple bullet lists. Do not use markdown bold (**), excessive asterisks, or decorative symbols."
      : mode === "summarise" || mode === "json"
        ? "You are StudyMind AI, an expert study coach for students. Output accurate, exam-focused content in plain language. Never use markdown headings (#), asterisks, or decorative formatting in string values."
        : "You are StudyMind AI, a helpful learning tutor.";

  const system = context
    ? `${systemBase}\n\nUse this study material context when answering:\n${context.slice(0, 8000)}`
    : systemBase;

  const maxOut =
    mode === "json" || mode === "summarise"
      ? 4096
      : mode === "score"
        ? 32
        : getMaxTokens();

  return chatCompletion(
    [
      { role: "system", content: system },
      { role: "user", content: prompt.slice(0, 12000) },
    ],
    getModel(),
    maxOut
  );
}

export async function extractTextFromImage(buffer, mimeType) {
  const apiKey = getApiKey();
  if (!apiKey) {
    return "";
  }

  try {
    const text = await chatCompletion(
      [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extract all readable study text from this image. Return plain text only.",
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${buffer.toString("base64")}`,
              },
            },
          ],
        },
      ],
      getVisionModel(),
      4096
    );
    return text || "";
  } catch {
    return "";
  }
}

export async function generateStructuredJSON({ prompt, context = "" }) {
  const raw = await generateAIResponse({
    prompt: `${prompt}\n\nRespond with valid JSON only, no markdown fences.`,
    context,
    mode: "json",
  });
  const cleaned = raw.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      return JSON.parse(match[0]);
    }
    throw new Error("AI returned invalid JSON. Try again.");
  }
}
