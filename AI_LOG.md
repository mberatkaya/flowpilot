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
