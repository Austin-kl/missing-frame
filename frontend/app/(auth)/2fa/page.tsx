'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

const B = {
  void: '#0B0B0D', bone: '#F3E8D7', carmine: '#9E1C29',
  card: '#151515', input: '#111113', border: '#252528', borderSt: '#333336',
  textSec: '#9A9088', textMut: '#5C5550',
  carnMut: 'rgba(158,28,41,0.15)', carnHov: '#B52232',
  burnt: '#8B3A1A', burntMut: 'rgba(139,58,26,0.15)',
  sage: '#4A8C5C', sageMut: 'rgba(74,140,92,0.15)',
} as const;


type State = 'idle' | 'loading' | 'error' | 'success';

function CheckIcon() {
  return (
    <svg width={48} height={48} viewBox="0 0 24 24" fill="none">
      <circle cx={12} cy={12} r={10} fill={B.sageMut} stroke={B.sage} strokeWidth={1.5} />
      <path d="M7.5 12l3 3 5-6" stroke={B.sage} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
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
      <filter id="n2"><feTurbulence type="fractalNoise" baseFrequency={0.68} numOctaves={3} stitchTiles="stitch" /><feColorMatrix type="saturate" values="0" /></filter>
      <rect width="100%" height="100%" filter="url(#n2)" />
    </svg>
  );
}

function TwoFAInner() {
  const params = useSearchParams();
  const { verify2FA } = useAuth();
  const userId = params.get('userId') ?? '';

  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [state, setState] = useState<State>('idle');
  const [shake, setShake] = useState(false);
  const [timer, setTimer] = useState(300);
  const [mounted, setMounted] = useState(false);
  const [errMsg, setErrMsg] = useState('Неверный код. Попробуйте снова.');
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => { setTimeout(() => { setMounted(true); refs.current[0]?.focus(); }, 100); }, []);

  useEffect(() => {
    if (state === 'success') return;
    const t = setInterval(() => setTimer((v) => Math.max(0, v - 1)), 1000);
    return () => clearInterval(t);
  }, [state]);

  const timerStr = `${Math.floor(timer / 60)}:${String(timer % 60).padStart(2, '0')}`;
  const expired = timer === 0;
  const full = digits.every((d) => d !== '');
  const isLoading = state === 'loading';
  const isError = state === 'error';
  const isSuccess = state === 'success';

  const onChange = (i: number, v: string) => {
    if (isError) setState('idle');
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
    if (e.key === 'Enter' && full) verify();
  };

  const onPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const next = ['', '', '', '', '', ''];
    text.split('').forEach((c, i) => { if (i < 6) next[i] = c; });
    setDigits(next);
    setTimeout(() => refs.current[Math.min(text.length, 5)]?.focus(), 10);
  };

  const verify = useCallback(async () => {
    if (isLoading || isSuccess || !full || expired) return;
    if (!userId) { setErrMsg('Сессия истекла. Войдите заново.'); setState('error'); return; }
    setState('loading');
    try {
      await verify2FA(userId, digits.join(''));
      setState('success');
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setErrMsg(typeof msg === 'string' ? msg : 'Неверный код');
      setState('error');
      setShake(true);
      setTimeout(() => { setShake(false); setDigits(['', '', '', '', '', '']); refs.current[0]?.focus(); }, 600);
    }
  }, [digits, full, expired, isLoading, isSuccess, userId, verify2FA]);

  const pinBorder = (i: number) => {
    if (isError) return `1.5px solid ${B.carmine}`;
    if (isSuccess) return `1.5px solid ${B.sage}`;
    return digits[i] ? `1.5px solid ${B.borderSt}` : `1.5px solid ${B.border}`;
  };

  const pinBg = (i: number) => {
    if (isError) return 'rgba(158,28,41,0.08)';
    if (isSuccess) return 'rgba(74,140,92,0.08)';
    return digits[i] ? B.card : B.input;
  };

  return (
    <>
      <Noise />
      <div style={{ position: 'fixed', bottom: -160, right: -160, width: 520, height: 520, borderRadius: '50%', background: 'radial-gradient(circle,rgba(158,28,41,0.09) 0%,transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, gap: 20 }}>

        <div style={{ opacity: mounted ? 1 : 0, transition: 'opacity 0.5s ease', fontSize: 24, fontWeight: 800, color: B.bone, letterSpacing: '0.1em' }}>
          MISSING FRAME
        </div>

        <div style={{ width: '100%', maxWidth: 400, background: 'rgba(16,16,18,0.94)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: `1px solid ${B.borderSt}`, borderRadius: 12, padding: '28px 32px 24px', opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(14px)', transition: 'opacity 0.45s ease 0.1s, transform 0.45s ease 0.1s' }}>

          {isSuccess ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: '16px 0 8px', animation: 'successPop 0.4s ease' }}>
              <CheckIcon />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: B.bone, marginBottom: 6 }}>Вход выполнен</div>
                <div style={{ fontSize: 13, color: B.textSec }}>Перенаправление в систему...</div>
              </div>
              <div style={{ width: 200, height: 2, background: B.border, borderRadius: 99, overflow: 'hidden', marginTop: 4 }}>
                <div style={{ height: '100%', background: B.sage, borderRadius: 99, animation: 'progressAnim 1.5s ease forwards' }} />
              </div>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: 20 }}>
                <h1 style={{ fontSize: 18, fontWeight: 700, color: B.bone, lineHeight: 1.2, marginBottom: 6 }}>Двухфакторная аутентификация</h1>
                <p style={{ fontSize: 12, color: B.textSec, lineHeight: 1.5 }}>Введите 6-значный код из приложения-аутентификатора</p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                <div style={{ height: 1, flex: 1, background: B.border }} />
                {[B.borderSt, B.carmine, B.borderSt].map((c, i) => <div key={i} style={{ width: 3, height: 3, borderRadius: '50%', background: c }} />)}
                <div style={{ height: 1, flex: 1, background: B.border }} />
              </div>

              {isError && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', background: B.burntMut, border: `1px solid rgba(139,58,26,0.4)`, borderRadius: 8, marginBottom: 16, animation: 'fadeIn 0.15s ease' }}>
                  <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke={B.burnt} strokeWidth={1.5} strokeLinecap="round"><circle cx={12} cy={12} r={10} /><line x1={12} y1={8} x2={12} y2={12} /><line x1={12} y1={16} x2={12.01} y2={16} /></svg>
                  <span style={{ fontSize: 12, color: B.textSec }}>{errMsg}</span>
                </div>
              )}

              {/* PIN inputs */}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 6, animation: shake ? 'shake 0.4s ease' : 'none' }}>
                {digits.map((d, i) => (
                  <input
                    key={i}
                    ref={(el) => { refs.current[i] = el; }}
                    type="number"
                    maxLength={1}
                    value={d}
                    onChange={(e) => onChange(i, e.target.value)}
                    onKeyDown={(e) => onKeyDown(i, e)}
                    onPaste={onPaste}
                    onFocus={(e) => e.target.select()}
                    style={{ width: 48, height: 56, textAlign: 'center', fontSize: 22, fontWeight: 700, color: isSuccess ? B.sage : isError ? B.carmine : B.bone, background: pinBg(i), border: pinBorder(i), borderRadius: 8, outline: 'none', transition: 'border-color 0.15s, background 0.15s, color 0.15s', fontFamily: "'JetBrains Mono', monospace", cursor: 'text' }}
                  />
                ))}
              </div>

              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                {expired
                  ? <span style={{ fontSize: 12, color: B.carmine }}>Код истёк</span>
                  : <span style={{ fontSize: 12, color: B.textMut }}>Код действителен:&nbsp;<span style={{ fontFamily: "'JetBrains Mono',monospace", color: timer < 60 ? B.carmine : B.textSec, fontWeight: 600 }}>{timerStr}</span></span>}
              </div>

              <button
                onClick={verify} disabled={!full || isLoading || expired} type="button"
                style={{ width: '100%', height: 42, background: (!full || expired) ? B.carnMut : isLoading ? B.carnMut : B.carmine, border: (!full || expired) ? `1px solid rgba(158,28,41,0.25)` : 'none', borderRadius: 6, color: B.bone, fontSize: 14, fontWeight: 600, cursor: (!full || isLoading || expired) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'inherit', marginBottom: 10, opacity: (!full || expired) ? 0.5 : 1 }}
              >
                {isLoading ? <><Spinner /><span>Проверка...</span></> : 'Подтвердить'}
              </button>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => { setTimer(300); setDigits(['', '', '', '', '', '']); setState('idle'); setTimeout(() => refs.current[0]?.focus(), 50); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: B.textMut, fontSize: 12, padding: '3px 0', fontFamily: 'inherit' }}
                  onMouseEnter={(e) => (e.currentTarget as HTMLButtonElement).style.color = B.textSec}
                  onMouseLeave={(e) => (e.currentTarget as HTMLButtonElement).style.color = B.textMut}
                >
                  Отправить код повторно
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default function TwoFAPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#0B0B0D' }} />}>
      <TwoFAInner />
    </Suspense>
  );
}
