/**
 * Site Configuration
 * Centralized configuration for Body Factory website
 * Update these values to change site-wide settings without modifying component code
 */

export const siteConfig = {
  /**
   * Business Information
   */
  business: {
    name: "Body Factory",
    location: "Львів",
    description: "Студія професійного масажу",
  },

  /**
   * Contact Information
   */
  contact: {
    phone: {
      display: "+38 096 918 90 89",
      raw: "+380969189089",
      href: "tel:+380969189089",
    },
    instagram: {
      handle: "@bodyfactory.ua",
      url: "https://instagram.com/bodyfactory.ua",
    },
    // Add email when needed
    // email: {
    //   address: "info@bodyfactory.ua",
    //   href: "mailto:info@bodyfactory.ua",
    // },
  },

  /**
   * Certificate Validity Configuration
   * Change these values for special promotions (e.g., Black Friday)
   */
  certificate: {
    validity: {
      // Standard validity period
      months: 3,
      days: 90,

      // Display text for UI
      displayText: "3 місяці",

      // Full note shown on success page
      note: "Строк дії BFCard - 3 місяці з дати оплати. Не забудьте записатися на сеанс завчасно, щоб гарантувати зручний для вас час.",

      // For special promotions (Black Friday, etc.)
      // Uncomment and modify these during promotions:
      isPromotion: false,
      promotionLabel: "Чорна п'ятниця 2025",
      promotionNote:
        "Строк отримання послуги - 6 місяців з дати оплати. Не забудьте записатися на сеанс завчасно, щоб гарантувати зручний для вас час.",
    },
  },

  /**
   * Success Page Configuration
   */
  successPage: {
    title: "Оплата успішна!",
    subtitle:
      "Ваш платіж успішно оброблено. Дякуємо за довіру до Body Factory!",

    steps: [
      {
        number: 1,
        text: "Найближчим часом з вами зв'яжеться наш адміністратор для підтвердження та узгодження деталей.",
      },
      {
        number: 2,
        text: "Ви отримаєте всю необхідну інформацію за вибраною послугою.",
      },
      {
        number: 3,
        text: "Запишіться на зручний для вас час та насолоджуйтесь професійним масажем у Body Factory.",
      },
    ],

    footerNote: "Чекаємо на вас у студії професійного масажу Body Factory",
  },

  /**
   * How the BFCard reaches the buyer / recipient. Chosen once per order on
   * the payment screen; options show in this order, the first enabled one is
   * preselected.
   */
  delivery: {
    /** Pick the card up at the studio, no shipping */
    pickup: {
      enabled: true as boolean,
      label: "Забрати в студії",
      note: "Львів. Адміністратор узгодить з вами зручний час.",
    },
    /**
     * Nova Poshta branch or parcel locker. The waybill is created by the
     * payments service after the payment; who pays, the declared value, the
     * parcel size and the studio's sender branch are its env (NOVA_POSHTA_*
     * in bf-back-v2), not something the site decides.
     */
    novaPoshta: {
      enabled: true as boolean,
      label: "Нова пошта",
      note: "Відділення або поштомат. Доставку оплачує отримувач за тарифами Нової пошти.",
      /** Display only ("оплата при отриманні"); must match NOVA_POSHTA_PAYER in bf-back-v2 */
      recipientPays: true as boolean,
    },
    /** Electronic BFCard: nothing to ship, staff send it to the buyer (email, messenger) */
    electronic: {
      enabled: true as boolean,
      label: "Електронний",
      note: "Адміністратор надішле вам електронну BFCard найближчим часом.",
    },
  },

  /**
   * Legal Pages
   */
  legal: {
    agreement: {
      path: "/agreement",
      title: "Угода користувача",
    },
    privacy: {
      path: "/privacy",
      title: "Політика конфіденційності",
    },
  },

  /**
   * Feature Flags
   * Use these to enable/disable features or show special promotions
   */
  features: {
    // Enable during special promotions
    isSpecialPromotion: false,
    promotionBanner: {
      enabled: false,
      message: "",
      // Example: "Чорна п'ятниця! Знижка 20% на всі сертифікати до 30.11.2025"
    },
    /**
     * Add-on upsell step in checkout ("Додатки": foot massage, candles, ...).
     * false = plain BFCard sales only: no step, no stickers on the card, and
     * the payment route rejects requests that still carry add-ons.
     */
    addons: {
      enabled: true as boolean,
    },
  },
} as const;

export type SiteConfig = typeof siteConfig;
