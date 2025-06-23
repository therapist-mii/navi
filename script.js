/**
 * @file mirainavi-script.js
 * @description Client-side JavaScript for the Mirai Navi Reservation Form.
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const reservationForm = document.getElementById('reservationForm');
    const requesterNameInput = document.getElementById('requesterNameInput');
    const agreeLightDiscountCheckbox = document.getElementById('agree-light-discount');
    const percentOffValueInput = document.getElementById('percent-off-value');
    const selectedList = document.getElementById('selectedList');
    const totalEl = document.getElementById('totalAmount');
    const totalAmountHidden = document.getElementById('totalAmountHidden');
    const copyBtn = document.getElementById('copyBtn');
    const clearBtn = document.getElementById('clearBtn');
    const lineSubmitBtn = document.getElementById('lineSubmitBtn');
    const validationMessageEl = document.getElementById('validation-message');

    // --- Helper Functions ---
    const formatPrice = (amount) => new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(amount);

    function recount() {
        let subtotal = 0;
        selectedList.innerHTML = '';

        // プラン料金
        const selectedPlan = document.querySelector('input[name="plan"]:checked');
        if (selectedPlan) {
            const planPrice = parseInt(selectedPlan.dataset.price, 10);
            const planText = selectedPlan.parentElement.textContent.trim();
            subtotal += planPrice;
            selectedList.innerHTML += `<li><span>${planText}</span><span>${formatPrice(planPrice)}</span></li>`;
        }

        // ライト割引
        if (agreeLightDiscountCheckbox.checked && selectedPlan) {
            const discountPrice = parseInt(selectedPlan.dataset.discountPrice, 10);
            subtotal += discountPrice; // discountPrice is negative
            selectedList.innerHTML += `<li><span>ライト割引</span><span>${formatPrice(discountPrice)}</span></li>`;
        }
        
        // クーポン割引
        let finalTotal = subtotal;
        const selectedCoupon = document.querySelector('input[name="coupon_type"]:checked')?.value;
        if (selectedCoupon === 'referral') {
            finalTotal -= 500;
            selectedList.innerHTML += `<li><span>紹介割引</span><span>${formatPrice(-500)}</span></li>`;
        } else if (selectedCoupon === 'percent') {
            const percent = parseInt(percentOffValueInput.value, 10) || 0;
            if (percent > 0 && percent < 100) {
                const discount = Math.round(subtotal * (percent / 100));
                finalTotal -= discount;
                selectedList.innerHTML += `<li><span>${percent}% OFF クーポン</span><span>${formatPrice(-discount)}</span></li>`;
            }
        }

        // コンビニ払い手数料
        if (document.getElementById('payment_method').value === 'コンビニ払い') {
            finalTotal += 220;
            selectedList.innerHTML += `<li><span>コンビニ払い手数料</span><span>${formatPrice(220)}</span></li>`;
        }

        totalEl.textContent = formatPrice(finalTotal);
        totalAmountHidden.value = finalTotal;
    }

    function validateForm() {
        let isValid = true;
        let firstErrorElement = null;
        validationMessageEl.textContent = '';
        validationMessageEl.style.display = 'none';
        document.querySelectorAll('.error-highlight').forEach(el => el.classList.remove('error-highlight'));

        const addError = (element, message) => {
            isValid = false;
            element.classList.add('error-highlight');
            if (!firstErrorElement) {
                firstErrorElement = element;
                validationMessageEl.textContent = message;
                validationMessageEl.style.display = 'block';
            }
        };

        if (!requesterNameInput.value.trim()) addError(requesterNameInput, 'お名前は必須です。');
        if (!document.querySelector('input[name="plan"]:checked')) addError(document.getElementById('plan-options'), 'プランを選択してください。');
        if (!document.querySelector('input[name="coupon_type"]:checked')) addError(document.getElementById('coupon-group'), 'クーポンの有無を選択してください。');
        if (!document.getElementById('payment_method').value) addError(document.getElementById('payment_method'), 'お支払い方法は必須です。');
        if (!document.querySelector('input[name="agree_all"]').checked) addError(document.querySelector('.agree-final'), 'ご確認事項への同意は必須です。');

        if (!isValid && firstErrorElement) {
            firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return isValid;
    }
    
    function resetForm() {
        reservationForm.reset();
        document.querySelectorAll('.error-highlight').forEach(el => el.classList.remove('error-highlight'));
        validationMessageEl.style.display = 'none';
        // デフォルト値を設定
        document.querySelector('input[name="plan"][value="monthly"]').checked = true;
        document.querySelector('input[name="coupon_type"][value="none"]').checked = true;
        agreeLightDiscountCheckbox.checked = false;
        recount();
    }
    
    function generateEstimateText() {
        recount(); // 最新の状態を反映
        let text = '【未来ナビお申し込み内容】\n\n';
        
        document.querySelectorAll('#selectedList li').forEach(li => {
            const itemText = li.querySelector('span:first-child').textContent.trim();
            const itemPrice = li.querySelector('span:last-child').textContent.trim();
            text += `${itemText}  ${itemPrice}\n`;
        });

        text += `\n--------------------------------\n`;
        text += `合計金額: ${document.getElementById('totalAmount').textContent.trim()}\n`;
        text += `--------------------------------\n\n`;

        const paymentSelect = document.getElementById('payment_method');
        const paymentMethod = paymentSelect.value ? paymentSelect.options[paymentSelect.selectedIndex].text : '未選択';
        text += `お支払い方法: ${paymentMethod}\n`;

        const remarks = document.getElementById('remarks').value.trim();
        if (remarks) {
            text += `備考:\n${remarks}\n`;
        }
        
        text += '\n上記の内容で申し込みます。';
        return text;
    }

    // --- Event Listeners ---
    reservationForm.addEventListener('change', recount);
    reservationForm.addEventListener('input', recount);
    clearBtn.addEventListener('click', resetForm);
    
    copyBtn.addEventListener('click', () => {
        if (!validateForm()) return;
        
        const estimateText = generateEstimateText();
        navigator.clipboard.writeText(estimateText).then(() => {
            alert('申込内容をコピーしました！');
        }).catch(err => {
            console.error('コピーに失敗しました: ', err);
            alert('コピーに失敗しました。お手数ですが、スクリーンショットを送信してください。');
        });
    });

    lineSubmitBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        
        const estimateText = generateEstimateText();
        navigator.clipboard.writeText(estimateText).then(() => {
            alert('申込内容をコピーしました。LINEに貼り付けて送信してください。');
            setTimeout(() => {
                window.open('https://line.me/ti/p/Kv76GQK_UI', '_blank');
            }, 300);
        }).catch(err => {
            console.error('コピーに失敗しました: ', err);
            alert('コピーに失敗しました。お手数ですが、スクリーンショットをLINEで送信してください。');
        });
    });
    
    // Initial setup
    resetForm();
});