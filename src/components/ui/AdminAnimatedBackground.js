// src/components/ui/AdminAnimatedBackground.js
'use client'
import { useEffect, useRef } from 'react'

export default function AdminAnimatedBackground() {
  const canvasRef = useRef(null)
  const mouseRef = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animationId
    let time = 0
    let particles = []
    let codeLines = []
    let glitchBlocks = []
    let hexGrid = []

    function resize() {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      initHexGrid()
    }
    resize()
    window.addEventListener('resize', resize)

    function handleMouse(e) {
      mouseRef.current = { x: e.clientX, y: e.clientY }
    }
    window.addEventListener('mousemove', handleMouse)

    // ── Hex grid nodes ──
    function initHexGrid() {
      hexGrid = []
      const spacing = 80
      for (let x = 0; x < canvas.width + spacing; x += spacing) {
        for (let y = 0; y < canvas.height + spacing; y += spacing) {
          const offsetX = (Math.floor(y / spacing) % 2) * (spacing / 2)
          hexGrid.push({
            x: x + offsetX,
            y: y,
            baseOpacity: 0.03 + Math.random() * 0.04,
            pulseOffset: Math.random() * Math.PI * 2,
            pulseSpeed: 0.003 + Math.random() * 0.005,
          })
        }
      }
    }

    // ── Floating code-like particles ──
    class CodeParticle {
      constructor() { this.reset() }
      reset() {
        this.x = Math.random() * canvas.width
        this.y = canvas.height + Math.random() * 100
        this.speed = 0.3 + Math.random() * 0.8
        this.opacity = 0
        this.maxOpacity = 0.15 + Math.random() * 0.25
        this.fadeIn = true
        this.size = 9 + Math.random() * 4
        this.chars = this.genChars()
        this.drift = (Math.random() - 0.5) * 0.3
        this.life = 0
        this.maxLife = 300 + Math.random() * 400
      }
      genChars() {
        const sets = [
          'LOGIN',
    
          '█████', '▓▓▓▓▓', '░░░░░',
        
          'LDCE', 'PANEL', 'ADMIN',
          '■■■■', '◆◆◆◆',
        ]
        return sets[Math.floor(Math.random() * sets.length)]
      }
      update() {
        this.y -= this.speed
        this.x += this.drift
        this.life++

        if (this.life < 40) {
          this.opacity = (this.life / 40) * this.maxOpacity
        } else if (this.life > this.maxLife - 60) {
          this.opacity = ((this.maxLife - this.life) / 60) * this.maxOpacity
        }

        // Mouse interaction
        const mx = mouseRef.current.x
        const my = mouseRef.current.y
        const dx = this.x - mx
        const dy = this.y - my
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < 120) {
          const force = (120 - dist) / 120 * 0.15
          this.opacity = Math.min(this.maxOpacity * 2, this.opacity + force * 0.1)
        }

        if (this.y < -50 || this.life > this.maxLife) this.reset()
      }
      draw(ctx) {
        ctx.font = `${this.size}px 'JetBrains Mono', monospace`
        ctx.fillStyle = `rgba(232, 168, 56, ${this.opacity})`
        ctx.fillText(this.chars, this.x, this.y)
      }
    }

    // ── Glitch blocks ──
    class GlitchBlock {
      constructor() { this.reset() }
      reset() {
        this.x = Math.random() * canvas.width
        this.y = Math.random() * canvas.height
        this.width = 20 + Math.random() * 120
        this.height = 2 + Math.random() * 6
        this.opacity = 0
        this.timer = 200 + Math.random() * 500
        this.active = false
        this.duration = 3 + Math.random() * 8
        this.frame = 0
        this.color = Math.random() > 0.6 ? 'gold' : 'navy'
      }
      update() {
        this.timer--
        if (this.timer <= 0 && !this.active) {
          this.active = true
          this.frame = 0
          this.x = Math.random() * canvas.width
          this.y = Math.random() * canvas.height
        }
        if (this.active) {
          this.frame++
          this.opacity = Math.sin((this.frame / this.duration) * Math.PI) * 0.25
          if (this.frame >= this.duration) {
            this.active = false
            this.timer = 150 + Math.random() * 600
            this.opacity = 0
          }
        }
      }
      draw(ctx) {
        if (!this.active || this.opacity <= 0) return
        if (this.color === 'gold') {
          ctx.fillStyle = `rgba(232, 168, 56, ${this.opacity})`
        } else {
          ctx.fillStyle = `rgba(27, 42, 74, ${this.opacity * 0.6})`
        }
        ctx.fillRect(this.x, this.y, this.width, this.height)
      }
    }

    // ── Scanning line ──
    class ScanLine {
      constructor() {
        this.y = 0
        this.speed = 1.2
        this.opacity = 0.06
      }
      update() {
        this.y += this.speed
        if (this.y > canvas.height) this.y = -10
      }
      draw(ctx) {
        const gradient = ctx.createLinearGradient(0, this.y - 5, 0, this.y + 5)
        gradient.addColorStop(0, 'rgba(232, 168, 56, 0)')
        gradient.addColorStop(0.5, `rgba(232, 168, 56, ${this.opacity})`)
        gradient.addColorStop(1, 'rgba(232, 168, 56, 0)')
        ctx.fillStyle = gradient
        ctx.fillRect(0, this.y - 5, canvas.width, 10)
      }
    }

    // ── Initialize ──
    const particleCount = Math.min(35, Math.floor((canvas.width * canvas.height) / 30000))
    for (let i = 0; i < particleCount; i++) {
      const p = new CodeParticle()
      p.y = Math.random() * canvas.height
      p.life = Math.random() * p.maxLife
      particles.push(p)
    }

    for (let i = 0; i < 12; i++) {
      const g = new GlitchBlock()
      g.timer = Math.random() * 300
      glitchBlocks.push(g)
    }

    const scanLine = new ScanLine()

    // ── Draw hex grid ──
    function drawHexGrid(ctx, t) {
      const mx = mouseRef.current.x
      const my = mouseRef.current.y

      hexGrid.forEach(node => {
        const dx = node.x - mx
        const dy = node.y - my
        const dist = Math.sqrt(dx * dx + dy * dy)
        const mouseInfluence = dist < 180 ? (1 - dist / 180) * 0.3 : 0
        const pulse = Math.sin(t * node.pulseSpeed + node.pulseOffset) * 0.02
        const opacity = node.baseOpacity + pulse + mouseInfluence

        // Node dot
        ctx.beginPath()
        ctx.arc(node.x, node.y, mouseInfluence > 0.1 ? 2 : 1, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(232, 168, 56, ${opacity})`
        ctx.fill()

        // Glow on mouse proximity
        if (mouseInfluence > 0.05) {
          ctx.beginPath()
          ctx.arc(node.x, node.y, 12, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(232, 168, 56, ${mouseInfluence * 0.08})`
          ctx.fill()
        }
      })

      // Connection lines near mouse
      for (let i = 0; i < hexGrid.length; i++) {
        const a = hexGrid[i]
        const dxA = a.x - mx
        const dyA = a.y - my
        const distA = Math.sqrt(dxA * dxA + dyA * dyA)
        if (distA > 200) continue

        for (let j = i + 1; j < hexGrid.length; j++) {
          const b = hexGrid[j]
          const dxB = a.x - b.x
          const dyB = a.y - b.y
          const nodeDist = Math.sqrt(dxB * dxB + dyB * dyB)
          if (nodeDist > 100) continue

          const distB = Math.sqrt((b.x - mx) ** 2 + (b.y - my) ** 2)
          if (distB > 200) continue

          const avgDist = (distA + distB) / 2
          const lineOpacity = (1 - avgDist / 200) * 0.08

          ctx.beginPath()
          ctx.moveTo(a.x, a.y)
          ctx.lineTo(b.x, b.y)
          ctx.strokeStyle = `rgba(232, 168, 56, ${lineOpacity})`
          ctx.lineWidth = 0.5
          ctx.stroke()
        }
      }
    }

    // ── Radial vignette ──
    function drawVignette(ctx) {
      const gradient = ctx.createRadialGradient(
        canvas.width * 0.5, canvas.height * 0.5, canvas.width * 0.15,
        canvas.width * 0.5, canvas.height * 0.5, canvas.width * 0.8
      )
      gradient.addColorStop(0, 'rgba(27, 42, 74, 0.03)')
      gradient.addColorStop(0.5, 'rgba(13, 24, 41, 0.06)')
      gradient.addColorStop(1, 'rgba(13, 24, 41, 0.15)')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }

    // ── Data stream edges ──
    function drawDataStreams(ctx, t) {
      // Left edge
      for (let i = 0; i < 4; i++) {
        const y = ((t * 0.5 + i * 250) % (canvas.height + 100)) - 50
        const gradient = ctx.createLinearGradient(0, y - 20, 0, y + 20)
        gradient.addColorStop(0, 'rgba(232, 168, 56, 0)')
        gradient.addColorStop(0.5, 'rgba(232, 168, 56, 0.04)')
        gradient.addColorStop(1, 'rgba(232, 168, 56, 0)')
        ctx.fillStyle = gradient
        ctx.fillRect(0, y - 20, 3, 40)
      }

      // Right edge
      for (let i = 0; i < 4; i++) {
        const y = ((-t * 0.4 + i * 300 + 1000) % (canvas.height + 100)) - 50
        const gradient = ctx.createLinearGradient(0, y - 20, 0, y + 20)
        gradient.addColorStop(0, 'rgba(27, 42, 74, 0)')
        gradient.addColorStop(0.5, 'rgba(27, 42, 74, 0.06)')
        gradient.addColorStop(1, 'rgba(27, 42, 74, 0)')
        ctx.fillStyle = gradient
        ctx.fillRect(canvas.width - 3, y - 20, 3, 40)
      }
    }

    // ── Animate ──
    function animate() {
      time++
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      drawHexGrid(ctx, time)
      drawDataStreams(ctx, time)

      particles.forEach(p => { p.update(); p.draw(ctx) })
      glitchBlocks.forEach(g => { g.update(); g.draw(ctx) })
      scanLine.update()
      scanLine.draw(ctx)

      drawVignette(ctx)

      animationId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', handleMouse)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  )
}