# FlowPilot

İlk milestone'un amacı, kararları ve doğrulama kaydı aşağıda korunmuştur. **Güncel backend kurulumu ve çalışma durumu için bu dosyanın sonundaki “Sprint 2 — API ve PostgreSQL persistence” bölümünü kullanın.** İlk milestone'daki “veritabanı gerekli değil / endpoint yok / commit atılmadı” ifadeleri yalnızca o aşamaya aittir.

Sprint 2 bölümü PostgreSQL kurulum rehberi olarak geçerlidir; **güncel validation ve HTTP sözleşmesi en alttaki Sprint 3 bölümündedir**. Önceki sprintlerde sonraya bırakılmış olarak yazılan validation işleri artık tamamlandı.

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

## Sprint 2 — API ve PostgreSQL persistence

### Güncel durum ve veri akışı

`POST /api/requests` → `CreateServiceRequest` DTO → `ServiceRequestService` → `FlowPilotDbContext` → EF Core/Npgsql → PostgreSQL `ServiceRequests` tablosu.

Servis, kaydı `SaveChangesAsync` ile gerçekten yazdıktan sonra `201 Created` döner. Veritabanı hatası başarıya dönüştürülmez; ASP.NET Core'un standart exception handler'ı genel `500` ProblemDetails yanıtı üretir. Ayrıntılı hata sözleşmesi Sprint 3'e bırakıldı. Otomatik migration uygulaması yapılmaz; database update aşağıdaki komutla açıkça çalıştırılır.

`Id`, sunucunun ürettiği UUID'dir. `CreatedAt`, sunucunun ürettiği UTC `DateTimeOffset` değeridir ve PostgreSQL `timestamp with time zone` kolonunda saklanır. Request DTO'su bu iki alanı içermez; client'ın gönderdiği `createdAt` değeri kullanılmaz. Başarı response'u `id` ve `createdAt` içerir. GET endpoint'i geliştirilmediğinden response'a çalışmayan bir `Location` adresi eklenmez.

Şema sınırları: isim 200, e-posta 320, hizmet tipi 64 ve açıklama 4000 karakter; alanlar veritabanında zorunludur. Bu sınırlar HTTP validasyonu değildir. Desteklenen hizmet tipleri `ServiceTypes.Supported` içinde merkezi olarak tanımlanmıştır:

- `workflow-automation`
- `system-integration`
- `data-reporting`
- `custom-software`

Hizmet tipi allowlist kontrolü, format/uzunluk validasyonu ve ayrıntılı validation testleri Sprint 3'te eklenecek. Lookup table, generic repository, CQRS veya yeni katman projesi eklenmedi. React/frontend dosyaları değiştirilmedi.

### PostgreSQL ve connection string

Gereksinimler: .NET 10 SDK ve PostgreSQL. Yerel geliştirme/testler PostgreSQL 16.14 ile doğrulandı. İsteğe bağlı Compose yalnızca PostgreSQL çalıştırır; backend uygulaması container içinde çalışmaz. Otomatik entegrasyon testleri için çalışan bir Docker engine gerekir.

Repository kökünden:

```sh
cp .env.example .env
# .env içindeki POSTGRES_PASSWORD placeholder'ını yerel bir parola ile değiştirin.
# ConnectionStrings__Default örneğindeki parolayı da aynı değerle güncelleyin.
docker compose up -d --wait postgres
```

Compose, `.env` dosyasını okur ve PostgreSQL'i yalnızca `127.0.0.1:5433` adresine açar. Port gerekirse `.env` içindeki `POSTGRES_PORT` ile değiştirilebilir; backend connection string portu da buna uygun olmalıdır. Veriler `flowpilot_postgres_data` volume'unda korunur. Mevcut volume üzerindeki veritabanı parolası `.env` değişince otomatik değişmez.

**ASP.NET Core `.env` dosyasını otomatik okumaz.** Backend ve EF CLI için connection string'i .NET User Secrets ile ayarlayın (aşağıdaki parola yalnızca placeholder'dır):

```sh
dotnet user-secrets set 'ConnectionStrings:Default' \
  'Host=localhost;Port=5433;Database=flowpilot;Username=flowpilot;Password=YOUR_LOCAL_PASSWORD' \
  --project server/FlowPilot.Api
```

Alternatif olarak aynı değeri process environment'ında `ConnectionStrings__Default` anahtarına verin. User Secrets kullanırken EF CLI terminalinde `ASPNETCORE_ENVIRONMENT=Development` ayarlanmalıdır. Eksik/boş connection string host başlangıcında anlaşılır bir configuration hatası üretir. Gerçek credential, appsettings/kaynak koduna yazılmaz; `.env` Git tarafından dışlanır. Yalnızca `.env.example` repository'de tutulur.

### Migration, build ve backend çalıştırma

Komutlar repository kökünden çalıştırılır. İlk milestone'da kurulan ayrı SDK kullanılıyorsa önce ilgili PATH ayarını yukarıdaki gibi yapın; EF tool'unun da aynı runtime'ı kullanması için gerekirse `export DOTNET_ROOT="$HOME/.local/share/flowpilot/dotnet"` ekleyin.

```sh
export ASPNETCORE_ENVIRONMENT=Development
dotnet restore FlowPilot.slnx --locked-mode
dotnet tool restore
dotnet build FlowPilot.slnx --no-restore
dotnet ef migrations list --project server/FlowPilot.Api
dotnet ef database update --project server/FlowPilot.Api
dotnet run --project server/FlowPilot.Api --launch-profile http --no-build
```

`InitialCreate` migration'ı, designer dosyası ve model snapshot'ı `server/FlowPilot.Api/Data/Migrations/` altında version control'e dahildir. Mevcut ilk migration'ı yeniden oluşturmayın. İleride şema değişikliği için örnek komut:

```sh
dotnet ef migrations add YourMigrationName --project server/FlowPilot.Api --output-dir Data/Migrations
```

Backend `http://localhost:5080` adresinde çalışır. `POST /api/requests` endpoint'i vardır; `/` için hâlâ `404` beklenir.

### Örnek API request

Yalnızca kurgusal veri kullanın:

```sh
curl -i http://localhost:5080/api/requests \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "serviceType": "workflow-automation",
    "description": "This is a fictional evaluation request."
  }'
```

Başarılı kayıt sonucu `201 Created` ve `{"id":"<server-generated-uuid>","createdAt":"<server-generated-utc-time>"}` döner. Response `id` değerini kullanarak gerçek kaydı kontrol etmek için:

```sh
docker compose exec postgres psql -U flowpilot -d flowpilot \
  -c 'SELECT "Id", "Name", "Email", "ServiceType", "Description", "CreatedAt" FROM "ServiceRequests";'
```

Yerel PostgreSQL'i durdurmak için `docker compose stop postgres` kullanın; volume ve kayıtlar korunur.

### Testler ve doğrulama

Docker açıkken:

```sh
dotnet test --solution FlowPilot.slnx --no-build --no-restore
dotnet ef migrations has-pending-model-changes --project server/FlowPilot.Api
```

Testcontainers ayrı ve geçici gerçek PostgreSQL 16.14 container'ı başlatır, aynı migration'ı uygular ve testlerden sonra kaldırır. Yerel geliştirme veritabanını değiştirmez; ilk çalıştırmada PostgreSQL ve resource reaper image'larını indirebilir. Docker yoksa entegrasyon testleri başarısız olur; fake/in-memory testine sessizce geçilmez.

Test kapsamı: eksik configuration için başlangıç hatası; geçerli request için `201` ve bağımsız SQL bağlantısıyla tüm alanların kalıcı kaydı; client timestamp'ının yok sayılması; gerçek PostgreSQL'deki eksik database hatası için `500`. Detaylı validasyon testleri sonraki sprinttedir.

Sprint 2 doğrulama sonuçları `AI_LOG.md` içinde kaydedilir.

### Branch ve PR çalışma modeli

```text
main (ilk milestone: 0f8c2d4)
└── feature/sprint-2-backend-persistence
```

- `main`, GitHub varsayılan branch'i ve stabil teslim branch'idir. Doğrudan geliştirme yapılmaz.
- Her sprint için güncel `main` üzerinden ayrı `feature/`, `fix/` veya `test/` branch'i açılır.
- Değişiklikler `main` hedefli Pull Request ile incelenir; mümkünse squash merge tercih edilir.
- Sprint 2 PR'ı inceleme için açık bırakılacak; kullanıcı incelemeden merge edilmeyecek.

Sprint 3'e bırakılanlar: server-side validasyon, ayrıntılı hata yönetimi ve ilgili testler. Frontend entegrasyonu, landing page, authentication/authorization, admin paneli, rate limiting, e-posta ve deployment geliştirilmedi.

## Sprint 3 — Server-side validation ve hata davranışı

Sprint 2 PR #1'in `main` içine merge edildiği doğrulandı. Çalışma branch'i `feature/sprint-3-validation-error-handling`; frontend değişmedi. Mevcut EF Core/PostgreSQL kayıt akışı korunur ve validation, endpoint handler'ı çalışmadan önce tamamlanır.

### Validation kuralları

| Alan | Kural |
| --- | --- |
| `name` | Zorunlu; trim sonrası whitespace/boş değer reddedilir; en fazla 200 karakter |
| `email` | Zorunlu; trim sonrası .NET `EmailAddress` format kontrolü; en fazla 320 karakter |
| `serviceType` | Tam olarak `workflow-automation`, `system-integration`, `data-reporting` veya `custom-software` |
| `description` | Zorunlu; trim sonrası 10–4000 karakter; whitespace/boş değer reddedilir |

Eksik ve `null` alanlar da reddedilir. ServiceType karşılaştırması case-sensitive'dir; çevresindeki whitespace kabul edilmez. Name, Email ve Description kenar boşlukları temizlenerek saklanır; e-posta harfleri ve alanların içindeki boşluklar değiştirilmez. Uzunluklar .NET string uzunluğuyla, trim sonrasında hesaplanır.

Maksimumlar mevcut PostgreSQL şemasıyla aynı tutuldu; 10 karakterlik açıklama minimumu, talebin kısa da olsa anlamlı bir açıklama içermesi için seçildi. Kurallar DTO üzerindeki DataAnnotations, `ServiceRequestLimits` sabitleri ve mevcut `ServiceTypes.Supported` allowlist'inden gelir. Yeni migration veya validation kütüphanesi eklenmedi.

### HTTP sözleşmesi

- **201 Created:** Geçerli kayıt PostgreSQL'e yazıldıktan sonra `id` ve sunucu UTC `createdAt` değeri döner.
- **400 Bad Request:** Alan validasyonu başarısızsa `application/problem+json` ve camelCase alan anahtarları altında mesaj dizileri döner. Geçersiz istek DB'ye yazılmaz. Boş/bozuk JSON, JSON `null` gövde ve yanlış JSON alan tipleri de `400` döner; bind edilemeyen gövde için genel ProblemDetails kullanılır.
- **500 Internal Server Error:** Beklenmeyen persistence hatası genel ProblemDetails yanıtı üretir; başarı bilgisi, exception mesajı, stack trace veya connection string içermez. Bu davranış Development ortamında da geçerlidir.

Alan validasyonu örneği (diğer ProblemDetails metadata alanları da bulunabilir):

```json
{
  "title": "Validation failed.",
  "status": 400,
  "instance": "/api/requests",
  "errors": {
    "name": ["Name is required."],
    "email": ["Email must be a valid email address."]
  }
}
```

JSON gövdesi okunamadığında `title` değeri `Bad request.` olur. `500` için `title` değeri `An unexpected error occurred.`, `detail` değeri `The request could not be completed. Please try again later.` olur. Validation mesajlarına girilen değerler geri yansıtılmaz. Client'ın gönderdiği `id` ve `createdAt` DTO'da yoktur; yok sayılır ve sunucunun ürettiği değerlerin yerine geçmez.

### Doğrulama

Sprint 2'deki kurulum ve test komutları aynıdır:

```sh
dotnet restore FlowPilot.slnx --locked-mode
dotnet build FlowPilot.slnx --no-restore
dotnet test --solution FlowPilot.slnx --no-build --no-restore
dotnet ef migrations has-pending-model-changes --project server/FlowPilot.Api
```

Gerçek PostgreSQL/Testcontainers ile 42 test geçti: geçerli kayıt ve alanların trim edilmesi; dört hizmet tipinin kabulü; eksik/null/boş/whitespace ve uzunluk sınırları; alan bazlı hata sözleşmesi; tüm geçersiz isteklerde bağımsız SQL sorgularıyla kayıt sayısının değişmediği; client Id/CreatedAt değerlerinin yok sayılması; güvenli `500` yanıtı. Migration modelinde değişiklik yoktur. Fake/in-memory provider kullanılmadı.

Sprint 3 PR'ı inceleme için açık bırakılır; merge edilmez. Sonraki sprintin landing page/frontend işi bu sprintte başlatılmadı.
