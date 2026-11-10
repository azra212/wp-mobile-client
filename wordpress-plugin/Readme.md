# WP Mobile Client plugin

WordPress plugin that signs in the mobile app. Routes live under `/wp-json/bgh/v1`. The app is in [`apps/mobile`](../apps/mobile) of [azra212/wp-mobile-client](https://github.com/azra212/wp-mobile-client).

## Install

1. Copy this directory to `wp-content/plugins/wp-mobile-client`.
2. Activate **WP Mobile Client**.
3. In `wp-config.php`, above the "stop editing" line, set a long random secret:

```php
define( 'WP_MOBILE_CLIENT_JWT_SECRET', 'replace-with-at-least-32-random-characters' );
```

`JWT_AUTH_SECRET_KEY` is still read if the new constant is absent.

The plugin does not start signing tokens until one of those constants is a non-empty string. A missing secret returns HTTP 500 with code `jwt_not_configured` and does not take the site down.

## Routes

| Method | Path | Who |
| --- | --- | --- |
| `GET` | `/bgh/v1/health` | Public |
| `POST` | `/bgh/v1/login` | Public, throttled |
| `POST` | `/bgh/v1/refresh` | Holder of a refresh token |
| `GET` | `/bgh/v1/me` | Holder of an access token |

Login body: `{ "username": "...", "password": "..." }`.

Success:

```json
{
  "token": "<access>",
  "refresh_token": "<refresh>",
  "expires_in": 900,
  "user": { "id": 1, "username": "ada", "email": "ada@example.com", "roles": ["subscriber"] }
}
```

Access tokens expire after 15 minutes. Refresh tokens expire after 30 days. Send `Authorization: Bearer <access>` to `/me`. Exchange `{ "refresh_token": "<refresh>" }` at `/refresh`.

Failed logins are counted per IP and username: 5 failures, then HTTP 429 for 15 minutes. A successful login clears that bucket.

## Errors

Every failure is a normal WordPress REST error:

```json
{
  "code": "invalid_credentials",
  "message": "Invalid credentials.",
  "data": { "status": 401 }
}
```

`invalid_credentials` is the only login failure. The message does not say whether the username exists.

## Checks

From this directory:

```bash
composer install
composer phpcs
```
