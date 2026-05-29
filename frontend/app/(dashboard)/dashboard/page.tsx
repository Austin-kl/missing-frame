'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const B = { void: '#0B0B0D', bone: '#F3E8D7', carmine: '#9E1C29', borderSt: '#333336', textSec: '#9A9088', card: 'rgba(16,16,18,0.94)' };

  return (
    <div style={{ minHeight: '100vh', background: B.void, color: B.bone, fontFamily: "'Nunito Sans', sans-serif", display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, padding: 24 }}>
      <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '0.1em' }}>MISSING FRAME</div>

      <div style={{ background: B.card, border: `1px solid ${B.borderSt}`, borderRadius: 12, padding: '28px 32px', maxWidth: 480, width: '100%' }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Dashboard</h1>
        <p style={{ fontSize: 13, color: B.textSec, marginBottom: 20 }}>Фаза 2 — в разработке. Авторизация работает ✓</p>

        {user && (
          <div style={{ fontSize: 14, marginBottom: 20 }}>
            <div style={{ marginBottom: 6 }}><span style={{ color: B.textSec }}>Email: </span>{user.email}</div>
            <div style={{ marginBottom: 6 }}><span style={{ color: B.textSec }}>Имя: </span>{user.firstName} {user.lastName}</div>
            <div style={{ marginBottom: 6 }}><span style={{ color: B.textSec }}>Роль: </span>{user.role}</div>
            <div><span style={{ color: B.textSec }}>2FA: </span>{user.twoFactorEnabled ? '✓ Включена' : '✗ Не настроена'}</div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 8 }}>
          {user && !user.twoFactorEnabled && (
            <button onClick={() => router.push('/setup-2fa')} style={{ flex: 1, height: 38, background: B.carmine, border: 'none', borderRadius: 6, color: B.bone, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              Настроить 2FA
            </button>
          )}
          <button onClick={() => router.push('/reset-password')} style={{ flex: 1, height: 38, background: 'none', border: `1px solid ${B.borderSt}`, borderRadius: 6, color: B.textSec, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
            Сменить пароль
          </button>
          <button onClick={logout} style={{ flex: 1, height: 38, background: 'none', border: `1px solid ${B.borderSt}`, borderRadius: 6, color: B.textSec, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
            Выйти
          </button>
        </div>
      </div>
    </div>
  );
}
