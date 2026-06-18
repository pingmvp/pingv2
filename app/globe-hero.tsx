"use client"

import { useRef, useMemo, useState, useEffect, Suspense } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import * as THREE from "three"
import Link from "next/link"
import { ArrowRight, Zap, Users } from "lucide-react"

// ── Globe config ─────────────────────────────────────────────────

const R       = 3.5
const GLOBE_Y = -4.5   // equator sits just below viewport bottom

const CITIES = [
  { lat:  40.71, lng:  -74.01 }, // 0  New York
  { lat:  34.05, lng: -118.24 }, // 1  Los Angeles
  { lat:  45.42, lng:  -75.69 }, // 2  Ottawa
  { lat:  19.43, lng:  -99.13 }, // 3  Mexico City
  { lat:  51.51, lng:   -0.13 }, // 4  London
  { lat:  48.85, lng:    2.35 }, // 5  Paris
  { lat:  52.52, lng:   13.41 }, // 6  Berlin
  { lat:  59.91, lng:   10.75 }, // 7  Oslo
  { lat:  35.68, lng:  139.65 }, // 8  Tokyo
  { lat:  37.57, lng:  126.98 }, // 9  Seoul
  { lat:  31.23, lng:  121.47 }, // 10 Shanghai
  { lat:   1.35, lng:  103.82 }, // 11 Singapore
  { lat:  25.20, lng:   55.27 }, // 12 Dubai
  { lat:  28.61, lng:   77.21 }, // 13 New Delhi
  { lat:  -1.29, lng:   36.82 }, // 14 Nairobi
  { lat: -23.55, lng:  -46.63 }, // 15 São Paulo
  { lat: -33.87, lng:  151.21 }, // 16 Sydney
  { lat:  55.75, lng:   37.62 }, // 17 Moscow
]

const ARCS = [
  [0,  4], [1,  8], [4, 12], [8, 16], [15, 14],
  [2,  5], [6, 10], [9,  3], [11, 15],[13,  6],
  [7, 17], [1,  4], [5, 12], [0, 17],
]

// ── Three.js helpers ─────────────────────────────────────────────

function toVec3(lat: number, lng: number, r: number) {
  const phi   = (90 - lat) * (Math.PI / 180)
  const theta = (lng + 180) * (Math.PI / 180)
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
     r * Math.cos(phi),
     r * Math.sin(phi) * Math.sin(theta),
  )
}

// ── Earth texture (D3-geo) ────────────────────────────────────────

async function buildEarthTexture(): Promise<THREE.CanvasTexture> {
  const W = 2048, H = 1024
  const canvas = document.createElement("canvas")
  canvas.width = W; canvas.height = H
  const ctx = canvas.getContext("2d")!
  ctx.fillStyle = "#0a2a5e"
  ctx.fillRect(0, 0, W, H)
  try {
    const res   = await fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json")
    const world = await res.json()
    const { feature }                     = await import("topojson-client") as any
    const { geoEquirectangular, geoPath } = await import("d3-geo")          as any
    const land = feature(world, world.objects.land)
    const proj = geoEquirectangular().scale(H / Math.PI).translate([W / 2, H / 2])
    ctx.fillStyle = "#166534"
    ctx.beginPath(); geoPath(proj, ctx)(land); ctx.fill()
  } catch {
    ctx.fillStyle = "#166534"
    const xy = (lat: number, lng: number): [number, number] =>
      [((lng + 180) / 360) * W, ((90 - lat) / 180) * H]
    const fill = (pts: [number, number][]) => {
      ctx.beginPath(); ctx.moveTo(...pts[0]); pts.slice(1).forEach(p => ctx.lineTo(...p))
      ctx.closePath(); ctx.fill()
    }
    fill([xy(71,-168),xy(60,-136),xy(49,-124),xy(32,-117),xy(22,-106),xy(9,-83),xy(25,-80),xy(40,-74),xy(47,-53),xy(62,-79),xy(69,-100),xy(71,-168)])
    fill([xy(12,-72),xy(8,-61),xy(-5,-35),xy(-23,-43),xy(-55,-68),xy(-10,-37),xy(12,-72)])
    fill([xy(36,-9),xy(51,-2),xy(59,5),xy(70,28),xy(55,22),xy(48,38),xy(38,28),xy(40,19),xy(36,-9)])
    fill([xy(37,-5),xy(31,32),xy(12,44),xy(0,42),xy(-10,40),xy(-34,19),xy(-5,40),xy(37,-5)])
    fill([xy(70,32),xy(78,105),xy(65,140),xy(35,137),xy(25,120),xy(5,100),xy(20,80),xy(30,60),xy(48,38),xy(55,82),xy(70,32)])
    fill([xy(-10,114),xy(-10,154),xy(-39,146),xy(-44,114),xy(-10,114)])
  }
  const tex = new THREE.CanvasTexture(canvas)
  tex.minFilter = THREE.LinearMipmapLinearFilter
  tex.magFilter = THREE.LinearFilter
  tex.generateMipmaps = true
  return tex
}

// ── Globe mesh ────────────────────────────────────────────────────

function GlobeMesh() {
  const [texture, setTexture] = useState<THREE.CanvasTexture | null>(null)
  useEffect(() => { buildEarthTexture().then(setTexture) }, [])

  const material = useMemo(() => {
    if (!texture) return new THREE.ShaderMaterial({
      vertexShader: `varying vec3 vN;void main(){vN=normalize(normalMatrix*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1);}`,
      fragmentShader: `varying vec3 vN;void main(){vec3 c=vec3(0.035,0.14,0.33);float r=pow(1.0-abs(dot(vN,vec3(0,0,1))),2.0)*0.5;c*=1.0-r;gl_FragColor=vec4(c,1);}`,
    })
    return new THREE.ShaderMaterial({
      uniforms: { earthTex: { value: texture } },
      vertexShader: `varying vec2 vUv;varying vec3 vN;void main(){vUv=uv;vN=normalize(normalMatrix*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1);}`,
      fragmentShader: `
        uniform sampler2D earthTex;
        varying vec2 vUv; varying vec3 vN;
        void main(){
          vec3 b=texture2D(earthTex,vUv).rgb;
          vec3 l=normalize(vec3(-0.4,0.8,0.6));
          float d=max(0.0,dot(vN,l));
          float li=0.28+d*0.72;
          float sea=step(b.g+0.03,b.b);
          vec3 h=normalize(l+vec3(0,0,1));
          float sp=pow(max(0.0,dot(vN,h)),22.0)*0.08*sea;
          vec3 oc=vec3(0.038,0.16,0.37)*li+sp;
          vec3 la=b*li;
          vec3 c=mix(la,oc,sea);
          float rim=pow(1.0-abs(dot(vN,vec3(0,0,1))),2.8);
          c*=1.0-rim*0.62;
          gl_FragColor=vec4(c,1);
        }
      `,
    })
  }, [texture])

  return <mesh material={material}><sphereGeometry args={[R, 72, 72]} /></mesh>
}

function Atmosphere() {
  const mat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: `varying vec3 vN;void main(){vN=normalize(normalMatrix*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1);}`,
    fragmentShader: `varying vec3 vN;void main(){float r=pow(1.0-abs(dot(vN,vec3(0,0,1))),3.8);gl_FragColor=vec4(0.10,0.45,1.0,r*0.42);}`,
    transparent: true, side: THREE.BackSide, depthWrite: false, blending: THREE.AdditiveBlending,
  }), [])
  return <mesh material={mat}><sphereGeometry args={[R * 1.025, 32, 32]} /></mesh>
}

function CityNodes() {
  const outerR  = useRef<(THREE.Mesh | null)[]>([])
  const middleR = useRef<(THREE.Mesh | null)[]>([])
  useFrame(({ clock }) => {
    CITIES.forEach((_, i) => {
      const t = clock.elapsedTime * 1.4 + i * 0.65
      const p = Math.abs(Math.sin(t))
      const o = outerR.current[i]
      if (o) { o.scale.setScalar(1 + 0.55 * p); (o.material as THREE.MeshBasicMaterial).opacity = 0.14 - 0.11 * p }
      const m = middleR.current[i]
      if (m) { m.scale.setScalar(1 + 0.25 * p); (m.material as THREE.MeshBasicMaterial).opacity = 0.38 - 0.20 * p }
    })
  })
  return (
    <>
      {CITIES.map((city, i) => {
        const pos = toVec3(city.lat, city.lng, R)
        return (
          <group key={i} position={pos}>
            <mesh><sphereGeometry args={[0.028, 8, 8]} /><meshBasicMaterial color="#ffffff" /></mesh>
            <mesh ref={el => { middleR.current[i] = el }}><sphereGeometry args={[0.058, 8, 8]} /><meshBasicMaterial color="#7ac8ff" transparent opacity={0.38} blending={THREE.AdditiveBlending} depthWrite={false} /></mesh>
            <mesh ref={el => { outerR.current[i] = el }}><sphereGeometry args={[0.110, 8, 8]} /><meshBasicMaterial color="#3390e0" transparent opacity={0.14} blending={THREE.AdditiveBlending} depthWrite={false} /></mesh>
          </group>
        )
      })}
    </>
  )
}

function Arc({ from, to, startOffset }: { from: THREE.Vector3; to: THREE.Vector3; startOffset: number }) {
  const coreRef = useRef<THREE.Line>(null)
  const glowRef = useRef<THREE.Line>(null)
  const dotRef  = useRef<THREE.Mesh>(null)
  const prog    = useRef(startOffset)

  const { geometry, curve } = useMemo(() => {
    const mid  = from.clone().add(to).multiplyScalar(0.5)
    const dist = from.distanceTo(to)
    mid.normalize().multiplyScalar(R + dist * 0.46)
    const c = new THREE.QuadraticBezierCurve3(from, mid, to)
    return { geometry: new THREE.BufferGeometry().setFromPoints(c.getPoints(90)), curve: c }
  }, [from, to])

  useFrame((_, delta) => {
    prog.current += delta * 0.09
    if (prog.current >= 3.2) prog.current = 0
    const p   = prog.current
    const end = Math.max(2, Math.floor(Math.min(p, 1) * 90))
    const op  = p < 1.0 ? p * 0.88 : p < 2.4 ? 0.88 : Math.max(0, (3.2 - p) / 0.8) * 0.88
    for (const ref of [coreRef, glowRef]) {
      if (!ref.current) continue
      ref.current.geometry.setDrawRange(0, end)
      ;(ref.current.material as THREE.LineBasicMaterial).opacity = ref === glowRef ? op * 0.28 : op
    }
    if (dotRef.current) {
      dotRef.current.position.copy(curve.getPoint(Math.min(p, 1)))
      ;(dotRef.current.material as THREE.MeshBasicMaterial).opacity =
        p < 1.0 ? 1 : Math.max(0, 1 - (p - 1.0) * 2.8)
    }
  })

  return (
    <>
      {/* @ts-expect-error */}
      <line ref={glowRef} geometry={geometry}><lineBasicMaterial color={new THREE.Color(0.39,0.71,1.0)} transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} /></line>
      {/* @ts-expect-error */}
      <line ref={coreRef} geometry={geometry}><lineBasicMaterial color={new THREE.Color(0.71,0.86,1.0)} transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} /></line>
      <mesh ref={dotRef}><sphereGeometry args={[0.030, 8, 8]} /><meshBasicMaterial color="#ffffff" transparent opacity={1} blending={THREE.AdditiveBlending} depthWrite={false} /></mesh>
    </>
  )
}

function Arcs() {
  const data = useMemo(() =>
    ARCS.map(([a, b], i) => ({
      from:        toVec3(CITIES[a].lat, CITIES[a].lng, R),
      to:          toVec3(CITIES[b].lat, CITIES[b].lng, R),
      startOffset: (i / ARCS.length) * 3.2,
    })), [])
  return <>{data.map((d, i) => <Arc key={i} {...d} />)}</>
}

function Stars() {
  const geo = useMemo(() => {
    const pos: number[] = []
    for (let i = 0; i < 1200; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi   = Math.acos(2 * Math.random() - 1)
      const r     = 90 + Math.random() * 25
      pos.push(r*Math.sin(phi)*Math.cos(theta), r*Math.cos(phi), r*Math.sin(phi)*Math.sin(theta))
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3))
    return g
  }, [])
  return <points geometry={geo}><pointsMaterial color="#c8d8f0" size={0.18} sizeAttenuation transparent opacity={0.26} /></points>
}

function GlobeGroup() {
  const ref = useRef<THREE.Group>(null)
  useFrame((_, delta) => { if (ref.current) ref.current.rotation.y += delta * 0.022 })
  return (
    <group ref={ref} position={[0, GLOBE_Y, 0]}>
      <GlobeMesh /><Atmosphere /><CityNodes /><Arcs />
    </group>
  )
}

function Scene() { return <><Stars /><GlobeGroup /></> }

// ── TechConnect 2026 live feed ────────────────────────────────────

const FEED_POOL = [
  { name: "Sarah M.",  role: "Founder · B2B SaaS"    },
  { name: "Alex K.",   role: "Investor · Early Stage" },
  { name: "Jordan L.", role: "Engineer · Fintech"     },
  { name: "Priya S.",  role: "Designer · Product"     },
  { name: "Marcus T.", role: "PM · Enterprise"        },
  { name: "Nina R.",   role: "VC · Series A"          },
  { name: "Tom B.",    role: "CTO · Dev Tools"        },
  { name: "Aisha J.",  role: "Founder · Climate"      },
]
const FEED_TARGET = 50, FEED_START = 24
type FeedEntry = { id: number; name: string; role: string }

function initFeed() {
  return {
    entries: FEED_POOL.slice(0, 3).map((p, i) => ({ id: i, ...p })) as FeedEntry[],
    count: FEED_START,
    matchLabel: null as string | null,
    tick: 3,
    done: false,
  }
}

function TechConnectFeed() {
  const [state, setState] = useState(initFeed)
  const iRef   = useRef<ReturnType<typeof setInterval> | null>(null)
  const feedEl = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (feedEl.current) feedEl.current.scrollTop = feedEl.current.scrollHeight
  }, [state.entries.length])

  function startLoop() {
    if (iRef.current) clearInterval(iRef.current)
    iRef.current = setInterval(() => {
      setState(prev => {
        if (prev.done) return prev
        const next  = prev.tick + 1
        const count = prev.count + 1
        const done  = count >= FEED_TARGET
        const matchLabel =
          next % 5 === 0
            ? `${FEED_POOL[next % FEED_POOL.length].name.split(" ")[0]} ↔ ${FEED_POOL[(next+3) % FEED_POOL.length].name.split(" ")[0]} · ${Math.floor(Math.random() * 10) + 88}% compat.`
            : null
        return {
          entries: prev.entries.length < 7
            ? [...prev.entries, { id: next, ...FEED_POOL[next % FEED_POOL.length] }]
            : prev.entries,
          count, matchLabel, tick: next, done,
        }
      })
    }, 1800)
  }

  useEffect(() => { startLoop(); return () => { if (iRef.current) clearInterval(iRef.current) } }, [])
  useEffect(() => {
    if (!state.done) return
    if (iRef.current) clearInterval(iRef.current)
    const t = setTimeout(() => { setState(initFeed()); startLoop() }, 3500)
    return () => clearTimeout(t)
  }, [state.done])

  return (
    <div className="w-full rounded-2xl p-4 space-y-3" style={{
      maxWidth: 310,
      background: "rgba(4, 12, 34, 0.72)",
      border: "1px solid rgba(255,255,255,0.10)",
      backdropFilter: "blur(18px)",
      WebkitBackdropFilter: "blur(18px)",
    }}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.28)" }}>TechConnect 2026</p>
          <p className="text-sm font-semibold text-white mt-0.5">{state.done ? "Matching complete" : "Live questionnaire"}</p>
        </div>
        {state.done ? (
          <div className="flex items-center gap-1.5 rounded-full px-2.5 py-1" style={{ background: "rgba(255,255,255,0.08)" }}>
            <Zap className="w-3 h-3 text-white" strokeWidth={2.5} />
            <span className="text-xs font-medium text-white">Done</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 rounded-full px-2.5 py-1" style={{ background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.28)" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-medium text-emerald-400">Live</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 rounded-xl px-3 py-2" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)" }}>
        <Users className="w-3.5 h-3.5" style={{ color: "rgba(255,255,255,0.28)" }} strokeWidth={1.5} />
        <span className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
          <span className="text-white font-semibold">{state.count}</span> responses collected
        </span>
      </div>

      <div ref={feedEl} className="space-y-1.5 overflow-y-auto scrollbar-none" style={{ maxHeight: 200, scrollBehavior: "smooth" }}>
        {state.entries.map(e => (
          <div key={e.id} className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 animate-in slide-in-from-bottom-2 fade-in duration-400"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
              style={{ background: "rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.65)" }}>
              {e.name[0]}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">{e.name}</p>
              <p className="text-[10px] truncate" style={{ color: "rgba(255,255,255,0.32)" }}>{e.role}</p>
            </div>
            <span className="ml-auto text-[10px] text-emerald-400 shrink-0">Joined</span>
          </div>
        ))}
        {state.matchLabel && (
          <div key={`m-${state.matchLabel}`} className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 animate-in slide-in-from-bottom-2 fade-in duration-400"
            style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.22)" }}>
            <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(34,197,94,0.18)" }}>
              <Zap className="w-3 h-3 text-emerald-400" strokeWidth={2.5} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-emerald-400">Match found!</p>
              <p className="text-[10px] truncate" style={{ color: "rgba(255,255,255,0.38)" }}>{state.matchLabel}</p>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        <div className="flex justify-between text-[10px]" style={{ color: "rgba(255,255,255,0.22)" }}>
          <span>Response target</span>
          <span>{state.count} / {FEED_TARGET}</span>
        </div>
        <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
          <div className="h-full rounded-full transition-all duration-700 ease-out"
            style={{ width: `${Math.min((state.count / FEED_TARGET) * 100, 100)}%`, background: "#22c55e" }} />
        </div>
      </div>
    </div>
  )
}

// ── Main export ──────────────────────────────────────────────────

export default function GlobeHeroSection() {
  return (
    <section
      className="relative overflow-hidden"
      style={{ height: "100vh", background: "linear-gradient(to bottom, #0a1628 0%, #07152a 48%, #0d2448 100%)" }}
    >
      <div className="absolute inset-0 pointer-events-none z-10"
        style={{ background: "radial-gradient(ellipse 100% 90% at 50% 50%, transparent 32%, rgba(2,6,18,0.78) 100%)" }} />
      <div className="absolute pointer-events-none z-0"
        style={{ left: "50%", bottom: "-12%", transform: "translateX(-50%)", width: "110vw", height: "60vh",
          background: "radial-gradient(ellipse at center, rgba(12,55,160,0.22) 0%, transparent 62%)" }} />
      <div className="absolute pointer-events-none z-10"
        style={{ left: "50%", bottom: "-8%", transform: "translateX(-50%)", width: "90vw", height: "30vh",
          background: "radial-gradient(ellipse at center, rgba(30,100,255,0.12) 0%, transparent 70%)" }} />

      <div className="absolute inset-0 z-0">
        <Canvas camera={{ position: [0, 0, 8.5], fov: 52 }} gl={{ antialias: true }} style={{ background: "transparent" }}>
          <Suspense fallback={null}><Scene /></Suspense>
        </Canvas>
      </div>

      {/*
        Content zone: nav bottom (72px) + 130px padding before headline.
        Headline starts at ~202px from viewport top = 130px below nav.
        bottom: 44vh keeps content clear of globe by ~55px at 900px viewport.
        Inner row uses align-items:center so column vertical centers align.
      */}
      <div
        style={{
          position: "absolute",
          top: 72,                          // starts at nav bottom
          left: 0,
          right: 0,
          bottom: "44vh",                   // clear of globe
          padding: "95px 88px 0 120px",      // 95px from nav; 120px left indent moves block right
          zIndex: 20,
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 1440,
            margin: "0 auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",           // vertical centers of both columns align
          }}
        >
          {/* Left column */}
          <div style={{ width: "45%", maxWidth: 520 }}>

            {/* Headline */}
            <h1
              className="text-white tracking-[-0.024em]"
              style={{
                fontSize: "clamp(36px, 3.5vw, 50px)",
                fontWeight: 800,
                lineHeight: 1.18,
                textShadow: "0 2px 40px rgba(2,7,22,0.95)",
                marginBottom: 24,
              }}
            >
              Meet the right people.
              <br />
              <span style={{ color: "#4ade80" }}>Before</span> you walk in.
            </h1>

            {/* Buttons */}
            <div className="flex items-center gap-3" style={{ marginBottom: 24 }}>
              <Link href="/login">
                <button
                  className="h-[48px] px-8 rounded-full text-[14px] font-bold transition-all duration-150 active:scale-[0.97]"
                  style={{ background: "#22c55e", color: "#052e16", boxShadow: "0 0 26px rgba(34,197,94,0.38), 0 2px 8px rgba(0,0,0,0.35)" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#4ade80")}
                  onMouseLeave={e => (e.currentTarget.style.background = "#22c55e")}
                >
                  Get Started
                </button>
              </Link>
              <a href="#how-it-works">
                <button
                  className="h-[48px] px-8 rounded-full text-[14px] font-medium text-white flex items-center gap-2 transition-all duration-150"
                  style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.18)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.12)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.07)")}
                >
                  Learn More <ArrowRight className="w-[14px] h-[14px]" strokeWidth={2} />
                </button>
              </a>
            </div>

            {/* Tagline — relocated from nav, fills gap below buttons */}
            <p style={{
              fontSize: 16,
              color: "rgba(255,255,255,0.50)",
              lineHeight: 1.65,
              maxWidth: 400,
            }}>
              AI-powered in-person event matching for ambitious professionals.
            </p>
          </div>

          {/* Right column — card, centered relative to left column */}
          <TechConnectFeed />
        </div>
      </div>
    </section>
  )
}
