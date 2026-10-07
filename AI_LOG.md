# AI çalışma kaydı

## 2026-10-07 — İlk aşama: proje iskeleti

### Kullanılan araç

Codex. Repository ve araç incelemesi için Git ve shell; dosya oluşturmak için patch aracı; bağımlılıklar ve doğrulama için npm/.NET CLI kullanıldı. ASP.NET Core skill'i ve resmi .NET, Vite, Vitest, xUnit dokümantasyonu incelendi. Hazır template, UI kit veya alt ajan kullanılmadı.

### Verilen görev

FlowPilot teknik değerlendirme gereksinimlerini analiz etmek; tek repository içinde React + TypeScript frontend, ASP.NET Core Web API backend ve test iskeletlerini hazırlamak; environment örnekleri, `.gitignore`, README ve bu kaydı oluşturmak. Frontend development/build, backend build ve test derlemelerini doğrulamak. `feature/flowpilot-mvp` branch'inde çalışmak, commit atmamak ve bu ilk aşamadan sonra durmak.

### Başlangıç durumu

`/Users/mbkaya/Repo/flowpilot` boş bir dizindi; `.git` ve mevcut kaynak kod yoktu. Git, istenen `feature/flowpilot-mvp` branch'i ile başlatıldı. Yerel araçlar Node.js 24.14.0, npm 11.9.0 ve .NET SDK 8.0.418 idi. Yeni projenin .NET 10 LTS ile doğrulanması için SDK 10.0.401 ayrı yerel dizine kuruldu; sistem SDK'sı değiştirilmedi.

### Temel teknik kararlar

- Projeler elle kuruldu; Vite yalnızca frontend geliştirme/build aracı olarak kullanıldı. Minimal başlangıç ekranı landing page tasarımının tamamlandığı anlamına gelmez.
- Backend `net10.0` hedefler. `global.json` kararlı .NET 10 SDK'yı seçer; solution `FlowPilot.slnx` biçimindedir.
- Tek API projesi ve tek backend test projesi yeterli görüldü; katman projeleri ve kullanılmayan özellik paketleri eklenmedi.
- Backend yalnızca `WebApplication` host'unu başlatır; hiçbir endpoint veya veritabanı bağımlılığı yoktur.
- xUnit v3 ve `WebApplicationFactory<Program>` ile host başlangıcı doğrulanır. .NET 10 için `global.json` içinde Microsoft Testing Platform seçildi ve `xunit.v3.mtp-v2` kullanıldı. Frontend için Vitest, React Testing Library ve jsdom seçildi; frontend testleri bileşenlerin yanında tutuldu.
- TypeScript strict modu açık; build test dosyalarının ve araç ayarlarının tip kontrolünü de içerir. Bağımlılık sürümleri ve lock dosyaları tekrarlanabilir kurulum için kaydedildi.
- Yerel host portları frontend 5173, backend 5080. Entegrasyon yapılmadığı için proxy ve CORS eklenmedi.
- `.env.example` dosyaları yalnızca gizli olmayan ayarlar ve kullanılmayan placeholder içerir. Backend `.env` dosyalarını otomatik yüklemez; gerçek ayarlar ileride environment/User Secrets üzerinden sağlanacak. `VITE_*` değerlerinin herkese açık olduğu README'de açıklandı.

### Doğrulama

Komutlar repository kökünde, npm komutları ise `client/` içinde çalıştırıldı. .NET komutlarında ayrı kurulan SDK'nın executable yolu kullanıldı; README aynı SDK'yı PATH'e ekleme adımını içerir.

| Kontrol | Sonuç |
| --- | --- |
| `npm ci` | Başarılı; engine uyarısı ve bildirilen güvenlik açığı yok |
| `npm run build` | TypeScript kontrolü ve Vite production build başarılı |
| `npm test` | 1 test dosyası, 1 test başarılı |
| `npm run typecheck` | Son Node.js 24 tip paketi seçimi sonrasında başarılı |
| `npm run dev` | `127.0.0.1:5173` üzerinde açıldı; HTTP 200 ve tarayıcıda FlowPilot başlığı doğrulandı |
| `dotnet restore FlowPilot.slnx --locked-mode` | Başarılı |
| `dotnet build FlowPilot.slnx --no-restore` | API ve backend test projesi derlendi; 0 uyarı, 0 hata |
| `dotnet test --solution FlowPilot.slnx --no-build --no-restore` | 1 backend test başarılı |
| `dotnet run --project server/FlowPilot.Api --launch-profile http --no-build` | Host `localhost:5080` üzerinde başladı; `/` beklenen HTTP 404 yanıtını verdi |
| `git check-ignore` | Gerçek environment dosyaları ve build/dependency çıktıları dışlandı; örnekler ve lock dosyaları dışlanmadı |

Kurulum sırasında jsdom 30.1.2'nin Node.js 24.15+ istediği görüldü; yerel Node 24.14.0 ile desteklenen jsdom 29.x sürümüne geçildi ve kurulum uyarısı giderildi. İlk xUnit çalıştırması .NET 10/VSTest uyumsuzluğu nedeniyle başarısız oldu; MTP ayarına geçilip gereksiz VSTest paketleri kaldırıldı. Yeniden build ve test başarılı oldu.

Doğrulama sonunda commit atılmadı; branch `feature/flowpilot-mvp`. Development süreçleri kontrollerin ardından kapatıldı.

### Henüz doğrulanmamış veya sonraki aşamaya bırakılan konular

- ServiceRequest modeli, API endpoint'leri, HTTP sözleşmesi, validasyon ve hizmet seçenekleri.
- PostgreSQL/EF Core/Npgsql sürümleri, DbContext, bağlantı, migration ve kalıcı kayıt.
- Formun backend'e bağlanması, CORS gereksinimi ve gönderim durumları.
- Tam landing page tasarımı, mobil/masaüstü kabul kriterleri ve kapsamlı erişilebilirlik kontrolleri.
- Özelliklere ilişkin unit/integration testleri, gerçek tarayıcı uçtan uca testleri ve gerçek veritabanı testleri.
- Deployment, authentication/authorization ve admin paneli geliştirilmedi.

Bu kayıt yalnızca ilk aşamayı kapsar. Commit atılmayacak; sonraki milestone'a kendiliğinden geçilmeyecek.

## 2026-10-07 — Sprint 2: API + PostgreSQL persistence

### Araç ve görev

- Araç: Codex.
- Görev: GitHub branch düzenini kurmak; `POST /api/requests` → EF Core → PostgreSQL kalıcı kayıt akışını geliştirmek, migration ve gerçek veritabanı testlerini eklemek; README'yi koruyarak güncellemek; commit/push yapmak ve `main` hedefli PR'ı merge etmeden incelemeye bırakmak.
- ASP.NET Core skill'i, resmi EF Core/Npgsql ve Testcontainers belgeleri kullanıldı. Git/.NET/Docker/gh CLI üzerinden çalışıldı; alt ajan kullanılmadı.

### Branch düzeni

Başlangıçta temiz çalışma ağacında yalnızca `feature/flowpilot-mvp` vardı ve ilk milestone commit'i `0f8c2d4c04b382ecc9ce65c492a06af0b8431f91` idi. Bu commit'ten `main` oluşturulup `origin/main` olarak push edildi; GitHub varsayılan branch'i `main` yapıldı. Sprint 2 geliştirmeleri yalnızca `main` üzerinden oluşturulan `feature/sprint-2-backend-persistence` branch'inde yapıldı. `main` üzerine Sprint 2 commit'i yazılmadı.

### Temel teknik kararlar

- Tek API projesi içinde `ServiceRequests/` feature klasörü ve `Data/` persistence klasörü kullanıldı; yeni katman projeleri, generic repository veya CQRS eklenmedi.
- Entity alanları: UUID `Id`, zorunlu string `Name`/`Email`/`ServiceType`/`Description`, UTC `DateTimeOffset` `CreatedAt`. Veritabanında UUID ve `timestamp with time zone` kullanıldı; string uzunlukları sırasıyla 200/320/64/4000 karakterle sınırlandı.
- İstemci DTO'su yalnızca dört kullanıcı alanını içerir. `Id` ve `CreatedAt` sunucuda üretilir; client timestamp'ı kullanılmaz.
- Endpoint ince tutuldu; entity oluşturma ve `SaveChangesAsync` somut `ServiceRequestService` içindedir. `201`, veritabanı yazımı tamamlandıktan sonra döner. Mevcut olmayan GET endpoint'ine `Location` linki eklenmedi.
- DB hataları başarıya çevrilmez. Standart ASP.NET Core exception handler'ı genel `500` ProblemDetails sağlar; özel hata sözleşmesi ve ayrıntılı validation Sprint 3'e bırakıldı.
- EF Core/Design/Relational ve yerel `dotnet-ef` 10.0.12, Npgsql EF provider 10.0.3 kullanıldı. Yerel tool manifest ve NuGet lock dosyaları repository'de tutulur.
- Connection string, `ConnectionStrings:Default` configuration anahtarından alınır (`ConnectionStrings__Default` environment karşılığı). Eksik ayar anlaşılır bir başlangıç hatası verir. Otomatik startup migration'ı yoktur.
- Desteklenen dört ServiceType değeri değiştirilemez merkezi kümede tanımlandı; HTTP allowlist validasyonu bu sprintte eklenmedi. Lookup table oluşturulmadı.
- Compose yalnızca PostgreSQL 16.14 servisini içerir; localhost:5433'e bind edilir ve named volume kullanır. Backend containerize edilmedi. Gerçek yerel parola yalnızca Git dışında kalan `.env` dosyasında üretildi; README/environment örnekleri placeholder içerir.
- Entegrasyon testleri Testcontainers 4.15.0 ile ayrı, geçici gerçek PostgreSQL başlatır; gerçek migration uygulanır. Kayıt, EF change tracker yerine bağımsız Npgsql SQL bağlantısı üzerinden kontrol edilir. Docker yoksa testler fail olur; fake/in-memory fallback yoktur.
- React/frontend dosyaları değiştirilmedi; `git diff main -- client` boştu.

### Yapılan doğrulamalar

Komutlar repository kökünde, ayrı kurulan .NET SDK 10.0.401 ile çalıştırıldı. Migration ve manuel API doğrulamasında ignored `.env` değerleri yalnızca ilgili process environment'ına yüklendi; credential çıktıya veya version control'e yazılmadı.

| Komut / kontrol | Sonuç |
| --- | --- |
| `dotnet restore FlowPilot.slnx` ve `--locked-mode` | Başarılı |
| `dotnet tool restore` | dotnet-ef 10.0.12 hazır |
| `dotnet build FlowPilot.slnx --no-restore` | 0 uyarı, 0 hata |
| `docker compose up -d --wait postgres` | Gerçek PostgreSQL 16.14 healthy |
| `dotnet ef migrations add InitialCreate --project server/FlowPilot.Api --output-dir Data/Migrations` | `20261007103358_InitialCreate`, designer ve snapshot oluşturuldu |
| `dotnet ef database update --project server/FlowPilot.Api` | Migration gerçek yerel `flowpilot` veritabanına uygulandı |
| `dotnet ef migrations list --project server/FlowPilot.Api` ve SQL history sorgusu | `20261007103358_InitialCreate` uygulanmış olarak doğrulandı |
| `dotnet ef migrations has-pending-model-changes --project server/FlowPilot.Api` | Bekleyen model değişikliği yok |
| `dotnet test --solution FlowPilot.slnx --no-build --no-restore` | 4 geçti, 0 başarısız, 0 atlanan; gerçek PostgreSQL fixture kullanıldı |
| `dotnet list server/FlowPilot.Api/FlowPilot.Api.csproj package --vulnerable --include-transitive` | NuGet kaynağında bildirilen güvenlik açığı yok |
| `dotnet run --project server/FlowPilot.Api --launch-profile http --no-build` | Host localhost:5080 üzerinde açıldı |
| `curl POST /api/requests` ve `docker compose exec ... psql SELECT` | HTTP 201; aynı ID'nin tüm alanları gerçek DB'de doğrulandı |

Manuel API doğrulamasında yalnızca kurgusal veri kullanıldı: `Test User`, `test@example.com`, `workflow-automation`, `This is a fictional evaluation request.` Kayıt ID'si `15cb77a3-d21a-4053-8108-0c6e21eb928d`; sunucu UTC zamanı `2026-10-07T10:36:10.615213+00:00`. Bu kayıt yerel named volume'da korunur. Testcontainer verileri fixture sonunda kaldırılır; kontrol için açılan API ve yerel PostgreSQL süreçleri durdurulur, yerel volume silinmez.

Testler: eksik connection string başlangıç hatası; geçerli request'in `201` ve tüm alanlarla kalıcı kaydı; client'ın Unix epoch timestamp'ının yok sayılması; gerçek PostgreSQL'de bulunmayan database nedeniyle oluşan hatanın `500` dönmesi. Sonuncusu standart hata yolunu test eder; yanlışlıkla başarı dönen bir implementation kabul edilmez.

### Gerçek düzeltmeler / reddedilen öneriler

İlk build'de `Microsoft.EntityFrameworkCore.Relational` 10.0.4/10.0.12 transitive sürüm çakışması görüldü. API projesinde Relational 10.0.12 açıkça sabitlenerek giderildi; sonraki build 0 uyarı ile geçti. Ayrıca reddedilmiş bir AI önerisi yoktur; kayıt için hata veya reddedilmiş öneri uydurulmadı.

### Henüz doğrulanmamış / sonraki aşamaya bırakılanlar

- ServiceType allowlist, e-posta formatı, boşluk/uzunluk kuralları ve ayrıntılı HTTP validasyon yanıtları.
- Ayrıntılı hata sözleşmesi ve validation/error handling testleri (Sprint 3).
- Frontend form/API entegrasyonu, landing page ve UI durumları.
- Authentication/authorization, admin paneli, rate limiting, e-posta ve deployment.
- Production ortamı, kapasite/yük testleri ve .NET 10/PostgreSQL 16.14 dışındaki platform kombinasyonları doğrulanmadı.

### Git ve inceleme

Sprint 2 commit mesajı: `feat: add service request API and persistence`. Çalışma branch'i remote'a gönderilecek ve aynı başlıkla `main` hedefli PR açılacak. PR merge edilmeyecek; squash merge inceleme sonrası tercih edilen yöntemdir. Sprint 3'e geçilmeyecek. Commit SHA ve PR URL'si final raporda verilecek.
