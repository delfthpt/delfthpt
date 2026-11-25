/* Delft High PT Lab: sends the contact form to the mail Worker (worker/mail.js), which emails it to the lab team.
   No dependencies. The checks below repeat the ones in the Worker, so that visitors get an answer straight away. */
(() => {
  'use strict';
  const form = document.getElementById('contact-form');
  if (!form || !window.fetch) return;

  const done = document.getElementById('contact-done');
  const status = form.querySelector('.form-status');
  const button = form.querySelector('button[type=submit]');
  const field = (id) => document.getElementById(id);
  const fields = { name: field('cf-name'), email: field('cf-email'), topic: field('cf-topic'), message: field('cf-message'), extra: field('cf-extra') };
  const opened = Date.now();
  const address = form.dataset.email;
  const isEmail = (s) => /^[^\s@<>()\[\]\\,;:"]+@[^\s@<>()\[\]\\,;:"]+\.[^\s@<>()\[\]\\,;:".]{2,}$/.test(s);

  // Shows a line under the button. With `withAddress`, the general address of the lab follows as a link.
  function say(text, kind, withAddress) {
    status.textContent = text;
    status.className = `form-status ${kind || ''}`;
    if (withAddress && address) {
      const a = document.createElement('a');
      a.href = `mailto:${address}`;
      a.textContent = address;
      status.append(' You can also write to ', a, '.');
    }
  }

  function check() {
    for (const el of Object.values(fields)) el.removeAttribute('aria-invalid');
    const problems = [
      [fields.name, !fields.name.value.trim(), 'Please enter your name.'],
      [fields.email, !isEmail(fields.email.value.trim()), 'Please enter a valid email address, so that we can answer you.'],
      [fields.message, fields.message.value.trim().length < 10, 'Please write a message of at least a few words.'],
    ];
    const first = problems.find((p) => p[1]);
    if (!first) return true;
    first[0].setAttribute('aria-invalid', 'true');
    first[0].focus();
    say(first[2], 'error');
    return false;
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (button.disabled || !check()) return;

    button.disabled = true;
    say('Sending your message…');
    const stop = new AbortController();
    const timer = setTimeout(() => stop.abort(), 20000);
    try {
      const res = await fetch(form.action, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: stop.signal,
        body: JSON.stringify({
          name: fields.name.value.trim(),
          email: fields.email.value.trim(),
          topic: fields.topic.value,
          message: fields.message.value.trim(),
          website: fields.extra.value,          // stays empty when a person fills in the form
          elapsed: Date.now() - opened,
        }),
      });
      const answer = await res.json().catch(() => ({}));
      if (res.ok && answer.ok) {
        form.hidden = true;
        done.hidden = false;
        done.focus({ preventScroll: true });
        done.scrollIntoView({ block: 'center' });   // the form was tall: bring the note back into view
        return;
      }
      // The Worker explains what is wrong with a message (400) or asks to wait (429). Anything else is a fault on our side.
      if ((res.status === 400 || res.status === 429) && answer.error) say(answer.error, 'error');
      else say('The message could not be sent. Please try again in a moment.', 'error', true);
    } catch (err) {
      say('The message could not be sent. Please check your connection and try again.', 'error', true);
    } finally {
      clearTimeout(timer);
      button.disabled = false;
    }
  });
})();
