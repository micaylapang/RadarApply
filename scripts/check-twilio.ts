import "dotenv/config";
import twilio from "twilio";

async function main() {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;
  if (!sid || !token) {
    console.error("Missing Twilio credentials in .env");
    process.exit(1);
  }

  const client = twilio(sid, token);
  const acct = await client.api.accounts(sid).fetch();
  console.log("twilio status:", acct.status);
  console.log("twilio type:", acct.type);
  console.log("from number configured:", Boolean(from));
  console.log("TWILIO_TRIAL_MODE:", process.env.TWILIO_TRIAL_MODE ?? "(unset)");

  // Confirm Messaging can create (dry check: fetch from number)
  if (from) {
    const nums = await client.incomingPhoneNumbers.list({ limit: 20 });
    const match = nums.some((n) => n.phoneNumber === from);
    console.log("from number owned in account:", match || nums.length === 0 ? match : `not in first ${nums.length} numbers`);
  }
}

main().catch((e) => {
  console.error("twilio check failed:", e instanceof Error ? e.message : e);
  process.exit(1);
});
