// src/components/ui/SectionHeader.js
export default function SectionHeader({ badge, title, subtitle, align = 'left' }) {
  const isCenter = align === 'center'
  const isRight = align === 'right'

  return (
    <div style={{
      maxWidth: '672px',
      textAlign: isCenter ? 'center' : isRight ? 'right' : 'left',
      marginLeft: isCenter ? 'auto' : isRight ? 'auto' : 0,
      marginRight: isCenter ? 'auto' : 0,
      marginBottom: '40px',
    }}>
      {badge && (
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 16px',
          borderRadius: '999px',
          background: 'rgba(27, 42, 74, 0.06)',
          border: '1px solid rgba(27, 42, 74, 0.1)',
          fontSize: '11px',
          fontWeight: 700,
          color: '#1B2A4A',
          textTransform: 'uppercase',
          letterSpacing: '1.2px',
          marginBottom: '16px',
        }}>
          <span style={{
            width: '6px',
            height: '6px',
            background: '#E8A838',
            borderRadius: '50%',
          }} />
          {badge}
        </div>
      )}
      {title && (
        <h2 style={{
          fontFamily: 'Playfair Display, serif',
          fontWeight: 800,
          fontSize: 'clamp(24px, 4vw, 40px)',
          color: '#1A1D23',
          lineHeight: 1.15,
          marginBottom: subtitle ? '12px' : 0,
          letterSpacing: '-0.5px',
        }}>
          {title}
        </h2>
      )}
      {subtitle && (
        <p style={{
          color: '#6B7280',
          fontSize: '16px',
          lineHeight: 1.65,
        }}>
          {subtitle}
        </p>
      )}
    </div>
  )
}