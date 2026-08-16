import { describe, expect, it } from "vitest";
import type { Offer } from "../types";
import {
  getMarketPrice,
  getCurrentCollectivePrice,
  getBestCollectivePrice,
  getNextTier,
  matchesBuyerCity,
  maxEditDeadlineInputValue,
  isEditDeadlineValid,
  offerProgress,
} from "./business";

function makeOffer(overrides: Partial<Offer> = {}): Offer {
  return {
    id: "offer-1",
    supplierId: "supplier-1",
    product: "Farinha de Trigo",
    brand: "Marca X",
    category: "Alimentos",
    description: "",
    unit: "kg",
    normalPrice: 100,
    zuppiPrice: 100,
    minGoal: 200,
    minimumPurchasePerBuyer: 10,
    targetType: "quantity",
    targetQuantity: 200,
    reservedQty: 0,
    reservedAmount: 0,
    deadline: "2026-08-20",
    region: "Curitiba — PR",
    paymentTerms: "Pix",
    deliveryTime: "até 3 dias após fechamento",
    notes: "",
    approved: true,
    status: "ativa",
    editStatus: "edicao_livre",
    createdAt: "2026-08-14T10:00:00.000Z",
    ...overrides,
  };
}

describe("Item 1 — valor Market Zup", () => {
  it("usa marketPrice quando definido, ignorando normalPrice", () => {
    const offer = makeOffer({ marketPrice: 87, normalPrice: 100 });
    expect(getMarketPrice(offer)).toBe(87);
  });

  it("cai para normalPrice quando marketPrice não foi definido", () => {
    const offer = makeOffer({ marketPrice: undefined, normalPrice: 100 });
    expect(getMarketPrice(offer)).toBe(100);
  });
});

describe("Item 2 — preço evolutivo (faixas progressivas)", () => {
  const tiers = [
    { percentage: 25, price: 90 },
    { percentage: 50, price: 80 },
    { percentage: 100, price: 70 },
  ];

  it("usa o preço da faixa mais alta já atingida pelo progresso atual", () => {
    // 60% da meta atingido -> faixa ativa é a de 50% (80), não a de 100%
    const offer = makeOffer({ progressiveTiers: tiers, targetQuantity: 100, reservedQty: 60 });
    expect(getCurrentCollectivePrice(offer)).toBe(80);
  });

  it("sem nenhuma faixa atingida ainda, cai para o preço base (zuppiPrice)", () => {
    const offer = makeOffer({ progressiveTiers: tiers, targetQuantity: 100, reservedQty: 10, zuppiPrice: 100 });
    expect(getCurrentCollectivePrice(offer)).toBe(100);
  });

  it("melhor preço é sempre o menor entre as faixas, independente do progresso", () => {
    const offer = makeOffer({ progressiveTiers: tiers, targetQuantity: 100, reservedQty: 10 });
    expect(getBestCollectivePrice(offer)).toBe(70);
  });

  it("aponta a próxima faixa ainda não atingida", () => {
    const offer = makeOffer({ progressiveTiers: tiers, targetQuantity: 100, reservedQty: 60 });
    expect(getNextTier(offer)?.percentage).toBe(100);
  });

  it("sem faixas definidas, não sugere próxima faixa", () => {
    const offer = makeOffer({ progressiveTiers: undefined });
    expect(getNextTier(offer)).toBeNull();
  });
});

describe("Item 3 — meta sempre por quantidade", () => {
  it("progresso calcula sobre reservedQty quando targetType é quantity", () => {
    const offer = makeOffer({ targetType: "quantity", targetQuantity: 200, reservedQty: 50 });
    const progress = offerProgress(offer);
    expect(progress.target).toBe(200);
    expect(progress.current).toBe(50);
    expect(progress.percent).toBe(25);
  });
});

describe("Item 4 — filtro de ofertas por cidade", () => {
  it("esconde ofertas de outra cidade quando o comprador tem cidade definida", () => {
    const offer = makeOffer({ cityId: "sao-jose-dos-pinhais" });
    expect(matchesBuyerCity(offer, "curitiba", false)) .toBe(false);
  });

  it("mostra ofertas da mesma cidade do comprador", () => {
    const offer = makeOffer({ cityId: "curitiba" });
    expect(matchesBuyerCity(offer, "curitiba", false)).toBe(true);
  });

  it("mostra ofertas sem cidade definida (dados legados), mesmo com filtro ativo", () => {
    const offer = makeOffer({ cityId: undefined });
    expect(matchesBuyerCity(offer, "curitiba", false)).toBe(true);
  });

  it("com 'ver todas as cidades' ligado, mostra tudo independente da cidade", () => {
    const offer = makeOffer({ cityId: "sao-jose-dos-pinhais" });
    expect(matchesBuyerCity(offer, "curitiba", true)).toBe(true);
  });

  it("sem cidade cadastrada no comprador, não filtra nada", () => {
    const offer = makeOffer({ cityId: "sao-jose-dos-pinhais" });
    expect(matchesBuyerCity(offer, undefined, false)).toBe(true);
  });
});

describe("Item 5 — trava de 3 dias na edição da oferta", () => {
  const createdAt = "2026-08-14T10:00:00.000Z";

  it("calcula a data máxima como lançamento + 3 dias", () => {
    expect(maxEditDeadlineInputValue(createdAt)).toBe("2026-08-17");
  });

  it("aceita uma nova data dentro do limite de 3 dias", () => {
    expect(isEditDeadlineValid(createdAt, "2026-08-16")).toBe(true);
    expect(isEditDeadlineValid(createdAt, "2026-08-17")).toBe(true);
  });

  it("rejeita uma nova data além de lançamento + 3 dias", () => {
    expect(isEditDeadlineValid(createdAt, "2026-08-18")).toBe(false);
    expect(isEditDeadlineValid(createdAt, "2026-09-01")).toBe(false);
  });

  it("rejeita data vazia", () => {
    expect(isEditDeadlineValid(createdAt, "")).toBe(false);
  });
});
