import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import RequestForm from './RequestForm'
import { normalizeRequest, validateRequest, type RequestFields } from './requestValidation'

const successMessage = 'Talebiniz alındı. En kısa sürede sizinle iletişime geçeceğiz.'
const failureMessage = 'Talebiniz kaydedilemedi. Lütfen tekrar deneyin.'
const validFields: RequestFields = {
  name: 'Sprint Five Test',
  email: 'sprint5@example.com',
  serviceType: 'workflow-automation',
  description: 'This is a fictional request created for the FlowPilot technical evaluation.',
}
const fetchMock = vi.fn<typeof fetch>()

function fillForm(fields = validFields) {
  fireEvent.change(screen.getByRole('textbox', { name: 'İsim' }), { target: { value: fields.name } })
  fireEvent.change(screen.getByRole('textbox', { name: 'E-posta' }), { target: { value: fields.email } })
  fireEvent.change(screen.getByRole('combobox', { name: 'Hizmet seçimi' }), { target: { value: fields.serviceType } })
  fireEvent.change(screen.getByRole('textbox', { name: 'Açıklama' }), { target: { value: fields.description } })
}

function expectValuesKept() {
  expect(screen.getByRole('textbox', { name: 'İsim' })).toHaveValue(validFields.name)
  expect(screen.getByRole('textbox', { name: 'E-posta' })).toHaveValue(validFields.email)
  expect(screen.getByRole('combobox', { name: 'Hizmet seçimi' })).toHaveValue(validFields.serviceType)
  expect(screen.getByRole('textbox', { name: 'Açıklama' })).toHaveValue(validFields.description)
}

function send() {
  fireEvent.click(screen.getByRole('button', { name: 'Talep Gönder' }))
}

describe('Request form API integration (mocked fetch)', () => {
  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
    vi.stubEnv('VITE_API_BASE_URL', '/api')
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  it.each<[keyof RequestFields, string]>([
    ['name', ''], ['name', ' \t '], ['name', 'a'.repeat(201)],
    ['email', ''], ['email', 'not-an-email'], ['email', 'a'.repeat(309) + '@example.com'],
    ['serviceType', ''],
    ['description', ''], ['description', ' \t '], ['description', '123456789'],
    ['description', 'a'.repeat(4001)],
  ])('rejects invalid %s without calling the API', (field, value) => {
    render(<RequestForm />)
    fillForm({ ...validFields, [field]: value })
    send()

    expect(fetchMock).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toHaveTextContent('Formdaki bilgileri kontrol edip tekrar deneyin.')
    expect(screen.queryByText(successMessage)).not.toBeInTheDocument()
  })

  it('shows loading, disables sending, blocks duplicate submits and waits for a real 201', async () => {
    let resolve!: (response: Response) => void
    fetchMock.mockReturnValueOnce(new Promise<Response>((done) => { resolve = done }))
    render(<RequestForm />)
    fillForm()
    send()

    expect(screen.getByRole('button', { name: 'Gönderiliyor...' })).toBeDisabled()
    expect(screen.getByRole('group', { name: 'Talep bilgileri' })).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByRole('status')).toHaveTextContent('Talebiniz gönderiliyor.')
    expect(screen.queryByText(successMessage)).not.toBeInTheDocument()
    expectValuesKept()
    fireEvent.submit(screen.getByRole('form', { name: 'Projenizi anlatın' }))
    expect(fetchMock).toHaveBeenCalledTimes(1)

    await act(async () => { resolve(new Response(null, { status: 201 })) })
    expect(await screen.findByText(successMessage)).toBeVisible()
    expect(screen.getByRole('button', { name: 'Talep Gönder' })).toBeEnabled()
    expect(screen.getByRole('textbox', { name: 'İsim' })).toHaveValue('')
    expect(screen.getByRole('textbox', { name: 'E-posta' })).toHaveValue('')
    expect(screen.getByRole('combobox', { name: 'Hizmet seçimi' })).toHaveValue('')
    expect(screen.getByRole('textbox', { name: 'Açıklama' })).toHaveValue('')
  })

  it('posts trimmed fields and the exact service value using environment configuration', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.test/api/')
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 201 }))
    render(<RequestForm />)
    fillForm({
      ...validFields, name: ` ${validFields.name} `, email: ` ${validFields.email} `,
      description: ` ${validFields.description} `, serviceType: 'system-integration',
    })
    send()
    await screen.findByText(successMessage)

    expect(fetchMock).toHaveBeenCalledWith('https://api.example.test/api/requests', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ ...validFields, serviceType: 'system-integration' }),
    })
  })

  it('maps a 400 to accessible field errors without displaying untrusted backend text', async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ errors: {
      email: ['SECRET_DATABASE_DETAILS'], description: ['INTERNAL_EXCEPTION_MESSAGE'],
    } }, { status: 400 }))
    render(<RequestForm />)
    fillForm()
    send()

    const email = screen.getByRole('textbox', { name: 'E-posta' })
    await waitFor(() => expect(email).toHaveAttribute('aria-invalid', 'true'))
    expect(email).toHaveAccessibleDescription('Geçerli bir e-posta adresi girin (en fazla 320 karakter).')
    expect(email).toHaveFocus()
    expect(screen.getByRole('textbox', { name: 'Açıklama' })).toHaveAccessibleDescription(/Açıklamanızı kontrol edin/)
    expect(screen.queryByText(/SECRET_DATABASE_DETAILS|INTERNAL_EXCEPTION_MESSAGE/)).not.toBeInTheDocument()
    expect(screen.queryByText(successMessage)).not.toBeInTheDocument()
    expectValuesKept()
    expect(screen.getByRole('button', { name: 'Talep Gönder' })).toBeEnabled()
  })

  it.each([
    { errors: { unknownField: ['INTERNAL_EXCEPTION_MESSAGE'] } },
    { title: 'INTERNAL_EXCEPTION_MESSAGE' },
    { errors: { name: 'INTERNAL_EXCEPTION_MESSAGE' } },
  ])('falls back to a general error for unmatched/malformed 400 responses', async (body) => {
    fetchMock.mockResolvedValueOnce(Response.json(body, { status: 400 }))
    render(<RequestForm />)
    fillForm()
    send()
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Formdaki bilgileri kontrol edip tekrar deneyin.'))
    expect(screen.getByRole('alert')).toHaveFocus()
    expect(screen.queryByText('INTERNAL_EXCEPTION_MESSAGE')).not.toBeInTheDocument()
    expectValuesKept()
  })

  it('handles an unreadable 400 body without losing form values', async () => {
    fetchMock.mockResolvedValueOnce(new Response('not JSON', { status: 400 }))
    render(<RequestForm />)
    fillForm()
    send()
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Formdaki bilgileri kontrol edip tekrar deneyin.'))
    expectValuesKept()
  })

  it.each([200, 204, 500, 503])('does not treat HTTP %s as success or clear values', async (status) => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status }))
    render(<RequestForm />)
    fillForm()
    send()
    expect(await screen.findByText(failureMessage)).toBeVisible()
    expect(screen.queryByText(successMessage)).not.toBeInTheDocument()
    expectValuesKept()
    expect(screen.getByRole('button', { name: 'Talep Gönder' })).toBeEnabled()
  })

  it('keeps values after a network failure and allows a successful retry', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('INTERNAL_NETWORK_DETAIL'))
    render(<RequestForm />)
    fillForm()
    send()
    expect(await screen.findByText(failureMessage)).toBeVisible()
    expectValuesKept()
    expect(screen.queryByText(successMessage)).not.toBeInTheDocument()
    expect(screen.queryByText('INTERNAL_NETWORK_DETAIL')).not.toBeInTheDocument()

    fetchMock.mockResolvedValueOnce(new Response(null, { status: 201 }))
    send()
    expect(await screen.findByText(successMessage)).toBeVisible()
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('keeps keyboard focus while correcting a field with other errors outstanding', () => {
    render(<RequestForm />)
    send()
    const name = screen.getByRole('textbox', { name: 'İsim' })
    expect(name).toHaveFocus()
    fireEvent.change(name, { target: { value: 'S' } })
    expect(name).toHaveFocus()
    expect(screen.getByRole('textbox', { name: 'E-posta' })).toHaveAttribute('aria-invalid', 'true')
  })

  it('validates exact service values and normalized length boundaries', () => {
    expect(validateRequest({ ...validFields, serviceType: 'unsupported' })).toHaveProperty('serviceType')
    expect(validateRequest(normalizeRequest({ ...validFields, name: ` ${'a'.repeat(200)} `, description: ' 1234567890 ' }))).toEqual({})
  })
})
