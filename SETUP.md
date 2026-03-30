# Croatia Bike Camp Tracker – Instrukcja uruchomienia

## 1. Supabase – konfiguracja projektu

1. Wejdź na [supabase.com](https://supabase.com) i utwórz nowy projekt
2. Przejdź do **SQL Editor** i wklej zawartość pliku `supabase/schema.sql`
3. Kliknij **Run** – tabela `photos` i bucket `bike-photos` zostaną utworzone
4. Przejdź do **Project Settings → API** i skopiuj:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 2. Zmienne środowiskowe

Edytuj plik `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

## 3. Uruchomienie lokalne

```bash
npm install
npm run dev
```

Otwórz http://localhost:3000

## 4. Wdrożenie (Vercel – zalecane)

```bash
npm i -g vercel
vercel --prod
```

Ustaw zmienne środowiskowe w panelu Vercel (Settings → Environment Variables).

## Jak używać

1. **Wgraj GPX** – przeciągnij lub kliknij pole "Wgraj plik GPX" w lewym panelu.
   Eksportuj z Garmin Connect: Aktywność → ⋯ → Eksportuj GPX
   Eksportuj ze Stravy: Aktywność → ⋯ → Eksportuj GPX

2. **Dodaj zdjęcia** – wpisz imię, wybierz zdjęcia z telefonu, kliknij "Wyślij na mapę".
   Aplikacja automatycznie odczyta GPS i czas z EXIF.

3. **Przeglądaj** – pinezki na mapie to zdjęcia. Kliknij pinezkę → otwiera się lightbox.
   Oś czasu (lewy panel) pokazuje wszystkie zdjęcia chronologicznie.

4. **Realtime** – wszyscy 6 kolarzy widzi nowe zdjęcia na żywo bez odświeżania strony!

## Struktura plików

```
src/
├── app/
│   ├── layout.tsx          # Root layout (dark mode)
│   ├── page.tsx            # Główna strona (mapa + sidebar)
│   └── api/photos/         # API endpoint (opcjonalny)
├── components/
│   ├── MapView.tsx         # Mapa Leaflet z trasą i markerami
│   ├── Sidebar.tsx         # Panel boczny
│   ├── GpxUploader.tsx     # Upload i parsowanie GPX
│   ├── PhotoUploader.tsx   # Upload zdjęć z EXIF
│   ├── Timeline.tsx        # Chronologiczna lista zdjęć
│   ├── Lightbox.tsx        # Modal ze zdjęciem
│   └── PhotosLoader.tsx    # Ładowanie i realtime sync
├── lib/
│   ├── supabase.ts         # Klient Supabase
│   ├── gpxParser.ts        # Parser GPX + dopasowanie do trasy
│   └── exifReader.ts       # Czytanie metadanych EXIF
└── store/
    └── useStore.ts         # Stan globalny (Zustand)
```
