"use client"

import dynamic from "next/dynamic"
import { Component, useCallback, useEffect, useRef, useState, type ReactNode } from "react"
import { ArrowDownToLine, ArrowUpRight, Box, Camera, Check, ChevronRight, CircleHelp, Expand, Focus, Grid2X2, Maximize, Mouse, Move, RotateCcw, Rotate3D, Scan, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { cn } from "@/lib/utils"
import { StudioInspector, REFERENCE_IMAGE } from "./studio-inspector"
import type { ModelSettings } from "./scooter-model"
import type { CameraView } from "./scooter-scene"

const ScooterScene = dynamic(() => import("./scooter-scene"), { ssr: false })
const defaults: ModelSettings = { animation: "ride", playing: false, speed: 1, lights: true, wireframe: false, finish: "original", resetKey: 0 }

class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() {
    if (this.state.failed) return <div className="scene-fallback"><Box className="size-8" /><h2>3D needs a little more power.</h2><p>Enable hardware acceleration in your browser, then reload to explore the model.</p><Button variant="outline" onClick={() => window.location.reload()}>Reload viewer</Button></div>
    return this.props.children
  }
}

function ToolButton({ label, active, onClick, children }: { label: string; active?: boolean; onClick: () => void; children: ReactNode }) {
  return <Tooltip><TooltipTrigger render={<Button variant="ghost" size="icon" className={cn("viewer-tool", active && "tool-active")} aria-label={label} aria-pressed={active} onClick={onClick} />}>{children}</TooltipTrigger><TooltipContent>{label}</TooltipContent></Tooltip>
}

export default function ProductStudio() {
  const [settings, setSettings] = useState(defaults)
  const [autoRotate, setAutoRotate] = useState(false)
  const [environment, setEnvironment] = useState<"studio" | "outdoor">("studio")
  const [grid, setGrid] = useState(false)
  const [view, setView] = useState<CameraView>("perspective")
  const [cameraKey, setCameraKey] = useState(0)
  const [captureKey, setCaptureKey] = useState(0)
  const [exportKey, setExportKey] = useState(0)
  const [ready, setReady] = useState(false)
  const [dialog, setDialog] = useState<"reference" | "specs" | "help" | null>(null)
  const [expanded, setExpanded] = useState(false)
  const [saved, setSaved] = useState(false)
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const onReady = useCallback(() => setReady(true), [])
  const update = useCallback((patch: Partial<ModelSettings>) => setSettings(s => ({ ...s, ...patch })), [])
  const resetCamera = () => { setView("perspective"); setCameraKey(k => k + 1) }
  const resetAll = () => { setSettings(s => ({ ...defaults, resetKey: s.resetKey + 1 })); setAutoRotate(false); setEnvironment("studio"); setGrid(false); resetCamera() }
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setExpanded(false) }
    window.addEventListener("keydown", onKey)
    return () => { window.removeEventListener("keydown", onKey); if (savedTimer.current) clearTimeout(savedTimer.current) }
  }, [])
  const saveImage = () => { setCaptureKey(k => k + 1); setSaved(true); if (savedTimer.current) clearTimeout(savedTimer.current); savedTimer.current = setTimeout(() => setSaved(false), 2400) }

  return <TooltipProvider delay={200}><main className={cn("product-studio font-sans", expanded && "studio-expanded")}>
    <header className="studio-header"><a href="/" className="wordmark" aria-label="KuKirin studio home">KuKirin<span className="brand-slashes" aria-hidden="true">//</span></a><span className="header-divider" /><span className="studio-label">PRODUCT STUDIO</span><nav aria-label="Studio navigation"><button className="nav-active" onClick={() => setDialog(null)}>Explore <span /></button><button onClick={() => setDialog("specs")}>Specifications</button><button onClick={() => setDialog("reference")}>Reference <ArrowUpRight className="size-3.5" /></button></nav><div className="header-actions"><span className="live-label"><span />Interactive 3D</span><Button variant="outline" onClick={() => setExportKey(k => k + 1)} disabled={!ready}><ArrowDownToLine data-icon="inline-start" />Export model</Button><Button variant="ghost" size="icon" onClick={() => setDialog("help")} aria-label="Viewer help"><CircleHelp /></Button></div></header>
    <div className="studio-main">
      <section className={cn("viewer", environment === "outdoor" && "viewer-daylight")} aria-label="3D product viewer">
        <div className="viewer-heading"><div className="eyebrow"><span />ENGINEERED FOR THE EVERYDAY. AND BEYOND.</div><h1>KuKirin <span>G2</span><span className="model-tag">2024 EDITION</span></h1><p>All-terrain spirit. Every detail, explored.</p></div>
        <div className="viewer-view-label"><Box className="size-4" /><span>{view === "perspective" ? "Perspective view" : view === "side" ? "Side profile" : view === "front" ? "Front view" : "Detail view"}</span></div>
        <div className="scene-container"><SceneBoundary><ScooterScene settings={settings} autoRotate={autoRotate} grid={grid} environment={environment} view={view} cameraKey={cameraKey} captureKey={captureKey} exportKey={exportKey} onReady={onReady} /></SceneBoundary></div>
        {!ready && <div className="loading-model"><span className="loading-ring" /><span>Preparing your G2…</span></div>}
        <div className="side-tools"><ToolButton label="Reset camera" onClick={resetCamera}><RotateCcw /></ToolButton><ToolButton label="Close-up view" active={view === "detail"} onClick={() => { setView(view === "detail" ? "perspective" : "detail"); setCameraKey(k => k + 1) }}><Focus /></ToolButton><span className="toolbar-divider" /><ToolButton label="Toggle ground grid" active={grid} onClick={() => setGrid(!grid)}><Grid2X2 /></ToolButton><ToolButton label="Toggle wireframe" active={settings.wireframe} onClick={() => update({ wireframe: !settings.wireframe })}><Scan /></ToolButton></div>
        <div className="viewer-bottom"><div className="camera-toolbar"><div className="camera-views"><ToggleGroup value={[view]} onValueChange={v => { if (v[0]) { setView(v[0] as CameraView); setCameraKey(k => k + 1) } }} aria-label="Camera view" spacing={0}><ToggleGroupItem value="perspective"><Box /><span>3D view</span></ToggleGroupItem><ToggleGroupItem value="side">Side</ToggleGroupItem><ToggleGroupItem value="front">Front</ToggleGroupItem></ToggleGroup></div><span className="vertical-divider" /><ToolButton label="Save image" onClick={saveImage}>{saved ? <Check /> : <Camera />}</ToolButton><ToolButton label={expanded ? "Exit expanded view" : "Expand viewer"} onClick={() => setExpanded(!expanded)}>{expanded ? <X /> : <Expand />}</ToolButton></div><p className="viewer-instructions"><Mouse className="size-3.5" /><span>Drag to orbit</span><span className="instruction-dot">·</span><span>Scroll to zoom</span><span className="instruction-dot">·</span><span>Right-click to pan</span></p></div>
        <div className="viewer-corner-label"><span className={cn("status-indicator", settings.playing && "is-playing")} />{settings.playing ? "ANIMATION PLAYING" : "REAL-TIME RENDER"}</div><div className="axis-indicator" aria-hidden="true"><span>Y</span><span>Z</span><span>X</span><Move className="size-6" /></div>
      </section>
      <StudioInspector settings={settings} update={update} autoRotate={autoRotate} setAutoRotate={setAutoRotate} environment={environment} setEnvironment={setEnvironment} onReference={() => setDialog("reference")} onReset={resetAll} />
    </div>
    <footer className="studio-footer"><div className="footer-product"><span className="footer-g2">G2</span><div><strong>Made to go further.</strong><span>The city is only the beginning.</span></div></div><div className="spec-highlights"><div><strong>800 <span>W</span></strong><span>Motor power</span></div><div><strong>45 <span>km/h</span></strong><span>Max. speed</span></div><div><strong>55 <span>km</span></strong><span>Max. range</span></div></div><button className="footer-spec-link" onClick={() => setDialog("specs")}>A closer look at the G2 <ArrowUpRight className="size-4" /></button><span className="footer-note">A study in motion.<br />Built for exploration.</span></footer>
    <Dialog open={dialog !== null} onOpenChange={open => { if (!open) setDialog(null) }}><DialogContent className="studio-dialog sm:max-w-lg"><DialogHeader><DialogTitle>{dialog === "reference" ? "The real-world reference" : dialog === "specs" ? "Meet the KuKirin G2" : "A new perspective, at your fingertips."}</DialogTitle><DialogDescription>{dialog === "reference" ? "Your photograph, translated into an interactive 3D recreation." : dialog === "specs" ? "An all-terrain electric scooter with a distinctive black-and-orange frame." : "Take a look around. The details are yours to discover."}</DialogDescription></DialogHeader>
      {dialog === "reference" && <><img className="reference-full" src={REFERENCE_IMAGE} alt="KuKirin G2 with black frame, orange detailing, off-road tires and raised handlebars, photographed on pavement" /><p className="dialog-note">Custom geometry modeled from this image. Proportions and mechanical movement are illustrative, not manufacturer CAD.</p></>}
      {dialog === "specs" && <><div className="spec-dialog-wordmark">G2<span>GO BEYOND.</span></div><dl className="spec-table">{[["Motor", "800 W rear-wheel drive"], ["Maximum speed", "Up to 45 km/h"], ["Maximum range", "Up to 55 km"], ["Tires", "10-inch all-terrain"], ["Suspension", "Front and rear spring suspension"], ["Braking", "Front and rear disc brakes"], ["Frame", "Folding stem, wide standing deck"]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl><p className="dialog-note">Indicative G2 specifications; versions vary. Range and speed depend on rider weight, terrain, conditions, and local restrictions. This is an independent visualization, not an official KuKirin product.</p></>}
      {dialog === "help" && <div className="help-content"><div><Rotate3D /><span><strong>Orbit</strong>Drag with your mouse or one finger.</span></div><div><Maximize /><span><strong>Zoom</strong>Scroll, or pinch with two fingers.</span></div><div><Move /><span><strong>Pan</strong>Right-click and drag, or use two fingers.</span></div><div><Box /><span><strong>Bring it to life</strong>Choose a sequence and press Play. Adjust the speed, lighting, and colorway in the controls.</span></div><div><ArrowDownToLine /><span><strong>Take it with you</strong>Export a GLB model with wheel and folding animation clips, or save a PNG of your current view.</span></div></div>}
    </DialogContent></Dialog>
  </main></TooltipProvider>
}
