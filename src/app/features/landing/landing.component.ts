import {
  Component, ChangeDetectionStrategy, signal, OnInit, OnDestroy,
  ElementRef, viewChild, AfterViewInit,
} from '@angular/core';
import { RouterLink } from '@angular/router';

interface Stock {
  tk: string; nm: string; sec: string; sc: number;
  rl: string; rc: 'sb' | 'b' | 'h' | 'r';
  px: string; chg: string; chgPos: boolean;
  fv: string; mg: string;
  yd: string; sf: string; mt: string; mtOk: boolean; pi: string;
  q: number; l: number; v: number;
  wq: string; wl: string; wv: string;
  th: string;
}

interface ProcItem {
  tk: string; sc: number; rt: string; rc: 'sb' | 'b' | 'h' | 'r';
  fv: string; mg: string;
}

@Component({
  selector: 'iq-landing',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingComponent implements OnInit, AfterViewInit, OnDestroy {
  readonly heroCanvas = viewChild<ElementRef<HTMLCanvasElement>>('heroCanvas');

  readonly currentStock = signal<Stock>(this.stocks[0]);
  readonly fading = signal(false);
  readonly countdown = signal(8);

  private stockIdx = 0;
  private rotationTimer: ReturnType<typeof setInterval> | null = null;
  private countdownTimer: ReturnType<typeof setInterval> | null = null;
  private animFrame = 0;
  private canvasPoints: number[] = [];

  // Processing strip items (repeated for seamless loop)
  readonly procItems: ProcItem[] = this.buildProcItems();

  // Shuffled stocks for rotation
  private shuffled: Stock[] = [];

  get stocks(): Stock[] {
    return [
      { tk:'WEGE3',nm:'WEG S.A.',sec:'Bens de capital',sc:85,rl:'Compra forte',rc:'sb',px:'R$ 41,18',chg:'+2,31%',chgPos:true,fv:'R$ 52,40',mg:'+27,2%',yd:'Yield 2,4%',sf:'Safety: 88/100',mt:'Merton PD: 0,3%',mtOk:true,pi:'Piotroski: 8/9',q:82,l:91,v:78,wq:'25%',wl:'40%',wv:'35%',th:'WEG mantém <b>vantagem competitiva global</b> em motores elétricos. Governança exemplar, expansão internacional consistente. Desconto de 27% reflete pessimismo cíclico.' },
      { tk:'ITUB4',nm:'Itaú Unibanco PN',sec:'Financeiro',sc:83,rl:'Compra forte',rc:'sb',px:'R$ 32,45',chg:'-0,38%',chgPos:false,fv:'R$ 38,20',mg:'+17,7%',yd:'Yield 5,2%',sf:'Safety: 85/100',mt:'Merton PD: 0,5%',mtOk:true,pi:'Piotroski: 7/9',q:80,l:88,v:79,wq:'30%',wl:'40%',wv:'30%',th:'Itaú é o <b>banco mais eficiente do Brasil</b> com cost-to-income de 38%. ROE consistente acima de 20%. Dividend yield atrativo com payout sustentável.' },
      { tk:'PETR4',nm:'Petrobras PN',sec:'Commodities',sc:71,rl:'Acumular',rc:'b',px:'R$ 38,91',chg:'+1,07%',chgPos:true,fv:'R$ 44,80',mg:'+15,1%',yd:'Yield 12,8%',sf:'Safety: 62/100',mt:'Merton PD: 1,2%',mtOk:false,pi:'Piotroski: 6/9',q:74,l:58,v:76,wq:'40%',wl:'25%',wv:'35%',th:'Petrobras negocia a <b>múltiplos deprimidos vs pares globais</b>. Yield excepcional mas risco político elevado. Motor qualitativo penaliza governança pelo histórico de interferência.' },
      { tk:'VALE3',nm:'Vale S.A.',sec:'Commodities',sc:68,rl:'Manter',rc:'h',px:'R$ 56,23',chg:'-2,14%',chgPos:false,fv:'R$ 64,10',mg:'+14,0%',yd:'Yield 8,4%',sf:'Safety: 71/100',mt:'Merton PD: 0,9%',mtOk:true,pi:'Piotroski: 5/9',q:72,l:55,v:71,wq:'40%',wl:'25%',wv:'35%',th:'Vale é <b>price taker global em minério de ferro</b>. Desconto razoável mas cenário chinês incerto. Motor recomenda manter e monitorar demanda.' },
      { tk:'BBAS3',nm:'Banco do Brasil ON',sec:'Financeiro',sc:79,rl:'Acumular',rc:'b',px:'R$ 28,76',chg:'+0,92%',chgPos:true,fv:'R$ 35,40',mg:'+23,1%',yd:'Yield 8,7%',sf:'Safety: 82/100',mt:'Merton PD: 0,6%',mtOk:true,pi:'Piotroski: 7/9',q:78,l:76,v:82,wq:'30%',wl:'40%',wv:'30%',th:'BB combina <b>yield excepcional com desconto de estatal</b>. P/VP 0,78x vs média 1,1x. Carteira agro resiliente em cenário macro adverso.' },
      { tk:'ELET3',nm:'Eletrobras ON',sec:'Utilities',sc:76,rl:'Acumular',rc:'b',px:'R$ 44,87',chg:'+1,12%',chgPos:true,fv:'R$ 55,30',mg:'+23,3%',yd:'Yield 4,1%',sf:'Safety: 77/100',mt:'Merton PD: 0,7%',mtOk:true,pi:'Piotroski: 6/9',q:70,l:74,v:82,wq:'25%',wl:'30%',wv:'45%',th:'Eletrobras em <b>turnaround pós-privatização</b>. Margem EBITDA em expansão, dívida em queda. Setor favorecido em regime Risk-Off.' },
      { tk:'PRIO3',nm:'PRIO S.A.',sec:'Commodities',sc:74,rl:'Acumular',rc:'b',px:'R$ 44,52',chg:'-1,85%',chgPos:false,fv:'R$ 52,10',mg:'+17,0%',yd:'Yield 1,2%',sf:'Safety: 58/100',mt:'Merton PD: 1,8%',mtOk:false,pi:'Piotroski: 7/9',q:79,l:65,v:74,wq:'40%',wl:'25%',wv:'35%',th:'PRIO é a <b>junior oil mais eficiente do Brasil</b>. Lifting cost abaixo de US$ 8/bbl. Sensível ao Brent — motor ajusta pesos em commodity fraca.' },
    ];
  }

  scoreColor(sc: number): string {
    if (sc >= 82) return 'var(--positive)';
    if (sc >= 70) return 'var(--obsidian)';
    return '#A07628';
  }

  pillarColor(sc: number): string {
    return sc >= 80 ? 'var(--positive)' : 'var(--obsidian)';
  }

  private buildProcItems(): ProcItem[] {
    const base: ProcItem[] = [
      { tk:'PSSA3',sc:88,rt:'Compra forte',rc:'sb',fv:'R$ 42,10',mg:'+32%' },
      { tk:'WEGE3',sc:85,rt:'Compra forte',rc:'sb',fv:'R$ 52,40',mg:'+27%' },
      { tk:'ITUB4',sc:83,rt:'Compra forte',rc:'sb',fv:'R$ 38,20',mg:'+18%' },
      { tk:'BBAS3',sc:79,rt:'Acumular',rc:'b',fv:'R$ 35,40',mg:'+23%' },
      { tk:'ELET3',sc:76,rt:'Acumular',rc:'b',fv:'R$ 55,30',mg:'+23%' },
      { tk:'PRIO3',sc:74,rt:'Acumular',rc:'b',fv:'R$ 52,10',mg:'+17%' },
      { tk:'PETR4',sc:71,rt:'Acumular',rc:'b',fv:'R$ 44,80',mg:'+15%' },
      { tk:'BBDC4',sc:71,rt:'Acumular',rc:'b',fv:'R$ 18,40',mg:'+27%' },
      { tk:'VALE3',sc:68,rt:'Manter',rc:'h',fv:'R$ 64,10',mg:'+14%' },
      { tk:'RENT3',sc:65,rt:'Manter',rc:'h',fv:'R$ 22,50',mg:'+23%' },
      { tk:'SUZB3',sc:62,rt:'Manter',rc:'h',fv:'R$ 70,20',mg:'+13%' },
      { tk:'ABEV3',sc:59,rt:'Manter',rc:'h',fv:'R$ 14,80',mg:'+14%' },
      { tk:'MGLU3',sc:24,rt:'Evitar',rc:'r',fv:'R$ 6,20',mg:'-38%' },
      { tk:'CVCB3',sc:31,rt:'Reduzir',rc:'r',fv:'R$ 2,80',mg:'-22%' },
    ];
    return [...base, ...base, ...base];
  }

  ngOnInit(): void {
    this.shuffled = [...this.stocks].sort(() => 0.5 - Math.random());
    this.currentStock.set(this.shuffled[0]);
    this.startRotation();
  }

  ngAfterViewInit(): void {
    this.initCanvas();
  }

  private startRotation(): void {
    this.countdown.set(8);
    this.countdownTimer = setInterval(() => {
      this.countdown.update(v => v > 0 ? v - 1 : 8);
    }, 1000);

    this.rotationTimer = setInterval(() => {
      this.fading.set(true);
      setTimeout(() => {
        this.stockIdx++;
        this.currentStock.set(this.shuffled[this.stockIdx % this.shuffled.length]);
        this.fading.set(false);
        this.countdown.set(8);
      }, 400);
    }, 8000);
  }

  private initCanvas(): void {
    const canvas = this.heroCanvas()?.nativeElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.parentElement!.clientWidth;
      canvas.height = canvas.parentElement!.clientHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Init points
    let y = canvas.height * 0.6;
    for (let i = 0; i < 200; i++) {
      y += (Math.random() - 0.44) * 5;
      y = Math.max(canvas.height * 0.15, Math.min(canvas.height * 0.85, y));
      this.canvasPoints.push(y);
    }

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;

      // Advance
      this.canvasPoints.shift();
      let last = this.canvasPoints[this.canvasPoints.length - 1];
      last += (Math.random() - 0.44) * 5;
      last = Math.max(h * 0.15, Math.min(h * 0.85, last));
      this.canvasPoints.push(last);

      ctx.clearRect(0, 0, w, h);
      const step = w / (this.canvasPoints.length - 1);

      // Area fill
      ctx.beginPath();
      ctx.moveTo(0, h);
      this.canvasPoints.forEach((py, i) => ctx.lineTo(i * step, py));
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fillStyle = 'rgba(61, 61, 58, 0.04)';
      ctx.fill();

      // Line
      ctx.beginPath();
      this.canvasPoints.forEach((py, i) => {
        if (i === 0) ctx.moveTo(0, py);
        else ctx.lineTo(i * step, py);
      });
      ctx.strokeStyle = 'rgba(61, 61, 58, 0.12)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Dot at end
      const lastX = (this.canvasPoints.length - 1) * step;
      const lastY = this.canvasPoints[this.canvasPoints.length - 1];
      ctx.beginPath();
      ctx.arc(lastX, lastY, 3, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(61, 61, 58, 0.25)';
      ctx.fill();

      this.animFrame = requestAnimationFrame(draw);
    };

    this.animFrame = requestAnimationFrame(draw);
  }

  scrollToLive(): void {
    document.querySelector('.live')?.scrollIntoView({ behavior: 'smooth' });
  }

  ngOnDestroy(): void {
    if (this.rotationTimer) clearInterval(this.rotationTimer);
    if (this.countdownTimer) clearInterval(this.countdownTimer);
    if (this.animFrame) cancelAnimationFrame(this.animFrame);
  }
}
