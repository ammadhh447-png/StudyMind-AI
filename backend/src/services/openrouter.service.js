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

async function chatCompletion(messages, model, maxTokens, attempt = 1, options = {}) {
  const apiKey = getApiKey();
  if (!apiKey) {
    return null;
  }

  const body = {
    model: model || getModel(),
    messages,
    max_tokens: getMaxTokens(maxTokens),
  };
  if (options.json) {
    body.response_format = { type: "json_object" };
  }

  let response;
  try {
    response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: openRouterHeaders(),
      body: JSON.stringify(body),
    });
  } catch (err) {
    if (attempt < 3) {
      await new Promise((r) => setTimeout(r, 600 * attempt));
      return chatCompletion(messages, model, maxTokens, attempt + 1, options);
    }
    const cause = err instanceof Error && "cause" in err ? err.cause : null;
    const code =
      cause && typeof cause === "object" && "code" in cause
        ? String(cause.code)
        : "";
    if (code === "ENOTFOUND" || code === "EAI_AGAIN") {
      throw new Error(
        "Cannot reach OpenRouter (DNS lookup failed). Check your internet/DNS, try another network, or flush DNS (ipconfig /flushdns), then try again."
      );
    }
    if (code === "ETIMEDOUT" || code === "ECONNRESET" || code === "UND_ERR_CONNECT_TIMEOUT") {
      throw new Error(
        "OpenRouter connection timed out. Check your internet connection and try again."
      );
    }
    throw new Error(
      `Cannot reach OpenRouter: ${err instanceof Error ? err.message : "network error"}. Check your internet and try again.`
    );
  }

  if (!response.ok) {
    const errText = await response.text();
    if (options.json && /response_format|json_object/i.test(errText) && !options._jsonFallback) {
      return chatCompletion(messages, model, maxTokens, 1, {
        ...options,
        json: false,
        _jsonFallback: true,
      });
    }
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
      : mode === "json"
        ? "You are StudyMind AI. Reply with a single valid JSON object only. No markdown, no code fences, no commentary before or after the JSON."
        : mode === "summarise"
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
    maxOut,
    1,
    { json: mode === "json" }
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

function parseJSONLoose(raw) {
  if (!raw || typeof raw !== "string") {
    throw new Error("AI returned empty response. Try again.");
  }

  let text = raw.trim();
  text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    text = text.slice(start, end + 1);
  }

  text = text
    .replace(/,\s*([}\]])/g, "$1")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2018\u2019]/g, "'");

  try {
    return JSON.parse(text);
  } catch {
    const repaired = text
      .replace(/\n/g, " ")
      .replace(/\t/g, " ")
      .replace(/,\s*([}\]])/g, "$1");
    return JSON.parse(repaired);
  }
}

export async function generateStructuredJSON({ prompt, context = "" }) {
  let lastError;
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    const raw = await generateAIResponse({
      prompt:
        attempt === 1
          ? `${prompt}\n\nReturn ONLY one valid JSON object. No markdown fences.`
          : `${prompt}\n\nIMPORTANT: Previous reply was invalid. Return ONLY a valid JSON object matching the required shape. No markdown, no extra text.`,
      context,
      mode: "json",
    });
    try {
      return parseJSONLoose(raw);
    } catch (err) {
      lastError = err;
    }
  }
  throw new Error(
    lastError instanceof Error
      ? "AI returned invalid JSON. Try generate again."
      : "AI returned invalid JSON. Try again."
  );
}
