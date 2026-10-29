import type { CSSProperties } from 'react'

export type IconName =
  | 'arrow-right'
  | 'arrow-left'
  | 'arrow-up-right'
  | 'chevron'
  | 'plus'
  | 'close'
  | 'users'
  | 'history'
  | 'undo'
  | 'reset'
  | 'check'
  | 'edit'
  | 'trash'
  | 'info'
  | 'home'
  | 'crown'

const paths: Record<IconName, string> = {
  'arrow-right': 'M4 12h15m-6-6 6 6-6 6',
  'arrow-left': 'M20 12H5m6-6-6 6 6 6',
  'arrow-up-right': 'M6 18 18 6M6 6h12v12',
  chevron: 'm9 5 7 7-7 7',
  plus: 'M12 5v14M5 12h14',
  close: 'm6 6 12 12M18 6 6 18',
  users:
    'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m20 0v-2a4 4 0 0 0-3-3.87M15 3.13a4 4 0 0 1 0 7.75M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z',
  history: 'M3 10a9 9 0 1 1 .8 6M3 4v6h6m3-3v5l3 2',
  undo: 'M9 5 3 11l6 6M3 11h11a6 6 0 0 1 6 6v2',
  reset: 'M3 10a9 9 0 1 1 .8 6M3 4v6h6',
  check: 'm5 12 4 4L19 6',
  edit: 'm16 3 5 5M4 20l5-1L21 7a2 2 0 0 0-5-5L4 14l-1 7Z',
  trash: 'M3 6h18M9 6V4h6v2M5 6l1 15h12l1-15M10 10v7m4-7v7',
  info: 'M12 11v6m0-10h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z',
  home: 'm3 10 9-7 9 7v11h-6v-7H9v7H3Z',
  crown: 'm3 6 5 5 4-8 4 8 5-5-2 13H5L3 6Zm2 16h14',
}

export function Icon({
  name,
  size = 20,
  className = '',
}: {
  name: IconName
  size?: number
  className?: string
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  )
}

export type SuitName = 'spade' | 'heart' | 'club' | 'diamond'
const suitPaths: Record<SuitName, string> = {
  spade:
    'M12 1C9 5 2 8.6 2 14a5.1 5.1 0 0 0 8.4 3.9L8 23h8l-2.4-5.1A5.1 5.1 0 0 0 22 14C22 8.6 15 5 12 1Z',
  heart: 'M12 22C9 18.8 1 13.6 1 7.5A6 6 0 0 1 12 4a6 6 0 0 1 11 3.5C23 13.6 15 18.8 12 22Z',
  club: 'M12 1a5 5 0 0 0-4.3 7.6A5.6 5.6 0 1 0 10 18l-2 5h8l-2-5a5.6 5.6 0 1 0 2.3-9.4A5 5 0 0 0 12 1Z',
  diamond: 'M12 0 23 12 12 24 1 12Z',
}

export function Suit({
  name = 'spade',
  size = 24,
  className = '',
  style,
}: {
  name?: SuitName
  size?: number
  className?: string
  style?: CSSProperties
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={`suit suit-${name} ${className}`}
      style={style}
      fill="currentColor"
      aria-hidden="true"
    >
      <path d={suitPaths[name]} />
    </svg>
  )
}

export function SuitDivider() {
  return (
    <div className="suit-divider" aria-hidden="true">
      <span />
      <Suit name="spade" size={13} />
      <Suit name="heart" size={13} />
      <Suit name="club" size={13} />
      <Suit name="diamond" size={13} />
      <span />
    </div>
  )
}

export function CrownArt({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 220 172" className={`crown-art ${className}`} fill="none" aria-hidden="true">
      <path
        d="M65 142C27 124 22 86 41 55m114 87c38-18 43-56 24-87"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      {Array.from({ length: 6 }, (_, index) => (
        <g key={index} transform={`rotate(${index * 15} 110 83)`}>
          <path
            d="M40 95q-20-5-17-20 16 2 17 20Zm0 0q14-15 4-27-12 10-4 27Z"
            fill="currentColor"
            opacity={0.55 + index * 0.05}
          />
          <path
            d="M180 95q20-5 17-20-16 2-17 20Zm0 0q-14-15-4-27 12 10 4 27Z"
            fill="currentColor"
            opacity={0.55 + index * 0.05}
          />
        </g>
      ))}
      <path
        d="m62 65 24 18 24-42 24 42 24-18-10 53H72L62 65Z"
        fill="#E7B957"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="m73 84 14 10 23-36 23 36 14-10-6 23H79l-6-23Z" fill="#F9E2A1" />
      <path d="M73 119h74v12H73z" fill="#E7B957" stroke="currentColor" strokeWidth="2" />
      <path d="m110 84 7 10-7 10-7-10 7-10Z" fill="#A33C35" />
      <circle cx="61" cy="60" r="5" fill="#E7B957" stroke="currentColor" strokeWidth="2" />
      <circle cx="110" cy="35" r="5" fill="#E7B957" stroke="currentColor" strokeWidth="2" />
      <circle cx="159" cy="60" r="5" fill="#E7B957" stroke="currentColor" strokeWidth="2" />
      <path
        d="m110 6 2 6 6 2-6 2-2 6-2-6-6-2 6-2 2-6ZM16 41l2 5 5 2-5 2-2 5-2-5-5-2 5-2 2-5Zm188 0 2 5 5 2-5 2-2 5-2-5-5-2 5-2 2-5Z"
        fill="currentColor"
      />
      <path d="M93 148h34m-24 6h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}
