import type { BuyerProfile, SupplierProfile, Offer, Reservation, MarketOrder } from "../types";
import { sendViaEvolution } from "./evolutionConfig";

// Armazenar mensagens automáticas enviadas
const sentMessages: any[] = [];

// Salvar mensagem no localStorage
function saveSentMessage(msg: any) {
  sentMessages.push({
    ...msg,
    timestamp: new Date().toISOString(),
    id: Math.random().toString(36).slice(2),
  });

  // Persistir em localStorage
  try {
    localStorage.setItem("zup_auto_messages", JSON.stringify(sentMessages));
  } catch (e) {
    console.log("Erro ao salvar mensagens");
  }
}

/**
 * Quando um comprador se cadastra
 */
export function onBuyerSignup(buyer: BuyerProfile) {
  const msg = `Bem-vindo à Zup! 🎉

Você agora faz parte de nossa comunidade de compras coletivas.

Acesse: zup.com.br/comprador
Email: suporte@zup.com.br
WhatsApp: (41) 99727-4271

Aproveite as melhores ofertas! 🛍️`;

  console.log(`📱 [AUTO MESSAGE] Comprador ${buyer.companyName}`);
  console.log(`Para: ${buyer.whatsapp}`);
  console.log(msg);

  // Enviar via Twilio
  sendViaEvolution(buyer.whatsapp, msg);

  saveSentMessage({
    type: "buyer_signup",
    to: buyer.whatsapp,
    toName: buyer.companyName,
    message: msg,
  });
}

/**
 * Quando um fornecedor se cadastra
 */
export function onSupplierSignup(supplier: SupplierProfile, password: string) {
  const msg = `Bem-vindo à Zup! 🚀

Sua conta foi criada com sucesso!

📱 Acesse: zup.com.br/fornecedor
👤 Email: ${supplier.email}
🔑 Senha: ${password}

Comece a criar suas ofertas agora!
Suporte: gestao.zup@gmail.com`;

  console.log(`📱 [AUTO MESSAGE] Fornecedor ${supplier.companyName}`);
  console.log(`Para: ${supplier.whatsapp}`);
  console.log(msg);

  // Enviar via Twilio
  sendViaEvolution(supplier.whatsapp, msg);

  saveSentMessage({
    type: "supplier_signup",
    to: supplier.whatsapp,
    toName: supplier.companyName,
    message: msg,
  });
}

/**
 * Quando cliente faz venda imediata
 */
export function onClientImmediatePurchase(
  buyer: BuyerProfile,
  offer: Offer,
  order: MarketOrder
) {
  const msg = `✅ Sua compra foi realizada!

📦 ${offer.product}
💰 ${order.quantity} ${order.unit} = R$ ${order.totalAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
🏪 Fornecedor: ${order.supplierSnapshot.companyName}
📞 Contato: ${order.supplierSnapshot.whatsapp}

Acompanhe sua entrega no sistema!
Obrigado por comprar com a Zup! 🙏`;

  console.log(`📱 [AUTO MESSAGE] Cliente (Venda Imediata) ${buyer.companyName}`);
  console.log(`Para: ${buyer.whatsapp}`);
  console.log(msg);

  // Enviar via Twilio
  sendViaEvolution(buyer.whatsapp, msg);

  saveSentMessage({
    type: "buyer_immediate_purchase",
    to: buyer.whatsapp,
    toName: buyer.companyName,
    message: msg,
  });
}

/**
 * Quando cliente faz reserva coletiva
 */
export function onClientCollectiveReservation(
  buyer: BuyerProfile,
  offer: Offer,
  reservation: Reservation
) {
  const progress = offer.targetQuantity
    ? ((reservation.quantity) / offer.targetQuantity) * 100
    : 0;

  const msg = `🎯 Sua reserva foi confirmada!

📦 ${offer.product}
🎁 ${reservation.quantity} ${reservation.unit}
💰 Valor: R$ ${reservation.totalAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}

Você receberá atualizações sobre o progresso da compra.
Meta: ${offer.targetQuantity} ${offer.unit}
Progresso: ${Math.round(progress)}%

Fique ligado! 👀`;

  console.log(`📱 [AUTO MESSAGE] Cliente (Reserva Coletiva) ${buyer.companyName}`);
  console.log(`Para: ${buyer.whatsapp}`);
  console.log(msg);

  // Enviar via Twilio
  sendViaEvolution(buyer.whatsapp, msg);

  saveSentMessage({
    type: "buyer_collective_reserved",
    to: buyer.whatsapp,
    toName: buyer.companyName,
    message: msg,
  });
}

/**
 * Quando compra coletiva é finalizada
 */
export function onCollectiveCompleted(
  buyer: BuyerProfile,
  offer: Offer,
  totalQty: number,
  totalAmount: number
) {
  const msg = `🎉 PARABÉNS! Sua compra coletiva foi finalizada!

📦 ${offer.product}
✅ Total negociado: ${totalQty} ${offer.unit}
💰 Valor total: R$ ${totalAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}

O fornecedor já recebeu seu pedido e entrará em contato em breve com detalhes de entrega!

Obrigado por fazer parte desta compra! 🙏`;

  console.log(`📱 [AUTO MESSAGE] Cliente (Compra Concluída) ${buyer.companyName}`);
  console.log(`Para: ${buyer.whatsapp}`);
  console.log(msg);

  saveSentMessage({
    type: "buyer_collective_completed",
    to: buyer.whatsapp,
    toName: buyer.companyName,
    message: msg,
  });
}

/**
 * Quando cliente solicita suporte
 */
export function onClientSupportRequest(buyer: BuyerProfile) {
  const msg = `📞 Olá! Recebemos sua solicitação!

Nossa equipe já está analisando seu caso e em breve responderemos com a solução.

Tempo médio de resposta: 2-4 horas

Obrigado por sua paciência! 🙏`;

  console.log(`📱 [AUTO MESSAGE] Suporte (Cliente) ${buyer.companyName}`);
  console.log(`Para: ${buyer.whatsapp}`);
  console.log(msg);

  saveSentMessage({
    type: "buyer_support",
    to: buyer.whatsapp,
    toName: buyer.companyName,
    message: msg,
  });
}

/**
 * Quando fornecedor solicita suporte
 */
export function onSupplierSupportRequest(supplier: SupplierProfile) {
  const msg = `📞 Olá! Recebemos sua solicitação!

Nossa equipe já está analisando seu caso e em breve responderemos com a solução.

Tempo médio de resposta: 2-4 horas

Obrigado por sua paciência! 🙏`;

  console.log(`📱 [AUTO MESSAGE] Suporte (Fornecedor) ${supplier.companyName}`);
  console.log(`Para: ${supplier.whatsapp}`);
  console.log(msg);

  saveSentMessage({
    type: "supplier_support",
    to: supplier.whatsapp,
    toName: supplier.companyName,
    message: msg,
  });
}

/**
 * Obter histórico de mensagens automáticas
 */
export function getAutoMessages() {
  try {
    const stored = localStorage.getItem("zup_auto_messages");
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.log("Erro ao carregar mensagens");
  }
  return sentMessages;
}
