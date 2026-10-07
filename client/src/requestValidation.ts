import { services } from './services'

export type RequestFields = {
  name: string
  email: string
  serviceType: string
  description: string
}
export type RequestField = keyof RequestFields
export type FieldErrors = Partial<Record<RequestField, string>>

export const fieldOrder: RequestField[] = ['name', 'email', 'serviceType', 'description']
export const emptyRequest: RequestFields = { name: '', email: '', serviceType: '', description: '' }

export function normalizeRequest(fields: RequestFields): RequestFields {
  return { ...fields, name: fields.name.trim(), email: fields.email.trim(), description: fields.description.trim() }
}

export function validateRequest(fields: RequestFields): FieldErrors {
  // These are the normalized fields that will be sent to the server.
  const errors: FieldErrors = {}
  if (!fields.name) errors.name = 'İsminizi girin.'
  else if (fields.name.length > 200) errors.name = 'İsim en fazla 200 karakter olabilir.'

  if (!fields.email) errors.email = 'E-posta adresinizi girin.'
  else if (fields.email.length > 320) errors.email = 'E-posta en fazla 320 karakter olabilir.'
  else if (!/^[^\s@]+@[^\s@]+$/.test(fields.email)) errors.email = 'Geçerli bir e-posta adresi girin.'

  if (!services.some((service) => service.value === fields.serviceType)) {
    errors.serviceType = 'Listeden bir hizmet seçin.'
  }

  if (!fields.description) errors.description = 'İhtiyacınızı açıklayın.'
  else if (fields.description.length < 10 || fields.description.length > 4000) {
    errors.description = 'Açıklama 10–4.000 karakter arasında olmalıdır.'
  }
  return errors
}
