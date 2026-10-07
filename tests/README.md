# Test yapısı

Güncel komutlar ana README'nin [Tests](../README.md#tests) bölümündedir.

- Backend: xUnit v3/Microsoft Testing Platform, WebApplicationFactory ve Testcontainers ile **47 test**. Gerçek PostgreSQL 16.14'e migration uygulanır; kayıtlar ve geçersiz insert sayıları bağımsız SQL bağlantılarıyla doğrulanır. Güvenli 500, overposting ve Production static hosting/404 davranışı kapsanır.
- Frontend: Vitest/React Testing Library/jsdom ile **33 test**. Label/anchor, validation, pending/double-submit, yalnız 201 sonrası success, güvenli 400, 500/network değer koruma/retry ve focus kontrol edilir. Fetch mock'ları gerçek E2E değildir.

Docker engine açık olmalıdır; test DB'si geliştirme veritabanından ayrı/geçicidir ve fixture sonunda temizlenir. Fake/in-memory fallback yoktur. Production hata testleri geçici Testcontainers DB'lerini kullanır; canlı bir sistemi bozmaz.

GitHub Actions aynı testleri Release build ile Ubuntu'da çalıştırıp production paketini üretir. Gerçek publish/browser ve bağımsız QA SQL kontrolleri AI_LOG'da ayrıca kaydedilir; canlı production kanıtı olarak sunulmaz. Tarihsel test sayıları ilgili sprint kayıtlarında kalır.
