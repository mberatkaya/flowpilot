# Test yapısı

- `FlowPilot.Api.Tests/`: xUnit ve `WebApplicationFactory<Program>` ile backend testleri. İlk smoke testi, veritabanı ayarı olmadan host'un açıldığını ve henüz route bulunmadığını doğrular.
- `../client/src/**/*.test.tsx`: Vitest, React Testing Library ve jsdom ile frontend testleri. Testler bileşenlerin yanında tutulur; ortak kurulum `client/src/test/setup.ts` içindedir. Ayrı bir npm workspace gerekmez.

Çalıştırma komutları ana README'dedir. İş kuralları, form validasyonu ve veritabanı entegrasyonu testleri ilgili özellikler geliştirildiğinde eklenecek.
