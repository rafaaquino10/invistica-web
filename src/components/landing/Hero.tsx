"use client";

import { motion } from "framer-motion";
import { HeroCurve } from "./HeroCurve";
import { HeroRotator } from "./HeroRotator";
import { StockCard } from "./StockCard";
import type { StockCardData } from "@/types/stock";

interface CardConfig {
  data: StockCardData;
  entranceDelay: number;
  floatDuration: number;
  floatDistance: number;
  positionClasses: string;
}

const cards: CardConfig[] = [
  {
    data: {
      ticker: "WEGE3",
      price: "R$ 52,30",
      logoLetter: "W",
      logoVariant: "accent",
      invscore: 86,
      invscoreAccent: true,
      tag: "TOP",
      subScores: [
        { label: "Val", value: 72 },
        { label: "Qual", value: 88, high: true },
        { label: "Risc", value: 92, high: true },
        { label: "Div", value: 68 },
        { label: "Cresc", value: 75 },
        { label: "QLT", value: 85, high: true },
      ],
    },
    entranceDelay: 0.4,
    floatDuration: 8,
    floatDistance: 8,
    positionClasses: "top-0 right-0",
  },
  {
    data: {
      ticker: "ITUB4",
      price: "R$ 33,12",
      logoLetter: "I",
      logoVariant: "dark",
      invscore: 84,
      invscoreAccent: true,
      tag: "TOP",
      subScores: [
        { label: "Val", value: 78 },
        { label: "Qual", value: 86, high: true },
        { label: "Risc", value: 82 },
        { label: "Div", value: 88, high: true },
        { label: "Cresc", value: 70 },
        { label: "QLT", value: 80 },
      ],
    },
    entranceDelay: 0.6,
    floatDuration: 7,
    floatDistance: 6,
    positionClasses: "top-[180px] left-0",
  },
  {
    data: {
      ticker: "TAEE11",
      price: "R$ 38,45",
      logoLetter: "T",
      logoVariant: "outline",
      invscore: 82,
      subScores: [
        { label: "Val", value: 85, high: true },
        { label: "Qual", value: 78 },
        { label: "Risc", value: 88, high: true },
        { label: "Div", value: 92, high: true },
        { label: "Cresc", value: 62 },
        { label: "QLT", value: 76 },
      ],
    },
    entranceDelay: 0.8,
    floatDuration: 6,
    floatDistance: 10,
    positionClasses: "top-[340px] right-[20px]",
  },
  {
    data: {
      ticker: "BBSE3",
      price: "R$ 37,80",
      logoLetter: "B",
      logoVariant: "dark",
      invscore: 74,
      subScores: [
        { label: "Val", value: 72 },
        { label: "Qual", value: 75 },
        { label: "Risc", value: 68 },
        { label: "Div", value: 90, high: true },
        { label: "Cresc", value: 65 },
        { label: "QLT", value: 72 },
      ],
    },
    entranceDelay: 1.0,
    floatDuration: 7.5,
    floatDistance: 7,
    positionClasses: "top-[500px] left-[40px]",
  },
];

export function Hero() {
  return (
    <section className="relative z-10 w-full overflow-visible px-6 pt-24 pb-32 md:px-10 md:pt-28 lg:px-16 lg:pt-32 xl:px-24">
      <HeroCurve />
      <div className="relative z-10 grid min-h-[540px] items-center gap-16 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        >
          <h1 className="mb-7 text-[42px] font-bold leading-[1.04] tracking-[-1px] text-foreground lg:text-[60px] lg:tracking-[-1.8px]">
            Análise quantamental
            <br />
            aplicada para
            <br />
            <HeroRotator />
          </h1>
          <p className="max-w-[480px] text-base font-normal leading-[1.55] text-muted lg:text-[17px]">
            Motor proprietário que combina{" "}
            <strong className="font-semibold text-foreground">
              análise quantitativa completa
            </strong>{" "}
            e{" "}
            <strong className="font-semibold text-foreground">
              qualitativa profunda
            </strong>
            , aplicado a 947 ações da B3.
          </p>
        </motion.div>

        <div className="relative h-[620px]">
          {cards.map((card) => (
            <StockCard key={card.data.ticker} {...card} />
          ))}
        </div>
      </div>
    </section>
  );
}
