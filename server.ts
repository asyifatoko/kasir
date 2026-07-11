import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK securely on the server
let ai: GoogleGenAI | null = null;
try {
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
    ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
} catch (e) {
  console.error("Failed to initialize Gemini SDK:", e);
}

// AI Endpoint to assist product creation
app.post("/api/ai-generate", async (req, res) => {
  const { name, brand, notes } = req.body;

  if (!name) {
    return res.status(400).json({ error: "Product name is required" });
  }

  if (!ai) {
    return res.status(503).json({
      error: "Gemini AI is not configured. Please set your GEMINI_API_KEY in Settings > Secrets."
    });
  }

  try {
    const prompt = `You are a professional retail and POS system inventory assistant.
Analyze the following product details and generate complete retail metadata:
Product Name: "${name}"
Brand / Merk: "${brand || 'Unknown'}"
Additional Notes: "${notes || 'None'}"

Provide a clean, professional, and commercial response containing a product description, category suggestion, tags, SEO titles, keywords, a unique suggested item code, a standard EAN-13 format barcode, and estimated price guidelines (HPP/COGS and retail sale price in Indonesian Rupiah IDR).`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            description: {
              type: Type.STRING,
              description: "A professional commercial product description (2-3 sentences, in Indonesian)."
            },
            category: {
              type: Type.STRING,
              description: "The most appropriate high-level retail category (e.g., Makanan, Minuman, Kesehatan, Kebersihan, Elektronik)."
            },
            tags: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "3 to 5 relevant search tags or keywords."
            },
            seoTitle: {
              type: Type.STRING,
              description: "An SEO-friendly product title (max 60 characters)."
            },
            seoDescription: {
              type: Type.STRING,
              description: "An SEO-friendly meta description (max 160 characters)."
            },
            itemCode: {
              type: Type.STRING,
              description: "A recommended unique item code starting with BRG- followed by 5 numbers."
            },
            barcode: {
              type: Type.STRING,
              description: "A valid-looking 13-digit EAN-13 barcode number (e.g., 899xxxxxxxxxx)."
            },
            recommendedHpp: {
              type: Type.NUMBER,
              description: "A realistic suggested cost price (HPP) in Indonesian Rupiah (IDR)."
            },
            recommendedPrice: {
              type: Type.NUMBER,
              description: "A realistic suggested retail selling price in Indonesian Rupiah (IDR)."
            }
          },
          required: [
            "description",
            "category",
            "tags",
            "seoTitle",
            "seoDescription",
            "itemCode",
            "barcode",
            "recommendedHpp",
            "recommendedPrice"
          ]
        }
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("No text returned from Gemini API");
    }

    const resultJson = JSON.parse(resultText.trim());
    return res.json(resultJson);
  } catch (error: any) {
    console.error("Gemini AI API Error:", error);
    return res.status(500).json({
      error: "Failed to generate AI data: " + (error.message || error)
    });
  }
});

// Setup Vite Dev Server / Static Files
async function setupServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Kasir POS backend server running on http://localhost:${PORT}`);
  });
}

setupServer();
