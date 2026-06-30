import { describe, it, expect } from 'vitest';
import { calculateTokenDeduction, calculateTokenRefund } from './tokenMath';

describe('Token Mathematics - Deduction', () => {
  it('should use existing credit and deduct 0 tokens when total is fully covered by credit', () => {
    const result = calculateTokenDeduction({
      total: 20,
      balanceRupees: 50,
      tokens: 10,
      rate: 30
    });
    expect(result.tokensToDeduct).toBe(0);
    expect(result.creditApplied).toBe(20);
    expect(result.newTokensBalance).toBe(10);
    expect(result.newBalanceRupees).toBe(30);
    expect(result.creditReturned).toBe(0);
  });

  it('should deduct exact tokens and leave 0 credit when order total is a multiple of token rate', () => {
    const result = calculateTokenDeduction({
      total: 60,
      balanceRupees: 0,
      tokens: 10,
      rate: 30
    });
    expect(result.tokensToDeduct).toBe(2);
    expect(result.creditApplied).toBe(0);
    expect(result.newTokensBalance).toBe(8);
    expect(result.newBalanceRupees).toBe(0);
    expect(result.creditReturned).toBe(0);
  });

  it('should round up tokens and return change as credit when order total is not a multiple of rate', () => {
    const result = calculateTokenDeduction({
      total: 45,
      balanceRupees: 0,
      tokens: 10,
      rate: 30
    });
    expect(result.tokensToDeduct).toBe(2);
    expect(result.creditApplied).toBe(0);
    expect(result.newTokensBalance).toBe(8);
    expect(result.newBalanceRupees).toBe(15);
    expect(result.creditReturned).toBe(15);
  });

  it('should combine credit and tokens when total exceeds credit but can be paid with remaining tokens', () => {
    const result = calculateTokenDeduction({
      total: 50,
      balanceRupees: 20,
      tokens: 10,
      rate: 30
    });
    expect(result.tokensToDeduct).toBe(1);
    expect(result.creditApplied).toBe(20);
    expect(result.newTokensBalance).toBe(9);
    expect(result.newBalanceRupees).toBe(0);
    expect(result.creditReturned).toBe(0);
  });

  it('should throw an error if tokens are insufficient to cover amountPayable', () => {
    expect(() => {
      calculateTokenDeduction({
        total: 100,
        balanceRupees: 0,
        tokens: 2,
        rate: 30
      });
    }).toThrow(/Insufficient tokens/);
  });
});

describe('Token Mathematics - Refund', () => {
  it('should refund exact tokens and restore correct balances for perfect multiple orders', () => {
    const result = calculateTokenRefund({
      tokensDeducted: 2,
      orderTotal: 60,
      currentTokens: 8,
      currentBalanceRupees: 0,
      rate: 30
    });
    expect(result.newTokensBalance).toBe(10);
    expect(result.newBalanceRupees).toBe(0);
  });

  it('should refund tokens and reverse change credit for orders that had overpayment change', () => {
    const result = calculateTokenRefund({
      tokensDeducted: 2,
      orderTotal: 45,
      currentTokens: 8,
      currentBalanceRupees: 15,
      rate: 30
    });
    expect(result.newTokensBalance).toBe(10);
    expect(result.newBalanceRupees).toBe(0);
  });
});
