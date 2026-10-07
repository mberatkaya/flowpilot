import RequestForm from './RequestForm'
import { services } from './services'

const steps = [
  { title: 'İhtiyacı anlıyoruz', description: 'İşinizin nasıl ilerlediğini, hangi adımların zaman aldığını ve neye ihtiyaç duyduğunuzu dinliyoruz.' },
  { title: 'Süreci tasarlıyoruz', description: 'Otomatikleştirilecek adımları ve kullanacağınız araçları birlikte netleştiriyoruz.' },
  { title: 'Çözümü geliştirip entegre ediyoruz', description: 'Çözümü mevcut iş düzeninize uyarlıyor, birlikte deneyerek kullanıma hazırlıyoruz.' },
]

function ServiceIcon({ index }: { index: number }) {
  const shapes = [
    <><rect x="3" y="3" width="6" height="6" rx="1" /><rect x="15" y="15" width="6" height="6" rx="1" /><path d="M9 6h9v9M6 9v9h9" /></>,
    <><path d="m10 14 4-4M8 16l-1 1a4 4 0 0 1-6-6l4-4a4 4 0 0 1 6 0M16 8l1-1a4 4 0 0 1 6 6l-4 4a4 4 0 0 1-6 0" transform="translate(1 -1)" /></>,
    <><path d="M4 4v16h17M9 15V9M14 15V5M19 15v-4" /></>,
    <><path d="m8 6-6 6 6 6M16 6l6 6-6 6M14 3l-4 18" /></>,
  ]

  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{shapes[index]}</svg>
}

export default function App() {
  return (
    <>
      <a className="skip-link" href="#ana-icerik">Ana içeriğe geç</a>
      <header className="site-header">
        <div className="container header-content">
          <a className="brand" href="#" aria-label="FlowPilot ana sayfa">FlowPilot<span className="brand-dot" aria-hidden="true">.</span></a>
          <nav aria-label="Ana navigasyon">
            <a href="#hizmetler">Hizmetler</a>
            <a href="#nasil-calisir">Nasıl Çalışır?</a>
            <a href="#talep-formu">İletişim <span aria-hidden="true">↗</span></a>
          </nav>
        </div>
      </header>

      <main id="ana-icerik" tabIndex={-1}>
        <section className="hero" aria-labelledby="hero-heading">
          <div className="container hero-layout">
            <div className="hero-copy">
              <p className="eyebrow"><span className="status-dot" aria-hidden="true" />Küçük işletmeler için otomasyon</p>
              <h1 id="hero-heading">Tekrarlayan işleri <span>otomatikleştirin,</span> ekibinize zaman kazandırın.</h1>
              <p className="hero-description">FlowPilot, manuel iş akışlarını azaltan ve mevcut sistemlerinizle birlikte çalışan otomasyon çözümleri geliştirir.</p>
              <div className="hero-actions">
                <a className="button button-primary" href="#talep-formu">Projenizi Anlatın <span aria-hidden="true">↗</span></a>
                <a className="text-link" href="#hizmetler">Hizmetleri keşfedin <span aria-hidden="true">↓</span></a>
              </div>
              <p className="hero-note">İşinize uygun çözümler. Kullandığınız araçlarla birlikte.</p>
            </div>

            <div className="workflow-illustration" aria-hidden="true">
              <div className="workflow-window">
                <div className="workflow-toolbar"><span className="window-dots"><i /><i /><i /></span><span>Örnek iş akışı</span><span>↗</span></div>
                <div className="workflow-body">
                  <div className="workflow-heading"><span className="workflow-mark">↳</span><div><strong>İşleriniz, bir akışta.</strong><span>Tekrarlayan adımları birbirine bağlayın.</span></div></div>
                  <div className="workflow-node"><span className="node-number">01</span><div><strong>Yeni talep</strong><span>Bilgi tek bir yerde toplanır.</span></div><span className="node-symbol">＋</span></div>
                  <div className="workflow-connector"><span>↓</span></div>
                  <div className="workflow-node node-accent"><span className="node-number">02</span><div><strong>İlgili ekibe ilet</strong><span>Doğru bilgi, doğru kişiye ulaşır.</span></div><span className="node-symbol">↗</span></div>
                  <div className="workflow-connector"><span>↓</span></div>
                  <div className="workflow-node"><span className="node-number">03</span><div><strong>Raporuna ekle</strong><span>Süreç kolayca takip edilir.</span></div><span className="node-symbol">✓</span></div>
                </div>
                <p className="workflow-caption">Daha az kopyala-yapıştır. Daha düzenli bir süreç.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="services-section section-space" id="hizmetler" tabIndex={-1} aria-labelledby="services-heading">
          <div className="container">
            <div className="section-heading">
              <div><p className="eyebrow">Hizmetlerimiz</p><h2 id="services-heading">Zaman alan işlere{' '}<br />pratik çözümler.</h2></div>
              <p>Tablolar arasında bilgi taşımaktan günlük takibe kadar, işinizi yavaşlatan tekrarları azaltalım.</p>
            </div>
            <div className="services-grid">
              {services.map((service, index) => (
                <article className="service-card" key={service.value} aria-labelledby={`service-${service.value}`}>
                  <span className="service-icon"><ServiceIcon index={index} /></span>
                  <h3 id={`service-${service.value}`}>{service.label}</h3>
                  <p>{service.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="process-section section-space" id="nasil-calisir" tabIndex={-1} aria-labelledby="process-heading">
          <div className="container">
            <div className="section-heading">
              <div><p className="eyebrow">Nasıl çalışır?</p><h2 id="process-heading">Önce işinizi anlarız.{' '}<br />Sonra birlikte sadeleştiririz.</h2></div>
              <p>Teknolojiyle değil, ihtiyacınızla başlıyoruz. Her adımı anlaşılır ve birlikte ilerlenebilir tutuyoruz.</p>
            </div>
            <ol className="process-grid">
              {steps.map((step, index) => (
                <li key={step.title}>
                  <span className="step-number" aria-hidden="true">0{index + 1}</span>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="contact-section section-space" id="talep-formu" tabIndex={-1} aria-labelledby="contact-heading">
          <div className="container contact-layout">
            <div className="contact-copy">
              <p className="eyebrow">Projenizi anlatın</p>
              <h2 id="contact-heading">İşinizdeki tekrarı{' '}<br />birlikte azaltalım.</h2>
              <p>Hangi işte zaman kaybettiğinizi anlatın. İhtiyaç duyduğunuz hizmeti seçin, sürecinizi birkaç cümleyle paylaşın.</p>
              <div className="contact-note"><span aria-hidden="true">↳</span><p>Bir çözüm belirlemiş olmanız gerekmez.{' '}<br />İhtiyacınızı tarif etmeniz yeterli.</p></div>
            </div>
            <RequestForm />
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="container footer-content"><span className="brand">FlowPilot<span className="brand-dot" aria-hidden="true">.</span></span><p>Küçük işletmeler için daha akıcı işler.</p><small>Kurgusal bir teknik değerlendirme projesidir.</small></div>
      </footer>
    </>
  )
}
