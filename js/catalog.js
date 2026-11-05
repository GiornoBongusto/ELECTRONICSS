/* ============================================================
   ELECTRONICSS — каталог: категория, поиск, фильтры, сортировка
   ============================================================ */

(function () {
    'use strict';

    var grid = document.querySelector('[data-catalog-grid]');
    if (!grid) return;

    var CATEGORIES = {
        smartphones: {
            title: 'Смартфоны',
            desc: 'Флагманы и доступные модели Apple, Samsung и других брендов: от компактного iPhone 13 до Samsung Galaxy S25 Ultra.'
        },
        laptops: {
            title: 'Ноутбуки',
            desc: 'Мощные машины для работы, учёбы и творчества. Оригинальная техника Apple с гарантией магазина.'
        },
        tablets: {
            title: 'Планшеты',
            desc: 'Устройства для рисования, чтения, просмотра видео и работы в поездках.'
        },
        headphones: {
            title: 'Наушники',
            desc: 'TWS-модели с активным шумоподавлением и полноразмерные наушники для музыки и работы.'
        },
        consoles: {
            title: 'Игровые консоли',
            desc: 'PlayStation 5 и Xbox Series X — актуальные игровые приставки и аксессуары к ним.'
        },
        monitors: {
            title: 'Мониторы',
            desc: 'Игровые и рабочие мониторы с высокой частотой обновления и точной цветопередачей.'
        },
        accessories: {
            title: 'Аксессуары',
            desc: 'Умные часы, дроны и другие гаджеты, которые дополняют основную технику.'
        }
    };

    var params = new URLSearchParams(window.location.search);
    var category = (params.get('cat') || '').toLowerCase();
    var query = (params.get('q') || '').trim();

    if (!CATEGORIES[category]) category = '';

    var cards = Array.prototype.slice.call(grid.querySelectorAll('.product-card'));
    var titleEl = document.querySelector('[data-catalog-title]');
    var descEl = document.querySelector('[data-catalog-desc]');
    var crumbEl = document.querySelector('[data-catalog-crumb]');
    var countEl = document.querySelector('[data-catalog-count]');
    var emptyEl = document.querySelector('[data-catalog-empty]');
    var emptyTextEl = document.querySelector('[data-empty-text]');
    var form = document.querySelector('[data-filter-form]');
    var brandBox = document.querySelector('[data-filter-brands]');
    var minInput = document.querySelector('[data-filter-min]');
    var maxInput = document.querySelector('[data-filter-max]');
    var stockInput = document.querySelector('[data-filter-stock]');
    var sortSelect = document.querySelector('[data-filter-sort]');

    /* ---------- Подготовка данных карточек ---------- */

    cards.forEach(function (card) {
        var search = [
            card.getAttribute('data-name') || '',
            card.getAttribute('data-brand') || '',
            card.getAttribute('data-category') || '',
            card.getAttribute('data-keywords') || '',
            card.textContent || ''
        ].join(' ').toLowerCase();

        card.setAttribute('data-search', search);
        card.setAttribute('data-price-value', card.getAttribute('data-price') || '0');
    });

    /* ---------- Заголовок и хлебные крошки ---------- */

    if (category) {
        var info = CATEGORIES[category];
        if (titleEl) titleEl.textContent = info.title;
        if (descEl) descEl.textContent = info.desc;
        if (crumbEl) crumbEl.textContent = info.title;
        document.title = info.title + ' — каталог ELECTRONICSS';
    }

    if (query) {
        if (titleEl) titleEl.textContent = 'Поиск: «' + query + '»';
        if (descEl) descEl.textContent = 'Результаты поиска по запросу «' + query + '» в каталоге ELECTRONICSS.';
        if (crumbEl) crumbEl.textContent = 'Поиск';
        document.title = 'Поиск: ' + query + ' — ELECTRONICSS';

        var headerSearch = document.querySelector('.search input[name="q"]');
        if (headerSearch) headerSearch.value = query;
    }

    var categoryLinks = document.querySelectorAll('[data-category-link]');
    for (var l = 0; l < categoryLinks.length; l += 1) {
        var linkCategory = categoryLinks[l].getAttribute('data-category-link');
        if (linkCategory === (category || 'all')) {
            categoryLinks[l].setAttribute('aria-current', 'page');
        } else {
            categoryLinks[l].removeAttribute('aria-current');
        }
    }

    /* ---------- Бренды для фильтра ---------- */

    if (brandBox) {
        var brands = {};

        cards.forEach(function (card) {
            if (category && card.getAttribute('data-category') !== category) return;

            var brand = card.getAttribute('data-brand');
            if (!brand) return;
            brands[brand] = (brands[brand] || 0) + 1;
        });

        Object.keys(brands).sort(function (a, b) {
            return a.localeCompare(b, 'ru');
        }).forEach(function (brand) {
            var label = document.createElement('label');
            label.className = 'check';

            var input = document.createElement('input');
            input.type = 'checkbox';
            input.value = brand;
            input.setAttribute('data-filter-brand', '');

            var text = document.createElement('span');
            text.textContent = brand + ' (' + brands[brand] + ')';

            label.appendChild(input);
            label.appendChild(text);
            brandBox.appendChild(label);
        });
    }

    /* ---------- Фильтрация ---------- */

    function plural(number, forms) {
        var n = Math.abs(number) % 100;
        var n1 = n % 10;
        if (n > 10 && n < 20) return forms[2];
        if (n1 > 1 && n1 < 5) return forms[1];
        if (n1 === 1) return forms[0];
        return forms[2];
    }

    function checkedBrands() {
        var inputs = document.querySelectorAll('[data-filter-brand]:checked');
        var values = [];
        for (var i = 0; i < inputs.length; i += 1) {
            values.push(inputs[i].value);
        }
        return values;
    }

    function parseNumber(value) {
        var number = parseInt(String(value).replace(/\s/g, ''), 10);
        return isNaN(number) ? null : number;
    }

    function applyFilters() {
        var brandsSelected = checkedBrands();
        var min = minInput ? parseNumber(minInput.value) : null;
        var max = maxInput ? parseNumber(maxInput.value) : null;
        var onlyInStock = stockInput ? stockInput.checked : false;
        var sort = sortSelect ? sortSelect.value : 'popular';
        var normalizedQuery = query.toLowerCase();

        var visible = [];

        cards.forEach(function (card) {
            var price = parseInt(card.getAttribute('data-price'), 10) || 0;
            var matches = true;

            if (category && card.getAttribute('data-category') !== category) matches = false;

            if (matches && normalizedQuery && (card.getAttribute('data-search') || '').indexOf(normalizedQuery) === -1) {
                matches = false;
            }

            if (matches && brandsSelected.length && brandsSelected.indexOf(card.getAttribute('data-brand')) === -1) {
                matches = false;
            }

            if (matches && min !== null && price < min) matches = false;
            if (matches && max !== null && max > 0 && price > max) matches = false;

            if (matches && onlyInStock && card.getAttribute('data-stock') !== '1') matches = false;

            card.style.display = matches ? '' : 'none';

            if (matches) visible.push(card);
        });

        if (sort === 'price-asc') {
            visible.sort(function (a, b) {
                return parseInt(a.getAttribute('data-price'), 10) - parseInt(b.getAttribute('data-price'), 10);
            });
        } else if (sort === 'price-desc') {
            visible.sort(function (a, b) {
                return parseInt(b.getAttribute('data-price'), 10) - parseInt(a.getAttribute('data-price'), 10);
            });
        } else if (sort === 'name') {
            visible.sort(function (a, b) {
                return (a.getAttribute('data-name') || '').localeCompare(b.getAttribute('data-name') || '', 'ru');
            });
        }

        visible.forEach(function (card) {
            grid.appendChild(card);
        });

        if (countEl) {
            countEl.textContent = visible.length + ' ' + plural(visible.length, ['товар', 'товара', 'товаров']);
        }

        if (emptyEl) {
            emptyEl.classList.toggle('is-visible', visible.length === 0);
        }

        if (emptyTextEl && visible.length === 0) {
            emptyTextEl.textContent = query
                ? 'По запросу «' + query + '» ничего не найдено. Попробуйте изменить запрос или сбросить фильтры.'
                : 'В этой категории пока нет товаров с выбранными параметрами. Попробуйте сбросить фильтры.';
        }
    }

    /* ---------- События ---------- */

    if (form) {
        form.addEventListener('submit', function (event) {
            event.preventDefault();
            applyFilters();
        });

        form.addEventListener('change', function (event) {
            if (event.target.matches('[data-filter-brand], [data-filter-stock]')) {
                applyFilters();
            }
        });

        form.addEventListener('reset', function () {
            window.setTimeout(applyFilters, 0);
        });
    }

    if (minInput) {
        var timer = null;
        minInput.addEventListener('input', function () {
            window.clearTimeout(timer);
            timer = window.setTimeout(applyFilters, 250);
        });
    }

    if (maxInput) {
        var timer2 = null;
        maxInput.addEventListener('input', function () {
            window.clearTimeout(timer2);
            timer2 = window.setTimeout(applyFilters, 250);
        });
    }

    if (sortSelect) {
        sortSelect.addEventListener('change', applyFilters);
    }

    var resetButton = document.querySelector('[data-filter-reset]');
    if (resetButton) {
        resetButton.addEventListener('click', function () {
            window.setTimeout(applyFilters, 0);
        });
    }

    applyFilters();
})();
