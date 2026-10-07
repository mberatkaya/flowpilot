import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { createServiceRequest, readValidationErrors } from './requestApi'
import { emptyRequest, fieldOrder, normalizeRequest, validateRequest, type FieldErrors, type RequestField } from './requestValidation'
import { services } from './services'

type FormState =
  | { status: 'idle' }
  | { status: 'submitting' }
  | { status: 'success' }
  | { status: 'validation-error'; errors: FieldErrors }
  | { status: 'server-error' }

export default function RequestForm() {
  const [values, setValues] = useState({ ...emptyRequest })
  const [state, setState] = useState<FormState>({ status: 'idle' })
  const inFlight = useRef(false)
  const focusError = useRef(false)
  const formRef = useRef<HTMLFormElement>(null)
  const errorSummaryRef = useRef<HTMLDivElement>(null)
  const submitting = state.status === 'submitting'
  const errors = state.status === 'validation-error' ? state.errors : {}

  useEffect(() => {
    if (!focusError.current) return
    focusError.current = false
    if (state.status === 'validation-error') {
      const firstField = fieldOrder.find((field) => state.errors[field])
      if (firstField) formRef.current?.querySelector<HTMLElement>(`[name="${firstField}"]`)?.focus()
      else errorSummaryRef.current?.focus()
    } else if (state.status === 'server-error') {
      errorSummaryRef.current?.focus()
    }
  }, [state])

  function handleChange(event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const field = event.target.name as RequestField
    const value = event.target.value
    setValues((current) => ({ ...current, [field]: value }))
    setState((current) => {
      if (current.status === 'validation-error') {
        const remaining = { ...current.errors }
        delete remaining[field]
        return Object.keys(remaining).length ? { status: 'validation-error', errors: remaining } : { status: 'idle' }
      }
      return current.status === 'submitting' ? current : { status: 'idle' }
    })
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (inFlight.current) return
    const payload = normalizeRequest(values)
    const fieldErrors = validateRequest(payload)
    if (Object.keys(fieldErrors).length) {
      focusError.current = true
      setState({ status: 'validation-error', errors: fieldErrors })
      return
    }

    inFlight.current = true
    setState({ status: 'submitting' })
    try {
      const response = await createServiceRequest(payload)
      if (response.status === 201) {
        setValues({ ...emptyRequest })
        setState({ status: 'success' })
      } else if (response.status === 400) {
        const mappedErrors = await readValidationErrors(response)
        focusError.current = true
        setState({ status: 'validation-error', errors: mappedErrors })
      } else {
        focusError.current = true
        setState({ status: 'server-error' })
      }
    } catch {
      focusError.current = true
      setState({ status: 'server-error' })
    } finally {
      inFlight.current = false
    }
  }

  const errorMessage = state.status === 'validation-error'
    ? 'Formdaki bilgileri kontrol edip tekrar deneyin.'
    : state.status === 'server-error' ? 'Talebiniz kaydedilemedi. Lütfen tekrar deneyin.' : ''
  const statusMessage = submitting ? 'Talebiniz gönderiliyor.'
    : state.status === 'success' ? 'Talebiniz alındı. En kısa sürede sizinle iletişime geçeceğiz.' : ''

  return (
    <form ref={formRef} className="request-form" aria-label="Projenizi anlatın" onSubmit={handleSubmit} noValidate>
      <p className="form-intro">Tüm alanlar zorunludur.</p>
      <fieldset disabled={submitting} aria-busy={submitting}>
        <legend className="visually-hidden">Talep bilgileri</legend>
        <div className="form-row">
          <div className="form-field">
            <label htmlFor="request-name">İsim</label>
            <input
              id="request-name" name="name" type="text" autoComplete="name" placeholder="Adınız"
              maxLength={200} required value={values.name} onChange={handleChange}
              aria-invalid={!!errors.name} aria-describedby={errors.name ? 'name-error' : undefined}
            />
            {errors.name && <p className="field-error" id="name-error">{errors.name}</p>}
          </div>
          <div className="form-field">
            <label htmlFor="request-email">E-posta</label>
            <input
              id="request-email" name="email" type="email" autoComplete="email" placeholder="ornek@example.com"
              maxLength={320} required value={values.email} onChange={handleChange}
              aria-invalid={!!errors.email} aria-describedby={errors.email ? 'email-error' : undefined}
            />
            {errors.email && <p className="field-error" id="email-error">{errors.email}</p>}
          </div>
        </div>
        <div className="form-field">
          <label htmlFor="request-service">Hizmet seçimi</label>
          <select
            id="request-service" name="serviceType" value={values.serviceType} onChange={handleChange} required
            aria-invalid={!!errors.serviceType} aria-describedby={errors.serviceType ? 'service-error' : undefined}
          >
            <option value="" disabled>Hizmet seçin</option>
            {services.map((service) => (
              <option key={service.value} value={service.value}>{service.label}</option>
            ))}
          </select>
          {errors.serviceType && <p className="field-error" id="service-error">{errors.serviceType}</p>}
        </div>
        <div className="form-field">
          <label htmlFor="request-description">Açıklama</label>
          <textarea
            id="request-description"
            name="description"
            rows={5}
            placeholder="Hangi işi, hangi araçlarla yapıyorsunuz? Nerede zaman kaybediyorsunuz?"
            minLength={10}
            maxLength={4000}
            value={values.description}
            onChange={handleChange}
            aria-invalid={!!errors.description}
            aria-describedby={errors.description ? 'description-hint description-error' : 'description-hint'}
            required
          />
          <p id="description-hint" className="field-hint">10–4.000 karakter arasında bir açıklama yazın.</p>
          {errors.description && <p className="field-error" id="description-error">{errors.description}</p>}
        </div>
      </fieldset>
      <p className={`form-message${state.status === 'success' ? ' form-success' : ''}`} role="status" aria-live="polite" aria-atomic="true">{statusMessage}</p>
      <div className={`form-message${errorMessage ? ' form-error' : ''}`} ref={errorSummaryRef} tabIndex={-1} role="alert" aria-atomic="true">{errorMessage}</div>
      <button className="button button-submit" type="submit" disabled={submitting}>
        {submitting ? 'Gönderiliyor...' : 'Talep Gönder'} <span aria-hidden="true">↗</span>
      </button>
    </form>
  )
}
