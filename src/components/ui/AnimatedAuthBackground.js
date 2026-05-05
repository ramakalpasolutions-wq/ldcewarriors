// src/components/ui/AnimatedAuthBackground.js
'use client'
import { useEffect, useRef } from 'react'

export default function AnimatedAuthBackground() {
  const canvasRef = useRef(null)
  const mouseRef = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animationId
    let particles = []
    let orbs = []
    let time = 0

    function resize() {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    function handleMouse(e) {
      mouseRef.current = { x: e.clientX, y: e.clientY }
    }
    window.addEventListener('mousemove', handleMouse)

    class Particle {
      constructor() {
        this.reset()
      }
      reset() {
        this.x = Math.random() * canvas.width
        this.y = Math.random() * canvas.height
        this.size = Math.random() * 2 + 0.5
        this.speedX = (Math.random() - 0.5) * 0.3
        this.speedY = (Math.random() - 0.5) * 0.3
        this.opacity = Math.random() * 0.5 + 0.1
        this.pulseSpeed = Math.random() * 0.02 + 0.01
        this.pulseOffset = Math.random() * Math.PI * 2
        // Navy-gold spectrum
        this.type = Math.random()
        if (this.type > 0.7) {
          this.hue = 38 // gold
          this.sat = 85
          this.light = 55
        } else if (this.type > 0.4) {
          this.hue = 215 // navy-blue
          this.sat = 45
          this.light = 45
        } else {
          this.hue = 174 // teal accent
          this.sat = 55
          this.light = 45
        }
      }
      update(t) {
        this.x += this.speedX
        this.y += this.speedY

        const mx = mouseRef.current.x
        const my = mouseRef.current.y
        const dx = this.x - mx
        const dy = this.y - my
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < 150) {
          const force = (150 - dist) / 150 * 0.5
          this.x += (dx / dist) * force
          this.y += (dy / dist) * force
        }

        this.currentOpacity = this.opacity * (0.5 + 0.5 * Math.sin(t * this.pulseSpeed + this.pulseOffset))

        if (this.x < -10) this.x = canvas.width + 10
        if (this.x > canvas.width + 10) this.x = -10
        if (this.y < -10) this.y = canvas.height + 10
        if (this.y > canvas.height + 10) this.y = -10
      }
      draw(ctx) {
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
        ctx.fillStyle = `hsla(${this.hue}, ${this.sat}%, ${this.light}%, ${this.currentOpacity})`
        ctx.fill()

        ctx.beginPath()
        ctx.arc(this.x, this.y, this.size * 3, 0, Math.PI * 2)
        ctx.fillStyle = `hsla(${this.hue}, ${this.sat}%, ${this.light}%, ${this.currentOpacity * 0.15})`
        ctx.fill()
      }
    }

    class Orb {
      constructor(index) {
        this.index = index
        this.x = Math.random() * canvas.width
        this.y = Math.random() * canvas.height
        this.radius = Math.random() * 200 + 100
        this.type = index % 3
        if (this.type === 0) {
          this.hue = 215; this.sat = 50; this.light = 30 // navy
        } else if (this.type === 1) {
          this.hue = 38; this.sat = 80; this.light = 50 // gold
        } else {
          this.hue = 174; this.sat = 50; this.light = 40 // teal
        }
        this.opacity = 0.03 + Math.random() * 0.04
        this.phaseX = Math.random() * Math.PI * 2
        this.phaseY = Math.random() * Math.PI * 2
        this.amplitudeX = 50 + Math.random() * 100
        this.amplitudeY = 30 + Math.random() * 80
        this.freqX = 0.0003 + Math.random() * 0.0005
        this.freqY = 0.0004 + Math.random() * 0.0004
      }
      update(t) {
        this.x = (canvas.width * 0.5) + Math.sin(t * this.freqX + this.phaseX) * this.amplitudeX + this.index * 150
        this.y = (canvas.height * 0.5) + Math.cos(t * this.freqY + this.phaseY) * this.amplitudeY
        this.currentRadius = this.radius + Math.sin(t * 0.001 + this.index) * 30
      }
      draw(ctx) {
        const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.currentRadius)
        gradient.addColorStop(0, `hsla(${this.hue}, ${this.sat}%, ${this.light}%, ${this.opacity})`)
        gradient.addColorStop(0.5, `hsla(${this.hue}, ${this.sat}%, ${this.light - 10}%, ${this.opacity * 0.5})`)
        gradient.addColorStop(1, `hsla(${this.hue}, ${this.sat}%, ${this.light - 15}%, 0)`)
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.currentRadius, 0, Math.PI * 2)
        ctx.fillStyle = gradient
        ctx.fill()
      }
    }

    const particleCount = Math.min(80, Math.floor((canvas.width * canvas.height) / 15000))
    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle())
    }
    for (let i = 0; i < 4; i++) {
      orbs.push(new Orb(i))
    }

    function drawConnections(ctx, particles, t) {
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 120) {
            const opacity = (1 - dist / 120) * 0.12 * (0.5 + 0.5 * Math.sin(t * 0.002))
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.strokeStyle = `rgba(232, 168, 56, ${opacity})`
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        }
      }
    }

    function drawGrid(ctx, t) {
      const spacing = 60
      const gridOpacity = 0.025 + 0.01 * Math.sin(t * 0.001)

      ctx.strokeStyle = `rgba(232, 168, 56, ${gridOpacity})`
      ctx.lineWidth = 0.5

      for (let x = 0; x < canvas.width; x += spacing) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, canvas.height)
        ctx.stroke()
      }
      for (let y = 0; y < canvas.height; y += spacing) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(canvas.width, y)
        ctx.stroke()
      }

      for (let x = 0; x < canvas.width; x += spacing) {
        for (let y = 0; y < canvas.height; y += spacing) {
          const mx = mouseRef.current.x
          const my = mouseRef.current.y
          const dx = x - mx
          const dy = y - my
          const dist = Math.sqrt(dx * dx + dy * dy)

          if (dist < 200) {
            const intensity = (1 - dist / 200) * 0.4
            ctx.beginPath()
            ctx.arc(x, y, 1.5, 0, Math.PI * 2)
            ctx.fillStyle = `rgba(232, 168, 56, ${intensity})`
            ctx.fill()

            ctx.beginPath()
            ctx.arc(x, y, 8, 0, Math.PI * 2)
            ctx.fillStyle = `rgba(232, 168, 56, ${intensity * 0.15})`
            ctx.fill()
          }
        }
      }
    }

    function drawStreaks(ctx, t) {
      for (let i = 0; i < 3; i++) {
        const progress = ((t * 0.0003 + i * 0.33) % 1)
        const x = progress * (canvas.width + 400) - 200
        const y = canvas.height * (0.2 + i * 0.3) + Math.sin(t * 0.001 + i) * 50

        const gradient = ctx.createLinearGradient(x - 100, y, x + 100, y)
        gradient.addColorStop(0, 'rgba(232, 168, 56, 0)')
        gradient.addColorStop(0.5, `rgba(232, 168, 56, ${0.04 + 0.02 * Math.sin(t * 0.003 + i)})`)
        gradient.addColorStop(1, 'rgba(232, 168, 56, 0)')

        ctx.beginPath()
        ctx.moveTo(x - 100, y)
        ctx.lineTo(x + 100, y)
        ctx.strokeStyle = gradient
        ctx.lineWidth = 1
        ctx.stroke()
      }
    }

    function animate() {
      time++
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const bgGradient = ctx.createRadialGradient(
        canvas.width * 0.5, canvas.height * 0.5, 0,
        canvas.width * 0.5, canvas.height * 0.5, canvas.width * 0.8
      )
      bgGradient.addColorStop(0, 'rgba(27, 42, 74, 0.15)')
      bgGradient.addColorStop(1, 'rgba(13, 13, 13, 0)')
      ctx.fillStyle = bgGradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      drawGrid(ctx, time)
      drawStreaks(ctx, time)

      orbs.forEach(orb => {
        orb.update(time)
        orb.draw(ctx)
      })

      particles.forEach(p => {
        p.update(time)
        p.draw(ctx)
      })

      drawConnections(ctx, particles, time)

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
    <>
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
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 0,
          background: 'radial-gradient(ellipse at center, transparent 0%, rgba(13,15,22,0.4) 70%, rgba(13,15,22,0.8) 100%)',
        }}
      />
    </>
  )
}