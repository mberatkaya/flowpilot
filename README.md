# FlowPilot

## Projenin amacı

FlowPilot, küçük işletmelerin tekrar eden operasyonel süreçlerini otomatikleştirmesine yardımcı olan kurgusal bir teknoloji hizmetidir. Teknik değerlendirme projesinin nihai hedefi, mobil ve masaüstü uyumlu bir landing page üzerinden hizmet taleplerini toplamak ve PostgreSQL üzerinde kalıcı olarak saklamaktır.

Talep formunda isim, e-posta, hizmet seçimi ve açıklama alanları bulunacak. Bu ilk aşama yalnızca çalıştırılabilir proje ve test iskeletini kapsar.

## Kullanılan teknolojiler

| Alan | Teknoloji | Bu aşamadaki durum |
| --- | --- | --- |
| Frontend | React, TypeScript, Vite | Minimal başlangıç ekranı ve build altyapısı |
| Backend | C#, ASP.NET Core Web API, .NET 10 LTS | Endpoint içermeyen uygulama host'u |
| Veritabanı | PostgreSQL, Entity Framework Core | Planlandı; paket, bağlantı, DbContext ve migration eklenmedi |
| Frontend testleri | Vitest, React Testing Library, jsdom | Test kurulumu ve bir smoke testi |
| Backend testleri | xUnit v3, ASP.NET Core MVC Testing | Test projesi ve host başlangıç testi |

## Temel mimari

```text
flowpilot/
├── client/
│   ├── src/                  # React bileşenleri, yanlarında frontend testleri
│   │   └── test/setup.ts     # Ortak test kurulumu
│   ├── .env.example          # Tarayıcıya açık, örnek frontend ayarı
│   ├── package.json
│   ├── package-lock.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── server/
│   └── FlowPilot.Api/        # Tek ASP.NET Core host projesi
├── tests/
│   └── FlowPilot.Api.Tests/  # Backend xUnit test projesi
├── FlowPilot.slnx            # Backend ve test projelerini birleştiren solution
├── global.json              # .NET 10 SDK seçimi
├── README.md
├── AI_LOG.md
├── .gitignore
└── .env.example              # Backend environment ayarları için referans
```

Tek repository içinde frontend ve backend bağımsız çalışır. Sonraki aşamada tarayıcıdan ASP.NET Core API'ye HTTP üzerinden talepler gönderilecek; API, EF Core aracılığıyla PostgreSQL'e kayıt yapacak. Henüz bu bağlantıların hiçbiri kurulmadı. Bu boyutta bir başlangıç için ayrı domain/infrastructure projeleri, repository katmanı veya ek deployment altyapısı oluşturulmadı.

Frontend testleri bileşenlerle birlikte `client/src/` altında tutulur; kök `tests/` dizini backend testlerini içerir. Hazır proje template'i ve UI kit kullanılmadı.

## Yerel çalıştırma

Gereksinimler: Node.js 24.14 veya üstü 24.x, npm ve .NET 10 SDK. PostgreSQL bu aşamada gerekli değildir. `global.json`, en az 10.0.100 olan kararlı 10.0 SDK feature band'lerini kabul eder.

### Frontend

Repository kökünden:

```sh
cd client
npm ci
npm run dev
```

Başlangıç ekranı `http://127.0.0.1:5173` adresinde açılır. Development portu sabittir; kullanımda ise Vite hata verir.

Build ve testler (`client/` içinden):

```sh
npm run build
npm test
```

Build komutu test dosyaları ve Vite ayarları dahil TypeScript kontrolünü de çalıştırır. `npm run typecheck` bağımsız tip kontrolü, `npm run test:watch` izleme modu ve `npm run preview` build çıktısının yerel önizlemesi içindir.

### Backend

Repository kökünden:

```sh
dotnet restore FlowPilot.slnx --locked-mode
dotnet build FlowPilot.slnx --no-restore
dotnet test --solution FlowPilot.slnx --no-build --no-restore
dotnet run --project server/FlowPilot.Api --launch-profile http --no-build
```

Host `http://localhost:5080` adresinde çalışır. Henüz endpoint bulunmadığından `/` dahil isteklerin `404` dönmesi beklenir; Swagger veya health endpoint'i eklenmedi. Yerel HTTP profili sadece geliştirme başlangıcı içindir.

Bu ilk doğrulama sırasında sistemdeki .NET 8'e ek olarak .NET SDK 10.0.401, sistem kurulumunu değiştirmeden `$HOME/.local/share/flowpilot/dotnet` dizinine kuruldu. Bu makinede yukarıdaki komutlardan önce aynı terminal oturumunda:

```sh
export PATH="$HOME/.local/share/flowpilot/dotnet:$PATH"
```

Diğer makinelerde standart .NET 10 SDK kurulumu yeterlidir. xUnit, `global.json` içinde seçilen Microsoft Testing Platform üzerinden çalışır. Tam bağımlılık sürümleri npm ve NuGet lock dosyalarıyla kaydedilir.

### Environment ve gizli bilgiler

- Kökteki `.env.example` yalnızca referanstır; ASP.NET Core `.env` dosyalarını otomatik okumaz. Geliştirme profili, mevcut host için gereken gizli olmayan ayarları zaten sağlar.
- Sonraki aşamada backend gizli ayarları environment değişkenleri veya .NET User Secrets üzerinden verilecek. `ConnectionStrings__FlowPilot` örneği yorum satırındadır ve şu anda kullanılmaz.
- Frontend için `client/.env.example`, ileride kullanılacak `VITE_API_BASE_URL` değerini gösterir. Gerektiğinde `client/.env.local` olarak kopyalanabilir; Vite bu dizindeki dosyayı okur. Mevcut ekran bu ayarı tüketmez ve API çağrısı yapmaz.
- `VITE_*` değerleri tarayıcıya açıktır; parola veya başka gizli bilgi içeremez. Gerçek `.env` dosyaları, yerel secret ayarları, sertifikalar ve build çıktıları `.gitignore` ile dışlanır; örnekler ve lock dosyaları repository'de tutulur.

## Mevcut durum

### İlk aşama checklist'i

- [x] Repository incelendi; dizin boştu ve Git repository'si yoktu.
- [x] Git başlatıldı ve `feature/flowpilot-mvp` branch'i oluşturuldu.
- [x] React + TypeScript frontend iskeleti oluşturuldu.
- [x] ASP.NET Core Web API host iskeleti oluşturuldu.
- [x] Frontend ve backend test altyapıları hazırlandı.
- [x] `.gitignore` ve gizli bilgi içermeyen environment örnekleri eklendi.
- [x] Projenin amacı, teknolojileri, mimarisi ve mevcut durumu belgelendi.
- [x] İlk aşama `AI_LOG.md` dosyasına kaydedildi.
- [x] Frontend development/build, backend build ve test doğrulamaları tamamlandı.

İlk doğrulama: `npm ci`, `npm run build` ve `npm test` başarılı; 1 frontend smoke testi geçti. Vite development sunucusu HTTP 200 verdi ve başlangıç ekranı uygulama içi tarayıcıda görüldü. `dotnet restore --locked-mode` ve solution build başarılı; API ve test projesi 0 uyarı/0 hata ile derlendi. Microsoft Testing Platform üzerinden 1 backend smoke testi geçti. Backend geliştirme profiliyle başlatıldı; endpoint olmadığı için `/` beklenen HTTP 404 yanıtını verdi. Bunlar yalnızca iskelet doğrulamalarıdır; tamamlanmamış ürün özelliklerini doğrulamaz.

### Sonraki aşamalar için gereksinimler

- [ ] Mobil ve masaüstü uyumlu landing page.
- [ ] İsim, e-posta, hizmet seçimi ve açıklama alanlarından oluşan talep formu; hizmet seçenekleri ve validasyon kuralları netleştirilecek.
- [ ] ServiceRequest modeli, API sözleşmesi ve talep oluşturma endpoint'i.
- [ ] EF Core/Npgsql kurulumu, PostgreSQL bağlantısı ve migration.
- [ ] Formun API'ye bağlanması; gönderim, başarı ve hata durumları.
- [ ] Özelliklere uygun iş kuralı, API, form ve kalıcılık testleri.

Authentication/authorization, admin paneli, Docker, Kubernetes ve deployment altyapısı bu aşamanın kapsamı dışındadır. Henüz commit atılmadı.
