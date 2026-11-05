/* ============================================================
   ELECTRONICSS — корзина на localStorage
   Работает на всех страницах: счётчик, добавление, хранение.
   ============================================================ */

(function () {
    'use strict';

    var STORAGE_KEY = 'electronicss_cart_v2';
    var MAX_QTY = 99;
    var memory = [];
    var toastTimer = null;

    /* localStorage может быть недоступен при открытии файла напрямую
       в некоторых браузерах — тогда используем sessionStorage/память. */
    var storage = (function () {
        try {
            var key = '__electronicss_test__';
            window.localStorage.setItem(key, '1');
            window.localStorage.removeItem(key);
            return window.localStorage;
        } catch (error) {
            try {
                var key2 = '__electronicss_test__';
                window.sessionStorage.setItem(key2, '1');
                window.sessionStorage.removeItem(key2);
                return window.sessionStorage;
            } catch (error2) {
                return null;
            }
        }
    })();

    function clampQty(value) {
        var qty = parseInt(value, 10);
        if (isNaN(qty)) qty = 1;
        return Math.min(MAX_QTY, Math.max(1, qty));
    }

    // Страницы лежат в pages/, поэтому пути к картинкам начинаются с ../img/.
    // В localStorage могли остаться старые записи "img/..." — исправляем их.
    function normalizeImage(value) {
        var src = String(value || '');
        return src.indexOf('img/') === 0 ? '../' + src : src;
    }

    function normalize(item) {
        if (!item || typeof item !== 'object') return null;
        var price = parseInt(item.price, 10);
        if (isNaN(price) || price < 0) return null;
        var name = String(item.name || '').trim();
        if (!name) return null;

        return {
            id: String(item.id || name.toLowerCase().replace(/\s+/g, '-')),
            name: name,
            price: price,
            qty: clampQty(item.qty),
            image: normalizeImage(item.image),
            meta: String(item.meta || '')
        };
    }

    function read() {
        if (!storage) return memory.slice();

        try {
            var raw = storage.getItem(STORAGE_KEY);
            if (!raw) return [];
            var data = JSON.parse(raw);
            if (!Array.isArray(data)) return [];
            return data.map(normalize).filter(Boolean);
        } catch (error) {
            return [];
        }
    }

    function updateBadges(animate) {
        var items = read();
        var count = 0;
        items.forEach(function (item) {
            count += item.qty;
        });

        var badges = document.querySelectorAll('[data-cart-count]');
        for (var i = 0; i < badges.length; i += 1) {
            badges[i].textContent = String(count);
            if (animate) {
                badges[i].classList.remove('is-bump');
                /* перезапуск CSS-анимации */
                void badges[i].offsetWidth;
                badges[i].classList.add('is-bump');
            }
        }
    }

    function write(items) {
        var clean = items.map(normalize).filter(Boolean);

        if (storage) {
            try {
                storage.setItem(STORAGE_KEY, JSON.stringify(clean));
            } catch (error) {
                memory = clean;
            }
        } else {
            memory = clean;
        }

        updateBadges(true);
        document.dispatchEvent(new CustomEvent('cart:change', { detail: clean }));
    }

    function showToast(message, linkHref, linkText) {
        var toast = document.getElementById('site-toast');

        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'site-toast';
            toast.className = 'toast';
            toast.setAttribute('role', 'status');
            toast.setAttribute('aria-live', 'polite');
            document.body.appendChild(toast);
        }

        toast.textContent = '';

        var dot = document.createElement('span');
        dot.className = 'toast__dot';
        toast.appendChild(dot);

        var text = document.createElement('span');
        text.textContent = message;
        toast.appendChild(text);

        if (linkHref) {
            var link = document.createElement('a');
            link.className = 'toast__link';
            link.href = linkHref;
            link.textContent = linkText || 'Открыть';
            toast.appendChild(link);
        }

        toast.classList.add('is-visible');
        window.clearTimeout(toastTimer);
        toastTimer = window.setTimeout(function () {
            toast.classList.remove('is-visible');
        }, 3600);
    }

    function add(product, qty) {
        var items = read();
        var amount = clampQty(qty);
        var id = String(product.id || product.name);
        var found = null;

        for (var i = 0; i < items.length; i += 1) {
            if (items[i].id === id) {
                found = items[i];
                break;
            }
        }

        if (found) {
            found.qty = clampQty(found.qty + amount);
        } else {
            var item = normalize({
                id: id,
                name: product.name,
                price: product.price,
                image: product.image,
                meta: product.meta,
                qty: amount
            });
            if (!item) return;
            items.push(item);
        }

        write(items);
        showToast('«' + product.name + '» добавлен в корзину', 'cart.html', 'В корзину');
    }

    function setQty(id, qty) {
        var items = read();
        var next = clampQty(qty);

        for (var i = 0; i < items.length; i += 1) {
            if (items[i].id === id) {
                items[i].qty = next;
                break;
            }
        }

        write(items);
    }

    function remove(id) {
        var items = read().filter(function (item) {
            return item.id !== id;
        });
        write(items);
        showToast('Товар удалён из корзины');
    }

    function clear() {
        write([]);
    }

    function count(items) {
        var list = items || read();
        return list.reduce(function (sum, item) {
            return sum + item.qty;
        }, 0);
    }

    function subtotal(items) {
        var list = items || read();
        return list.reduce(function (sum, item) {
            return sum + item.price * item.qty;
        }, 0);
    }

    /* Доставка по умолчанию: 500 ₽, бесплатно от 50 000 ₽. */
    function delivery(items) {
        var list = items || read();
        if (!list.length) return 0;
        return subtotal(list) >= 50000 ? 0 : 500;
    }

    function total(items) {
        var list = items || read();
        return subtotal(list) + delivery(list);
    }

    function formatPrice(value) {
        var number = Math.round(Number(value) || 0);
        return new Intl.NumberFormat('ru-RU').format(number) + ' \u20BD';
    }

    /* Кнопки «Купить» на любой странице */
    document.addEventListener('click', function (event) {
        var button = event.target.closest('[data-add-to-cart]');
        if (!button) return;

        event.preventDefault();

        var qty = 1;
        var qtySelector = button.getAttribute('data-qty-input');
        if (qtySelector) {
            var field = document.querySelector(qtySelector);
            if (field) qty = clampQty(field.value);
        }

        add({
            id: button.getAttribute('data-id'),
            name: button.getAttribute('data-name'),
            price: button.getAttribute('data-price'),
            image: button.getAttribute('data-image'),
            meta: button.getAttribute('data-meta')
        }, qty);
    });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            updateBadges(false);
        });
    } else {
        updateBadges(false);
    }

    window.Cart = {
        read: read,
        add: add,
        setQty: setQty,
        remove: remove,
        clear: clear,
        count: count,
        subtotal: subtotal,
        delivery: delivery,
        total: total,
        formatPrice: formatPrice,
        updateBadges: updateBadges,
        showToast: showToast,
        storageAvailable: Boolean(storage)
    };
})();
