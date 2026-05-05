// src/components/ui/OTPInput.js
'use client'
import { useRef } from 'react'

export default function OTPInput({ length = 6, value, onChange, disabled = false }) {
  const inputs = useRef([])

  function handleChange(e, index) {
    const val = e.target.value.replace(/\D/g, '').slice(-1)
    const arr = value.split('')
    arr[index] = val
    const newVal = arr.join('').slice(0, length)
    onChange(newVal)
    if (val && index < length - 1) {
      inputs.current[index + 1]?.focus()
    }
  }

  function handleKeyDown(e, index) {
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      inputs.current[index - 1]?.focus()
    }
  }

  function handlePaste(e) {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
    onChange(pasted)
    const focusIdx = Math.min(pasted.length, length - 1)
    inputs.current[focusIdx]?.focus()
  }

  return (
    <div style={{
      display: 'flex',
      gap: '10px',
      justifyContent: 'center',
    }}>
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={el => inputs.current[i] = el}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] || ''}
          onChange={e => handleChange(e, i)}
          onKeyDown={e => handleKeyDown(e, i)}
          onPaste={handlePaste}
          disabled={disabled}
          style={{
            width: '50px',
            height: '60px',
            fontSize: '1.5rem',
            textAlign: 'center',
            background: '#FFFFFF',
            border: value[i]
              ? '2px solid #E8A838'
              : '2px solid #E5E7EB',
            borderRadius: '12px',
            color: value[i] ? '#1B2A4A' : '#1A1D23',
            fontWeight: 700,
            transition: 'all 0.2s ease',
            outline: 'none',
            boxShadow: value[i]
              ? '0 0 15px rgba(232, 168, 56, 0.15)'
              : 'none',
            opacity: disabled ? 0.5 : 1,
            cursor: disabled ? 'not-allowed' : 'text',
          }}
          onFocus={e => {
            if (!disabled) {
              e.target.style.borderColor = '#E8A838'
              e.target.style.boxShadow = '0 0 15px rgba(232, 168, 56, 0.2)'
            }
          }}
          onBlur={e => {
            if (!value[i]) {
              e.target.style.borderColor = '#E5E7EB'
              e.target.style.boxShadow = 'none'
            }
          }}
        />
      ))}
    </div>
  )
}