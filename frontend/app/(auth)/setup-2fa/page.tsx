'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { authApi } from '@/lib/api';

const B = {
  void: '#0B0B0D', bone: '#F3E8D7', carmine: '#9E1C29',
  input: '#111113', border: '#252528', borderSt: '#333336',
  textSec: '#9A9088', textMut: '#5C5550',
  carnMut: 'rgba(158,28,41,0.15)', carnHov: '#B52232',
  burnt: '#8B3A1A', burntMut: 'rgba(139,58,26,0.15)',
  sage: '#4A8C5C', sageMut: 'rgba(74,140,92,0.12)',
  card: '#151515',
} as const;


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
      <filter id="n4"><feTurbulence type="fractalNoise" baseFrequency={0.68} numOctaves={3} stitchTiles="stitch" /><feColorMatrix type="saturate" values="0" /></filter>
      <rect width="100%" height="100%" filter="url(#n4)" />
    </svg>
  );
}

export default function Setup2FAPage() {
  const router = useRouter();
  const { refreshUser } = useAuth();

  const [step, setStep] = useState<'loading' | 'scan' | 'verify' | 'done'>('loading');
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const [mounted, setMounted] = useState(false);
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => { setTimeout(() => setMounted(true), 80); }, []);

  // Load QR code on mount
  useEffect(() => {
    authApi.setup2FA()
      .then(({ data }) => { setQrCode(data.qrCodeUrl); setSecret(data.secret); setStep('scan'); })
      .catch(() => setError('Не удалось загрузить QR-код'));
  }, []);

  useEffect(() => {
    if (step === 'done') {
      const t = setTimeout(() => router.push('/dashboard'), 2000);
      return () => clearTimeout(t);
    }
  }, [step, router]);

  const onChange = (i: number, v: string) => {
    setError('');
    const d = v.replace(/\D/g, '').slice(-1);
    const next = [...digits]; next[i] = d; setDigits(next);
    if (d && i < 5) setTimeout(() => refs.current[i + 1]?.focus(), 10);
  };

  const onKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (digits[i]) { const n = [...digits]; n[i] = ''; setDigits(n); }
      else if (i > 0) { refs.current[i - 1]?.focus(); const n = [...digits]; n[i - 1] = ''; setDigits(n); }
    }
    if (e.key === 'ArrowLeft' && i > 0) refs.current[i - 1]?.focus();
    if (e.key === 'ArrowRight' && i < 5) refs.current[i + 1]?.focus();
    if (e.key === 'Enter' && digits.every((d) => d)) confirmCode();
  };

  const onPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const next = ['', '', '', '', '', ''];
    text.split('').forEach((c, i) => { if (i < 6) next[i] = c; });
    setDigits(next);
    setTimeout(() => refs.current[Math.min(text.length, 5)]?.focus(), 10);
  };

  const confirmCode = useCallback(async () => {
    if (isVerifying || !digits.every((d) => d)) return;
    setIsVerifying(true);
    try {
      await authApi.enable2FA(digits.join(''));
      await refreshUser();
      setStep('done');
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(typeof msg === 'string' ? msg : 'Неверный код');
      setShake(true);
      setTimeout(() => { setShake(false); setDigits(['', '', '', '', '', '']); refs.current[0]?.focus(); }, 600);
    } finally {
      setIsVerifying(false);
    }
  }, [digits, isVerifying, refreshUser]);

  const pinBorder = (i: number) =>
    error ? `1.5px solid ${B.carmine}` : digits[i] ? `1.5px solid ${B.borderSt}` : `1.5px solid ${B.border}`;

  const cardStyle: React.CSSProperties = {
    width: '100%', maxWidth: 440,
    background: 'rgba(16,16,18,0.94)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
    border: `1px solid ${B.borderSt}`, borderRadius: 12, padding: '28px 32px 24px',
    opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(16px)',
    transition: 'opacity 0.45s ease 0.1s, transform 0.45s ease 0.1s',
  };

  return (
    <>
      <Noise />
      <div style={{ position: 'fixed', bottom: -160, right: -160, width: 560, height: 560, borderRadius: '50%', background: 'radial-gradient(circle,rgba(158,28,41,0.09) 0%,transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, gap: 20 }}>

        <div style={{ opacity: mounted ? 1 : 0, transition: 'opacity 0.5s ease', fontSize: 24, fontWeight: 800, color: B.bone, letterSpacing: '0.1em' }}>
          MISSING FRAME
        </div>

        <div style={cardStyle}>

          {step === 'loading' && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 0', gap: 12, color: B.textSec, fontSize: 14 }}>
              <Spinner /> Генерация QR-кода...
            </div>
          )}

          {step === 'done' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: '16px 0 8px', animation: 'successPop 0.4s ease' }}>
              <CheckIcon />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: B.bone, marginBottom: 6 }}>2FA включена</div>
                <div style={{ fontSize: 13, color: B.textSec }}>Аккаунт защищён. Переход в систему...</div>
              </div>
              <div style={{ width: 200, height: 2, background: B.border, borderRadius: 99, overflow: 'hidden', marginTop: 4 }}>
                <div style={{ height: '100%', background: B.sage, borderRadius: 99, animation: 'progressAnim 2s ease forwards' }} />
              </div>
            </div>
          )}

          {(step === 'scan' || step === 'verify') && (
            <>
              <div style={{ marginBottom: 18 }}>
                <h1 style={{ fontSize: 22, fontWeight: 700, color: B.bone, lineHeight: 1.2, marginBottom: 5 }}>
                  Настройка 2FA
                </h1>
                <p style={{ fontSize: 13, color: B.textSec, lineHeight: 1.5 }}>
                  Двухфакторная аутентификация обязательна для всех сотрудников
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                <div style={{ height: 1, flex: 1, background: B.border }} />
                {[B.borderSt, B.carmine, B.borderSt].map((c, i) => <div key={i} style={{ width: 3, height: 3, borderRadius: '50%', background: c }} />)}
                <div style={{ height: 1, flex: 1, background: B.border }} />
              </div>

              {/* Steps */}
              {step === 'scan' && (
                <>
                  <ol style={{ paddingLeft: 18, marginBottom: 20, color: B.textSec, fontSize: 13, lineHeight: 1.8 }}>
                    <li>Установите <strong style={{ color: B.bone }}>Google Authenticator</strong> или <strong style={{ color: B.bone }}>Authy</strong></li>
                    <li>Нажмите «+» → «Сканировать QR-код»</li>
                    <li>Отсканируйте код ниже</li>
                  </ol>

                  {qrCode && (
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                      <div style={{ background: '#fff', padding: 12, borderRadius: 8 }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={qrCode} alt="QR Code для 2FA" width={180} height={180} style={{ display: 'block' }} />
                      </div>
                    </div>
                  )}

                  <details style={{ marginBottom: 20 }}>
                    <summary style={{ fontSize: 12, color: B.textMut, cursor: 'pointer', userSelect: 'none' }}>Ввести код вручную</summary>
                    <div style={{ marginTop: 8, padding: '8px 12px', background: '#0e0e10', borderRadius: 6, border: `1px solid ${B.border}` }}>
                      <code style={{ fontSize: 12, color: B.textSec, fontFamily: "'JetBrains Mono', monospace", wordBreak: 'break-all', letterSpacing: '0.05em' }}>{secret}</code>
                    </div>
                  </details>

                  <button
                    onClick={() => { setStep('verify'); setTimeout(() => refs.current[0]?.focus(), 100); }}
                    type="button"
                    style={{ width: '100%', height: 42, background: B.carmine, border: 'none', borderRadius: 6, color: B.bone, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                    onMouseEnter={(e) => (e.currentTarget as HTMLButtonElement).style.background = B.carnHov}
                    onMouseLeave={(e) => (e.currentTarget as HTMLButtonElement).style.background = B.carmine}
                  >
                    Я отсканировал — ввести код
                  </button>
                </>
              )}

              {step === 'verify' && (
                <>
                  <p style={{ fontSize: 13, color: B.textSec, marginBottom: 16, lineHeight: 1.5 }}>
                    Введите 6-значный код из приложения, чтобы подтвердить настройку:
                  </p>

                  {error && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', background: B.burntMut, border: `1px solid rgba(139,58,26,0.4)`, borderRadius: 8, marginBottom: 16, animation: 'fadeIn 0.15s ease' }}>
                      <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke={B.burnt} strokeWidth={1.5} strokeLinecap="round"><circle cx={12} cy={12} r={10} /><line x1={12} y1={8} x2={12} y2={12} /><line x1={12} y1={16} x2={12.01} y2={16} /></svg>
                      <span style={{ fontSize: 12, color: B.textSec }}>{error}</span>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 20, animation: shake ? 'shake 0.4s ease' : 'none' }}>
                    {digits.map((d, i) => (
                      <input
                        key={i}
                        ref={(el) => { refs.current[i] = el; }}
                        type="number" maxLength={1} value={d}
                        onChange={(e) => onChange(i, e.target.value)}
                        onKeyDown={(e) => onKeyDown(i, e)}
                        onPaste={onPaste}
                        onFocus={(e) => e.target.select()}
                        style={{ width: 48, height: 56, textAlign: 'center', fontSize: 22, fontWeight: 700, color: error ? B.carmine : B.bone, background: error ? 'rgba(158,28,41,0.08)' : d ? B.card : B.input, border: pinBorder(i), borderRadius: 8, outline: 'none', transition: 'border-color 0.15s, background 0.15s, color 0.15s', fontFamily: "'JetBrains Mono', monospace", cursor: 'text' }}
                      />
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: 8 }}>
                    <button type="button" onClick={() => { setStep('scan'); setError(''); setDigits(['', '', '', '', '', '']); }} style={{ height: 42, flex: 1, background: 'none', border: `1px solid ${B.border}`, borderRadius: 6, color: B.textSec, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>
                      ← Назад
                    </button>
                    <button
                      type="button" onClick={confirmCode}
                      disabled={isVerifying || !digits.every((d) => d)}
                      style={{ height: 42, flex: 2, background: digits.every((d) => d) ? B.carmine : B.carnMut, border: 'none', borderRadius: 6, color: B.bone, fontSize: 14, fontWeight: 600, cursor: digits.every((d) => d) && !isVerifying ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'inherit', opacity: digits.every((d) => d) ? 1 : 0.5 }}
                    >
                      {isVerifying ? <><Spinner />Проверка...</> : 'Включить 2FA'}
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
