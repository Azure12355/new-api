/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
import { useEffect, useRef, useState } from 'react'

/*
 * Model Hub home background: a flat deep-blue field with purple pixel waves,
 * a stepped pixel aurora and fixed stars. Raw WebGL (no library), drawn at
 * CSS-pixel resolution because the art is pixelated anyway.
 * Colors are flat steps on a pixel grid; nothing is a smooth gradient.
 */

const VERTEX = `attribute vec2 p; void main(){ gl_Position = vec4(p, 0., 1.); }`

const FRAGMENT = `precision highp float;
uniform float t; uniform vec2 res; uniform vec2 mouse; uniform float cell; uniform float shift;
float hash(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
float noise(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f*f*(3.-2.*f);
  return mix(mix(hash(i), hash(i+vec2(1.,0.)), u.x), mix(hash(i+vec2(0.,1.)), hash(i+vec2(1.,1.)), u.x), u.y); }
float fbm(vec2 p){ float v = 0., a = .5; for (int i = 0; i < 4; i++){ v += a*noise(p); p = p*2.02 + 13.7; a *= .5; } return v; }
float crest(float k, float x, float tt){
  float b = mix(.13, .33, smoothstep(0., 1.1, x)) - k*.075;
  float a = .05 - k*.007;
  return b + a*sin(x*(5.2 + k*1.7) + tt*(.55 - k*.12) + k*2.1)
           + a*.6*sin(x*(11. + k*2.3) - tt*(.42 + k*.1) + k)
           + .03*(fbm(vec2(x*2.5 + k*4., tt*.12)) - .5);
}
float steps(float v, float n){ return floor(v*n + .5)/n; }
void main(){
  vec2 fc = gl_FragCoord.xy;
  vec2 id = floor(fc / cell), lc = fract(fc / cell);
  float inside = step(lc.x, 1. - 2./cell) * step(lc.y, 1. - 2./cell);
  vec2 cu = (id + .5) * cell / res;
  float rnd = hash(id);
  float tt = t*.55;

  // flat deep blue field
  vec3 c = vec3(.031, .043, .157);

  // pixel aurora: two slow curtains, brightness snapped to 4 steps
  float au = 0.; float hi = 0.;
  for (int i = 0; i < 2; i++){
    float fi = float(i);
    float y0 = .82 - fi*.13 + .05*sin(cu.x*(2.6 + fi) + t*.07 + fi*2.) + .07*(fbm(vec2(cu.x*1.8 + fi*5., t*.025)) - .5);
    float d = cu.y - y0;
    float curtain = smoothstep(-.22, -.01, d) * smoothstep(.09, 0., d);
    float rays = .40 + .60*fbm(vec2(cu.x*16. + fi*7., t*.04));
    float s = curtain * rays * (.62 - fi*.2) * smoothstep(.05, .8, cu.x);
    if (s > au){ au = s; hi = step(-.05, d); }
  }
  au = steps(clamp(au, 0., 1.), 4.);
  vec3 auc = hi > .5 ? vec3(.62, .46, 1.) : vec3(.36, .24, .92);
  c = mix(c, auc, au * .62 * inside);

  // fixed stars + a few slow plus-shaped sparkles
  float star = step(.9945, hash(id + 31.7)) * step(.45, cu.y);
  c = mix(c, vec3(.86, .84, 1.), star * (.35 + .3*rnd) * inside);
  vec2 sid = floor(id / 9.);
  vec2 sp = floor(vec2(hash(sid + 3.1), hash(sid + 7.7)) * 9.);
  float glow = step(.86, hash(sid + 1.3)) * step(.5, cu.y) * max(0., sin(t*.5 + hash(sid)*6.283));
  vec2 dd = abs(id - (sid*9. + sp));
  float plus = (dd.x + dd.y < .5) ? 1. : ((dd.x + dd.y < 1.5 && min(dd.x, dd.y) < .5) ? .45 : 0.);
  c = mix(c, vec3(.92, .90, 1.), steps(plus*glow, 3.) * inside);

  // purple pixel waves (three layers, flat colors, stepped alpha)
  float lift = .05 * exp(-pow((fc.x - mouse.x)/180., 2.)) * smoothstep(320., 0., abs(fc.y - mouse.y));
  vec3 lay0 = vec3(.17, .23, .82);
  vec3 lay1 = vec3(.42, .29, 1.);
  vec3 lay2 = vec3(.66, .54, 1.);
  float wa = 0.; vec3 wc = vec3(0.);
  for (int k = 0; k < 3; k++){
    float fk = float(k);
    vec3 col = k == 0 ? lay0 : (k == 1 ? lay1 : lay2);
    float h = crest(2. - fk, cu.x, tt) + lift*(.6 + .2*fk) + shift;
    float depth = h - cu.y;
    if (depth > 0.){
      if (depth < 1.2*cell/res.y){ wc = vec3(.84, .79, 1.); wa = .78 + .07*fk; }
      else {
        float v = (.36 + .16*fk) * (1. - smoothstep(0., .26 - fk*.03, depth));
        v *= .75 + .4*rnd;
        wc = col; wa = steps(clamp(v, 0., .75), 4.);
      }
    }
  }
  // orange request pixels riding the front crest
  for (int j = 0; j < 3; j++){
    float px = fract(t*.022 + float(j)*.37);
    float colx = floor(px*res.x/cell);
    float row = floor((crest(0., (colx + .5)*cell/res.x, tt) + shift) * res.y / cell);
    if (id.x <= colx && id.x > colx - 3. && id.y == row){ wc = vec3(1., .48, 0.); wa = .95 - (colx - id.x)*.25; }
  }
  c = mix(c, wc, wa * inside);
  gl_FragColor = vec4(c, 1.);
}`

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const s = gl.createShader(type)
  if (!s) throw new Error('createShader failed')
  gl.shaderSource(s, src)
  gl.compileShader(s)
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(s) || 'shader compile failed')
  }
  return s
}

interface PixelSkyProps {
  /**
   * Fill the positioned parent instead of the viewport (auth side panel):
   * sized by the canvas box, pointer measured relative to it, no scroll sink.
   */
  contained?: boolean
}

export function PixelSky(props: PixelSkyProps) {
  const contained = props.contained === true
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    let gl: WebGLRenderingContext | null = null
    try {
      gl = canvas.getContext('webgl', {
        antialias: false,
        powerPreference: 'low-power',
      })
    } catch {
      gl = null
    }
    if (!gl) {
      setFailed(true)
      return
    }

    let prog: WebGLProgram | null
    try {
      prog = gl.createProgram()
      if (!prog) throw new Error('createProgram failed')
      gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERTEX))
      gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAGMENT))
      gl.linkProgram(prog)
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        throw new Error(gl.getProgramInfoLog(prog) || 'link failed')
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('pixel sky disabled:', err)
      setFailed(true)
      return
    }
    const g = gl
    g.useProgram(prog)
    g.bindBuffer(g.ARRAY_BUFFER, g.createBuffer())
    g.bufferData(
      g.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      g.STATIC_DRAW
    )
    const loc = g.getAttribLocation(prog, 'p')
    g.enableVertexAttribArray(loc)
    g.vertexAttribPointer(loc, 2, g.FLOAT, false, 0, 0)
    const uT = g.getUniformLocation(prog, 't')
    const uRes = g.getUniformLocation(prog, 'res')
    const uMouse = g.getUniformLocation(prog, 'mouse')
    const uCell = g.getUniformLocation(prog, 'cell')
    const uShift = g.getUniformLocation(prog, 'shift')

    const reduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches
    let W = 1
    let H = 1
    const resize = () => {
      const box = contained ? canvas.getBoundingClientRect() : null
      W = Math.max(1, Math.round(box ? box.width : window.innerWidth))
      H = Math.max(1, Math.round(box ? box.height : window.innerHeight))
      canvas.width = W
      canvas.height = H
      g.viewport(0, 0, W, H)
    }
    resize()

    const mouse = { x: -9999, y: -9999, tx: -9999, ty: -9999 }
    const onMove = (e: PointerEvent) => {
      const box = contained ? canvas.getBoundingClientRect() : null
      mouse.tx = e.clientX - (box ? box.left : 0)
      mouse.ty = H - (e.clientY - (box ? box.top : 0))
      if (mouse.x < -999) {
        mouse.x = mouse.tx
        mouse.y = mouse.ty
      }
    }
    const onLeave = () => {
      mouse.tx = mouse.ty = mouse.x = mouse.y = -9999
    }

    // waves sink after the hero and come back near the end of the page
    let target = 0
    const onScroll = () => {
      if (contained) return
      const y = window.scrollY
      const vh = window.innerHeight
      const max = document.documentElement.scrollHeight - vh
      const sink = Math.min(1, y / (vh * 0.9))
      const rise = Math.max(0, Math.min(1, 1 - (max - y) / (vh * 1.1)))
      target = -0.42 * sink * (1 - rise)
    }
    onScroll()

    let shift = target
    let running = !document.hidden
    let raf = 0
    let timeout = 0
    const start = performance.now()
    const frame = (now: number) => {
      if (!running) return
      shift += (target - shift) * 0.08
      if (mouse.tx > -999) {
        mouse.x += (mouse.tx - mouse.x) * 0.12
        mouse.y += (mouse.ty - mouse.y) * 0.12
      }
      g.uniform1f(uT, reduced ? 12 : (now - start) / 1000)
      g.uniform2f(uRes, W, H)
      g.uniform2f(uMouse, mouse.x, mouse.y)
      g.uniform1f(uCell, W < 600 ? 8 : 9)
      // phones: keep the waves below the hero buttons
      g.uniform1f(uShift, shift + (W < 600 ? -0.16 : 0))
      g.drawArrays(g.TRIANGLES, 0, 3)
      if (reduced) {
        timeout = window.setTimeout(() => {
          raf = requestAnimationFrame(frame)
        }, 250)
      } else {
        raf = requestAnimationFrame(frame)
      }
    }
    const onVisibility = () => {
      const was = running
      running = !document.hidden
      if (running && !was) raf = requestAnimationFrame(frame)
    }

    const observer = contained ? new ResizeObserver(resize) : null
    observer?.observe(canvas)
    window.addEventListener('resize', resize)
    window.addEventListener('pointermove', onMove)
    document.documentElement.addEventListener('pointerleave', onLeave)
    window.addEventListener('scroll', onScroll, { passive: true })
    document.addEventListener('visibilitychange', onVisibility)
    raf = requestAnimationFrame(frame)

    return () => {
      running = false
      cancelAnimationFrame(raf)
      window.clearTimeout(timeout)
      observer?.disconnect()
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', onMove)
      document.documentElement.removeEventListener('pointerleave', onLeave)
      window.removeEventListener('scroll', onScroll)
      document.removeEventListener('visibilitychange', onVisibility)
      // no loseContext(): StrictMode re-runs this effect on the same canvas
    }
  }, [contained])

  const className = contained ? 'mh-sky mh-sky-contained' : 'mh-sky'
  if (failed) {
    return <div className={`${className} mh-sky-fallback`} aria-hidden />
  }
  return <canvas ref={canvasRef} className={className} aria-hidden />
}
