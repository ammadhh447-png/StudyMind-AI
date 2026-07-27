import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";
import { extractTextFromImage } from "./openrouter.service.js";

function mapFileType(mimetype, filename) {
  if (mimetype === "application/pdf") return "PDF";
  if (
    mimetype.includes("wordprocessing") ||
    filename.endsWith(".docx") ||
    filename.endsWith(".doc")
  ) {
    return "Document";
  }
  if (
    mimetype.includes("presentation") ||
    filename.endsWith(".pptx") ||
    filename.endsWith(".ppt")
  ) {
    return "Presentation";
  }
  if (mimetype.startsWith("image/")) return "Image";
  return "Document";
}

async function extractPdfText(buffer) {
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return {
      text: result.text?.trim() || "",
      pageCount: result.total || result.pages?.length || 0,
    };
  } finally {
    await parser.destroy();
  }
}

export async function extractTextFromFile(buffer, mimetype, filename) {
  const fileType = mapFileType(mimetype, filename);

  if (mimetype === "application/pdf") {
    const extracted = await extractPdfText(buffer);
    return {
      fileType,
      text: extracted.text,
      pageCount: extracted.pageCount,
    };
  }

  if (
    mimetype ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    filename.endsWith(".docx")
  ) {
    const result = await mammoth.extractRawText({ buffer });
    return {
      fileType,
      text: result.value?.trim() || "",
      pageCount: Math.max(1, Math.ceil(result.value.length / 3000)),
    };
  }

  if (mimetype.startsWith("image/")) {
    const text = await extractTextFromImage(buffer, mimetype);
    return { fileType, text, pageCount: 1 };
  }

  return {
    fileType,
    text: "",
    pageCount: 0,
  };
}

export { mapFileType };
