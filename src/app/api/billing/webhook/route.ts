import { NextRequest } from "next/server";
import prismadb from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const sig = req.headers.get("stripe-signature");

    if (!sig) {
      return new Response("Missing signature", { status: 400 });
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("[STRIPE_WEBHOOK] Missing webhook secret");
      return new Response("Webhook not configured", { status: 500 });
    }

    let event: { id: string; type: string; data: { object: Record<string, unknown> } };

    try {
      const stripe = await import("stripe").then((m) => m.default);
      const stripeClient = new stripe.default(process.env.STRIPE_SECRET_KEY ?? "", {
        apiVersion: "2024-11-20.acacia" as never,
      });
      event = stripeClient.webhooks.constructEvent(
        body,
        sig,
        webhookSecret
      ) as unknown as { id: string; type: string; data: { object: Record<string, unknown> } };
    } catch (err) {
      console.error("[STRIPE_WEBHOOK] Signature verification failed:", err);
      return new Response("Invalid signature", { status: 400 });
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const orgId = session.metadata?.orgId as string | undefined;
        const plan = session.metadata?.plan as string | undefined;
        const subscriptionId = session.subscription as string | undefined;

        if (orgId && plan && subscriptionId) {
          const subResponse = await fetch(
            `https://api.stripe.com/v1/subscriptions/${subscriptionId}`,
            {
              headers: {
                Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
              },
            }
          );

          if (subResponse.ok) {
            const subscription = await subResponse.json();

            await prismadb.subscription.upsert({
              where: { stripeId: subscriptionId },
              create: {
                stripeId: subscriptionId,
                status: subscription.status === "active" ? "ACTIVE" : "PAST_DUE",
                plan: plan as "FREE" | "PRO" | "BUSINESS" | "ENTERPRISE",
                currentPeriodStart: new Date(
                  (subscription.current_period_start as number) * 1000
                ),
                currentPeriodEnd: new Date(
                  (subscription.current_period_end as number) * 1000
                ),
                userId: session.metadata?.userId as string,
              },
              update: {
                status: subscription.status === "active" ? "ACTIVE" : "PAST_DUE",
                currentPeriodStart: new Date(
                  (subscription.current_period_start as number) * 1000
                ),
                currentPeriodEnd: new Date(
                  (subscription.current_period_end as number) * 1000
                ),
              },
            });

            await prismadb.organization.update({
              where: { id: orgId },
              data: { plan: plan as "FREE" | "PRO" | "BUSINESS" | "ENTERPRISE" },
            });
          }
        }
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object;
        const subscriptionId = invoice.subscription as string | undefined;

        if (subscriptionId) {
          const subResponse = await fetch(
            `https://api.stripe.com/v1/subscriptions/${subscriptionId}`,
            {
              headers: {
                Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
              },
            }
          );

          if (subResponse.ok) {
            const subscription = await subResponse.json();
            await prismadb.subscription.updateMany({
              where: { stripeId: subscriptionId },
              data: {
                status: "ACTIVE",
                currentPeriodStart: new Date(
                  (subscription.current_period_start as number) * 1000
                ),
                currentPeriodEnd: new Date(
                  (subscription.current_period_end as number) * 1000
                ),
              },
            });
          }
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object;
        const subscriptionId = invoice.subscription as string | undefined;

        if (subscriptionId) {
          await prismadb.subscription.updateMany({
            where: { stripeId: subscriptionId },
            data: { status: "PAST_DUE" },
          });
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object;
        const orgId = subscription.metadata?.orgId as string | undefined;

        await prismadb.subscription.updateMany({
          where: { stripeId: subscription.id },
          data: {
            status:
              subscription.status === "active"
                ? "ACTIVE"
                : subscription.status === "canceled"
                  ? "CANCELED"
                  : subscription.status === "past_due"
                    ? "PAST_DUE"
                    : "ACTIVE",
            cancelAtPeriodEnd:
              (subscription.cancel_at_period_end as boolean) ?? false,
            currentPeriodStart: new Date(
              (subscription.current_period_start as number) * 1000
            ),
            currentPeriodEnd: new Date(
              (subscription.current_period_end as number) * 1000
            ),
          },
        });

        if (orgId) {
          const plan = subscription.metadata?.plan as string | undefined;
          if (plan) {
            await prismadb.organization.update({
              where: { id: orgId },
              data: {
                plan:
                  subscription.status === "active"
                    ? (plan as "FREE" | "PRO" | "BUSINESS" | "ENTERPRISE")
                    : "FREE",
              },
            });
          }
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const orgId = subscription.metadata?.orgId as string | undefined;

        await prismadb.subscription.updateMany({
          where: { stripeId: subscription.id },
          data: { status: "CANCELED" },
        });

        if (orgId) {
          await prismadb.organization.update({
            where: { id: orgId },
            data: { plan: "FREE" },
          });
        }
        break;
      }

      default:
        break;
    }

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("[STRIPE_WEBHOOK]", error);
    return new Response("Webhook error", { status: 500 });
  }
}
