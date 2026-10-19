# Abmiti Flutter app

Flutter client for Abmiti's existing REST API. Authentication, summaries, transactions, categories, budgets, notifications, profile data, subscriptions, and checkout all use the backend contracts; no finance records or business rules are stored in a separate mobile data layer.

## API configuration

The app reads its API root from the compile-time `API_BASE_URL` value. It defaults to the production API URL used by the web client. Override it for local development:

```sh
# Android emulator reaching a development API on the host
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:5000/api/v1

# iOS simulator
flutter run --dart-define=API_BASE_URL=http://localhost:5000/api/v1
```

The URL must point to the API prefix (normally `/api/v1`), not the website. The server must allow the app's requests through its CORS policy when running as Flutter Web.

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
