// Lampada decorativa pendurada no hero.
// Acende no dark mode com glow amarelo, fica apagada (cinza) no light mode.
export default function HangingLamp() {
  return (
    <div className="hanging-lamp" aria-hidden="true">
      {/* Fio vertical descendo do topo */}
      <div className="lamp-cord" />

      {/* Halo de luz (so visivel no dark mode via CSS) */}
      <div className="lamp-glow" />

      {/* Lampada SVG — soquete em cima (conecta ao fio), bulbo embaixo */}
      <svg
        className="lamp-bulb"
        viewBox="0 0 100 140"
        width="110"
        height="154"
        fill="none"
      >
        {/* Soquete metalico no TOPO (conecta ao fio) */}
        <rect x="42" y="0" width="16" height="3" rx="1" className="lamp-socket-bottom" />
        <rect x="39" y="3" width="22" height="4" rx="1" className="lamp-socket" />
        <rect x="37" y="7" width="26" height="5" rx="1" className="lamp-socket" />
        <rect x="35" y="12" width="30" height="7" rx="1.5" className="lamp-socket lamp-socket-top" />

        {/* Vidro da lampada (pera invertida — estreita no topo, larga embaixo) */}
        <path
          d="M 35 19 L 65 19 L 65 27 Q 75 40 75 65 Q 75 105 50 125 Q 25 105 25 65 Q 25 40 35 27 Z"
          className="lamp-glass"
        />

        {/* Reflexo (highlight no canto superior) */}
        <ellipse cx="40" cy="55" rx="6" ry="11" className="lamp-highlight" transform="rotate(-15 40 55)" />

        {/* Brilho central do bulbo (so dark) */}
        <ellipse cx="50" cy="75" rx="16" ry="22" className="lamp-shine" />

        {/* Filamento em zigzag */}
        <path
          d="M 38 70 Q 41 76 44 70 Q 47 76 50 70 Q 53 76 56 70 Q 59 76 62 70"
          className="lamp-filament"
        />
        {/* Suportes do filamento (saem do soquete em direcao ao filamento) */}
        <line x1="44" y1="22" x2="38" y2="70" className="lamp-filament-leg" />
        <line x1="56" y1="22" x2="62" y2="70" className="lamp-filament-leg" />
      </svg>

      {/* Raios de luz (apenas dark) */}
      <svg className="lamp-rays" viewBox="0 0 300 300" width="300" height="300" aria-hidden="true">
        <defs>
          <radialGradient id="rayGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FCD34D" stopOpacity="0.4" />
            <stop offset="60%" stopColor="#FCD34D" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#FCD34D" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="150" cy="150" r="150" fill="url(#rayGrad)" />
      </svg>
    </div>
  )
}
