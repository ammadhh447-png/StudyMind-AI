import dotenv from "dotenv";

export async function transcribeWithGroq(buffer, mimeType = "audio/webm") {
  dotenv.config();
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) return null;

  const rawMime = mimeType || "audio/webm";
  const safeMime = rawMime.split(";")[0].trim() || "audio/webm";
  const ext = safeMime.includes("wav")
    ? "wav"
    : safeMime.includes("mp4")
      ? "mp4"
      : safeMime.includes("mpeg") || safeMime.includes("mp3")
        ? "mp3"
        : safeMime.includes("ogg")
          ? "ogg"
          : "webm";

  const bytes = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
  if (bytes.length < 500) {
    throw new Error("Audio clip too short. Speak for a few seconds, then press Stop.");
  }

  const form = new FormData();
  form.append("file", new File([bytes], `speech.${ext}`, { type: safeMime }));
  form.append("model", process.env.GROQ_WHISPER_MODEL || "whisper-large-v3-turbo");
  form.append("response_format", "json");
  form.append("temperature", "0");
  form.append("language", "en");
  form.append(
    "prompt",
    "The student is asking a study or homework question out loud. Transcribe every spoken word exactly."
  );

  const response = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });

  const raw = await response.text();
  let data = {};
  try {
    data = JSON.parse(raw);
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error(data?.error?.message || raw || `Groq transcription failed (${response.status})`);
  }

  return String(data.text || "")
    .trim()
    .replace(/^["']|["']$/g, "")
    .trim();
}
