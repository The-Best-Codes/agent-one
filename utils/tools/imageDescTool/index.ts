import { google } from "@ai-sdk/google";
import { generateText } from "ai";

async function describeImage(imageUrlOrData: string): Promise<string> {
  try {
    const result = await generateText({
      model: google("gemini-2.0-flash-lite"),
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Describe the image in detail. Don't leave any details out.",
            },
            {
              type: "image",
              image: imageUrlOrData,
            },
          ],
        },
      ],
    });

    if (result.text) {
      return result.text;
    } else {
      return "No description available from the model.";
    }
  } catch (error: any) {
    console.error(`Error describing image: ${error.message}`);
    return `Error describing image: ${error.message}`;
  }
}

export { describeImage };
