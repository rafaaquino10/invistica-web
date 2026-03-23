'use client'

import { useState, useCallback } from 'react'
import { Button, Modal, Badge } from '@/components/ui'
import { cn } from '@/lib/utils'
import { formatCurrency, formatDate } from '@/lib/utils/formatters'

interface ParsedTransaction {
  ticker: string
  type: 'BUY' | 'SELL'
  date: Date
  quantity: number
  price: number
  fees: number
  isValid: boolean
  errors: string[]
}

interface CSVImportProps {
  isOpen: boolean
  onClose: () => void
  onImport: (transactions: ParsedTransaction[]) => Promise<void>
  portfolioId: string
}

// Expected CSV format:
// Ticker,Tipo,Data,Quantidade,Preço,Taxas
// PETR4,COMPRA,2024-01-15,100,38.50,0.50

const COLUMN_MAPPINGS: Record<string, keyof ParsedTransaction> = {
  ticker: 'ticker',
  ativo: 'ticker',
  codigo: 'ticker',
  código: 'ticker',
  symbol: 'ticker',
  tipo: 'type',
  type: 'type',
  operacao: 'type',
  operação: 'type',
  data: 'date',
  date: 'date',
  quantidade: 'quantity',
  quantity: 'quantity',
  qtd: 'quantity',
  preco: 'price',
  preço: 'price',
  price: 'price',
  valor: 'price',
  taxas: 'fees',
  fees: 'fees',
  custos: 'fees',
}

const TYPE_MAPPINGS: Record<string, 'BUY' | 'SELL'> = {
  buy: 'BUY',
  compra: 'BUY',
  c: 'BUY',
  sell: 'SELL',
  venda: 'SELL',
  v: 'SELL',
}

function parseCSV(content: string): { headers: string[]; rows: string[][] } {
  const lines = content.trim().split(/\r?\n/)
  const headers = lines[0]!.split(/[,;]/).map((h) => h.trim().toLowerCase().replace(/['"]/g, ''))
  const rows = lines.slice(1).map((line) =>
    line.split(/[,;]/).map((cell) => cell.trim().replace(/['"]/g, ''))
  )
  return { headers, rows }
}

function parseDate(value: string): Date | null {
  // Try different date formats
  const formats = [
    /^(\d{4})-(\d{2})-(\d{2})$/, // YYYY-MM-DD
    /^(\d{2})\/(\d{2})\/(\d{4})$/, // DD/MM/YYYY
    /^(\d{2})-(\d{2})-(\d{4})$/, // DD-MM-YYYY
  ]

  for (const format of formats) {
    const match = value.match(format)
    if (match) {
      if (format === formats[0]) {
        return new Date(parseInt(match[1] ?? ''), parseInt(match[2] ?? '') - 1, parseInt(match[3] ?? ''))
      } else {
        return new Date(parseInt(match[3] ?? ''), parseInt(match[2] ?? '') - 1, parseInt(match[1] ?? ''))
      }
    }
  }

  const parsed = new Date(value)
  return isNaN(parsed.getTime()) ? null : parsed
}

function parseNumber(value: string): number | null {
  const cleaned = value.replace(/[^\d.,\-]/g, '').replace(',', '.')
  const num = parseFloat(cleaned)
  return isNaN(num) ? null : num
}

export function CSVImport({ isOpen, onClose, onImport, portfolioId }: CSVImportProps) {
  const [step, setStep] = useState<'upload' | 'preview' | 'importing'>('upload')
  const [parsedData, setParsedData] = useState<ParsedTransaction[]>([])
  const [error, setError] = useState<string | null>(null)
  const [importProgress, setImportProgress] = useState(0)

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setError(null)

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const { headers, rows } = parseCSV(content)

        // Map headers to fields
        const columnMap = new Map<number, keyof ParsedTransaction>()
        headers.forEach((header, index) => {
          const mappedField = COLUMN_MAPPINGS[header]
          if (mappedField) {
            columnMap.set(index, mappedField)
          }
        })

        // Check required columns
        const hasRequired = ['ticker', 'type', 'date', 'quantity', 'price'].every((field) =>
          Array.from(columnMap.values()).includes(field as keyof ParsedTransaction)
        )

        if (!hasRequired) {
          setError('Arquivo CSV deve conter as colunas: Ticker, Tipo, Data, Quantidade, Preço')
          return
        }

        // Parse rows
        const transactions: ParsedTransaction[] = rows
          .filter((row) => row.some((cell) => cell.trim()))
          .map((row) => {
            const tx: Partial<ParsedTransaction> = {
              fees: 0,
              isValid: true,
              errors: [],
            }

            columnMap.forEach((field, index) => {
              const value = row[index] ?? ''

              switch (field) {
                case 'ticker':
                  tx.ticker = value.toUpperCase()
                  if (!tx.ticker) {
                    tx.errors!.push('Ticker inválido')
                    tx.isValid = false
                  }
                  break

                case 'type':
                  tx.type = TYPE_MAPPINGS[value.toLowerCase()]
                  if (!tx.type) {
                    tx.errors!.push('Tipo inválido (use Compra/Venda)')
                    tx.isValid = false
                  }
                  break

                case 'date':
                  const date = parseDate(value)
                  if (date) {
                    tx.date = date
                  } else {
                    tx.errors!.push('Data inválida')
                    tx.isValid = false
                  }
                  break

                case 'quantity':
                  const qty = parseNumber(value)
                  if (qty !== null && qty > 0) {
                    tx.quantity = qty
                  } else {
                    tx.errors!.push('Quantidade inválida')
                    tx.isValid = false
                  }
                  break

                case 'price':
                  const price = parseNumber(value)
                  if (price !== null && price > 0) {
                    tx.price = price
                  } else {
                    tx.errors!.push('Preço inválido')
                    tx.isValid = false
                  }
                  break

                case 'fees':
                  const fees = parseNumber(value)
                  if (fees !== null) {
                    tx.fees = fees
                  }
                  break
              }
            })

            return tx as ParsedTransaction
          })

        setParsedData(transactions)
        setStep('preview')
      } catch (err) {
        setError('Erro ao processar arquivo. Verifique o formato do CSV.')
      }
    }

    reader.readAsText(file)
  }, [])

  const handleImport = async () => {
    const validTransactions = parsedData.filter((tx) => tx.isValid)
    if (validTransactions.length === 0) {
      setError('Nenhuma transação válida para importar')
      return
    }

    setStep('importing')
    setImportProgress(0)

    try {
      await onImport(validTransactions)
      onClose()
      setStep('upload')
      setParsedData([])
    } catch (err) {
      setError('Erro ao importar transações')
      setStep('preview')
    }
  }

  const validCount = parsedData.filter((tx) => tx.isValid).length
  const invalidCount = parsedData.filter((tx) => !tx.isValid).length

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        onClose()
        setStep('upload')
        setParsedData([])
        setError(null)
      }}
      title="Importar Operações via CSV"
      size="lg"
    >
      {step === 'upload' && (
        <div className="space-y-6">
          <div className="border-2 border-dashed border-[var(--border-1)] rounded-[var(--radius)] p-8 text-center">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
              id="csv-upload"
            />
            <label
              htmlFor="csv-upload"
              className="cursor-pointer flex flex-col items-center"
            >
              <div className="w-16 h-16 rounded-full bg-[var(--surface-2)] flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--text-2)]">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>
              <p className="font-medium mb-1">Clique para selecionar arquivo</p>
              <p className="text-sm text-[var(--text-2)]">ou arraste um arquivo CSV aqui</p>
            </label>
          </div>

          {error && (
            <div className="p-4 bg-red/10 border border-red rounded-lg text-red text-sm">
              {error}
            </div>
          )}

          <div className="p-4 bg-[var(--surface-2)] rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <p className="font-medium">Formato esperado do CSV:</p>
              <button
                onClick={() => {
                  const template = 'Ticker;Tipo;Data;Quantidade;Preco;Taxas\nPETR4;Compra;2024-01-15;100;38.50;0.50\nVALE3;Venda;2024-02-20;50;58.00;0\n'
                  const blob = new Blob([template], { type: 'text/csv' })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = 'template-operacoes.csv'
                  a.click()
                  URL.revokeObjectURL(url)
                }}
                className="text-[12px] font-medium text-[var(--accent-1)] hover:underline"
              >
                Baixar template
              </button>
            </div>
            <code className="text-sm text-[var(--text-2)]">
              Ticker;Tipo;Data;Quantidade;Preco;Taxas<br />
              PETR4;Compra;2024-01-15;100;38.50;0.50<br />
              VALE3;Venda;2024-02-20;50;58.00;0
            </code>
            <p className="text-[11px] text-[var(--text-3)] mt-2">
              Aceita separador vírgula ou ponto-e-vírgula. Data nos formatos: AAAA-MM-DD, DD/MM/AAAA ou DD-MM-AAAA.
            </p>
          </div>
        </div>
      )}

      {step === 'preview' && (
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 p-3 bg-teal/10 rounded-lg">
              <p className="text-sm text-[var(--text-2)]">Válidas</p>
              <p className="text-2xl font-bold text-teal">{validCount}</p>
            </div>
            {invalidCount > 0 && (
              <div className="flex-1 p-3 bg-red/10 rounded-lg">
                <p className="text-sm text-[var(--text-2)]">Inválidas</p>
                <p className="text-2xl font-bold text-red">{invalidCount}</p>
              </div>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-[var(--surface-1)]">
                <tr className="border-b border-[var(--border-1)]">
                  <th className="py-2 text-left font-medium">Status</th>
                  <th className="py-2 text-left font-medium">Ticker</th>
                  <th className="py-2 text-left font-medium">Tipo</th>
                  <th className="py-2 text-left font-medium">Data</th>
                  <th className="py-2 text-right font-medium">Qtd</th>
                  <th className="py-2 text-right font-medium">Preço</th>
                  <th className="py-2 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {parsedData.map((tx, index) => (
                  <tr
                    key={index}
                    className={cn(
                      'border-b border-[var(--border-1)]',
                      !tx.isValid && 'bg-red/5'
                    )}
                  >
                    <td className="py-2">
                      {tx.isValid ? (
                        <Badge variant="success" size="sm">OK</Badge>
                      ) : (
                        <Badge variant="danger" size="sm" title={tx.errors.join(', ')}>Erro</Badge>
                      )}
                    </td>
                    <td className="py-2 font-mono">{tx.ticker || '-'}</td>
                    <td className="py-2">
                      {tx.type && (
                        <Badge variant={tx.type === 'BUY' ? 'success' : 'warning'} size="sm">
                          {tx.type === 'BUY' ? 'C' : 'V'}
                        </Badge>
                      )}
                    </td>
                    <td className="py-2">{tx.date ? formatDate(tx.date, { format: 'short' }) : '-'}</td>
                    <td className="py-2 text-right font-mono">{tx.quantity ?? '-'}</td>
                    <td className="py-2 text-right font-mono">{tx.price ? formatCurrency(tx.price) : '-'}</td>
                    <td className="py-2 text-right font-mono">
                      {tx.quantity && tx.price ? formatCurrency(tx.quantity * tx.price) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {error && (
            <div className="p-4 bg-red/10 border border-red rounded-lg text-red text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setStep('upload')}>
              Voltar
            </Button>
            <Button onClick={handleImport} disabled={validCount === 0}>
              Importar {validCount} operações
            </Button>
          </div>
        </div>
      )}

      {step === 'importing' && (
        <div className="py-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full border-4 border-[var(--accent-1)] border-t-transparent animate-spin" />
          <p className="font-medium">Importando operações...</p>
          <p className="text-sm text-[var(--text-2)]">Aguarde enquanto processamos suas transações</p>
        </div>
      )}
    </Modal>
  )
}
