"use client"

import { useEffect, useState, use, Suspense } from "react"
import { createClient } from "@/lib/supabase/client"
import { VideoPlayer } from "@/components/VideoPlayer"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardTitle, CardDescription } from "@/components/ui/card"
import { CheckCircle2, XCircle } from "lucide-react"

interface ContentPiece {
  id: string
  title: string
  video_url: string
  status: 'Pending' | 'Approved' | 'Rejected'
  feedback: string | null
  created_at: string
}

// Componente interno que usa params
function ClientReviewContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  
  const supabase = createClient()
  const [content, setContent] = useState<ContentPiece | null>(null)
  const [loading, setLoading] = useState(true)
  const [showFeedback, setShowFeedback] = useState(false)
  const [feedback, setFeedback] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from('content_pieces').select('*').eq('id', id).single()
      if (data) setContent(data)
      setLoading(false)
    }
    fetch()
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleAction = async (status: 'Approved' | 'Rejected') => {
    if (status === 'Rejected' && !showFeedback) { setShowFeedback(true); return }
    setSubmitting(true)
    const payload = status === 'Rejected' 
      ? { status, feedback: feedback.trim() || "Sin comentarios" } 
      : { status, feedback: null }
    
    await supabase.from('content_pieces').update(payload).eq('id', id)
    setContent(prev => prev ? { ...prev, ...payload } : null)
    setSubmitting(false)
  }

  if (loading) return <div className="flex h-screen items-center justify-center">Cargando...</div>
  if (!content) return <div className="flex h-screen items-center justify-center">❌ Link inválido o expirado</div>

  if (content.status !== 'Pending') {
    const ok = content.status === 'Approved'
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <Card className="max-w-md text-center p-8">
          {ok 
            ? <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" /> 
            : <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          }
          <CardTitle className="text-2xl">{ok ? '✅ Aprobado' : '❌ Rechazado'}</CardTitle>
          <CardDescription className="mt-2">
            &quot;{content.title}&quot; {content.feedback && `• Feedback: ${content.feedback}`}
          </CardDescription>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Revisión de Contenido</h1>
          <p className="text-muted-foreground">{content.title}</p>
        </div>
        <VideoPlayer url={content.video_url} />
        <Card>
          <CardContent className="pt-6">
            {!showFeedback ? (
              <div className="flex gap-4 justify-center">
                <Button size="lg" className="bg-green-600 hover:bg-green-700" onClick={() => handleAction('Approved')}>
                  <CheckCircle2 className="mr-2 h-5 w-5" /> Aprobar
                </Button>
                <Button size="lg" variant="destructive" onClick={() => handleAction('Rejected')}>
                  <XCircle className="mr-2 h-5 w-5" /> Rechazar
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <Textarea 
                  placeholder="Escribe tus comentarios para iterar..." 
                  value={feedback} 
                  onChange={e => setFeedback(e.target.value)} 
                  rows={4} 
                />
                <div className="flex gap-3 justify-end">
                  <Button variant="outline" onClick={() => setShowFeedback(false)}>Cancelar</Button>
                  <Button 
                    variant="destructive" 
                    onClick={() => handleAction('Rejected')} 
                    disabled={submitting || !feedback.trim()}
                  >
                    {submitting ? "Enviando..." : "Enviar Feedback y Rechazar"}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Componente principal que envuelve en Suspense
export default function ClientReviewPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">Cargando página...</div>}>
      <ClientReviewContent params={params} />
    </Suspense>
  )
}