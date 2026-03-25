import { createClient } from "@supabase/supabase-js";

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event);

  const token = getRequestHeader(event, "authorization")?.replace("Bearer ", "").trim();
  if (!token) throw createError({ statusCode: 401, message: "未登入" });

  const supabase = createClient(config.public.supabaseUrl, config.supabaseSecretKey);
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) throw createError({ statusCode: 401, message: "登入已失效" });
  if (user.email !== config.adminEmail) throw createError({ statusCode: 403, message: "無權限" });

  return { ok: true };
});
