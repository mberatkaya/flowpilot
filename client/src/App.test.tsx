import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('FlowPilot landing page', () => {
  it('renders one meaningful main heading and semantic landmarks', () => {
    render(<App />)

    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('heading', {
      name: 'Tekrarlayan işleri otomatikleştirin, ekibinize zaman kazandırın.', level: 1,
    })).toBeVisible()
    expect(screen.getByRole('banner')).toBeInTheDocument()
    expect(screen.getByRole('main')).toHaveAttribute('id', 'ana-icerik')
    expect(screen.getByRole('contentinfo')).toBeInTheDocument()
  })

  it('shows all four services with descriptions', () => {
    render(<App />)
    const section = screen.getByRole('region', { name: 'Zaman alan işlere pratik çözümler.' })
    const serviceCards = within(section).getAllByRole('article')

    expect(serviceCards).toHaveLength(4)
    for (const label of ['İş Akışı Otomasyonu', 'Sistem Entegrasyonu', 'Veri ve Raporlama', 'Özel Yazılım']) {
      expect(within(section).getByRole('heading', { name: label, level: 3 })).toBeVisible()
    }
    for (const card of serviceCards) {
      expect(card.querySelector('p')).not.toBeEmptyDOMElement()
    }
  })

  it('uses real anchor links to the form and page sections', () => {
    render(<App />)
    const cta = screen.getByRole('link', { name: 'Projenizi Anlatın' })
    expect(cta).toHaveAttribute('href', '#talep-formu')
    expect(screen.getByRole('region', { name: 'İşinizdeki tekrarı birlikte azaltalım.' })).toHaveAttribute('id', 'talep-formu')

    const navigation = screen.getByRole('navigation', { name: 'Ana navigasyon' })
    expect(within(navigation).getByRole('link', { name: 'Hizmetler' })).toHaveAttribute('href', '#hizmetler')
    expect(within(navigation).getByRole('link', { name: 'Nasıl Çalışır?' })).toHaveAttribute('href', '#nasil-calisir')
    expect(within(navigation).getByRole('link', { name: 'İletişim' })).toHaveAttribute('href', '#talep-formu')
  })

  it('provides accessible field labels and native field hints', () => {
    render(<App />)
    const form = screen.getByRole('form', { name: 'Projenizi anlatın' })
    expect(within(form).getByRole('textbox', { name: 'İsim' })).toBeRequired()
    const email = within(form).getByRole('textbox', { name: 'E-posta' })
    expect(email).toHaveAttribute('type', 'email')
    expect(email).toHaveAttribute('autocomplete', 'email')
    expect(within(form).getByRole('combobox', { name: 'Hizmet seçimi' })).toBeRequired()
    const description = within(form).getByRole('textbox', { name: 'Açıklama' })
    expect(description).toBeRequired()
    expect(description).toHaveAccessibleDescription('10–4.000 karakter arasında bir açıklama yazın.')
  })

  it('uses the exact backend service values and Turkish labels', () => {
    render(<App />)
    const select = screen.getByRole('combobox', { name: 'Hizmet seçimi' })
    const expectedOptions = [
      ['İş Akışı Otomasyonu', 'workflow-automation'],
      ['Sistem Entegrasyonu', 'system-integration'],
      ['Veri ve Raporlama', 'data-reporting'],
      ['Özel Yazılım', 'custom-software'],
    ]
    expect(within(select).getAllByRole('option')).toHaveLength(5)
    expect(select).toHaveValue('')
    for (const [label, value] of expectedOptions) {
      expect(within(select).getByRole('option', { name: label })).toHaveValue(value)
    }
    fireEvent.change(select, { target: { value: 'system-integration' } })
    expect(select).toHaveValue('system-integration')
  })

  it('shows the three steps as an ordered list', () => {
    render(<App />)
    const section = screen.getByRole('region', { name: 'Önce işinizi anlarız. Sonra birlikte sadeleştiririz.' })
    expect(within(section).getByRole('list').tagName).toBe('OL')
    expect(within(section).getAllByRole('listitem')).toHaveLength(3)
  })

  it('clearly disables sending and prevents native form navigation', () => {
    render(<App />)
    const button = screen.getByRole('button', { name: 'Talep Gönder' })
    expect(button).toBeDisabled()
    expect(button).toHaveAccessibleDescription(/Talep gönderimi henüz açık değil/)
    expect(screen.getByText('Formu inceleyebilirsiniz. Bilgileriniz gönderilmez veya kaydedilmez.')).toBeVisible()
    const form = screen.getByRole('form', { name: 'Projenizi anlatın' })
    const event = new Event('submit', { bubbles: true, cancelable: true })
    fireEvent(form, event)
    expect(event.defaultPrevented).toBe(true)
  })

  it('provides a skip link to the focusable main content', () => {
    render(<App />)
    expect(screen.getByRole('link', { name: 'Ana içeriğe geç' })).toHaveAttribute('href', '#ana-icerik')
    expect(screen.getByRole('main')).toHaveAttribute('tabindex', '-1')
  })
})
