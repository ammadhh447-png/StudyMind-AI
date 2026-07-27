import { v2 as cloudinary } from "cloudinary";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const uploadsDir = path.join(__dirname, "../../uploads");

const configured =
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET;

if (configured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

export async function storeFile(buffer, originalname, mimetype) {
  if (configured) {
    const base64 = buffer.toString("base64");
    const dataUri = `data:${mimetype};base64,${base64}`;
    const result = await cloudinary.uploader.upload(dataUri, {
      folder: "studymind",
      resource_type: "auto",
      public_id: `${Date.now()}-${originalname.replace(/\s+/g, "_")}`,
    });
    return { url: result.secure_url, publicId: result.public_id };
  }

  await fs.mkdir(uploadsDir, { recursive: true });
  const safeName = `${Date.now()}-${originalname.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const filePath = path.join(uploadsDir, safeName);
  await fs.writeFile(filePath, buffer);
  const base = process.env.API_PUBLIC_URL || `http://localhost:${process.env.PORT || 5000}`;
  return { url: `${base}/uploads/${safeName}`, publicId: safeName };
}
