import { describe, it, expect } from 'vitest'
import {
  decimalToNumber,
  bigintToNumber,
  serializePrismaObject,
  serializePrismaArray,
} from '../prisma-helpers'

// Mock Prisma Decimal (duck-typed)
function createDecimal(value: number) {
  return {
    toNumber: () => value,
    toString: () => String(value),
  }
}

describe('decimalToNumber', () => {
  it('converte Prisma Decimal para number', () => {
    expect(decimalToNumber(createDecimal(13.84))).toBe(13.84)
  })

  it('retorna null para null', () => {
    expect(decimalToNumber(null)).toBeNull()
  })

  it('retorna null para undefined', () => {
    expect(decimalToNumber(undefined)).toBeNull()
  })

  it('mantém number nativo', () => {
    expect(decimalToNumber(42.5)).toBe(42.5)
  })

  it('converte string numérica', () => {
    expect(decimalToNumber('29.90')).toBe(29.9)
  })

  it('retorna null para string inválida', () => {
    expect(decimalToNumber('abc')).toBeNull()
  })
})

describe('bigintToNumber', () => {
  it('converte BigInt para number', () => {
    expect(bigintToNumber(BigInt(1000000))).toBe(1000000)
  })

  it('retorna null para null', () => {
    expect(bigintToNumber(null)).toBeNull()
  })

  it('retorna null para undefined', () => {
    expect(bigintToNumber(undefined)).toBeNull()
  })

  it('mantém number nativo', () => {
    expect(bigintToNumber(42)).toBe(42)
  })
})

describe('serializePrismaObject', () => {
  it('converte campos Decimal para number', () => {
    const obj = {
      id: 'abc',
      peRatio: createDecimal(15.2),
      roe: createDecimal(13.84),
      name: 'PETR4',
    }

    const result = serializePrismaObject(obj)
    expect(result.peRatio).toBe(15.2)
    expect(result.roe).toBe(13.84)
    expect(result.name).toBe('PETR4')
    expect(result.id).toBe('abc')
  })

  it('converte BigInt para number', () => {
    const obj = {
      id: 'quote1',
      volume: BigInt(5000000),
      close: createDecimal(28.45),
    }

    const result = serializePrismaObject(obj)
    expect(result.volume).toBe(5000000)
    expect(result.close).toBe(28.45)
  })

  it('preserva null e undefined', () => {
    const obj = {
      id: 'x',
      value: null,
      other: undefined,
    }

    const result = serializePrismaObject(obj)
    expect(result.value).toBeNull()
    expect(result.other).toBeUndefined()
  })

  it('preserva Date', () => {
    const date = new Date('2026-01-15')
    const obj = { id: 'x', createdAt: date }

    const result = serializePrismaObject(obj)
    expect(result.createdAt).toEqual(date)
  })

  it('não modifica objeto original', () => {
    const decimal = createDecimal(10)
    const obj = { id: 'x', value: decimal }

    serializePrismaObject(obj)
    expect(obj.value).toBe(decimal) // original inalterado
  })
})

describe('serializePrismaArray', () => {
  it('serializa array de objetos', () => {
    const arr = [
      { id: '1', amount: createDecimal(100) },
      { id: '2', amount: createDecimal(200) },
    ]

    const result = serializePrismaArray(arr)
    expect(result).toHaveLength(2)
    expect(result[0]!.amount).toBe(100)
    expect(result[1]!.amount).toBe(200)
  })

  it('retorna array vazio para input vazio', () => {
    expect(serializePrismaArray([])).toEqual([])
  })
})
