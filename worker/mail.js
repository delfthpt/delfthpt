// Mail for delfthpt.com, as one Cloudflare Worker with two jobs:
//
//   email()  forwards every message sent to info@delfthpt.com to the lab members in RECIPIENTS.
//            Cloudflare Email Routing can forward an address to one mailbox only, so the copies
//            for several people are made here.
//   fetch()  receives the contact form of the website (the Contact page) and emails it to the same
//            people, or to the one person the visitor chose under "To", with the visitor's address
//            as reply-to. Nothing is stored.
//
// Settings in the Cloudflare dashboard (Workers & Pages > delfthpt-mail > Settings):
//   Variables   RECIPIENTS       mailboxes that receive the mail, separated by commas. Each one must be
//                                a verified destination address under Email Routing. An entry is an
//                                address, or a name with the address in angle brackets, for example
//                                Ada Lovelace <ada@example.org>. A name lets visitors write to that
//                                person alone; it must be spelled as in the "To" list of the form.
//               FROM_ADDRESS     optional sender of form messages (default website@delfthpt.com)
//               ALLOWED_ORIGINS  optional sites that may post the form (default https://delfthpt.com)
//   Bindings    Send Email, variable name MAIL
//
// No mailbox is written in this file on purpose: the repository is public.

import { EmailMessage } from 'cloudflare:email';

const SITE = 'https://delfthpt.com';
const DEFAULT_FROM = 'website@delfthpt.com';
const FROM_NAME = 'Delft High PT Lab website';
const TOPICS = ['General question', 'Collaboration', 'Student project or position', 'Media', 'Other'];
const LIMITS = { name: 100, email: 200, message: 5000, minMessage: 10, body: 20000, minFillMs: 3000 };

// Best-effort brake on floods. Counters live in memory, so they reset when Cloudflare restarts the Worker.
const PER_IP = { max: 5, windowMs: 60 * 60 * 1000 };
const GLOBAL = { max: 60, windowMs: 60 * 60 * 1000 };
const hits = new Map();
let globalHits = [];

const list = (value, fallback = '') => String(value || fallback).split(/[,;\s]+/).map((s) => s.trim()).filter(Boolean);
const oneLine = (value, max) => String(value ?? '').replace(/[\u0000-\u001f\u007f]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
const manyLines = (value, max) => String(value ?? '').replace(/\r\n?/g, '\n').replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, '').trim().slice(0, max);
const isEmail = (s) => /^[^\s@<>()\[\]\\,;:"]+@[^\s@<>()\[\]\\,;:"]+\.[^\s@<>()\[\]\\,;:".]{2,}$/.test(s);
// A person's name as the form sends it: letters, spaces, dots, hyphens and apostrophes only.
const isName = (s) => /^[\p{L}][\p{L} .'’-]{1,59}$/u.test(s);
const same = (a, b) => a.trim().replace(/\s+/g, ' ').toLowerCase() === b.trim().replace(/\s+/g, ' ').toLowerCase();

// The mailboxes in RECIPIENTS, each with the name given to it (or none).
export function people(env) {
  const out = [];
  for (const entry of String((env && env.RECIPIENTS) || '').split(/[,;\n]+/)) {
    const named = entry.match(/^\s*"?([^"<>]*?)"?\s*<\s*([^<>\s]+)\s*>\s*$/);
    if (named) out.push({ name: oneLine(named[1], 100), address: named[2] });
    else for (const address of entry.split(/\s+/).filter(Boolean)) out.push({ name: '', address });
  }
  return out;
}
const recipients = (env) => people(env).map((p) => p.address);

function allowedOrigin(request, env) {
  const origin = request.headers.get('Origin') || '';
  return list(env.ALLOWED_ORIGINS, SITE).includes(origin) ? origin : '';
}

function reply(status, body, origin) {
  const headers = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', Vary: 'Origin' };
  if (origin) headers['Access-Control-Allow-Origin'] = origin;
  return new Response(JSON.stringify(body), { status, headers });
}

function tooMany(ip, now) {
  globalHits = globalHits.filter((t) => now - t < GLOBAL.windowMs);
  const mine = (hits.get(ip) || []).filter((t) => now - t < PER_IP.windowMs);
  if (mine.length >= PER_IP.max || globalHits.length >= GLOBAL.max) { hits.set(ip, mine); return true; }
  mine.push(now); hits.set(ip, mine); globalHits.push(now);
  if (hits.size > 2000) for (const [k, v] of hits) if (!v.some((t) => now - t < PER_IP.windowMs)) hits.delete(k);
  return false;
}

// Checks one submission. Returns { error } for the visitor, { spam: true } for a bot, or { mail }.
export function readForm(data, now = Date.now()) {
  if (!data || typeof data !== 'object') return { error: 'The form could not be read. Please try again.' };
  if (oneLine(data.website, 200)) return { spam: true };                       // hidden field that people never fill in
  const elapsed = Number(data.elapsed);
  if (!Number.isFinite(elapsed) || elapsed < LIMITS.minFillMs) return { spam: true }; // filled in faster than a person can type
  const name = oneLine(data.name, LIMITS.name);
  const email = oneLine(data.email, LIMITS.email);
  const topic = TOPICS.includes(data.topic) ? data.topic : TOPICS[0];
  const message = manyLines(data.message, LIMITS.message);
  const wanted = typeof data.to === 'string' ? oneLine(data.to, 100) : '';
  const to = isName(wanted) ? wanted : '';                                    // the person chosen under "To", if any
  if (!name) return { error: 'Please enter your name.' };
  if (!isEmail(email)) return { error: 'Please enter a valid email address, so that we can answer you.' };
  if (message.length < LIMITS.minMessage) return { error: 'Please write a message of at least a few words.' };
  const text = [
    `New message from the contact form on ${SITE.replace('https://', '')}`,
    '',
    `Name:   ${name}`,
    `Email:  ${email}`,
    `Topic:  ${topic}`,
    `For:    ${to || 'the whole lab team'}`,
    '',
    message,
    '',
    '-- ',
    `Reply to this email to answer ${name} directly.`,
    `Sent through ${SITE}/contact on ${new Date(now).toUTCString()}.`,
  ].join('\n');
  return { mail: { name, email, to, subject: `Website contact${to ? ` for ${to}` : ''}: ${topic} (${name})`, text } };
}

/* ---------- sending ---------- */

const b64 = (s) => { const bytes = new TextEncoder().encode(s); let bin = ''; for (const b of bytes) bin += String.fromCharCode(b); return btoa(bin); };
// RFC 2047 encoded words, split so that no header line gets too long and no character is cut in two.
// Plain text passes unchanged where the header allows it: any printable ASCII in a subject, and only
// letters, digits, spaces, hyphens and apostrophes in a display name.
function encodeWord(s, plain = /^[\x20-\x7e]*$/) {
  if (plain.test(s)) return s;
  const words = []; let chunk = '';
  for (const ch of s) {
    if (new TextEncoder().encode(chunk + ch).length > 39) { words.push(chunk); chunk = ''; }
    chunk += ch;
  }
  if (chunk) words.push(chunk);
  return words.map((w) => `=?UTF-8?B?${b64(w)}?=`).join('\r\n ');
}
const mailbox = (name, address) => {
  const shown = encodeWord(name, /^[A-Za-z0-9 '-]*$/);
  return shown.split('\r\n ').pop().length + address.length > 60 ? `${shown}\r\n <${address}>` : `${shown} <${address}>`;
};

export function rawMessage({ from, fromName, to, replyTo, replyName, subject, text, id, date }) {
  const body = b64(text.replace(/\n/g, '\r\n')).replace(/(.{76})/g, '$1\r\n');
  return [
    `From: ${mailbox(fromName, from)}`,
    `To: ${to.join(', ')}`,
    `Reply-To: ${mailbox(replyName, replyTo)}`,
    `Subject: ${encodeWord(subject)}`,
    `Date: ${date}`,
    `Message-ID: <${id}@${from.split('@')[1]}>`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    'Auto-Submitted: auto-generated',
    'X-Auto-Response-Suppress: All',
    '',
    body,
    '',
  ].join('\r\n');
}

// Two ways to hand a message to Cloudflare: the structured send of Cloudflare Email Service, and the
// older raw-message form, which is what a domain with only Email Routing accepts.
const structured = (env, to, mail, from) => env.MAIL.send({
  to, from: { email: from, name: FROM_NAME }, replyTo: { email: mail.email, name: mail.name },
  subject: mail.subject, text: mail.text, headers: { 'X-Auto-Response-Suppress': 'All' },
});
const legacy = (env, one, mail, from) => env.MAIL.send(new EmailMessage(from, one, rawMessage({
  from, fromName: FROM_NAME, to: [one], replyTo: mail.email, replyName: mail.name,
  subject: mail.subject, text: mail.text, id: crypto.randomUUID(), date: new Date().toUTCString(),
})));
const why = (err) => (err && (err.code || err.message)) || String(err);

// A message for one person goes to that person alone, when RECIPIENTS knows a mailbox under that name.
// Otherwise, and when that mailbox refuses the message (for example because it has not been verified
// yet), the message goes to the whole team, and its "For:" line says who it is meant for.
//
// For the team: one message to everybody, so that the team sees who else received it. If that is
// refused, every mailbox gets its own copy instead, and the ones that can be reached still receive it.
// Returns how many copies went out and whether they went to the 'person' or to the 'team'.
async function deliver(env, mail) {
  const all = people(env);
  const to = all.map((p) => p.address);
  const from = oneLine(env.FROM_ADDRESS, 200) || DEFAULT_FROM;
  if (!to.length) throw new Error('RECIPIENTS is empty');
  const one = async (address) => { try { await structured(env, [address], mail, from); } catch (err) { await legacy(env, address, mail, from); } };

  const person = mail.to ? all.find((p) => p.name && same(p.name, mail.to)) : null;
  if (person) {
    try { await one(person.address); return { count: 1, to: 'person' }; } catch (err) { console.log('send to the chosen person failed:', why(err)); }
  }
  if (to.length > 1) {
    try { await structured(env, to, mail, from); return { count: to.length, to: 'team' }; } catch (err) { console.log('send to all failed:', why(err)); }
  }
  const results = await Promise.allSettled(to.map(one));
  results.forEach((r, i) => { if (r.status === 'rejected') console.log(`send to recipient ${i + 1} failed:`, why(r.reason)); });
  return { count: results.filter((r) => r.status === 'fulfilled').length, to: 'team' };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = allowedOrigin(request, env);
    if (url.pathname !== '/contact') return reply(404, { ok: false, error: 'Not found.' }, origin);
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: origin ? 204 : 403, headers: origin ? {
        'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '86400', Vary: 'Origin' } : {} });
    }
    if (request.method !== 'POST') return reply(405, { ok: false, error: 'Use the form on the website.' }, origin);
    if (!origin) return reply(403, { ok: false, error: 'Please use the form on the website.' }, origin);
    if (!(request.headers.get('Content-Type') || '').toLowerCase().startsWith('application/json')) return reply(415, { ok: false, error: 'Unsupported format.' }, origin);

    let data;
    try {
      if (Number(request.headers.get('Content-Length')) > LIMITS.body) return reply(413, { ok: false, error: 'The message is too long.' }, origin);
      const body = await request.text();
      if (body.length > LIMITS.body) return reply(413, { ok: false, error: 'The message is too long.' }, origin);
      data = JSON.parse(body);
    } catch (err) { return reply(400, { ok: false, error: 'The form could not be read. Please try again.' }, origin); }

    const form = readForm(data);
    if (form.spam) return reply(200, { ok: true }, origin);            // bots get no hint that they were recognised
    if (form.error) return reply(400, { ok: false, error: form.error }, origin);
    if (tooMany(request.headers.get('CF-Connecting-IP') || 'unknown', Date.now())) return reply(429, { ok: false, error: 'Too many messages in a short time. Please try again later.' }, origin);

    try {
      const sent = await deliver(env, form.mail);
      if (sent.count > 0) return reply(200, { ok: true, to: sent.to }, origin);
    } catch (err) { console.log('contact form failed:', why(err)); }
    return reply(502, { ok: false, error: 'The message could not be sent. Please try again later.' }, origin);
  },

  async email(message, env) {
    const to = recipients(env);
    if (!to.length) { message.setReject('This address is not in use yet.'); return; }
    const results = await Promise.allSettled(to.map((one) => message.forward(one)));
    results.forEach((r, i) => { if (r.status === 'rejected') console.log(`forward to recipient ${i + 1} failed:`, why(r.reason)); });
    if (results.every((r) => r.status === 'rejected')) message.setReject('The message could not be delivered. Please try again later.');
  },
};
