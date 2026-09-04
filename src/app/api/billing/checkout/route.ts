import { NextRequest } from "next/server";
import prismadb from "@/lib/prisma";
import {
  successResponse,
  errorResponse,
  getCurrentUser,
  getOrgMembership,
} from "@/lib/utils";
import { checkoutSchema } from "@/lib/validators";

const PLAN_PRICES: Record<string, { monthly: string; yearly: string }> = {
  PRO: {
    monthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID ?? "",
    yearly: process.env.STRIPE_PRO_YEARLY_PRICE_ID ?? "",
  },
  BUSINESS: {
    monthly: process.env.STRIPE_BUSINESS_MONTHLY_PRICE_ID ?? "",
    yearly: process.env.STRIPE_BUSINESS_YEARLY_PRICE_ID ?? "",
  },
  ENTERPRISE: {
    monthly: process.env.STRIPE_ENTERPRISE_MONTHLY_PRICE_ID ?? "",
    yearly: process.env.STRIPE_ENTERPRISE_YEARLY_PRICE_ID ?? "",
  },
};

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return errorResponse("Unauthorized", 401);

    const body = await req.json();
    const result = checkoutSchema.safeParse(body);

    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      return errorResponse(
        Object.values(errors)
          .flat()
          .join(", "),
        400
      );
    }

    const { plan, successUrl, cancelUrl } = result.data;
    const orgId = body.orgId;

    if (!orgId) return errorResponse("orgId is required", 400);

    const membership = await getOrgMembership(user.id, orgId);
    if (!membership || membership.role !== "OWNER") {
      return errorResponse("Only the organization owner can manage billing", 403);
    }

    const interval = body.interval ?? "monthly";
    const priceId = PLAN_PRICES[plan]?.[interval as "monthly" | "yearly"];

    if (!priceId) {
      return errorResponse("Invalid plan or interval", 400);
    }

    const apiKey = process.env.STRIPE_SECRET_KEY;
    if (!apiKey) {
      return errorResponse("Payment service not configured", 503);
    }

    const org = await prismadb.organization.findUnique({
      where: { id: orgId },
    });

    let stripeCustomerId = org?.stripeId;

    if (!stripeCustomerId) {
      const customerResponse = await fetch(
        "https://api.stripe.com/v1/customers",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Bearer ${apiKey}`,
          },
          body: new URLSearchParams({
            name: org?.name ?? "Organization",
            email: user.email,
            "metadata[orgId]": orgId,
            "metadata[userId]": user.id,
          }).toString(),
        }
      );

      if (!customerResponse.ok) {
        console.error("[STRIPE_CUSTOMER_ERROR]");
        return errorResponse("Failed to create customer", 502);
      }

      const customer = await customerResponse.json();
      stripeCustomerId = customer.id;

      await prismadb.organization.update({
        where: { id: orgId },
        data: { stripeId: stripeCustomerId },
      });
    }

    const sessionResponse = await fetch(
      "https://api.stripe.com/v1/checkout/sessions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Bearer ${apiKey}`,
        },
        body: new URLSearchParams({
          customer: stripeCustomerId!,
          "line_items[0][price]": priceId,
          "line_items[0][quantity]": "1",
          mode: "subscription",
          success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: cancelUrl,
          "metadata[orgId]": orgId,
          "metadata[plan]": plan,
          "metadata[userId]": user.id,
          "subscription_data[metadata][orgId]": orgId,
          "subscription_data[metadata][plan]": plan,
        }).toString(),
      }
    );

    if (!sessionResponse.ok) {
      const error = await sessionResponse.json();
      console.error("[STRIPE_CHECKOUT_ERROR]", error);
      return errorResponse("Failed to create checkout session", 502);
    }

    const session = await sessionResponse.json();

    return successResponse({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error("[BILLING_CHECKOUT]", error);
    return errorResponse("Internal server error", 500);
  }
}
