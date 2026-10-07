# Production release rehberi

Canlı uygulama: [FlowPilot](https://flowpilot-z7i9.onrender.com/).

Güncel production durumu: Render Web Service; Render tarafından sağlanan public HTTPS; aynı origin'de React frontend ve ASP.NET Core API; kalıcı Render PostgreSQL. `20261007103358_InitialCreate` production DB'ye uygulandı ve `__EFMigrationsHistory` bağımsız SQL ile doğrulandı. Canlı smoke testte form gönderimleri `201 Created` döndürdü; production kayıtlarının kalıcılığı bağımsız SQL sorgusuyla doğrulandı.

İlk canlı denemedeki `500`, Web Service `ConnectionStrings__Default` içindeki yanlış database adından kaynaklandı (`flowpilot_echo` yerine `flowpilot_ech0`). Ad düzeltildikten sonra gönderimler başarılı oldu. Aşağıdaki teknik bölümler sonraki release'ler için korunur.

## Mimari ve paket

Tek ASP.NET Core uygulaması React çıktısını `wwwroot/` üzerinden, API'yi `/api/requests` üzerinden sunar. Public HTTPS origin aynıdır; CORS gerekmez. Landing page router kullanmadığından SPA fallback yoktur; yanlış API/asset yolları 404 döner.

Repository kökünde Node 24 ve .NET 10 SDK ile:

```sh
bash scripts/publish-production.sh
```

`artifacts/production/`: framework-dependent .NET DLL'leri, appsettings, React index/assets ve `migrations.sql`. AppHost kapalıdır; paket OS'ye özel executable'a dayanmaz, hosting'de ASP.NET Core 10 runtime gerekir. Paket üretimi secret gerektirmez ve DB'ye bağlanmaz. Aynı-origin frontend API kökü `/api` olarak sabitlenir. Build çıktıları Git'e dahil değildir.

## Environment ve HTTPS

[production.env.example](production.env.example) yalnızca secret içermeyen referanstır; otomatik yüklenmez. Hosting environment/secret store üzerinden gerçek değerleri verin:

- `ASPNETCORE_ENVIRONMENT=Production`
- `ASPNETCORE_URLS`: platformun private bind portu; örnekte internal 8080
- `AllowedHosts`: gerçek public host adı; birden fazlaysa noktalı virgülle ayrılmış liste
- `ConnectionStrings__Default`: kalıcı production PostgreSQL'e ait Npgsql connection string

Frontend bundle'a credential verilmez. Development `.env`, User Secrets veya launch profile production'a taşınmaz. PostgreSQL için provider'ın TLS/CA ayarlarını kullanın; örnek `SSL Mode=VerifyFull` içerir. Sertifika doğrulamasını kapatmayın.

Hosting public HTTPS'i sonlandırmalı; tüm `/` ve `/api/*` isteklerini aynı uygulamaya göndermeli, internal HTTP portunu doğrudan public açmamalıdır. Kestrel'i publish dizini çalışma dizini olacak şekilde çalıştırın. Genel forwarded-header güveni veya AllowAnyOrigin açılmadı. HTTPS/proxy ayarları hedef platformda doğrulanmadan canlı teslim başarılı sayılmaz.

## Kontrollü migration

Startup migration yoktur. Generated SQL'i inceleyin; production release öncesinde hedef DB'ye bir kez kontrollü uygulayın. `psql` için hedefin `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD` ve gerekiyorsa `PGSSLROOTCERT` değerleri secret environment üzerinden sağlanmalıdır. Bunlar frontend değişkeni değildir; CLI çıktısına/parola argümanına yazılmaz.

```sh
export PGSSLMODE=verify-full
psql --set=ON_ERROR_STOP=1 --file=artifacts/production/migrations.sql
psql --set=ON_ERROR_STOP=1 <<'SQL'
SELECT "MigrationId", "ProductVersion" FROM "__EFMigrationsHistory";
SELECT COUNT(*) FROM "ServiceRequests";
SQL
```

Beklenen migration: `20261007103358_InitialCreate`. Script idempotent'tir; mevcut history kontrolüyle aynı şemayı tekrar oluşturmaz. SQL transaction içinde çalışır, hata varsa psql nonzero exit verir. Migration/history doğrulanmadan uygulamayı release etmeyin. Production migration rolü ile runtime rolü provider izin modeline göre ayrılabilir; runtime'ın table insert izni gerekir.

## Uygulama başlangıcı

Başarılı migration sonrasında paketi hosting'e aktarın; secret ayarlarını process environment'ına verin. Çalışma dizini publish dizini olmalıdır:

```sh
cd artifacts/production
dotnet FlowPilot.Api.dll
```

Bu komut hosting'in process manager'ı/container runtime'ı tarafından çalıştırılır; kendi başına public HTTPS veya kalıcı DB oluşturmaz. Mevcut canlı ortamda HTTPS Render, kalıcı DB Render PostgreSQL tarafından sağlanır. Health endpoint'i eklenmedi.

## Canlı kabul kontrolü

Gerçek platform URL'sini kaydedin; browser'da desktop ve mobil layout, form labels ve console errors kontrol edin. Network panelinde gerçek request/response'u gözlemleyin. Yalnızca kurgusal veri gönderin:

```text
Name: Production Delivery Test
Email: production-test@example.com
Service: data-reporting
Description: This is fictional data created only to verify the FlowPilot technical evaluation deployment.
```

Loading sırasında success yok; gerçek HTTP 201 sonrasında başarı/temizleme olmalıdır. Bağımsız production SQL ile response Id ve payload'ın eşleştiğini kontrol edin:

```sh
psql --set=ON_ERROR_STOP=1 <<'SQL'
SELECT "Id", "Name", "Email", "ServiceType", "Description", "CreatedAt"
FROM "ServiceRequests" WHERE "Email" = 'production-test@example.com';
SQL
```

Güvenli negatif test: `invalid-email` veya 10 karakterden kısa description ile tekrar deneyin. Client reddi veya gerçek 400 beklenir; success gösterilmez. Önce/sonra SQL kayıt sayısı aynı olmalıdır. Production DB/API'yi kapatmayın veya bozmayın; 500/network regresyonu test suite'te kapsanır.

## Teslim kapıları

- Gerçek HTTPS URL ve kalıcı production DB
- Başarılı production migration/history
- Canlı browser POST 201 + bağımsız SQL kaydı
- Güvenli canlı negatif test ve sabit DB sayısı
- Final branch CI success
- İncelenen/merge edilen Sprint 7 PR'ı

[PR #6](https://github.com/mberatkaya/flowpilot/pull/6) **MERGED**; final merge commit [`4b9ff75e0e1ce1bd7aa5ed9fdcf0474a1fe5fc3f`](https://github.com/mberatkaya/flowpilot/commit/4b9ff75e0e1ce1bd7aa5ed9fdcf0474a1fe5fc3f). Source repository public'tir. README Delivery bölümündeki teslim commit'i **current main HEAD after this documentation update** (`docs: record live production deployment`) olarak tanımlanır; SHA Git geçmişi/final rapordan alınır, dokümantasyona tekrar yazılarak commit döngüsü oluşturulmaz.
