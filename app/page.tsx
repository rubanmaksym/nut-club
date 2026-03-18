"use client";

import { useEffect, useMemo, useState } from "react";
import { SHOP } from "../data/shop";

type Category = "nuts" | "dry";

type CartItem = {
  id: number;
  name: string;
  category: Category;
  price100: number;
  pack: number;
  qty: number;
};

type Product = { 
  id: number;
  name: string;
  category: Category;
  price100: number;
  image: string;
};

function priceForPack(price100: number, grams: number) {
  return Math.round((price100 * grams) / 100);
}

function discountPercent(subtotal: number) {
  for (const d of SHOP.discounts) {
    if (subtotal >= d.from) return d.percent;
  }
  return 0;
}

export default function Home() {
  const [category, setCategory] = useState<Category>("nuts");
  const [selectedPack, setSelectedPack] = useState<number>(SHOP.packs[0]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCatalog() {
      try {
        const res = await fetch("/api/catalog");
        const data = await res.json();
        setProducts(data);
      } catch (err) {
        console.error("Помилка завантаження каталогу", err);
      } finally {
        setLoading(false);
      }
    }

    loadCatalog();
  }, []);

  const visible = useMemo(() => {
    return products.filter((p) => p.category === category);
  }, [products, category]);

  function add(product: Product) {
    const key = `${product.id}_${selectedPack}`;
    const exist = cart.find((i) => `${i.id}_${i.pack}` === key);

    if (exist) {
      setCart(
        cart.map((i) =>
          `${i.id}_${i.pack}` === key ? { ...i, qty: i.qty + 1 } : i
        )
      );
    } else {
      setCart([
        ...cart,
        {
          id: product.id,
          name: product.name,
          category: product.category,
          price100: product.price100,
          pack: selectedPack,
          qty: 1,
        },
      ]);
    }
  }

  function remove(item: CartItem) {
    const key = `${item.id}_${item.pack}`;
    const exist = cart.find((i) => `${i.id}_${i.pack}` === key);
    if (!exist) return;

    if (exist.qty === 1) {
      setCart(cart.filter((i) => `${i.id}_${i.pack}` !== key));
    } else {
      setCart(
        cart.map((i) =>
          `${i.id}_${i.pack}` === key ? { ...i, qty: i.qty - 1 } : i
        )
      );
    }
  }

  const subtotal = cart.reduce(
    (s, i) => s + priceForPack(i.price100, i.pack) * i.qty,
    0
  );

  const disc = discountPercent(subtotal);
  const discountAmount = Math.round((subtotal * disc) / 100);
  const afterDiscount = subtotal - discountAmount;

  const delivery =
    afterDiscount > 0 && afterDiscount < SHOP.delivery.freeFrom
      ? SHOP.delivery.fee
      : 0;

  const total = afterDiscount + delivery;
  const giftActive = SHOP.gift.enabled && afterDiscount >= SHOP.gift.from;

  async function sendOrder() {
    const name = (document.getElementById("name") as HTMLInputElement).value;
    const phone = (document.getElementById("phone") as HTMLInputElement).value;
    const address = (document.getElementById("address") as HTMLInputElement).value;
    const comment = (document.getElementById("comment") as HTMLTextAreaElement).value;

    if (!phone) {
      alert("Вкажіть телефон");
      return;
    }

    if (cart.length === 0) {
      alert("Додайте товари в кошик");
      return;
    }

    const order = {
      name,
      phone,
      telegram: "",
      delivery_type: "delivery",
      address,
      comment,
      items: cart,
      subtotal,
      discount: discountAmount,
      delivery_fee: delivery,
      gift: giftActive ? "2x25" : "none",
      total,
    };

    const res = await fetch("/api/order", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(order),
    });

    const result = await res.json();
    console.log("ORDER RESULT:", result);

    if (!res.ok) {
      alert("Помилка відправки замовлення");
      return;
    }
    
	setCart([]);

    const nameInput = document.getElementById("name") as HTMLInputElement | null;
    const phoneInput = document.getElementById("phone") as HTMLInputElement | null;
    const addressInput = document.getElementById("address") as HTMLInputElement | null;
    const commentInput = document.getElementById("comment") as HTMLTextAreaElement | null;

    if (nameInput) nameInput.value = "";
    if (phoneInput) phoneInput.value = "";
    if (addressInput) addressInput.value = "";
    if (commentInput) commentInput.value = "";
	
    alert("Замовлення відправлено");
  }

  return (
    <main className="shop-page">
      <div className="shop-shell">
        <header className="topbar">
		<nav className="quick-nav">
          <a href="#catalog">Каталог</a>
          <a href="#benefits">Переваги</a>
          <a href="#about">Про нас</a>
          <a href="#delivery">Доставка</a>
          <a href="#contacts">Контакти</a>
        </nav>
          <div>
            <div className="topbar-city">{SHOP.city}</div>
            <h1 className="topbar-title">Горіховий клуб</h1>
            <p className="topbar-subtitle">
              Свіжі горіхи та сухофрукти з доставкою по місту
            </p>
          </div>

          <div className="topbar-badge">ГК</div>
        </header>

        <section className="hero-card">
		  <div className="hero-overlay" />

		  <div className="hero-inner">
			<div className="hero-left">
			  <div className="hero-badge-row">
				<div className="hero-logo">ГК</div>

				<div className="hero-badge-text">
				  <span className="hero-kicker">Сьогодні вигідно</span>
				  <div className="hero-mini">Доставка по Дніпру</div>
				</div>
			  </div>

			  <div className="hero-text">
				<h2>Натуральні горіхи та сухофрукти для дому, дітей та спорту</h2>
				<p>{SHOP.delivery.note}</p>
			  </div>

			  <div className="hero-actions">
				<button
				  className="hero-btn hero-btn-primary"
				  onClick={() => {
					const el = document.getElementById("catalog");
					el?.scrollIntoView({ behavior: "smooth" });
				  }}
				>
				  До каталогу
				</button>

				<button
				  className="hero-btn hero-btn-secondary"
				  onClick={() => {
					const el = document.getElementById("checkout");
					el?.scrollIntoView({ behavior: "smooth" });
				  }}
				>
				  Оформити
				</button>
			  </div>
			</div>
		  </div>
		</section>

        <section className="filters-card" id="catalog">
          <div className="tabs">
            <button
              onClick={() => setCategory("nuts")}
              className={`tab-btn ${category === "nuts" ? "active nuts" : ""}`}
            >
              Горіхи
            </button>

            <button
              onClick={() => setCategory("dry")}
              className={`tab-btn ${category === "dry" ? "active dry" : ""}`}
            >
              Сухофрукти
            </button>
          </div>

          <div className="packs-row">
            <div className="packs-label">Фасовка</div>

            <div className="packs-list">
              {SHOP.packs.map((g) => (
                <button
                  key={g}
                  onClick={() => setSelectedPack(g)}
                  className={`pack-chip ${selectedPack === g ? "active" : ""}`}
                >
                  {g}г
                </button>
              ))}
            </div>
          </div>
        </section>

        {loading ? (
          <div className="loading-box">Завантаження каталогу...</div>
        ) : null}

        <section className="catalog-grid">
          {visible.map((p) => {
            const packPrice = priceForPack(p.price100, selectedPack);
            const inCart = cart.find((i) => i.id === p.id && i.pack === selectedPack);

            return (
              <article key={p.id} className="product-card">
                <div className="product-thumb-wrap">
                  <img
                    src={`/products/${p.image}`}
                    alt={p.name}
                    className="product-image"
                  />
                </div>

                <div className="product-body">
                  <div className="product-meta">
                    <span className="product-category">
                      {p.category === "nuts" ? "Горіхи" : "Сухофрукти"}
                    </span>
                  </div>

                  <h3 className="product-title">{p.name}</h3>

                  <div className="product-price-main">{packPrice} грн</div>
                  <div className="product-price-sub">
                    {selectedPack}г · {p.price100} грн / 100г
                  </div>

                  <div className="product-actions">
                    <button
                      onClick={() => inCart && remove(inCart)}
                      className="qty-btn"
                      type="button"
                    >
                      −
                    </button>

                    <div className="qty-num">{inCart?.qty || 0}</div>

                    <button
                      onClick={() => add(p)}
                      className="qty-btn qty-btn-plus"
                      type="button"
                    >
                      +
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </section>

        <section className="summary-card">
          <div className="summary-head">
            <h2>Кошик</h2>
            <span>{cart.reduce((s, i) => s + i.qty, 0)} шт.</span>
          </div>

          {cart.length === 0 ? (
            <div className="summary-empty">Поки що кошик порожній</div>
          ) : (
            <div className="summary-items">
              {cart.map((i) => (
                <div key={`${i.id}_${i.pack}`} className="summary-item">
                  <div>
                    <div className="summary-item-name">{i.name}</div>
                    <div className="summary-item-sub">
                      {i.pack}г × {i.qty}
                    </div>
                  </div>

                  <div className="summary-item-price">
                    {priceForPack(i.price100, i.pack) * i.qty} грн
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="summary-totals">
            <div className="summary-line">
              <span>Товари</span>
              <b>{subtotal} грн</b>
            </div>

            <div className="summary-line">
              <span>Знижка {disc > 0 ? `(${disc}%)` : ""}</span>
              <b>-{discountAmount} грн</b>
            </div>

            <div className="summary-line">
              <span>Доставка</span>
              <b>{delivery} грн</b>
            </div>

            {giftActive ? <div className="gift-badge">{SHOP.gift.label}</div> : null}

            <div className="summary-total">
              <span>До сплати</span>
              <strong>{total} грн</strong>
            </div>
          </div>
        </section>

        <section className="checkout-card" id="checkout">
          <h2 className="checkout-title">Оформлення замовлення</h2>

          <div className="checkout-grid">
            <input id="name" placeholder="Ім'я" className="checkout-input" />
            <input id="phone" placeholder="Телефон" className="checkout-input" />
            <input
              id="address"
              placeholder="Адреса доставки"
              className="checkout-input"
            />
            <textarea
              id="comment"
              placeholder="Коментар до замовлення"
              className="checkout-input checkout-textarea"
            />

            <button onClick={sendOrder} className="checkout-submit" type="button">
              Оформити замовлення
            </button>
          </div>
        </section>
      </div>
      
	  <section className="benefits-section" id="benefits">
	    <div className="info-block">
		  <div className="section-kicker">Чому обирають нас</div>
		  <h2 className="section-title">Переваги</h2>

		  <div className="benefits-grid">
		    <div className="benefit-card">
			  <div className="benefit-icon">🥜</div>
			  <h3>Свіжі продукти</h3>
			  <p>Популярні горіхи та сухофрукти для дому, дітей, спорту та щоденних перекусів.</p>
		    </div>

		    <div className="benefit-card">
			  <div className="benefit-icon">🚚</div>
			  <h3>Швидка доставка</h3>
			  <p>Доставка по Дніпру. Від 1000 грн — безкоштовно, а також діє подарунок до замовлення.</p>
		    </div>

		    <div className="benefit-card">
			  <div className="benefit-icon">⚖️</div>
			  <h3>Зручна фасовка</h3>
			  <p>Доступні фасовки 250г, 500г і 1000г — легко замовити потрібний обсяг без зайвих дзвінків.</p>
		    </div>

		    <div className="benefit-card">
			  <div className="benefit-icon">💸</div>
			  <h3>Знижки від суми</h3>
			  <p>Автоматичні знижки від суми кошика та зрозумілі умови замовлення без складних правил.</p>
		    </div>
		  </div>
	    </div>
	  </section>

	  <section className="about-section" id="about">
	    <div className="info-block">
		  <div className="section-kicker">Про магазин</div>
		  <h2 className="section-title">Про нас</h2>

		  <div className="info-text">
		    <p>
			  <b>Горіховий клуб</b> — це онлайн-магазин свіжих горіхів та сухофруктів у Дніпрі.
			  Ми зібрали найпопулярніші позиції для щоденного харчування, дитячих перекусів,
			  домашнього використання та активного способу життя.
		    </p>

		    <p>
			  Наш підхід простий: зрозумілий каталог, чесна фасовка, швидке оформлення замовлення
			  та доставка по місту. Ви обираєте потрібні позиції, а ми оперативно обробляємо замовлення.
		    </p>
		  </div>
	    </div>
	  </section>

	  <section className="delivery-section" id="delivery">
	    <div className="info-block">
		  <div className="section-kicker">Умови замовлення</div>
		  <h2 className="section-title">Доставка і оплата</h2>

		  <div className="info-grid">
		    <div className="info-card">
			  <h3>Доставка</h3>
			  <ul className="info-list">
			    <li>Доставка по Дніпру</li>
			    <li>Вартість доставки — {SHOP.delivery.fee} грн</li>
			    <li>Безкоштовна доставка від {SHOP.delivery.freeFrom} грн</li>
			    <li>Після оформлення ми зв’язуємось для підтвердження замовлення</li>
			  </ul>
		    </div>

		    <div className="info-card">
			  <h3>Оплата</h3>
			  <ul className="info-list">
			    <li>Оплата після підтвердження замовлення</li>
			    <li>Уточнення способу оплати під час зв’язку з клієнтом</li>
			    <li>Знижки рахуються автоматично від суми кошика</li>
			    <li>Подарунок додається при замовленні від {SHOP.gift.from} грн</li>
			  </ul>
		    </div>
		  </div>
	    </div>
	  </section>

	  <section className="reviews-section" id="reviews">
	    <div className="info-block">
		  <div className="section-kicker">Довіра клієнтів</div>
		  <h2 className="section-title">Відгуки</h2>

		  <div className="reviews-grid">
		    <div className="review-card">
			  <div className="review-stars">★★★★★</div>
			  <p>
			    Замовлення оформили швидко, все зрозуміло і без зайвих дзвінків.
			    Горіхи свіжі, фасовка зручна.
			  </p>
			  <div className="review-author">Олена, Дніпро</div>
		    </div>

		    <div className="review-card">
			  <div className="review-stars">★★★★★</div>
			  <p>
			    Сподобалось, що можна одразу побачити ціну за фасовку і суму до оплати.
			    Доставка приїхала вчасно.
			  </p>
			  <div className="review-author">Андрій, Дніпро</div>
		    </div>

		    <div className="review-card">
			  <div className="review-stars">★★★★★</div>
			  <p>
			    Брали для дому і для дітей. Сухофрукти нормальної якості, замовлення
			    підтвердили швидко.
			  </p>
			  <div className="review-author">Марина, Дніпро</div>
		    </div>
		  </div>
	    </div>
	  </section>
	  
	  <section className="contacts-section" id="contacts">
	    <div className="info-block">
		  <div className="section-kicker">Зв’язок</div>
		  <h2 className="section-title">Контакти</h2>

		  <div className="contacts-grid">
		    <div className="contact-card">
			  <div className="contact-label">Місто</div>
			  <div className="contact-value">Дніпро</div>
		    </div>

		    <div className="contact-card">
			  <div className="contact-label">Телефон</div>
			  <div className="contact-value">
			   <a href="tel:+380660653477">+38 (066) 065-34-77</a>
			  </div> 
		    </div>

		    <div className="contact-card">
			  <div className="contact-label">Telegram</div>
			  <div className="contact-value">
			    <a href="https://t.me/rubanmaksym" target="_blank" rel="noreferrer">
				  @rubanmaksym
				</a>
			  </div>	
		    </div>

		    <div className="contact-card">
			  <div className="contact-label">Графік</div>
			  <div className="contact-value">Щодня, 09:00–20:00</div>
		    </div>
		  </div>

		  <div className="contacts-note">
		    Для швидкого замовлення залиште заявку на сайті — ми зв’яжемося з вами для підтвердження.
		  </div>
	    </div>
	  </section>

	  <footer className="site-footer">
	    <div className="site-footer-inner">
		  <div>
		    <div className="footer-brand">Горіховий клуб</div>
		    <div className="footer-text">Свіжі горіхи та сухофрукти з доставкою по Дніпру</div>
		  </div>

		  <div className="footer-links">
		    <a href="#catalog">Каталог</a>
		    <a href="#benefits">Переваги</a>
		    <a href="#about">Про нас</a>
		    <a href="#contacts">Контакти</a>
		  </div>
	    </div>
	  </footer>
	  
      <div className="sticky-orderbar">
        <div>
          <div className="sticky-orderbar-top">До сплати</div>
          <div className="sticky-orderbar-total">{total} грн</div>
        </div>

        <button
          className="sticky-orderbar-btn"
          onClick={() => {
            const el = document.getElementById("checkout");
            el?.scrollIntoView({ behavior: "smooth" });
          }}
        >
          Замовити
        </button>
      </div>
    </main>
  );
}
