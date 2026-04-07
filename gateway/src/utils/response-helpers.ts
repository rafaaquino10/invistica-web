export function createBrapiResponse<T>(results: T) {
  return {
    results,
    requestedAt: new Date().toISOString(),
    took: `${Math.floor(Math.random() * 50 + 10)}ms`,
  }
}

export function createPaginatedResponse<T>(
  data: T[],
  page: number = 1,
  pageSize: number = 20
) {
  const total = data.length
  const totalPages = Math.ceil(total / pageSize)
  const startIndex = (page - 1) * pageSize
  const endIndex = startIndex + pageSize
  const paginatedData = data.slice(startIndex, endIndex)

  return {
    data: paginatedData,
    pagination: {
      page,
      pageSize,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  }
}

export function randomVariation(baseValue: number, percentRange: number = 5): number {
  const variation = 1 + (Math.random() - 0.5) * (percentRange / 50)
  return Number((baseValue * variation).toFixed(2))
}

export function generateHistoricalDates(days: number): Date[] {
  const dates: Date[] = []
  const today = new Date()

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    // Skip weekends
    if (date.getDay() !== 0 && date.getDay() !== 6) {
      dates.push(date)
    }
  }

  return dates
}
