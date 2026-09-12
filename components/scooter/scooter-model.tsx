"use client"

import { useEffect, useLayoutEffect, useMemo, useRef } from "react"
import { useFrame } from "@react-three/fiber"
import { RoundedBox } from "@react-three/drei"
import * as THREE from "three"

export type AnimationMode = "idle" | "ride" | "fold" | "suspension" | "steer"
export type ModelSettings = { animation: AnimationMode; playing: boolean; speed: number; lights: boolean; wireframe: boolean; finish: "original" | "graphite"; resetKey: number }
type Vec3 = [number, number, number]

const rubber = new THREE.MeshStandardMaterial({ color: "#18191a", roughness: .93 })
const treadMaterial = new THREE.MeshStandardMaterial({ color: "#202123", roughness: .96 })
const metal = new THREE.MeshStandardMaterial({ color: "#85888b", metalness: .9, roughness: .3 })
const darkMetal = new THREE.MeshStandardMaterial({ color: "#373a3e", metalness: .68, roughness: .42 })
const black = new THREE.MeshStandardMaterial({ color: "#141619", metalness: .35, roughness: .5 })

function Rod({ from, to, radius = .02, material = darkMetal }: { from: Vec3; to: Vec3; radius?: number; material?: THREE.Material }) {
  const { position, quaternion, length } = useMemo(() => {
    const a = new THREE.Vector3(...from), b = new THREE.Vector3(...to)
    return { position: a.clone().add(b).multiplyScalar(.5), quaternion: new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize()), length: a.distanceTo(b) }
  }, [from, to])
  return <mesh position={position} quaternion={quaternion} material={material} castShadow><cylinderGeometry args={[radius, radius, length, 20]} /></mesh>
}

function Cable({ points, radius = .007, material = rubber }: { points: Vec3[]; radius?: number; material?: THREE.Material }) {
  const curve = useMemo(() => new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p))), [points])
  return <mesh material={material} castShadow><tubeGeometry args={[curve, 48, radius, 7, false]} /></mesh>
}

function Decal({ text, position, rotation = [0, 0, 0], width, height, color = "#f36a20" }: { text: string; position: Vec3; rotation?: Vec3; width: number; height: number; color?: string }) {
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas")
    canvas.width = 1024; canvas.height = 160
    const ctx = canvas.getContext("2d")!
    ctx.fillStyle = color; ctx.font = "italic 800 125px Arial"; ctx.textAlign = "center"; ctx.textBaseline = "middle"
    ctx.fillText(text, 512, 88, 1000)
    const map = new THREE.CanvasTexture(canvas); map.colorSpace = THREE.SRGBColorSpace
    return map
  }, [text, color])
  useEffect(() => () => texture.dispose(), [texture])
  return <mesh position={position} rotation={rotation}><planeGeometry args={[width, height]} /><meshBasicMaterial map={texture} transparent depthWrite={false} polygonOffset polygonOffsetFactor={-2} /></mesh>
}

function Treads() {
  const ref = useRef<THREE.InstancedMesh>(null)
  useLayoutEffect(() => {
    const dummy = new THREE.Object3D()
    for (let row = 0; row < 5; row++) {
      const z = (row - 2) * .039
      const radius = .269 - Math.pow(Math.abs(row - 2), 2) * .007
      for (let i = 0; i < 48; i++) {
        const angle = (i + (row % 2) * .5) / 48 * Math.PI * 2
        dummy.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius, z)
        dummy.rotation.set(0, 0, angle - Math.PI / 2)
        dummy.updateMatrix()
        ref.current!.setMatrixAt(row * 48 + i, dummy.matrix)
      }
    }
    ref.current!.instanceMatrix.needsUpdate = true
  }, [])
  return <instancedMesh ref={ref} args={[undefined, treadMaterial, 240]} castShadow><boxGeometry args={[.027, .017, .03]} /></instancedMesh>
}

function Wheel({ position, settings, rear = false }: { position: Vec3; settings: ModelSettings; rear?: boolean }) {
  const ref = useRef<THREE.Group>(null)
  useFrame((_, delta) => {
    if (settings.animation === "ride" && settings.playing && ref.current) ref.current.rotation.z += delta * settings.speed * 6
  })
  return <group position={position}><group ref={ref} name={rear ? "rear-wheel" : "front-wheel"}>
    <mesh material={rubber} scale={[1, 1, 1.45]} castShadow><torusGeometry args={[.205, .062, 16, 64]} /></mesh>
    <Treads />
    <mesh rotation={[Math.PI / 2, 0, 0]} material={black} castShadow><cylinderGeometry args={[.173, .173, .15, 48]} /></mesh>
    {[-1, 1].map(side => <group key={side} position={[0, 0, side * .091]}>
      <mesh material={darkMetal}><torusGeometry args={[.174, .008, 8, 64]} /></mesh>
      <mesh material={rubber}><torusGeometry args={[.207, .003, 6, 64]} /></mesh>
      <mesh material={darkMetal} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[rear ? .142 : .075, rear ? .142 : .075, .014, 48]} /></mesh>
      {Array.from({ length: 6 }, (_, i) => <group key={i} rotation={[0, 0, i * Math.PI / 3]}>
        <mesh position={[.103, 0, 0]} material={black} rotation={[0, 0, .25]}><boxGeometry args={[.10, .037, .018]} /></mesh>
        <mesh position={[.115, 0, .016 * side]} material={metal} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[.008, .008, .008, 6]} /></mesh>
      </group>)}
    </group>)}
    <group position={[0, 0, .114]}>
      <mesh material={metal}><ringGeometry args={[.095, .152, 64]} /></mesh>
      <mesh material={metal}><ringGeometry args={[.026, .053, 32]} /></mesh>
      {Array.from({ length: 18 }, (_, i) => <mesh key={i} position={[Math.cos(i * Math.PI / 9) * .133, Math.sin(i * Math.PI / 9) * .133, .001]} material={black}><circleGeometry args={[.007, 8]} /></mesh>)}
      {Array.from({ length: 6 }, (_, i) => <mesh key={i} rotation={[0, 0, i * Math.PI / 3 + .2]} material={metal}><boxGeometry args={[.22, .014, .003]} /></mesh>)}
    </group>
  </group>
  <mesh position={[-.11, .09, .132]} material={black} castShadow><boxGeometry args={[.07, .10, .045]} /></mesh>
  <Rod from={[0, 0, -.15]} to={[0, 0, .15]} radius={.027} material={metal} />
  </group>
}

function Fender({ position, rear = false }: { position: Vec3; rear?: boolean }) {
  const shape = useMemo(() => {
    const s = new THREE.Shape(), start = rear ? -.12 : .18, end = rear ? 2.63 : 2.96
    s.absarc(0, 0, .307, start, end, false)
    s.absarc(0, 0, .289, end, start, true); s.closePath()
    return s
  }, [rear])
  return <group position={position}><mesh position={[0, 0, -.112]} material={black} castShadow><extrudeGeometry args={[shape, { depth: .224, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: .006, bevelThickness: .003, curveSegments: 32 }]} /></mesh></group>
}

function Spring({ from, to }: { from: Vec3; to: Vec3 }) {
  const { curve, quaternion, center, length } = useMemo(() => {
    const a = new THREE.Vector3(...from), b = new THREE.Vector3(...to), length = a.distanceTo(b)
    const points = Array.from({ length: 161 }, (_, i) => { const t = i / 160; return new THREE.Vector3(Math.cos(t * Math.PI * 16) * .041, t * length - length / 2, Math.sin(t * Math.PI * 16) * .041) })
    return { curve: new THREE.CatmullRomCurve3(points), quaternion: new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize()), center: a.clone().add(b).multiplyScalar(.5), length }
  }, [from, to])
  return <group position={center} quaternion={quaternion}>
    <mesh material={metal} castShadow><cylinderGeometry args={[.018, .018, length + .04, 16]} /></mesh>
    <mesh material={black} castShadow><tubeGeometry args={[curve, 160, .009, 8, false]} /></mesh>
    {[-1, 1].map(s => <mesh key={s} position={[0, s * length / 2, 0]} material={darkMetal}><cylinderGeometry args={[.05, .05, .03, 24]} /></mesh>)}
  </group>
}

function Plate({ points, depth = .04, z = 0, material }: { points: [number, number][]; depth?: number; z?: number; material: THREE.Material }) {
  const shape = useMemo(() => new THREE.Shape(points.map(p => new THREE.Vector2(...p))), [points])
  return <mesh position={[0, 0, z - depth / 2]} material={material} castShadow><extrudeGeometry args={[shape, { depth, bevelEnabled: true, bevelThickness: .009, bevelSize: .009, bevelSegments: 2 }]} /></mesh>
}

function DeckGrip() {
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas"); canvas.width = 512; canvas.height = 256
    const ctx = canvas.getContext("2d")!; ctx.fillStyle = "#282a2c"; ctx.fillRect(0, 0, 512, 256)
    ctx.strokeStyle = "#3b3d3f"; ctx.lineWidth = 2
    for (let i = -256; i < 768; i += 9) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i - 256, 256); ctx.stroke() }
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = 8
    return texture
  }, [])
  useEffect(() => () => texture.dispose(), [texture])
  return <mesh position={[.01, .507, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[1.25, .401]} /><meshStandardMaterial map={texture} roughness={.95} /></mesh>
}

export function ScooterModel({ settings }: { settings: ModelSettings }) {
  const root = useRef<THREE.Group>(null), stem = useRef<THREE.Group>(null), steering = useRef<THREE.Group>(null), body = useRef<THREE.Group>(null)
  const phase = useRef(0)
  const orange = useMemo(() => new THREE.MeshStandardMaterial({ color: settings.finish === "original" ? "#f36822" : "#65686b", roughness: .39, metalness: .42 }), [settings.finish])
  const labelColor = settings.finish === "original" ? "#f36822" : "#a0a3a5"
  useEffect(() => {
    root.current?.traverse(obj => { if (obj instanceof THREE.Mesh) { const mats = Array.isArray(obj.material) ? obj.material : [obj.material]; mats.forEach(m => { if ("wireframe" in m) m.wireframe = settings.wireframe }) } })
  }, [settings.wireframe, settings.finish])
  useEffect(() => { phase.current = 0 }, [settings.animation, settings.resetKey])
  useEffect(() => () => orange.dispose(), [orange])
  useFrame((_, delta) => {
    if (settings.playing) phase.current += Math.min(delta, .05) * settings.speed
    const t = phase.current
    const foldAngle = settings.animation === "fold" ? -(1 - Math.cos(t * 1.25)) / 2 * 1.58 : 0
    if (stem.current) stem.current.rotation.z = THREE.MathUtils.damp(stem.current.rotation.z, foldAngle, 9, delta)
    if (steering.current) steering.current.rotation.y = THREE.MathUtils.damp(steering.current.rotation.y, settings.animation === "steer" ? Math.sin(t * 1.6) * .55 : 0, 8, delta)
    if (body.current) body.current.position.y = settings.animation === "suspension" ? -.045 * (1 + Math.sin(t * 5)) : settings.animation === "ride" ? Math.sin(t * 12) * .003 : 0
  })
  return <group ref={root} name="KuKirin-G2">
    <Wheel position={[.99, .28, 0]} settings={settings} rear />
    <group ref={body}>
      <RoundedBox args={[1.39, .17, .465]} radius={.033} smoothness={3} position={[0, .408, 0]} material={darkMetal} castShadow receiveShadow />
      <RoundedBox args={[1.33, .022, .44]} radius={.025} smoothness={2} position={[0, .497, 0]} material={rubber} castShadow />
      <DeckGrip />
      <Decal text="KuKirin" position={[.04, .509, .015]} rotation={[-Math.PI / 2, 0, 0]} width={.46} height={.085} color="#717375" />
      {[-1, 1].map(side => <group key={side}>
        <Decal text="G2" position={[-.43, .405, side * .234]} rotation={[0, side === -1 ? Math.PI : 0, 0]} width={.19} height={.086} color={labelColor} />
        {Array.from({ length: 5 }, (_, i) => <mesh key={i} position={[-.24 + i * .099, .387 + (i % 2) * .029, side * .237]} rotation={[0, 0, .2]} material={orange}><boxGeometry args={[.066, .032, .004]} /></mesh>)}
        {[-.59, .6].map(x => <mesh key={x} position={[x, .405, side * .239]} rotation={[Math.PI / 2, 0, 0]} material={metal}><cylinderGeometry args={[.012, .012, .008, 6]} /></mesh>)}
        <Plate points={[[.57, .44], [.67, .45], [1.05, .31], [1.08, .25], [.93, .22], [.61, .33]]} z={side * .15} material={orange} />
        <Plate points={[[.65, .43], [.76, .46], [1.02, .32], [1.04, .28], [.91, .27], [.69, .35]]} z={side * .177} depth={.018} material={black} />
        <Rod from={[.99, .28, side * .172]} to={[.99, .28, side * .202]} material={metal} radius={.024} />
        <Spring from={[.64, .405, side * .122]} to={[.85, .555, side * .122]} />
      </group>)}
      <Fender position={[.99, .28, 0]} rear />
      <group position={[.68, .59, 0]} rotation={[0, 0, .33]}>
        <RoundedBox args={[.33, .047, .34]} radius={.017} smoothness={2} material={darkMetal} castShadow />
        <RoundedBox args={[.28, .015, .285]} radius={.014} smoothness={2} position={[0, .03, 0]} material={rubber} />
        {[-.07, 0, .07].map(x => <mesh key={x} position={[x, .04, 0]} material={black}><boxGeometry args={[.014, .007, .24]} /></mesh>)}
      </group>
      <mesh position={[1.279, .372, 0]} rotation={[0, 0, -.45]}><boxGeometry args={[.025, .066, .132]} /><meshStandardMaterial color="#f36822" emissive="#f36822" emissiveIntensity={settings.lights ? 2 : .05} /></mesh>
      <Rod from={[.31, .337, .205]} to={[.40, .03, .33]} radius={.014} material={black} />
      <RoundedBox args={[.1, .016, .045]} position={[.40, .017, .335]} material={rubber} radius={.007} smoothness={2} />
      <Plate points={[[-.68, .36], [-.84, .44], [-1.05, .77], [-1.04, .87], [-.91, .89], [-.70, .60], [-.58, .49]]} depth={.25} material={darkMetal} />
      <mesh position={[-.964, .798, 0]} rotation={[Math.PI / 2, 0, 0]} material={black}><cylinderGeometry args={[.083, .083, .29, 32]} /></mesh>
      <Rod from={[-.964, .798, -.16]} to={[-.964, .798, .16]} radius={.035} material={metal} />
      <group ref={steering} position={[-1.025, .28, 0]}>
        <Wheel position={[0, 0, 0]} settings={settings} />
        <Fender position={[0, 0, 0]} />
        {[-1, 1].map(side => <group key={side}>
          <Plate points={[[-.045, -.03], [.04, -.025], [.13, .20], [.09, .28], [-.02, .15]]} z={side * .155} material={orange} />
          <Plate points={[[-.043, -.012], [.018, -.012], [.11, .22], [.06, .25]]} z={side * .18} depth={.017} material={black} />
          <Spring from={[.03, .19, side * .1]} to={[-.07, .43, side * .1]} />
          <Rod from={[-.07, .41, side * .1]} to={[.09, .52, side * .1]} radius={.042} />
        </group>)}
      </group>
      <group ref={stem} position={[-.965, .815, 0]}>
        <group rotation={[0, 0, -.225]}>
          <RoundedBox args={[.113, 1.47, .118]} radius={.019} smoothness={3} position={[0, .79, 0]} material={black} castShadow />
          <RoundedBox args={[.143, .25, .149]} radius={.025} smoothness={3} position={[0, .13, 0]} material={darkMetal} castShadow />
          <RoundedBox args={[.052, .18, .037]} radius={.012} smoothness={2} position={[-.09, .14, 0]} material={black} />
          <Rod from={[-.09, .22, -.042]} to={[-.09, .22, .042]} radius={.014} material={orange} />
          <Decal text="KuKirin" position={[0, .99, .061]} rotation={[0, 0, Math.PI / 2]} width={.48} height={.073} color={labelColor} />
          <Decal text="G2" position={[0, .38, .061]} rotation={[0, 0, Math.PI / 2]} width={.13} height={.065} color={labelColor} />
          <Cable points={[[.058, 1.42, -.05], [.10, 1.05, -.072], [.085, .63, -.07], [-.09, .33, -.09], [-.13, -.14, -.1]]} radius={.009} />
          <Cable points={[[.02, 1.44, .13], [.12, 1.25, .17], [.13, .88, .12], [.1, .43, .09], [-.08, -.06, .1]]} radius={.006} />
          <RoundedBox args={[.06, .035, .147]} radius={.007} smoothness={2} position={[0, .7, 0]} material={darkMetal} />
          <group position={[0, 1.51, 0]} rotation={[0, 0, .225]}>
            <Rod from={[0, 0, -.55]} to={[0, 0, .55]} radius={.026} material={darkMetal} />
            {[-1, 1].map(side => <group key={side}>
              <Rod from={[0, 0, side * .34]} to={[0, 0, side * .57]} radius={.042} material={rubber} />
              {Array.from({ length: 12 }, (_, i) => <mesh key={i} position={[0, 0, side * (.355 + i * .017)]} material={treadMaterial}><torusGeometry args={[.041, .0018, 6, 20]} /></mesh>)}
              <Rod from={[0, 0, side * .32]} to={[0, 0, side * .335]} radius={.045} material={black} />
              <Rod from={[0, 0, side * .26]} to={[-.095, -.023, side * .34]} radius={.012} material={black} />
              <Rod from={[-.095, -.023, side * .34]} to={[-.105, -.027, side * .49]} radius={.011} material={black} />
              <Cable points={[[-.04, -.02, side * .29], [-.14, -.12, side * .29], [-.16, -.23, side * .15], [0, -.31, side * .08]]} />
              <mesh position={[0, 0, side * .575]} rotation={[Math.PI / 2, 0, 0]} material={darkMetal}><cylinderGeometry args={[.042, .042, .015, 24]} /></mesh>
            </group>)}
            <RoundedBox args={[.13, .055, .13]} radius={.015} smoothness={2} position={[0, -.008, -.265]} material={black} />
            <mesh position={[-.025, .025, -.275]} material={orange}><sphereGeometry args={[.013, 12, 12]} /></mesh>
            <group position={[-.015, .052, 0]} rotation={[0, 0, .17]}>
              <RoundedBox args={[.205, .081, .277]} radius={.044} smoothness={3} material={darkMetal} castShadow />
              <RoundedBox args={[.163, .014, .23]} radius={.026} smoothness={3} position={[0, .043, 0]} material={black} />
              <Decal text={settings.animation === "ride" && settings.playing ? "25" : "00"} position={[0, .052, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 2]} width={.115} height={.105} color="#e6ebef" />
              <mesh position={[-.106, -.005, 0]} rotation={[0, Math.PI / 2, 0]}><planeGeometry args={[.175, .042]} /><meshStandardMaterial color="#f1f4f7" emissive="#f1f4f7" emissiveIntensity={settings.lights ? 3 : .05} /></mesh>
              {settings.lights && <pointLight position={[-.2, 0, 0]} color="#f1f4f7" intensity={1.1} distance={2} />}
            </group>
          </group>
        </group>
      </group>
    </group>
  </group>
}
