/* ============================================================
   ELECTRONICSS — общие элементы: галерея, количество, формы
   ============================================================ */

(function () {
    'use strict';

    /* ---------- Галерея товара ---------- */

    var gallery = document.querySelector('[data-gallery]');
    if (gallery) {
        var mainImage = gallery.querySelector('[data-gallery-main]');
        var thumbs = gallery.querySelectorAll('[data-gallery-thumb]');
        var colorButtons = document.querySelectorAll('[data-color-image]');
        var colorName = document.querySelector('[data-color-name]');

        function activateThumb(src) {
            for (var j = 0; j < thumbs.length; j += 1) {
                var isActive = thumbs[j].getAttribute('data-full') === src;
                thumbs[j].classList.toggle('is-active', isActive);
                thumbs[j].setAttribute('aria-pressed', isActive ? 'true' : 'false');
            }
        }

        for (var t = 0; t < thumbs.length; t += 1) {
            thumbs[t].addEventListener('click', function () {
                var src = this.getAttribute('data-full');
                if (!src || !mainImage) return;
                mainImage.src = src;
                mainImage.alt = this.getAttribute('data-alt') || mainImage.alt;
                activateThumb(src);
            });
        }

        for (var c = 0; c < colorButtons.length; c += 1) {
            colorButtons[c].addEventListener('click', function () {
                var src = this.getAttribute('data-color-image');
                var name = this.getAttribute('data-color-name');

                for (var k = 0; k < colorButtons.length; k += 1) {
                    colorButtons[k].classList.toggle('is-active', colorButtons[k] === this);
                    colorButtons[k].setAttribute('aria-pressed', colorButtons[k] === this ? 'true' : 'false');
                }

                if (src && mainImage) {
                    mainImage.src = src;
                    activateThumb(src);
                }
                if (name && colorName) {
                    colorName.textContent = name;
                }

                /* Чтобы в корзину попало выбранное фото и цвет. */
                var addButton = document.querySelector('.product-actions [data-add-to-cart]');
                var meta = this.getAttribute('data-color-meta');
                if (addButton && src) {
                    addButton.setAttribute('data-image', src);
                }
                if (addButton && meta) {
                    addButton.setAttribute('data-meta', meta);
                }
            });
        }
    }

    /* ---------- Счётчик количества ---------- */

    document.addEventListener('click', function (event) {
        var step = event.target.closest('[data-step]');
        if (!step) return;

        var box = step.closest('[data-qty-box]');
        if (!box) return;

        var input = box.querySelector('input');
        if (!input) return;

        var min = parseInt(input.getAttribute('min'), 10) || 1;
        var max = parseInt(input.getAttribute('max'), 10) || 99;
        var value = parseInt(input.value, 10) || min;
        var next = value + parseInt(step.getAttribute('data-step'), 10);

        input.value = String(Math.min(max, Math.max(min, next)));
    });

    document.addEventListener('change', function (event) {
        var input = event.target.closest('[data-qty-box] input');
        if (!input) return;

        var min = parseInt(input.getAttribute('min'), 10) || 1;
        var max = parseInt(input.getAttribute('max'), 10) || 99;
        var value = parseInt(input.value, 10);

        if (isNaN(value)) value = min;
        input.value = String(Math.min(max, Math.max(min, value)));
    });

    /* ---------- Валидация форм ---------- */

    var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-zA-Zа-яА-Я]{2,}$/;

    function clearErrors(form) {
        var errors = form.querySelectorAll('.field-error');
        for (var i = 0; i < errors.length; i += 1) {
            errors[i].parentNode.removeChild(errors[i]);
        }

        var fields = form.querySelectorAll('[aria-invalid="true"]');
        for (var j = 0; j < fields.length; j += 1) {
            fields[j].removeAttribute('aria-invalid');
        }
    }

    function setError(field, message) {
        field.setAttribute('aria-invalid', 'true');

        var box = field.closest('.field') || field.parentNode;
        var error = document.createElement('span');
        error.className = 'field-error';
        error.textContent = message;
        error.setAttribute('role', 'alert');
        box.appendChild(error);
    }

    function validateForm(form) {
        clearErrors(form);

        var controls = form.querySelectorAll('input, textarea, select');
        var firstInvalid = null;

        for (var i = 0; i < controls.length; i += 1) {
            var field = controls[i];
            var type = (field.getAttribute('type') || '').toLowerCase();
            var value = String(field.value || '').trim();
            var message = '';

            if (field.hasAttribute('required') && type === 'checkbox' && !field.checked) {
                message = 'Отметьте согласие на обработку данных';
            } else if (field.hasAttribute('required') && type !== 'checkbox' && !value) {
                if (type === 'tel') {
                    message = 'Укажите номер телефона';
                } else if (type === 'email') {
                    message = 'Укажите адрес электронной почты';
                } else if (field.tagName === 'TEXTAREA') {
                    message = 'Напишите сообщение';
                } else {
                    message = 'Заполните это поле';
                }
            } else if (value && type === 'email' && !EMAIL_RE.test(value)) {
                message = 'Введите корректный e-mail, например ivan@mail.ru';
            } else if (value && type === 'tel') {
                var digits = value.replace(/\D/g, '');
                if (digits.length < 10) {
                    message = 'В номере телефона должно быть не меньше 10 цифр';
                }
            }

            if (message) {
                setError(field, message);
                if (!firstInvalid) firstInvalid = field;
            }
        }

        if (firstInvalid) {
            firstInvalid.focus();
            return false;
        }

        return true;
    }

    /* Убираем сообщение об ошибке, как только поле исправляют */
    document.addEventListener('input', function (event) {
        var field = event.target;
        if (!field.matches || !field.matches('[aria-invalid="true"]')) return;

        var box = field.closest('.field') || field.parentNode;
        var error = box ? box.querySelector('.field-error') : null;
        if (error) box.removeChild(error);
        field.removeAttribute('aria-invalid');
    });

    window.validateForm = validateForm;

    /* ---------- Формы с сообщением об успехе ---------- */

    var forms = document.querySelectorAll('form[data-form]');
    for (var f = 0; f < forms.length; f += 1) {
        forms[f].addEventListener('submit', function (event) {
            event.preventDefault();

            var form = event.currentTarget;
            if (!validateForm(form)) return;

            var box = form.closest('[data-form-box]') || form.parentNode;
            var success = box.querySelector('[data-form-success]');

            form.reset();

            if (success) {
                success.hidden = false;
                success.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        });
    }

    /* ---------- Год в подвале ---------- */

    var year = document.querySelector('[data-year]');
    if (year) {
        year.textContent = String(new Date().getFullYear());
    }
})();
