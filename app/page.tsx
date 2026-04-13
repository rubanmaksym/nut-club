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
  description?: string;
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
  const [selectedPacks, setSelectedPacks] = useState<Record<number, number>>({});
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showFloating, setShowFloating] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [orderSuccess, setOrderSuccess] = useState(false);
  
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowFloating(true);
      } else {
        setShowFloating(false);
      }
    };

    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  
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
	const step = selectedPacks[product.id] || 50;
	const exist = cart.find((i) => i.id === product.id);

	if (exist) {
      setCart(
		cart.map((i) =>
		  i.id === product.id ? { ...i, pack: i.pack + step } : i
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
		  pack: step,
		  qty: 1,
		},
	  ]);
	}
  }

  function remove(item: CartItem) {
    const step = selectedPacks[item.id] || 50;
    const exist = cart.find((i) => i.id === item.id);
    if (!exist) return;

    if (exist.pack <= step) {
      setCart(cart.filter((i) => i.id !== item.id));
    } else {
      setCart(
        cart.map((i) =>
          i.id === item.id ? { ...i, pack: i.pack - step } : i
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
	setOrderSuccess(false);
    const name = (document.getElementById("name") as HTMLInputElement).value;
    const phone = (document.getElementById("phone") as HTMLInputElement).value;
	const npOffice = (document.getElementById("npOffice") as HTMLInputElement)?.value || "";
    const address = (document.getElementById("address") as HTMLInputElement).value;
    const comment = (document.getElementById("comment") as HTMLTextAreaElement).value;
	const company = (document.getElementById("company") as HTMLInputElement)?.value || "";
	
    const cleanName = name.trim();
	const cleanPhone = phone.trim();
	const cleanNpOffice = npOffice.trim();
	const cleanAddress = address.trim();

	const phoneDigits = cleanPhone.replace(/\D/g, "");
	const addressHasLetters = /[A-Za-zА-Яа-яІіЇїЄєҐґ]/.test(cleanAddress);
	const addressHasNumbers = /\d/.test(cleanAddress);

	if (cleanName.length < 2) {
	  alert("Вкажіть коректне ім'я");
	  return;
	}

	if (!/^[A-Za-zА-Яа-яІіЇїЄєҐґ'`\-\s]+$/.test(cleanName)) {
	  alert("Ім'я містить недопустимі символи");
	  return;
	}

	if (!/^(0\d{9}|380\d{9})$/.test(phoneDigits)) {
	  alert("Вкажіть коректний номер телефону");
	  return;
	}
	
	if (cleanNpOffice.length < 2) {
	  alert("Вкажіть відділення або поштомат Нової пошти");
	  return;
	}

	if (cleanAddress.length < 5) {
	  alert("Вкажіть коректну адресу доставки");
	  return;
	}

	if (!addressHasLetters || !addressHasNumbers) {
	  alert("Адреса має містити вулицю та номер будинку");
	  return;
	}
    
	if (company.trim()) {
      return;
    }

    if (cart.length === 0) {
      alert("Додайте товари в кошик");
      return;
    }

    const order = {
      name,
      phone,
	  npOffice,
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
	setOrderSuccess(true);

    const nameInput = document.getElementById("name") as HTMLInputElement | null;
    const phoneInput = document.getElementById("phone") as HTMLInputElement | null;
	const npOfficeInput = document.getElementById("npOffice") as HTMLInputElement | null;
    const addressInput = document.getElementById("address") as HTMLInputElement | null;
    const commentInput = document.getElementById("comment") as HTMLTextAreaElement | null;

    if (nameInput) nameInput.value = "";
    if (phoneInput) phoneInput.value = "";
	if (npOfficeInput) npOfficeInput.value = "";
    if (addressInput) addressInput.value = "";
    if (commentInput) commentInput.value = "";
	
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <main className="shop-page">
      <div className="shop-shell">
        <header className="topbar">
		<nav className="quick-nav">
          <a href="#catalog">Каталог</a>
		  <a href="#how-order">Як замовити</a>
          <a href="#benefits">Переваги</a>
          <a href="#about">Про нас</a>
          <a href="#delivery">Доставка</a>
          <a href="#contacts">Контакти</a>
        </nav>
          <div>
            <div className="topbar-city">{SHOP.city}</div>
            <h1 className="topbar-title">Горіховий клуб</h1>
            <p className="topbar-subtitle">
              Свіжі горіхи та сухофрукти з доставкою по Україні
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
				  <div className="hero-mini">Доставка "Новою поштою" по Україні</div>
				</div>
			  </div>

			  <div className="hero-text">
				<h2>Чисті горіхи та сухофрукти для здорового харчування</h2>
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

        </section>
		
		<section className="how-order-section" id="how-order">
		  <div className="info-block">
			<div className="section-kicker">Як це працює</div>
			<h2 className="section-title">Як замовити</h2>

			<div className="how-order-grid">
			  <div className="how-order-card">
				<div className="how-order-step">1</div>
				<h3>Оберіть товар</h3>
				<p>Гортайте каталог і додавайте потрібні позиції до кошика.</p>
			  </div>

			  <div className="how-order-card">
				<div className="how-order-step">2</div>
				<h3>Налаштуйте вагу</h3>
				<p>Додавайте по 50г або 100г та збирайте саме ту вагу, яка вам потрібна.</p>
			  </div>

			  <div className="how-order-card">
				<div className="how-order-step">3</div>
				<h3>Оформіть замовлення</h3>
				<p>Заповніть форму, а ми підтвердимо замовлення та підготуємо відправку.</p>
			  </div>
			</div>
		  </div>
		</section>

        {loading ? (
          <div className="loading-box">Завантаження каталогу...</div>
        ) : null}

        <section className="catalog-grid">
          {visible.map((p) => {
            const currentPack = selectedPacks[p.id] || 100;
			const packPrice = priceForPack(p.price100, currentPack);
			const inCart = cart.find((i) => i.id === p.id);

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
				  <div className="product-desc">{p.description}</div>
				  
				  <div className="card-packs">
					{SHOP.packs.map((g) => {
					  const currentPack = selectedPacks[p.id] || 100;

					  return (
						<button
						  key={g}
						  onClick={() =>
							setSelectedPacks((prev) => ({
							  ...prev,
							  [p.id]: g,
							}))
						  }
						  className={`card-pack-btn ${currentPack === g ? "active" : ""}`}
						  type="button"
						>
						  {g}г
						</button>
					  );
					})}
				  </div>
                  
                  <div className="product-price-main">{packPrice} грн</div>
                  <div className="product-price-sub">
                    Ціна за 100г: {p.price100} грн / 100г
                  </div>

                  <div className="product-actions">
                    <button
                      onClick={() => inCart && remove(inCart)}
                      className="qty-btn"
                      type="button"
                    >
                      −
                    </button>

                    <div className="qty-num">{inCart?.pack || 0}</div>

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

        <section className="summary-card" id="summary">
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
		  
		  {subtotal > 0 && subtotal < SHOP.delivery.freeFrom ? (
		    <div className="free-delivery-note">
			  Додай ще <b>{SHOP.delivery.freeFrom - subtotal} грн</b>, щоб отримати
			  безкоштовну доставку Новою поштою
			</div>
          ) : null}			

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
              <span>
			    Доставка {delivery === 0 ? "(безкоштовно)" : "(Нова пошта)"}
			  </span>
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
		  {orderSuccess ? (
            <div className="success-box">
              <div className="success-title">Дякуємо за замовлення!</div>
              <div className="success-text">
                Ми отримали вашу заявку та зв’яжемося з вами найближчим часом.
              </div>
            </div>
          ) : null}

          <div className="checkout-grid">
            <input id="name" placeholder="Ім'я" className="checkout-input" />
            <input id="phone" placeholder="Телефон" className="checkout-input" />
			
			<input
			  id="npOffice"
			  placeholder="Відділення / поштомат Нової Пошти"
			  className="checkout-input"
			/>
			
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
			
			  <input
			    id="company"
				name="company"
				type="text"
				autoComplete="off"
				tabIndex={-1}
				className="Honeypot-input"
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
			  <h3>Чисті та відбірні горіхи</h3>
			  <p>Без пилу, сміття. Перевіряємо кожну партію перед відправкою - отримуєш якісний продукт.</p>
		    </div>

		    <div className="benefit-card">
			  <div className="benefit-icon">🚚</div>
			  <h3>Доставка на наступний день</h3>
			  <p>Ми якісно збираємо замовлення. Відправка Новою поштою вже наступного дня.</p>
		    </div>

		    <div className="benefit-card">
			  <div className="benefit-icon">⚖️</div>
			  <h3>Міксуй як хочеш - від 50г</h3>
			  <p>Обирай будь-які продукти та формуй свою поцію. Без переплат і зайвих залишків.</p>
		    </div>

		    <div className="benefit-card">
			  <div className="benefit-icon">💸</div>
			  <h3>Вигідно брати більше</h3>
			  <p>Від 800 грн - 5%, від 1000 грн - 10%, від 1500 грн - 15%. Чим більше обираєш - тим приємніша ціна.</p>
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
			  	Ми — про натуральність, якість і любов до своєї справи 🌿
				Наші горіхи та сухофрукти — це не просто товар, а ретельно відібраний продукт, який ми самі обираємо для себе та своїх близьких.

				Ми співпрацюємо тільки з перевіреними постачальниками, щоб ви отримували максимально чистий, свіжий і корисний продукт. Кожну партію ми відбираємо вручну, очищаємо та перевіряємо — без пилу, сміття і випадкових домішок.

				Для нас важливо, щоб їжа була екологічною, натуральною і безпечною.
				Без компромісів. Без “як вийде”. Тільки найкраще.

				Ми дійсно любимо те, що робимо — і хочемо, щоб ви це відчули з першого замовлення 💛
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
			    <li>Доставка по Україні "Новою поштою"</li>
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
			    Замовляли кеш'ю і мігдаль. Сподобалось, що реально чисті без пилу і сміття.
			    Брав 200 г на пробу, тепер буду брати більше.
			  </p>
			  <div className="review-author">Олег, Дніпро</div>
		    </div>

		    <div className="review-card">
			  <div className="review-stars">★★★★★</div>
			  <p>
			    Дуже зручно, що можна міксувати різні позиції.
			    Замовила потроху всього для дітей, зайшло!
			  </p>
			  <div className="review-author">Іріна, Київ</div>
		    </div>
            
			<div className="review-card">
			  <div className="review-stars">★★★★★</div>
			  <p>
			    Беру на роботу як перекуси. Немає відчуття "старого", як часто буває.
			    
			  </p>
			  <div className="review-author">Сергій, Харків</div>
		    </div>
			
			<div className="review-card">
			  <div className="review-stars">★★★★★</div>
			  <p>
			    Сподобалось, що одразу видно суму і знижку.
			    Без сюрпризів при оформленні.
			  </p>
			  <div className="review-author">Аріна, Полтав</div>
		    </div>
			
		    <div className="review-card">
			  <div className="review-stars">★★★★</div>
			  <p>
			    Все ок, але доставка не в той же день.
			    Зате якість норм і все акуратно запаковано.
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
		    <div className="footer-text">Свіжі горіхи та сухофрукти з доставкою по Україні</div>
		  </div>

		  <div className="footer-links">
		    <a href="#catalog">Каталог</a>
		    <a href="#how-order">Як замовити</a>
            <a href="#benefits">Переваги</a>
            <a href="#about">Про нас</a>
            <a href="#delivery">Доставка</a>
            <a href="#contacts">Контакти</a>
		  </div>
	    </div>
	  </footer>
	  
      <div className="sticky-orderbar">
        <div>
          <div className="sticky-orderbar-top">У кошику</div>
          <div className="sticky-orderbar-total">{subtotal} грн</div>
        </div>
		
	    <button
          className={`sticky-orderbar-btn ${cart.length === 0 ? "disabled" : ""}`}
		  disabled={cart.length === 0}
          onClick={() => {
			if (cart.length === 0) return;
			
            const el = document.getElementById("summary");
            el?.scrollIntoView({ behavior: "smooth" });
          }}
        >
		  {cart.length === 0 ? "Оберіть товари" : "Замовити"}
        </button>
      </div>
	  
	  {showFloating && (
	    <>
	      <a href="tel:+380660653477" className="call-btn">
	        📞
	      </a>

          <button
		    className="scroll-top-btn"
		    onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
		    type="button"
	      >
	        ↑
	      </button>
		</>  
	  )}
    </main>
  );
}
