import { services } from './services'

export default function RequestForm() {
  return (
    <form className="request-form" aria-label="Projenizi anlatın" onSubmit={(event) => event.preventDefault()}>
      <p className="form-intro">Tüm alanlar zorunludur.</p>
      <div className="form-row">
        <div className="form-field">
          <label htmlFor="request-name">İsim</label>
          <input id="request-name" name="name" type="text" autoComplete="name" placeholder="Adınız" maxLength={200} required />
        </div>
        <div className="form-field">
          <label htmlFor="request-email">E-posta</label>
          <input id="request-email" name="email" type="email" autoComplete="email" placeholder="ornek@example.com" maxLength={320} required />
        </div>
      </div>
      <div className="form-field">
        <label htmlFor="request-service">Hizmet seçimi</label>
        <select id="request-service" name="serviceType" defaultValue="" required>
          <option value="" disabled>Hizmet seçin</option>
          {services.map((service) => (
            <option key={service.value} value={service.value}>{service.label}</option>
          ))}
        </select>
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
          aria-describedby="description-hint"
          required
        />
        <p id="description-hint" className="field-hint">10–4.000 karakter arasında bir açıklama yazın.</p>
      </div>
      <div className="form-availability" id="form-availability">
        <strong>Talep gönderimi henüz açık değil.</strong>
        <p>Formu inceleyebilirsiniz. Bilgileriniz gönderilmez veya kaydedilmez.</p>
      </div>
      <button className="button button-submit" type="submit" disabled aria-describedby="form-availability">
        Talep Gönder <span aria-hidden="true">↗</span>
      </button>
    </form>
  )
}
