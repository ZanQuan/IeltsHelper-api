import './whale-mascot.css';

interface WhaleMascotProps {
  email: string;
  isPasswordFocused: boolean;
}

export default function WhaleMascot({ email, isPasswordFocused }: WhaleMascotProps) {
  const maxLen = 24;
  const progress = Math.max(0, Math.min(email.length, maxLen)) / maxLen; // 0..1
  const eyeShift = (progress - 0.5) * 16; 

  return (
    <div className={`whale-mascot ${isPasswordFocused ? 'is-shy' : ''}`}>
      <svg viewBox="0 0 220 200" width="150" height="136">
        <g className="whale-spout">
          <path d="M100 12 Q104 2 108 12" />
          <path d="M112 16 Q116 6 120 16" />
          <path d="M92 16 Q96 8 100 16" />
        </g>

        <path
          className="whale-body"
          d="M20 110 C20 55 65 25 115 25 C165 25 200 55 200 105
             C200 150 165 178 112 178 C60 178 20 155 20 110 Z"
        />

        <path
          className="whale-belly"
          d="M45 130 C45 155 75 168 112 168 C150 168 180 152 182 125
             C160 150 70 150 45 130 Z"
        />

        <g className="whale-eye" transform="translate(80,88)">
          <circle className="eye-white" r="18" />
          <circle className="eye-pupil" r="8" style={{ transform: `translateX(${eyeShift}px)` }} />
        </g>
        <g className="whale-eye" transform="translate(140,88)">
          <circle className="eye-white" r="18" />
          <circle className="eye-pupil" r="8" style={{ transform: `translateX(${eyeShift}px)` }} />
        </g>

        <circle className="whale-cheek" cx="62" cy="112" r="10" />
        <circle className="whale-cheek" cx="158" cy="112" r="10" />

        <path className="whale-mouth" d="M95 125 Q112 138 129 125" />

        <g className="whale-flipper whale-flipper-left">
          <path d="M5 95 C -15 100 -15 130 10 135 C 35 140 55 125 55 110 C 55 95 25 90 5 95 Z" />
        </g>
        <g className="whale-flipper whale-flipper-right">
          <path d="M215 95 C 235 100 235 130 210 135 C 185 140 165 125 165 110 C 165 95 195 90 215 95 Z" />
        </g>
      </svg>
    </div>
  );
}