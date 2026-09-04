interface StripeConfig {
  secretKey: string;
  publishableKey: string;
  webhookSecret: string;
  apiVersion: string;
}

interface PricePlan {
  id: string;
  name: string;
  description: string;
  prices: {
    monthly: { priceId: string; amount: number; currency: string };
    yearly: { priceId: string; amount: number; currency: string };
  };
  features: string[];
  limits: {
    documents: number;
    storage: number;
    aiRequests: number;
    teamMembers: number;
  };
}

interface Subscription {
  id: string;
  customerId: string;
  status: "active" | "canceled" | "past_due" | "incomplete" | "trialing";
  planId: string;
  interval: "monthly" | "yearly";
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  trialEnd?: string;
}

interface Invoice {
  id: string;
  subscriptionId: string;
  amount: number;
  currency: string;
  status: "paid" | "open" | "void";
  invoiceUrl: string;
  pdfUrl: string;
  createdAt: string;
}

interface PaymentMethod {
  id: string;
  type: "card";
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
}

const PLANS: Record<string, PricePlan> = {
  free: {
    id: "free",
    name: "Free",
    description: "For personal use",
    prices: {
      monthly: { priceId: "price_free_monthly", amount: 0, currency: "usd" },
      yearly: { priceId: "price_free_yearly", amount: 0, currency: "usd" },
    },
    features: [
      "5 documents",
      "100 MB storage",
      "50 AI requests/month",
      "Basic editing",
    ],
    limits: {
      documents: 5,
      storage: 100 * 1024 * 1024,
      aiRequests: 50,
      teamMembers: 1,
    },
  },
  pro: {
    id: "pro",
    name: "Pro",
    description: "For professionals",
    prices: {
      monthly: { priceId: "price_pro_monthly", amount: 1200, currency: "usd" },
      yearly: { priceId: "price_pro_yearly", amount: 9600, currency: "usd" },
    },
    features: [
      "Unlimited documents",
      "10 GB storage",
      "1000 AI requests/month",
      "Advanced editing",
      "Priority support",
    ],
    limits: {
      documents: -1,
      storage: 10 * 1024 * 1024 * 1024,
      aiRequests: 1000,
      teamMembers: 1,
    },
  },
  team: {
    id: "team",
    name: "Team",
    description: "For teams",
    prices: {
      monthly: { priceId: "price_team_monthly", amount: 2400, currency: "usd" },
      yearly: { priceId: "price_team_yearly", amount: 19200, currency: "usd" },
    },
    features: [
      "Everything in Pro",
      "50 GB storage",
      "5000 AI requests/month",
      "Team collaboration",
      "Admin dashboard",
    ],
    limits: {
      documents: -1,
      storage: 50 * 1024 * 1024 * 1024,
      aiRequests: 5000,
      teamMembers: 20,
    },
  },
};

class BillingService {
  private config: StripeConfig | null = null;

  configure(config: StripeConfig): void {
    this.config = config;
  }

  getPlans(): PricePlan[] {
    return Object.values(PLANS);
  }

  getPlan(planId: string): PricePlan | undefined {
    return PLANS[planId];
  }

  async createCheckoutSession(
    _priceId: string,
    _customerId: string,
    _successUrl: string,
    _cancelUrl: string
  ): Promise<{ sessionId: string; url: string }> {
    // In production: Stripe checkout session creation
    return {
      sessionId: `cs_${Date.now()}`,
      url: `https://checkout.stripe.com/pay/cs_${Date.now()}`,
    };
  }

  async createCustomerPortalSession(
    _customerId: string,
    _returnUrl: string
  ): Promise<{ url: string }> {
    return {
      url: `https://billing.stripe.com/session/${Date.now()}`,
    };
  }

  async getSubscription(_subscriptionId: string): Promise<Subscription | null> {
    return null;
  }

  async getCustomerSubscriptions(
    _customerId: string
  ): Promise<Subscription[]> {
    return [];
  }

  async cancelSubscription(
    _subscriptionId: string,
    _atPeriodEnd = true
  ): Promise<Subscription> {
    return {
      id: _subscriptionId,
      customerId: "cus_placeholder",
      status: "canceled",
      planId: "free",
      interval: "monthly",
      currentPeriodStart: new Date().toISOString(),
      currentPeriodEnd: new Date().toISOString(),
      cancelAtPeriodEnd: false,
    };
  }

  async updateSubscription(
    _subscriptionId: string,
    _newPriceId: string
  ): Promise<Subscription> {
    return {
      id: _subscriptionId,
      customerId: "cus_placeholder",
      status: "active",
      planId: "pro",
      interval: "monthly",
      currentPeriodStart: new Date().toISOString(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      cancelAtPeriodEnd: false,
    };
  }

  async getInvoices(_customerId: string): Promise<Invoice[]> {
    return [];
  }

  async getPaymentMethods(
    _customerId: string
  ): Promise<PaymentMethod[]> {
    return [];
  }

  async addPaymentMethod(
    _customerId: string,
    _paymentMethodId: string
  ): Promise<PaymentMethod> {
    return {
      id: `pm_${Date.now()}`,
      type: "card",
      brand: "visa",
      last4: "4242",
      expMonth: 12,
      expYear: 2025,
      isDefault: true,
    };
  }

  async deletePaymentMethod(
    _paymentMethodId: string
  ): Promise<boolean> {
    return true;
  }

  async handleWebhook(
    _body: unknown,
    _signature: string
  ): Promise<{ type: string; handled: boolean }> {
    return { type: "unknown", handled: false };
  }

  formatAmount(amount: number, currency = "usd"): string {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(amount / 100);
  }

  checkLimits(
    plan: string,
    usage: { documents: number; storage: number; aiRequests: number; teamMembers: number }
  ): Record<string, boolean> {
    const planConfig = PLANS[plan];
    if (!planConfig) return {};

    return {
      documents:
        planConfig.limits.documents === -1 ||
        usage.documents < planConfig.limits.documents,
      storage: usage.storage < planConfig.limits.storage,
      aiRequests: usage.aiRequests < planConfig.limits.aiRequests,
      teamMembers:
        planConfig.limits.teamMembers === -1 ||
        usage.teamMembers < planConfig.limits.teamMembers,
    };
  }
}

export const billing = new BillingService();
export { PLANS };
export type { PricePlan, Subscription, Invoice, PaymentMethod, StripeConfig };
