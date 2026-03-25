import { createClient } from "@supabase/supabase-js";
import { checkRateLimit } from "../utils/checkRateLimit";

export default defineEventHandler(async (event) => {
  const { cloudflare } = event.context;

  if (!cloudflare?.env?.RATE_LIMIT) {
    throw createError({
      statusCode: 500,
      message: "KV binding 未設定",
    });
  }

  const body = await readBody(event);
  const { name, email, subject, message } = body ?? {};

  if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
    throw createError({ statusCode: 400, message: "所有欄位皆為必填" });
  }

  // Rate limit：每 IP 每小時 5 次
  const ip = getRequestIP(event, { xForwardedFor: true }) ?? "unknown";
  await checkRateLimit(cloudflare.env.RATE_LIMIT as KVNamespace, ip, "contact", 5);

  const config = useRuntimeConfig(event);
  const supabase = createClient(
    config.public.supabaseUrl,
    config.supabaseSecretKey,
  );

  const { error } = await supabase.from("contact_submissions").insert({
    name: name.trim(),
    email: email.trim(),
    subject: subject.trim(),
    message: message.trim(),
  });

  if (error) {
    throw createError({ statusCode: 500, message: `寫入失敗：${error.message}` });
  }

  return { success: true };
});
