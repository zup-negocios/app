<<<<<<< HEAD
import { sendViaEvolution } from "./evolutionConfig";

const sentMessages: any[] = [];

=======
import type { BuyerProfile, SupplierProfile, Offer, Reservation, MarketOrder } from "../types";
import { sendViaEvolution } from "./evolutionConfig";

// Armazenar mensagens automáticas enviadas
const sentMessages: any[] = [];

// Salvar mensagem no localStorage
>>>>>>> 340ce69334e4d253477a33892d15a13154b08771
function saveSentMessage(msg: any) {
  sentMessages.push({
    ...msg,
    timestamp: new Date().toISOString(),
    id: Math.random().toString(36).slice(2),
  });

<<<<<<< HEAD
=======
  // Persistir em localStorage
>>>>>>> 340ce69334e4d253477a33892d15a13154b08771
  try {
    localStorage.setItem("zup_auto_messages", JSON.stringify(sentMessages));
  } catch (e) {
    console.log("Erro ao salvar mensagens");
  }
}

<<<<<<< HEAD
export function onBuyerSignup(buyer: any) {
=======
/**
 * Quando um comprador se cadastra
 */
export function onBuyerSignup(buyer: BuyerProfile) {
>>>>>>> 340ce69334e4d253477a33892d15a13154b08771
  const msg = `Bem-vindo à Zup! 🎉

Você agora faz parte de nossa comunidade de compras coletivas.

Acesse: zup.com.br/comprador
Email: suporte@zup.com.br
WhatsApp: (41) 99727-4271

Aproveite as melhores ofertas! 🛍️`;

  console.log(`📱 [AUTO MESSAGE] Comprador ${buyer.companyName}`);
  console.log(`Para: ${buyer.whatsapp}`);
  console.log(msg);

<<<<<<< HEAD
=======
  // Enviar via Twilio
>>>>>>> 340ce69334e4d253477a33892d15a13154b08771
  sendViaEvolution(buyer.whatsapp, msg);

  saveSentMessage({
    type: "buyer_signup",
    to: buyer.whatsapp,
    toName: buyer.companyName,
    message: msg,
  });
}

<<<<<<< HEAD
export function onSupplierSignup(supplier: any, password: string) {
=======
/**
 * Quando um fornecedor se cadastra
 */
export function onSupplierSignup(supplier: SupplierProfile, password: string) {
>>>>>>> 340ce69334e4d253477a33892d15a13154b08771
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

<<<<<<< HEAD
=======
  // Enviar via Twilio
>>>>>>> 340ce69334e4d253477a33892d15a13154b08771
  sendViaEvolution(supplier.whatsapp, msg);

  saveSentMessage({
    type: "supplier_signup",
    to: supplier.whatsapp,
    toName: supplier.companyName,
    message: msg,
  });
}

<<<<<<< HEAD
export function onClientImmediatePurchase(buyer: any, offer: any, order: any) {
=======
/**
 * Quando cliente faz venda imediata
 */
export function onClientImmediatePurchase(
  buyer: BuyerProfile,
  offer: Offer,
  order: MarketOrder
) {
>>>>>>> 340ce69334e4d253477a33892d15a13154b08771
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

<<<<<<< HEAD
=======
  // Enviar via Twilio
>>>>>>> 340ce69334e4d253477a33892d15a13154b08771
  sendViaEvolution(buyer.whatsapp, msg);

  saveSentMessage({
    type: "buyer_immediate_purchase",
    to: buyer.whatsapp,
    toName: buyer.companyName,
    message: msg,
  });
}

<<<<<<< HEAD
export function onClientCollectiveReservation(buyer: any, offer: any, reservation: any) {
=======
/**
 * Quando cliente faz reserva coletiva
 */
export function onClientCollectiveReservation(
  buyer: BuyerProfile,
  offer: Offer,
  reservation: Reservation
) {
>>>>>>> 340ce69334e4d253477a33892d15a13154b08771
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

<<<<<<< HEAD
=======
  // Enviar via Twilio
>>>>>>> 340ce69334e4d253477a33892d15a13154b08771
  sendViaEvolution(buyer.whatsapp, msg);

  saveSentMessage({
    type: "buyer_collective_reserved",
    to: buyer.whatsapp,
    toName: buyer.companyName,
    message: msg,
  });
}

<<<<<<< HEAD
export function onCollectiveCompleted(buyer: any, offer: any, totalQty: number, totalAmount: number) {
=======
/**
 * Quando compra coletiva é finalizada
 */
export function onCollectiveCompleted(
  buyer: BuyerProfile,
  offer: Offer,
  totalQty: number,
  totalAmount: number
) {
>>>>>>> 340ce69334e4d253477a33892d15a13154b08771
  const msg = `🎉 PARABÉNS! Sua compra coletiva foi finalizada!

📦 ${offer.product}
✅ Total negociado: ${totalQty} ${offer.unit}
💰 Valor total: R$ ${totalAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}

O fornecedor já recebeu seu pedido e entrará em contato em breve com detalhes de entrega!

Obrigado por fazer parte desta compra! 🙏`;

  console.log(`📱 [AUTO MESSAGE] Cliente (Compra Concluída) ${buyer.companyName}`);
  console.log(`Para: ${buyer.whatsapp}`);
  console.log(msg);

<<<<<<< HEAD
  sendViaEvolution(buyer.whatsapp, msg);

=======
>>>>>>> 340ce69334e4d253477a33892d15a13154b08771
  saveSentMessage({
    type: "buyer_collective_completed",
    to: buyer.whatsapp,
    toName: buyer.companyName,
    message: msg,
  });
}

<<<<<<< HEAD
export function onClientSupportRequest(buyer: any) {
=======
/**
 * Quando cliente solicita suporte
 */
export function onClientSupportRequest(buyer: BuyerProfile) {
>>>>>>> 340ce69334e4d253477a33892d15a13154b08771
  const msg = `📞 Olá! Recebemos sua solicitação!

Nossa equipe já está analisando seu caso e em breve responderemos com a solução.

Tempo médio de resposta: 2-4 horas

Obrigado por sua paciência! 🙏`;

  console.log(`📱 [AUTO MESSAGE] Suporte (Cliente) ${buyer.companyName}`);
  console.log(`Para: ${buyer.whatsapp}`);
  console.log(msg);

<<<<<<< HEAD
  sendViaEvolution(buyer.whatsapp, msg);

=======
>>>>>>> 340ce69334e4d253477a33892d15a13154b08771
  saveSentMessage({
    type: "buyer_support",
    to: buyer.whatsapp,
    toName: buyer.companyName,
    message: msg,
  });
}

<<<<<<< HEAD
export function onSupplierSupportRequest(supplier: any) {
=======
/**
 * Quando fornecedor solicita suporte
 */
export function onSupplierSupportRequest(supplier: SupplierProfile) {
>>>>>>> 340ce69334e4d253477a33892d15a13154b08771
  const msg = `📞 Olá! Recebemos sua solicitação!

Nossa equipe já está analisando seu caso e em breve responderemos com a solução.

Tempo médio de resposta: 2-4 horas

Obrigado por sua paciência! 🙏`;

  console.log(`📱 [AUTO MESSAGE] Suporte (Fornecedor) ${supplier.companyName}`);
  console.log(`Para: ${supplier.whatsapp}`);
  console.log(msg);

<<<<<<< HEAD
  sendViaEvolution(supplier.whatsapp, msg);

=======
>>>>>>> 340ce69334e4d253477a33892d15a13154b08771
  saveSentMessage({
    type: "supplier_support",
    to: supplier.whatsapp,
    toName: supplier.companyName,
    message: msg,
  });
}

<<<<<<< HEAD
=======
/**
 * Obter histórico de mensagens automáticas
 */
>>>>>>> 340ce69334e4d253477a33892d15a13154b08771
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
