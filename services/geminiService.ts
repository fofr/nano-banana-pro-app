
import { GoogleGenAI, Modality } from "@google/genai";

export interface ImageInput {
  data: string; // base64 string with data URI prefix
  mimeType: string;
}

export interface GenerateImageResult {
  imageBase64: string;
  groundingMetadata?: any;
}

/**
 * Edits or transforms images based on a text prompt using Gemini.
 * Supports multiple reference images.
 */
export const editImageWithGemini = async (
  images: ImageInput[],
  prompt: string,
  resolution?: string,
  aspectRatio?: string,
  useGrounding: boolean = false
): Promise<GenerateImageResult> => {
  try {
    // Create instance inside function to use the most up-to-date API key
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const parts: any[] = [];

    // Add all image parts
    images.forEach((img) => {
      const base64Data = img.data.split(',')[1];
      parts.push({
        inlineData: {
          data: base64Data,
          mimeType: img.mimeType,
        },
      });
    });

    // Add text prompt
    parts.push({
      text: prompt,
    });

    const config: any = {
      responseModalities: [Modality.IMAGE],
    };

    if (useGrounding) {
      config.tools = [{ googleSearch: {} }];
    }

    const imageConfig: any = {};
    if (resolution) {
      imageConfig.imageSize = resolution;
    }
    if (aspectRatio && aspectRatio !== 'Original') {
      imageConfig.aspectRatio = aspectRatio;
    }

    if (Object.keys(imageConfig).length > 0) {
      config.imageConfig = imageConfig;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: parts,
      },
      config: config,
    });

    const generatedPart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    const groundingMetadata = response.candidates?.[0]?.groundingMetadata;

    if (generatedPart && generatedPart.inlineData && generatedPart.inlineData.data) {
      const imageBytes = generatedPart.inlineData.data;
      return {
        imageBase64: `data:image/jpeg;base64,${imageBytes}`,
        groundingMetadata
      };
    } else {
      throw new Error("No image data returned from the model.");
    }
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    // Handle the specific error case for missing API key/project
    if (error?.message?.includes("Requested entity was not found")) {
      throw new Error("API_KEY_NOT_FOUND");
    }
    if (error instanceof Error) {
      throw new Error(`Failed to generate image: ${error.message}`);
    }
    throw new Error("An unexpected error occurred while communicating with the AI.");
  }
};
