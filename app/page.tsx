"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Copy, ExternalLink } from "lucide-react"

interface ContentPiece {
  id: string
  title: string
  video_url: string
  status: 'Pending' | 'Approved' | 'Rejected'
  feedback: string | null
  created_at: string
}

export default function AgencyDashboard() {
  const supabase = createClient()
  const [contents, setContents] = useState<ContentPiece[]>([])
  const [title, setTitle] = useState("")
  const [url, setUrl] = useState("")
  const [loading, setLoading] = useState(false)

 useEffect(() => {
      const fetch = async () => {
        const { data } = await supabase.from('content_pieces').select('*').order('created_at', { ascending: false })
        if (data) setContents(data)
      }
      fetch()

      const channel = supabase
        .channel('realtime:content')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'content_pieces' }, (payload) => {
          if (payload.eventType === 'INSERT') setContents(prev => [payload.new as ContentPiece, ...prev])
          else if (payload.eventType === 'UPDATE') setContents(prev => prev.map(i => i.id === (payload.new as ContentPiece).id ? payload.new as ContentPiece : i))
        })
        .subscribe()

      return () => { supabase.removeChannel(channel) }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await supabase.from('content_pieces').insert([{ title, video_url: url }])
    setTitle(""); setUrl(""); setLoading(false)
  }

  const copyLink = (id: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/client/${id}`)
    alert("✅ URL copiada al portapapeles")
  }

  const StatusBadge = ({ status }: { status: string }) => {
    const cls = status === 'Approved' ? 'bg-green-500' : status === 'Rejected' ? 'bg-red-500' : 'bg-yellow-500'
    return <Badge className={cls}>{status}</Badge>
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <h1 className="text-3xl font-bold mb-8">🎬 Fleepr Agency Dashboard</h1>
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader><CardTitle>Nuevo Contenido</CardTitle><CardDescription>Envía un video para aprobación</CardDescription></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2"><Label>Título</Label><Input value={title} onChange={e => setTitle(e.target.value)} required placeholder="Ej: Campaña Q4" /></div>
              <div className="space-y-2"><Label>URL del Video</Label><Input value={url} onChange={e => setUrl(e.target.value)} required placeholder="YouTube, Vimeo o MP4" /></div>
              <Button type="submit" className="w-full" disabled={loading}>{loading ? "Enviando..." : "🚀 Generar Link"}</Button>
            </form>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader><CardTitle>Contenidos Activos</CardTitle><CardDescription>Estado en tiempo real</CardDescription></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow><TableHead>Título</TableHead><TableHead>Estado</TableHead><TableHead>Feedback</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {contents.map(item => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.title}</TableCell>
                    <TableCell><StatusBadge status={item.status} /></TableCell>
                    <TableCell className="max-w-[150px] truncate">{item.feedback || "—"}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button size="sm" variant="ghost" onClick={() => copyLink(item.id)}><Copy className="h-4 w-4" /></Button>
                      <Button size="sm" variant="ghost" asChild><a href={`/client/${item.id}`} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" /></a></Button>
                    </TableCell>
                  </TableRow>
                ))}
                {contents.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-4">Sin contenidos aún. ¡Crea el primero!</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}