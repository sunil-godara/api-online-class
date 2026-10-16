# api-online-class

Server and database for **Online Class Booking (Sanara Wellness)**, a marketplace where practitioners list wellness classes and users book and pay for them.

This is one of three apps:

| App | Role |
| --- | --- |
| `api-online-class` (this repo) | Server, database, login, email, SMS, payments |
| `admin-online-class` | Admin web panel |
| `user-practitioner-online-class` | End-user and practitioner web app |

## Status

The API is an early skeleton. Admin data screens work. The booking and payment path is broken or missing, and several security faults must be fixed before launch. See [Known bugs](#known-bugs) and [Pending work](#pending-work).

## Tech stack

- Node.js, plain JavaScript (CommonJS). No Node version is set in the project; it was checked on Node 22.
- Koa 2, koa-router, koa-bodyparser, @koa/cors
- Sequelize 6 with PostgreSQL (`pg`), migrations and seeds with `sequelize-cli`
- Own login: JWT (jsonwebtoken) and bcryptjs. There is no Firebase.
- SendGrid (email), Twilio (SMS), Stripe (payments)
- ESLint 9, Prettier, Husky

## Setup

1. Install PostgreSQL and create an empty database.
2. Install packages: `npm install` (or `yarn`, because the Git hooks call `yarn`).
3. Create a `.env` file in this folder with the variables in the next section. There is no `.env.example`.
4. Create the tables: `npm run db:migrate`
5. Add starting data: `npm run db:seed`. This creates an admin account with default login details set in the seed. **Change that password at once.**
6. Start the server: `npm start` (or `npm run dev` for auto-restart).

The server listens on port 3002 unless `PORT` is set. If the migration command cannot find the database settings, pass the config path: `npx sequelize-cli db:migrate --config config/config.js`.

The server stops at start-up if the three `TWILIO_*` variables are missing.

## Environment variables

Names only. Never commit values.

| Variable | Used for |
| --- | --- |
| `PORT`, `NODE_ENV` | Server port and mode |
| `JWT_SECRET` | Signs login and reset tokens. Use a long random value. |
| `USER_APP_URL` | Address of the user app, used in password reset links |
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_DIALECT` | PostgreSQL connection (`DB_DIALECT=postgres`) |
| `DB_LOGGING` | Turns SQL logging on or off |
| `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` | SMS |
| `SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL`, `SENDGRID_FROM_NAME` | Email |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Payments and webhook check |
| `COMPANY_NAME`, `APP_NAME`, `BASE_PATH` | Text used in emails |
| `TEST_EMAIL`, `TEST_PHONE` | Only for `test-services.js` |

## Scripts

| Command | What it does |
| --- | --- |
| `npm start` | Runs `node server.js` |
| `npm run dev` | Runs the server with nodemon |
| `npm run db:migrate` | Runs the database migrations |
| `npm run db:seed` | Runs all seeds |
| `npm run lint` | ESLint |
| `npm run format` | Prettier, rewrites files |
| `npm test` | Placeholder. There are no tests yet. |

Git hooks (installed by `npm install` through Husky): before a commit they run lint and format. Commit messages must look like `type: description`, where type is one of `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`. A scope such as `feat(login): x` is rejected.

Do not run `node test-services.js` unless you mean to. It sends a real email and a real SMS.

## How the API works

- Routes are served at the **root, with no `/api` prefix**, for example `POST /login`. The file `routes/index.js` is not used. The documents in this repo that show `/api/...` paths are wrong.
- Send the login token in the `Authorization` header as the raw token, with no `Bearer` word.
- Responses use `{ message, status, data }`.
- Most reads are `POST`. Only list routes use `GET`.
- Roles come from two yes/no columns on the users table (`is_admin`, `is_practitioner`). The role is re-read from the database on every request.
- Access levels used below: **Public** (no token), **Any** (any logged-in user), **User** (end users only), **Prac** (practitioner), **AdmPrac** (admin or practitioner), **Admin**.

## Project structure

```
server.js            Start-up, middleware order, route mounting, request logger
config/config.js     Database settings per environment
routes/              One file per area; maps URLs to controllers
controllers/         All business logic (12 files)
middlewares/         authMiddleware.js (token check), roleMiddleware.js (role checks)
models/              22 Sequelize models (models/index.js loads them)
migrations/          23 migrations (one per table, plus end time on classes)
seeders/             Admin user, 5 modalities, 3 legal placeholders, 8 settings
utils/               jwtHelper, sendEmail, smsService, stripe (+ emailService, helper, unused)
templates/           Email templates: welcome/code, reset password, email verification link (unused)
scripts/             validate-commit-msg.js for the Git hook
test-services.js     Manual email/SMS test (sends real messages)
```

## Endpoints

| Area | Routes |
| --- | --- |
| Sign-up and login (Public) | `POST /register`, `/login`, `/forgot-password`, `/resend-forgot-password`, `/verify-reset-token`, `/reset-password`, `/verify-email`, `/verify-phone`, `/resend-email-verification`, `/resend-phone-verification` |
| Session (Any) | `GET /auth/me`, `GET /auth/logout`, `POST /auth/change-password` |
| Dashboards (stubs) | `GET /admin/dashboard`, `/practitioner/dashboard`, `/user/dashboard`, `/staff/dashboard`. They return only the user id and type. |
| Users (Admin) | `GET /users`, `PUT /users/:userId/role`, `POST /users/status`, `/users/delete`, `/users/detail` |
| Own profile (Any) | `POST /profile/update`, `POST /account/toggle-status`. `GET /profile` is hidden by a stub route. |
| Practitioners | AdmPrac: `GET /practitioners`, `POST /practitioners/profile`, `/practitioners/detail`. Admin: `POST /practitioners/approve`, `/commission`, `/delete`, `/status`. Any: `GET /practitioners/listing`. User: `GET /practitioners/:practitionerId` |
| Studios | AdmPrac: `POST /studio/create`, `/edit`, `/delete`. Admin: `POST /studio/approval`. Any: `GET /studio`, `POST /studio/detail` |
| Studio rooms | AdmPrac: `POST /studio-room/create`, `/edit`, `/delete`. Any: `GET /studio-room`, `POST /studio-room/detail` |
| Classes | AdmPrac: `POST /class/create`, `/class/edit`, `/class/delete`. Admin: `POST /class/approval`. Any: `GET /class`, `/class/listing`, `/class/recommended`, `/class/upcoming`, `/class/modality/:id`, `POST /class/detail` |
| Modalities | Admin: `POST /modality/create`, `/edit`, `/delete`, `/status`. Any: `GET /modality`, `POST /modality/detail` |
| Legal content | Admin: `POST /legal-content/create`, `/edit`, `/delete`, `/detail`, `/status`, `/publish`, `GET /legal-content/list`. Public: `GET /legal-content/public/:slug` |
| Settings | Admin: `POST /setting/create`, `/edit`, `/delete`, `/detail`, `/update-value`, `GET /setting/list`. Public: `GET /setting/public/:slug` |
| Journal (User) | `POST /journal/create`, `/detail`, `/edit`, `/delete`, `GET /journal/list` |
| Booking (User) | `POST /book/class`, `GET /book/my-bookings`, `GET /book/past-bookings` |
| Stripe | `POST /stripe/webhook` (Stripe only) |
| Health | `GET /test` returns plain text |

## Database tables

users, practitioner_profiles, practitioner_modalities, studios, studio_rooms, classes, class_modalities, class_repeats, bookings, payments, payouts, reviews, journals, ai_quiz_results, class_recommendations, coupons, referrals, notifications, admin_actions, modalities, legal_contents, settings.

Tables in use: users, practitioner_profiles, practitioner_modalities, studios, studio_rooms, classes, class_modalities, bookings (partly), payments (partly), journals, modalities, legal_contents, settings. The others exist but no code uses them yet: class_repeats, payouts, reviews, ai_quiz_results, class_recommendations, coupons, referrals, notifications, admin_actions.

All ids are UUIDs. All tables except two link tables use soft delete.

## Integrations

| Service | State |
| --- | --- |
| SendGrid | Sends the password reset and resend-verification emails. Registration sends nothing. Only 3 templates exist. |
| Twilio | Sends the phone code on resend only. Phone formatting is wrong for some US numbers. |
| Stripe | Broken. Checkout cannot start and the webhook fails. No Connect, no refunds. |
| Firebase, OpenAI, Google (Calendar, Places), file storage, push | Not present |

## What works

Sign-up and login (with faults), practitioner profile, studios and rooms, class create/edit/delete, class approval, modalities, legal content, settings, journal, admin user and practitioner management.

## Known bugs

Fix these first. IDs match the Final Audit Report.

| ID | Pri | Bug |
| --- | --- | --- |
| B1 | P0 | Public sign-up accepts the account type "admin" and activates it at once (`controllers/authController.js`). |
| B2 | P0 | Password reset does not check the reset token (`authController.js`). |
| B3 | P0 | Email and phone codes are always 123456. Registration sends no code (`authController.js`). |
| B4 | P0 | Keys are stored in `.env` and in `SENDGRID_TWILIO_SETUP_GUIDE.md`; the seed holds a default admin password. Rotate the keys. |
| B5 | P0 | The request logger in `server.js` prints passwords, codes and tokens. |
| B6 | P0 | Login returns the profile of unverified accounts before checking the password. |
| B7 | P0 | Any practitioner can overwrite another practitioner's profile, commission and Stripe ID (`practitionerController.js`, `classController.js`). |
| B8 | P0 | Emails, phones, commission and Stripe IDs are returned to other users (`practitionerController.js`, `classController.js`). |
| B9 | P0 | Blocked users keep working and can switch themselves back on. |
| B10 | P0 | No rate limits. |
| B14 | P0 | Stripe checkout is built wrongly and its link is never returned (`utils/stripe.js`, `bookClassController.js`). |
| B15 | P0 | Stripe webhook fails with HTTP 500 and its handler is switched off (`server.js`, `stripeController.js`). |
| B16 | P0 | A booking is saved before payment, with no capacity check (`bookClassController.js`). |
| B17 | P1 | Class end time is never saved, so past bookings are always empty (`classController.js`). |
| B18 | P1 | Referral code and Stripe session id are written to columns that do not exist. |
| B19 | P1 | `GET /profile` is hidden behind a stub route (`routes/authRoutes.js`). |
| B20 | P1 | US phone numbers starting 6 to 9 get a +91 prefix (`utils/smsService.js`). |
| B21 | P1 | Practitioner approval is not checked when creating classes. Each studio edit hides its classes. |
| B22 | P1 | `GET /setting/public/:slug` returns any setting. |
| B25 | P1 | No unique rule on user email or phone, no transactions, database TLS checks are off in production, `admin_actions.targetId` is an integer but ids are UUIDs. |

## Pending work

Booking and payment (booking states, Stripe checkout and webhook, cancel and manual refund, receipts), Stripe Connect payouts and commission, notifications and reminders (no scheduler exists), reviews, packages, gift cards, coupons, referrals, AI quiz, repeating classes, search and filters on class lists, analytics data, audit log, time zones and supported locations, file uploads, social login, Google Calendar, tests, CI and deployment files.

Suggested order: security fixes, then the booking and payment path, then the rest.

## Documents in this repo

`JOURNAL_API_DOCUMENTATION.md`, `LEGAL_CONTENT_API_DOCUMENTATION.md`, `SETTINGS_API_DOCUMENTATION.md`, `SETTINGS_TABLE_DOCUMENTATION.md`, `POSTGRESQL_MIGRATION_GUIDE.md`, `SENDGRID_TWILIO_SETUP_GUIDE.md` (kept out of Git on purpose because it holds key values). Treat them with care: the API documents show a wrong `/api` prefix and list filters the code does not support. The SendGrid and Twilio guide claims more than is built and holds key values that must be removed.
