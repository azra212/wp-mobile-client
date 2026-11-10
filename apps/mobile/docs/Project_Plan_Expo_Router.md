# React Native + WordPress Mobile App – Project Plan

Target website: **balkangamehub.com**  
Approach: **Custom WordPress Plugin as a Mobile API Layer**

---

## 1. Project Goal

Build a beginner‑friendly but professional **React Native mobile app** that connects to an existing WordPress website.

The app will:

- Authenticate users securely (JWT)
- Read posts (and later CPTs)
- Allow authenticated users to create and edit their own content
- Use a **clean, limited API surface** instead of exposing raw WordPress REST endpoints

This project is designed to:

- Be realistic and production‑oriented
- Demonstrate senior‑level architectural thinking
- Be approachable as a first serious React Native project

---

## 2. High‑Level Architecture

### Mobile App (Frontend)

- React Native (Expo)
- **Expo Router** (file‑based routing)
- **Tab‑based navigation** for core areas
- Stack navigation for deep screens
- Secure token storage (Expo SecureStore)

### Backend (WordPress)

- Custom plugin: _Wp Mobile CLient Plugin_
- Custom REST endpoints only
- **JWT‑based authentication**
- Capability‑based permissions
- Input validation and sanitization

---

## 3. Mobile App – Navigation Strategy

### Routing System

- Expo Router (`app/` directory)
- File‑based routing

### Navigation Flow

**Root**

- Decides auth state

**Auth Stack**

- Login

**App Tabs**

- Home (posts feed)
- Profile
- Debug (dev‑only)

Each tab can contain its own stack for:

- Post detail
- Create / edit post etc

---

## 4. Mobile App – Features (MVP)

### Version 1.0.0

- Login (JWT)
- Persistent authentication
- List posts (feed)
- View post details
- View own profile

### Version 1.1.0

- User registration (Contributor role)
- Profile completion (name, bio)
- Read-only publishing guidelines

### Version 2.0.0

- Create post (draft)
- Edit own posts
- Delete own posts
- Submit for review
- Profile editing
- Pagination
- Pull‑to‑refresh
- Media upload

### Version 2.1.0

- Push notification: post approved
- Push notification: post rejected (with reason)
- Push notification: new comment on post
- Post status indicator (draft / under review / published)

---

## 5. WordPress Plugin – Responsibilities

The plugin must:

- Expose **only required endpoints**
- Validate and sanitize all input
- Enforce roles and capabilities
- Rate‑limit login attempts
- Return consistent JSON responses
- Avoid leaking WordPress internals

---

## 6. API Design

**Namespace**

```
/wp-json/bgh/v1
```

### Endpoints v1.0.0

- `GET /health` – public connectivity test
- `POST /login` – JWT login
- `GET /me` – authenticated user profile
- `GET /posts` – list posts
- `GET /posts/{id}` – post detail

## Endpoints v1.1.0

- `POST /register` – register new user
- `PUT /me` – allow users to complete or update their profile
- `GET /guidelines` - expose read-only publishing guidelines inside the app

## Endpoints v2.0.0

`POST /posts` – create draft

`PUT /posts/{id}` – edit own draft

`DELETE /posts/{id}` – delete own draft

`GET /my-posts` – list own posts (all statuses)

---

## 7. WordPress Plugin Structure

```
wp-mobile-client/
├── wp-mobile-client.php
├── includes/
│   ├── routes.php
│   ├── auth.php
│   ├── posts.php
│   ├── security.php
│   └── sanitize.php
```

Principles:

- One responsibility per file
- Explicit permission callbacks
- JWT secret stored in `wp-config.php`
- No raw WP REST exposure

---

## 8. Mobile App Folder Structure (Expo Router)

```
app/
├── _layout.tsx
├── index.tsx
├── (auth)/
│   └── login.tsx
├── (app)/
│   ├── _layout.tsx
│   ├── (tabs)/
│   │   ├── home.tsx
│   │   ├── profile.tsx
│   │   └── debug.tsx
│   └── post/
│       └── [id].tsx
components/
lib/
```

Golden rules:

- Screens never fetch directly
- API logic lives in `lib/`
- UI components are reusable

---

## 9. Styling Strategy

Chosen approach:

- Inline styles / StyleSheet
- Small reusable layout components

Focus:

- Readability
- Spacing
- Editorial feel

---

## 10. Security Checklist

### Backend

- JWT expiration
- Capability checks on write actions
- Sanitization of content
- Rate limiting on login

### Mobile

- SecureStore for tokens
- Logout clears all auth data
- Graceful handling of expired tokens

---

## 11. Learning‑Oriented Build Order

1. Health endpoint
2. Login (JWT)
3. Persist auth
4. Posts feed
5. Post detail
6. Profile
7. Create / edit / delete post
8. Media upload
9. Notifications

---

## 12. Success Criteria

The project is successful when:

- The app uses only custom WP endpoints
- Users authenticate securely and persistently
- Code is readable, modular, and scalable
- Architecture reflects professional practices

---

## 13. Future Extensions

- CPT‑specific endpoints
- Offline caching
- Admin moderation flows
- Role‑based UI rendering

---

This document is designed to be reopened at any time and followed step by step.
