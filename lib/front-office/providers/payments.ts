/**
 * Payments provider interface (Stripe Connect).
 *
 * CRITICAL INVARIANT: card charges are destination charges to the CLIENT's
 * own connected Stripe account. Money flows customer -> client's account;
 * the platform never holds, touches, or routes customer funds through a
 * platform account. Every method takes `connectedAccountId` (the client's
 * Stripe Connect account id) and has no code path that charges a platform
 * account.
 */

export type DestinationCharge = {
  /**
   * The CLIENT's Stripe Connect account id (acct_...). Funds settle here.
   * Never a platform account id.
   */
  connectedAccountId: string;
  amountCents: number;
  currency: string;
  /** A payment method already attached to the connected account. */
  paymentMethodId: string;
  description?: string;
  /** Idempotency key — retries of the same charge must not double-charge. */
  idempotencyKey: string;
  companyId: string;
  invoiceId?: string;
};

export type ChargeResult = {
  chargeId: string;
  amountCents: number;
  /** The account the money went to — always the client's. */
  destinationAccountId: string;
};

export interface PaymentsProvider {
  readonly name: string;
  /**
   * Charge a card with a destination charge to the client's connected
   * account. Implementations MUST pass `destination` / transfer_data to
   * the connected account and MUST NOT use the platform balance.
   */
  chargeCustomer(charge: DestinationCharge): Promise<ChargeResult>;
  /** Refund a previous destination charge, back to the customer's card. */
  refundCharge(chargeId: string, connectedAccountId: string): Promise<void>;
}

/** Guard: refuse to run a charge that doesn't name a real connected account. */
export function assertClientAccount(connectedAccountId: string): void {
  if (!connectedAccountId || !connectedAccountId.startsWith("acct_")) {
    throw new Error(
      "Refusing to charge: a valid client connected account id (acct_...) is required. Platform accounts are never charged.",
    );
  }
}

/** Stub used until Stripe Connect is configured. */
export class UnconfiguredPaymentsProvider implements PaymentsProvider {
  readonly name = "unconfigured";
  async chargeCustomer(): Promise<ChargeResult> {
    throw new Error(
      "Payments provider not configured. Set STRIPE_SECRET_KEY and connect the client's Stripe account (Stripe Connect) to enable card charges.",
    );
  }
  async refundCharge(): Promise<void> {
    throw new Error("Payments provider not configured.");
  }
}

/** Factory: returns the configured payments provider, or the stub. */
export function getPaymentsProvider(): PaymentsProvider {
  if (process.env.STRIPE_SECRET_KEY) {
    // TODO: return new StripeConnectPaymentsProvider(...) once implemented.
    return new UnconfiguredPaymentsProvider();
  }
  return new UnconfiguredPaymentsProvider();
}
