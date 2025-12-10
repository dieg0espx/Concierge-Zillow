'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Copy, Check } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export function ClientUrlDisplay({ clientId, clientSlug }: { clientId: string; clientSlug?: string | null }) {
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  // Prefer slug over UUID if available
  const identifier = clientSlug || clientId
  const url = typeof window !== 'undefined'
    ? `${window.location.origin}/client/${identifier}`
    : `/client/${identifier}`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      toast({
        title: 'Copied!',
        description: 'Client portfolio URL copied to clipboard',
      })
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to copy URL',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="flex gap-3">
      <Input
        value={url}
        readOnly
        className="font-mono text-sm bg-white/5 border-white/30 text-white/90 focus:border-white h-12 px-4"
        onClick={(e) => e.currentTarget.select()}
      />
      <Button
        variant="outline"
        size="icon"
        onClick={handleCopy}
        title="Copy URL"
        className="h-12 w-12 border-white/30 hover:bg-white/10 hover:border-white text-white flex-shrink-0"
      >
        {copied ? (
          <Check className="h-5 w-5 text-green-400" />
        ) : (
          <Copy className="h-5 w-5" />
        )}
      </Button>
    </div>
  )
}
