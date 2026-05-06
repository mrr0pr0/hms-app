import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import styles from "../styles/Home.module.css";
import rapStyles from "../styles/Rapport.module.css";

interface User {
  id: number;
  hash: string;
  username?: string;
  is_admin: boolean;
}

export default function RapportPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const [dato, setDato] = useState(() => new Date().toISOString().slice(0, 10));
  const [sted, setSted] = useState("");
  const [avvikType, setAvvikType] = useState<"ergonomi" | "sikkerhet" | "miljo" | "">("");
  const [hvaSkjedde, setHvaSkjedde] = useState("");
  const [hvorfor, setHvorfor] = useState("");
  const [forhindre, setForhindre] = useState("");
  const [alvorlighet, setAlvorlighet] = useState<"lav" | "middels" | "hoy" | "">("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    async function init() {
      const hash = localStorage.getItem("userHash");
      if (!hash) { router.push("/login"); return; }
      const res = await fetch(`/api/users?hash=${hash}`);
      if (res.ok) { setUser(await res.json()); }
      else { localStorage.removeItem("userHash"); router.push("/login"); return; }
      setLoading(false);
    }
    init();
  }, []);

  function logout() {
    localStorage.removeItem("userHash");
    router.push("/login");
  }

  function canSubmit() {
    return !!avvikType && !!hvaSkjedde.trim() && !!hvorfor.trim() && !!forhindre.trim() && !!alvorlighet;
  }

  function handleSubmit() {
    if (!canSubmit()) return;
    setSubmitted(true);
  }

  function reset() {
    setDato(new Date().toISOString().slice(0, 10));
    setSted("");
    setAvvikType("");
    setHvaSkjedde("");
    setHvorfor("");
    setForhindre("");
    setAlvorlighet("");
    setSubmitted(false);
  }

  const alvorlighetLabel = { lav: "Lav", middels: "Middels", hoy: "Høy", "": "" };
  const alvorlighetColor = { lav: "var(--green)", middels: "var(--yellow)", hoy: "var(--red)", "": "" };

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontFamily: "IBM Plex Mono, monospace", color: "#555", fontSize: 13 }}>
      LASTER...
    </div>
  );

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <div className={styles.logo}>
          HMS<span>/</span>AVVIK
          <span className={styles.logoSub}>Drømtorp vgs</span>
        </div>
        <nav className={rapStyles.nav}>
          <a href="/" className={rapStyles.navLink}>Avvik</a>
          <a href="/rapport" className={`${rapStyles.navLink} ${rapStyles.navActive}`}>Rapport</a>
        </nav>
        <div className={styles.headerRight}>
          {user?.is_admin && <span className={styles.adminBadge}>ADMIN</span>}
          <span className={styles.userBadge}>{user?.username || user?.hash}</span>
          <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={logout}>Logout</button>
        </div>
      </header>

      <main className={rapStyles.main}>
        {submitted ? (
          <div className={rapStyles.reportOut}>
            <div className={rapStyles.reportHeader}>
              <div className={rapStyles.reportTitle}>// AVVIKSRAPPORT</div>
              <div className={rapStyles.reportMeta}>
                <span>Drømtorp vgs</span>
                <span className={rapStyles.metaDot}>·</span>
                <span>{new Date(dato).toLocaleDateString("no-NO", { day: "2-digit", month: "long", year: "numeric" })}</span>
                <span className={rapStyles.metaDot}>·</span>
                <span>Registrert av {user?.username || user?.hash}</span>
              </div>
            </div>

            <div className={rapStyles.reportGrid}>
              <div className={rapStyles.reportField}>
                <div className={rapStyles.fieldLabel}>Dato</div>
                <div className={rapStyles.fieldValue}>{new Date(dato).toLocaleDateString("no-NO", { day: "2-digit", month: "2-digit", year: "numeric" })}</div>
              </div>
              {sted && (
                <div className={rapStyles.reportField}>
                  <div className={rapStyles.fieldLabel}>Sted</div>
                  <div className={rapStyles.fieldValue}>{sted}</div>
                </div>
              )}
              <div className={rapStyles.reportField}>
                <div className={rapStyles.fieldLabel}>Avvikstype</div>
                <div className={rapStyles.fieldValue} style={{ color: avvikType === "ergonomi" ? "var(--blue)" : avvikType === "sikkerhet" ? "var(--red)" : "var(--green)" }}>
                  {avvikType === "miljo" ? "Miljø" : avvikType ? avvikType.charAt(0).toUpperCase() + avvikType.slice(1) : ""}
                </div>
              </div>
              <div className={rapStyles.reportField}>
                <div className={rapStyles.fieldLabel}>Alvorlighetsgrad</div>
                <div className={rapStyles.fieldValue} style={{ color: alvorlighetColor[alvorlighet] }}>
                  {alvorlighetLabel[alvorlighet]}
                </div>
              </div>
            </div>

            <div className={rapStyles.reportDivider} />
            <div className={rapStyles.reportSection}>
              <div className={rapStyles.fieldLabel}>Hva skjedde?</div>
              <div className={rapStyles.fieldBody}>{hvaSkjedde}</div>
            </div>

            <div className={rapStyles.reportDivider} />
            <div className={rapStyles.reportSection}>
              <div className={rapStyles.fieldLabel}>Hvorfor skjedde det?</div>
              <div className={rapStyles.fieldBody}>{hvorfor}</div>
            </div>

            <div className={rapStyles.reportDivider} />
            <div className={rapStyles.reportSection}>
              <div className={rapStyles.fieldLabel}>Hva kan gjøres for å forhindre det?</div>
              <div className={rapStyles.fieldBody}>{forhindre}</div>
            </div>

            <div className={rapStyles.reportDivider} />
            <div className={rapStyles.reportFooter}>
              <div className={rapStyles.footerSig}>
                <div className={rapStyles.fieldLabel}>Registrert av</div>
                <div className={rapStyles.sigLine} />
                <div className={rapStyles.fieldValue}>{user?.username || user?.hash}</div>
              </div>
              <div className={rapStyles.footerActions}>
                <button className={styles.btn} onClick={reset}>Ny rapport</button>
                <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => window.print()}>Skriv ut</button>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className={rapStyles.pageHeader}>
              <div className={rapStyles.pageTitle}>// NY AVVIKSRAPPORT</div>
              <div className={rapStyles.pageSub}>Fyll ut alle felt og send inn. Admin vil behandle rapporten.</div>
            </div>

            <div className={rapStyles.formWrap}>
              <div className={rapStyles.formRow}>
                <div className={styles.field} style={{ flex: 1 }}>
                  <label>Dato</label>
                  <input type="date" value={dato} onChange={e => setDato(e.target.value)} />
                </div>
                <div className={styles.field} style={{ flex: 2 }}>
                  <label>Sted / rom</label>
                  <input type="text" placeholder="Klasserom?" value={sted} onChange={e => setSted(e.target.value)} />
                </div>
              </div>

              <div className={styles.field}>
                <label>Type avvik *</label>
                <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                  {(["ergonomi", "sikkerhet", "miljo"] as const).map((type) => (
                    <button key={type} type="button" onClick={() => setAvvikType(type)} style={{
                      flex: 1, padding: "8px 4px",
                      fontFamily: "IBM Plex Mono, monospace", fontSize: 11,
                      textTransform: "uppercase", letterSpacing: "0.05em",
                      border: avvikType === type ? "1px solid #e2e8f0" : "1px solid #2a2a2a",
                      background: avvikType === type ? "#1a1a1a" : "transparent",
                      color: avvikType === type
                        ? type === "ergonomi" ? "var(--blue)" : type === "sikkerhet" ? "var(--red)" : "var(--green)"
                        : "#555",
                      borderRadius: 4, cursor: "pointer", transition: "all 0.15s",
                    }}>
                      {type === "miljo" ? "Miljø" : type.charAt(0).toUpperCase() + type.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.field}>
                <label>Alvorlighetsgrad *</label>
                <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                  {(["lav", "middels", "hoy"] as const).map((lvl) => (
                    <button key={lvl} type="button" onClick={() => setAlvorlighet(lvl)} style={{
                      flex: 1, padding: "8px 4px",
                      fontFamily: "IBM Plex Mono, monospace", fontSize: 11,
                      textTransform: "uppercase", letterSpacing: "0.05em",
                      border: alvorlighet === lvl ? "1px solid #e2e8f0" : "1px solid #2a2a2a",
                      background: alvorlighet === lvl ? "#1a1a1a" : "transparent",
                      color: alvorlighet === lvl
                        ? lvl === "lav" ? "var(--green)" : lvl === "middels" ? "var(--yellow)" : "var(--red)"
                        : "#555",
                      borderRadius: 4, cursor: "pointer", transition: "all 0.15s",
                    }}>
                      {lvl === "hoy" ? "Høy" : lvl.charAt(0).toUpperCase() + lvl.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className={rapStyles.divider} />

              <div className={styles.field}>
                <label>Hva skjedde? *</label>
                <textarea rows={4} placeholder="skriv beskrivelse" value={hvaSkjedde} onChange={e => setHvaSkjedde(e.target.value)} />
              </div>

              <div className={styles.field}>
                <label>Hvorfor skjedde det? *</label>
                <textarea rows={3} placeholder="hvorfor skjedde det?" value={hvorfor} onChange={e => setHvorfor(e.target.value)} />
              </div>

              <div className={styles.field}>
                <label>Hva kan gjøres for å forhindre det? *</label>
                <textarea rows={3} placeholder="konkrete tiltak?" value={forhindre} onChange={e => setForhindre(e.target.value)} />
              </div>

              <div className={rapStyles.formFooter}>
                <div className={rapStyles.formMeta}>
                  Registreres som: <span>{user?.username || user?.hash}</span>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button className={styles.btn} onClick={reset}>Nullstill</button>
                  <button
                    className={`${styles.btn} ${styles.btnPrimary}`}
                    onClick={handleSubmit}
                    disabled={!canSubmit()}
                  >
                    Generer rapport →
                  </button>
                </div>
              </div>
            </div>

          </>
        )}
      </main>
    </div>
  );
}
