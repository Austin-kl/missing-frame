'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { useAuth } from '@/contexts/AuthContext';

// ─── Design tokens ────────────────────────────────────────────────────────────
const B = {
  void: '#0B0B0D', bone: '#F3E8D7', carmine: '#9E1C29',
  input: '#111113', border: '#252528', borderSt: '#333336',
  textSec: '#9A9088', textMut: '#5C5550',
  carnHov: '#B52232', carnMut: 'rgba(158,28,41,0.15)',
  burnt: '#8B3A1A', burntMut: 'rgba(139,58,26,0.15)',
} as const;


// ─── SVG Icons ────────────────────────────────────────────────────────────────
function EyeIcon({ open }: { open: boolean }) {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      {open ? (
        <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx={12} cy={12} r={3} /></>
      ) : (
        <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
          <line x1={1} y1={1} x2={23} y2={23} /></>
      )}
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1={12} y1={9} x2={12} y2={13} /><line x1={12} y1={17} x2={12.01} y2={17} />
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

function Noise() {
  return (
    <svg style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', opacity: 0.03, zIndex: 0 }}>
      <filter id="n">
        <feTurbulence type="fractalNoise" baseFrequency={0.68} numOctaves={3} stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#n)" />
    </svg>
  );
}

// ─── Inner page (wrapped in Suspense for useSearchParams) ────────────────────
function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [emailFoc, setEmailFoc] = useState(false);
  const [passFoc, setPassFoc] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  useEffect(() => { const t = setTimeout(() => setMounted(true), 80); return () => clearTimeout(t); }, []);

  const validate = () => {
    const errs: { email?: string; password?: string } = {};
    if (!email) errs.email = 'Введите email';
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = 'Некорректный email';
    if (!password) errs.password = 'Введите пароль';
    return errs;
  };

  const handleSubmit = useCallback(async () => {
    if (isLoading) return;
    const errs = validate();
    if (Object.keys(errs).length) { setFieldErrors(errs); return; }
    setFieldErrors({});
    setError(null);
    setIsLoading(true);

    try {
      const result = await login(email, password);

      if (result.requiresPasswordReset) {
        // Must change password first
        router.push(`/reset-password?mode=required&token=${result.tempToken}`);
        return;
      }
      if (result.requires2FA) {
        router.push(`/2fa?userId=${result.userId}`);
        return;
      }
      // login() handles redirect to /dashboard for normal flow
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string | string[] } } })
        ?.response?.data?.message;
      setError(Array.isArray(msg) ? msg[0] : (msg ?? 'Ошибка входа'));
    } finally {
      setIsLoading(false);
    }
  }, [email, password, isLoading, login, router]);

  const border = (foc: boolean, err?: string) =>
    err ? `1px solid ${B.carmine}` : foc ? `1px solid ${B.carmine}` : `1px solid ${B.border}`;

  const inputStyle = (foc: boolean, err?: string): React.CSSProperties => ({
    width: '100%', background: B.input, border: border(foc, err),
    borderRadius: 6, padding: '9px 12px', fontSize: 14, color: B.bone,
    outline: 'none', transition: 'border-color 0.15s', fontFamily: 'inherit',
  });

  const from = params.get('from');

  return (
    <>
      <Noise />

      {/* Glows */}
      <div style={{ position: 'fixed', bottom: -160, right: -160, width: 560, height: 560, borderRadius: '50%', background: 'radial-gradient(circle,rgba(158,28,41,0.1) 0%,transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', top: -120, left: -120, width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle,rgba(26,37,64,0.09) 0%,transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, gap: 20 }}>

        {/* Logo */}
        <div style={{
          opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(-12px)',
          transition: 'opacity 0.5s ease, transform 0.5s ease',
          fontSize: 26, fontWeight: 800, color: B.bone, letterSpacing: '0.1em',
        }}>
          MISSING FRAME
        </div>

        {/* Card */}
        <div style={{
          width: '100%', maxWidth: 400,
          background: 'rgba(16,16,18,0.94)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          border: `1px solid ${B.borderSt}`, borderRadius: 12, padding: '28px 32px 24px',
          opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(16px)',
          transition: 'opacity 0.45s ease 0.1s, transform 0.45s ease 0.1s',
        }}>

          <div style={{ marginBottom: 18 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: B.bone, lineHeight: 1.2, marginBottom: 5 }}>
              Войти в систему
            </h1>
            <p style={{ fontSize: 13, color: B.textSec }}>
              {from ? 'Войдите, чтобы продолжить' : 'Введите корпоративные данные для входа'}
            </p>
          </div>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <div style={{ height: 1, flex: 1, background: B.border }} />
            {[B.borderSt, B.carmine, B.borderSt].map((c, i) => (
              <div key={i} style={{ width: 3, height: 3, borderRadius: '50%', background: c }} />
            ))}
            <div style={{ height: 1, flex: 1, background: B.border }} />
          </div>

          {/* Error */}
          {error && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 14px', background: B.burntMut, border: `1px solid rgba(139,58,26,0.4)`, borderRadius: 8, marginBottom: 16, animation: 'fadeIn 0.2s ease' }}>
              <div style={{ color: B.burnt, flexShrink: 0, marginTop: 1 }}><AlertIcon /></div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: B.bone, marginBottom: 2 }}>Ошибка входа</div>
                <div style={{ fontSize: 12, color: B.textSec }}>{error}</div>
              </div>
            </div>
          )}

          {/* Email */}
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: B.textSec, marginBottom: 6, letterSpacing: '0.02em' }}>
              Корпоративный email
            </label>
            <input
              type="email" value={email} placeholder="alex@missingframe.ru"
              onChange={(e) => { setEmail(e.target.value); setError(null); setFieldErrors((p) => ({ ...p, email: undefined })); }}
              onFocus={() => setEmailFoc(true)} onBlur={() => setEmailFoc(false)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              style={inputStyle(emailFoc, fieldErrors.email)}
            />
            {fieldErrors.email && <div style={{ fontSize: 11, color: B.carmine, marginTop: 4 }}>{fieldErrors.email}</div>}
          </div>

          {/* Password */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: B.textSec, marginBottom: 6, letterSpacing: '0.02em' }}>
              Пароль
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPass ? 'text' : 'password'} value={password} placeholder="••••••••"
                onChange={(e) => { setPassword(e.target.value); setError(null); setFieldErrors((p) => ({ ...p, password: undefined })); }}
                onFocus={() => setPassFoc(true)} onBlur={() => setPassFoc(false)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                style={{ ...inputStyle(passFoc, fieldErrors.password), paddingRight: 40 }}
              />
              <button
                onClick={() => setShowPass((v) => !v)}
                type="button"
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: showPass ? B.textSec : B.textMut, display: 'flex', alignItems: 'center', padding: 0, transition: 'color 0.15s' }}
              >
                <EyeIcon open={showPass} />
              </button>
            </div>
            {fieldErrors.password && <div style={{ fontSize: 11, color: B.carmine, marginTop: 4 }}>{fieldErrors.password}</div>}
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit} disabled={isLoading} type="button"
            onMouseEnter={(e) => { if (!isLoading) (e.currentTarget as HTMLButtonElement).style.background = B.carnHov; }}
            onMouseLeave={(e) => { if (!isLoading) (e.currentTarget as HTMLButtonElement).style.background = B.carmine; }}
            onMouseDown={(e) => { if (!isLoading) (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.97)'; }}
            onMouseUp={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
            style={{ width: '100%', height: 42, background: isLoading ? B.carnMut : B.carmine, border: isLoading ? `1px solid ${B.carmine}` : 'none', borderRadius: 6, color: B.bone, fontSize: 14, fontWeight: 600, cursor: isLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'background 0.15s, transform 0.08s', fontFamily: 'inherit', marginBottom: 10 }}
          >
            {isLoading ? <><Spinner /><span>Выполняется вход...</span></> : 'Войти'}
          </button>

          <button
            onClick={() => router.push('/reset-password')} type="button"
            style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', color: B.textMut, fontSize: 13, padding: '4px 0', textAlign: 'center', transition: 'color 0.15s', fontFamily: 'inherit' }}
            onMouseEnter={(e) => (e.currentTarget as HTMLButtonElement).style.color = B.textSec}
            onMouseLeave={(e) => (e.currentTarget as HTMLButtonElement).style.color = B.textMut}
          >
            Забыли пароль?
          </button>

          <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${B.border}` }}>
            <p style={{ fontSize: 11, color: B.textMut, textAlign: 'center', letterSpacing: '0.02em' }}>
              Доступ только для сотрудников Missing Frame
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#0B0B0D' }} />}>
      <LoginInner />
    </Suspense>
  );
}
