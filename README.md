# FlowPilot

## Project

FlowPilot, küçük işletmelerin tekrar eden operasyonel süreçlerini otomatikleştirmesine yardımcı olan kurgusal bir teknoloji hizmetidir. Mobil/masaüstü landing page üzerindeki isim, e-posta, hizmet seçimi ve açıklama formu gerçek API üzerinden PostgreSQL'e kalıcı kayıt oluşturur.

Hazır template veya UI kit kullanılmadı; React bileşenleri, CSS ve dekoratif SVG/HTML elle yazıldı. Kaynak kod: [GitHub repository](https://github.com/mberatkaya/flowpilot).

## Live demo

**Henüz canlı URL yok.** Mevcut ortamda authenticated deployment CLI veya hosting hedefi bulunamadı. Sprint 7'nin belirtilen fallback'i kapsamında same-origin production paketi hazırlandı ve yerelde doğrulandı; bu doğrulama canlı deployment değildir. Kalıcı production DB, public HTTPS ve canlı smoke test hedef/platform erişimi bekliyor.

## Stack

React 19 / TypeScript / Vite; C# / ASP.NET Core Web API / .NET 10; EF Core / Npgsql / PostgreSQL 16. Testler: Vitest/React Testing Library ve xUnit v3/Microsoft Testing Platform/Testcontainers. GitHub Actions tek Ubuntu job'u kullanır.

## Architecture

React form → client validation → `POST /api/requests` → server validation → `ServiceRequestService` → EF Core → PostgreSQL → `201` → success/temizleme.

Development'ta Vite proxy kullanılır. Production paketinde React çıktısı ASP.NET Core `wwwroot/` altındadır; `/` ve `/api/requests` aynı origin'den sunulur, CORS gerekmez. SPA fallback yoktur; bilinmeyen API/asset yolları 404 kalır. UUID Id ve UTC CreatedAt yalnızca sunucuda üretilir.

```text
client/                       React ve frontend testleri
server/FlowPilot.Api/          API, Data ve migration
tests/FlowPilot.Api.Tests/    Gerçek PostgreSQL API/hosting testleri
scripts/publish-production.sh Production paket üretimi
deploy/                      Release rehberi ve public configuration örneği
.github/workflows/quality.yml CI
```

## Local setup

Gereksinimler: Node.js 24.14+ (24.x), npm, kararlı .NET 10 SDK ve çalışan Docker engine. Standart PostgreSQL kurulumu da uygulama için kullanılabilir; Testcontainers için Docker gerekir.

Bu geliştirme makinesinde ayrı kurulan SDK kullanılacaksa:

```sh
export DOTNET_ROOT="$HOME/.local/share/flowpilot/dotnet"
export PATH="$DOTNET_ROOT:$PATH"
```

Standart .NET 10 kurulumu olan diğer makinelerde gerekmez. `global.json`, en az 10.0.100 olan kararlı 10.0 feature band'lerini kabul eder.

Repository kökünde ilk kurulum:

```sh
test -f .env || cp .env.example .env
```

Ignored `.env` içindeki POSTGRES_PASSWORD placeholder'ını değiştirin; ConnectionStrings__Default örneğini aynı parola/port ile güncelleyin. Compose `.env` okur; **ASP.NET Core otomatik okumaz**. Backend/EF için environment veya Development User Secrets kullanın:

```sh
dotnet user-secrets set 'ConnectionStrings:Default' \
  'Host=localhost;Port=5433;Database=flowpilot;Username=flowpilot;Password=YOUR_LOCAL_PASSWORD' \
  --project server/FlowPilot.Api
```

İlk terminal, repository kökünde:

```sh
docker compose up -d --wait postgres
export ASPNETCORE_ENVIRONMENT=Development
dotnet restore FlowPilot.slnx --locked-mode
dotnet tool restore
dotnet build FlowPilot.slnx --no-restore
dotnet ef database update --project server/FlowPilot.Api
dotnet run --project server/FlowPilot.Api --launch-profile http --no-build
```

İkinci terminal, repository kökünden:

```sh
cd client
test -f .env.local || cp .env.example .env.local
npm ci
npm run dev
```

Tarayıcı `http://127.0.0.1:5173`; API `http://localhost:5080`. Vite `/api` proxy'si aynı-origin development isteğini API'ye iletir. Development API tek başına çalıştırıldığında wwwroot olmadığından `/` 404 olabilir; production paketi `/` landing page'ini içerir.

Compose PostgreSQL 16.14 yalnızca 127.0.0.1:5433'e açılır, `flowpilot_postgres_data` volume'unda kalır. Port değiştirilirse connection string de değiştirilir. Mevcut volume parolası env düzenlenince otomatik değişmez. Durdurma: terminallerde Ctrl+C ve `docker compose stop postgres`; volume korunur.

## Environment variables

| Değişken | Amaç |
| --- | --- |
| `ConnectionStrings__Default` | Backend/EF zorunlu secret; hosting environment/secret store |
| `ASPNETCORE_ENVIRONMENT` | Development veya Production |
| `ASPNETCORE_URLS` | Hosting'in internal bind portu/adresi |
| `AllowedHosts` | Production gerçek public host listesi; local varsayılanı override edin |
| `POSTGRES_DB/USER/PASSWORD/PORT` | Yerel Compose; root `.env.example` referansı |
| `VITE_API_BASE_URL` | Public build-time API kökü, /api dahil; production script'i `/api` kullanır |
| `API_PROXY_TARGET` | Yalnız Vite development proxy hedefi; production'da kullanılmaz |

`VITE_*` herkese açıktır, secret içeremez. Gerçek env/secrets/sertifika/build çıktıları Git dışında tutulur. Production örneği [deploy/production.env.example](deploy/production.env.example); bu dosya otomatik yüklenmez. Production paketine local `.env`, User Secrets veya launch profile taşınmaz.

## Database

Migration `20261007103358_InitialCreate` repository'dedir; yeniden oluşturmayın. Startup migration yoktur.

Yerel DB (Development/environment secret ayarıyla):

```sh
dotnet tool restore
dotnet ef database update --project server/FlowPilot.Api
dotnet ef migrations has-pending-model-changes --project server/FlowPilot.Api
```

Production script'i idempotent `migrations.sql` üretir. SQL'i inceleyip hedef DB'de ON_ERROR_STOP ile ayrı release adımında uygulayın; migration/history doğrulanmadan release başarılı sayılmaz. Ayrıntılı komutlar [production release rehberinde](deploy/README.md). Production migration/DB kaydı henüz doğrulanmadı; ayrı yerel QA DB'de uygulanması ve tekrar çalıştırılabilmesi doğrulandı.

## Production package

Repository kökünde:

```sh
bash scripts/publish-production.sh
```

Çıktı `artifacts/production/`: .NET DLL, React wwwroot ve migration SQL. Framework-dependent paket ASP.NET Core 10 runtime gerektirir; OS'ye özel AppHost içermez. Paket üretimi secret/DB erişimi gerektirmez. Public HTTPS hosting, private port, gerçek AllowedHosts ve kalıcı PostgreSQL secret'ı hedef platformda ayarlanmalıdır. Paket dizini çalışma dizini olacak şekilde `dotnet FlowPilot.Api.dll` ile çalışır.

[Release rehberi](deploy/README.md), HTTPS/same-origin yönlendirme, kontrollü migration ve gerçek browser/SQL kabul kapılarını içerir. Authenticated hedef bulunmadan ücretli resource/domain/production DB oluşturulmadı. Gerekliliği kanıtlanmadığı için health endpoint'i eklenmedi.

## Tests

Frontend (`client/`):

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
dotnet publish server/FlowPilot.Api --configuration Release --no-restore
```

Microsoft Testing Platform için `--solution` kullanılır. Testcontainers, ayrı/geçici gerçek PostgreSQL başlatıp migration uygular; Docker yoksa testler fail olur, fake/in-memory fallback yoktur. Component testlerinde fetch mocklanır; bu testler gerçek E2E diye raporlanmaz.

Sprint 7 yerel sonuçları: **33 frontend / 47 backend**, 0 failed/0 skipped; typecheck, build, publish ve paket üretimi başarılı; backend 0 warning/0 error. Mevcut 42 backend testine dört static-hosting/404 kontrolü ve mevcut güvenli-500 testinin Production varyantı eklendi. Migration ve ürün sözleşmesi değişmedi.

[Quality checks](.github/workflows/quality.yml): main hedefli PR ve main push; npm install/typecheck/test/build, .NET locked restore/Release build/gerçek PostgreSQL testleri, same-origin production paket üretimi. Deploy yapmaz. [İlk final branch CI run](https://github.com/mberatkaya/flowpilot/actions/runs/37638405334) SUCCESS: 33/47 test ve production paket üretimi. Son head sonucu PR kontrolünde görülür.

## Validation / result behavior

| Alan | Kural |
| --- | --- |
| İsim | Zorunlu, trim sonrası 1–200 karakter |
| E-posta | Zorunlu, temel format, trim sonrası maksimum 320 |
| Hizmet | Exact/case-sensitive dört değer: workflow-automation, system-integration, data-reporting, custom-software |
| Açıklama | Zorunlu, trim sonrası 10–4000 karakter |

Client UX kontrolü; server esas validation kaynağıdır. ServiceType trim edilmez; diğer alanlar trim edilerek saklanır. Eksik/null/bozuk JSON ve geçersiz değerler reddedilir.

- **201:** SaveChangesAsync tamamlanmıştır; response Id/CreatedAt, UI success ve temizleme. 200/204 başarı sayılmaz.
- **400:** Alan hataları/ProblemDetails, DB'ye yazılmaz; UI güvenli yerel mesajlar gösterir ve değerleri korur.
- **500/network:** Genel mesaj; değerler korunur, kullanıcı tekrar deneyebilir. Exception/stack trace/credential client'a sızmaz.

Pending sırasında form kilitlenir; ref guard double submit'i engeller. Status/alert live region, label/ARIA hata bağlantıları, skip link, visible focus ve reduced-motion CSS vardır.

## Requirement evidence

Mobil/desktop landing page, dört alan, client/server validation, submitting/success/error, kayıt sonrası başarı ve kalıcı server-side kayıt test/browser/bağımsız SQL ile kanıtlandı. Kaynak kod, README ve AI_LOG repository'dedir. Repository private olduğundan değerlendiricinin GitHub erişimi ayrıca doğrulanmalıdır; görünürlük değiştirilmedi.

Sprint 7'de **yerel publish** smoke test: React/API aynı 5080 origin'inde, Production environment ve ayrı gerçek QA PostgreSQL. Loading sırasında success yok; HTTP 201 sonrası temizleme; bağımsız SQL ID `ff9174b0-cffa-43fe-bba5-3d647bf3392f`. Güvenli invalid email/short description, gerçek 400 ve değişmeyen SQL count. Console warn/error yok; 320/1440 viewport yatay taşma yok. Ayrıntılar AI_LOG'dadır. Bu kayıt canlı production DB kanıtı değildir.

**Bekleyen teslim maddeleri:** gerçek canlı HTTPS URL, kalıcı production DB/migration, canlı pozitif/negatif smoke ve bağımsız production SQL kanıtı; Sprint 7 merge sonrası delivery SHA.

## AI-assisted development

Codex ile yürütülen Sprint 1–7 görevleri, gerçek kararlar/hatalar ve doğrulamalar [AI_LOG.md](AI_LOG.md) içindedir. Tarihsel test sayıları güncel sonuç olarak sunulmaz.

## Known limitations

- Hosting erişimi olmadığı için canlı production teslimi tamamlanmadı; yerel Production environment canlı ortamla eş tutulmaz.
- E-posta teslim edilebilirliği doğrulanmaz; yalnız format kontrolü vardır.
- Fiziksel cihaz/kapsamlı screen reader denetimi yapılmadı. Browser E2E/axe manuel; CI'da browser job'u yok.
- Uygulama seviyesinde asılı network timeout, server idempotency ve yük/kapasite ayrıca doğrulanmadı.
- Auth/admin/mail/analytics görev kapsamında değildi; eklenmedi.

## Delivery

Source repository: [mberatkaya/flowpilot](https://github.com/mberatkaya/flowpilot) (private; yetkili GitHub erişimi gerekir). Final inceleme: [PR #6](https://github.com/mberatkaya/flowpilot/pull/6), OPEN / NOT MERGED.

Live URL: **yok — hosting hedefi bekliyor**.

**Delivery commit tanımı:** Sprint 7 PR'ının `main` branch'ine merge sonucu SHA'sı. **Henüz belirlenmedi; PR merge edilmedi.** Daha sonraki README güncellemesi bu release kimliğini değiştirmez. Branch commit'leri inceleme adaylarıdır; delivery SHA olarak sunulmaz.
