/**
 * Browser client for /api/shipments (automatic Nova Poshta waybill after
 * payment). Never throws: the caller decides what each outcome means for
 * the stored pending shipment.
 */

export interface ShipmentDeliverySummary {
  recipientName: string;
  cityName: string;
  warehouseDescription: string;
}

export type ShipmentResponse =
  | {
      status: "created" | "exists";
      waybill: { number: string; estimatedDeliveryDate: string; mock?: boolean };
      delivery: ShipmentDeliverySummary;
    }
  | { status: "pending"; paymentStatus: string }
  | { status: "failed"; paymentStatus: string };

export type CreateShipmentResult =
  | { ok: true; data: ShipmentResponse }
  | { ok: false; httpStatus: number; message: string };

export async function createShipment(body: {
  orderReference: string;
  /** Per-order secret issued by the payments service when the invoice was created */
  clientToken: string;
}): Promise<CreateShipmentResult> {
  try {
    const response = await fetch("/api/shipments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await response.json().catch(() => null);
    if (!response.ok && !(response.status === 202 && json?.status === "pending")) {
      return {
        ok: false,
        httpStatus: response.status,
        message: json?.error?.message ?? json?.status ?? `HTTP ${response.status}`,
      };
    }
    return { ok: true, data: json as ShipmentResponse };
  } catch (error) {
    return { ok: false, httpStatus: 0, message: error instanceof Error ? error.message : "network" };
  }
}
