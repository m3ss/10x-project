import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env.test
dotenv.config({ path: path.resolve(__dirname, ".env.test") });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_PASSWORD;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env.test");
  process.exit(1);
}

// Create admin client using service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const testUser = {
  email: process.env.E2E_USERNAME || "user@test.pl",
  password: process.env.E2E_PASSWORD || "Abcd1234!",
  id: process.env.E2E_USERNAME_ID || "725fae9f-89e0-4f57-941f-514b86cffa49",
};

console.log("🔧 Creating test user...");
console.log("📧 Email:", testUser.email);
console.log("🆔 ID:", testUser.id);

try {
  // Create user with admin API
  const { data, error } = await supabase.auth.admin.createUser({
    email: testUser.email,
    password: testUser.password,
    email_confirm: true, // Auto-confirm email
    user_metadata: {
      created_for_testing: true,
    },
  });

  if (error) {
    if (error.message.includes("already registered")) {
      console.log("⚠️  User already exists, trying to update...");

      // Try to update existing user
      const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(testUser.id, {
        password: testUser.password,
        email_confirm: true,
      });

      if (updateError) {
        console.error("❌ Error updating user:", updateError.message);
        process.exit(1);
      }

      console.log("✅ Test user updated successfully!");
      console.log("👤 User:", updateData.user.email);
    } else {
      console.error("❌ Error creating user:", error.message);
      process.exit(1);
    }
  } else {
    console.log("✅ Test user created successfully!");
    console.log("👤 User:", data.user.email);
    console.log("🆔 ID:", data.user.id);
  }

  console.log("\n🎉 You can now run E2E tests!");
} catch (err) {
  console.error("❌ Unexpected error:", err);
  process.exit(1);
}
