import { createClient } from "@supabase/supabase-js";

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event);

  // 驗證 JWT
  const token = getRequestHeader(event, "authorization")?.replace("Bearer ", "").trim();
  if (!token) throw createError({ statusCode: 401, message: "未登入" });

  const supabase = createClient(config.public.supabaseUrl, config.supabaseSecretKey);
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) throw createError({ statusCode: 401, message: "登入已失效" });

  // 驗證 admin email
  if (user.email !== config.adminEmail) {
    throw createError({ statusCode: 403, message: "無權限" });
  }

  // HEAD 請求只做身分驗證，不回資料
  if (getMethod(event) === "HEAD") {
    return null;
  }

  const { data, error } = await supabase
    .from("contact_submissions")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw createError({ statusCode: 500, message: error.message });

  return data;
});
