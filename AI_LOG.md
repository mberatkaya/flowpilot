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

## 2026-10-07 — Sprint 3: request validation ve hata davranışı

### Araç, görev ve branch

- Araç: Codex; ASP.NET Core skill'i ve resmi Minimal API/validation/ProblemDetails belgeleri kullanıldı.
- Görev: Yalnızca `POST /api/requests` server-side validation ve hata davranışlarını güvenilir hale getirmek; başarılı persistence akışını korumak; gerçek PostgreSQL ile geçersiz kaydın yazılmadığını ve güvenli hata sözleşmesini kanıtlamak; dokümantasyon, commit/push ve merge edilmeyecek PR hazırlamak.
- Başlangıç çalışma ağacı temizdi. Sprint 2 PR #1 `MERGED` idi; `main` commit'i `e9c7226`, Sprint 2 commit'i `c7af738` bunun ancestor'ıydı. Remote fetch/fast-forward kontrolünden sonra güncel `main` üzerinden `feature/sprint-3-validation-error-handling` oluşturuldu. Yerel `origin/HEAD`, GitHub'daki `main` varsayılan branch'iyle eşitlendi.

### Validation yaklaşımı ve limitler

- ASP.NET Core 10'un `AddValidation()` desteği ve DataAnnotations kullanıldı. Validation endpoint handler'ından önce çalışır; yeni özel validation framework'ü veya paket eklenmedi.
- DTO constructor'ı Name, Email ve Description değerlerini trim eder; eksik/null alanlar boş değere dönüşüp validasyonda reddedilir. DTO, client Id/CreatedAt alanlarını içermez.
- Name zorunlu ve maksimum 200, Email zorunlu/`EmailAddress` formatında ve maksimum 320, Description zorunlu ve 10–4000 karakterdir. Uzunluklar trim sonrası değerlendirilir. Maksimumlar mevcut DB şemasını korur; açıklama minimumu kısa ama anlamlı bir operasyon talebi için 10 seçildi.
- `ServiceRequestLimits` sabitleri DataAnnotations ve EF configuration tarafından paylaşılır. Şema maksimumları değişmediği için migration gerekmez.
- Küçük bir `SupportedServiceTypeAttribute`, mevcut değiştirilemez `ServiceTypes.Supported` kümesini kullanır. Dört kabul edilen değer workflow-automation/system-integration/data-reporting/custom-software; karşılaştırma case-sensitive ve tam eşleşmedir. ServiceType whitespace'i normalize edilmez.
- Alan kuralları DTO'da, limitler ortak sabitlerde ve kabul edilen hizmetler tek allowlist'te tutulur. Serviste aynı validation kuralları tekrar yazılmadı.

### Hata response yaklaşımı

- Mevcut `201` yalnızca `SaveChangesAsync` tamamlandıktan sonra üretilir; persistence servisi değiştirilmedi.
- Yerleşik HttpValidationProblemDetails `400` üretir; `CustomizeProblemDetails` alan anahtarlarını camelCase yapar ve sabit `Validation failed.` başlığı verir. Hata mesajları kullanıcı girdisini geri yansıtmaz.
- Binding hatalarında `ThrowOnBadRequest=false`, Development dahil bozuk/boş/null JSON veya yanlış alan tipinin `500` yerine `400` dönmesini sağlar. `UseStatusCodePages` boş binding hata response'una standart ProblemDetails gövdesi ekler; bozuk gövde için sabit, hassas bilgi içermeyen mesaj vardır.
- `UseExceptionHandler` ve mevcut `AddProblemDetails` kullanıldı. `500` başlığı/açıklaması sabittir; extension alanları temizlenir. Exception mesajı, stack trace, DB adı, parola veya connection string response'a eklenmez. Global exception framework/Result kütüphanesi eklenmedi.

### Çalıştırılan kontroller ve testler

Komutlar ayrı kurulan .NET SDK 10.0.401 ile, repository kökünde çalıştırıldı; Docker engine erişilebilirdi.

| Kontrol | Sonuç |
| --- | --- |
| `dotnet restore FlowPilot.slnx --locked-mode` | Başarılı; yeni paket eklenmedi |
| `dotnet build FlowPilot.slnx --no-restore` | 0 uyarı, 0 hata |
| `dotnet test --solution FlowPilot.slnx --no-build --no-restore` | 42 geçti, 0 başarısız, 0 atlanan |
| `dotnet ef migrations has-pending-model-changes --project server/FlowPilot.Api` | Bekleyen model değişikliği yok; yeni migration oluşturulmadı |

Gerçek PostgreSQL 16.14/Testcontainers kullanıldı; fake/in-memory provider yoktur. Mevcut migration her geçici test veritabanına uygulanır. Geçerli kayıt/trim edilmiş alanlar ve sınır değerleri bağımsız SQL bağlantısından okunur. Her geçersiz alan, eksik alan ve bozuk gövde senaryosunda istekten önce/sonra `ServiceRequests` kayıt sayısı eşit bulunur. Çoklu alan hatalarında dört alanın tamamı raporlanır; sensitive input marker/parola body'de yoktur. Client Id/CreatedAt değerlerinin kullanılmadığı SQL ile doğrulanır. Gerçek PostgreSQL'de bulunmayan database hatası Testing ve Development ortamlarında `500` döner, başarı veya internal bilgi dönmez.

### Gerçekten karşılaşılan hata / değiştirilmiş öneri

İlk patch'te `using System.Text.Json` dosyanın sonuna eklendiği için CS1529 derleme hatası oluştu. Bildirim dosyanın başına taşındı; sonraki build ve 42 test başarılı oldu. Reddedilmiş bir AI önerisi veya başka bir hata uydurulmadı.

### Kapsam ve inceleme

Frontend dosyaları, landing page, UI durumları, form entegrasyonu, authentication/admin/deployment/rate limiting ve yeni ürün özellikleri geliştirilmedi. Üretim ortamı/yük testleri ve e-posta teslim edilebilirliği bu validation testleriyle kanıtlanmaz. Sonraki sprintin frontend işi başlatılmadı.

Teslim commit mesajı ve PR başlığı: `feat: add request validation and error handling`. Son diff incelemesinden sonra restore/build/test tekrar çalıştırıldı; 0 uyarı/0 hata ve 42 başarılı test sonucu korundu. Client ve migration dosyalarının diff'i boştu. Çalışma branch'i push edilip `main` hedefli PR açılacak; PR inceleme için OPEN/NOT MERGED bırakılacak. Commit SHA ve PR URL'si final raporda verilecek.

## 2026-10-07 — Sprint 4: landing page ve responsive UI

### Araç, görev ve branch

- Araç: Codex; Git/npm CLI, dosya patch aracı ve Codex uygulama içi tarayıcısında CUA ile kontrol kullanıldı. Alt ajan kullanılmadı.
- Görev: FlowPilot için Türkçe, mobil/desktop uyumlu ve erişilebilir hizmet landing page'i; yalnızca görsel/client form yapısı; testler, dokümantasyon ve merge edilmeyecek PR.
- Başlangıç çalışma ağacı temizdi. Sprint 3 PR #2 `MERGED` olarak doğrulandı. Fetch ve fast-forward ile `main` commit'i `76378f7` alındı; Sprint 3 commit'i `a767451` bunun ancestor'ıydı. Güncel `main` üzerinden `feature/sprint-4-landing-page` oluşturuldu.

### İçerik sırası ve tasarım yaklaşımı

- Header → hero/primary CTA → dört hizmet → üç çalışma adımı → talep formu → kısa footer. Ürünün ne yaptığı, kimlere yardımcı olduğu, çözdüğü tekrarlar ve çalışma biçimi bu sırayla anlatılır; ek pazarlama bölümü veya doğrulanamayacak iddia eklenmedi.
- Açık tema, beyaz/açık nötr yüzeyler, koyu yeşil vurgu, sistem fontları ve kontrollü whitespace seçildi. Native CSS Grid/Flex ve media query kullanıldı; template, UI kit, Tailwind veya yeni bağımlılık eklenmedi.
- Hero'daki örnek akış yerel HTML/CSS, ikonlar yerel SVG ile oluşturuldu; dış görsel/font kaynağı yoktur.
- Hizmet açıklamaları ve Türkçe option label'ları aynı `services.ts` kaynağından gelir. Dört service value backend ile aynıdır; backend dosyaları değiştirilmedi.
- Form, uncontrolled native alanlar ve label'lardan oluşur. Gönderim kapalı bilgisi görünürdür; submit düğmesi disabled'dır ve native submit yalnızca preventDefault ile engellenir. API isteği, gerçek submit, local/session storage, success/loading/error UI eklenmedi.

### Accessibility kararları

- Semantic header/nav/main/section/article/footer; tek h1 ve h2/h3 sırası; aria-labelledby ile isimli section'lar; gerçek label/input bağlantıları.
- Skip link ve focusable anchor hedefleri; link navigasyonu ile buton ayrımı; klavye :focus-visible için 3 px belirgin mavi outline. Klavyeyle isim alanından e-posta alanına geçiş tarayıcıda doğrulandı.
- Form name/email autocomplete, e-posta type'ı, native required/minLength/maxLength ve açıklama hint'i kullanıldı. Disabled gönderim düğmesi, görünür açıklamaya aria-describedby ile bağlandı.
- Hero çizimi, ikonlar ve yardımcı oklar aria-hidden; screen reader ağacında dekoratif akış düğümleri görünmez. prefers-reduced-motion CSS kuralı smooth scroll ve CTA transition'ını kapatır; kuralın tarayıcı stylesheet'inde bulunduğu kontrol edildi.
- CTA 52 px, navigasyon linkleri 44 px, form input/select'leri 48–52 px yüksekliktedir; form font'u 16 px'tir.
- Renk hesabı: ana metin/beyaz 14.40:1, muted/açık yüzey 5.89:1, beyaz/CTA yeşili 6.91:1, placeholder/beyaz 4.81:1, input sınırı/beyaz 3.30:1, focus/beyaz 5.46:1. Input border daha belirgin renge alındı.

### Responsive ve tarayıcı doğrulamaları

| Viewport | Kontrol sonucu |
| --- | --- |
| 320×800 | Görsel mobil hero/form kontrolü; document width 320, yatay taşma yok; alan genişliği 242 px |
| 390×844 | DOM yerleşim ölçümü; document width 390; nav linkleri 44 px ve CTA 52 px |
| 430×932 | Görsel mobil form/focus/disabled düğme kontrolü; document width 430; alan genişliği 352 px |
| 768×1024 | Görsel tablet hero ve form ölçümü; document width 768; iki hizmet sütunu; düzeltilmiş formda isim/e-posta 312 px, select/textarea 642 px |
| 1440×1000 | Görsel desktop hero/form; document width 1440; form 559 px, isim/e-posta yaklaşık 240 px |

CTA gerçek anchor tıklamasıyla `#talep-formu` hedefini açtı; smooth scroll tamamlandığında section üstü viewport'ta yaklaşık 24 px idi. Keyboard focus e-posta alanında :focus-visible/solid outline olarak görüldü. Browser console error/warn listesi boştu. Geçici viewport override'ı kontrol sonunda reset edildi. Desktop/mobil screenshot'ları repository dışında Codex visualizations dizinine kaydedildi; credential veya gerçek kullanıcı verisi içermez.

### Test ve build kontrolleri

- `npm ci`: başarılı; yeni paket eklenmedi, bildirilen güvenlik açığı yok.
- `npm run typecheck`: başarılı.
- `npm test`: 8 frontend testi geçti. Heading/landmark, dört hizmet, anchor hedefleri, gerçek label'lar, dört service option value, sıralı adımlar, kapalı gönderim ve skip link kanıtlandı. API mock testi yoktur.
- `npm run build`: TypeScript + Vite production build başarılı.
- `npm run dev`: 127.0.0.1:5173 üzerinde tarayıcıda kontrol edildi; backend'e ihtiyaç duymadı.
- Son diff incelemesinden sonra `npm run typecheck`, `npm test` ve `npm run build` tekrar çalıştırıldı; tümü başarılı ve 8 test geçti. `server/` ve backend testleri bu sprintte çalışılmadı/değiştirilmedi.

### Gerçek düzeltmeler / değiştirilmiş öneriler

İlk test çalıştırmasında üç bölüm adı bulunamadı: JSX'te `<br>` çevresinde boşluk olmadığı için jsdom erişilebilir adı kelimeleri bitişik okuyordu. Başlıklara açık boşluk eklenerek düzeltildi; sonraki 8 test geçti. Tablet formu ilk yerleşimde yaklaşık 140 px input genişliği verdi; tarayıcı ölçümüne dayanarak form bölümü 900 px altında tek sütuna alındı ve 768 px'te 312 px input genişliği doğrulandı. Reddedilmiş ayrı bir AI önerisi yoktur; başka hata uydurulmadı.

### Kapsam ve teslim

Backend/API, backend testleri ve migration'lar korundu. Fetch/axios/API entegrasyonu, gerçek gönderim, loading/success/backend error UI, authentication, admin, analytics, cookie banner, chatbot, pricing, deployment ve gereksiz animasyon eklenmedi. Fiziksel mobil cihaz ve kapsamlı assistive technology denetimi yapılmadı; test edilenler tarayıcı viewport'ları, accessibility tree ve klavye davranışlarıdır.

Teslim commit mesajı ve PR başlığı: `feat: build responsive FlowPilot landing page`. Çalışma branch'i push edilip `main` hedefli PR açılacak ve OPEN/NOT MERGED bırakılacak. Sprint 5 form/API entegrasyonuna geçilmeyecek. Commit SHA ve PR URL'si final raporda verilecek.

## 2026-10-07 — Sprint 5: form/API entegrasyonu

### Araç, görev ve branch

- Araç: Codex; Git/npm/.NET/Docker/gh CLI, patch ve uygulama içi browser CUA araçları kullanıldı. Resmi React input ve Vite environment/proxy belgeleri incelendi; alt ajan kullanılmadı.
- Görev: Mevcut landing page formunu gerçek `POST /api/requests` API'sine bağlamak; client validation/state/error UX, frontend testleri, backend regresyonu ve gerçek browser → API → PostgreSQL E2E doğrulaması; commit/push ve merge edilmeyecek PR.
- Sprint 4 PR #3 `MERGED` olarak doğrulandı. Güncel `main` commit'i `a0a9906` alındı; Sprint 4 commit'i `2a5e10f` ancestor kontrolü geçti. Çalışma branch'i `feature/sprint-5-form-api-integration`.

### Client/server validation ayrımı ve teknik kararlar

- Client sadece UX için isim/e-posta/açıklama trim, zorunluluk/whitespace ve uzunluk kontrolleri yapar. İsim 200, e-posta 320, açıklama 10–4000 karakter; e-posta temel format kontrolü; ServiceType mevcut dört value ile tam eşleşir.
- Server validation ve PostgreSQL persistence esas kaynaktır; backend sözleşmesi/kaynakları/testleri/migration'ları değiştirilmedi. Yeni dependency veya state kütüphanesi eklenmedi.
- API çağrısı native fetch ile küçük `requestApi.ts` modülündedir. `VITE_API_BASE_URL`, /api dahil API köküdür; varsayılan ve örnek `/api`. Development'ta Vite `/api` proxy'si `API_PROXY_TARGET` ile localhost:5080'e iletir. Component'te host hard-code edilmedi. Production same-origin yönlendirme gerektirir; ayrı origin için tam API kökü ve trusted CORS gereksinimi README'de açıklandı. Deployment/CORS değişikliği yapılmadı.
- Request payload yalnızca dört form alanıdır. Backend Id/CreatedAt üretimi aynen korunur.

### Form state ve başarı/hata yaklaşımı

- React state ile idle/submitting/success/validation-error/server-error; controlled form alanları ve tek pending request için ref koruması kullanıldı. Pending sırasında alanlar/düğme disabled; kullanıcı değerleri değiştirip yanıt gelince yanlışlıkla kaybetmez.
- Başarı ve form temizleme yalnızca response.status === 201 dalında yapılır. Fetch resolve/response.ok/200/204 client validation başarısı yeterli sayılmaz.
- 400 body unknown olarak parse edilir; sadece bilinen alanlar ve string array şekli kabul edilir. Backend metinleri gösterilmez, yerel Türkçe alan mesajları kullanılır. Bozuk/bilinmeyen body genel hata alanına düşer.
- 500/diğer beklenmeyen response veya fetch exception statik genel mesaj üretir; değerler korunur, düğme yeniden açılır. Otomatik retry yoktur.
- Input hataları aria-invalid/describedby; error alert ve loading/success polite status region. aria-busy yalnızca pending alan grubundadır, live region dışında bırakıldı. Hata üretildiğinde ilk hatalı input/genel summary focus alır; düzenleme sırasında focus yerinde kalır.

### Frontend ve backend doğrulamaları

| Komut | Sonuç |
| --- | --- |
| `npm ci` (client/) | Başarılı; yeni paket/güvenlik açığı bildirimi yok |
| `npm run typecheck` | Başarılı |
| `npm test` | 33 frontend testi geçti |
| `npm run build` | TypeScript/Vite production build başarılı |
| `dotnet restore FlowPilot.slnx --locked-mode` | Başarılı |
| `dotnet build FlowPilot.slnx --no-restore` | 0 uyarı, 0 hata |
| `dotnet test --solution FlowPilot.slnx --no-build --no-restore` | 42 geçti, 0 başarısız, 0 atlanan; gerçek PostgreSQL/Testcontainers |
| `dotnet ef database update --project server/FlowPilot.Api` | Mevcut yerel DB günceldi; yeni migration yok |

Frontend API çağrıları component testlerinde mocklandı; gerçek entegrasyon olarak raporlanmaz. Testler invalid input → sıfır API çağrısı, pending loading/disabled/duplicate guard, 201 sonrası mesaj/temizleme, yalnız 201'in başarı sayılması, trim ve exact service value/configured URL, güvenli 400 eşlemesi/fallback, 500/network sonrası değerlerin korunması, retry ve focus davranışını kanıtlar.

### Gerçek manuel E2E ve bağımsız PostgreSQL kontrolü

Gerçek PostgreSQL 16.14 Compose, ASP.NET Core API localhost:5080 ve React/Vite 127.0.0.1:5173 birlikte çalıştırıldı. Form CUA ile browser üzerinden dolduruldu; fixture/fetch mock'u kullanılmadı.

Kurgusal payload:

```text
Name: Sprint Five Test
Email: sprint5@example.com
Service: workflow-automation
Description: This is a fictional request created for the FlowPilot technical evaluation.
```

1. Bağımsız SQL ile bu e-postanın başlangıç kayıt sayısı 0 görüldü.
2. Ayrı psql transaction'ında ServiceRequests için geçici SHARE lock alındı; bu yalnızca kontrol sırasında INSERT'i bekletti, ürün koduna delay eklenmedi.
3. Browser formu gönderdi. Buton “Gönderiliyor...”/disabled, alanlar disabled, status “Talebiniz gönderiliyor.” idi; başarı mesajı yoktu.
4. Lock COMMIT ile bırakıldı. Geçici hosting diagnostic log ayarı, browser kaynaklı POST'un HTTP 201 ile tamamlandığını gösterdi (~6.9 sn; DB beklemesi dahil). Bu log ayarı kaynak koda/repo configuration'a eklenmedi.
5. Browser'da gerçek başarı mesajı görüldü ve dört alan temizlendi.
6. Bağımsız `docker compose exec ... psql SELECT` sorgusunda kayıt tüm alanlarıyla bulundu: ID `2e0890f6-73c6-4134-ab6a-2734cbc74db4`, CreatedAt `2026-10-07T12:27:04.183473+00:00`. UI mesajından DB kaydı varsayılmadı.
7. API process'i kapatıldı ve aynı kurgusal değerler browser formundan tekrar gönderildi. Vite proxy ECONNREFUSED/500 hata yolu oluştu. UI genel hata mesajı gösterdi, success region boş kaldı, değerler korundu ve düğme enabled oldu; error summary focus aldı.
8. Bağımsız SQL ile kayıt sayısı hâlâ 1 idi; hata denemesi yeni kayıt oluşturmadı. DB volume ve bu kurgusal kayıt korundu; kontrol için açılan process'ler durduruldu.

Desktop feedback görüntüleri repository dışında Codex visualizations dizinine kaydedildi. 320×800 hata state'inde document width 320 ölçüldü; yatay taşma yoktu. Geçici browser viewport override'ı reset edildi. Native hizmet seçimi value'su workflow-automation olarak doğrulandı.

### Gerçek hata/düzeltmeler ve sınırlar

İlk `npm ci` yanlışlıkla repository kökünde çalıştırıldığı için lockfile bulunamadı; doğru `client/` dizininde tekrar çalıştırılıp başarılı oldu. Kod incelemesinde focus'u her error state düzenlemesinde yeniden taşıyan yaklaşım değiştirildi: focus yalnızca yeni hata üretilirken tetiklenir; düzeltme sırasında yerinde kalması test edildi. API kapatıldığındaki ECONNREFUSED, planlanan hata senaryosuydu; giderilmemiş ürün hatası olarak sunulmaz. Reddedilmemiş bir AI önerisi için “reddettim” kaydı oluşturulmadı.

Backend ve landing page tasarımı korunur; auth/admin/analytics/e-posta/rate limiting/dashboard/deployment veya yeni backend feature eklenmedi. Manuel E2E, otomatik CI browser testi değildir. Production hosting, ayrı-origin CORS, fiziksel cihaz/screen reader audit'i ve ağın yanıt vermeden uzun süre beklediği durumlar bu sprintte ayrıca doğrulanmadı.

Teslim commit mesajı ve PR başlığı: `feat: connect service request form to API`. Son diff incelemesi sonrası typecheck/test/build tekrar başarılı oldu; 33 frontend testi sonucu korundu. Backend kaynakları/testleri ve package manifest/lock diff'leri boştu. Branch push edilip `main` hedefli PR açılacak ve OPEN/NOT MERGED bırakılacak. Sprint 6 CI/final kalite/deployment işine geçilmeyecek; commit SHA ve PR URL'si final raporda verilecek.
