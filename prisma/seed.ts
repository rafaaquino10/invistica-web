import { PrismaClient, Prisma } from '@prisma/client'

const prisma = new PrismaClient()

// ===========================================
// Seed Data - 15 Real Brazilian Assets
// ===========================================

const assets: Prisma.AssetCreateInput[] = [
  // Ações
  {
    ticker: 'PETR4',
    name: 'Petrobras PN',
    type: 'stock',
    sector: 'Petróleo, Gás e Biocombustíveis',
    subsector: 'Exploração, Refino e Distribuição',
    segment: 'Petróleo e Gás',
    listingSegment: 'Tradicional',
    cnpj: '33000167000101',
  },
  {
    ticker: 'VALE3',
    name: 'Vale ON',
    type: 'stock',
    sector: 'Materiais Básicos',
    subsector: 'Mineração',
    segment: 'Minerais Metálicos',
    listingSegment: 'Novo Mercado',
    cnpj: '33592510000154',
  },
  {
    ticker: 'ITUB4',
    name: 'Itaú Unibanco PN',
    type: 'stock',
    sector: 'Financeiro',
    subsector: 'Intermediários Financeiros',
    segment: 'Bancos',
    listingSegment: 'N1',
    cnpj: '60872504000123',
  },
  {
    ticker: 'BBDC4',
    name: 'Bradesco PN',
    type: 'stock',
    sector: 'Financeiro',
    subsector: 'Intermediários Financeiros',
    segment: 'Bancos',
    listingSegment: 'N1',
    cnpj: '60746948000112',
  },
  {
    ticker: 'ABEV3',
    name: 'Ambev ON',
    type: 'stock',
    sector: 'Consumo não Cíclico',
    subsector: 'Bebidas',
    segment: 'Cervejas e Refrigerantes',
    listingSegment: 'Novo Mercado',
    cnpj: '07526557000100',
  },
  {
    ticker: 'WEGE3',
    name: 'WEG ON',
    type: 'stock',
    sector: 'Bens Industriais',
    subsector: 'Máquinas e Equipamentos',
    segment: 'Motores, Compressores e Outros',
    listingSegment: 'Novo Mercado',
    cnpj: '84429695000111',
  },
  {
    ticker: 'RENT3',
    name: 'Localiza ON',
    type: 'stock',
    sector: 'Consumo Cíclico',
    subsector: 'Diversos',
    segment: 'Aluguel de Carros',
    listingSegment: 'Novo Mercado',
    cnpj: '16670085000155',
  },
  {
    ticker: 'BBAS3',
    name: 'Banco do Brasil ON',
    type: 'stock',
    sector: 'Financeiro',
    subsector: 'Intermediários Financeiros',
    segment: 'Bancos',
    listingSegment: 'Novo Mercado',
    cnpj: '00000000000191',
  },
  {
    ticker: 'ITSA4',
    name: 'Itaúsa PN',
    type: 'stock',
    sector: 'Financeiro',
    subsector: 'Holdings Diversificadas',
    segment: 'Holdings Diversificadas',
    listingSegment: 'N1',
    cnpj: '61532644000115',
  },
  {
    ticker: 'B3SA3',
    name: 'B3 ON',
    type: 'stock',
    sector: 'Financeiro',
    subsector: 'Serviços Financeiros Diversos',
    segment: 'Serviços Financeiros Diversos',
    listingSegment: 'Novo Mercado',
    cnpj: '09346601000125',
  },
  {
    ticker: 'EGIE3',
    name: 'Engie Brasil ON',
    type: 'stock',
    sector: 'Utilidade Pública',
    subsector: 'Energia Elétrica',
    segment: 'Energia Elétrica',
    listingSegment: 'Novo Mercado',
    cnpj: '02474103000119',
  },
  {
    ticker: 'TAEE11',
    name: 'Taesa Unit',
    type: 'stock',
    sector: 'Utilidade Pública',
    subsector: 'Energia Elétrica',
    segment: 'Energia Elétrica',
    listingSegment: 'N2',
    cnpj: '07859971000130',
  },
  // FIIs
  {
    ticker: 'HGLG11',
    name: 'CSHG Logística FII',
    type: 'fii',
    sector: 'Fundos Imobiliários',
    subsector: 'Logística',
    segment: 'Logística',
    listingSegment: null,
    cnpj: '11728688000147',
  },
  {
    ticker: 'KNRI11',
    name: 'Kinea Renda Imobiliária FII',
    type: 'fii',
    sector: 'Fundos Imobiliários',
    subsector: 'Híbrido',
    segment: 'Híbrido',
    listingSegment: null,
    cnpj: '12005956000165',
  },
  {
    ticker: 'XPML11',
    name: 'XP Malls FII',
    type: 'fii',
    sector: 'Fundos Imobiliários',
    subsector: 'Shopping',
    segment: 'Shopping',
    listingSegment: null,
    cnpj: '28757546000152',
  },
]

// Realistic fundamentals data
const fundamentalsData: Record<string, Partial<Prisma.FundamentalCreateWithoutAssetInput>> = {
  PETR4: {
    revenue: new Prisma.Decimal(510000000000),
    ebitda: new Prisma.Decimal(220000000000),
    netIncome: new Prisma.Decimal(93000000000),
    totalAssets: new Prisma.Decimal(850000000000),
    totalEquity: new Prisma.Decimal(380000000000),
    netDebt: new Prisma.Decimal(180000000000),
    roe: new Prisma.Decimal(0.2447),
    roic: new Prisma.Decimal(0.1850),
    netMargin: new Prisma.Decimal(0.1824),
    ebitdaMargin: new Prisma.Decimal(0.4314),
    peRatio: new Prisma.Decimal(4.2),
    pbRatio: new Prisma.Decimal(1.1),
    evEbitda: new Prisma.Decimal(2.8),
    dividendYield: new Prisma.Decimal(0.1850),
    payoutRatio: new Prisma.Decimal(0.65),
    netDebtEbitda: new Prisma.Decimal(0.82),
  },
  VALE3: {
    revenue: new Prisma.Decimal(210000000000),
    ebitda: new Prisma.Decimal(95000000000),
    netIncome: new Prisma.Decimal(42000000000),
    totalAssets: new Prisma.Decimal(450000000000),
    totalEquity: new Prisma.Decimal(180000000000),
    netDebt: new Prisma.Decimal(35000000000),
    roe: new Prisma.Decimal(0.2333),
    roic: new Prisma.Decimal(0.2100),
    netMargin: new Prisma.Decimal(0.20),
    ebitdaMargin: new Prisma.Decimal(0.4524),
    peRatio: new Prisma.Decimal(5.8),
    pbRatio: new Prisma.Decimal(1.4),
    evEbitda: new Prisma.Decimal(3.2),
    dividendYield: new Prisma.Decimal(0.12),
    payoutRatio: new Prisma.Decimal(0.55),
    netDebtEbitda: new Prisma.Decimal(0.37),
  },
  ITUB4: {
    revenue: new Prisma.Decimal(165000000000),
    ebitda: new Prisma.Decimal(75000000000),
    netIncome: new Prisma.Decimal(35000000000),
    totalAssets: new Prisma.Decimal(2500000000000),
    totalEquity: new Prisma.Decimal(200000000000),
    netDebt: new Prisma.Decimal(0),
    roe: new Prisma.Decimal(0.2050),
    roic: new Prisma.Decimal(0.15),
    netMargin: new Prisma.Decimal(0.2121),
    ebitdaMargin: new Prisma.Decimal(0.4545),
    peRatio: new Prisma.Decimal(8.2),
    pbRatio: new Prisma.Decimal(1.5),
    evEbitda: new Prisma.Decimal(6.5),
    dividendYield: new Prisma.Decimal(0.065),
    payoutRatio: new Prisma.Decimal(0.40),
    netDebtEbitda: new Prisma.Decimal(0),
  },
  BBDC4: {
    revenue: new Prisma.Decimal(150000000000),
    ebitda: new Prisma.Decimal(65000000000),
    netIncome: new Prisma.Decimal(27000000000),
    totalAssets: new Prisma.Decimal(1900000000000),
    totalEquity: new Prisma.Decimal(160000000000),
    netDebt: new Prisma.Decimal(0),
    roe: new Prisma.Decimal(0.1687),
    roic: new Prisma.Decimal(0.12),
    netMargin: new Prisma.Decimal(0.18),
    ebitdaMargin: new Prisma.Decimal(0.4333),
    peRatio: new Prisma.Decimal(7.5),
    pbRatio: new Prisma.Decimal(1.0),
    evEbitda: new Prisma.Decimal(5.8),
    dividendYield: new Prisma.Decimal(0.072),
    payoutRatio: new Prisma.Decimal(0.38),
    netDebtEbitda: new Prisma.Decimal(0),
  },
  WEGE3: {
    revenue: new Prisma.Decimal(32000000000),
    ebitda: new Prisma.Decimal(7200000000),
    netIncome: new Prisma.Decimal(5100000000),
    totalAssets: new Prisma.Decimal(35000000000),
    totalEquity: new Prisma.Decimal(22000000000),
    netDebt: new Prisma.Decimal(-3500000000),
    roe: new Prisma.Decimal(0.2318),
    roic: new Prisma.Decimal(0.28),
    netMargin: new Prisma.Decimal(0.1594),
    ebitdaMargin: new Prisma.Decimal(0.225),
    peRatio: new Prisma.Decimal(35.5),
    pbRatio: new Prisma.Decimal(8.2),
    evEbitda: new Prisma.Decimal(24.5),
    dividendYield: new Prisma.Decimal(0.012),
    payoutRatio: new Prisma.Decimal(0.42),
    netDebtEbitda: new Prisma.Decimal(-0.49),
  },
  ABEV3: {
    revenue: new Prisma.Decimal(80000000000),
    ebitda: new Prisma.Decimal(24000000000),
    netIncome: new Prisma.Decimal(15000000000),
    totalAssets: new Prisma.Decimal(130000000000),
    totalEquity: new Prisma.Decimal(85000000000),
    netDebt: new Prisma.Decimal(5000000000),
    roe: new Prisma.Decimal(0.1765),
    roic: new Prisma.Decimal(0.18),
    netMargin: new Prisma.Decimal(0.1875),
    ebitdaMargin: new Prisma.Decimal(0.30),
    peRatio: new Prisma.Decimal(14.2),
    pbRatio: new Prisma.Decimal(2.5),
    evEbitda: new Prisma.Decimal(9.0),
    dividendYield: new Prisma.Decimal(0.055),
    payoutRatio: new Prisma.Decimal(0.78),
    netDebtEbitda: new Prisma.Decimal(0.21),
  },
  RENT3: {
    revenue: new Prisma.Decimal(32000000000),
    ebitda: new Prisma.Decimal(9500000000),
    netIncome: new Prisma.Decimal(3200000000),
    totalAssets: new Prisma.Decimal(65000000000),
    totalEquity: new Prisma.Decimal(18000000000),
    netDebt: new Prisma.Decimal(22000000000),
    roe: new Prisma.Decimal(0.1778),
    roic: new Prisma.Decimal(0.10),
    netMargin: new Prisma.Decimal(0.10),
    ebitdaMargin: new Prisma.Decimal(0.2969),
    peRatio: new Prisma.Decimal(18.5),
    pbRatio: new Prisma.Decimal(3.3),
    evEbitda: new Prisma.Decimal(8.5),
    dividendYield: new Prisma.Decimal(0.025),
    payoutRatio: new Prisma.Decimal(0.35),
    netDebtEbitda: new Prisma.Decimal(2.32),
  },
  BBAS3: {
    revenue: new Prisma.Decimal(145000000000),
    ebitda: new Prisma.Decimal(60000000000),
    netIncome: new Prisma.Decimal(35000000000),
    totalAssets: new Prisma.Decimal(2100000000000),
    totalEquity: new Prisma.Decimal(185000000000),
    netDebt: new Prisma.Decimal(0),
    roe: new Prisma.Decimal(0.1892),
    roic: new Prisma.Decimal(0.14),
    netMargin: new Prisma.Decimal(0.2414),
    ebitdaMargin: new Prisma.Decimal(0.4138),
    peRatio: new Prisma.Decimal(4.8),
    pbRatio: new Prisma.Decimal(0.9),
    evEbitda: new Prisma.Decimal(4.2),
    dividendYield: new Prisma.Decimal(0.105),
    payoutRatio: new Prisma.Decimal(0.45),
    netDebtEbitda: new Prisma.Decimal(0),
  },
  ITSA4: {
    revenue: new Prisma.Decimal(12000000000),
    ebitda: new Prisma.Decimal(11000000000),
    netIncome: new Prisma.Decimal(14500000000),
    totalAssets: new Prisma.Decimal(90000000000),
    totalEquity: new Prisma.Decimal(80000000000),
    netDebt: new Prisma.Decimal(-5000000000),
    roe: new Prisma.Decimal(0.1813),
    roic: new Prisma.Decimal(0.16),
    netMargin: new Prisma.Decimal(1.2083),
    ebitdaMargin: new Prisma.Decimal(0.9167),
    peRatio: new Prisma.Decimal(7.2),
    pbRatio: new Prisma.Decimal(1.3),
    evEbitda: new Prisma.Decimal(8.5),
    dividendYield: new Prisma.Decimal(0.072),
    payoutRatio: new Prisma.Decimal(0.50),
    netDebtEbitda: new Prisma.Decimal(-0.45),
  },
  B3SA3: {
    revenue: new Prisma.Decimal(10500000000),
    ebitda: new Prisma.Decimal(7800000000),
    netIncome: new Prisma.Decimal(4800000000),
    totalAssets: new Prisma.Decimal(42000000000),
    totalEquity: new Prisma.Decimal(18000000000),
    netDebt: new Prisma.Decimal(2000000000),
    roe: new Prisma.Decimal(0.2667),
    roic: new Prisma.Decimal(0.22),
    netMargin: new Prisma.Decimal(0.4571),
    ebitdaMargin: new Prisma.Decimal(0.7429),
    peRatio: new Prisma.Decimal(15.8),
    pbRatio: new Prisma.Decimal(4.2),
    evEbitda: new Prisma.Decimal(10.5),
    dividendYield: new Prisma.Decimal(0.048),
    payoutRatio: new Prisma.Decimal(0.75),
    netDebtEbitda: new Prisma.Decimal(0.26),
  },
  EGIE3: {
    revenue: new Prisma.Decimal(11000000000),
    ebitda: new Prisma.Decimal(7500000000),
    netIncome: new Prisma.Decimal(3200000000),
    totalAssets: new Prisma.Decimal(35000000000),
    totalEquity: new Prisma.Decimal(12000000000),
    netDebt: new Prisma.Decimal(8500000000),
    roe: new Prisma.Decimal(0.2667),
    roic: new Prisma.Decimal(0.12),
    netMargin: new Prisma.Decimal(0.2909),
    ebitdaMargin: new Prisma.Decimal(0.6818),
    peRatio: new Prisma.Decimal(10.5),
    pbRatio: new Prisma.Decimal(2.8),
    evEbitda: new Prisma.Decimal(6.0),
    dividendYield: new Prisma.Decimal(0.058),
    payoutRatio: new Prisma.Decimal(0.60),
    netDebtEbitda: new Prisma.Decimal(1.13),
  },
  TAEE11: {
    revenue: new Prisma.Decimal(3200000000),
    ebitda: new Prisma.Decimal(2700000000),
    netIncome: new Prisma.Decimal(1800000000),
    totalAssets: new Prisma.Decimal(18000000000),
    totalEquity: new Prisma.Decimal(8500000000),
    netDebt: new Prisma.Decimal(5500000000),
    roe: new Prisma.Decimal(0.2118),
    roic: new Prisma.Decimal(0.11),
    netMargin: new Prisma.Decimal(0.5625),
    ebitdaMargin: new Prisma.Decimal(0.8438),
    peRatio: new Prisma.Decimal(8.2),
    pbRatio: new Prisma.Decimal(1.7),
    evEbitda: new Prisma.Decimal(7.8),
    dividendYield: new Prisma.Decimal(0.095),
    payoutRatio: new Prisma.Decimal(0.78),
    netDebtEbitda: new Prisma.Decimal(2.04),
  },
  HGLG11: {
    revenue: new Prisma.Decimal(480000000),
    ebitda: new Prisma.Decimal(420000000),
    netIncome: new Prisma.Decimal(380000000),
    totalAssets: new Prisma.Decimal(5200000000),
    totalEquity: new Prisma.Decimal(4800000000),
    netDebt: new Prisma.Decimal(350000000),
    roe: new Prisma.Decimal(0.0792),
    roic: new Prisma.Decimal(0.075),
    netMargin: new Prisma.Decimal(0.7917),
    ebitdaMargin: new Prisma.Decimal(0.875),
    peRatio: new Prisma.Decimal(12.5),
    pbRatio: new Prisma.Decimal(0.98),
    evEbitda: new Prisma.Decimal(13.2),
    dividendYield: new Prisma.Decimal(0.082),
    payoutRatio: new Prisma.Decimal(0.95),
    netDebtEbitda: new Prisma.Decimal(0.83),
  },
  KNRI11: {
    revenue: new Prisma.Decimal(320000000),
    ebitda: new Prisma.Decimal(285000000),
    netIncome: new Prisma.Decimal(260000000),
    totalAssets: new Prisma.Decimal(3800000000),
    totalEquity: new Prisma.Decimal(3500000000),
    netDebt: new Prisma.Decimal(280000000),
    roe: new Prisma.Decimal(0.0743),
    roic: new Prisma.Decimal(0.07),
    netMargin: new Prisma.Decimal(0.8125),
    ebitdaMargin: new Prisma.Decimal(0.8906),
    peRatio: new Prisma.Decimal(13.5),
    pbRatio: new Prisma.Decimal(1.0),
    evEbitda: new Prisma.Decimal(14.0),
    dividendYield: new Prisma.Decimal(0.078),
    payoutRatio: new Prisma.Decimal(0.95),
    netDebtEbitda: new Prisma.Decimal(0.98),
  },
  XPML11: {
    revenue: new Prisma.Decimal(520000000),
    ebitda: new Prisma.Decimal(450000000),
    netIncome: new Prisma.Decimal(410000000),
    totalAssets: new Prisma.Decimal(6500000000),
    totalEquity: new Prisma.Decimal(6000000000),
    netDebt: new Prisma.Decimal(450000000),
    roe: new Prisma.Decimal(0.0683),
    roic: new Prisma.Decimal(0.065),
    netMargin: new Prisma.Decimal(0.7885),
    ebitdaMargin: new Prisma.Decimal(0.8654),
    peRatio: new Prisma.Decimal(14.2),
    pbRatio: new Prisma.Decimal(0.97),
    evEbitda: new Prisma.Decimal(15.4),
    dividendYield: new Prisma.Decimal(0.072),
    payoutRatio: new Prisma.Decimal(0.95),
    netDebtEbitda: new Prisma.Decimal(1.0),
  },
}

// AQ Scores (calculated based on fundamentals)
const aqScoresData: Record<string, { total: number; valuation: number; quality: number; growth: number; dividends: number; risk: number }> = {
  PETR4: { total: 72, valuation: 92, quality: 68, growth: 55, dividends: 95, risk: 50 },
  VALE3: { total: 75, valuation: 88, quality: 78, growth: 60, dividends: 85, risk: 55 },
  ITUB4: { total: 78, valuation: 70, quality: 85, growth: 65, dividends: 70, risk: 85 },
  BBDC4: { total: 68, valuation: 75, quality: 72, growth: 50, dividends: 72, risk: 80 },
  WEGE3: { total: 85, valuation: 35, quality: 95, growth: 92, dividends: 45, risk: 92 },
  ABEV3: { total: 70, valuation: 65, quality: 80, growth: 45, dividends: 68, risk: 88 },
  RENT3: { total: 65, valuation: 55, quality: 70, growth: 72, dividends: 40, risk: 65 },
  BBAS3: { total: 76, valuation: 90, quality: 75, growth: 55, dividends: 88, risk: 72 },
  ITSA4: { total: 74, valuation: 78, quality: 80, growth: 52, dividends: 75, risk: 85 },
  B3SA3: { total: 73, valuation: 58, quality: 90, growth: 48, dividends: 65, risk: 88 },
  EGIE3: { total: 77, valuation: 72, quality: 82, growth: 55, dividends: 78, risk: 82 },
  TAEE11: { total: 79, valuation: 75, quality: 78, growth: 50, dividends: 92, risk: 80 },
  HGLG11: { total: 71, valuation: 68, quality: 75, growth: 45, dividends: 85, risk: 78 },
  KNRI11: { total: 69, valuation: 65, quality: 72, growth: 42, dividends: 82, risk: 75 },
  XPML11: { total: 67, valuation: 62, quality: 70, growth: 48, dividends: 78, risk: 72 },
}

// Quote data (recent prices)
const quotesData: Record<string, { close: number; volume: number }> = {
  PETR4: { close: 38.45, volume: 45000000 },
  VALE3: { close: 58.20, volume: 32000000 },
  ITUB4: { close: 34.80, volume: 25000000 },
  BBDC4: { close: 12.95, volume: 28000000 },
  WEGE3: { close: 52.30, volume: 8000000 },
  ABEV3: { close: 12.45, volume: 22000000 },
  RENT3: { close: 42.15, volume: 6000000 },
  BBAS3: { close: 28.90, volume: 18000000 },
  ITSA4: { close: 10.25, volume: 35000000 },
  B3SA3: { close: 11.85, volume: 15000000 },
  EGIE3: { close: 43.70, volume: 4500000 },
  TAEE11: { close: 36.20, volume: 5000000 },
  HGLG11: { close: 158.50, volume: 800000 },
  KNRI11: { close: 135.20, volume: 450000 },
  XPML11: { close: 98.75, volume: 650000 },
}

// Dividend data
const dividendsData: Record<string, { value: number; type: string }[]> = {
  PETR4: [
    { value: 1.45, type: 'dividend' },
    { value: 0.85, type: 'jcp' },
  ],
  VALE3: [
    { value: 1.82, type: 'dividend' },
  ],
  ITUB4: [
    { value: 0.28, type: 'dividend' },
    { value: 0.15, type: 'jcp' },
  ],
  BBDC4: [
    { value: 0.12, type: 'dividend' },
    { value: 0.08, type: 'jcp' },
  ],
  WEGE3: [
    { value: 0.18, type: 'dividend' },
  ],
  ABEV3: [
    { value: 0.22, type: 'dividend' },
  ],
  RENT3: [
    { value: 0.35, type: 'dividend' },
  ],
  BBAS3: [
    { value: 0.72, type: 'dividend' },
    { value: 0.38, type: 'jcp' },
  ],
  ITSA4: [
    { value: 0.12, type: 'dividend' },
    { value: 0.06, type: 'jcp' },
  ],
  B3SA3: [
    { value: 0.15, type: 'dividend' },
  ],
  EGIE3: [
    { value: 0.65, type: 'dividend' },
  ],
  TAEE11: [
    { value: 0.92, type: 'dividend' },
  ],
  HGLG11: [
    { value: 1.10, type: 'rendimento' },
  ],
  KNRI11: [
    { value: 0.85, type: 'rendimento' },
  ],
  XPML11: [
    { value: 0.60, type: 'rendimento' },
  ],
}

async function main() {
  console.log('🌱 Starting seed...')

  // Clear existing data
  await prisma.alert.deleteMany()
  await prisma.watchlist.deleteMany()
  await prisma.position.deleteMany()
  await prisma.transaction.deleteMany()
  await prisma.portfolio.deleteMany()
  await prisma.dividend.deleteMany()
  await prisma.aqScore.deleteMany()
  await prisma.quote.deleteMany()
  await prisma.fundamental.deleteMany()
  await prisma.asset.deleteMany()

  console.log('✨ Cleared existing data')

  // Create assets with related data
  for (const assetData of assets) {
    const asset = await prisma.asset.create({
      data: assetData,
    })

    console.log(`📈 Created asset: ${asset.ticker}`)

    // Add fundamentals
    const fundData = fundamentalsData[asset.ticker]
    if (fundData) {
      await prisma.fundamental.create({
        data: {
          assetId: asset.id,
          referenceDate: new Date('2024-12-31'),
          periodType: 'annual',
          ...fundData,
        },
      })
    }

    // Add AQ Score
    const scoreData = aqScoresData[asset.ticker]
    if (scoreData) {
      await prisma.aqScore.create({
        data: {
          assetId: asset.id,
          scoreTotal: new Prisma.Decimal(scoreData.total),
          scoreValuation: new Prisma.Decimal(scoreData.valuation),
          scoreQuality: new Prisma.Decimal(scoreData.quality),
          scoreGrowth: new Prisma.Decimal(scoreData.growth),
          scoreDividends: new Prisma.Decimal(scoreData.dividends),
          scoreRisk: new Prisma.Decimal(scoreData.risk),
          breakdown: {},
          version: 'v1',
        },
      })
    }

    // Add quotes (last 30 days)
    const quoteData = quotesData[asset.ticker]
    if (quoteData) {
      const today = new Date()
      for (let i = 0; i < 30; i++) {
        const date = new Date(today)
        date.setDate(date.getDate() - i)

        // Skip weekends
        if (date.getDay() === 0 || date.getDay() === 6) continue

        // Add some variation
        const variation = 1 + (Math.random() - 0.5) * 0.05
        const close = quoteData.close * variation

        await prisma.quote.create({
          data: {
            assetId: asset.id,
            date: date,
            open: new Prisma.Decimal(close * (1 + (Math.random() - 0.5) * 0.02)),
            high: new Prisma.Decimal(close * (1 + Math.random() * 0.02)),
            low: new Prisma.Decimal(close * (1 - Math.random() * 0.02)),
            close: new Prisma.Decimal(close),
            adjustedClose: new Prisma.Decimal(close),
            volume: BigInt(Math.floor(quoteData.volume * (0.8 + Math.random() * 0.4))),
          },
        })
      }
    }

    // Add dividends
    const divData = dividendsData[asset.ticker]
    if (divData) {
      for (const div of divData) {
        const paymentDate = new Date()
        paymentDate.setDate(paymentDate.getDate() - Math.floor(Math.random() * 90))
        const exDate = new Date(paymentDate)
        exDate.setDate(exDate.getDate() - 15)

        await prisma.dividend.create({
          data: {
            assetId: asset.id,
            type: div.type,
            valuePerShare: new Prisma.Decimal(div.value),
            exDate: exDate,
            paymentDate: paymentDate,
          },
        })
      }
    }
  }

  console.log('✅ Seed completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
