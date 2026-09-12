"use client"

import { Suspense, useEffect, useRef } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { ContactShadows, Environment, Lightformer, OrbitControls, Grid } from "@react-three/drei"
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib"
import * as THREE from "three"
import { ScooterModel, type ModelSettings } from "./scooter-model"

export type CameraView = "perspective" | "side" | "front" | "detail"
export type SceneProps = { settings: ModelSettings; autoRotate: boolean; grid: boolean; environment: "studio" | "outdoor"; view: CameraView; cameraKey: number; captureKey: number; onReady: () => void }

function CameraRig({ view, cameraKey, autoRotate }: Pick<SceneProps, "view" | "cameraKey" | "autoRotate">) {
  const controls = useRef<OrbitControlsImpl>(null)
  const { camera, size } = useThree()
  const moving = useRef(true)
  const desired = useRef(new THREE.Vector3(-3.8, 2.8, 5.5))
  const target = useRef(new THREE.Vector3(0, 1.15, 0))
  useEffect(() => {
    const positions: Record<CameraView, [number, number, number]> = { perspective: [-3.8, 2.8, 5.5], side: [0, 1.5, 6.7], front: [-6.7, 1.8, .01], detail: [-2.5, 1.3, 3.1] }
    desired.current.set(...positions[view])
    if (size.width < 600 && view !== "detail") desired.current.multiplyScalar(1.14)
    target.current.set(view === "detail" ? -.45 : 0, view === "detail" ? .58 : 1.15, 0)
    moving.current = true
  }, [view, cameraKey, size.width])
  useFrame((_, delta) => {
    if (moving.current && controls.current) {
      camera.position.lerp(desired.current, 1 - Math.exp(-delta * 5))
      controls.current.target.lerp(target.current, 1 - Math.exp(-delta * 5))
      controls.current.update()
      if (camera.position.distanceTo(desired.current) < .01) moving.current = false
    }
  })
  return <OrbitControls ref={controls} makeDefault enableDamping dampingFactor={.07} minDistance={2.2} maxDistance={11} minPolarAngle={.15} maxPolarAngle={Math.PI / 2 - .035} autoRotate={autoRotate && !moving.current} autoRotateSpeed={1.15} onStart={() => { moving.current = false }} />
}

function Capture({ captureKey, onReady }: Pick<SceneProps, "captureKey" | "onReady">) {
  const { gl, scene, camera } = useThree()
  useEffect(() => { onReady() }, [onReady])
  useEffect(() => {
    if (!captureKey) return
    gl.render(scene, camera)
    const link = document.createElement("a"); link.download = "kukirin-g2-studio.png"; link.href = gl.domElement.toDataURL("image/png"); link.click()
  }, [captureKey, gl, scene, camera])
  return null
}

export default function ScooterScene(props: SceneProps) {
  const bg = props.environment === "studio" ? "#eeefef" : "#e2e6e8"
  return <Canvas shadows dpr={[1, 1.75]} camera={{ position: [-3.8, 2.8, 5.5], fov: 33, near: .1, far: 60 }} gl={{ antialias: true, preserveDrawingBuffer: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.12 }} aria-label="Interactive 3D model of a black and orange KuKirin G2 electric scooter">
    <color attach="background" args={[bg]} />
    <fog attach="fog" args={[bg, 16, 32]} />
    <ambientLight intensity={.8} />
    <directionalLight position={[-3, 7, 5]} intensity={3} castShadow shadow-mapSize={[1024, 1024]} shadow-camera-left={-4} shadow-camera-right={4} shadow-camera-top={4} shadow-camera-bottom={-4} shadow-normalBias={.025} />
    <directionalLight position={[3, 3, -4]} intensity={props.environment === "outdoor" ? 3.5 : 1.8} />
    <Suspense fallback={null}>
      <Environment resolution={128}>
        <Lightformer form="rect" intensity={3} position={[-3, 4, 2]} scale={[5, 5, 1]} rotation={[0, Math.PI / 3, 0]} />
        <Lightformer form="rect" intensity={2} position={[3, 3, -2]} scale={[3, 5, 1]} rotation={[0, -Math.PI / 3, 0]} />
        <Lightformer form="rect" intensity={2} position={[0, 6, 0]} scale={[6, 6, 1]} rotation={[Math.PI / 2, 0, 0]} />
      </Environment>
      <ScooterModel settings={props.settings} />
      <ContactShadows position={[0, -.005, 0]} opacity={.37} scale={8} blur={2.8} far={3} resolution={256} frames={props.settings.playing ? Infinity : 1} color="#25272a" />
    </Suspense>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -.013, 0]} receiveShadow><planeGeometry args={[100, 100]} /><meshStandardMaterial color={bg} roughness={1} /></mesh>
    {props.grid && <Grid position={[0, -.002, 0]} args={[20, 20]} cellSize={.25} cellThickness={.5} cellColor="#babec0" sectionSize={1} sectionThickness={.7} sectionColor="#a5aaae" fadeDistance={9} infiniteGrid />}
    <CameraRig view={props.view} cameraKey={props.cameraKey} autoRotate={props.autoRotate} />
    <Capture captureKey={props.captureKey} onReady={props.onReady} />
  </Canvas>
}
