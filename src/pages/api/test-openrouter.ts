/**
 * Test endpoint for OpenRouter Service integration
 *
 * This endpoint allows testing OpenRouter integration without affecting the main application.
 *
 * Usage:
 * GET /api/test-openrouter?test=basic
 * GET /api/test-openrouter?test=flashcards
 * GET /api/test-openrouter?test=config
 * GET /api/test-openrouter?test=all
 */

import type { APIRoute } from "astro";
import { OpenRouterService, OpenRouterError } from "../../lib/openrouter.service";

export const prerender = false;

/**
 * Test basic string response
 */
async function testBasicResponse(apiKey: string) {
  const service = new OpenRouterService({
    apiKey,
    defaultModel: "openai/gpt-3.5-turbo",
    timeout: 30000,
    maxRetries: 2,
  });

  service.setSystemMessage("You are a helpful assistant. Respond briefly and concisely.");
  const response = await service.sendChatMessage("What is 2+2? Answer in one sentence.");

  return { success: true, response };
}

/**
 * Test flashcard generation
 */
async function testFlashcardGeneration(apiKey: string, model?: string, temperature?: number, topP?: number) {
  const service = new OpenRouterService({
    apiKey,
    defaultModel: model || "openai/gpt-3.5-turbo",
    timeout: 60000,
    defaultModelParameters: {
      temperature: temperature ?? 0.7,
      top_p: topP ?? 0.9,
    },
  });

  const systemPrompt = `You are an expert educational content creator. Generate flashcards with:
- front: A clear question (max 200 characters)
- back: A concise answer (max 500 characters)
Return as JSON with an array of flashcards.`;

  const schema = {
    type: "object",
    properties: {
      flashcards: {
        type: "array",
        items: {
          type: "object",
          properties: {
            front: { type: "string", maxLength: 200 },
            back: { type: "string", maxLength: 500 },
          },
          required: ["front", "back"],
        },
        minItems: 3,
        maxItems: 5,
      },
    },
    required: ["flashcards"],
  };

  service.setSystemMessage(systemPrompt);
  service.setResponseFormat(schema);

  const sourceText = `
TypeScript is a strongly typed programming language that builds on JavaScript.
It was developed and is maintained by Microsoft. TypeScript adds optional static
typing to JavaScript. TypeScript code is transpiled to JavaScript, making it
compatible with any environment that runs JavaScript.
  `.trim();

  interface FlashcardResponse {
    flashcards: { front: string; back: string }[];
  }

  const response = await service.sendChatMessage<FlashcardResponse>(
    `Generate flashcards from the following text:\n\n${sourceText}`
  );

  return {
    success: true,
    flashcards: response.flashcards,
    count: response.flashcards.length,
  };
}

/**
 * Test configuration
 */
async function testConfiguration() {
  const apiKey = import.meta.env.OPENROUTER_API_KEY;
  const model = import.meta.env.OPENROUTER_MODEL;
  const temperature = import.meta.env.OPENROUTER_TEMPERATURE;
  const topP = import.meta.env.OPENROUTER_TOP_P;

  return {
    success: true,
    config: {
      hasApiKey: !!apiKey,
      apiKeyPreview: apiKey ? `${apiKey.substring(0, 10)}...` : "Not set",
      model: model || "openai/gpt-4-turbo (default)",
      temperature: temperature || "0.7 (default)",
      topP: topP || "0.9 (default)",
      provider: import.meta.env.AI_SERVICE_PROVIDER || "Not set",
      timeout: import.meta.env.AI_SERVICE_TIMEOUT || "60000 (default)",
    },
  };
}

export const GET: APIRoute = async ({ url }) => {
  const testType = url.searchParams.get("test") || "basic";

  try {
    // Check API key
    const apiKey = import.meta.env.OPENROUTER_API_KEY;

    if (!apiKey && testType !== "config") {
      return new Response(
        JSON.stringify({
          success: false,
          error: "OPENROUTER_API_KEY not configured",
          message: "Please set OPENROUTER_API_KEY in your .env file",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    let result;

    switch (testType) {
      case "basic":
        result = await testBasicResponse(apiKey);
        break;

      case "flashcards": {
        const model = import.meta.env.OPENROUTER_MODEL;
        const temperature = import.meta.env.OPENROUTER_TEMPERATURE
          ? parseFloat(import.meta.env.OPENROUTER_TEMPERATURE)
          : undefined;
        const topP = import.meta.env.OPENROUTER_TOP_P ? parseFloat(import.meta.env.OPENROUTER_TOP_P) : undefined;

        result = await testFlashcardGeneration(apiKey, model, temperature, topP);
        break;
      }

      case "config":
        result = await testConfiguration();
        break;

      case "all": {
        const configResult = await testConfiguration();
        const basicResult = await testBasicResponse(apiKey);
        const flashcardsResult = await testFlashcardGeneration(apiKey);

        result = {
          success: true,
          tests: {
            config: configResult,
            basic: basicResult,
            flashcards: flashcardsResult,
          },
        };
        break;
      }

      default:
        return new Response(
          JSON.stringify({
            success: false,
            error: "Invalid test type",
            message: "Valid test types: basic, flashcards, config, all",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[TestOpenRouter] Error:", error);

    if (error instanceof OpenRouterError) {
      return new Response(
        JSON.stringify({
          success: false,
          error: error.code,
          message: error.message,
          statusCode: error.statusCode,
        }),
        {
          status: error.statusCode || 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: "UNKNOWN_ERROR",
        message: error instanceof Error ? error.message : "Unknown error occurred",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
