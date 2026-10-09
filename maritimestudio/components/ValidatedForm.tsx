'use client';

import { useRef, useState, type FormEvent, type ReactNode } from 'react';
import { CONTACT_EMAIL } from '@/lib/site';

// Lead form shell: validates the fields inside it, then either POSTs to
// `endpoint` (Formspree, Basin, your API…) or, with no endpoint configured,
// opens the visitor's email app with the message ready to send.

type Props = {
  className?: string;
  subject: string;
  success: string;
  endpoint?: string;
  children: ReactNode;
  footer?: ReactNode;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
type Control = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

function check(field: HTMLElement): boolean {
  const input = field.querySelector<Control>('input, select, textarea');
  if (!input) return true;
  const v = (input.value || '').trim();
  let msg = '';
  if (input.required && !v) msg = 'This field is required.';
  else if (input.type === 'email' && v && !EMAIL_RE.test(v)) msg = 'Please enter a valid email address.';
  field.classList.toggle('is-invalid', !!msg);
  input.setAttribute('aria-invalid', msg ? 'true' : 'false');
  const err = field.querySelector('.field-error');
  if (err) err.textContent = msg;
  return !msg;
}

function mailto(form: HTMLFormElement, subject: string) {
  const lines: string[] = [];
  new FormData(form).forEach((v, k) => {
    const control = form.querySelector<Control>(`[name="${k}"]`);
    const label = control?.id ? form.querySelector(`label[for="${control.id}"]`)?.textContent?.replace(/\s*\*$/, '') : k;
    lines.push(`${label ?? k}: ${v}`);
  });
  window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join('\n'))}`;
}

export function ValidatedForm({ className = '', subject, success, endpoint, children, footer }: Props) {
  const ref = useRef<HTMLFormElement>(null);
  const statusRef = useRef<HTMLParagraphElement>(null);
  const [status, setStatus] = useState('');
  const [sending, setSending] = useState(false);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fields = Array.from(form.querySelectorAll<HTMLElement>('.field'));
    const bad = fields.filter((f) => !check(f));
    if (bad.length) {
      bad[0].querySelector<Control>('input, select, textarea')?.focus();
      return;
    }
    setSending(true);
    let text = success;
    if (endpoint) {
      try {
        const res = await fetch(endpoint, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } });
        if (!res.ok) throw new Error(String(res.status));
        form.reset();
      } catch {
        mailto(form, subject);
        text = 'We could not send the form automatically, so your email app has been opened with the message ready to send.';
      }
    } else {
      mailto(form, subject);
      text = `Your email app has opened with the message ready to send to ${CONTACT_EMAIL}.`;
    }
    setSending(false);
    setStatus(text);
    requestAnimationFrame(() => statusRef.current?.focus());
  };

  return (
    <form
      ref={ref}
      className={`form ${className}`}
      noValidate
      aria-busy={sending}
      onSubmit={onSubmit}
      onInput={(e) => {
        const field = (e.target as HTMLElement).closest<HTMLElement>('.field');
        if (field?.classList.contains('is-invalid')) check(field);
      }}
      onBlur={(e) => {
        const field = (e.target as HTMLElement).closest<HTMLElement>('.field');
        if (field?.classList.contains('is-invalid')) check(field);
      }}
      data-reveal
    >
      {children}
      <p ref={statusRef} className={`form-status${status ? ' is-visible' : ''}`} role="status" tabIndex={-1}>
        {status}
      </p>
      {footer}
    </form>
  );
}
