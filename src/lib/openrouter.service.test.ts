/**
 * Integration test for OpenRouter Service
 *
 * This is a manual test file to verify OpenRouter integration.
 * To run: `npm run dev` and access the test endpoint, or run this file directly with ts-node.
 *
 * Requirements:
 * - Set OPENROUTER_API_KEY in .env
 * - Set OPENROUTER_MODEL (optional)
 * - Set OPENROUTER_TEMPERATURE (optional)
 * - Set OPENROUTER_TOP_P (optional)
 */

import { OpenRouterService } from "./openrouter.service";

/**
 * Test 1: Basic string response
 */
async function testBasicResponse() {
  console.log("\n=== Test 1: Basic String Response ===");

  try {
    const service = new OpenRouterService({
      apiKey: process.env.OPENROUTER_API_KEY || "",
      defaultModel: "openai/gpt-3.5-turbo", // Using cheaper model for testing
      timeout: 30000,
      maxRetries: 2,
    });

    service.setSystemMessage("You are a helpful assistant. Respond briefly and concisely.");

    const response = await service.sendChatMessage("What is 2+2? Answer in one sentence.");

    console.log("✅ Response received:", response);
    console.log("✅ Test passed!");
    return true;
  } catch (error) {
    console.error("❌ Test failed:", error);
    return false;
  }
}

/**
 * Test 2: Structured JSON response
 */
async function testStructuredResponse() {
  console.log("\n=== Test 2: Structured JSON Response ===");

  try {
    const service = new OpenRouterService({
      apiKey: process.env.OPENROUTER_API_KEY || "",
      defaultModel: "openai/gpt-3.5-turbo",
      timeout: 30000,
    });

    service.setSystemMessage("Generate a simple quiz question.");
    service.setResponseFormat({
      type: "object",
      properties: {
        question: { type: "string" },
        answer: { type: "string" },
      },
      required: ["question", "answer"],
    });

    interface QuizResponse {
      question: string;
      answer: string;
    }

    const response = await service.sendChatMessage<QuizResponse>("Generate one quiz question about JavaScript.");

    console.log("✅ Question:", response.question);
    console.log("✅ Answer:", response.answer);
    console.log("✅ Test passed!");
    return true;
  } catch (error) {
    console.error("❌ Test failed:", error);
    return false;
  }
}

/**
 * Test 3: Flashcard generation (full integration)
 */
async function testFlashcardGeneration() {
  console.log("\n=== Test 3: Flashcard Generation ===");

  try {
    const service = new OpenRouterService({
      apiKey: process.env.OPENROUTER_API_KEY || "",
      defaultModel: process.env.OPENROUTER_MODEL || "openai/gpt-3.5-turbo",
      timeout: 60000,
      defaultModelParameters: {
        temperature: process.env.OPENROUTER_TEMPERATURE ? parseFloat(process.env.OPENROUTER_TEMPERATURE) : 0.7,
        top_p: process.env.OPENROUTER_TOP_P ? parseFloat(process.env.OPENROUTER_TOP_P) : 0.9,
      },
    });

    const systemPrompt = `You are an expert educational content creator specializing in creating high-quality flashcards.
Generate flashcards that focus on key concepts. Each flashcard should have:
- front: A clear question (max 200 characters)
- back: A concise answer (max 500 characters)

Return your response as a JSON object with an array of flashcards.`;

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
typing to JavaScript, which can help catch errors early through type checking.
TypeScript code is transpiled to JavaScript, making it compatible with any
environment that runs JavaScript. The language supports modern JavaScript features
and provides additional features like interfaces, enums, and generics.
    `.trim();

    interface FlashcardResponse {
      flashcards: { front: string; back: string }[];
    }

    const response = await service.sendChatMessage<FlashcardResponse>(
      `Generate flashcards from the following text:\n\n${sourceText}`
    );

    console.log(`✅ Generated ${response.flashcards.length} flashcards:`);
    response.flashcards.forEach((card, index) => {
      console.log(`\n${index + 1}. Front: ${card.front}`);
      console.log(`   Back: ${card.back}`);
    });

    console.log("\n✅ Test passed!");
    return true;
  } catch (error) {
    console.error("❌ Test failed:", error);
    return false;
  }
}

/**
 * Test 4: Error handling
 */
async function testErrorHandling() {
  console.log("\n=== Test 4: Error Handling ===");

  try {
    // Test with invalid API key
    const service = new OpenRouterService({
      apiKey: "invalid-key",
      defaultModel: "openai/gpt-3.5-turbo",
      timeout: 10000,
      maxRetries: 1,
    });

    service.setSystemMessage("Test");
    await service.sendChatMessage("Test");

    console.log("❌ Test failed: Should have thrown an error");
    return false;
  } catch (error) {
    if (error instanceof Error && error.message.includes("Authentication")) {
      console.log("✅ Correctly caught authentication error");
      console.log("✅ Test passed!");
      return true;
    }
    console.error("❌ Test failed: Unexpected error:", error);
    return false;
  }
}

/**
 * Test 5: Parameter configuration
 */
async function testParameterConfiguration() {
  console.log("\n=== Test 5: Parameter Configuration ===");

  try {
    const service = new OpenRouterService({
      apiKey: process.env.OPENROUTER_API_KEY || "",
      defaultModel: "openai/gpt-3.5-turbo",
      defaultModelParameters: {
        temperature: 0.5,
        top_p: 0.8,
      },
    });

    service.setSystemMessage("You are a helpful assistant.");

    // Test with low temperature (should be more deterministic)
    const response1 = await service.sendChatMessage("Say 'Hello'");
    console.log("✅ Response with temperature 0.5:", response1);

    // Change parameters
    service.setModel("openai/gpt-3.5-turbo", {
      temperature: 1.5,
      top_p: 0.95,
    });

    const response2 = await service.sendChatMessage("Say 'Hello'");
    console.log("✅ Response with temperature 1.5:", response2);

    console.log("✅ Test passed!");
    return true;
  } catch (error) {
    console.error("❌ Test failed:", error);
    return false;
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log("🚀 Starting OpenRouter Service Integration Tests\n");
  console.log("=".repeat(60));

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.error("❌ OPENROUTER_API_KEY not set in environment variables");
    console.log("\nPlease set OPENROUTER_API_KEY in your .env file:");
    console.log("OPENROUTER_API_KEY=sk-or-v1-...");
    process.exit(1);
  }

  const results = {
    basicResponse: false,
    structuredResponse: false,
    flashcardGeneration: false,
    errorHandling: false,
    parameterConfig: false,
  };

  results.basicResponse = await testBasicResponse();
  results.structuredResponse = await testStructuredResponse();
  results.flashcardGeneration = await testFlashcardGeneration();
  results.errorHandling = await testErrorHandling();
  results.parameterConfig = await testParameterConfiguration();

  console.log("\n" + "=".repeat(60));
  console.log("\n📊 Test Results Summary:\n");
  console.log(`Basic Response:        ${results.basicResponse ? "✅ PASS" : "❌ FAIL"}`);
  console.log(`Structured Response:   ${results.structuredResponse ? "✅ PASS" : "❌ FAIL"}`);
  console.log(`Flashcard Generation:  ${results.flashcardGeneration ? "✅ PASS" : "❌ FAIL"}`);
  console.log(`Error Handling:        ${results.errorHandling ? "✅ PASS" : "❌ FAIL"}`);
  console.log(`Parameter Config:      ${results.parameterConfig ? "✅ PASS" : "❌ FAIL"}`);

  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter((r) => r).length;

  console.log(`\n${passedTests}/${totalTests} tests passed`);

  if (passedTests === totalTests) {
    console.log("\n🎉 All tests passed!");
  } else {
    console.log("\n⚠️  Some tests failed");
    process.exit(1);
  }
}

// Only run if executed directly (not imported)
if (require.main === module) {
  runAllTests().catch((error) => {
    console.error("❌ Fatal error:", error);
    process.exit(1);
  });
}

export {
  testBasicResponse,
  testStructuredResponse,
  testFlashcardGeneration,
  testErrorHandling,
  testParameterConfiguration,
};
