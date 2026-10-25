/** Original vector artwork; intentionally illustrative, not a model photograph. */
export function CarIllustration({
  category = "Sedan",
  color = "#62757c",
}: {
  category?: string;
  color?: string;
}) {
  const tall = /suv|truck|crossover/i.test(category);
  return (
    <svg
      viewBox="0 0 420 175"
      fill="none"
      aria-hidden="true"
      className="car-illustration"
    >
      <ellipse
        cx="215"
        cy="143"
        rx="164"
        ry="11"
        fill="#18232b"
        opacity=".09"
      />
      <path
        d={
          tall
            ? "M39 108L62 74L119 67L150 35H274L319 77L370 91L388 121L376 138H40Z"
            : "M34 111L63 91L114 81L156 46H257L309 82L365 95L388 119L376 138H40Z"
        }
        fill={color}
      />
      <path
        d={
          tall
            ? "M134 67L159 42H207V71H132ZM215 42H268L299 73H215Z"
            : "M131 81L163 53H207V81ZM215 53H251L288 81H215Z"
        }
        fill="#263843"
      />
      <path
        d="M47 111L102 104M313 100L368 112"
        stroke="#fff"
        strokeWidth="5"
        strokeLinecap="round"
        opacity=".8"
      />
      <path
        d="M120 91H301M154 128H279"
        stroke="#fff"
        strokeOpacity=".23"
        strokeWidth="2"
      />
      <path
        d="M209 91V123M273 92L290 122"
        stroke="#253941"
        strokeOpacity=".35"
      />
      <path
        d="M188 96H199M251 96H262"
        stroke="#20313b"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path d="M39 130H377" stroke="#26333a" strokeWidth="7" />
      {[110, 311].map((x) => (
        <g key={x}>
          <circle cx={x} cy="132" r="27" fill="#202a31" />
          <circle cx={x} cy="132" r="16" fill="#b9c2c6" />
          <circle cx={x} cy="132" r="9" fill="#58666e" />
          <circle cx={x} cy="132" r="4" fill="#dce2e5" />
        </g>
      ))}
    </svg>
  );
}
