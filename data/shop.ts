export const SHOP = {
  city: "Дніпро",
  currency: "грн",

  packs: [250, 500, 1000], // граммы

  delivery: {
    fee: 80,
    freeFrom: 1000,
    note: "Доставка по Дніпру від 800 грн. Від 1000 грн — безкоштовно + 🎁 подарунок (2×25г)."
  },

  gift: {
    enabled: true,
    from: 1000,
    label: "🎁 Подарунок: 2×25г (мікс)"
  },

  discounts: [
    { from: 1500, percent: 15 },
    { from: 1000, percent: 10 },
    { from: 600, percent: 5 },
  ],

  products: [
    // NUTS
    { id: 1, name: "Мигдаль сирий", price100: 90, category: "nuts" },
    { id: 2, name: "Мигдаль смажений", price100: 95, category: "nuts" },
    { id: 3, name: "Фундук сирий", price100: 85, category: "nuts" },
    { id: 4, name: "Фундук смажений", price100: 90, category: "nuts" },
    { id: 5, name: "Кешью W320", price100: 110, category: "nuts" },
    { id: 6, name: "Фісташки солоні", price100: 120, category: "nuts" },
    { id: 7, name: "Грецький горіх", price100: 80, category: "nuts" },

    // DRY
    { id: 8, name: "Курага", price100: 70, category: "dry" },
    { id: 9, name: "Ізюм білий", price100: 60, category: "dry" },
    { id: 10, name: "Ізюм синій", price100: 60, category: "dry" },
    { id: 11, name: "Фініки", price100: 65, category: "dry" },
    { id: 12, name: "Чорнослив", price100: 75, category: "dry" },
    { id: 13, name: "Інжир", price100: 95, category: "dry" },
  ]
} as const