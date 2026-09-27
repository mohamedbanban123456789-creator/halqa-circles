let token = localStorage.getItem('halqa-tok');
const msg = (t) => document.getElementById('msg').textContent = t;
async function load() {
  const r = await fetch('/api/circles'); const list = await r.json();
  document.getElementById('list').innerHTML = list.map((c) => `
    <div class="card ${c.booked >= c.seats ? 'full' : ''}">
      <div><h3>${c.title}</h3>
      <p class="meta">${c.mentor} · ${c.topic} · ${c.day} · ${c.booked}/${c.seats} seats</p></div>
      <button data-book="${c.id}" ${c.booked >= c.seats ? 'disabled' : ''}>${c.booked >= c.seats ? 'Full' : 'Book seat'}</button>
    </div>`).join('');
  if (token) {
    const s = await fetch('/api/me/streak', { headers: { Authorization: 'Bearer ' + token } });
    if (s.ok) document.getElementById('streak').textContent = '🔥 ' + (await s.json()).sessions + ' sessions booked';
  }
}
async function auth(path) {
  const body = { name: document.getElementById('name').value, email: document.getElementById('email').value, password: document.getElementById('pass').value };
  const r = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const j = await r.json();
  if (!r.ok) return msg(j.message);
  token = j.token; localStorage.setItem('halqa-tok', token);
  msg('Welcome' + (j.name ? ', ' + j.name : '') + ' (' + j.role + '). Now book a seat ↓'); load();
}
document.getElementById('reg').onclick = () => auth('/api/register');
document.getElementById('login').onclick = () => auth('/api/login');
document.getElementById('list').onclick = async (e) => {
  const id = e.target.dataset.book; if (!id) return;
  if (!token) return msg('Login first — booking needs an account.');
  const r = await fetch('/api/book/' + id, { method: 'POST', headers: { Authorization: 'Bearer ' + token } });
  const j = await r.json();
  msg(r.ok ? `Seat locked in "${j.circle.title}" — streak: ${j.streak} sessions.` : j.message);
  load();
};
document.getElementById('run').onclick = () => {
  try { document.getElementById('out').textContent = '= ' + JSON.stringify(eval(document.getElementById('code').value)); }
  catch (e) { document.getElementById('out').textContent = '! ' + e.message; }
};
load();
