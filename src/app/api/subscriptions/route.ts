import { NextRequest } from "next/server";
import prismadb from "@/lib/prisma";
import {
  successResponse,
  errorResponse,
  getCurrentUser,
  getOrgMembership,
} from "@/lib/utils";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return errorResponse("Unauthorized", 401);

    const { searchParams } = new URL(req.url);
    const orgId = searchParams.get("orgId");

    if (!orgId) return errorResponse("orgId is required", 400);

    const membership = await getOrgMembership(user.id, orgId);
    if (!membership) return errorResponse("Access denied", 403);

    const subscription = await prismadb.subscription.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    const org = await prismadb.organization.findUnique({
      where: { id: orgId },
      select: { plan: true, stripeId: true },
    });

    return successResponse({
      subscription: subscription ?? null,
      currentPlan: org?.plan ?? "FREE",
      hasStripeId: !!org?.stripeId,
    });
  } catch (error) {
    console.error("[SUBSCRIPTIONS_GET]", error);
    return errorResponse("Internal server error", 500);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return errorResponse("Unauthorized", 401);

    const { searchParams } = new URL(req.url);
    const orgId = searchParams.get("orgId");

    if (!orgId) return errorResponse("orgId is required", 400);

    const membership = await getOrgMembership(user.id, orgId);
    if (!membership || membership.role !== "OWNER") {
      return errorResponse("Only the owner can cancel subscription", 403);
    }

    const subscription = await prismadb.subscription.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    if (!subscription || !process.env.STRIPE_SECRET_KEY) {
      return errorResponse("No active subscription", 400);
    }

    const cancelResponse = await fetch(
      `https://api.stripe.com/v1/subscriptions/${subscription.stripeId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
        },
      }
    );

    if (!cancelResponse.ok) {
      console.error("[STRIPE_CANCEL_ERROR]");
      return errorResponse("Failed to cancel subscription", 502);
    }

    await prismadb.subscription.update({
      where: { id: subscription.id },
      data: { cancelAtPeriodEnd: true },
    });

    return successResponse({
      message: "Subscription will be canceled at the end of the current period",
      currentPeriodEnd: subscription.currentPeriodEnd,
    });
  } catch (error) {
    console.error("[SUBSCRIPTIONS_DELETE]", error);
    return errorResponse("Internal server error", 500);
  }
}
