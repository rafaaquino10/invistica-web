export const DARK_VOLT_THEME = {
  color: ['#d0f364', '#34D399', '#F59E0B', '#EF4444', '#A0A8B8', '#606878'],
  backgroundColor: 'transparent',
  textStyle: {
    fontFamily: "'General Sans', system-ui, sans-serif",
    color: '#A0A8B8',
  },
  title: {
    textStyle: { color: '#F8FAFC', fontFamily: "'General Sans', system-ui, sans-serif" },
  },
  legend: {
    textStyle: { color: '#A0A8B8', fontFamily: "'General Sans', system-ui, sans-serif", fontSize: 11 },
    bottom: 0,
  },
  tooltip: {
    backgroundColor: 'rgba(18, 20, 28, 0.9)',
    borderColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    textStyle: {
      color: '#F8FAFC',
      fontFamily: "'IBM Plex Mono', monospace",
      fontSize: 12,
    },
    extraCssText: 'backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border-radius: 4px;',
  },
  axisPointer: {
    lineStyle: { color: 'rgba(208, 243, 100, 0.3)', type: 'dashed' },
    crossStyle: { color: 'rgba(208, 243, 100, 0.3)' },
  },
  categoryAxis: {
    axisLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.06)' } },
    axisTick: { show: false },
    axisLabel: {
      color: '#606878',
      fontFamily: "'IBM Plex Mono', monospace",
      fontSize: 10,
    },
    splitLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.03)' } },
  },
  valueAxis: {
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: {
      color: '#606878',
      fontFamily: "'IBM Plex Mono', monospace",
      fontSize: 10,
    },
    splitLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.03)' } },
  },
  line: {
    symbolSize: 4,
    symbol: 'circle',
    smooth: false,
    lineStyle: { width: 2 },
  },
  bar: {
    barMaxWidth: 24,
  },
  animationDuration: 400,
  animationEasing: 'cubicOut',
};

export const LIGHT_VOLT_THEME = {
  color: ['#5A6B10', '#16804A', '#B07A08', '#CC2828', '#6A6E78', '#9A9EA8'],
  backgroundColor: 'transparent',
  textStyle: {
    fontFamily: "'General Sans', system-ui, sans-serif",
    color: '#3A3E48',
  },
  title: {
    textStyle: { color: '#0A0C10', fontFamily: "'General Sans', system-ui, sans-serif" },
  },
  legend: {
    textStyle: { color: '#3A3E48', fontFamily: "'General Sans', system-ui, sans-serif", fontSize: 11 },
    bottom: 0,
  },
  tooltip: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderColor: 'rgba(0, 0, 0, 0.06)',
    borderWidth: 1,
    textStyle: {
      color: '#0A0C10',
      fontFamily: "'IBM Plex Mono', monospace",
      fontSize: 12,
    },
    extraCssText: 'backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border-radius: 4px;',
  },
  axisPointer: {
    lineStyle: { color: 'rgba(90, 107, 16, 0.3)', type: 'dashed' },
    crossStyle: { color: 'rgba(90, 107, 16, 0.3)' },
  },
  categoryAxis: {
    axisLine: { lineStyle: { color: 'rgba(0, 0, 0, 0.08)' } },
    axisTick: { show: false },
    axisLabel: {
      color: '#6A6E78',
      fontFamily: "'IBM Plex Mono', monospace",
      fontSize: 10,
    },
    splitLine: { lineStyle: { color: 'rgba(0, 0, 0, 0.04)' } },
  },
  valueAxis: {
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: {
      color: '#6A6E78',
      fontFamily: "'IBM Plex Mono', monospace",
      fontSize: 10,
    },
    splitLine: { lineStyle: { color: 'rgba(0, 0, 0, 0.04)' } },
  },
  line: {
    symbolSize: 4,
    symbol: 'circle',
    smooth: false,
    lineStyle: { width: 2 },
  },
  bar: {
    barMaxWidth: 24,
  },
  animationDuration: 400,
  animationEasing: 'cubicOut',
};
