'use client';

import { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { usersApi } from '@/lib/api';

const B = {
  void: '#0B0B0D', bone: '#F3E8D7', carmine: '#9E1C29',
  card: '#151515', input: '#111113', border: '#252528', borderSt: '#333336',
  textSec: '#9A9088', textMut: '#5C5550',
  carnMut: 'rgba(158,28,41,0.15)', carnHov: '#B52232',
  burnt: '#8B3A1A', burntMut: 'rgba(139,58,26,0.15)',
  sage: '#4A8C5C', sageMut: 'rgba(74,140,92,0.12)',
  amber: '#A67C3A',
} as const;


function useStrength(p: string) {
  return useMemo(() => {
    if (!p) return { score: 0, label: '', color: '' };
    let s = 0;
    if (p.length >= 8) s++;
    if (p.length >= 12) s++;
    if (/[A-Z]/.test(p) && /[a-z]/.test(p)) s++;
    if (/\d/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    if (s <= 1) return { score: 1, label: 'Слабый', color: B.carmine };
    if (s === 2) return { score: 2, label: 'Средний', color: B.burnt };
    if (s === 3) return { score: 3, label: 'Хороший', color: B.amber };
    return { score: 4, label: 'Надёжный', color: B.sage };
  }, [p]);
}

function EyeIcon({ open }: { open: boolean }) {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      {open
        ? <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx={12} cy={12} r={3} /></>
        : <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1={1} y1={1} x2={23} y2={23} /></>}
    </svg>
  );
}

function Spinner() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 0.8s linear infinite', flexShrink: 0 }}>
      <circle cx={12} cy={12} r={10} stroke="rgba(243,232,215,0.2)" strokeWidth={2.5} />
      <path d="M12 2a10 10 0 0 1 10 10" stroke={B.bone} strokeWidth={2.5} strokeLinecap="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width={48} height={48} viewBox="0 0 24 24" fill="none">
      <circle cx={12} cy={12} r={10} fill={B.sageMut} stroke={B.sage} strokeWidth={1.5} />
      <path d="M7.5 12l3 3 5-6" stroke={B.sage} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Noise() {
  return (
    <svg style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', opacity: 0.03, zIndex: 0 }}>
      <filter id="n3"><feTurbulence type="fractalNoise" baseFrequency={0.68} numOctaves={3} stitchTiles="stitch" /><feColorMatrix type="saturate" values="0" /></filter>
      <rect width="100%" height="100%" filter="url(#n3)" />
    </svg>
  );
}

function ResetPasswordInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { firstPassword, user } = useAuth();

  // ?mode=required  → first-time forced reset (uses tempToken from URL)
  // default         → regular change-password for logged-in user
  const isRequired = params.get('mode') === 'required';
  const tempToken = params.get('token') ?? '';

  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showCur, setShowCur] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showCon, setShowCon] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errs, setErrs] = useState<Record<string, string>>({});

  const strength = useStrength(next);

  useEffect(() => { const t = setTimeout(() => setMounted(true), 80); return () => clearTimeout(t); }, []);
  useEffect(() => {
    if (isDone) { const t = setTimeout(() => router.push('/dashboard'), 2500); return () => clearTimeout(t); }
  }, [isDone, router]);

  const validate = useCallback(() => {
    const e: Record<string, string> = {};
    if (!isRequired && !current) e.current = 'Введите текущий пароль';
    if (!next) e.next = 'Введите новый пароль';
    else if (next.length < 8) e.next = 'Минимум 8 символов';
    if (!confirm) e.confirm = 'Повторите пароль';
    else if (next !== confirm) e.confirm = 'Пароли не совпадают';
    if (!isRequired && current && current === next) e.next = 'Новый пароль совпадает с текущим';
    return e;
  }, [current, next, confirm, isRequired]);

  const handleSubmit = useCallback(async () => {
    if (isLoading || isDone) return;
    const e = validate();
    if (Object.keys(e).length) { setErrs(e); return; }
    setErrs({}); setError(null); setIsLoading(true);

    try {
      if (isRequired) {
        // First-time login: use tempToken
        if (!tempToken) throw new Error('Токен не найден. Войдите заново.');
        const result = await firstPassword(tempToken, next);
        if (result.requires2FA) {
          router.push(`/2fa?userId=${result.userId}`);
          return;
        }
        setIsDone(true);
      } else {
        // Regular change-password
        await usersApi.changePassword(current, next);
        setIsDone(true);
      }
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message
        ?? (e as Error).message;
      setError(Array.isArray(msg) ? msg[0] : (msg ?? 'Ошибка смены пароля'));
    } finally {
      setIsLoading(false);
    }
  }, [current, next, isRequired, tempToken, isLoading, isDone, validate, firstPassword, router]);

  const bd = (err?: string) =>
    err ? `1px solid ${B.carmine}` : `1px solid ${B.border}`;

  const Field = ({
    label, val, setVal, show, toggle, errKey, placeholder, autoFocus,
  }: {
    label: string; val: string; setVal: (v: string) => void;
    show: boolean; toggle: () => void; errKey: string;
    placeholder?: string; autoFocus?: boolean;
  }) => {
    const [foc, setFoc] = useState(false);
    return (
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: B.textSec, marginBottom: 6 }}>{label}</label>
        <div style={{ position: 'relative' }}>
          <input
            type={show ? 'text' : 'password'} value={val} placeholder={placeholder ?? '••••••••'}
            autoFocus={autoFocus}
            onChange={(e) => { setVal(e.target.value); setError(null); setErrs((p) => ({ ...p, [errKey]: '' })); }}
            onFocus={() => setFoc(true)} onBlur={() => setFoc(false)}
            onKeyDown={(ev) => { if (ev.key === 'Enter') handleSubmit(); }}
            style={{ width: '100%', background: B.input, border: foc ? `1px solid ${B.carmine}` : bd(errs[errKey]), borderRadius: 6, padding: '9px 40px 9px 12px', fontSize: 14, color: B.bone, outline: 'none', transition: 'border-color 0.15s', fontFamily: 'inherit' }}
          />
          <button type="button" onClick={toggle} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: show ? B.textSec : B.textMut, display: 'flex', alignItems: 'center', padding: 0 }}>
            <EyeIcon open={show} />
          </button>
        </div>
        {errs[errKey] && <div style={{ fontSize: 11, color: B.carmine, marginTop: 4 }}>{errs[errKey]}</div>}
        {errKey === 'next' && next && (
          <div style={{ marginTop: 8 }}>
            <div style={{ display: 'flex', gap: 4 }}>
              {[1, 2, 3, 4].map((s) => (
                <div key={s} style={{ flex: 1, height: 3, borderRadius: 99, background: strength.score >= s ? strength.color : B.border, transition: 'background 0.3s' }} />
              ))}
            </div>
            {strength.label && <div style={{ fontSize: 11, color: strength.color, marginTop: 4 }}>{strength.label}</div>}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <Noise />
      <div style={{ position: 'fixed', bottom: -160, right: -160, width: 540, height: 540, borderRadius: '50%', background: 'radial-gradient(circle,rgba(158,28,41,0.09) 0%,transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, gap: 20 }}>

        <div style={{ opacity: mounted ? 1 : 0, transition: 'opacity 0.5s ease', fontSize: 24, fontWeight: 800, color: B.bone, letterSpacing: '0.1em' }}>
          MISSING FRAME
        </div>

        <div style={{ width: '100%', maxWidth: 420, background: 'rgba(16,16,18,0.94)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: `1px solid ${B.borderSt}`, borderRadius: 12, padding: '28px 32px 24px', opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(16px)', transition: 'opacity 0.45s ease 0.1s, transform 0.45s ease 0.1s' }}>

          {isDone ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: '16px 0 8px', animation: 'successPop 0.4s ease' }}>
              <CheckIcon />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: B.bone, marginBottom: 6 }}>Пароль изменён</div>
                <div style={{ fontSize: 13, color: B.textSec }}>Перенаправление...</div>
              </div>
              <div style={{ width: 200, height: 2, background: B.border, borderRadius: 99, overflow: 'hidden', marginTop: 4 }}>
                <div style={{ height: '100%', background: B.sage, borderRadius: 99, animation: 'progressAnim 2.5s ease forwards' }} />
              </div>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: 18 }}>
                <h1 style={{ fontSize: 22, fontWeight: 700, color: B.bone, lineHeight: 1.2, marginBottom: 5 }}>
                  {isRequired ? 'Установите пароль' : 'Смена пароля'}
                </h1>
                <p style={{ fontSize: 13, color: B.textSec }}>
                  {isRequired
                    ? 'При первом входе необходимо установить постоянный пароль'
                    : user ? `Аккаунт: ${user.email}` : 'Создайте надёжный пароль'}
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                <div style={{ height: 1, flex: 1, background: B.border }} />
                {[B.borderSt, B.carmine, B.borderSt].map((c, i) => <div key={i} style={{ width: 3, height: 3, borderRadius: '50%', background: c }} />)}
                <div style={{ height: 1, flex: 1, background: B.border }} />
              </div>

              {error && (
                <div style={{ padding: '10px 14px', background: B.burntMut, border: `1px solid rgba(139,58,26,0.4)`, borderRadius: 8, marginBottom: 16, fontSize: 13, color: B.bone, animation: 'fadeIn 0.2s ease' }}>
                  {error}
                </div>
              )}

              {!isRequired && (
                <Field label="Текущий пароль" val={current} setVal={setCurrent} show={showCur} toggle={() => setShowCur((v) => !v)} errKey="current" autoFocus />
              )}

              <Field label="Новый пароль" val={next} setVal={setNext} show={showNew} toggle={() => setShowNew((v) => !v)} errKey="next" autoFocus={isRequired} />
              <Field label="Повторите новый пароль" val={confirm} setVal={setConfirm} show={showCon} toggle={() => setShowCon((v) => !v)} errKey="confirm" />

              <button
                onClick={handleSubmit} disabled={isLoading} type="button"
                style={{ width: '100%', height: 42, background: isLoading ? B.carnMut : B.carmine, border: isLoading ? `1px solid ${B.carmine}` : 'none', borderRadius: 6, color: B.bone, fontSize: 14, fontWeight: 600, cursor: isLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'inherit', marginBottom: 10 }}
              >
                {isLoading ? <><Spinner /><span>Сохранение...</span></> : isRequired ? 'Установить пароль' : 'Сменить пароль'}
              </button>

              {!isRequired && (
                <button type="button" onClick={() => router.back()} style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', color: B.textMut, fontSize: 13, padding: '4px 0', fontFamily: 'inherit' }}
                  onMouseEnter={(e) => (e.currentTarget as HTMLButtonElement).style.color = B.textSec}
                  onMouseLeave={(e) => (e.currentTarget as HTMLButtonElement).style.color = B.textMut}
                >
                  Назад
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#0B0B0D' }} />}>
      <ResetPasswordInner />
    </Suspense>
  );
}
