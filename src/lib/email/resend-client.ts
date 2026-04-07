// ─── Email Client (Resend) ───────────────────────────────────
// Integração com Resend para envio de emails transacionais.
// Fallback graceful: se RESEND_API_KEY não configurada, log no console.

const RESEND_API_KEY = process.env['RESEND_API_KEY'] ?? ''
const RESEND_FROM = process.env['RESEND_FROM_EMAIL'] ?? 'InvestIQ <noreply@investiq.com.br>'
const RESEND_API_URL = 'https://api.resend.com/emails'

export interface EmailPayload {
  to: string
  subject: string
  html: string
  text?: string
}

export interface EmailResult {
  success: boolean
  id?: string
  error?: string
}

/**
 * Verifica se o serviço de email está configurado.
 */
export function isEmailConfigured(): boolean {
  return RESEND_API_KEY.length > 0
}

/**
 * Envia um email via Resend API.
 * Se RESEND_API_KEY não está configurada, apenas loga e retorna sucesso simulado.
 */
export async function sendEmail(payload: EmailPayload): Promise<EmailResult> {
  if (!isEmailConfigured()) {
    console.log(`[email] Resend não configurado. Email para ${payload.to} não enviado.`)
    console.log(`[email] Subject: ${payload.subject}`)
    return { success: true, id: 'dry-run' }
  }

  try {
    const response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: RESEND_FROM,
        to: [payload.to],
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
      }),
    })

    if (!response.ok) {
      const body = await response.text().catch(() => '')
      return { success: false, error: `Resend ${response.status}: ${body.slice(0, 200)}` }
    }

    const data = await response.json() as { id?: string }
    return { success: true, id: data.id }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido'
    console.error(`[email] Falha ao enviar email:`, message)
    return { success: false, error: message }
  }
}
