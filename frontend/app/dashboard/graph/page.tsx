"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { ZoomIn, ZoomOut, Maximize2, Info } from "lucide-react"

import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface GraphNode {
  id: string
  email: string
  type: "owner" | "shared"
  x: number
  y: number
  vx: number
  vy: number
}

interface GraphEdge {
  from: string
  to: string
  type: "share"
}

const graphDataSets: Record<string, { nodes: Omit<GraphNode, "x" | "y" | "vx" | "vy">[]; edges: GraphEdge[] }> = {
  "doc-001": {
    nodes: [
      { id: "1", email: "ivanov@company.com", type: "owner" },
      { id: "2", email: "petrova@company.com", type: "shared" },
      { id: "3", email: "sidorov@company.com", type: "shared" },
      { id: "4", email: "kozlova@company.com", type: "shared" },
      { id: "5", email: "novikov@company.com", type: "shared" },
      { id: "6", email: "fedorov@company.com", type: "shared" },
      { id: "7", email: "morozova@company.com", type: "shared" },
      { id: "8", email: "volkov@company.com", type: "shared" },
    ],
    edges: [
      { from: "1", to: "2", type: "share" },
      { from: "1", to: "3", type: "share" },
      { from: "2", to: "4", type: "share" },
      { from: "2", to: "5", type: "share" },
      { from: "3", to: "6", type: "share" },
      { from: "4", to: "7", type: "share" },
      { from: "5", to: "8", type: "share" },
    ],
  },
  "doc-002": {
    nodes: [
      { id: "1", email: "petrova@company.com", type: "owner" },
      { id: "2", email: "ivanov@company.com", type: "shared" },
      { id: "3", email: "kozlova@company.com", type: "shared" },
      { id: "4", email: "sidorov@company.com", type: "shared" },
      { id: "5", email: "novikov@company.com", type: "shared" },
    ],
    edges: [
      { from: "1", to: "2", type: "share" },
      { from: "1", to: "3", type: "share" },
      { from: "1", to: "4", type: "share" },
      { from: "3", to: "5", type: "share" },
    ],
  },
  "doc-003": {
    nodes: [
      { id: "1", email: "sidorov@company.com", type: "owner" },
      { id: "2", email: "ivanov@company.com", type: "shared" },
      { id: "3", email: "petrova@company.com", type: "shared" },
      { id: "4", email: "kozlova@company.com", type: "shared" },
      { id: "5", email: "novikov@company.com", type: "shared" },
      { id: "6", email: "fedorov@company.com", type: "shared" },
      { id: "7", email: "morozova@company.com", type: "shared" },
      { id: "8", email: "volkov@company.com", type: "shared" },
      { id: "9", email: "egorov@company.com", type: "shared" },
      { id: "10", email: "kuznetsova@company.com", type: "shared" },
      { id: "11", email: "popov@company.com", type: "shared" },
      { id: "12", email: "sokolova@company.com", type: "shared" },
    ],
    edges: [
      { from: "1", to: "2", type: "share" },
      { from: "1", to: "3", type: "share" },
      { from: "1", to: "4", type: "share" },
      { from: "2", to: "5", type: "share" },
      { from: "2", to: "6", type: "share" },
      { from: "3", to: "7", type: "share" },
      { from: "3", to: "8", type: "share" },
      { from: "4", to: "9", type: "share" },
      { from: "5", to: "10", type: "share" },
      { from: "6", to: "11", type: "share" },
      { from: "7", to: "12", type: "share" },
    ],
  },
}

const documents = [
  { id: "doc-001", title: "Q4_Financial_Report_2025.pdf" },
  { id: "doc-002", title: "Budget_Forecast_2026.xlsx" },
  { id: "doc-003", title: "NDA_Template_v2.docx" },
]

export default function GraphPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [selectedDoc, setSelectedDoc] = useState("doc-001")
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null)
  const [zoom, setZoom] = useState(1)
  const nodesRef = useRef<GraphNode[]>([])
  const animRef = useRef<number>(0)

  const initNodes = useCallback((docId: string) => {
    const data = graphDataSets[docId]
    if (!data) return []

    const canvas = canvasRef.current
    const cw = canvas ? canvas.width / (window.devicePixelRatio || 1) : 800
    const ch = canvas ? canvas.height / (window.devicePixelRatio || 1) : 500
    const cx = cw / 2
    const cy = ch / 2

    return data.nodes.map((n, i) => ({
      ...n,
      x: cx + (Math.random() - 0.5) * 300,
      y: cy + (Math.random() - 0.5) * 200,
      vx: 0,
      vy: 0,
    }))
  }, [])

  const simulate = useCallback((nodes: GraphNode[], edges: GraphEdge[]) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const cw = canvas.width / (window.devicePixelRatio || 1)
    const ch = canvas.height / (window.devicePixelRatio || 1)
    const cx = cw / 2
    const cy = ch / 2

    // Repulsion
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        let dx = nodes[j].x - nodes[i].x
        let dy = nodes[j].y - nodes[i].y
        const dist = Math.sqrt(dx * dx + dy * dy) || 1
        const force = 2000 / (dist * dist)
        const fx = (dx / dist) * force
        const fy = (dy / dist) * force
        nodes[i].vx -= fx
        nodes[i].vy -= fy
        nodes[j].vx += fx
        nodes[j].vy += fy
      }
    }

    // Attraction
    for (const edge of edges) {
      const source = nodes.find((n) => n.id === edge.from)
      const target = nodes.find((n) => n.id === edge.to)
      if (!source || !target) continue
      const dx = target.x - source.x
      const dy = target.y - source.y
      const dist = Math.sqrt(dx * dx + dy * dy) || 1
      const force = (dist - 120) * 0.02
      const fx = (dx / dist) * force
      const fy = (dy / dist) * force
      source.vx += fx
      source.vy += fy
      target.vx -= fx
      target.vy -= fy
    }

    // Center gravity
    for (const n of nodes) {
      n.vx += (cx - n.x) * 0.002
      n.vy += (cy - n.y) * 0.002
      n.vx *= 0.85
      n.vy *= 0.85
      n.x += n.vx
      n.y += n.vy
      n.x = Math.max(40, Math.min(cw - 40, n.x))
      n.y = Math.max(40, Math.min(ch - 40, n.y))
    }
  }, [])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const cw = canvas.width / dpr
    const ch = canvas.height / dpr

    ctx.setTransform(dpr * zoom, 0, 0, dpr * zoom, (1 - zoom) * cw * dpr / 2, (1 - zoom) * ch * dpr / 2)
    ctx.clearRect(-cw, -ch, cw * 3, ch * 3)

    const nodes = nodesRef.current
    const edges = graphDataSets[selectedDoc]?.edges || []

    simulate(nodes, edges)

    // Draw edges
    for (const edge of edges) {
      const source = nodes.find((n) => n.id === edge.from)
      const target = nodes.find((n) => n.id === edge.to)
      if (!source || !target) continue

      const gradient = ctx.createLinearGradient(source.x, source.y, target.x, target.y)
      gradient.addColorStop(0, "hsla(262, 83%, 58%, 0.4)")
      gradient.addColorStop(1, "hsla(190, 95%, 39%, 0.4)")

      ctx.beginPath()
      ctx.moveTo(source.x, source.y)
      ctx.lineTo(target.x, target.y)
      ctx.strokeStyle = gradient
      ctx.lineWidth = 1.5
      ctx.stroke()

      // Arrow
      const angle = Math.atan2(target.y - source.y, target.x - source.x)
      const arrowLen = 8
      const ax = target.x - Math.cos(angle) * 22
      const ay = target.y - Math.sin(angle) * 22
      ctx.beginPath()
      ctx.moveTo(ax, ay)
      ctx.lineTo(
        ax - arrowLen * Math.cos(angle - Math.PI / 6),
        ay - arrowLen * Math.sin(angle - Math.PI / 6)
      )
      ctx.lineTo(
        ax - arrowLen * Math.cos(angle + Math.PI / 6),
        ay - arrowLen * Math.sin(angle + Math.PI / 6)
      )
      ctx.closePath()
      ctx.fillStyle = "hsla(190, 95%, 39%, 0.6)"
      ctx.fill()
    }

    // Draw nodes
    for (const node of nodes) {
      const isOwner = node.type === "owner"
      const isHovered = hoveredNode?.id === node.id
      const radius = isOwner ? 18 : 14

      // Glow
      if (isOwner || isHovered) {
        const glow = ctx.createRadialGradient(node.x, node.y, radius, node.x, node.y, radius * 2.5)
        glow.addColorStop(0, isOwner ? "hsla(262, 83%, 58%, 0.3)" : "hsla(190, 95%, 39%, 0.2)")
        glow.addColorStop(1, "hsla(262, 83%, 58%, 0)")
        ctx.beginPath()
        ctx.arc(node.x, node.y, radius * 2.5, 0, Math.PI * 2)
        ctx.fillStyle = glow
        ctx.fill()
      }

      // Node circle
      const grad = ctx.createRadialGradient(node.x - 3, node.y - 3, 0, node.x, node.y, radius)
      if (isOwner) {
        grad.addColorStop(0, "hsl(262, 83%, 65%)")
        grad.addColorStop(1, "hsl(262, 83%, 45%)")
      } else {
        grad.addColorStop(0, "hsl(190, 95%, 50%)")
        grad.addColorStop(1, "hsl(190, 95%, 30%)")
      }

      ctx.beginPath()
      ctx.arc(node.x, node.y, radius, 0, Math.PI * 2)
      ctx.fillStyle = grad
      ctx.fill()

      // Border
      ctx.beginPath()
      ctx.arc(node.x, node.y, radius, 0, Math.PI * 2)
      ctx.strokeStyle = isOwner ? "hsla(262, 83%, 70%, 0.6)" : "hsla(190, 95%, 50%, 0.4)"
      ctx.lineWidth = 1.5
      ctx.stroke()

      // Label
      const label = node.email.split("@")[0]
      ctx.font = "500 10px Inter, system-ui, sans-serif"
      ctx.textAlign = "center"
      ctx.textBaseline = "top"
      ctx.fillStyle = "hsl(0, 0%, 75%)"
      ctx.fillText(label, node.x, node.y + radius + 6)
    }

    animRef.current = requestAnimationFrame(draw)
  }, [selectedDoc, hoveredNode, zoom, simulate])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const resize = () => {
      const parent = canvas.parentElement
      if (!parent) return
      const dpr = window.devicePixelRatio || 1
      canvas.width = parent.clientWidth * dpr
      canvas.height = parent.clientHeight * dpr
      canvas.style.width = `${parent.clientWidth}px`
      canvas.style.height = `${parent.clientHeight}px`
    }

    resize()
    nodesRef.current = initNodes(selectedDoc)
    animRef.current = requestAnimationFrame(draw)

    window.addEventListener("resize", resize)
    return () => {
      window.removeEventListener("resize", resize)
      cancelAnimationFrame(animRef.current)
    }
  }, [selectedDoc, draw, initNodes])

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const mx = (e.clientX - rect.left) / zoom - ((1 - zoom) * rect.width) / (2 * zoom)
    const my = (e.clientY - rect.top) / zoom - ((1 - zoom) * rect.height) / (2 * zoom)

    let found: GraphNode | null = null
    for (const node of nodesRef.current) {
      const dx = mx - node.x
      const dy = my - node.y
      if (dx * dx + dy * dy < 400) {
        found = node
        break
      }
    }
    setHoveredNode(found)
  }, [zoom])

  const data = graphDataSets[selectedDoc]

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader
        title="Sharing Graph"
        breadcrumbs={[{ label: "Sharing Graph" }]}
      >
        <Select value={selectedDoc} onValueChange={setSelectedDoc}>
          <SelectTrigger className="h-8 w-64 bg-secondary/50 border-border text-xs text-foreground">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-popover text-popover-foreground border-border">
            {documents.map((doc) => (
              <SelectItem key={doc.id} value={doc.id} className="text-xs">
                {doc.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </PageHeader>

      <div className="flex-1 overflow-hidden p-6">
        <div className="flex h-full flex-col gap-4 lg:flex-row">
          {/* Graph Canvas */}
          <div className="relative flex-1 rounded-xl border border-border/50 bg-card overflow-hidden">
            {/* Subtle background grid */}
            <div
              className="absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage: "radial-gradient(circle, hsl(0, 0%, 50%) 1px, transparent 1px)",
                backgroundSize: "24px 24px",
              }}
            />

            <canvas
              ref={canvasRef}
              className="relative w-full h-full min-h-[400px] cursor-crosshair"
              onMouseMove={handleCanvasMouseMove}
              onMouseLeave={() => setHoveredNode(null)}
            />

            {/* Zoom controls */}
            <div className="absolute bottom-4 right-4 flex flex-col gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7 bg-card/80 backdrop-blur border-border text-muted-foreground hover:text-foreground hover:bg-secondary"
                onClick={() => setZoom((z) => Math.min(z + 0.2, 2))}
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7 bg-card/80 backdrop-blur border-border text-muted-foreground hover:text-foreground hover:bg-secondary"
                onClick={() => setZoom((z) => Math.max(z - 0.2, 0.4))}
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7 bg-card/80 backdrop-blur border-border text-muted-foreground hover:text-foreground hover:bg-secondary"
                onClick={() => setZoom(1)}
              >
                <Maximize2 className="h-3.5 w-3.5" />
              </Button>
            </div>

            {/* Hovered node tooltip */}
            {hoveredNode && (
              <div className="absolute top-4 left-4 rounded-lg border border-border bg-popover/90 backdrop-blur px-3 py-2 text-xs shadow-lg">
                <p className="font-medium text-foreground">{hoveredNode.email}</p>
                <p className="text-muted-foreground">
                  {"Type: "}
                  <span className={hoveredNode.type === "owner" ? "text-[hsl(262,83%,58%)]" : "text-[hsl(190,95%,39%)]"}>
                    {hoveredNode.type === "owner" ? "Owner" : "Shared"}
                  </span>
                </p>
              </div>
            )}
          </div>

          {/* Info panel */}
          <div className="w-full lg:w-72 rounded-xl border border-border/50 bg-card p-5 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-medium text-foreground">Graph Info</h3>
            </div>

            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Nodes</span>
                <span className="font-mono text-foreground">{data?.nodes.length || 0}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Edges</span>
                <span className="font-mono text-foreground">{data?.edges.length || 0}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Zoom</span>
                <span className="font-mono text-foreground">{(zoom * 100).toFixed(0)}%</span>
              </div>
            </div>

            <div className="h-px bg-border/50" />

            <div>
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground/60">Legend</span>
              <div className="mt-2 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-[hsl(262,83%,58%)]" />
                  <span className="text-xs text-muted-foreground">Owner</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-[hsl(190,95%,39%)]" />
                  <span className="text-xs text-muted-foreground">Shared</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-5 w-5 flex items-center justify-center">
                    <div className="h-px w-3 bg-gradient-to-r from-[hsl(262,83%,58%)] to-[hsl(190,95%,39%)]" />
                  </div>
                  <span className="text-xs text-muted-foreground">Share link</span>
                </div>
              </div>
            </div>

            <div className="h-px bg-border/50" />

            <div>
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground/60">Participants</span>
              <div className="mt-2 flex flex-col gap-1.5 max-h-60 overflow-auto">
                {data?.nodes.map((node) => (
                  <div key={node.id} className="flex items-center gap-2 rounded-md bg-secondary/30 px-2.5 py-1.5">
                    <div
                      className="h-2 w-2 rounded-full"
                      style={{
                        backgroundColor: node.type === "owner" ? "hsl(262, 83%, 58%)" : "hsl(190, 95%, 39%)",
                      }}
                    />
                    <span className="text-[10px] text-foreground truncate">{node.email}</span>
                    {node.type === "owner" && (
                      <Badge variant="outline" className="ml-auto text-[8px] py-0 px-1 bg-[hsl(262,83%,58%)]/10 text-[hsl(262,83%,58%)] border-[hsl(262,83%,58%)]/20">
                        owner
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
