import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Settings as SettingsIcon } from 'lucide-react';

const LS_KEY = 'ganpati_blitz_settings';

const defaults = {
  soundEffects: true,
  music: true,
  vibration: true,
  controlPreference: 'buttons',
  reducedMotion: false,
  screenReaderHints: false,
};

const loadSettings = () => {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? { ...defaults, ...JSON.parse(raw) } : defaults;
  } catch {
    return defaults;
  }
};

const saveSettings = (s) => {
  localStorage.setItem(LS_KEY, JSON.stringify(s));
};

const Switch = ({ checked, onChange }) => (
  <button
    onClick={() => onChange(!checked)}
    style={{
      ...styles.switchTrack,
      background: checked
        ? 'linear-gradient(135deg, var(--festival-saffron), var(--festival-gold))'
        : 'rgba(255,255,255,0.1)',
    }}
    aria-checked={checked}
    role="switch"
  >
    <div
      style={{
        ...styles.switchThumb,
        transform: checked ? 'translateX(20px)' : 'translateX(2px)',
      }}
    />
  </button>
);

const Section = ({ title, children, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 24 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.08, type: 'spring', stiffness: 260, damping: 22 }}
    style={styles.section}
  >
    <h3 style={styles.sectionTitle}>{title}</h3>
    {children}
  </motion.div>
);

const Row = ({ label, children }) => (
  <div style={styles.row}>
    <span style={styles.rowLabel}>{label}</span>
    {children}
  </div>
);

const Settings = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState(loadSettings);
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  const update = (key, value) => setSettings((prev) => ({ ...prev, [key]: value }));

  const clearAllData = () => {
    if (!confirmClear) {
      setConfirmClear(true);
      setTimeout(() => setConfirmClear(false), 3000);
      return;
    }
    localStorage.clear();
    setConfirmClear(false);
    navigate('/');
  };

  const logout = () => {
    localStorage.removeItem('ganpati_player');
    navigate('/');
  };

  return (
    <div style={styles.page}>
      <div style={styles.topRow}>
        <button style={styles.backBtn} onClick={() => navigate('/')}>
          <ArrowLeft size={20} />
        </button>
        <h1 style={styles.title}>
          <SettingsIcon size={22} />
          SETTINGS
        </h1>
      </div>

      <Section title="Audio" index={0}>
        <Row label="Sound Effects">
          <Switch checked={settings.soundEffects} onChange={(v) => update('soundEffects', v)} />
        </Row>
        <Row label="Music">
          <Switch checked={settings.music} onChange={(v) => update('music', v)} />
        </Row>
      </Section>

      <Section title="Controls" index={1}>
        <Row label="Vibration">
          <Switch checked={settings.vibration} onChange={(v) => update('vibration', v)} />
        </Row>
        <div style={styles.controlPrefRow}>
          <span style={styles.rowLabel}>Control Style</span>
          <div style={styles.prefGroup}>
            {['buttons', 'swipe'].map((opt) => (
              <button
                key={opt}
                style={{
                  ...styles.prefBtn,
                  ...(settings.controlPreference === opt ? styles.prefBtnActive : {}),
                }}
                onClick={() => update('controlPreference', opt)}
              >
                {opt === 'buttons' ? 'Buttons' : 'Swipe'}
              </button>
            ))}
          </div>
        </div>
      </Section>

      <Section title="Accessibility" index={2}>
        <Row label="Reduced Motion">
          <Switch checked={settings.reducedMotion} onChange={(v) => update('reducedMotion', v)} />
        </Row>
        <Row label="Screen Reader Hints">
          <Switch checked={settings.screenReaderHints} onChange={(v) => update('screenReaderHints', v)} />
        </Row>
      </Section>

      <Section title="Privacy" index={3}>
        <button
          style={confirmClear ? styles.dangerBtnConfirm : styles.dangerBtn}
          onClick={clearAllData}
        >
          {confirmClear ? 'Tap again to confirm' : 'Clear All Data'}
        </button>
        <button style={styles.logoutBtn} onClick={logout}>
          Logout
        </button>
      </Section>

      <Section title="About" index={4}>
        <div style={styles.aboutRow}>
          <span style={styles.aboutLabel}>Version</span>
          <span style={styles.aboutValue}>1.0.0</span>
        </div>
        <div style={styles.aboutRow}>
          <span style={styles.aboutLabel}>Credits</span>
          <span style={styles.aboutValue}>Ganesh Chaturthi Special Edition</span>
        </div>
        <p style={styles.madeWith}>Made with ❤ for the festival</p>
      </Section>
    </div>
  );
};

const styles = {
  page: {
    minHeight: '100vh',
    background: 'var(--festival-navy, #0C081C)',
    padding: '80px 16px 40px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 20,
    boxSizing: 'border-box',
  },
  topRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    width: '100%',
    maxWidth: 520,
    marginBottom: 4,
  },
  backBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    borderRadius: 'var(--radius-full)',
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.06)',
    color: 'var(--text, #EAEAEA)',
    cursor: 'pointer',
  },
  title: {
    fontFamily: 'var(--font-display, sans-serif)',
    fontSize: '1.3rem',
    fontWeight: 800,
    letterSpacing: '0.05em',
    color: 'var(--text, #EAEAEA)',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    margin: 0,
  },
  section: {
    width: '100%',
    maxWidth: 520,
    background: 'var(--card, rgba(255,255,255,0.04))',
    border: '1px solid var(--glass-border, rgba(255,255,255,0.08))',
    borderRadius: 'var(--radius-lg, 16px)',
    padding: '18px 20px',
    boxSizing: 'border-box',
  },
  sectionTitle: {
    fontFamily: 'var(--font-display, sans-serif)',
    fontSize: '0.75rem',
    fontWeight: 700,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: 'var(--festival-gold, #FFD166)',
    margin: '0 0 14px',
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 0',
    borderBottom: '1px solid rgba(255,255,255,0.04)',
  },
  rowLabel: {
    fontFamily: 'var(--font-sans, sans-serif)',
    fontSize: '0.9rem',
    color: 'var(--text, #EAEAEA)',
  },
  switchTrack: {
    width: 44,
    height: 24,
    borderRadius: 12,
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    position: 'relative',
    transition: 'background 0.25s',
  },
  switchThumb: {
    width: 18,
    height: 18,
    borderRadius: 'var(--radius-full)',
    background: '#fff',
    transition: 'transform 0.25s',
  },
  controlPrefRow: {
    padding: '10px 0',
  },
  prefGroup: {
    display: 'flex',
    gap: 8,
    marginTop: 8,
  },
  prefBtn: {
    flex: 1,
    padding: '8px 0',
    borderRadius: 'var(--radius-md, 8px)',
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.04)',
    color: 'var(--text-muted, #999)',
    fontFamily: 'var(--font-sans, sans-serif)',
    fontSize: '0.85rem',
    cursor: 'pointer',
  },
  prefBtnActive: {
    background: 'linear-gradient(135deg, var(--festival-saffron, #FF8C42), var(--festival-gold, #FFD166))',
    color: '#0C081C',
    fontWeight: 700,
    border: 'none',
  },
  dangerBtn: {
    width: '100%',
    padding: '12px 0',
    borderRadius: 'var(--radius-md, 8px)',
    border: '1px solid rgba(255,80,80,0.3)',
    background: 'rgba(255,80,80,0.1)',
    color: '#FF5050',
    fontFamily: 'var(--font-sans, sans-serif)',
    fontSize: '0.9rem',
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: 4,
  },
  dangerBtnConfirm: {
    width: '100%',
    padding: '12px 0',
    borderRadius: 'var(--radius-md, 8px)',
    border: 'none',
    background: '#FF5050',
    color: '#fff',
    fontFamily: 'var(--font-sans, sans-serif)',
    fontSize: '0.9rem',
    fontWeight: 700,
    cursor: 'pointer',
    marginTop: 4,
    animation: 'pulse 1s infinite',
  },
  logoutBtn: {
    width: '100%',
    padding: '12px 0',
    borderRadius: 'var(--radius-md, 8px)',
    border: '1px solid rgba(255,255,255,0.12)',
    background: 'rgba(255,255,255,0.04)',
    color: 'var(--text, #EAEAEA)',
    fontFamily: 'var(--font-sans, sans-serif)',
    fontSize: '0.9rem',
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: 10,
  },
  aboutRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 0',
  },
  aboutLabel: {
    fontFamily: 'var(--font-sans, sans-serif)',
    fontSize: '0.85rem',
    color: 'var(--text-muted, #999)',
  },
  aboutValue: {
    fontFamily: 'var(--font-mono, monospace)',
    fontSize: '0.85rem',
    color: 'var(--text, #EAEAEA)',
  },
  madeWith: {
    textAlign: 'center',
    fontFamily: 'var(--font-sans, sans-serif)',
    fontSize: '0.8rem',
    color: 'var(--text-muted, #999)',
    margin: '12px 0 0',
  },
};

export default Settings;
