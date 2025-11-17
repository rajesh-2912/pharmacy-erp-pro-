import { GoogleGenAI, Type } from "@google/genai";
import type { GenerateContentResponse } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export const getAiResponse = async (prompt: string): Promise<string> => {
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: "You are an expert pharmaceutical assistant. Provide clear, concise, and accurate information related to medications. Do not provide medical advice. For queries about inventory, use the provided context to answer.",
      },
    });
    return response.text;
  } catch (error) {
    console.error("Error getting response from Gemini API:", error);
    return "Sorry, I encountered an error. Please try again.";
  }
};

const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
};

export const getOcrDataFromImage = async (imageFile: File): Promise<any> => {
    try {
        const imagePart = await fileToGenerativePart(imageFile);
        const prompt = `Analyze this image of a pharmacy stock list or invoice. Extract all medicine details. Return a valid JSON array of objects. Each object must have these keys: 'name' (string), 'manufacturer' (string), 'stock' (number), 'mrp' (number, Maximum Retail Price), 'expiryDate' (string, 'YYYY-MM-DD' format), 'category' (string, e.g., 'Painkiller', 'Antibiotic'), 'batchNumber' (string), 'hsnCode' (string). If a value is missing, use a reasonable default like 'Unknown' or null.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [
                { text: prompt },
                imagePart
            ]},
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            name: { type: Type.STRING },
                            manufacturer: { type: Type.STRING },
                            stock: { type: Type.NUMBER },
                            mrp: { type: Type.NUMBER },
                            expiryDate: { type: Type.STRING },
                            category: { type: Type.STRING },
                            batchNumber: { type: Type.STRING },
                            hsnCode: { type: Type.STRING },
                        },
                        required: ["name", "stock", "mrp", "expiryDate", "batchNumber", "hsnCode"]
                    }
                }
            }
        });
        
        const jsonText = response.text.trim();
        return JSON.parse(jsonText);
    } catch (error) {
        console.error("Error getting OCR data from Gemini API:", error);
        return { error: `Failed to process image: ${error.message || 'Unknown error'}. Please ensure it's clear and retry.` };
    }
};