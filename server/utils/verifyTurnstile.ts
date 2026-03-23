export async function verifyTurnstile(token: string, ip?: string): Promise<void> {
  const config = useRuntimeConfig()
  const secretKey = config.turnstileSecretKey

  if (!secretKey) {
    throw createError({ statusCode: 500, message: 'Turnstile secret key 未設定' })
  }

  const formData = new FormData()
  formData.append('secret', secretKey)
  formData.append('response', token)
  if (ip) formData.append('remoteip', ip)

  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: formData,
  })

  const data = (await res.json()) as { success: boolean; 'error-codes'?: string[] }

  if (!data.success) {
    throw createError({
      statusCode: 403,
      message: '人機驗證失敗，請重試',
    })
  }
}
