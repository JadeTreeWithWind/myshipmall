export default defineNuxtRouteMiddleware(async () => {
  const { user } = useAuth();

  // SSR 階段跳過，client 端再判斷
  if (import.meta.server) return;

  if (!user.value) {
    return navigateTo("/");
  }

  // 呼叫後端驗證，若非 admin 則 403
  try {
    const { getToken } = useAuth();
    const token = await getToken();
    await $fetch("/api/admin/contacts", {
      method: "HEAD",
      headers: { authorization: `Bearer ${token}` },
    });
  } catch {
    return navigateTo("/");
  }
});
