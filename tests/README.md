# Test yapısı

- `FlowPilot.Api.Tests/`: xUnit ve `WebApplicationFactory<Program>` ile backend testleri. Sprint 2'de Testcontainers gerçek, geçici PostgreSQL başlatıp migration'ı uygular. Testler `201` yanıtının yanında bağımsız SQL bağlantısıyla kayıtları, sunucu timestamp'ını, veritabanı hatasında `500` yanıtını ve eksik configuration için başlangıç hatasını doğrular.
- `../client/src/**/*.test.tsx`: Vitest, React Testing Library ve jsdom ile frontend testleri. Testler bileşenlerin yanında tutulur; ortak kurulum `client/src/test/setup.ts` içindedir. Ayrı bir npm workspace gerekmez.

Çalıştırma komutları ana README'nin Sprint 2 bölümündedir. Backend entegrasyon testleri için Docker engine açık olmalıdır; fake/in-memory fallback yoktur. Test container'ı geliştirme veritabanından ayrıdır ve fixture sonunda temizlenir. Detaylı iş kuralı ve validasyon testleri Sprint 3'e bırakılmıştır.
