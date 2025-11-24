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
      note: "Строк дії сертифіката — 3 місяці з дати оплати. Не забудьте записатися на сеанс завчасно, щоб гарантувати зручний для вас час.",

      // For special promotions (Black Friday, etc.)
      // Uncomment and modify these during promotions:
      isPromotion: true,
      promotionLabel: "Чорна п'ятниця 2025",
      promotionNote:
        "Строк отримання послуги — 6 місяців з дати оплати. Не забудьте записатися на сеанс завчасно, щоб гарантувати зручний для вас час.",
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
  },
} as const;

export type SiteConfig = typeof siteConfig;
