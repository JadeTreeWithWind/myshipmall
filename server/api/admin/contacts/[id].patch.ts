import { createClient } from "@supabase/supabase-js";

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event);

  const token = getRequestHeader(event, "authorization")?.replace("Bearer ", "").trim();
  if (!token) throw createError({ statusCode: 401, message: "未登入" });

  const supabase = createClient(config.public.supabaseUrl, config.supabaseSecretKey);
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) throw createError({ statusCode: 401, message: "登入已失效" });
  if (user.email !== config.adminEmail) throw createError({ statusCode: 403, message: "無權限" });

  const id = Number(getRouterParam(event, "id"));
  const { is_read } = await readBody(event);

  if (isNaN(id)) throw createError({ statusCode: 400, message: "無效的 id" });

  const { error } = await supabase
    .from("contact_submissions")
    .update({ is_read })
    .eq("id", id);

  if (error) throw createError({ statusCode: 500, message: error.message });

  return { success: true };
});
