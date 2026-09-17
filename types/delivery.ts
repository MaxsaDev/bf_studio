/**
 * How the buyer gets the BFCard(s): picked up at the studio, shipped by Nova
 * Poshta to a recipient (often a different person - the certificate is a
 * gift), or sent electronically by the studio's staff. One delivery per
 * order, whatever the cart holds.
 */

export type DeliveryMethod = "pickup" | "nova_poshta" | "electronic";

export interface DeliveryRecipient {
  /** "Ім'я Прізвище" as typed by the buyer */
  name: string;
  /** +380XXXXXXXXX */
  phone: string;
}

export interface NovaPoshtaDelivery {
  method: "nova_poshta";
  recipient: DeliveryRecipient;
  city: {
    /** Nova Poshta CityRef (the settlement's DeliveryCity) */
    ref: string;
    /** Short name, e.g. "Львів" */
    name: string;
    /** Full label, e.g. "м. Львів, Львівська обл." */
    present?: string;
  };
  warehouse: {
    /** Nova Poshta warehouse Ref */
    ref: string;
    /** e.g. "Відділення №5 (до 30 кг): вул. Шевченка, 60" */
    description: string;
    category: "Branch" | "Postomat";
  };
}

export interface PickupDelivery {
  method: "pickup";
}

/**
 * Electronic BFCard: no shipping and no extra fields. Like pickup, the admin
 * calls the buyer and sends the card (email, messenger - staff decide)
 */
export interface ElectronicDelivery {
  method: "electronic";
}

export type DeliveryDetails = PickupDelivery | NovaPoshtaDelivery | ElectronicDelivery;

/* Lookup results served by /api/np/* (shape defined by the payments service) */

export interface NpSettlement {
  /** Settlement Ref (searchSettlements) */
  ref: string;
  /** CityRef used for warehouses and waybills (DeliveryCity) */
  cityRef: string;
  /** "м. Львів, Львівська обл." */
  present: string;
  /** "Львів" */
  name: string;
  area: string;
  region: string;
  /** Number of branches + lockers */
  warehouses: number;
}

export interface NpWarehouse {
  ref: string;
  number: string;
  /** "Відділення №5 (до 30 кг): вул. Шевченка, 60" */
  description: string;
  shortAddress: string;
  category: "Branch" | "Postomat";
  maxWeightKg: number;
  cityRef: string;
}
