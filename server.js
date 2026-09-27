/** HALQA — study circles: mentors publish, students book, streaks grow. */
const express = require('express');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const app = express();
app.use(express.json());

const SECRET = process.env.JWT_SECRET || 'halqa-dev-secret';
const users = [];   // { id, name, email, hash, role: student|mentor }
const circles = [   // seeded demo circles
  { id: 'c1', title: 'Backend Zero → JWT', mentor: 'Mohamed F.', topic: 'Express middleware & auth', seats: 25, booked: 18, day: 'Sun 18:00' },
  { id: 'c2', title: 'SQL Joins Gym', mentor: 'Mohamed F.', topic: 'Joins, subqueries, 3NF drills', seats: 20, booked: 20, day: 'Wed 19:00' },
  { id: 'c3', title: 'Recursion Without Tears', mentor: 'Salma R.', topic: 'Stacks, trees, traces', seats: 30, booked: 11, day: 'Fri 17:00' },
];
const bookings = []; // { userId, circleId, at }

const auth = (req, res, next) => {
  const t = (req.headers.authorization || '').replace('Bearer ', '');
  if (!t) return res.status(401).json({ code: 401, message: 'Login required' });
  try { req.user = jwt.verify(t, SECRET); next(); }
  catch { return res.status(401).json({ code: 401, message: 'Bad token' }); }
};

app.post('/api/register', async (req, res) => {
  const { name, email, password, role = 'student' } = req.body || {};
  if (!name || !email || !password) return res.status(422).json({ code: 422, message: 'name, email, password required' });
  if (users.find((u) => u.email === email)) return res.status(409).json({ code: 409, message: 'Email taken' });
  const u = { id: 'u' + Date.now(), name, email, hash: await bcrypt.hash(password, 10), role };
  users.push(u);
  res.status(201).json({ token: jwt.sign({ sub: u.id, role }, SECRET, { expiresIn: '7d' }), role });
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body || {};
  const u = users.find((x) => x.email === email);
  if (!u || !(await bcrypt.compare(password || '', u.hash)))
    return res.status(401).json({ code: 401, message: 'Invalid credentials' });
  res.json({ token: jwt.sign({ sub: u.id, role: u.role }, SECRET, { expiresIn: '7d' }), role: u.role, name: u.name });
});

app.get('/api/circles', (req, res) => res.json(circles));

app.post('/api/circles', auth, (req, res) => {
  if (req.user.role !== 'mentor') return res.status(403).json({ code: 403, message: 'Mentors only' });
  const { title, topic, seats = 20, day } = req.body || {};
  if (!title || !day) return res.status(422).json({ code: 422, message: 'title and day required' });
  const c = { id: 'c' + Date.now(), title, mentor: 'You', topic: topic || '', seats, booked: 0, day };
  circles.push(c); res.status(201).json(c);
});

app.post('/api/book/:id', auth, (req, res) => {
  const c = circles.find((x) => x.id === req.params.id);
  if (!c) return res.status(404).json({ code: 404, message: 'Circle gone' });
  if (c.booked >= c.seats) return res.status(409).json({ code: 409, message: 'Circle is full' });
  if (bookings.find((b) => b.userId === req.user.sub && b.circleId === c.id))
    return res.status(409).json({ code: 409, message: 'Already booked' });
  c.booked++; bookings.push({ userId: req.user.sub, circleId: c.id, at: new Date() });
  const mine = bookings.filter((b) => b.userId === req.user.sub).length;
  res.json({ ok: true, streak: mine, circle: c });
});

app.get('/api/me/streak', auth, (req, res) => {
  res.json({ sessions: bookings.filter((b) => b.userId === req.user.sub).length });
});

app.use(express.static(path.join(__dirname, 'public')));
const PORT = process.env.PORT || 4200;
app.listen(PORT, () => console.log(`[halqa] http://localhost:${PORT}`));
