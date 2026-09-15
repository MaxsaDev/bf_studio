import { Certificate } from "@/types/certificate";
import { ADDONS_COURSE, ADDONS_SINGLE } from "./addons";

/**
 * `addons` = max quantity of each add-on for that product (see data/addons.ts),
 * copied from the "bf-card-additions" sheet. Omit the key to offer none
 * (master classes). Course variants carry their own limits: a single session
 * offers one of each, a full course 0-6 of each.
 */
export const certificates: Certificate[] = [
  {
    id: 1,
    type: "massage_course",
    title: "Корекція фігури (Основна)",
    description: "Корекція фігури Основна",
    variants: [
      {
        id: "session",
        label: "1 Сеанс",
        title: "1 сеанс з курсу",
        price: 1400,
        sessions: 1,
        addons: ADDONS_SINGLE,
      },
      {
        id: "basic",
        label: "10 Сеансів (Основна)",
        title: "Курс (10 сеансів)",
        price: 14000,
        sessions: 10,
        discount: {
          percentage: 5,
        },
        addons: ADDONS_COURSE,
      },
    ],
  },
  {
    id: 2,
    type: "massage_course",
    title: "Корекція фігури (Експрес)",
    description: "Корекція фігури Експрес",
    variants: [
      {
        id: "session",
        label: "1 Сеанс",
        title: "1 сеанс з курсу",
        price: 1400,
        sessions: 1,
        addons: ADDONS_SINGLE,
      },
      {
        id: "express",
        label: "6 Сеансів (Експрес)",
        title: "Курс (6 сеансів)",
        price: 8400,
        sessions: 6,
        discount: {
          percentage: 5,
        },
        addons: ADDONS_COURSE,
      },
    ],
  },
  {
    id: 3,
    type: "special",
    title: "Масаж для двох",
    description:
      "Сеанс парного масажу для 2 осіб на вибір: загальний оздоровчий, лімфодренажний, м'язове відновлення або розслабляючий масаж — при світлі свічок",
    price: 3300,
    // Candles are already part of the session
    addons: {
      foot_massage: 1,
      hand_massage: 1,
      head_massage: 1,
      aroma_oils: 1,
      extra_time: 1,
    },
  },
  {
    id: 4,
    type: "massage_course",
    title: "Масаж відновлення спини",
    description: "Масаж відновлення спини",
    variants: [
      {
        id: "session",
        label: "1 Сеанс",
        title: "1 сеанс з курсу",
        price: 1100,
        sessions: 1,
        addons: ADDONS_SINGLE,
      },
      {
        id: "course",
        label: "6 Сеансів",
        title: "Курс (6 сеансів)",
        price: 6600,
        sessions: 6,
        discount: {
          percentage: 5,
        },
        addons: ADDONS_COURSE,
      },
    ],
  },
  {
    id: 5,
    type: "massage_course",
    title: "Розслабляючий комплекс",
    description: "Розслабляючий комплекс",
    variants: [
      {
        id: "session",
        label: "1 Сеанс",
        title: "1 сеанс з курсу",
        price: 1500,
        sessions: 1,
        // The complex already includes feet, hands, oils and candles
        addons: { head_massage: 1, extra_time: 1 },
      },
      {
        id: "course",
        label: "6 Сеансів",
        title: "Курс (6 сеансів)",
        price: 9000,
        sessions: 6,
        discount: {
          percentage: 5,
        },
        addons: { head_massage: 6, extra_time: 6 },
      },
    ],
  },
  {
    id: 6,
    type: "massage_course",
    title: "Лімфодренажний масаж",
    description: "Лімфодренажний масаж",
    variants: [
      {
        id: "session",
        label: "1 Сеанс",
        title: "1 сеанс з курсу",
        price: 1350,
        sessions: 1,
        addons: ADDONS_SINGLE,
      },
      {
        id: "course",
        label: "6 Сеансів",
        title: "Курс (6 сеансів)",
        price: 8100,
        sessions: 6,
        discount: {
          percentage: 5,
        },
        addons: ADDONS_COURSE,
      },
    ],
  },
  {
    id: 7,
    type: "massage_course",
    title: "Загальний оздоровчий масаж",
    description: "Загальний оздоровчий масаж",
    variants: [
      {
        id: "session",
        label: "1 Сеанс",
        title: "1 сеанс з курсу",
        price: 1350,
        sessions: 1,
        addons: ADDONS_SINGLE,
      },
      {
        id: "course",
        label: "6 Сеансів",
        title: "Курс (6 сеансів)",
        price: 8100,
        sessions: 6,
        discount: {
          percentage: 5,
        },
        addons: ADDONS_COURSE,
      },
    ],
  },
  {
    id: 8,
    type: "massage_course",
    title: "Масаж м'язове відновлення",
    description: "Масаж м'язове відновлення",
    variants: [
      {
        id: "session",
        label: "1 Сеанс",
        title: "1 сеанс з курсу",
        price: 1350,
        sessions: 1,
        addons: ADDONS_SINGLE,
      },
      {
        id: "course",
        label: "6 Сеансів",
        title: "Курс (6 сеансів)",
        price: 8100,
        sessions: 6,
        discount: {
          percentage: 5,
        },
        addons: ADDONS_COURSE,
      },
    ],
  },
  {
    id: 9,
    type: "gift_certificate",
    denomination: 500,
    description: "Послуги масажу 500 грн",
    addons: ADDONS_SINGLE,
  },
  {
    id: 10,
    type: "gift_certificate",
    denomination: 1000,
    description: "Послуги масажу 1000 грн",
    addons: ADDONS_SINGLE,
  },
  {
    id: 11,
    type: "gift_certificate",
    denomination: 2000,
    description: "Послуги масажу 2000 грн",
    addons: ADDONS_SINGLE,
  },
  {
    id: 12,
    type: "gift_certificate",
    denomination: 3000,
    description: "Послуги масажу 3000 грн",
    addons: ADDONS_SINGLE,
  },
  {
    id: 13,
    type: "gift_certificate",
    denomination: 5000,
    description: "Послуги масажу 5000 грн",
    addons: ADDONS_SINGLE,
  },
  {
    id: 14,
    type: "named_gift_certificate",
    denomination: 2000,
    title: "Рубіновий",
    description: "Послуги масажу 2000 грн",
    addons: ADDONS_SINGLE,
  },
  {
    id: 15,
    type: "named_gift_certificate",
    denomination: 500,
    title: "Смарагдовий",
    description: "Послуги масажу 500 грн",
    addons: ADDONS_SINGLE,
  },
  {
    id: 16,
    type: "named_gift_certificate",
    denomination: 1000,
    title: "Сапфіровий",
    description: "Послуги масажу 1000 грн",
    addons: ADDONS_SINGLE,
  },
  {
    id: 17,
    type: "master_class",
    title: "Класичний масаж",
    description: "Майстер-клас з техніки класичного масажу",
    price: 3750,
  },
  {
    id: 18,
    type: "master_class",
    title: "Релакс",
    description: "Майстер клас з техніки релакс-масажу",
    price: 4000,
  },
  {
    id: 19,
    type: "master_class",
    title: "Масаж для пар",
    description: "Майстер-клас з масажу для пар",
    price: 5000,
  },
  {
    id: 20,
    type: "master_class",
    title: "Антицелюлітний масаж",
    description: "Майстер-клас з техніки антицелюлітного масажу",
    price: 6000,
  },
  {
    id: 21,
    type: "master_class",
    title: "Масажист",
    description: "Майстер-клас «Масажист»",
    price: 4950,
  },
  {
    id: 22,
    type: "special",
    title: "Загальний оздоровчий на 90 хв",
    description: "Загальний оздоровчий масаж 90 хв",
    price: 1900,
    // Body-part add-ons are not offered for the 90-minute session
    addons: { aroma_oils: 1, candles: 1, extra_time: 1 },
  },
  {
    id: 23,
    type: "special",
    title: "Розслабляючий",
    description: "Розслабляючий масаж",
    price: 1300,
    addons: ADDONS_SINGLE,
  },
  {
    id: 24,
    type: "special",
    title: "Гарячим камінням",
    description: "Масаж гарячим камінням",
    price: 1550,
    // Candles are already part of the session
    addons: {
      foot_massage: 1,
      hand_massage: 1,
      head_massage: 1,
      aroma_oils: 1,
      extra_time: 1,
    },
  },
  {
    id: 25,
    type: "special",
    title: "Антистрес-масаж",
    description: "Антистрес-масаж 90 хв",
    price: 1900,
    // Feet are already part of the anti-stress session
    addons: {
      hand_massage: 1,
      head_massage: 1,
      aroma_oils: 1,
      candles: 1,
      extra_time: 1,
    },
  },
];
