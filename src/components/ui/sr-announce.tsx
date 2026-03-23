'use client'
// Região live para anúncios de screen readers (atualizações dinâmicas)
import { useEffect, useState } from 'react'

interface SRAnnounceProps {
  message: string
  politeness?: 'polite' | 'assertive'
}

export function SRAnnounce({ message, politeness = 'polite' }: SRAnnounceProps) {
  const [announced, setAnnounced] = useState('')

  useEffect(() => {
    if (!message) return
    // Limpa primeiro para forçar re-anúncio de mensagens iguais
    setAnnounced('')
    const id = setTimeout(() => setAnnounced(message), 50)
    return () => clearTimeout(id)
  }, [message])

  return (
    <span
      role="status"
      aria-live={politeness}
      aria-atomic="true"
      className="sr-only"
    >
      {announced}
    </span>
  )
}
