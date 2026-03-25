export default defineNuxtRouteMiddleware(async () => {
  if (import.meta.server) return;

  const { user, getToken } = useAuth();

  // 等待 auth 初始化（user 可能還是 null 但 session 已存在）
  const token = await getToken();

  if (!token) return navigateTo("/");

  // 若 user state 還沒同步，也用 token 去後端驗證即可
  if (user.value && !user.value.email) return navigateTo("/");

  try {
    await $fetch("/api/admin/verify", {
      headers: { authorization: `Bearer ${token}` },
    });
  } catch {
    return navigateTo("/");
  }
});
