'use client'

import { Input } from '@/components/ui'
import { formatCurrencyInput } from './currency-helpers'

// ===========================================
// Campo de Entrada de Moeda
// ===========================================

export function CurrencyInput({
  label,
  value,
  onChange,
  placeholder = 'R$ 0',
  required = false,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  required?: boolean
}) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numericValue = e.target.value.replace(/\D/g, '')
    onChange(numericValue)
  }

  const displayValue = value ? `R$ ${formatCurrencyInput(value)}` : ''

  return (
    <div>
      <label className="block text-xs font-medium text-[var(--text-2)] uppercase tracking-wider mb-1">
        {label}
        {required && <span className="text-red ml-1">*</span>}
      </label>
      <Input
        type="text"
        inputMode="numeric"
        placeholder={placeholder}
        value={displayValue}
        onChange={handleChange}
        className="font-mono h-10 text-sm"
      />
    </div>
  )
}

// ===========================================
// Campo de Entrada com Slider
// ===========================================

export function SliderInput({
  label,
  value,
  onChange,
  min,
  max,
  step,
  suffix = '',
}: {
  label: string
  value: number
  onChange: (value: number) => void
  min: number
  max: number
  step: number
  suffix?: string
}) {
  const percentage = ((value - min) / (max - min)) * 100

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-xs font-medium text-[var(--text-2)] uppercase tracking-wider">{label}</label>
        <span className="text-sm font-mono font-medium text-[var(--accent-1)]">
          {value.toFixed(step < 1 ? 1 : 0)}{suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 bg-[var(--border-1)] rounded-full appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, var(--accent-1) 0%, var(--accent-1) ${percentage}%, var(--border-1) ${percentage}%, var(--border-1) 100%)`
        }}
      />
      <div className="flex justify-between mt-0.5 text-xs text-[var(--text-2)]">
        <span>{min}{suffix}</span>
        <span>{max}{suffix}</span>
      </div>
      <style jsx>{`
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: white;
          border: 2px solid var(--accent-1);
          cursor: pointer;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        input[type="range"]::-moz-range-thumb {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: white;
          border: 2px solid var(--accent-1);
          cursor: pointer;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
      `}</style>
    </div>
  )
}
