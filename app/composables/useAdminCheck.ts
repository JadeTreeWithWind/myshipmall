export function useAdminCheck() {
  const isAdmin = useState<boolean>("auth:is-admin", () => false);
  const { user, getToken } = useAuth();

  async function checkAdmin() {
    if (!user.value) {
      isAdmin.value = false;
      return;
    }
    try {
      const token = await getToken();
      await $fetch("/api/admin/verify", {
        headers: { authorization: `Bearer ${token}` },
      });
      isAdmin.value = true;
    } catch {
      isAdmin.value = false;
    }
  }

  return { isAdmin, checkAdmin };
}
