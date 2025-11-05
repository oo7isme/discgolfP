interface DgBasketIconProps {
  className?: string
  size?: number
}

export default function DgBasketIcon(props: DgBasketIconProps = {}) {
  const { className = '', size = 80 } = props;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 128 128"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Top band */}
      <rect x="40" y="24" width="48" height="8" rx="2" />
      
      {/* Chains (wider spread at top) */}
      <line x1="64" y1="32" x2="64" y2="66" />
      <line x1="54" y1="32" x2="58" y2="66" />
      <line x1="74" y1="32" x2="70" y2="66" />
      <line x1="46" y1="32" x2="52" y2="66" />
      <line x1="82" y1="32" x2="76" y2="66" />
      
      {/* Basket */}
      <rect x="36" y="66" width="56" height="8" rx="2" />
      
      {/* Vertical supports for basket rim */}
      <line x1="40" y1="66" x2="40" y2="74" />
      <line x1="88" y1="66" x2="88" y2="74" />
      
      {/* Pole */}
      <line x1="64" y1="74" x2="64" y2="104" />
      
      {/* Base */}
      <line x1="50" y1="104" x2="78" y2="104" />
    </svg>
  )
}

