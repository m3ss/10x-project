import { test as setup } from "@playwright/test";
import { getTestUser } from "../helpers/test-helpers";

const authFile = ".auth/user.json";

/**
 * Simple authentication setup - login via API directly
 */
setup("authenticate via API", async ({ request }) => {
  const testUser = getTestUser();

  console.log("🔐 Authenticating via API...");
  console.log("📧 Email:", testUser.email);

  // Login via API
  const response = await request.post("/api/auth/login", {
    data: {
      email: testUser.email,
      password: testUser.password,
    },
  });

  console.log("Response status:", response.status());
  const data = await response.json();
  console.log("Response data:", JSON.stringify(data, null, 2));

  if (!response.ok() || !data.success) {
    throw new Error(`Login failed: ${data.error?.message || "Unknown error"}`);
  }

  console.log("✅ Successfully authenticated!");

  // Save storage state
  await request.storageState({ path: authFile });
  console.log("✅ Auth state saved to", authFile);
});
