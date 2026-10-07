# FlowPilot

FlowPilot, küçük işletmelerin tekrar eden operasyonel süreçlerini otomatikleştirmesine yardımcı olan kurgusal bir teknoloji hizmetidir. Mobil ve masaüstü uyumlu landing page; isim, e-posta, hizmet seçimi ve açıklama içeren form üzerinden talep toplar. Geçerli talepler gerçek ASP.NET Core API aracılığıyla PostgreSQL'e kalıcı olarak yazılır.

Bu README **Sprint 6 itibarıyla güncel kurulum rehberidir**. Sprint 1–6 kararları, tarihsel test sonuçları ve karşılaşılan hatalar [AI_LOG.md](AI_LOG.md) içindedir. Henüz canlı URL yoktur; deployment Sprint 7'ye bırakılmıştır.

## Teknolojiler ve mimari

| Alan | Teknoloji |
| --- | --- |
| Frontend | React 19, TypeScript, Vite; elle yazılmış CSS, template/UI kit yok |
| Backend | C#, ASP.NET Core Web API, .NET 10; Minimal API |
| Persistence | Entity Framework Core 10, Npgsql, PostgreSQL 16 |
| Frontend testleri | Vitest, React Testing Library, jsdom |
| Backend testleri | xUnit v3, Microsoft Testing Platform, WebApplicationFactory, Testcontainers |
| CI | GitHub Actions; tek Ubuntu job'u |

```text
flowpilot/
├── client/                     # React uygulaması ve component testleri
├── server/FlowPilot.Api/        # API, ServiceRequests, Data ve migration
├── tests/FlowPilot.Api.Tests/   # Gerçek PostgreSQL entegrasyon testleri
├── .github/workflows/quality.yml
├── .config/dotnet-tools.json    # Yerel EF CLI sürümü
├── FlowPilot.slnx
├── global.json
├── compose.yaml                # Yalnızca yerel PostgreSQL
├── .env.example                # Backend/DB configuration referansı
├── README.md
└── AI_LOG.md
```

Tek repo, bir API projesi ve bir backend test projesi vardır. Frontend testleri `client/src/` içinde bileşenlerin yanında tutulur. Gereksiz katman, generic repository veya deployment altyapısı yoktur.

Veri akışı: **React form → client validation → POST /api/requests → server validation → ServiceRequestService → EF Core/Npgsql → PostgreSQL → HTTP 201 → UI success**. Servis `SaveChangesAsync` tamamlanmadan başarı dönmez. UUID `Id` ve UTC `CreatedAt` sunucuda üretilir; client bu alanları belirleyemez.

## Gereksinimler

- Node.js **24.14 veya üstü 24.x**, npm.
- Kararlı **.NET 10 SDK** (en az 10.0.100; `global.json` latestFeature roll-forward kullanır).
- Yerel uygulama için PostgreSQL; Compose ve entegrasyon testleri için çalışan Docker engine / Docker Desktop.
- Git. Yerel varsayılan portlar: frontend 5173, API 5080, PostgreSQL 5433.

İlk geliştirme makinesinde sistem .NET 8 olduğundan SDK 10.0.401 ayrı dizine kurulmuştur. Yalnızca bu kurulumu kullanıyorsanız terminalde:

```sh
export DOTNET_ROOT="$HOME/.local/share/flowpilot/dotnet"
export PATH="$DOTNET_ROOT:$PATH"
```

Standart .NET 10 SDK kurulumu olan diğer makinelerde bu adım gerekmez. `dotnet --version` ve `node --version` ile sürümleri kontrol edin.

## PostgreSQL ve backend environment

Repository kökünde, ilk kurulumda:

```sh
test -f .env || cp .env.example .env
```

Ignored `.env` dosyasında `POSTGRES_PASSWORD=REPLACE_LOCALLY` değerini yerel bir parola ile değiştirin. `ConnectionStrings__Default` örneğini de aynı parola/port ile güncelleyin. Gerçek ayarları source code'a yazmayın.

```sh
docker compose up -d --wait postgres
```

Compose `.env` dosyasını okur; PostgreSQL 16.14'ü yalnızca `127.0.0.1:5433` adresine açar. `POSTGRES_PORT` değişirse backend connection string portunu da değiştirin. Veriler `flowpilot_postgres_data` volume'unda korunur. Mevcut volume üzerindeki parola `.env` düzenlenince otomatik değişmez.

**ASP.NET Core `.env` dosyasını otomatik okumaz.** Backend ve EF CLI için connection string'i environment üzerinden `ConnectionStrings__Default` ile veya Development ortamında User Secrets ile verin. User Secrets örneği (placeholder'ı gerçek yerel değerle değiştirin):

```sh
dotnet user-secrets set 'ConnectionStrings:Default' \
  'Host=localhost;Port=5433;Database=flowpilot;Username=flowpilot;Password=YOUR_LOCAL_PASSWORD' \
  --project server/FlowPilot.Api
```

User Secrets Git'e dahil değildir ve production secret store yerine geçmez. Eksik/boş connection string host başlangıcında açıklayıcı configuration hatası üretir.

## Uygulamayı birlikte çalıştırma

İlk terminal, repository kökünde; PostgreSQL ve yukarıdaki secret ayarı hazır olmalıdır:

```sh
export ASPNETCORE_ENVIRONMENT=Development
dotnet restore FlowPilot.slnx --locked-mode
dotnet tool restore
dotnet build FlowPilot.slnx --no-restore
dotnet ef database update --project server/FlowPilot.Api
dotnet run --project server/FlowPilot.Api --launch-profile http --no-build
```

İlk migration `20261007103358_InitialCreate` repository'dedir. Yeniden oluşturmayın. Startup'ta migration otomatik uygulanmaz; yukarıdaki database update adımı gereklidir.

İkinci terminal, repository kökünden:

```sh
cd client
test -f .env.local || cp .env.example .env.local
npm ci
npm run dev
```

Tarayıcı: `http://127.0.0.1:5173`. API: `http://localhost:5080/api/requests`. `/` için 404 beklenir; GET/Swagger/health endpoint'i yoktur. Vite portu kullanımda ise hata verir.

Development'ta frontend `/api` istekleri Vite proxy'si üzerinden API'ye gider; backend CORS gerekmez. API çalışmıyorsa sayfa açılır, gönderim genel hata verir ve değerler korunur.

Durdurmak için iki terminalde Ctrl+C, ardından `docker compose stop postgres` kullanın. Volume ve kayıtlar korunur.

## Environment referansı ve production hazırlığı

| Ayar | Nerede / amaç |
| --- | --- |
| `ConnectionStrings__Default` | Backend/EF; secret store veya process environment; zorunlu |
| `ASPNETCORE_ENVIRONMENT` | Yerelde Development, deployment'ta Production |
| `ASPNETCORE_URLS` | Hosting'in gerektirdiği bind adresi/port; development launch profile 5080 |
| `AllowedHosts` | Backend; production'da gerçek host adı/host adları ile override edin (noktalı virgülle ayrılır) |
| `POSTGRES_DB/USER/PASSWORD/PORT` | Yalnızca yerel Compose; örnek root `.env.example` |
| `VITE_API_BASE_URL` | Public, build-time frontend API kökü; **/api dahil**, varsayılan `/api` |
| `API_PROXY_TARGET` | Yalnızca Vite development proxy hedefi; varsayılan localhost:5080 |

`client/.env.example` frontend ayarlarının örneğidir. `VITE_*` browser bundle'ına girer; parola/connection string içeremez. Root `.env.example` production override'ları da yorum olarak gösterir. Gerçek `.env`, `.env.local`, sertifika, build ve dependency çıktıları `.gitignore` ile dışlanır; örnekler ve lock dosyaları version control'dedir.

Production build'e localhost API adresi gömülmez; varsayılan `/api/requests` aynı origin'i kullanır. **Vite development proxy production'da çalışmaz.** Hosting katmanında `/api` API'ye yönlendirilmeli ve HTTPS sağlanmalıdır. Ayrı origin tercih edilirse frontend build'inden önce `VITE_API_BASE_URL=https://api.example.com/api` ayarlanmalı; API'de yalnızca güvenilen frontend origin'i için CORS ayrıca yapılandırılmalıdır. Bu henüz uygulanmamıştır.

`appsettings.json` host allowlist'i yerel adreslerle sınırlıdır; production'da `AllowedHosts` override'ı gereklidir. Production API'yi development `launchSettings.json` profiliyle çalıştırmayın. Backend bind adresi, host, connection string ve HTTPS seçilen hosting'e göre Sprint 7'de ayarlanacaktır.

Build çıktıları (deployment yapmaz):

```sh
# repository kökünde
npm --prefix client run build
dotnet publish server/FlowPilot.Api --configuration Release --no-restore
```

Frontend çıktısı `client/dist/`, backend publish çıktısı `server/FlowPilot.Api/bin/Release/net10.0/publish/` altındadır. Migration release sırasında açıkça uygulanmalıdır. Production DB/domain/canlı URL bu sprintte oluşturulmaz.

## API ve validation sözleşmesi

| Alan | Kural |
| --- | --- |
| `name` | Zorunlu; trim sonrası 1–200 karakter |
| `email` | Zorunlu; trim sonrası temel e-posta formatı; maksimum 320 karakter |
| `serviceType` | Exact/case-sensitive: workflow-automation, system-integration, data-reporting, custom-software |
| `description` | Zorunlu; trim sonrası 10–4000 karakter |

Server validation esas kaynaktır; client validation UX sağlar. Eksik/null/boş/whitespace, desteklenmeyen hizmet ve hatalı JSON reddedilir. E-posta kontrolü teslim edilebilirlik kontrolü değildir. Hizmet değerleri trim edilmez; diğer üç alan trim edilerek saklanır.

- **201:** DB yazımı tamamlanmıştır; response `id` ve `createdAt` içerir. UI başarı mesajı gösterip dört alanı temizler. 200/204 başarı sayılmaz.
- **400:** ProblemDetails; validation hataları camelCase alan anahtarları altında mesaj dizileridir. Client yalnızca bilinen alanlara kendi güvenli Türkçe mesajlarını eşler. Bozuk/bilinmeyen body genel hataya düşer. Kayıt oluşturulmaz.
- **500 / network hatası:** Genel hata; değerler korunur ve kullanıcı tekrar deneyebilir. Exception/stack trace/DB credential client'a verilmez. Otomatik retry yoktur.

Pending sırasında form kilitlenir ve ikinci submit engellenir. Loading/success için polite status live region, hata için alert; alanlarda label, aria-invalid ve aria-describedby bağlantıları bulunur. Yeni hatada ilgili alan/summary focus alır; düzenlerken focus sıçramaz. Landing page skip link, semantic landmark, sıralı heading, visible focus ve reduced-motion CSS içerir.

Bağımsız SQL ile kurgusal QA kaydını kontrol etmek için:

```sh
docker compose exec -T postgres psql -U flowpilot -d flowpilot <<'SQL'
SELECT "Id", "Name", "Email", "ServiceType", "Description", "CreatedAt"
FROM "ServiceRequests" WHERE "Email" = 'final-qa@example.com';
SQL
```

## Testler ve CI

Frontend (`client/` içinde):

```sh
npm ci
npm run typecheck
npm test
npm run build
```

Backend (repository kökünde; Docker açık):

```sh
dotnet restore FlowPilot.slnx --locked-mode
dotnet build FlowPilot.slnx --configuration Release --no-restore
dotnet test --solution FlowPilot.slnx --configuration Release --no-build --no-restore
```

Microsoft Testing Platform için `dotnet test --solution` kullanılır. Testcontainers, development DB'den ayrı geçici gerçek PostgreSQL 16.14 container'ları başlatıp migration uygular; fixture sonunda kaldırır. Docker yoksa testler başarısız olur; fake/in-memory fallback yoktur. İlk çalıştırmada image indirme gerekebilir. Client component testlerinin fetch çağrıları mock'tur; gerçek E2E yerine geçmez.

Model/migration uyumu (çalışan yerel DB configuration'ı ile):

```sh
dotnet ef migrations has-pending-model-changes --project server/FlowPilot.Api
```

[Quality checks workflow](.github/workflows/quality.yml), `main` hedefli PR'larda ve `main` push'larında frontend install/typecheck/test/build, backend locked restore/Release build/test çalıştırır. Tek Ubuntu 24.04 job'u; Node 24 ve kararlı .NET 10; npm/NuGet cache; contents:read; release commit SHA'larına sabitlenmiş resmi Actions. Runner'ın Docker engine'i gerçek Testcontainers/PostgreSQL testleri için kullanılır. Repo secret'ı veya Compose development DB'si gerekmez; testler/devam eden adımlar gevşetilmez. Workflow deployment yapmaz. Branch protection/required check ayarı ayrıca GitHub repository yönetimidir; bu sprintte değiştirilmez.

## Sprint 6 requirement checklist

| Gereksinim | Kanıt / durum |
| --- | --- |
| Mobil/desktop landing page | React/CSS, browser viewport audit |
| İsim/e-posta/hizmet/açıklama | Label'lı dört controlled alan, dört desteklenen service |
| Client/server validation | Component ve gerçek PostgreSQL API testleri |
| Submitting/success/error | 33 frontend testi; gerçek browser veri/hata akışı |
| Kalıcı PostgreSQL kayıt | 42 backend testi; bağımsız SQL ile manuel QA kaydı |
| Başarı yalnızca kayıt sonrası | SaveChangesAsync → 201 → UI; geçici SQL lock ile gözlem |
| README/AI_LOG/kaynak kod | Güncel rehber, tarihsel sprint günlüğü, tek repo |
| Deployment'a hazır configuration | Public API root ve secret/environment override'ları; yayın Sprint 7 |
| CI | GitHub Actions PR ve main kalite kontrolleri |

Yerel Sprint 6 sonuçları: **33 frontend testi**, **42 backend testi**, production frontend build ve Release backend build başarılı; backend **0 warning / 0 error**. Manuel browser → API → PostgreSQL regresyonunda tamamen kurgusal `Final QA Test` / `final-qa@example.com` / `system-integration` kaydı doğrulandı. Accessibility ve remote CI'ın ayrıntılı sonuçları AI_LOG Sprint 6 kaydındadır. [İlk remote CI run](https://github.com/mberatkaya/flowpilot/actions/runs/37625039548) SUCCESS: 33 frontend / 42 backend testi, 0 backend warning/error.

## Bilinen eksikler ve kapsam

- Canlı deployment, production DB, domain, hosting/HTTPS ve production routing Sprint 7'de yapılacak; ayrı-origin CORS henüz yok.
- Gerçek browser E2E ve axe audit bu sprintte manuel çalıştırılır; CI'da browser/a11y job'u yoktur.
- Fiziksel mobil cihaz ve kapsamlı screen reader denetimi yapılmadı. Otomatik audit tek başına WCAG uyumluluk sertifikası değildir.
- Yük/kapasite testleri, uygulama seviyesinde network timeout ve sunucu idempotency kapsam dışıdır; mevcut koruma tek pending form submit'ini engeller.
- Auth/admin/analytics/e-posta/dashboard/rate limiting eklenmedi; bu projede istenen özellikler değildir.

Geliştirmeler güncel `main` üzerinden ayrı sprint branch'inde yapılır; PR inceleme için açık bırakılır, otomatik merge edilmez.
