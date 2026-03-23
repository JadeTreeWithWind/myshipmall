// C0-7 驗證：RLS 政策測試（使用 anon/publishable key）
import { createClient } from "@supabase/supabase-js";

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event);
  const { supabaseUrl, supabasePublishableKey } = config.public;

  if (!supabaseUrl || !supabasePublishableKey) {
    return { success: false, error: "環境變數未設定" };
  }

  // 用 publishable key 模擬匿名用戶
  const anon = createClient(supabaseUrl, supabasePublishableKey);

  // 1. 匿名 SELECT shops（應成功）
  const { data: shops, error: selectError } = await anon
    .from("shops")
    .select("id, name")
    .limit(3);

  // 2. 匿名 INSERT shops（應被 RLS 擋下）
  const { error: insertError } = await anon.from("shops").insert({
    external_id: "RLS_ATTACK_TEST",
    name: "惡意寫入",
    shop_url: "https://evil.com",
  });

  return {
    "C0-7": {
      anonymousSelect: {
        pass: !selectError,
        rowCount: shops?.length ?? 0,
        error: selectError?.message ?? null,
      },
      anonymousInsertBlocked: {
        pass: !!insertError,
        error: insertError?.message ?? "❌ 沒有被擋下，RLS 未生效！",
      },
    },
  };
});
