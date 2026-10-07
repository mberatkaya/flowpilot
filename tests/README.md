# Test yapısı

- `FlowPilot.Api.Tests/`: xUnit ve `WebApplicationFactory<Program>` ile backend testleri. Sprint 2'de Testcontainers gerçek, geçici PostgreSQL başlatıp migration'ı uygular. Testler `201` yanıtının yanında bağımsız SQL bağlantısıyla kayıtları, sunucu timestamp'ını, veritabanı hatasında `500` yanıtını ve eksik configuration için başlangıç hatasını doğrular.
- `../client/src/**/*.test.tsx`: Vitest, React Testing Library ve jsdom ile frontend testleri. Testler bileşenlerin yanında tutulur; ortak kurulum `client/src/test/setup.ts` içindedir. Ayrı bir npm workspace gerekmez.

Çalıştırma komutları ana README'nin “Testler ve CI” bölümündedir. Backend entegrasyon testleri için Docker engine açık olmalıdır; fake/in-memory fallback yoktur. Test container'ı geliştirme veritabanından ayrıdır ve fixture sonunda temizlenir.

Sprint 3'te validation testleri eklendi. Geçersiz alanlar ve eksik/null/bozuk JSON gövdeler `400` ile reddedilir; her senaryoda PostgreSQL kayıt sayısı önce ve sonra bağımsız SQL bağlantısıyla karşılaştırılır. Geçerli sınır değerleri, dört hizmet tipi ve trim edilmiş kayıtlar SQL'den okunur. Persistence testleri client `Id`/`CreatedAt` değerlerinin yok sayıldığını ve Development dahil `500` response'larında DB credential/exception bilgisinin bulunmadığını doğrular. Toplam 42 backend testi vardır.

Sprint 5'ten itibaren toplam 33 frontend testi; sayfa/label/anchor kontrollerinin yanında mocked fetch ile client validation, pending/double-submit, yalnızca 201 sonrası success, güvenli 400, 500/network sonrası değer koruma/retry ve focus davranışını kapsar. Gerçek React → API → PostgreSQL manuel kontrolleri AI_LOG'da ayrı kaydedilir.

Sprint 6 CI aynı testleri Release build ile Ubuntu üzerinde çalıştırır. Testcontainers runner'ın Docker engine'ini kullanır; PostgreSQL provider'ı veya test davranışı değiştirilmedi.

Sprint 7: mevcut 42 teste production static root/asset servisi ve yanlış yolların 404 kalması için dört kontrol, güvenli DB-500 testine Production varyantı eklendi. Güncel toplam 47 backend testi. Frontend toplamı 33. Production paketinde aynı-origin serving ayrıca gerçek publish/browser ve ayrı QA PostgreSQL ile manuel doğrulandı; canlı DB doğrulaması değildir.
