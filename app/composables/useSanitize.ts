import xss from 'xss'

/**
 * 過濾 HTML 內容，防止 XSS 攻擊。
 * 保留常見格式標籤（b, i, strong, em, br, p, ul, ol, li, a, img）
 * 移除 script, onclick 等危險內容。
 * <a> 連結會由 ExternalLinkGuard 元件攔截，在跳轉前顯示確認彈窗。
 */
export function useSanitize() {
  const options = {
    allowList: {
      a: ['href', 'title', 'target'],
      b: [],
      blockquote: [],
      br: [],
      em: [],
      i: [],
      img: ['src', 'alt', 'title', 'width', 'height'],
      li: [],
      ol: [],
      p: [],
      strong: [],
      ul: [],
      span: ['class'],
      div: ['class'],
    },
    stripIgnoreTag: true,
    stripIgnoreTagBody: ['script', 'style'],
  }

  function sanitize(html: string): string {
    return xss(html, options)
  }

  return { sanitize }
}
