# HALQA — Study Circles Platform

Born from real tutoring at Tanta: mentors publish circles, students book seats, streaks grow. JWT student/mentor roles + in-browser JS runner for live sessions.

## Run

```bash
npm install
npm start   # http://localhost:4200
```

- Register (role defaults to student) → login → book a seat
- `POST /api/circles` with a mentor token → publish your own circle
- `GET /api/me/streak` → sessions booked

Demo flow: register `salma@test.com` → login → book "Backend Zero → JWT" → watch the streak counter light up.
