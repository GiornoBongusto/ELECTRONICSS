/* ============================================================
   ELECTRONICSS — страница корзины
   ============================================================ */

(function () {
    'use strict';

    var page = document.querySelector('[data-cart-page]');
    if (!page || !window.Cart) return;

    var list = page.querySelector('[data-cart-list]');
    var content = page.querySelector('[data-cart-content]');
    var empty = page.querySelector('[data-cart-empty]');
    var checkout = page.querySelector('[data-checkout]');
    var form = page.querySelector('[data-checkout-form]');
    var success = page.querySelector('[data-order-success]');
    var deliverySelect = page.querySelector('[data-delivery-select]');
    var countEl = page.querySelector('[data-summary-count]');
    var subtotalEl = page.querySelector('[data-summary-subtotal]');
    var deliveryEl = page.querySelector('[data-summary-delivery]');
    var totalEl = page.querySelector('[data-summary-total]');
    var clearButton = page.querySelector('[data-cart-clear]');

    function plural(number, forms) {
        var n = Math.abs(number) % 100;
        var n1 = n % 10;
        if (n > 10 && n < 20) return forms[2];
        if (n1 > 1 && n1 < 5) return forms[1];
        if (n1 === 1) return forms[0];
        return forms[2];
    }

    function deliveryCost(items) {
        if (!items.length) return 0;
        var method = deliverySelect ? deliverySelect.value : 'courier';

        if (method === 'pickup') return 0;
        if (method === 'express') return 900;

        return Cart.subtotal(items) >= 50000 ? 0 : 500;
    }

    /* Соответствие товара в корзине и его страницы в каталоге. */
    var PRODUCT_URLS = {
        'iphone-13': 'product.html',
        'iphone-15': 'product-iphone-15.html',
        'samsung-s25': 'product-samsung-s25.html',
        'samsung-s25-ultra': 'product-samsung-s25-ultra.html',
        'macbook-pro-16': 'product-macbook-pro-16.html',
        'ipad-air': 'product-ipad-air.html',
        'airpods-pro-2': 'product-airpods-pro-2.html',
        'playstation-5-slim': 'product-playstation-5.html',
        'xbox-series-x': 'product-xbox-series-x.html',
        'monitor-ardor': 'product-monitor-ardor.html',
        'apple-watch-9': 'product-apple-watch-9.html',
        'dji-mini-4-pro': 'product-dji-mini-4-pro.html'
    };

    function productUrl(item) {
        return PRODUCT_URLS[item.id] || '';
    }

    function createItem(item) {
        var article = document.createElement('article');
        article.className = 'cart-item';
        article.setAttribute('data-id', item.id);

        var url = productUrl(item);

        var imageBox = document.createElement(url ? 'a' : 'div');
        imageBox.className = 'cart-item__img';
        if (url) {
            imageBox.href = url;
            imageBox.setAttribute('aria-label', 'Открыть карточку «' + item.name + '»');
        }

        var image = document.createElement('img');
        image.src = item.image;
        image.alt = item.name;
        imageBox.appendChild(image);

        var body = document.createElement('div');
        body.className = 'cart-item__body';

        var title = document.createElement('h3');
        if (url) {
            var titleLink = document.createElement('a');
            titleLink.href = url;
            titleLink.textContent = item.name;
            title.appendChild(titleLink);
        } else {
            title.textContent = item.name;
        }
        body.appendChild(title);

        if (item.meta) {
            var meta = document.createElement('p');
            meta.className = 'cart-item__meta';
            meta.textContent = item.meta;
            body.appendChild(meta);
        }

        var remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'cart-item__remove';
        remove.setAttribute('data-cart-remove', '');
        remove.textContent = 'Удалить';
        body.appendChild(remove);

        var side = document.createElement('div');
        side.className = 'cart-item__side';

        var qty = document.createElement('div');
        qty.className = 'qty';
        qty.setAttribute('data-qty-box', '');

        var minus = document.createElement('button');
        minus.type = 'button';
        minus.setAttribute('data-step', '-1');
        minus.setAttribute('aria-label', 'Уменьшить количество');
        minus.textContent = '−';

        var input = document.createElement('input');
        input.type = 'number';
        input.min = '1';
        input.max = '99';
        input.value = String(item.qty);
        input.setAttribute('data-cart-qty', '');
        input.setAttribute('aria-label', 'Количество товара');

        var plus = document.createElement('button');
        plus.type = 'button';
        plus.setAttribute('data-step', '1');
        plus.setAttribute('aria-label', 'Увеличить количество');
        plus.textContent = '+';

        qty.appendChild(minus);
        qty.appendChild(input);
        qty.appendChild(plus);

        var sum = document.createElement('div');
        sum.className = 'cart-item__sum';
        sum.textContent = Cart.formatPrice(item.price * item.qty);

        side.appendChild(qty);
        side.appendChild(sum);

        article.appendChild(imageBox);
        article.appendChild(body);
        article.appendChild(side);

        return article;
    }

    function render() {
        var items = Cart.read();
        var subtotal = Cart.subtotal(items);
        var delivery = deliveryCost(items);
        var count = Cart.count(items);

        list.textContent = '';
        items.forEach(function (item) {
            list.appendChild(createItem(item));
        });

        var isEmpty = items.length === 0;

        if (content) content.hidden = isEmpty;
        if (empty) empty.classList.toggle('is-visible', isEmpty);
        if (checkout) checkout.hidden = isEmpty;

        if (isEmpty && success) {
            /* Сообщение об оформленном заказе остаётся видимым. */
        } else if (success) {
            success.hidden = true;
        }

        if (countEl) {
            countEl.textContent = count + ' ' + plural(count, ['товар', 'товара', 'товаров']);
        }
        if (subtotalEl) subtotalEl.textContent = Cart.formatPrice(subtotal);
        if (deliveryEl) deliveryEl.textContent = delivery === 0 ? 'Бесплатно' : Cart.formatPrice(delivery);
        if (totalEl) totalEl.textContent = Cart.formatPrice(subtotal + delivery);
    }

    list.addEventListener('click', function (event) {
        var item = event.target.closest('.cart-item');
        if (!item) return;

        var id = item.getAttribute('data-id');

        if (event.target.closest('[data-cart-remove]')) {
            Cart.remove(id);
            return;
        }

        var step = event.target.closest('[data-step]');
        if (step) {
            var input = item.querySelector('[data-cart-qty]');
            if (!input) return;

            var delta = parseInt(step.getAttribute('data-step'), 10);
            var current = parseInt(input.value, 10) || 1;

            /* Если товар один и нажали «−», сразу удаляем его из корзины. */
            if (delta < 0 && current <= 1) {
                Cart.remove(id);
                return;
            }

            Cart.setQty(id, current + delta);
        }
    });

    list.addEventListener('change', function (event) {
        var input = event.target.closest('[data-cart-qty]');
        if (!input) return;

        var item = input.closest('.cart-item');
        if (!item) return;

        Cart.setQty(item.getAttribute('data-id'), input.value);
    });

    if (deliverySelect) {
        deliverySelect.addEventListener('change', render);
    }

    if (clearButton) {
        clearButton.addEventListener('click', function () {
            if (window.confirm('Удалить все товары из корзины?')) {
                Cart.clear();
            }
        });
    }

    if (form) {
        form.addEventListener('submit', function (event) {
            event.preventDefault();

            /* Сначала проверяем обязательные поля и формат e-mail/телефона. */
            if (window.validateForm && !window.validateForm(form)) return;

            var items = Cart.read();
            if (!items.length) return;

            var sum = Cart.subtotal(items) + deliveryCost(items);
            var orderNumber = 'E-' + String(Date.now()).slice(-6);

            Cart.clear();
            form.reset();

            if (success) {
                success.textContent = 'Заказ №' + orderNumber + ' оформлен на сумму ' + Cart.formatPrice(sum) +
                    '. Мы свяжемся с вами в течение 15 минут, чтобы подтвердить детали доставки.';
                success.hidden = false;
                success.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        });
    }

    document.addEventListener('cart:change', render);
    render();
})();
