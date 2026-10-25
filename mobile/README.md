# Abmiti Flutter app

Flutter client for Abmiti's existing REST API. Authentication, summaries, transactions, categories, budgets, notifications, profile data, subscriptions, and checkout all use the backend contracts; no finance records or business rules are stored in a separate mobile data layer.

## API configuration & Physical Device Setup

The app dynamically resolves its API base URL via **`AppConfig`**, supporting compile-time flags, saved preferences, and in-app switching:

### Developing with a Physical Device

#### 1. Different Router / Isolated Network (USB cable) — Recommended
If your phone is on a different Wi-Fi router or mobile data while your PC is on Ethernet, connect your phone to the PC via USB with USB debugging enabled, then run:

```sh
# Setup port reverse (forwards phone localhost:5000 -> Ubuntu PC:5000)
./build.sh connect
# Or manually:
adb reverse tcp:5000 tcp:5000

# Run the app:
flutter run --dart-define=API_ENV=different_router
```

#### 2. Same Router / Local Wi-Fi (LAN IP)
If both the phone and Ubuntu PC are connected to the same Wi-Fi router / subnet:

```sh
flutter run --dart-define=API_ENV=same_router --dart-define=LAN_IP=192.168.26.65
```

#### 3. Production Server
```sh
flutter run --dart-define=API_ENV=production
```

#### 4. Custom Tunnel / URL (Cloudflare Tunnel, Localtunnel, Ngrok)
```sh
flutter run --dart-define=API_BASE_URL=https://your-subdomain.trycloudflare.com/api/v1
```

### In-App Runtime Switcher
You don't need to rebuild the app to change environments:
- On the **Login screen**, tap the **API chip** (or the URL at the bottom) to open the **API Environment & Network** modal.
- Once signed in, open the **Navigation Drawer** and tap **API Server**.
- Tap **Test Ping** to test live latency against the backend.
- Tap **Apply URL** to save to secure storage and switch immediately.

## Implemented API flows

- `POST /auth/login`, `POST /auth/register`, `POST /auth/refresh`, `GET /auth/me`, and `PATCH /auth/me`. Access and refresh tokens are kept in platform secure storage. The API client retries expired access tokens and signs out when refresh fails. Admin accounts are denied access to the personal finance screens.
- `GET /summary/monthly`, `GET /summary/categories`, `GET /entries`, `GET /budgets`, `POST /entries`, and `GET /categories` power the overview, activity list, and transaction form.
- `GET /notifications`, `PATCH /notifications/read-all`, and `PATCH /notifications/:id/read` power in-app notifications.
- `GET /subscriptions` shows server-reported plan history. `POST /payments/start` opens the backend-created SSLCommerz checkout URL. A plan is never marked paid by the app; the backend verifies the gateway callback/IPN.

The existing API has no password reset route, mobile-native Google OAuth callback, account deletion route, or notification pagination. Google OAuth still redirects to the web client. The mobile app does not simulate those flows or expose them as native actions. Subscription checkout and reporting require the server's SSLCommerz configuration.

## Structure

```text
lib/
  core/constants/       Brand colors
  features/auth/        Login and registration
  features/home/        Overview, activity, profile and transaction entry
  shared/data/          API client, token refresh and auth repository
  features/webview/     Existing shell retained for reference
```

## Commands

```sh
flutter pub get
dart format lib test
flutter analyze
flutter test
```
