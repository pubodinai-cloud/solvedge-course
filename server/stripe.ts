import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
    _stripe = new Stripe(key, { apiVersion: "2025-02-24.acacia" as any });
  }
  return _stripe;
}

export async function createCheckoutSession(params: {
  courseId: number;
  courseTitle: string;
  priceInSatang: number;
  userId: number;
  userEmail: string;
  userName: string;
  origin: string;
  courseSlug: string;
}) {
  const stripe = getStripe();

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "thb",
          product_data: {
            name: params.courseTitle,
            metadata: { courseId: params.courseId.toString() },
          },
          unit_amount: params.priceInSatang, // in satang (smallest THB unit)
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    customer_email: params.userEmail,
    client_reference_id: params.userId.toString(),
    metadata: {
      user_id: params.userId.toString(),
      course_id: params.courseId.toString(),
      customer_email: params.userEmail,
      customer_name: params.userName,
    },
    allow_promotion_codes: true,
    success_url: `${params.origin}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${params.origin}/courses/${params.courseSlug}`,
  });

  return session;
}

export async function handleWebhookEvent(payload: Buffer, signature: string) {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) throw new Error("STRIPE_WEBHOOK_SECRET is not set");

  const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  return event;
}
