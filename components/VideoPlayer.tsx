"use client"

import { useEffect, useState } from "react"
import ReactPlayer from "react-player/lazy"

export function VideoPlayer({ url }: { url: string }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  if (!mounted) {
    return <div className="w-full aspect-video bg-slate-100 animate-pulse rounded-lg flex items-center justify-center text-muted-foreground">Cargando video...</div>
  }

  return (
    <div className="relative pt-[56.25%] rounded-lg overflow-hidden bg-black">
      <ReactPlayer
        url={url}
        className="absolute top-0 left-0"
        width="100%"
        height="100%"
        controls
        config={{
          youtube: { playerVars: { modestbranding: 1 } },
          vimeo: { playerOptions: { byline: false, portrait: false } }
        }}
      />
    </div>
  )
}