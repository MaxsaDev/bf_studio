import { NextRequest, NextResponse } from "next/server";

/**
 * Server-side proxy to the BodyFactory payments service.
 *
 * The payments service requires an `x-api-key` header; the key must never be
 * shipped to the browser, so the checkout form posts here and this route
 * forwards the request with credentials attached.
 *
 * Env (server-side only, set in Vercel too):
 * - PAYMENT_SERVICE_URL      e.g. https://bf-club-delta.vercel.app/api/v1/payments
 * - PAYMENT_SERVICE_API_KEY  key accepted by the service's API_KEYS list
 */

const SERVICE_URL =
  process.env.PAYMENT_SERVICE_URL ||
  `${process.env.NEXT_PUBLIC_API_URL || "https://bf-club-delta.vercel.app"}/api/v1/payments`;

export async function POST(req: NextRequest) {
  let body: {
    amount?: number;
    orderDescription?: string;
    name?: string;
    phone?: string;
    userId?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: { message: "Invalid request body" } },
      { status: 400 }
    );
  }

  if (
    typeof body.amount !== "number" ||
    body.amount <= 0 ||
    !body.orderDescription ||
    !body.name ||
    !body.phone
  ) {
    return NextResponse.json(
      { error: { message: "Missing required fields" } },
      { status: 400 }
    );
  }

  const apiKey = process.env.PAYMENT_SERVICE_API_KEY;
  if (!apiKey) {
    console.error("[create-invoice] PAYMENT_SERVICE_API_KEY is not set");
    return NextResponse.json(
      { error: { message: "Payment service is not configured" } },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(`${SERVICE_URL}/invoice`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        amount: body.amount,
        orderDescription: body.orderDescription,
        name: body.name,
        phone: body.phone,
        userId: body.userId,
        regular: "none",
        merchant: "studio", // certificates always use the studio WFP account
      }),
      cache: "no-store",
    });

    const result = await response.json();

    if (!response.ok || !result?.success || !result?.data?.invoiceUrl) {
      console.error("[create-invoice] service error:", result?.error);
      return NextResponse.json(
        {
          error: {
            message:
              result?.error?.message ||
              "Не вдалося створити рахунок для оплати. Спробуйте ще раз.",
          },
        },
        { status: response.ok ? 502 : response.status }
      );
    }

    return NextResponse.json({
      url: result.data.invoiceUrl,
      orderReference: result.data.orderReference,
    });
  } catch (error) {
    console.error("[create-invoice] request failed:", error);
    return NextResponse.json(
      {
        error: {
          message: "Не вдалося створити рахунок для оплати. Спробуйте ще раз.",
        },
      },
      { status: 502 }
    );
  }
}
