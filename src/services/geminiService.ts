import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import { DriverData } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function parseDriverLine(text: string): Promise<DriverData> {
  const prompt = `Extraia os dados desta linha: "${text}". 
  Responda APENAS com um JSON simples, sem formatação de markdown.
  Campos: motorista, cpf, placa, destino, transportadora.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      }
    });

    const responseText = response.text || "{}";
    // Limpeza básica para garantir que é um JSON puro
    const jsonString = responseText.replace(/```json|```/g, "").trim();
    return JSON.parse(jsonString);
  } catch (e) {
    console.error("Erro na IA:", e);
    return {} as DriverData;
  }
}