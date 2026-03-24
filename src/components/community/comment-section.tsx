'use client'

import { useState } from 'react'
// TODO: Migrate to InvestIQ API when endpoint is available
import { trpc } from '@/lib/trpc/provider'
import { useAuth } from '@/hooks/use-auth'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui'

interface CommentSectionProps {
  ticker: string
}

type SortMode = 'recent' | 'top'
type SentimentFilter = 'all' | 'bull' | 'bear'

export function CommentSection({ ticker }: CommentSectionProps) {
  const { user } = useAuth()
  const [sort, setSort] = useState<SortMode>('recent')
  const [sentimentFilter, setSentimentFilter] = useState<SentimentFilter>('all')
  const [newComment, setNewComment] = useState('')
  const [commentType, setCommentType] = useState<'thesis' | 'analysis' | 'question'>('analysis')
  const [sentiment, setSentiment] = useState<'bull' | 'bear' | null>(null)
  const [showForm, setShowForm] = useState(false)

  const utils = trpc.useUtils()

  const { data: comments, isLoading } = trpc.community.listByTicker.useQuery({
    ticker,
    sort,
    sentiment: sentimentFilter,
    limit: 20,
  })

  const createComment = trpc.community.create.useMutation({
    onSuccess: () => {
      utils.community.listByTicker.invalidate({ ticker })
      setNewComment('')
      setShowForm(false)
      setSentiment(null)
    },
  })

  const voteMutation = trpc.community.vote.useMutation({
    onSuccess: () => {
      utils.community.listByTicker.invalidate({ ticker })
    },
  })

  const handleSubmit = () => {
    if (newComment.trim().length < 10) return
    createComment.mutate({
      ticker,
      content: newComment.trim(),
      type: commentType,
      sentiment,
    })
  }

  const formatDate = (date: Date | string) => {
    const d = new Date(date)
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  return (
    <div className="space-y-4">
      {/* Barra de filtros */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1 bg-[var(--surface-2)] rounded-lg p-0.5">
          {(['recent', 'top'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSort(s)}
              className={cn(
                'px-3 py-1 text-[var(--text-small)] font-medium rounded-md transition-colors',
                sort === s
                  ? 'bg-[var(--surface-1)] text-[var(--text-1)] shadow-sm'
                  : 'text-[var(--text-2)] hover:text-[var(--text-1)]'
              )}
            >
              {s === 'recent' ? 'Recentes' : 'Mais votados'}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1">
          {(['all', 'bull', 'bear'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSentimentFilter(s)}
              className={cn(
                'px-2.5 py-1 text-[var(--text-caption)] font-medium rounded transition-colors',
                sentimentFilter === s
                  ? s === 'bull' ? 'bg-[var(--pos)]/15 text-[var(--pos)]'
                    : s === 'bear' ? 'bg-[var(--neg)]/15 text-[var(--neg)]'
                    : 'bg-[var(--accent-1)]/10 text-[var(--accent-1)]'
                  : 'text-[var(--text-3)] hover:text-[var(--text-2)]'
              )}
            >
              {s === 'all' ? 'Todos' : s === 'bull' ? 'BULL' : 'BEAR'}
            </button>
          ))}
        </div>

        <div className="flex-1" />

        {user && (
          <Button size="sm" variant={showForm ? 'primary' : 'secondary'} onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancelar' : 'Contribuir'}
          </Button>
        )}
      </div>

      {/* Formulário */}
      {showForm && user && (
        <div className="p-4 rounded-[var(--radius)] border border-[var(--border-1)]/30 bg-[var(--surface-1)] space-y-3">
          <div className="flex items-center gap-2">
            <select
              value={commentType}
              onChange={(e) => setCommentType(e.target.value as any)}
              className="h-8 px-2.5 rounded-md text-[var(--text-small)] font-medium bg-[var(--bg)] border border-[var(--border-1)]/40 text-[var(--text-1)]"
            >
              <option value="thesis">Tese</option>
              <option value="analysis">Análise</option>
              <option value="question">Pergunta</option>
            </select>

            {commentType === 'thesis' && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setSentiment(sentiment === 'bull' ? null : 'bull')}
                  className={cn(
                    'px-2 py-1 text-[var(--text-caption)] font-bold rounded transition-colors',
                    sentiment === 'bull' ? 'bg-[var(--pos)]/20 text-[var(--pos)]' : 'text-[var(--text-3)] hover:text-[var(--pos)]'
                  )}
                >
                  BULL
                </button>
                <button
                  onClick={() => setSentiment(sentiment === 'bear' ? null : 'bear')}
                  className={cn(
                    'px-2 py-1 text-[var(--text-caption)] font-bold rounded transition-colors',
                    sentiment === 'bear' ? 'bg-[var(--neg)]/20 text-[var(--neg)]' : 'text-[var(--text-3)] hover:text-[var(--neg)]'
                  )}
                >
                  BEAR
                </button>
              </div>
            )}
          </div>

          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value.slice(0, 500))}
            placeholder="Compartilhe sua análise sobre este ativo..."
            rows={3}
            className="w-full px-3 py-2 rounded-md text-[var(--text-small)] bg-[var(--bg)] border border-[var(--border-1)]/40 text-[var(--text-1)] placeholder:text-[var(--text-3)] resize-none focus:outline-none focus:border-[var(--accent-1)]/40"
          />

          <div className="flex items-center justify-between">
            <span className="text-[var(--text-caption)] text-[var(--text-3)]">
              {newComment.length}/500
            </span>
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={newComment.trim().length < 10 || createComment.isPending}
            >
              {createComment.isPending ? 'Publicando...' : 'Publicar'}
            </Button>
          </div>
        </div>
      )}

      {/* Lista de comentários */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 bg-[var(--surface-2)]/50 rounded-[var(--radius)] animate-pulse" />
          ))}
        </div>
      ) : !comments?.length ? (
        <div className="py-8 text-center text-[var(--text-small)] text-[var(--text-3)]">
          Nenhuma contribuição para {ticker} ainda. Seja o primeiro!
        </div>
      ) : (
        <div className="space-y-2">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="p-3 rounded-[var(--radius)] border border-[var(--border-1)]/20 bg-[var(--surface-1)] hover:border-[var(--border-1)]/40 transition-colors"
            >
              <div className="flex items-start gap-3">
                {/* Voto */}
                <button
                  onClick={() => voteMutation.mutate({ commentId: comment.id })}
                  disabled={!user}
                  className={cn(
                    'flex flex-col items-center gap-0.5 pt-0.5 min-w-[32px]',
                    comment.hasVoted ? 'text-[var(--accent-1)]' : 'text-[var(--text-3)] hover:text-[var(--accent-1)]',
                    !user && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill={comment.hasVoted ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="18 15 12 9 6 15" />
                  </svg>
                  <span className="text-[var(--text-caption)] font-mono font-bold">{comment.upvotes}</span>
                </button>

                {/* Conteúdo */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[var(--text-small)] font-medium text-[var(--text-1)]">
                      {comment.userName}
                    </span>
                    <span className={cn(
                      'text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded',
                      comment.type === 'thesis' ? 'bg-purple-500/10 text-purple-400'
                        : comment.type === 'question' ? 'bg-blue-500/10 text-blue-400'
                        : 'bg-[var(--accent-1)]/10 text-[var(--accent-1)]'
                    )}>
                      {comment.type === 'thesis' ? 'Tese' : comment.type === 'question' ? 'Pergunta' : 'Análise'}
                    </span>
                    {comment.sentiment && (
                      <span className={cn(
                        'text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded',
                        comment.sentiment === 'bull' ? 'bg-[var(--pos)]/10 text-[var(--pos)]' : 'bg-[var(--neg)]/10 text-[var(--neg)]'
                      )}>
                        {comment.sentiment === 'bull' ? 'BULL' : 'BEAR'}
                      </span>
                    )}
                    <span className="text-[var(--text-caption)] text-[var(--text-3)]">
                      {formatDate(comment.createdAt)}
                    </span>
                  </div>
                  <p className="text-[var(--text-small)] text-[var(--text-2)] leading-relaxed">
                    {comment.content}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
