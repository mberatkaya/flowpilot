import { fieldOrder, type FieldErrors, type RequestFields } from './requestValidation'

export function createServiceRequest(fields: RequestFields): Promise<Response> {
  // An API root such as /api or https://api.example.com/api; never a database secret.
  const apiRoot = (import.meta.env.VITE_API_BASE_URL?.trim() || '/api').replace(/\/+$/, '')
  return fetch(`${apiRoot}/requests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(fields),
  })
}

const safeFieldMessages: Required<FieldErrors> = {
  name: 'İsim alanını kontrol edin (en fazla 200 karakter).',
  email: 'Geçerli bir e-posta adresi girin (en fazla 320 karakter).',
  serviceType: 'Listeden bir hizmet seçin.',
  description: 'Açıklamanızı kontrol edin (10–4.000 karakter).',
}

export async function readValidationErrors(response: Response): Promise<FieldErrors> {
  const body: unknown = await response.json().catch(() => null)
  if (!body || typeof body !== 'object' || !('errors' in body)) return {}
  const errors = body.errors
  if (!errors || typeof errors !== 'object' || Array.isArray(errors)) return {}

  const mapped: FieldErrors = {}
  for (const field of fieldOrder) {
    const messages = (errors as Record<string, unknown>)[field]
    if (Array.isArray(messages) && messages.length > 0 && messages.every((message) => typeof message === 'string')) {
      // API text is untrusted: show only our local, field-specific messages.
      mapped[field] = safeFieldMessages[field]
    }
  }
  return mapped
}
