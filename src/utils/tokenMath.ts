// =============================================================================
// Hau-Hau POS — Token Mathematics Utilities
// =============================================================================

export interface TokenDeductionInput {
  total: number;
  balanceRupees: number;
  tokens: number;
  rate: number;
}

export interface TokenDeductionResult {
  tokensToDeduct: number;
  creditApplied: number;
  newTokensBalance: number;
  newBalanceRupees: number;
  creditReturned: number;
}

/**
 * Calculates token deduction and credit changes for a card payment.
 * Throws an error if the card does not have enough tokens.
 */
export function calculateTokenDeduction({
  total,
  balanceRupees,
  tokens,
  rate
}: TokenDeductionInput): TokenDeductionResult {
  const amountPayable = Math.max(0, total - balanceRupees);
  const tokensToDeduct = Math.ceil(amountPayable / rate);
  const creditApplied = total - amountPayable;

  const newTokensBalance = tokens - tokensToDeduct;
  if (newTokensBalance < 0) {
    throw new Error(`Insufficient tokens! Balance is ${tokens}, required is ${tokensToDeduct}.`);
  }

  const newBalanceRupees = balanceRupees - total + (tokensToDeduct * rate);
  const creditReturned = (tokensToDeduct * rate) - amountPayable;

  return {
    tokensToDeduct,
    creditApplied,
    newTokensBalance,
    newBalanceRupees,
    creditReturned
  };
}

export interface TokenRefundInput {
  tokensDeducted: number;
  orderTotal: number;
  currentTokens: number;
  currentBalanceRupees: number;
  rate: number;
}

export interface TokenRefundResult {
  newTokensBalance: number;
  newBalanceRupees: number;
}

/**
 * Calculates token refund and credit adjustment when an order is cancelled.
 */
export function calculateTokenRefund({
  tokensDeducted,
  orderTotal,
  currentTokens,
  currentBalanceRupees,
  rate
}: TokenRefundInput): TokenRefundResult {
  const newTokensBalance = Math.round(currentTokens + tokensDeducted);
  const newBalanceRupees = currentBalanceRupees - ((tokensDeducted * rate) - orderTotal);
  return {
    newTokensBalance,
    newBalanceRupees
  };
}
