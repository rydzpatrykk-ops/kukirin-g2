"use client"

import { ArrowDownUp, ArrowUpRight, Bike, ChevronDown, ChevronRight, Lightbulb, MoveHorizontal, Pause, Play, Rotate3D, SlidersHorizontal, Sun, Warehouse, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import type { AnimationMode, ModelSettings } from "./scooter-model"

export const REFERENCE_IMAGE = "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-PUbrhe1851qu64M32gDyC313IvrD5p.png"
const animations = [
  { id: "ride", label: "Ride", icon: Bike, description: "Wheels spinning. Ready for the road." },
  { id: "fold", label: "Fold & unfold", icon: ChevronDown, description: "From your next adventure to easy storage." },
  { id: "suspension", label: "Suspension", icon: ArrowDownUp, description: "Watch the chassis respond to the terrain." },
  { id: "steer", label: "Steering", icon: MoveHorizontal, description: "Explore the front steering assembly." },
] as const

type Props = { settings: ModelSettings; update: (patch: Partial<ModelSettings>) => void; autoRotate: boolean; setAutoRotate: (value: boolean) => void; environment: "studio" | "outdoor"; setEnvironment: (value: "studio" | "outdoor") => void; onReference: () => void; onReset: () => void }

export function StudioInspector({ settings, update, autoRotate, setAutoRotate, environment, setEnvironment, onReference, onReset }: Props) {
  const current = animations.find(a => a.id === settings.animation) ?? animations[0]
  return <aside className="inspector" aria-label="Model controls">
    <div className="inspector-heading"><div><SlidersHorizontal className="size-4" /><h2>Make it your own.</h2></div><span className="control-label">LIVE PREVIEW</span></div>
    <section className="inspector-section">
      <div className="section-title"><h3>Animation</h3><span className="small-label">04 sequences</span></div>
      <p className="section-description">See the engineering in motion.</p>
      <ToggleGroup className="animation-grid" value={[settings.animation]} onValueChange={v => { if (v[0]) update({ animation: v[0] as AnimationMode, playing: true }) }} aria-label="Animation sequence">
        {animations.map(a => <ToggleGroupItem key={a.id} value={a.id} className="animation-tile"><a.icon /><span>{a.label}</span>{settings.animation === a.id && <span className="selection-dot" />}</ToggleGroupItem>)}
      </ToggleGroup>
      <div className="animation-transport"><Button className="play-button" onClick={() => update({ playing: !settings.playing })}>{settings.playing ? <Pause data-icon="inline-start" /> : <Play data-icon="inline-start" />}{settings.playing ? "Pause animation" : "Play animation"}</Button><Button variant="outline" size="icon" className="restart-button" aria-label="Restart animation" onClick={() => update({ resetKey: settings.resetKey + 1, playing: true })}><Rotate3D /></Button></div>
      <p className="animation-description" aria-live="polite">{current.description}</p>
      <FieldGroup><Field><div className="range-label"><FieldLabel id="speed-label">Playback speed</FieldLabel><output className="value-chip">{settings.speed.toFixed(2).replace(/0$/, "")}×</output></div><Slider aria-labelledby="speed-label" min={.25} max={2} step={.25} value={[settings.speed]} onValueChange={v => update({ speed: Array.isArray(v) ? v[0] : v })} /><div className="range-marks"><span>0.25×</span><span>1×</span><span>2×</span></div></Field>
      <Field orientation="horizontal"><FieldLabel htmlFor="auto-rotate"><Rotate3D className="size-4" />Auto-rotate</FieldLabel><Switch id="auto-rotate" checked={autoRotate} onCheckedChange={setAutoRotate} /></Field></FieldGroup>
    </section>
    <section className="inspector-section appearance-section">
      <div className="section-title"><h3>Appearance</h3></div>
      <div className="finish-row"><span className="property-label">Colorway</span><span className="small-label">{settings.finish === "original" ? "Black / Orange" : "Graphite edition"}</span></div>
      <ToggleGroup className="colorway-options" value={[settings.finish]} onValueChange={v => { if (v[0]) update({ finish: v[0] as ModelSettings["finish"] }) }} aria-label="Scooter colorway"><ToggleGroupItem value="original" aria-label="Original black and orange" className="colorway"><span className="swatch swatch-original" /></ToggleGroupItem><ToggleGroupItem value="graphite" aria-label="Graphite colorway" className="colorway"><span className="swatch swatch-graphite" /></ToggleGroupItem><span className="finish-description">{settings.finish === "original" ? "The original. Unmistakably G2." : "A quieter take on the original."}</span></ToggleGroup>
      <FieldGroup><Field orientation="horizontal"><FieldLabel htmlFor="headlight"><Lightbulb className="size-4" />Headlight</FieldLabel><Switch id="headlight" checked={settings.lights} onCheckedChange={lights => update({ lights })} /></Field></FieldGroup>
    </section>
    <section className="inspector-section environment-section">
      <div className="section-title"><h3>Environment</h3><Sun className="size-4 text-muted-foreground" /></div>
      <ToggleGroup className="environment-options" value={[environment]} onValueChange={v => { if (v[0]) setEnvironment(v[0] as "studio" | "outdoor") }} aria-label="Lighting environment"><ToggleGroupItem value="studio"><Warehouse /><span>Studio</span></ToggleGroupItem><ToggleGroupItem value="outdoor"><Sun /><span>Daylight</span></ToggleGroupItem></ToggleGroup>
    </section>
    <div className="inspector-bottom"><button className="reference-card" onClick={onReference}><img src={REFERENCE_IMAGE} alt="Original black and orange KuKirin G2 reference photograph" /><span><strong>From real life to 3D</strong><span>View the reference image <ArrowUpRight className="size-3.5" /></span></span><ChevronRight className="size-4" /></button><button className="reset-all" onClick={onReset}>Reset all settings <Rotate3D className="size-3.5" /></button></div>
  </aside>
}
