// EMYRIS OMS - Admin Logic
const API_BASE = '/api';
let allProducts = [];
let currentProductBatches = [];
let companyProfile = {};
const safeGetVal = (id) => {
    const el = document.getElementById(id);
    return el ? el.value.trim() : '';
};
const safeSetVal = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.value = (val !== undefined && val !== null) ? val : '';
};
const safeSetHTML = (id, html) => {
    const el = document.getElementById(id);
    if (el) el.innerText = (html !== undefined && html !== null) ? String(html) : '';
};

// Premium Global Glassmorphic Toast Notification System
function showToast(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.style.position = 'fixed';
        container.style.top = '24px';
        container.style.right = '24px';
        container.style.zIndex = '999999';
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.gap = '10px';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.style.padding = '12px 24px';
    toast.style.borderRadius = '12px';
    toast.style.backdropFilter = 'blur(20px)';
    toast.style.border = '1px solid rgba(255, 255, 255, 0.1)';
    toast.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.4)';
    toast.style.color = '#fff';
    toast.style.fontSize = '0.85rem';
    toast.style.fontWeight = '700';
    toast.style.display = 'flex';
    toast.style.alignItems = 'center';
    toast.style.gap = '10px';
    toast.style.transform = 'translateX(100px)';
    toast.style.opacity = '0';
    toast.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';

    let iconClass = 'fa-info-circle';
    let bgColor = 'rgba(30, 41, 59, 0.9)'; 
    let borderColor = 'rgba(99, 102, 241, 0.3)'; 

    if (type === 'success') {
        iconClass = 'fa-check-circle';
        bgColor = 'rgba(16, 185, 129, 0.9)'; 
        borderColor = 'rgba(16, 185, 129, 0.4)';
    } else if (type === 'warning') {
        iconClass = 'fa-exclamation-triangle';
        bgColor = 'rgba(245, 158, 11, 0.9)'; 
        borderColor = 'rgba(245, 158, 11, 0.4)';
    } else if (type === 'danger' || type === 'error') {
        iconClass = 'fa-exclamation-circle';
        bgColor = 'rgba(239, 68, 68, 0.9)'; 
        borderColor = 'rgba(239, 68, 68, 0.4)';
    } else if (type === 'info') {
        iconClass = 'fa-info-circle';
        bgColor = 'rgba(99, 102, 241, 0.9)'; 
        borderColor = 'rgba(99, 102, 241, 0.4)';
    }

    toast.style.background = bgColor;
    toast.style.borderColor = borderColor;
    toast.innerHTML = `<i class="fas ${iconClass}" style="font-size: 1rem;"></i> <span>${message}</span>`;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.transform = 'translateX(0)';
        toast.style.opacity = '1';
    }, 50);

    setTimeout(() => {
        toast.style.transform = 'translateX(100px)';
        toast.style.opacity = '0';
        setTimeout(() => {
            toast.remove();
            if (container.children.length === 0) {
                container.remove();
            }
        }, 400);
    }, 4000);
}

function toggleSidebar() {
    if (!window.matchMedia('(max-width: 1024px)').matches) return; 
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    const isOpen = sidebar && sidebar.classList.contains('show');
    if (sidebar) sidebar.classList.toggle('show', !isOpen);
    if (overlay) overlay.classList.toggle('show', !isOpen);
}

function closeSidebar() {
    if (window.innerWidth > 1024) return;
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    if (sidebar) sidebar.classList.remove('show');
    if (overlay) overlay.classList.remove('show');
}

function formatMMYY(el) {
    let v = el.value.replace(/\D/g, '');
    if (v.length > 2) {
        el.value = v.slice(0, 2) + '-' + v.slice(2, 4);
    } else {
        el.value = v;
    }
}

let currentPickerTarget = null;
let currentPickerYear = new Date().getFullYear();
let _pickerOutsideClickListener = null; // Track listener to prevent accumulation

function openMonthYearPicker(targetId) {
    currentPickerTarget = targetId;
    const modal = document.getElementById('monthYearPickerModal');
    const display = document.getElementById('picker-year-display');
    const input = document.getElementById(targetId);
    const currentVal = input?.value || '';
    
    if (currentVal && currentVal.includes('-')) {
        const parts = currentVal.split('-');
        if (parts[1].length === 2) currentPickerYear = 2000 + parseInt(parts[1]);
        else currentPickerYear = parseInt(parts[1]);
    } else {
        currentPickerYear = new Date().getFullYear();
    }
    
    // Position Picker near Input (use fixed positioning to match viewport coords)
    if (input) {
        const rect = input.getBoundingClientRect();
        const pickerHeight = 280;
        const spaceBelow = window.innerHeight - rect.bottom;
        
        if (spaceBelow < pickerHeight) {
            modal.style.top = (rect.top - pickerHeight - 10) + 'px';
        } else {
            modal.style.top = (rect.bottom + 5) + 'px';
        }
        modal.style.left = Math.min(rect.left, window.innerWidth - 300) + 'px';
        modal.style.position = 'fixed';
    }

    display.textContent = currentPickerYear;
    renderPickerMonths();
    modal.classList.remove('hidden');

    // Remove any stale listener before adding a new one
    if (_pickerOutsideClickListener) {
        document.removeEventListener('click', _pickerOutsideClickListener);
        _pickerOutsideClickListener = null;
    }

    // Add fresh outside-click listener after a tick
    setTimeout(() => {
        _pickerOutsideClickListener = (e) => {
            if (!modal.contains(e.target) && e.target !== input) {
                closeMonthYearPicker();
            }
        };
        document.addEventListener('click', _pickerOutsideClickListener);
    }, 50);
}

function renderPickerMonths() {
    const grid = document.getElementById('picker-month-grid');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const targetVal = document.getElementById(currentPickerTarget)?.value || '';
    let selMM = '';
    if (targetVal.includes('-')) selMM = targetVal.split('-')[0];

    grid.innerHTML = months.map((m, i) => {
        const mm = (i + 1).toString().padStart(2, '0');
        const isSelected = (selMM === mm && currentPickerYear === (targetVal.includes('-') ? (targetVal.split('-')[1].length === 2 ? 2000+parseInt(targetVal.split('-')[1]) : parseInt(targetVal.split('-')[1])) : -1));
        const isPast = currentPickerYear < currentYear || (currentPickerYear === currentYear && i < currentMonth);
        
        return `
            <button type="button" onclick="event.stopPropagation(); confirmMonthYearSelection('${mm}')" 
                style="padding: 10px 5px; border-radius: 8px; border: 1px solid ${isSelected ? 'var(--primary)' : 'rgba(255,255,255,0.08)'}; 
                background: ${isSelected ? 'var(--grad-primary)' : 'rgba(255,255,255,0.03)'}; 
                color: ${isSelected ? '#fff' : (isPast ? '#64748b' : '#e2e8f0')};
                font-weight: ${isSelected ? '800' : '500'}; cursor: pointer; transition: all 0.2s; font-size: 0.72rem;">
                ${m.toUpperCase()}
            </button>
        `;
    }).join('');
}

function changePickerYear(delta) {
    currentPickerYear += delta;
    document.getElementById('picker-year-display').textContent = currentPickerYear;
    renderPickerMonths();
}

function closeMonthYearPicker() {
    document.getElementById('monthYearPickerModal').classList.add('hidden');
    // Clean up the outside-click listener
    if (_pickerOutsideClickListener) {
        document.removeEventListener('click', _pickerOutsideClickListener);
        _pickerOutsideClickListener = null;
    }
}

function confirmMonthYearSelection(month) {
    if (currentPickerTarget) {
        const shortYear = currentPickerYear.toString().slice(-2);
        document.getElementById(currentPickerTarget).value = `${month}-${shortYear}`;
        
        // Trigger calculation if it's a return row
        if (currentPickerTarget.startsWith('return-exp-')) {
            calculateReturnTotals();
        }
    }
    closeMonthYearPicker();
}

function checkBatchStatus(expDate) {
    if (!expDate || expDate === 'N/A' || expDate === '-') return { status: 'ok', label: '' };
    
    let year, month;
    // Handle MM-YY, MM/YY or YYYY-MM
    if (expDate.includes('-')) {
        const parts = expDate.split('-');
        if (parts[0].length === 4) { // YYYY-MM
            year = Number(parts[0]);
            month = Number(parts[1]);
        } else { // MM-YY
            month = Number(parts[0]);
            year = Number(parts[1]) + 2000;
        }
    } else if (expDate.includes('/')) {
        const parts = expDate.split('/');
        month = Number(parts[0]);
        year = Number(parts[1]);
        if (year < 100) year += 2000;
    } else return { status: 'ok', label: '' };

    if (isNaN(year) || isNaN(month)) return { status: 'ok', label: '' };

    const exp = new Date(year, month - 1, 1);
    const today = new Date();
    const threeMonthsOut = new Date();
    threeMonthsOut.setMonth(today.getMonth() + 3);

    if (exp < today) return { status: 'expired', label: ' [EXPIRED]' };
    if (exp < threeMonthsOut) return { status: 'near', label: ' [⚠️ NEAR EXPIRY]' };
    return { status: 'ok', label: '' };
}

function renderProductBatches() {
    const tbody = document.getElementById('prod-batch-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    let totalQty = 0;
    
    if (currentProductBatches.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 1.5rem; color: rgba(255,255,255,0.3); font-style: italic;">No batches added yet.</td></tr>';
    } else {
        currentProductBatches.forEach((b, i) => {
            totalQty += Number(b.qtyAvailable || 0);
            tbody.innerHTML += `
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.05); transition: 0.2s;">
                    <td style="padding: 8px 12px; font-weight: 700; color: #fff;">${b.batchNo}</td>
                    <td style="padding: 8px 12px; text-align: center;">${b.expDate || '-'}</td>
                    <td style="padding: 8px 12px; text-align: right;">₹${Number(b.mrp||0).toFixed(2)}</td>
                    <td style="padding: 8px 12px; text-align: right;">₹${Number(b.pts||0).toFixed(2)}</td>
                    <td style="padding: 8px 12px; text-align: right;">₹${Number(b.ptr||0).toFixed(2)}</td>
                    <td style="padding: 8px 12px; text-align: right; color: var(--accent); font-weight: 700;">₹${Number(b.purchaseRate||0).toFixed(2)}</td>
                    <td style="padding: 8px 12px; text-align: center; font-weight: 800; color: var(--accent); background: rgba(16, 185, 129, 0.05);">${b.qtyAvailable}</td>
                    <td style="padding: 8px 12px; text-align: center;"><button type="button" class="btn btn-ghost" style="padding: 4px 8px; border-radius: 6px; color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3);" onclick="removeProductBatch(${i})">✓•</button></td>
                </tr>
            `;
        });
    }
    
    document.getElementById('prod-total-qty-display').textContent = totalQty;
    document.getElementById('prod-qty').value = totalQty;
}

function addProductBatch() {
    const bNo = document.getElementById('new-batch-no').value;
    if (!bNo) return alert('Batch Number is required');
    
    const bExp = document.getElementById('new-batch-exp').value;
    const bMrp = document.getElementById('new-batch-mrp').value;
    const bPts = document.getElementById('new-batch-pts').value;
    const bPtr = document.getElementById('new-batch-ptr').value;
    const bPur = document.getElementById('new-batch-purchase-rate').value;
    const bQty = document.getElementById('new-batch-qty').value;
    
    currentProductBatches.push({
        batchNo: bNo.toUpperCase(),
        expDate: bExp,
        mrp: Number(bMrp || document.getElementById('prod-mrp').value || 0),
        pts: Number(bPts || document.getElementById('prod-pts').value || 0),
        ptr: Number(bPtr || document.getElementById('prod-ptr').value || 0),
        purchaseRate: Number(bPur || document.getElementById('prod-purchase-rate').value || 0),
        qtyAvailable: Math.floor(Number(bQty || 0))
    });
    
    document.getElementById('new-batch-no').value = '';
    document.getElementById('new-batch-exp').value = '';
    document.getElementById('new-batch-mrp').value = '';
    document.getElementById('new-batch-pts').value = '';
    document.getElementById('new-batch-ptr').value = '';
    document.getElementById('new-batch-purchase-rate').value = '';
    document.getElementById('new-batch-qty').value = '';
    
    renderProductBatches();
}

function removeProductBatch(i) {
    currentProductBatches.splice(i, 1);
    renderProductBatches();
}
let allStockists = [];
let directSaleItems = []; 
let saleCharges = [];
let purchaseItems = [];
let purchaseCharges = [];
let isEditMode = false;
let editingInvoiceId = null;
let editingPurchaseId = null;
let allOrders = [];
let allInvoices = [];
let allPurchaseEntries = [];
let allNotes = [];
let currentNoteReason = 'ALL';
// companyProfile declared at top of file
let currentEditingNoteId = null; 
let allPayments = [];
let currentPaymentTypeFilter = 'RECEIPT';
let returnRowCounter = 0;

// --- INITIALIZATION ---
window.onload = async () => {
    if (sessionStorage.getItem('admin_logged') !== 'true') {
        document.getElementById('adminLoginOverlay').classList.remove('hidden');
        return;
    }

    // Show system active indicator
    const statusEl = document.getElementById('adminStatus');
    if (statusEl) statusEl.style.display = '';
    
    // Load all data sequentially to ensure dependencies are met
    try {
        await loadMasters();
        await loadProducts();
        await loadStockists();
        await loadOrders();
        await loadInvoices();
        await loadPurchaseEntries();
        await loadFinancialNotes();
        await loadPayments();
        await loadSettings();
        await refreshDashboard();
    } catch (e) {
        console.error("Critical Initialization Error:", e);
    }
};

async function loadSettings() {
    try {
        const res = await fetch(`${API_BASE}/admin/settings?t=${Date.now()}`);
        const data = await res.json();
        if (data) {
            companyProfile = data;
            renderSettings();
        }
    } catch (e) { console.error("Load settings fail", e); }
}

function renderSettings() {
    if (!companyProfile) return;
    const s = companyProfile;

    const safeSetCheck = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.checked = !!val;
    };

    // 1. Basic Info
    safeSetVal('set-name', s.name);
    safeSetVal('set-tollfree', s.tollFree);
    if (s.websites) {
        safeSetVal('set-web1', s.websites[0] || '');
        safeSetVal('set-web2', s.websites[1] || '');
    }
    if (s.emails) {
        safeSetVal('set-email1', s.emails[0] || '');
        safeSetVal('set-email2', s.emails[1] || '');
        safeSetVal('set-email3', s.emails[2] || '');
    }
    safeSetVal('set-phone', s.phones ? s.phones[0] : '');
    safeSetVal('set-address', s.address);
    safeSetVal('set-admin-email', s.adminEmail);

    // 2. Tax & Bank
    safeSetVal('set-gst-no', s.gstNo);
    safeSetVal('set-pan-no', s.panNo);
    safeSetVal('set-dl-no', s.dlNo);
    safeSetVal('set-fssai-no', s.fssaiNo);
    safeSetVal('set-bank-details', s.bankDetails);
    safeSetVal('set-upi-id', s.upiId);
    safeSetVal('set-bank-acc', s.bankAccountNo);
    safeSetVal('set-bank-ifsc', s.bankIfsc);
    safeSetVal('set-payment-due-days', s.paymentDueDays);
    safeSetVal('set-default-supply', s.defaultPlaceOfSupply);

    // 3. Terms
    safeSetVal('set-invoice-terms', s.invoiceTerms);
    safeSetVal('set-cn-terms', s.cnTerms);
    safeSetVal('set-dn-terms', s.dnTerms);
    safeSetVal('set-gst-rate', s.gstRate);
    safeSetCheck('set-invoice-bank-visible', s.invoiceBankVisible);
    safeSetCheck('set-cn-bank-visible', s.cnBankVisible);
    safeSetCheck('set-dn-bank-visible', s.dnBankVisible);

    // 4. Counters
    const c = s.documentCounters || {};
    const setC = (id, val) => { const el = document.getElementById(id); if(el) el.value = (val !== undefined && val !== null) ? val : ''; };
    
    setC('cnt-inv-pre', c.invoice?.prefix);
    setC('cnt-inv-next', c.invoice?.nextNumber);
    setC('cnt-pur-pre', c.purchase?.prefix);
    setC('cnt-pur-next', c.purchase?.nextNumber);
    setC('cnt-scn-pre', c.scn?.prefix || c.saleReturn?.prefix);
    setC('cnt-scn-next', c.scn?.nextNumber || c.saleReturn?.nextNumber);
    setC('cnt-pdn-pre', c.pdn?.prefix || c.purchaseReturn?.prefix);
    setC('cnt-pdn-next', c.pdn?.nextNumber || c.purchaseReturn?.nextNumber);
    setC('cnt-pdcn-pre', c.pdcn?.prefix);
    setC('cnt-pdcn-next', c.pdcn?.nextNumber);
    setC('cnt-pddn-pre', c.pddn?.prefix);
    setC('cnt-pddn-next', c.pddn?.nextNumber);
    setC('cnt-ldn-pre', c.ldn?.prefix || c.lossDn?.prefix);
    setC('cnt-ldn-next', c.ldn?.nextNumber || c.lossDn?.nextNumber);
    setC('cnt-lcn-pre', c.lcn?.prefix || c.lossCn?.prefix);
    setC('cnt-lcn-next', c.lcn?.nextNumber || c.lossCn?.nextNumber);
    setC('cnt-payin-pre', c.payin?.prefix);
    setC('cnt-payin-next', c.payin?.nextNumber);
    setC('cnt-payout-pre', c.payout?.prefix);
    setC('cnt-payout-next', c.payout?.nextNumber);
    setC('cnt-jv-pre', c.jv?.prefix);
    setC('cnt-jv-next', c.jv?.nextNumber);
    setC('cnt-exp-pre', c.expense?.prefix);
    setC('cnt-exp-next', c.expense?.nextNumber);

    // 5. Media & Branding
    safeSetVal('set-music-url', s.musicUrl);
    safeSetVal('set-video-url', s.videoUrl);
    if (document.getElementById('globalVolume')) document.getElementById('globalVolume').value = s.musicVolume || 0.5;

    if (s.logoImage) {
        const logoPreview = document.getElementById('logo-preview');
        if (logoPreview) { logoPreview.src = s.logoImage; logoPreview.style.display = 'block'; }
        safeSetVal('set-logo-b64', s.logoImage);
    }
    if (s.signatureImage) {
        const sigPreview = document.getElementById('sig-preview');
        if (sigPreview) { sigPreview.src = s.signatureImage; sigPreview.style.display = 'block'; }
        safeSetVal('set-signature-b64', s.signatureImage);
    }
    if (s.qrImage) {
        const qrPreview = document.getElementById('qr-preview');
        if (qrPreview) { qrPreview.src = s.qrImage; qrPreview.style.display = 'block'; }
        safeSetVal('set-qr-b64', s.qrImage);
    }
    safeSetVal('set-theme-color', s.themeColor || '#6366f1');
    
    if (s.referenceInvoiceUrl) {
        const designLink = document.getElementById('design-preview-link');
        const designBadge = document.getElementById('design-status-badge');
        if (designLink) designLink.innerHTML = `<a href="${s.referenceInvoiceUrl}" target="_blank" style="color:var(--accent);">📈„ View Current Blueprint</a>`;
        if (designBadge) designBadge.innerHTML = `<span class="badge badge-approved">BLUEPRINT LOADED</span>`;
    }

    if (s.scrollingMessage) {
        safeSetVal('set-msg-text', s.scrollingMessage.text);
        safeSetVal('set-msg-color', s.scrollingMessage.color);
        safeSetVal('set-msg-speed', s.scrollingMessage.speed);
    }

    setInvoiceStyle(s.invoiceStyle || 'classic');
}

async function saveSettings(e) {
    if (e) e.preventDefault();
    
    const btn = document.getElementById('save-settings-btn') || (e && e.submitter) || (e && e.target && e.target.querySelector('button[type="submit"]'));
    const originalHtml = btn ? btn.innerHTML : "SAVE SETTINGS";
    if (btn) { btn.disabled = true; btn.innerHTML = "⏳ SAVING TO CLOUD..."; }

    const counters = {
        invoice: { prefix: safeGetVal('cnt-inv-pre'), nextNumber: Number(safeGetVal('cnt-inv-next')) || 0 },
        purchase: { prefix: safeGetVal('cnt-pur-pre'), nextNumber: Number(safeGetVal('cnt-pur-next')) || 0 },
        scn: { prefix: safeGetVal('cnt-scn-pre'), nextNumber: Number(safeGetVal('cnt-scn-next')) || 0 },
        pdn: { prefix: safeGetVal('cnt-pdn-pre'), nextNumber: Number(safeGetVal('cnt-pdn-next')) || 0 },
        pdcn: { prefix: safeGetVal('cnt-pdcn-pre'), nextNumber: Number(safeGetVal('cnt-pdcn-next')) || 0 },
        pddn: { prefix: safeGetVal('cnt-pddn-pre'), nextNumber: Number(safeGetVal('cnt-pddn-next')) || 0 },
        ldn: { prefix: safeGetVal('cnt-ldn-pre'), nextNumber: Number(safeGetVal('cnt-ldn-next')) || 0 },
        lcn: { prefix: safeGetVal('cnt-lcn-pre'), nextNumber: Number(safeGetVal('cnt-lcn-next')) || 0 },
        payin: { prefix: safeGetVal('cnt-payin-pre'), nextNumber: Number(safeGetVal('cnt-payin-next')) || 0 },
        payout: { prefix: safeGetVal('cnt-payout-pre'), nextNumber: Number(safeGetVal('cnt-payout-next')) || 0 },
        jv: { prefix: safeGetVal('cnt-jv-pre'), nextNumber: Number(safeGetVal('cnt-jv-next')) || 0 },
        expense: { prefix: safeGetVal('cnt-exp-pre'), nextNumber: Number(safeGetVal('cnt-exp-next')) || 0 }
    };

    const data = {
        name: safeGetVal('set-name'),
        tollFree: safeGetVal('set-tollfree'),
        websites: [safeGetVal('set-web1'), safeGetVal('set-web2')].filter(v => v),
        emails: [safeGetVal('set-email1'), safeGetVal('set-email2'), safeGetVal('set-email3')].filter(v => v),
        phones: [safeGetVal('set-phone')].filter(v => v),
        adminEmail: safeGetVal('set-admin-email'),
        address: safeGetVal('set-address'),
        gstNo: safeGetVal('set-gst-no'),
        panNo: safeGetVal('set-pan-no'),
        dlNo: safeGetVal('set-dl-no'),
        fssaiNo: safeGetVal('set-fssai-no'),
        bankDetails: safeGetVal('set-bank-details'),
        gstRate: Math.floor(Number(safeGetVal('set-gst-rate'))),
        invoiceTerms: safeGetVal('set-invoice-terms'),
        cnTerms: safeGetVal('set-cn-terms'),
        dnTerms: safeGetVal('set-dn-terms'),
        invoiceBankVisible: document.getElementById('set-invoice-bank-visible')?.checked || false,
        cnBankVisible: document.getElementById('set-cn-bank-visible')?.checked || false,
        dnBankVisible: document.getElementById('set-dn-bank-visible')?.checked || false,
        upiId: safeGetVal('set-upi-id'),
        bankAccountNo: safeGetVal('set-bank-acc'),
        bankIfsc: safeGetVal('set-bank-ifsc'),
        paymentDueDays: Number(safeGetVal('set-payment-due-days')) || 21,
        defaultPlaceOfSupply: safeGetVal('set-default-supply'),
        signatureImage: safeGetVal('set-signature-b64'),
        logoImage: safeGetVal('set-logo-b64'),
        qrImage: safeGetVal('set-qr-b64'),
        themeColor: safeGetVal('set-theme-color'),
        documentCounters: counters,
        musicUrl: safeGetVal('set-music-url'),
        videoUrl: safeGetVal('set-video-url'),
        musicVolume: Number(document.getElementById('globalVolume')?.value || 0.5),
        scrollingMessage: {
            text: safeGetVal('set-msg-text'),
            color: safeGetVal('set-msg-color'),
            speed: Number(safeGetVal('set-msg-speed'))
        },
        invoiceStyle: safeGetVal('set-inv-style'),
        referenceInvoiceUrl: companyProfile.referenceInvoiceUrl // PERSIST BLUEPRINT URL
    };

    try {
        const res = await fetch(`${API_BASE}/admin/settings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await res.json();
        if (result.success) {
            alert("✅ Global Settings Saved Successfully!");
            companyProfile = result.settings;
            renderSettings();
        } else {
            console.error("Server error saving settings:", result);
            alert("❌ FAILED: " + (result.error || result.message || "Unknown server error"));
        }
    } catch (e) { 
        console.error("Network/Client error saving settings:", e);
        alert("🚨 CRITICAL ERROR: Could not save settings.\n" + (e.message || "Check your connection."));
    }
    finally { if (btn) { btn.disabled = false; btn.innerHTML = originalHtml; } }
}

// Helper functions removed from here as they are defined at the top of the file.

async function handleAdminLogin(e) {
    e.preventDefault();
    const adminId = document.getElementById('admin-id-input').value;
    const password = document.getElementById('admin-pass-input').value;

    try {
        const res = await fetch(`${API_BASE}/admin/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ adminId, password })
        });
        const result = await res.json();
        if (result.success) {
            sessionStorage.setItem('admin_logged', 'true');
            window.location.reload();
        } else {
            alert("Invalid Credentials");
        }
    } catch (e) { alert("Auth Error"); }
}

async function resetSystemDatabase() {
    const confirmation = confirm("🚨 WARNING: This will PERMANENTLY DELETE all orders, invoices, purchases, payments, and resets inventory counts. This action CANNOT be undone.\n\nAre you sure you want to proceed?");
    if (!confirmation) return;

    // Use prompt for a more secure check
    const securityCheck = prompt("FINAL CONFIRMATION: Type 'RESET' (all caps) to confirm deletion of all transactional data.");
    if (securityCheck !== 'RESET') {
        alert("Reset cancelled. Text did not match.");
        return;
    }

    try {
        // Find the button (it might be the event target)
        const btn = document.querySelector('button[onclick="resetSystemDatabase()"]');
        const originalText = btn ? btn.innerHTML : "RESET DATABASE";
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = "⏳ PURGING DATABASE...";
        }

        const res = await fetch(`${API_BASE}/admin/system/reset`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });

        const result = await res.json();
        if (result.success) {
            alert("✅ System Reset Successful! All transactional data cleared and counters reset.");
            window.location.reload();
        } else {
            alert("❌ Reset Failed: " + (result.error || "Unknown error"));
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = originalText;
            }
        }
    } catch (e) {
        alert("❌ Error: Could not connect to server.");
        console.error(e);
    }
}

// --- NAVIGATION ---
function switchTab(tabId, el, subType = null) {
    try {
        // 1. Update Sidebar UI
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.style) item.style.color = '';
        });
        if (el) el.classList.add('active');

        // 2. Switch Content Visibility
        document.querySelectorAll('.content > div').forEach(div => div.classList.add('hidden'));
        const targetTab = document.getElementById(`tab-${tabId}`);
        if (targetTab) {
            targetTab.classList.remove('hidden');
        } else {
            console.error(`Tab tab-${tabId} not found`);
            return;
        }

        // 3. Trigger Data Renders
        if (tabId === 'stockists') renderStockists();
        if (tabId === 'masters') renderMasterLists();
        if (tabId === 'orders') renderOrderHistory();
        if (tabId === 'invoices') renderInvoices();
        if (tabId === 'pdcn-approvals') fetchPDCNClaims();
        if (tabId === 'notes') {
            currentNoteReason = subType || 'ALL';
            renderFinancialNotes();
            filterNotes();
            
            const label = document.getElementById('note-context-label');
            if(label) {
                let labelText = "Global View";
                if (currentNoteReason === 'Salable Return') labelText = "Sales Linked CN (Returns/Claims)";
                else if (currentNoteReason === 'Purchase Return') labelText = "Purc. Linked DN (Stock/Rate)";
                else if (currentNoteReason === 'Price Diff') labelText = "Price Difference (CN/DN)";
                else if (currentNoteReason !== 'ALL') labelText = `Viewing: ${currentNoteReason}`;
                label.innerText = labelText;
            }
        }
        if (tabId === 'purchase') renderPurchaseEntries();
        if (tabId === 'payments') {
            currentPaymentTypeFilter = subType || 'RECEIPT';
            renderPayments();
        }

        if (tabId === 'reports') refreshInventoryVal();
        if (tabId === 'system') loadFailedEmails();
    } catch (err) {
        console.error("Navigation error:", err);
    }
}


function toggleSubmenu(id, el) {
    const submenu = document.getElementById(id);
    if (!submenu) return;
    
    const isVisible = submenu.style.display !== 'none' && submenu.style.display !== '';
    
    // Close other sub-menus at the SAME level (avoid closing parents)
    document.querySelectorAll('[id^="sub-"]').forEach(sub => {
        if (sub.id !== id && !sub.contains(submenu) && !submenu.contains(sub)) {
            sub.style.display = 'none';
        }
    });

    if (isVisible) {
        submenu.style.display = 'none';
        if (el) el.classList.remove('active');
    } else {
        submenu.style.display = 'flex';
        if (el) el.classList.add('active');
    }
}

// --- DASHBOARD ---
let chartInstances = {};

async function refreshDashboard() {
    try {
        await Promise.all([loadOrders(), loadStockists(), loadProducts()]);
        
        // Update Stats
        const pendingOrders = allOrders.filter(o => o.status === 'pending');
        const approvedOrders = allOrders.filter(o => o.status === 'approved');
        
        document.getElementById('stat-orders').innerText = allOrders.length;
        document.getElementById('stat-pending').innerText = pendingOrders.length;
        document.getElementById('stat-stockists').innerText = allStockists.length;

        // Revenue (Ex. GST) calculation from approved orders
        const totalRevenue = approvedOrders.reduce((sum, o) => sum + (Number(o.subTotal) || 0), 0);
        const revenueEl = document.getElementById('stat-revenue');
        if (revenueEl) {
            revenueEl.innerText = '₹' + totalRevenue.toLocaleString('en-IN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
        }

        // Month-over-Month Logic
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;

        const currentOrders = allOrders.filter(o => {
            const d = new Date(o.createdAt);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        });

        const previousOrders = allOrders.filter(o => {
            const d = new Date(o.createdAt);
            return d.getMonth() === prevMonth && d.getFullYear() === prevYear;
        });

        const currentTotal = currentOrders.reduce((sum, o) => sum + (Number(o.grandTotal) || 0), 0);
        const previousTotal = previousOrders.reduce((sum, o) => sum + (Number(o.grandTotal) || 0), 0);

        const growth = previousTotal === 0 ? 100 : (((currentTotal - previousTotal) / previousTotal) * 100);
        const momBadge = document.getElementById('mom-badge');
        if (momBadge) {
            momBadge.innerText = `${growth >= 0 ? '■²' : '■¼'} ${Math.abs(growth).toFixed(1)}% vs Last Month`;
            momBadge.style.background = growth >= 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)';
            momBadge.style.color = growth >= 0 ? '#10b981' : '#ef4444';
        }

        if (companyProfile && companyProfile.documentCounters) {
            const dc = companyProfile.documentCounters;
            if (document.getElementById('stat-payin-count')) {
                document.getElementById('stat-payin-count').innerText = (dc.payin?.nextNumber || 1) - 1;
            }
            if (document.getElementById('stat-payout-count')) {
                document.getElementById('stat-payout-count').innerText = (dc.payout?.nextNumber || 1) - 1;
            }
        }

        renderCharts(currentOrders, allOrders);
    } catch (e) { console.error("Dashboard refresh fail", e); }
}

async function updateDBStats() {
    try {
        const res = await fetch(`${API_BASE}/admin/db-stats`);
        const stats = await res.json();
        
        const textEl = document.getElementById('db-usage-text');
        const barEl = document.getElementById('db-usage-bar');
        
        if (textEl) {
            textEl.innerText = `${stats.usedMB} / ${stats.capacityMB} MB (${stats.percent}%)`;
        }
        if (barEl) {
            barEl.style.width = `${stats.percent}%`;
            if (parseFloat(stats.percent) > 80) {
                barEl.style.background = '#ef4444';
                textEl.style.color = '#ef4444';
            }
        }

        // Update Document Counters on Dashboard
        if (stats.counters) {
            const payIn = stats.counters.paymentIn || 0;
            const payOut = stats.counters.paymentOut || 0;
            if (document.getElementById('stat-payin-count')) {
                document.getElementById('stat-payin-count').innerText = payIn;
            }
            if (document.getElementById('stat-payout-count')) {
                document.getElementById('stat-payout-count').innerText = payOut;
            }
        }
    } catch (e) { console.error("DB stats fail", e); }
}


async function loadOrders() {
    try {
        const res = await fetch(`${API_BASE}/admin/orders`);
        const data = await res.json();
        allOrders = data.map(o => ({ 
            ...o, 
            _id: o._id || o.id,
            grandTotal: Number(o.grandTotal || 0),
            subTotal: Number(o.subTotal || 0),
            stockist: o.stockist || o.Stockist,
            items: (o.items || []).map(i => ({ 
                ...i, 
                _id: i._id || i.id, 
                productId: i.productId || i.product,
                priceUsed: Number(i.priceUsed || 0),
                totalValue: Number(i.totalValue || 0)
            }))
        }));
        renderOrderHistory();
    } catch (e) { console.error("Load orders fail"); }
}

async function loadInvoices() {
    try {
        const res = await fetch(`${API_BASE}/admin/invoices`);
        if (!res.ok) throw new Error("HTTP " + res.status);
        const data = await res.json();
        allInvoices = data.map(inv => ({
            ...inv,
            _id: inv._id || inv.id,
            stockist: inv.stockist || inv.Stockist,
            subTotal: Number(inv.subTotal || 0),
            gstAmount: Number(inv.gstAmount || 0),
            grandTotal: Number(inv.grandTotal || 0)
        }));
        renderInvoices();
    } catch (e) { console.error("Load invoices fail", e); }
}

async function loadPurchaseEntries() {
    try {
        const res = await fetch(`${API_BASE}/admin/purchase-entries`);
        const data = await res.json();
        // Add aliases for UI compatibility
        allPurchaseEntries = data.map(p => ({
            ...p,
            _id: p.id,
            supplier: p.supplierId, // Add alias for edit mode compatibility
            supplierName: p.Supplier?.name || p.supplierName || 'N/A'
        }));
        renderPurchaseEntries();
    } catch (e) { console.error("Load purchase entries fail", e); }
}

function renderCharts(currentMonthOrders, totalOrders) {
    // Destroy existing charts
    Object.values(chartInstances).forEach(chart => {
        if (chart && typeof chart.destroy === 'function') chart.destroy();
    });

    // --- SALES TREND (Current Month) ---
    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    const dailyData = Array(daysInMonth).fill(0);
    currentMonthOrders.forEach(o => {
        const day = new Date(o.createdAt).getDate();
        dailyData[day - 1] += (Number(o.grandTotal) || 0);
    });

    chartInstances.sales = new Chart(document.getElementById('salesChart'), {
        type: 'line',
        data: {
            labels: Array.from({length: daysInMonth}, (_, i) => i + 1),
            datasets: [{
                label: 'Revenue (₹)',
                data: dailyData,
                borderColor: '#6366f1',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                fill: true,
                tension: 0.4,
                borderWidth: 3,
                pointRadius: 4,
                pointBackgroundColor: '#6366f1'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } },
                x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
            }
        }
    });

    // --- TOP PRODUCTS ---
    const productCounts = {};
    totalOrders.forEach(o => {
        (o.items || []).forEach(item => {
            productCounts[item.name] = (productCounts[item.name] || 0) + (Number(item.qty) || 0);
        });
    });
    const topProds = Object.entries(productCounts).sort((a,b) => b[1] - a[1]).slice(0, 5);

    chartInstances.products = new Chart(document.getElementById('topProductsChart'), {
        type: 'bar',
        data: {
            labels: topProds.map(p => p[0]),
            datasets: [{
                label: 'Units Sold',
                data: topProds.map(p => p[1]),
                backgroundColor: '#818cf8',
                borderRadius: 8
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } },
                y: { ticks: { color: '#94a3b8' } }
            }
        }
    });

    // --- TOP STOCKISTS ---
    const stockistSales = {};
    totalOrders.forEach(o => {
        const name = o.stockist ? o.stockist.name : 'Unknown';
        stockistSales[name] = (stockistSales[name] || 0) + o.grandTotal;
    });
    const topStockists = Object.entries(stockistSales).sort((a,b) => b[1] - a[1]).slice(0, 5);

    chartInstances.stockists = new Chart(document.getElementById('topStockistsChart'), {
        type: 'bar',
        data: {
            labels: topStockists.map(s => s[0]),
            datasets: [{
                label: 'Total Purchase (₹)',
                data: topStockists.map(s => s[1]),
                backgroundColor: '#10b981',
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } },
                x: { ticks: { color: '#94a3b8' } }
            }
        }
    });

    // --- ORDER STATUS ---
    const statusCounts = { pending: 0, approved: 0 };
    totalOrders.forEach(o => { statusCounts[o.status] = (statusCounts[o.status] || 0) + 1; });

    chartInstances.status = new Chart(document.getElementById('orderStatusChart'), {
        type: 'doughnut',
        data: {
            labels: ['Pending', 'Approved'],
            datasets: [{
                data: [statusCounts.pending, statusCounts.approved],
                backgroundColor: ['#f59e0b', '#10b981'],
                borderWidth: 0,
                hoverOffset: 10
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { color: '#94a3b8', font: { weight: 'bold' } } }
            },
            cutout: '70%'
        }
    });

    // --- NEW ANALYTICS: PRODUCT GROUP SHARE & GST ---
    const groupSales = { 'GROUP1': 0, 'GROUP2': 0, 'GROUP3': 0 };
    let totalTaxableBusiness = 0;
    let totalGSTAll = 0;

    totalOrders.filter(o => o.status === 'approved').forEach(o => {
        o.items.forEach(item => {
            const prod = allProducts.find(p => (p._id || p.id) === (item.productId || item.product));
            // Normalize Group Name: Remove spaces/dashes and uppercase (e.g. "Group 1" -> "GROUP1")
            let rawGroup = (prod && prod.group) ? prod.group.toUpperCase().replace(/[\s-]/g, '') : 'GENERAL';
            
            // Map common variations back to standard keys
            if (rawGroup.includes('GROUP1')) rawGroup = 'GROUP1';
            if (rawGroup.includes('GROUP2')) rawGroup = 'GROUP2';
            if (rawGroup.includes('GROUP3')) rawGroup = 'GROUP3';

            if (groupSales.hasOwnProperty(rawGroup)) {
                groupSales[rawGroup] += (item.totalValue || 0);
                
                const gstRate = prod ? (prod.gstPercent || 0) : 0;
                const itemGst = ((item.totalValue || 0) * gstRate) / 100;
                totalGSTAll += itemGst;
                totalTaxableBusiness += (item.totalValue || 0);
            }
        });
    });

    // Chart 1: Business Share (GROUP1, 2, 3 only)
    chartInstances.groupPie = new Chart(document.getElementById('groupPieChart'), {
        type: 'pie',
        data: {
            labels: ['GROUP 1', 'GROUP 2', 'GROUP 3'],
            datasets: [{
                data: [groupSales.GROUP1, groupSales.GROUP2, groupSales.GROUP3],
                backgroundColor: ['#6366f1', '#10b981', '#f59e0b'],
                borderWidth: 2,
                borderColor: 'rgba(15, 23, 42, 0.5)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', boxWidth: 12, padding: 15 } } }
        }
    });

    // Chart 2: GST Liability vs Total Business
    chartInstances.gstBar = new Chart(document.getElementById('gstBarChart'), {
        type: 'bar',
        data: {
            labels: ['Total Taxable Business', 'GST Liability'],
            datasets: [{
                data: [totalTaxableBusiness, totalGSTAll],
                backgroundColor: ['rgba(99, 102, 241, 0.5)', 'rgba(245, 158, 11, 0.8)'],
                borderColor: ['#6366f1', '#f59e0b'],
                borderWidth: 2,
                borderRadius: 12
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } },
                x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
            }
        }
    });

    const gstDisplay = document.getElementById('total-gst-display');
    if (gstDisplay) gstDisplay.innerText = `₹${totalGSTAll.toLocaleString('en-IN', {minimumFractionDigits: 2})}`;
}

// --- DATA FETCHING ---
async function loadProducts() {
    try {
        const res = await fetch(`${API_BASE}/products`);
        if (!res.ok) throw new Error("HTTP " + res.status);
        const data = await res.json();
        allProducts = data.map(p => ({ 
            ...p, 
            _id: p._id || p.id,
            pts: Number(p.pts || 0),
            ptr: Number(p.ptr || 0),
            mrp: Number(p.mrp || 0),
            qtyAvailable: Number(p.qtyAvailable || p.stock || 0),
            batches: (p.batches || []).map(b => ({ 
                ...b, 
                _id: b._id || b.id,
                qtyAvailable: Number(b.qtyAvailable || 0),
                mrp: Number(b.mrp || 0),
                pts: Number(b.pts || 0),
                ptr: Number(b.ptr || 0)
            }))
        }));
        renderProducts();
        updateDatalists();
    } catch (e) { 
        console.error("Load products fail", e);
        // Fallback to empty if fail
        allProducts = [];
    }
}

async function loadStockists(type = '') {
    try {
        const res = await fetch(`${API_BASE}/admin/stockists${type ? `?type=${type}` : ''}`);
        if (!res.ok) throw new Error("HTTP " + res.status);
        const data = await res.json();
        allStockists = data.map(s => ({ 
            ...s, 
            _id: s._id || s.id,
            outstandingBalance: Number(s.outstandingBalance || 0),
            creditLimit: Number(s.creditLimit || 0)
        }));
        renderStockists();
    } catch (e) { console.error("Load parties fail", e); }
}

async function loadMasters() {
    try {
        const fetchJSON = (url) => fetch(url).then(r => r.ok ? r.json() : []);
        
        const [cats, hsns, gst, groups, hq, expCats] = await Promise.all([
            fetchJSON(`${API_BASE}/categories`),
            fetchJSON(`${API_BASE}/hsns`),
            fetchJSON(`${API_BASE}/gst`),
            fetchJSON(`${API_BASE}/groups`),
            fetchJSON(`${API_BASE}/hq`),
            fetchJSON(`${API_BASE}/expense-categories`)
        ]);
        
        window.masters = { 
            categories: cats || [], 
            hsns: hsns || [], 
            gst: gst || [], 
            groups: groups || [], 
            hq: hq || [], 
            expenseCategories: expCats || [] 
        };

        renderMasterLists();
        updateDatalists();
    } catch (e) { console.error("Load masters fail", e); }
}

function updateDatalists() {
    const masterCats = (window.masters && window.masters.categories) ? window.masters.categories.map(c => c.name.toUpperCase()) : [];
    const masterGroups = (window.masters && window.masters.groups) ? window.masters.groups.map(g => g.name.toUpperCase()) : [];
    const masterHsns = (window.masters && window.masters.hsns) ? window.masters.hsns.map(h => h.code) : [];
    const masterGsts = (window.masters && window.masters.gst) ? window.masters.gst.map(g => Number(g.rate)) : [];

    const cats = new Set([...masterCats, "TABLETS", "SYRUPS", "INJECTIONS", "CAPSULES", "SACHETS"]);
    const groups = new Set([...masterGroups, "GENERAL"]);
    const hsns = new Set(masterHsns);
    const gsts = new Set([...masterGsts, 5, 12, 18, 28]);

    allProducts.forEach(p => {
        if (p.category) cats.add(p.category.toUpperCase());
        if (p.group) groups.add(p.group.toUpperCase());
        if (p.hsn) hsns.add(p.hsn);
        if (p.gstPercent) gsts.add(Number(p.gstPercent));
    });

    // HSN and GST stay as datalists (free-text allowed)
    // HSN datalist kept for backward compat with other uses
    const hsnList = document.getElementById('hsn-list');
    // GST now a select — no longer need datalist
    // const gstList = document.getElementById('gst-rate-list'); // no-op
    if (hsnList) hsnList.innerHTML = Array.from(hsns).map(h => `<option value="${h}"></option>`).join('');

    // Category & Group now use <select> elements fed from Global Master
    populateMasterSelects();

    // Update HQ Dropdowns
    const partyHqSelect = document.getElementById('party-hq');
    if (partyHqSelect && window.masters && window.masters.hq) {
        const currentVal = partyHqSelect.value;
        partyHqSelect.innerHTML = '<option value="">-- Select HQ --</option>' + 
            window.masters.hq.map(h => `<option value="${h.name}">${h.name}</option>`).join('');
        partyHqSelect.value = currentVal;
    }

    // Update Product Category Filter
    const prodCatFilter = document.getElementById('productCategoryFilter');
    if (prodCatFilter) {
        const currentVal = prodCatFilter.value;
        prodCatFilter.innerHTML = '<option value="">All Categories</option>' + 
            Array.from(cats).sort().map(c => `<option value="${c}">${c}</option>`).join('');
        prodCatFilter.value = currentVal;
    }
}

function renderProducts(list = allProducts) {
    const tbody = document.getElementById('productTableBody');
    if (!tbody) return;
    tbody.innerHTML = list.map(p => `
        <tr>
            <td style="font-weight: 700; color:var(--primary); cursor:pointer; text-decoration: underline;" onclick="viewProductTimeline('${p._id}')" title="Click to view full transaction history">${p.name}</td>
            <td style="font-size:0.75rem; opacity:0.8;">${p.manufacturer || '-'}</td>
            <td style="font-size:0.75rem; opacity:0.8;">${p.category || '-'}</td>
            <td style="color:var(--text-muted); font-size:0.8rem;">${p.packing || '-'}</td>
            <td style="font-family: monospace;">${p.hsn || '-'}</td>
            <td>₹${p.mrp}</td>
            <td style="color:var(--accent); font-weight:700;">₹${p.ptr}</td>
            <td>₹${p.pts}</td>
            <td style="color:#10b981; font-weight:700;">₹${p.purchaseRate || 0}</td>
            <td>${Math.round(p.gstPercent || 0)}%</td>
            <td>${p.qtyAvailable}</td>
            <td><span class="badge ${p.active ? 'badge-approved' : 'badge-pending'}">${p.active ? 'Active' : 'Inactive'}</span></td>
            <td style="white-space: nowrap;">
                <button class="btn btn-ghost" style="padding: 5px 10px;" onclick="editProduct('${p._id}')" title="Edit">📈</button>
                <button class="btn btn-ghost" style="padding: 5px 10px; color: #ef4444; border-color: rgba(239, 68, 68, 0.2);" onclick="deleteProduct('${p._id}')" title="Delete">🗑️</button>
            </td>
        </tr>
    `).join('');
}

function filterProducts(query) {
    const q = query.toLowerCase();
    const catFilter = document.getElementById('productCategoryFilter')?.value || "";
    
    const filtered = allProducts.filter(p => {
        const matchesQuery = p.name.toLowerCase().includes(q) || 
            (p.hsn && p.hsn.toLowerCase().includes(q)) ||
            (p.manufacturer && p.manufacturer.toLowerCase().includes(q)) ||
            (p.category && p.category.toLowerCase().includes(q));
        
        const matchesCategory = !catFilter || (p.category && p.category.toUpperCase() === catFilter.toUpperCase());
        
        return matchesQuery && matchesCategory;
    });
    renderProducts(filtered);
}

function openProductModal(mode = 'quick', initialName = '') {
    document.getElementById('productForm').reset();
    document.getElementById('prod-id').value = '';
    if (initialName) document.getElementById('prod-name').value = initialName;
    document.getElementById('prod-gst'); // will be set by populateMasterSelects default
    currentProductBatches = [];
    renderProductBatches();

    // Auto-generate internal code from product count
    document.getElementById('prod-internal-code').value = generateInternalCode();

    // Show REGEN button for new products
    const regenBtn = document.getElementById('regen-internal-code-btn');
    if (regenBtn) { regenBtn.style.display = ''; regenBtn.title = 'Regenerate'; }
    const internalCodeInput = document.getElementById('prod-internal-code');
    if (internalCodeInput) { internalCodeInput.style.opacity = ''; internalCodeInput.style.cursor = ''; }

    // Reset barcode panel
    document.getElementById('prod-barcode').value = '';
    const barcodeContainer = document.getElementById('barcode-svg-container');
    if (barcodeContainer) barcodeContainer.innerHTML = '<span style="font-size:0.68rem;color:rgba(255,255,255,0.2);">Click GEN to generate barcode from internal code</span>';
    const barcodeStatus = document.getElementById('barcode-status');
    if (barcodeStatus) barcodeStatus.textContent = 'No barcode generated';
    const barcodePrintRow = document.getElementById('barcode-print-row');
    if (barcodePrintRow) barcodePrintRow.style.display = 'none';
    // Reset HSN UI
    document.getElementById('prod-hsn').value = '';
    const hsnSel = document.getElementById('prod-hsn-select');
    if (hsnSel) hsnSel.value = '';
    const hsnCustomRow = document.getElementById('prod-hsn-custom-row');
    if (hsnCustomRow) hsnCustomRow.style.display = 'none';
    const hsnCustomInput = document.getElementById('prod-hsn-custom');
    if (hsnCustomInput) hsnCustomInput.value = '';
    const hsnWarn = document.getElementById('hsn-dup-warn');
    if (hsnWarn) hsnWarn.style.display = 'none';

    // Populate category, group, hsn & gst selects from Global Master
    populateMasterSelects();

    switchProductMode(mode);
    document.getElementById('productModal').classList.remove('hidden');
}

function closeProductModal() {
    document.getElementById('productModal').classList.add('hidden');
}

async function saveProduct(e) {
    e.preventDefault();
    const id = safeGetVal('prod-id');
    const data = {
        name: safeGetVal('prod-name'),
        internalCode: safeGetVal('prod-internal-code'),
        barcode: safeGetVal('prod-barcode'),
        manufacturer: safeGetVal('prod-manufacturer'),
        hsn: safeGetVal('prod-hsn'),
        category: safeGetVal('prod-cat'),
        group: safeGetVal('prod-group'),
        packing: safeGetVal('prod-packing'),
        mrp: Number(safeGetVal('prod-mrp')),
        gstPercent: Math.floor(Number(safeGetVal('prod-gst') || 12)),
        ptr: Number(safeGetVal('prod-ptr')),
        pts: Number(safeGetVal('prod-pts')),
        purchaseRate: Number(safeGetVal('prod-purchase-rate') || 0),
        qtyAvailable: Math.floor(Number(safeGetVal('prod-qty') || 0)),
        batches: currentProductBatches,
        bonusBuy: Math.floor(Number(safeGetVal('prod-buy') || 0)),
        bonusGet: Math.floor(Number(safeGetVal('prod-get') || 0))
    };

    const saveBtn = document.getElementById('btn-save-product');
    const oldBtnText = saveBtn.innerHTML;
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<span class="spinner-small"></span> SAVING...';

    try {
        const url = id ? `${API_BASE}/admin/products/${id}` : `${API_BASE}/admin/products`;
        const res = await fetch(url, {
            method: id ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await res.json();
        
        saveBtn.disabled = false;
        saveBtn.innerHTML = oldBtnText;

        if (result.success) {
            alert("Product saved successfully!");
            closeProductModal();
            loadProducts();
        } else {
            const detailStr = result.details && result.details.length ? ("\nDetails: " + result.details.join(", ")) : "";
            const debugStr = result.debug ? ("\nDebug: " + JSON.stringify(result.debug)) : "";
            alert("Failed to save: " + (result.error || result.message || "Unknown error") + detailStr + debugStr);
        }
    } catch (e) { 
        console.error("Save error:", e);
        const saveBtn = document.getElementById('btn-save-product');
        saveBtn.disabled = false;
        saveBtn.innerHTML = 'SAVE PRODUCT';
        alert("Failed to save product. Check console for details."); 
    }
}

async function deleteProduct(id) {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
        const res = await fetch(`${API_BASE}/admin/products/${id}`, { method: 'DELETE' });
        const result = await res.json();
        if (result.success) {
            alert("Product deleted successfully!");
            loadProducts();
        } else {
            alert("Delete failed: " + (result.message || "Unknown error"));
        }
    } catch (e) { alert("Failed to delete product."); }
}

function editProduct(id) {
    const p = allProducts.find(x => x._id == id);
    if (!p) return;

    document.getElementById('prod-id').value = p._id;
    document.getElementById('prod-name').value = p.name;
    document.getElementById('prod-manufacturer').value = p.manufacturer || '';
    // Set HSN — pick from master select or show custom entry row
    const hsnMasterCodes = (window.masters && window.masters.hsns) ? window.masters.hsns.map(h => h.code) : [];
    const hsnSel = document.getElementById('prod-hsn-select');
    const hsnHidden = document.getElementById('prod-hsn');
    const hsnCustomRow = document.getElementById('prod-hsn-custom-row');
    const hsnCustomInput = document.getElementById('prod-hsn-custom');
    hsnHidden.value = p.hsn || '';
    if (p.hsn && hsnMasterCodes.includes(p.hsn)) {
        if (hsnSel) hsnSel.value = p.hsn;
        if (hsnCustomRow) hsnCustomRow.style.display = 'none';
    } else if (p.hsn) {
        if (hsnSel) hsnSel.value = '__custom__';
        if (hsnCustomRow) hsnCustomRow.style.display = 'block';
        if (hsnCustomInput) hsnCustomInput.value = p.hsn;
    } else {
        if (hsnSel) hsnSel.value = '';
        if (hsnCustomRow) hsnCustomRow.style.display = 'none';
    }
    // GST — set select value (populated by populateMasterSelects)
    // done after populateMasterSelects() call below
    document.getElementById('prod-packing').value = p.packing || '';
    document.getElementById('prod-mrp').value = p.mrp;
    document.getElementById('prod-gst').value = p.gstPercent;
    document.getElementById('prod-ptr').value = p.ptr;
    document.getElementById('prod-pts').value = p.pts;
    document.getElementById('prod-purchase-rate').value = p.purchaseRate || 0;
    document.getElementById('prod-qty').value = p.qtyAvailable || 0;
    document.getElementById('prod-buy').value = p.bonusBuy || 0;
    document.getElementById('prod-get').value = p.bonusGet || 0;
    document.getElementById('prod-internal-code').value = p.internalCode || generateInternalCode();
    document.getElementById('prod-barcode').value = p.barcode || '';
    const hsnWarn = document.getElementById('hsn-dup-warn');
    if (hsnWarn) hsnWarn.style.display = 'none';

    // Populate selects from Global Master, then set saved values
    populateMasterSelects();
    document.getElementById('prod-cat').value = p.category || '';
    document.getElementById('prod-group').value = p.group || '';
    // Set GST select after populating master selects
    const gstSel = document.getElementById('prod-gst');
    if (gstSel) gstSel.value = String(Math.round(Number(p.gstPercent || 12)));

    // Restore barcode preview if a barcode or internal code exists
    const barcodeVal = p.barcode || p.internalCode;
    const container = document.getElementById('barcode-svg-container');
    const barcodeStatus = document.getElementById('barcode-status');
    const barcodePrintRow = document.getElementById('barcode-print-row');
    if (barcodeVal && typeof JsBarcode !== 'undefined' && container) {
        container.innerHTML = '<svg id="prod-barcode-svg"></svg>';
        try {
            JsBarcode('#prod-barcode-svg', barcodeVal, {
                format: 'CODE128', width: 2, height: 60, displayValue: true,
                fontSize: 12, background: 'transparent', lineColor: '#e2e8f0', textMargin: 4
            });
            if (barcodeStatus) barcodeStatus.innerHTML = 'Barcode: <span style="font-family:monospace;color:var(--primary);">' + barcodeVal + '</span>';
            if (barcodePrintRow) barcodePrintRow.style.display = 'flex';
        } catch(e) {
            if (container) container.innerHTML = '<span style="font-size:0.68rem;color:rgba(255,255,255,0.2);">Click GEN to generate barcode</span>';
        }
    } else {
        if (container) container.innerHTML = '<span style="font-size:0.68rem;color:rgba(255,255,255,0.2);">Click GEN to generate barcode from internal code</span>';
        if (barcodeStatus) barcodeStatus.textContent = 'No barcode generated';
        if (barcodePrintRow) barcodePrintRow.style.display = 'none';
    }

    currentProductBatches = p.batches || [];
    renderProductBatches();

    // Auto-detect mode: products with batches -> Full Record, otherwise -> Quick Item
    const mode = (p.batches && p.batches.length > 0) ? 'full' : 'quick';
    switchProductMode(mode);

    // LOCK: Hide REGEN button and visually lock internal code during edit
    const regenBtn = document.getElementById('regen-internal-code-btn');
    if (regenBtn) { regenBtn.style.display = 'none'; }
    const internalCodeInput = document.getElementById('prod-internal-code');
    if (internalCodeInput) {
        internalCodeInput.title = 'Internal code is locked during edit to prevent accidental changes.';
        internalCodeInput.style.opacity = '0.55';
        internalCodeInput.style.cursor = 'not-allowed';
    }

    document.getElementById('productModal').classList.remove('hidden');
}

// ============================================================
// PRODUCT MODAL — NEW HELPER FUNCTIONS
// ============================================================

function generateInternalCode() {
    const count = (allProducts && allProducts.length > 0) ? allProducts.length + 1 : 1;
    return 'ITEM-' + String(count).padStart(4, '0');
}

function regenerateInternalCode() {
    const now = new Date();
    const ts = String(now.getFullYear()).slice(-2) +
               String(now.getMonth() + 1).padStart(2, '0') +
               String(now.getDate()).padStart(2, '0') +
               String(now.getHours()).padStart(2, '0') +
               String(now.getMinutes()).padStart(2, '0');
    const el = document.getElementById('prod-internal-code');
    if (el) el.value = 'ITEM-' + ts;
}

function switchProductMode(mode) {
    document.getElementById('prod-mode').value = mode;
    const batchSection = document.getElementById('batch-engine-section');
    const quickHint = document.getElementById('quick-mode-hint');
    const bonusRow = document.getElementById('bonus-scheme-row');
    const btnQuick = document.getElementById('mode-btn-quick');
    const btnFull = document.getElementById('mode-btn-full');
    const modalTitle = document.getElementById('prod-modal-title');
    const eyebrow = document.getElementById('prod-modal-eyebrow');
    const isEdit = !!(document.getElementById('prod-id') && document.getElementById('prod-id').value);

    if (mode === 'full') {
        if (batchSection) { batchSection.style.display = 'flex'; batchSection.style.flexDirection = 'column'; }
        if (quickHint) quickHint.style.display = 'none';
        if (bonusRow) { bonusRow.style.display = 'grid'; }
        if (btnQuick) { btnQuick.style.background = 'transparent'; btnQuick.style.color = 'rgba(255,255,255,0.38)'; }
        if (btnFull)  { btnFull.style.background = 'var(--primary)'; btnFull.style.color = '#fff'; }
        if (modalTitle) modalTitle.textContent = isEdit ? 'Edit Product - Full Record' : 'New Item - Full Record';
        if (eyebrow) eyebrow.textContent = 'INVENTORY MASTER - BATCH ENGINE';
    } else {
        if (batchSection) batchSection.style.display = 'none';
        if (quickHint) quickHint.style.display = 'block';
        if (bonusRow) bonusRow.style.display = 'none';
        if (btnFull)  { btnFull.style.background = 'transparent'; btnFull.style.color = 'rgba(255,255,255,0.38)'; }
        if (btnQuick) { btnQuick.style.background = 'var(--primary)'; btnQuick.style.color = '#fff'; }
        if (modalTitle) modalTitle.textContent = isEdit ? 'Edit Item - Quick Mode' : 'New Item - Quick Entry';
        if (eyebrow) eyebrow.textContent = 'INVENTORY MASTER - QUICK ENTRY';
    }
}

function checkHsnDuplicate(value) {
    const warn = document.getElementById('hsn-dup-warn');
    if (!warn) return;
    if (!value || !window.masters || !window.masters.hsns) { warn.style.display = 'none'; return; }
    const exists = window.masters.hsns.some(h => h.code === value.trim());
    warn.style.display = exists ? 'block' : 'none';
}

function populateMasterSelects() {
    const catSelect = document.getElementById('prod-cat');
    const groupSelect = document.getElementById('prod-group');
    const hsnSelect = document.getElementById('prod-hsn-select');
    const gstSelect = document.getElementById('prod-gst');

    if (catSelect) {
        const currentVal = catSelect.value;
        const masterCats = (window.masters && window.masters.categories) ? window.masters.categories.map(c => c.name.toUpperCase()) : [];
        const legacyCats = [...new Set(allProducts.map(p => p.category).filter(Boolean).map(c => c.toUpperCase()))];
        const allCats = [...new Set([...masterCats, 'TABLETS', 'SYRUPS', 'INJECTIONS', 'CAPSULES', 'SACHETS', ...legacyCats])].sort();
        catSelect.innerHTML = '<option value="">-- Select Category --</option>' +
            allCats.map(c => `<option value="${c}">${c}</option>`).join('');
        if (currentVal) catSelect.value = currentVal;
    }

    if (groupSelect) {
        const currentVal = groupSelect.value;
        const masterGroups = (window.masters && window.masters.groups) ? window.masters.groups.map(g => g.name.toUpperCase()) : [];
        const legacyGroups = [...new Set(allProducts.map(p => p.group).filter(Boolean).map(g => g.toUpperCase()))];
        const allGroups = [...new Set([...masterGroups, 'GENERAL', ...legacyGroups])].sort();
        groupSelect.innerHTML = '<option value="">-- Select Group --</option>' +
            allGroups.map(g => `<option value="${g}">${g}</option>`).join('');
        if (currentVal) groupSelect.value = currentVal;
    }

    // HSN Select — Global Master codes only, no browser memory
    if (hsnSelect) {
        const currentVal = hsnSelect.value;
        const masterHsns = (window.masters && window.masters.hsns) ? window.masters.hsns : [];
        hsnSelect.innerHTML = '<option value="">-- Pick HSN from Global Master --</option>' +
            masterHsns.map(h => {
                const label = h.code + (h.description ? '  —  ' + h.description : '');
                return `<option value="${h.code}">${label}</option>`;
            }).join('') +
            '<option value="__custom__" style="color:#10b981;font-weight:700;border-top:1px solid rgba(255,255,255,0.1);">&#9998; Enter custom HSN (not in master)...</option>';
        if (currentVal) hsnSelect.value = currentVal;
    }

    // GST Select — Global Master rates only, zero browser memory
    if (gstSelect) {
        const currentVal = gstSelect.value;
        const masterGsts = (window.masters && window.masters.gst) ? window.masters.gst : [];
        let rates;
        if (masterGsts.length > 0) {
            rates = [...new Set(masterGsts.map(g => Math.round(Number(g.rate))))].sort((a, b) => a - b);
        } else {
            rates = [0, 5, 12, 18, 28]; // fallback standard Indian GST slabs
        }
        gstSelect.innerHTML = '<option value="">-- Select GST % --</option>' +
            rates.map(r => `<option value="${r}">${r}%</option>`).join('');
        // Default: use Company Settings GST rate (Banking & Finance block → set-gst-rate)
        const companyDefaultGst = (window.companyProfile && window.companyProfile.gstRate != null)
            ? String(Math.round(Number(window.companyProfile.gstRate)))
            : null;
        if (currentVal) {
            gstSelect.value = currentVal;
        } else if (companyDefaultGst && rates.includes(Number(companyDefaultGst))) {
            gstSelect.value = companyDefaultGst;
        }
    }
}

// HSN select change handler
function handleHsnSelectChange(selectEl) {
    const val = selectEl.value;
    const hsnHidden = document.getElementById('prod-hsn');
    const customRow = document.getElementById('prod-hsn-custom-row');
    const customInput = document.getElementById('prod-hsn-custom');
    const dupWarn = document.getElementById('hsn-dup-warn');

    if (val === '__custom__') {
        // Show custom text entry
        if (customRow) customRow.style.display = 'block';
        if (hsnHidden) hsnHidden.value = '';
        if (customInput) { customInput.value = ''; customInput.focus(); }
    } else {
        // Master entry selected: hide custom row, set hidden input
        if (customRow) customRow.style.display = 'none';
        if (hsnHidden) hsnHidden.value = val;
        if (customInput) customInput.value = '';
        if (dupWarn) dupWarn.style.display = 'none';
    }
}

function generateProductBarcode() {
    const code = document.getElementById('prod-internal-code').value || document.getElementById('prod-barcode').value;
    if (!code) return alert('Please ensure an internal code is assigned first.');
    if (typeof JsBarcode === 'undefined') return alert('Barcode library not loaded. Please check your internet connection.');
    document.getElementById('prod-barcode').value = code;
    const container = document.getElementById('barcode-svg-container');
    container.innerHTML = '<svg id="prod-barcode-svg"></svg>';
    try {
        JsBarcode('#prod-barcode-svg', code, {
            format: 'CODE128', width: 2, height: 65, displayValue: true,
            fontSize: 13, background: 'transparent', lineColor: '#e2e8f0',
            textMargin: 5, font: 'monospace'
        });
        const barcodeStatus = document.getElementById('barcode-status');
        if (barcodeStatus) barcodeStatus.innerHTML = 'CODE128 - <span style="font-family:monospace;color:var(--primary);">' + code + '</span>';
        const barcodePrintRow = document.getElementById('barcode-print-row');
        if (barcodePrintRow) barcodePrintRow.style.display = 'flex';
    } catch (e) {
        container.innerHTML = '<span style="font-size:0.7rem;color:#ef4444;">Barcode error: ' + e.message + '</span>';
    }
}

function printProductBarcode() {
    const code = (document.getElementById('prod-barcode').value || document.getElementById('prod-internal-code').value || '').trim();
    if (!code) return alert('No barcode generated. Click GEN first.');
    const name = (document.getElementById('prod-name').value || 'Product').trim();
    const mrp = (document.getElementById('prod-mrp').value || '').trim();
    const company = (window.companyProfile && window.companyProfile.name) ? window.companyProfile.name : 'EMYRIS BIOLIFESCIENCES';
    const safeCode = code.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    const safeName = name.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const safeCompany = company.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const safeMrp = mrp.replace(/</g, '&lt;');
    const w = window.open('', '_blank', 'width=520,height=520');
    w.document.write(`<!DOCTYPE html><html><head><title>Label</title>
<script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"><\/script>
<script src="https://cdn.jsdelivr.net/npm/qrious@4.0.2/dist/qrious.min.js"><\/script>
<style>
* { box-sizing: border-box; }
@media print { @page { margin: 5mm; } .no-print { display:none!important; } }
body { display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:100vh; background:#f5f5f5; margin:0; font-family:Arial,sans-serif; padding:16px; }
.no-print { margin-bottom:12px; }
.print-btn { padding:8px 22px; background:#8b5cf6; color:#fff; border:none; border-radius:7px; font-size:13px; font-weight:700; cursor:pointer; }
.label { border:1.5px solid #444; border-radius:6px; padding:10px 12px; display:flex; flex-direction:column; align-items:center; width:270px; background:#fff; gap:4px; }
.co { font-size:7.5pt; font-weight:900; text-transform:uppercase; letter-spacing:0.8px; color:#111; text-align:center; }
.nm { font-size:10pt; font-weight:800; text-align:center; color:#000; line-height:1.3; }
.codes-row { display:flex; align-items:center; justify-content:center; gap:8px; width:100%; margin:4px 0; }
.bc-col,.qr-col { display:flex; flex-direction:column; align-items:center; }
.bc-col { flex:1; }
.lbl { font-size:6pt; color:#888; margin-top:2px; }
.mrp { font-size:12pt; font-weight:900; color:#000; }
.cd { font-family:monospace; font-size:8pt; color:#555; }
.bsvg { max-width:170px; }
</style></head><body>
<div class="no-print"><button class="print-btn" onclick="window.print()">&#128424; PRINT LABEL</button></div>
<div class="label">
  <div class="co">${safeCompany}</div>
  <div class="nm">${safeName}</div>
  <div class="codes-row">
    <div class="bc-col"><svg id="bc" class="bsvg"></svg><div class="lbl">BARCODE</div></div>
    <div class="qr-col"><canvas id="qr" width="70" height="70"></canvas><div class="lbl">QR CODE</div></div>
  </div>
  ${safeMrp ? `<div class="mrp">MRP: &#8377;${safeMrp}</div>` : ''}
  <div class="cd">${safeCode}</div>
</div>
<script>
JsBarcode('#bc','${safeCode}',{format:'CODE128',width:2,height:45,displayValue:false,background:'#fff',lineColor:'#000',margin:2});
new QRious({element:document.getElementById('qr'),value:'${safeCode}',size:70,background:'#fff',foreground:'#000',padding:2});
<\/script></body></html>`);
    w.document.close();
}

function downloadBarcodeAsSVG() {
    const code = (document.getElementById('prod-barcode').value || document.getElementById('prod-internal-code').value || '').trim();
    if (!code) return alert('No barcode found. Click GEN first.');
    if (typeof JsBarcode === 'undefined') return alert('Barcode library not loaded.');
    // Re-render a fresh off-screen SVG with solid black bars (UI uses light color for dark mode)
    const tempSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    tempSvg.style.cssText = 'position:absolute;left:-9999px;top:-9999px;';
    document.body.appendChild(tempSvg);
    try {
        JsBarcode(tempSvg, code, {
            format: 'CODE128', width: 3, height: 80,
            displayValue: true, background: '#ffffff', lineColor: '#000000',
            fontSize: 14, margin: 10, font: 'Arial'
        });
        const blob = new Blob([tempSvg.outerHTML], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = code + '_barcode.svg';
        document.body.appendChild(a); a.click();
        document.body.removeChild(a); URL.revokeObjectURL(url);
    } catch(e) { alert('Download error: ' + e.message); }
    document.body.removeChild(tempSvg);
}

// --- BULK BARCODE PRINT ---
function openBulkBarcodeModal() {
    const modal = document.getElementById('bulk-barcode-modal');
    if (!modal) return;
    const tbody = document.getElementById('bulk-barcode-tbody');
    if (tbody) {
        const validProducts = allProducts.filter(p => p.internalCode || p.barcode);
        if (!validProducts.length) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:20px;color:var(--text-muted);">No products with barcodes/codes found. Add products first.</td></tr>';
        } else {
            tbody.innerHTML = validProducts.map((p, i) => `
            <tr style="border-bottom:1px solid rgba(255,255,255,0.05);">
                <td style="padding:7px 8px;"><input type="checkbox" id="bbc-${i}" value="${p._id}" checked class="bulk-barcode-check" style="width:15px;height:15px;cursor:pointer;"></td>
                <td style="padding:7px 8px;font-size:0.8rem;font-weight:600;color:#f8fafc;">${p.name.replace(/</g,'&lt;')}</td>
                <td style="padding:7px 8px;font-family:monospace;font-size:0.75rem;color:var(--primary);">${p.internalCode || p.barcode || '-'}</td>
                <td style="padding:7px 8px;font-size:0.8rem;color:#10b981;font-weight:700;">&#8377;${p.mrp || 0}</td>
                <td style="padding:7px 8px;"><input type="number" id="bbc-qty-${i}" value="1" min="1" max="100" style="width:58px;padding:4px 6px;font-size:0.75rem;text-align:center;background:rgba(0,0,0,0.4);border:1px solid rgba(255,255,255,0.15);border-radius:6px;color:#fff;"></td>
            </tr>`).join('');
        }
    }
    modal.classList.remove('hidden');
}

function closeBulkBarcodeModal() {
    const modal = document.getElementById('bulk-barcode-modal');
    if (modal) modal.classList.add('hidden');
}

function selectAllBulkBarcodes(checked) {
    document.querySelectorAll('.bulk-barcode-check').forEach(cb => cb.checked = checked);
}

function printBulkBarcodes() {
    const checks = document.querySelectorAll('.bulk-barcode-check:checked');
    if (!checks.length) return alert('Please select at least one product.');

    const company = (window.companyProfile && window.companyProfile.name) ? window.companyProfile.name : 'EMYRIS BIOLIFESCIENCES';
    const stickers = [];

    checks.forEach(cb => {
        const id = cb.value;
        const idx = cb.id.replace('bbc-', '');
        const qtyEl = document.getElementById('bbc-qty-' + idx);
        const qty = qtyEl ? (parseInt(qtyEl.value) || 1) : 1;
        const p = allProducts.find(x => String(x._id) === String(id));
        if (!p) return;
        const code = p.barcode || p.internalCode;
        if (!code) return;
        for (let j = 0; j < qty; j++) {
            stickers.push({ name: p.name, code, mrp: p.mrp || 0 });
        }
    });

    if (!stickers.length) return alert('No valid products with barcodes selected.');

    const safeCompany = company.replace(/</g, '&lt;').replace(/>/g, '&gt;');

    // Each sticker: 95mm wide x 67mm tall → 2 cols x 4 rows = 8 per A4 page
    const stickerHTML = stickers.map((s) => {
        const safeName = s.name.replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const safeCode = String(s.code).replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const qd = s.code.replace(/"/g, '&quot;');
        const mrpVal = (typeof s.mrp === 'number') ? s.mrp.toFixed(2) : String(s.mrp);
        return `<div class="sticker">
            <div class="co">${safeCompany}</div>
            <div class="nm">${safeName}</div>
            <div class="codes-row">
                <div class="bc-col"><svg class="bsvg" data-code="${qd}"></svg><div class="lbl">BARCODE</div></div>
                <div class="qr-col"><canvas class="qsvg" data-code="${qd}" width="60" height="60"></canvas><div class="lbl">QR</div></div>
            </div>
            <div class="foot-row"><span class="mrp">MRP: &#8377;${mrpVal}</span><span class="cd">${safeCode}</span></div>
        </div>`;
    }).join('');

    const pages = Math.ceil(stickers.length / 8);
    const w = window.open('', '_blank');
    w.document.write(`<!DOCTYPE html><html><head><title>Bulk Labels (${stickers.length})</title>
<script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"><\/script>
<script src="https://cdn.jsdelivr.net/npm/qrious@4.0.2/dist/qrious.min.js"><\/script>
<style>
* { box-sizing:border-box; margin:0; padding:0; }
@page { size:A4 portrait; margin:10mm; }
@media print {
    body { background:#fff!important; padding:0!important; }
    .hint { display:none!important; }
}
body { font-family:Arial,sans-serif; background:#eee; padding:10px; }
.hint { background:#fff; border-radius:8px; padding:12px 18px; margin-bottom:12px; display:flex; justify-content:space-between; align-items:center; box-shadow:0 1px 4px rgba(0,0,0,.1); }
.hint h3 { font-size:14px; color:#1e293b; margin:0 0 3px 0; }
.hint p { font-size:11px; color:#64748b; }
.pbtn { padding:8px 22px; background:#8b5cf6; color:#fff; border:none; border-radius:7px; font-size:13px; font-weight:700; cursor:pointer; }
.grid { display:grid; grid-template-columns:repeat(2, 95mm); gap:3mm; width:193mm; margin:0 auto; }
.sticker { width:95mm; height:67mm; border:1px dashed #aaa; background:#fff; padding:2.5mm 3mm; display:flex; flex-direction:column; align-items:center; justify-content:space-between; overflow:hidden; break-inside:avoid; page-break-inside:avoid; }
.co { font-size:6pt; font-weight:900; text-transform:uppercase; letter-spacing:0.5px; color:#000; text-align:center; width:100%; }
.nm { font-size:7.5pt; font-weight:800; color:#000; text-align:center; width:100%; line-height:1.2; overflow:hidden; max-height:18pt; }
.codes-row { display:flex; align-items:center; justify-content:center; gap:3mm; width:100%; flex:1; }
.bc-col { display:flex; flex-direction:column; align-items:center; flex:1; }
.qr-col { display:flex; flex-direction:column; align-items:center; flex-shrink:0; }
.bsvg { max-width:56mm; }
.qsvg { width:18mm!important; height:18mm!important; }
.lbl { font-size:5pt; color:#888; margin-top:1px; }
.foot-row { display:flex; justify-content:space-between; align-items:center; width:100%; padding:0 1mm; }
.mrp { font-size:9pt; font-weight:900; color:#000; }
.cd { font-family:monospace; font-size:6pt; color:#555; }
</style></head><body>
<div class="hint">
  <div><h3>&#127991;&#65039; ${stickers.length} label${stickers.length>1?'s':''} &mdash; ${pages} A4 page${pages>1?'s':''}</h3><p>2 &times; 4 grid (8 per page) &nbsp;&bull;&nbsp; Set printer margins to <b>None</b></p></div>
  <button class="pbtn" onclick="window.print()">&#128424;&#65039; PRINT NOW</button>
</div>
<div class="grid">${stickerHTML}</div>
<script>
document.querySelectorAll('.bsvg').forEach(function(el){
    var c=el.getAttribute('data-code');
    if(c){try{JsBarcode(el,c,{format:'CODE128',width:1.4,height:32,displayValue:false,background:'#fff',lineColor:'#000',margin:1});}catch(e){el.style.display='none';}}
});
document.querySelectorAll('.qsvg').forEach(function(canvas){
    var c=canvas.getAttribute('data-code');
    if(c){try{new QRious({element:canvas,value:c,size:60,background:'#fff',foreground:'#000',padding:1});}catch(e){canvas.style.display='none';}}
});
<\/script></body></html>`);
    w.document.close();
    closeBulkBarcodeModal();
}

// --- BULK PRODUCT UPLOAD ---
function downloadProductTemplate() {
    const headers = [
        ["Product Name*", "Manufacturer", "HSN Code", "Category", "Group", "Packing*", "Batch", "MRP*", "PTR", "PTS", "GST %*", "Qty Available", "Bonus Buy", "Bonus Get"]
    ];
    const ws = XLSX.utils.aoa_to_sheet(headers);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Products");
    XLSX.writeFile(wb, "Emyris_Product_Template.xlsx");
}

async function handleProductBulkUpload(input) {
    const file = input.files[0];
    if (!file) return;

    try {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        if (!jsonData.length) throw new Error("File is empty.");

        const products = jsonData.map(row => ({
            name: row["Product Name*"],
            manufacturer: row["Manufacturer"],
            hsn: row["HSN Code"],
            category: row["Category"],
            group: row["Group"],
            packing: row["Packing*"] || "N/A",
            batch: row["Batch"],
            mrp: Number(row["MRP*"] || 0),
            ptr: Number(row["PTR"] || 0),
            pts: Number(row["PTS"] || 0),
            gstPercent: Number(row["GST %*"] || 0),
            qtyAvailable: Number(row["Qty Available"] || 0),
            buy: Number(row["Bonus Buy"] || 0),
            get: Number(row["Bonus Get"] || 0)
        }));

        const res = await fetch(`${API_BASE}/admin/products/bulk`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ products })
        });

        const result = await res.json();
        if (result.success) {
            alert(`Bulk upload complete! Success: ${result.results.success}, Failed: ${result.results.failed}`);
            loadProducts();
        }
    } catch (e) { alert("Bulk upload failed: " + e.message); }
    input.value = '';
}

// --- BULK STOCKIST UPLOAD ---
function downloadStockistTemplate() {
    const headers = [
        ["Firm Name*", "Login ID*", "Password*", "Party Type (STOCKIST/SUPPLIER)", "Address", "City", "State", "Pincode", "Phone", "Email", "GSTIN", "PAN*", "DL No", "FSSAI No", "HQ", "Bank Name", "Bank Acc No", "IFSC Code"]
    ];
    const ws = XLSX.utils.aoa_to_sheet(headers);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Parties");
    XLSX.writeFile(wb, "Emyris_Party_Template.xlsx");
}

async function handleStockistBulkUpload(input) {
    const file = input.files[0];
    if (!file) return;

    try {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        if (!jsonData.length) throw new Error("File is empty.");

        const stockists = jsonData.map(row => ({
            name: row["Firm Name*"],
            loginId: row["Login ID*"],
            password: String(row["Password*"] || "emyris123"),
            partyType: (row["Party Type (STOCKIST/SUPPLIER)"] || "STOCKIST").toUpperCase(),
            address: row["Address"],
            city: row["City"],
            state: row["State"],
            pincode: row["Pincode"],
            phone: row["Phone"],
            email: row["Email"],
            gstNo: row["GSTIN"],
            panNo: row["PAN*"] || "N/A",
            dlNo: row["DL No"],
            fssaiNo: row["FSSAI No"],
            hq: row["HQ"],
            bankName: row["Bank Name"],
            bankAccountNo: row["Bank Acc No"],
            bankIfsc: row["IFSC Code"]
        }));

        const res = await fetch(`${API_BASE}/admin/stockists/bulk`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ stockists })
        });

        const result = await res.json();
        if (result.success) {
            alert(`Bulk upload complete! Success: ${result.results.success}, Failed: ${result.results.failed}`);
            loadStockists();
        }
    } catch (e) { alert("Bulk upload failed: " + e.message); }
    input.value = '';
}

// --- MASTERS & SETTINGS ---
window.masters = { categories: [], hsns: [], gst: [], groups: [] };



function renderMasterLists() {
    const render = (id, list, key, type) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.innerHTML = list.map(item => {
            const displayValue = key === 'code' ? `${item.code} ${item.description ? `(${item.description})` : ''}` : item[key];
            return `
                <div style="display:flex; justify-content:space-between; align-items:center; padding:8px; background:rgba(255,255,255,0.05); border-radius:8px; margin-bottom:5px; font-size:0.85rem;">
                    <span>${displayValue}</span>
                    <button style="background:none; border:none; color:#ef4444; cursor:pointer;" onclick="deleteMaster('${type}', '${item._id}')">✖</button>
                </div>
            `;
        }).join('');
    };
    render('master-cat-list', window.masters.categories, 'name', 'categories');
    render('master-group-list', window.masters.groups, 'name', 'groups');
    render('master-hsn-list', window.masters.hsns, 'code', 'hsns');
    // Ensure GST is displayed as integer
    const gstList = document.getElementById('master-gst-list');
    if (gstList && window.masters.gst) {
        gstList.innerHTML = window.masters.gst.map(item => `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:8px; background:rgba(255,255,255,0.05); border-radius:8px; margin-bottom:5px; font-size:0.85rem;">
                <span>${Math.round(item.rate)}%</span>
                <button style="background:none; border:none; color:#ef4444; cursor:pointer;" onclick="deleteMaster('gst', '${item._id}')">✖</button>
            </div>
        `).join('');
    }
    render('master-hq-list', window.masters.hq || [], 'name', 'hq');
    render('master-exp-cat-list', window.masters.expenseCategories || [], 'name', 'expense-categories');
}


async function addMaster(type) {
    let val = "";
    let body = {};
    let inputIds = [];

    if (type === 'categories') {
        val = document.getElementById('new-cat-name').value.trim().toUpperCase();
        body = { name: val };
        inputIds = ['new-cat-name'];
    } else if (type === 'groups') {
        val = document.getElementById('new-group-name').value.trim().toUpperCase();
        body = { name: val };
        inputIds = ['new-group-name'];
    } else if (type === 'hsns') {
        val = document.getElementById('new-hsn-code').value.trim();
        const desc = document.getElementById('new-hsn-desc').value.trim();
        body = { code: val, description: desc };
        inputIds = ['new-hsn-code', 'new-hsn-desc'];
    } else if (type === 'gst') {
        val = document.getElementById('new-gst-rate').value;
        body = { rate: Math.floor(Number(val)) };
        inputIds = ['new-gst-rate'];
    } else if (type === 'hq') {
        val = document.getElementById('new-hq-name').value.trim().toUpperCase();
        body = { name: val };
        inputIds = ['new-hq-name'];
    } else if (type === 'expenseCategories') {
        val = document.getElementById('new-exp-cat-name').value.trim();
        const eType = document.getElementById('new-exp-cat-type').value;
        body = { name: val, type: eType };
        inputIds = ['new-exp-cat-name'];
    }

    if (!val) return alert("Please enter a value");
    
    // Quick frontend duplicate check
    if (window.masters && window.masters[type]) {
        const exists = window.masters[type].some(item => {
            const key = type === 'hsns' ? 'code' : (type === 'gst' ? 'rate' : 'name');
            return String(item[key]).toUpperCase() === String(val).toUpperCase();
        });
        if (exists) return alert("This entry already exists in Masters.");
    }

    try {
        const apiType = type === 'expenseCategories' ? 'expense-categories' : type;
        const endpoint = `${API_BASE}/admin/${apiType}`;
        const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        const result = await res.json();
        if (res.ok && result.success) {
            // Clear input
            const inputId = type === 'categories' ? 'new-cat-name' : 
                           type === 'groups' ? 'new-group-name' :
                           type === 'hsns' ? 'new-hsn-code' : 
                           type === 'gst' ? 'new-gst-rate' : 'new-hq-name';
            const input = document.getElementById(inputId);
            if (input) input.value = '';
            loadMasters();
        } else {
            const detailStr = result.details && result.details.length ? ("\nDetails: " + result.details.join(", ")) : "";
            alert("Action Failed: " + (result.message || result.error || "Unknown error") + detailStr);
        }
    } catch (e) { alert("Operation failed."); }
}

async function deleteMaster(type, id) {
    if (!confirm("Delete this master entry?")) return;
    try {
        const apiType = type === 'expenseCategories' ? 'expense-categories' : type;
        const endpoint = `${API_BASE}/admin/${apiType}/${id}`;
        await fetch(endpoint, { method: 'DELETE' });
        loadMasters();
    } catch (e) { alert("Delete failed"); }
}



async function uploadInvoiceDesign() {
    const fileInput = document.getElementById('invoice-design-file');
    if (!fileInput.files.length) return alert("Please select a file first.");

    const formData = new FormData();
    formData.append('design', fileInput.files[0]);

    try {
        const res = await fetch('/api/admin/settings/upload-design', {
            method: 'POST',
            body: formData
        });
        const result = await res.json();
        if (result.success) {
            alert("📈 Reference Invoice Uploaded! We will use this to match your design.");
            loadSettings();
        } else {
            alert("Upload failed: " + result.error);
        }
    } catch (e) { alert("Upload error occurred."); }
}

async function uploadLogo() {
    const fileInput = document.getElementById('logo-file');
    if (!fileInput.files.length) return alert("Please select a logo file.");
    const formData = new FormData();
    formData.append('logo', fileInput.files[0]);
    try {
        const res = await fetch(`${API_BASE}/admin/upload-logo`, { method: 'POST', body: formData });
        const result = await res.json();
        if (result.success) {
            alert("🖼️ Logo uploaded successfully!");
            loadSettings();
        } else alert("Upload failed: " + result.error);
    } catch (e) { alert("Upload error."); }
}

async function uploadSignature() {
    const fileInput = document.getElementById('signature-file');
    if (!fileInput.files.length) return alert("Please select a signature file.");
    const formData = new FormData();
    formData.append('signature', fileInput.files[0]);
    try {
        const res = await fetch(`${API_BASE}/admin/upload-signature`, { method: 'POST', body: formData });
        const result = await res.json();
        if (result.success) {
            alert("✓ï¸ Signature uploaded successfully!");
            loadSettings();
        } else alert("Upload failed: " + result.error);
    } catch (e) { alert("Upload error."); }
}

function toggleMusic() {
    const audio = document.getElementById('bgMusic');
    const btn = document.getElementById('musicToggleAdmin');
    const text = document.getElementById('musicTextAdmin');
    
    if (!audio || !audio.src || audio.src.endsWith('/') || audio.src.includes('undefined')) {
        alert("⚠️ No music source found.\n\nIf you recently pushed code, your uploaded file may have been removed from the server. Please re-upload or use a permanent URL.");
        return;
    }


    if (audio.paused) {
        audio.volume = companyProfile.musicVolume || 0.5; 
        audio.play().then(() => {

            localStorage.setItem('emyris_music_on', 'true');
            btn.style.background = 'rgba(16, 185, 129, 0.1)';
            btn.style.borderColor = '#10b981';
            btn.style.color = '#10b981';
            btn.querySelector('span').innerText = '🔍Š';
            text.innerText = 'Music On';
        }).catch(err => {
            console.warn("Playback blocked by browser policy.");
        });
    } else {
        audio.pause();
        localStorage.setItem('emyris_music_on', 'false');
        btn.style.background = 'rgba(99, 102, 241, 0.1)';
        btn.style.borderColor = '#6366f1';
        btn.style.color = '#fff';
        btn.querySelector('span').innerText = '🔍‡';
        text.innerText = 'Music Off';
    }
}


async function uploadMedia(type) {
    const inputId = type === 'music' ? 'musicFile' : 'videoFile';
    const input = document.getElementById(inputId);
    if (!input.files || !input.files[0]) return alert("Please select a file first");

    const formData = new FormData();
    formData.append('media', input.files[0]);
    formData.append('type', type);

    try {
        const res = await fetch(`${API_BASE}/admin/upload-media`, {
            method: 'POST',
            body: formData
        });
        const result = await res.json();
        if (result.success) {
            alert(`✅ ${type.toUpperCase()} uploaded successfully!`);
            loadSettings();
        } else {
            alert("Upload failed: " + result.message);
        }
    } catch (e) { alert("Upload failed"); }
}

function updateLocalVolume(val) {
    const audio = document.getElementById('bgMusic');
    if (audio) audio.volume = val;
    if (document.getElementById('volumePercent')) document.getElementById('volumePercent').innerText = `${Math.round(val * 100)}%`;
}

function testMedia(type) {
    const urlInput = type === 'music' ? 'set-music-url' : 'set-video-url';
    let url = document.getElementById(urlInput).value.trim();
    if (!url) return alert("Please paste a link first");

    // Auto-fix Drive Link
    if (url.includes('drive.google.com') && url.includes('/d/')) {
        const parts = url.split('/d/');
        if (parts.length > 1) {
            const id = parts[1].split('/')[0];
            url = `https://drive.google.com/uc?export=download&id=${id}`;
            document.getElementById(urlInput).value = url;
        }
    }

    // Auto-fix Dropbox Link
    if (url.includes('dropbox.com') && url.includes('dl=0')) {
        url = url.replace('dl=0', 'raw=1');
        document.getElementById(urlInput).value = url;
    }

    if (type === 'music') {
        let audio = document.getElementById('bgMusic');
        if (!audio) {
            audio = document.createElement('audio');
            audio.id = 'bgMusic';
            document.body.appendChild(audio);
        }
        
        audio.pause();
        audio.removeAttribute('src'); // Clear previous source
        audio.load();
        
        audio.crossOrigin = "anonymous";
        audio.src = url;
        audio.volume = 1.0;
        
        console.log("🧪 [TEST] Force testing link:", url);
        
        audio.play()
            .then(() => alert("🎵 Music test started successfully! System is working!"))
            .catch(e => {
                console.error("❌ Test failed:", e);
                alert(`❌ Playback failed.\n\nMessage: ${e.message}\n\nTIP: Ensure your Dropbox/Drive file is "Shared to Anyone". If it still fails, the file might be too large for direct streaming.`);
            });
    } else {
        alert("📈¹ Video test: Save settings and check the Landing Page.");
    }
}

// --- MEDIA LIBRARY LOGIC ---

async function toggleMediaLibrary() {
    const explorer = document.getElementById('media-library-explorer');
    explorer.classList.toggle('hidden');
    if (!explorer.classList.contains('hidden')) {
        await fetchMediaLibrary();
    }
}

async function fetchMediaLibrary() {
    const list = document.getElementById('media-library-list');
    list.innerHTML = '<p style="color: var(--accent);">⏳ Loading library...</p>';
    
    try {
        const res = await fetch(`${API_BASE}/admin/media`);
        const media = await res.json();
        
        if (!media.length) {
            list.innerHTML = '<p style="color: var(--text-muted); font-size:0.7rem;">Library is empty. Upload files to see them here.</p>';
            return;
        }

        list.innerHTML = media.map(item => `
            <div class="glass-card" style="padding: 10px; border: 1px solid rgba(255,255,255,0.05); background: rgba(0,0,0,0.2);">
                <div style="font-size: 0.6rem; color: var(--accent); font-weight: 800; margin-bottom: 5px;">${item.type.toUpperCase()}</div>
                <div style="font-size: 0.75rem; color: #fff; margin-bottom: 8px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${item.name}">
                    ${item.name}
                </div>
                <div style="margin-bottom: 8px;">
                    <input type="text" readonly value="${item.url}" style="width:100%; font-size:0.6rem; background:rgba(0,0,0,0.3); border:1px solid var(--glass-border); color:var(--accent); padding:2px 5px; border-radius:4px;" onclick="this.select(); document.execCommand('copy'); alert('Link Copied!')">
                </div>
                <div style="display: flex; gap: 5px;">
                    <button class="btn btn-primary" style="flex:1; padding: 4px; font-size: 0.6rem;" onclick="selectFromLibrary('${item.url}', '${item.type}')">ACTIVATE</button>
                    <button class="btn btn-ghost" style="padding: 4px; font-size: 0.6rem; color: #ef4444;" onclick="deleteFromMedia('${item._id}')">🗑️</button>
                </div>
            </div>
        `).join('');
    } catch (e) { list.innerHTML = '<p style="color: #ef4444;">Error loading library.</p>'; }
}

function selectFromLibrary(url, type) {
    let inputId = '';
    if (type === 'music') inputId = 'set-music-url';
    else if (type === 'video') inputId = 'set-video-url';
    else if (type === 'document') inputId = 'invoice-design-file';

    if (inputId && document.getElementById(inputId)) {
        if (type === 'document') {
            companyProfile.referenceInvoiceUrl = url;
            const designBadge = document.getElementById('design-status-badge');
            if (designBadge) designBadge.innerHTML = '<span class="badge badge-approved" style="font-size:0.6rem;">READY (FROM LIBRARY)</span>';
            const designLink = document.getElementById('design-preview-link');
            if (designLink) designLink.innerHTML = `<a href="${url}" target="_blank" style="color:var(--accent); text-decoration:none;">📈„ View Selected Blueprint</a>`;
            alert(`✅ BLUEPRINT selected from library! Click SAVE ALL CHANGES below to finalize.`);
        } else {
            document.getElementById(inputId).value = url;
            alert(`✅ ${type.toUpperCase()} link updated from library! Click SAVE to apply.`);
        }
    }
}

async function deleteFromMedia(id) {
    if (!confirm("Are you sure you want to remove this file from your library?")) return;
    try {
        const res = await fetch(`${API_BASE}/admin/media/${id}`, { method: 'DELETE' });
        if (res.ok) await fetchMediaLibrary();
    } catch (e) { alert("Delete failed"); }
}




function convertLogoToBase64(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('set-logo-b64').value = e.target.result;
            document.getElementById('logo-preview').src = e.target.result;
            document.getElementById('logo-preview').style.display = 'block';
        };
        reader.readAsDataURL(input.files[0]);
    }
}

function convertQRToBase64(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('set-qr-b64').value = e.target.result;
            document.getElementById('qr-preview').src = e.target.result;
            document.getElementById('qr-preview').style.display = 'block';
        };
        reader.readAsDataURL(input.files[0]);
    }
}

// --- PARTY MASTER LOGIC ---

function convertSignatureToBase64(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('set-signature-b64').value = e.target.result;
            document.getElementById('sig-preview').src = e.target.result;
            document.getElementById('sig-preview').style.display = 'block';
        };
        reader.readAsDataURL(input.files[0]);
    }
}

function convertLogoToBase64(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('set-logo-b64').value = e.target.result;
            document.getElementById('logo-preview').src = e.target.result;
            document.getElementById('logo-preview').style.display = 'block';
        };
        reader.readAsDataURL(input.files[0]);
    }
}


function renderStockists(list = null) {
    const tbody = document.getElementById('stockistTableBody');
    if (!tbody) return;

    const data = list || allStockists;

    // Update Party Stats
    const totalEl = document.getElementById('stat-total-parties');
    if (totalEl) {
        totalEl.innerText = allStockists.length;
        document.getElementById('stat-total-stockists').innerText = allStockists.filter(s => (s.partyType || 'STOCKIST') === 'STOCKIST').length;
        document.getElementById('stat-total-suppliers').innerText = allStockists.filter(s => s.partyType === 'SUPPLIER').length;
        document.getElementById('stat-pending-approval').innerText = allStockists.filter(s => !s.approved).length;
    }

    tbody.innerHTML = data.map(s => `
        <tr>
            <td style="font-weight:600; color:#fff;">${s.name}</td>
            <td style="font-size:0.75rem; font-weight:700; color:var(--primary);">${s.partyType || 'STOCKIST'}</td>
            <td>${s.phone || '-'}</td>
            <td style="font-size:0.7rem; font-weight:800; color:#f59e0b;">${s.hq || '-'}</td>
            <td style="text-align:right; font-weight:700; color:${(s.outstandingBalance || 0) < 0 ? '#ef4444' : '#10b981'}; font-family:monospace;">₹${(s.outstandingBalance || 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
            <td><span class="badge ${s.approved ? 'badge-approved' : 'badge-pending'}" style="font-size:0.6rem;">${s.approved ? 'APPROVED' : 'PENDING'}</span></td>
            <td style="text-align:right; white-space:nowrap;">
                <button class="btn btn-ghost" style="padding:6px 12px; font-size: 0.65rem; color:var(--primary);" onclick="viewLedger('${s._id}')">LEDGER</button>
                <button class="btn ${s.approved ? 'btn-ghost' : 'btn-primary'}" style="padding:6px 12px; font-size: 0.65rem; ${s.approved ? '' : 'background:var(--accent);'}" onclick="openPartyModal('${s._id}')">
                    ${s.approved ? 'EDIT' : 'VERIFY & APPROVE'}
                </button>
                <button class="btn btn-ghost" style="padding:6px 12px; font-size: 0.65rem; color:#ef4444;" onclick="deleteStockist('${s._id}')">DELETE</button>
            </td>
        </tr>

    `).join('');
}

function filterStockists(query) {
    const q = query.toLowerCase().trim();
    if (!q) {
        renderStockists(allStockists);
        return;
    }
    const filtered = allStockists.filter(s => 
        s.name.toLowerCase().includes(q) || 
        (s.city && s.city.toLowerCase().includes(q)) ||
        (s.loginId && s.loginId.toLowerCase().includes(q))
    );
    renderStockists(filtered);
}

function clearStockistSearch() {
    document.getElementById('stockistSearch').value = '';
    renderStockists(allStockists);
}

function openPartyModal(id = null) {
    const modal = document.getElementById('partyModal');
    const form = document.getElementById('partyForm');
    if(!modal || !form) return;

    form.reset();
    document.getElementById('party-id').value = id || '';
    
    if (id) {
        const s = (allStockists || []).find(x => (x._id == id || x.id == id));
        if (s) {
            document.getElementById('party-name').value = s.name || '';
            document.getElementById('party-type').value = s.partyType || 'STOCKIST';
            document.getElementById('party-login').value = s.loginId || '';
            document.getElementById('party-pass').value = s.password || '';
            document.getElementById('party-email').value = s.email || '';
            document.getElementById('party-limit').value = s.creditLimit || 50000;
            document.getElementById('party-balance').value = s.outstandingBalance || 0;
            document.getElementById('party-pan').value = s.panNo || '';
            document.getElementById('party-gst').value = s.gstNo || '';
            document.getElementById('party-dl').value = s.dlNo || '';
            document.getElementById('party-fssai').value = s.fssaiNo || '';
            document.getElementById('party-city').value = s.city || '';
            document.getElementById('party-state').value = s.state || '';
            document.getElementById('party-phone').value = s.phone || '';
            document.getElementById('party-address').value = s.address || '';
            document.getElementById('party-pincode').value = s.pincode || '';
            document.getElementById('party-hq').value = s.hq || '';
            document.getElementById('party-bank-name').value = s.bankName || '';
            document.getElementById('party-bank-acc').value = s.bankAccountNo || '';
            document.getElementById('party-bank-ifsc').value = s.bankIfsc || '';

            // Dynamic Header & Button for Approval
            if (!s.approved) {
                document.getElementById('party-modal-subtitle').innerText = "NEW REGISTRATION";
                document.getElementById('party-modal-title').innerText = "📈‹ Verify & Approve Stockist";
                document.getElementById('btn-save-party').innerText = "SAVE & APPROVE";
                document.getElementById('btn-save-party').style.background = "var(--accent)";
            } else {
                document.getElementById('party-modal-subtitle').innerText = "GLOBAL MASTER";
                document.getElementById('party-modal-title').innerText = "🤝 Update Party Record";
                document.getElementById('btn-save-party').innerText = "UPDATE RECORD";
                document.getElementById('btn-save-party').style.background = "var(--primary)";
                
                // Show Order Button for approved parties
                const orderBtn = document.getElementById('btn-party-order');
                if (orderBtn) orderBtn.style.display = 'inline-flex';
            }
        }
    } else {
        document.getElementById('party-modal-subtitle').innerText = "GLOBAL MASTER";
        document.getElementById('party-modal-title').innerText = "🤝 Create New Party";
        document.getElementById('btn-save-party').innerText = "SAVE PARTY";
        document.getElementById('btn-save-party').style.background = "var(--primary)";
        
        // Auto-generate credentials for new party
        const randomId = 'EMY' + Math.floor(100000 + Math.random() * 900000);
        const randomPass = Math.random().toString(36).slice(-8).toUpperCase();
        document.getElementById('party-login').value = randomId;
        document.getElementById('party-pass').value = randomPass;

        // Hide Order Button for new/pending parties
        const orderBtn = document.getElementById('btn-party-order');
        if (orderBtn) orderBtn.style.display = 'none';
    }
    modal.classList.remove('hidden');
}

function regeneratePartyCreds(type) {
    if (type === 'id' || !type) {
        document.getElementById('party-login').value = 'EMY' + Math.floor(100000 + Math.random() * 900000);
    }
    if (type === 'pass' || !type) {
        document.getElementById('party-pass').value = Math.random().toString(36).slice(-8).toUpperCase();
    }
}

function closePartyModal() {
    document.getElementById('partyModal').classList.add('hidden');
}

async function saveParty(e) {
    e.preventDefault();
    const id = safeGetVal('party-id');
    const hq = safeGetVal('party-hq');

    // Enforce HQ Selection
    if (!hq) {
        return alert("❌ ACTION REQUIRED: Please assign a Headquarter (HQ) for this party before saving/approving.");
    }

    const data = {
        name: safeGetVal('party-name'),
        partyType: safeGetVal('party-type'),
        loginId: safeGetVal('party-login'),
        password: safeGetVal('party-pass'),
        email: safeGetVal('party-email'),
        creditLimit: Number(safeGetVal('party-limit')),
        outstandingBalance: Number(safeGetVal('party-balance')),
        panNo: safeGetVal('party-pan'),
        gstNo: safeGetVal('party-gst'),
        dlNo: safeGetVal('party-dl'),
        fssaiNo: safeGetVal('party-fssai'),
        city: safeGetVal('party-city'),
        state: safeGetVal('party-state'),
        phone: safeGetVal('party-phone'),
        address: safeGetVal('party-address'),
        pincode: safeGetVal('party-pincode'),
        hq: hq,
        bankName: safeGetVal('party-bank-name'),
        bankAccountNo: safeGetVal('party-bank-acc'),
        bankIfsc: safeGetVal('party-bank-ifsc'),
        approved: true 
    };

    const url = id ? `${API_BASE}/admin/stockists/${id}` : `${API_BASE}/admin/stockists`;
    const method = id ? 'PUT' : 'POST';

    try {
        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await res.json();
        if (result.success) {
            alert("✅ Party record saved and activated!");
            closePartyModal();
            await loadStockists();
            // If direct sale modal is open, refresh its dropdown and select the new party
            if (!document.getElementById('directSaleModal').classList.contains('hidden')) {
                // Try to find the new party ID from the list if result.data is not provided
                let newId = result.data ? result.data._id : (allStockists[allStockists.length-1]?._id);
                refreshSaleParties(newId);
            }
        } else {
            alert("Save failed: " + (result.message || "Unknown error"));
        }
    } catch (e) { alert("Error saving party record."); }
}


function closeStockistModal() {
    document.getElementById('partyModal').classList.add('hidden');
}

function exportParties() {
    const data = allStockists.map(s => ({
        "Party Name": s.name,
        "Type": s.partyType || 'STOCKIST',
        "Login ID": s.loginId,
        "Email": s.email || '-',
        "Phone": s.phone || '-',
        "City": s.city || '-',
        "State": s.state || '-',
        "GST No": s.gstNo || '-',
        "PAN No": s.panNo || '-',
        "DL No": s.dlNo || '-',
        "FSSAI No": s.fssaiNo || '-',
        "Bank": s.bankName || '-',
        "Acc No": s.bankAccountNo || '-',
        "IFSC": s.bankIfsc || '-',
        "Outstanding": s.outstandingBalance
    }));
    downloadExcel(data, "Emyris_Party_Master");
}

async function approveStockist(id) {
    // Removed confirm() for better automation and faster workflow
    try {
        console.log("Attempting approval for ID:", id);
        const res = await fetch(`${API_BASE}/admin/stockists/${id}/approve`, { method: 'PUT' });
        const result = await res.json();
        if (result.success) {
            console.log("Approval Success:", result.stockist.name);
            alert("Stockist approved successfully!");
            loadStockists();
        } else {
            alert("Approval failed: " + result.message);
        }
    } catch (e) { 
        console.error("Approval error:", e);
        alert("Approval failed."); 
    }
}

async function deleteStockist(id) {
    if (!confirm("Are you sure you want to delete this stockist record?")) return;
    try {
        const res = await fetch(`${API_BASE}/admin/stockists/${id}`, { method: 'DELETE' });
        const result = await res.json();
        if (result.success) {
            alert("Stockist record deleted.");
            loadStockists();
        }
    } catch (e) { alert("Delete failed."); }
}

async function deleteAllStockists() {
    const code = prompt("Type 'DELETE ALL' to confirm wiping all stockist records from the database:");
    if (code !== 'DELETE ALL') return;
    
    try {
        const res = await fetch(`${API_BASE}/admin/stockists-bulk/all`, { method: 'DELETE' });
        const result = await res.json();
        if (result.success) {
            alert(result.message);
            loadStockists();
        }
    } catch (e) { alert("Master delete failed."); }
}

function logout() {
    sessionStorage.removeItem('admin_logged');
    window.location.reload();
}

// --- ORDER HISTORY LOGIC ---
function renderOrderHistory(filter = '') {
    const tbody = document.getElementById('orderHistoryBody');
    if (!tbody) return;
    
    let filtered = allOrders;
    if (filter) {
        filtered = allOrders.filter(o => 
            o.orderNo.toLowerCase().includes(filter.toLowerCase()) || 
            (o.stockist && o.stockist.name.toLowerCase().includes(filter.toLowerCase()))
        );
    }

    tbody.innerHTML = filtered.map(o => `
        <tr>
            <td style="font-family:monospace; font-weight:700; color:var(--primary); cursor:pointer;" onclick="viewOrderDetails('${o._id}')">${o.orderNo}</td>
            <td style="font-weight:600;">${o.stockist ? o.stockist.name : 'Unknown'}</td>
            <td>${new Date(o.createdAt).toLocaleDateString('en-GB')}</td>
            <td style="text-align:center;">${o.items.length}</td>
            <td style="text-align:right; font-weight:700;">₹${(o.grandTotal || 0).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
            <td style="text-align:center;"><span class="badge ${(o.status || 'pending') === 'approved' ? 'badge-approved' : ((o.status || 'pending') === 'invoiced' ? 'badge-approved' : ((o.status || 'pending') === 'rejected' ? 'badge-pending' : 'badge-pending'))}" style="${(o.status || 'pending') === 'rejected' ? 'background:#ef4444; color:#fff;' : ((o.status || 'pending') === 'invoiced' ? 'background:var(--accent); color:#fff;' : '')}">${(o.status || 'PENDING').toUpperCase()}</span></td>
            <td style="text-align:right;">
                <button class="btn btn-ghost" style="padding:6px 12px; font-size: 0.65rem; color:var(--primary);" onclick="viewOrderDetails('${o._id}')">VIEW ORDER</button>
            </td>
        </tr>
    `).join('');
}

function filterOrderHistory(val) {
    renderOrderHistory(val);
}

function viewOrderDetails(id) {
    try {
    const o = allOrders.find(x => x._id == id);
    if (!o) return;

    document.getElementById('detail-order-no').innerText = `Order #${o.orderNo}`;
    document.getElementById('detail-date').innerText = `Placed on ${new Date(o.createdAt).toLocaleString('en-GB')}`;
    document.getElementById('detail-stockist-name').innerText = o.stockist ? o.stockist.name : 'Unknown';
    // Removed detail-stockist-code as it's not in the new strip layout
    
    const statusEl = document.getElementById('detail-status');
    const status = o.status || 'pending';
    statusEl.innerText = status.toUpperCase();
    statusEl.style.background = status === 'approved' ? '#10b981' : (status === 'invoiced' ? 'var(--accent)' : (status === 'rejected' ? '#ef4444' : '#f59e0b'));
    statusEl.style.color = '#fff';

    const itemsBody = document.getElementById('detail-items-body');
    itemsBody.innerHTML = o.items.map(item => {
        const isNegotiated = item.askingRate && item.askingRate !== item.masterRate;
        
        const pId = item.productId || item.product; // Handle both mapping variants
        const p = allProducts.find(pr => (pr._id || pr.id) == pId) || { batches: [] };
        let batchCellHtml = '';
        if (o.status === 'pending') {
            const reqQty = (item.qty || 0) + (item.bonusQty || 0);
            const availableBatches = [...(p.batches || [])]
                .filter(b => b.qtyAvailable > 0)
                .sort((a, b) => new Date(a.expDate || '2099') - new Date(b.expDate || '2099'));

            let defaultBatch = availableBatches.length > 0 ? availableBatches[0].batchNo : '';
            for (let b of availableBatches) {
                if (b.qtyAvailable >= reqQty) { defaultBatch = b.batchNo; break; }
            }
            let batchOptions = availableBatches.map(b => 
                `<option value="${b.batchNo}" ${b.batchNo === defaultBatch ? 'selected' : ''}>${b.batchNo} (Exp:${b.expDate}|Qty:${b.qtyAvailable})</option>`
            ).join('');
            if (!batchOptions) batchOptions = `<option value="">No Stock</option>`;
            batchCellHtml = `<select id="batch-${o._id}-${item._id}" class="batch-select" style="width: 100%; background: rgba(0,0,0,0.2); border: 1px solid var(--accent); color: var(--accent); border-radius: 4px; padding: 4px; font-size: 0.75rem;">${batchOptions}</select>`;
        } else {
            batchCellHtml = `<div><span style="font-weight: 700; color: var(--accent);">${item.batch || 'N/A'}</span><br/><span style="font-size: 0.6rem; color: #94a3b8; font-weight: 600;">Exp: ${item.expDate || item.exp || '-'}</span></div>`;
        }

        return `
            <tr style="transition: all 0.2s; border-bottom: 1px solid rgba(255,255,255,0.03);">
                <td style="position: sticky; left: 0; z-index: 5; background: #0f172a; font-weight: 700; color: #f1f5f9; border-right: 1px solid rgba(255,255,255,0.05); font-size: 0.75rem;">${item.name}</td>
                <td style="text-align:center;">${batchCellHtml}</td>
                <td style="text-align:right; color:var(--text-muted); opacity: 0.8; font-family: monospace;">₹${Number(item.masterRate || item.priceUsed || 0).toFixed(2)}</td>
                <td style="text-align:right; font-weight:700; color:${isNegotiated ? '#ef4444' : '#fff'}; font-family: monospace;">₹${Number(item.askingRate || item.priceUsed || 0).toFixed(2)}</td>
                <td style="text-align:center; font-style:italic; font-size:0.7rem; color: #94a3b8; line-height: 1.2;">${item.negotiationNote || '-'}</td>
                <td style="text-align:center;">
                    <input type="number" step="0.01" class="final-rate-input" id="rate-${o._id}-${item._id}" 
                        value="${Number(item.priceUsed || 0).toFixed(2)}" 
                        oninput="updateModalTotals('${o._id}', '${item._id}')"
                        style="width: 70px; background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(99, 102, 241, 0.3); border-radius: 6px; color: var(--accent); font-weight: 800; text-align: center; padding: 3px; font-size: 0.75rem;">
                </td>
                <td style="text-align:center; font-weight:800; color: #fff;">${item.qty || 0}</td>
                <td style="text-align:center; color:var(--accent); font-weight:800; font-size: 0.75rem;">+${item.bonusQty || 0}</td>
                <td style="text-align:right; font-weight:900; color:var(--primary); font-size: 0.85rem; font-family: monospace;" id="linetotal-${o._id}-${item._id}">₹${Number(item.totalValue || 0).toFixed(2)}</td>
                <td style="text-align:center;">
                    ${o.status === 'pending' ? `
                        <div style="display:flex; gap:4px; justify-content:center;">
                            <button class="btn" style="padding:4px 6px; font-size:0.55rem; background: rgba(239, 68, 68, 0.1); color:#ef4444; border: 1px solid rgba(239, 68, 68, 0.2); font-weight: 800;" onclick="negotiateItem('${o._id}', '${item._id}', 'reject', this)" title="Revert to Master">REJ</button>
                            <button class="btn" style="padding:4px 6px; font-size:0.55rem; background: rgba(99, 102, 241, 0.1); color:var(--primary); border: 1px solid rgba(99, 102, 241, 0.2); font-weight: 800;" onclick="negotiateItem('${o._id}', '${item._id}', 'onetime', this)" title="Apply for this order only">1-T</button>
                            <button class="btn" style="padding:4px 6px; font-size:0.55rem; background: rgba(16, 185, 129, 0.1); color:#10b981; border: 1px solid rgba(16, 185, 129, 0.2); font-weight: 800;" onclick="negotiateItem('${o._id}', '${item._id}', 'month', this)" title="Lock for 1 Month">MON</button>
                            <button class="btn" style="padding:4px 6px; font-size:0.55rem; background: var(--accent); color:#fff; font-weight: 800;" onclick="negotiateItem('${o._id}', '${item._id}', 'year', this)" title="Lock for 1 Year">YRE</button>
                        </div>
                    ` : '<span style="font-size:0.65rem; font-weight: 900; color:var(--text-muted); letter-spacing: 0.5px;">LOCKED</span>'}
                </td>
            </tr>
        `;
    }).join('');

    const safeSubTotal = Number(o.subTotal || 0);
    const safeGstAmount = Number(o.gstAmount || 0);
    const safeGrandTotal = Number(o.grandTotal || 0);

    const unroundedTotal = Number((safeSubTotal + safeGstAmount).toFixed(2));
    const roundOffValue = (safeGrandTotal - unroundedTotal).toFixed(2);

    if (document.getElementById('detail-subtotal')) document.getElementById('detail-subtotal').innerText = `₹${safeSubTotal.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    if (document.getElementById('detail-gst')) document.getElementById('detail-gst').innerText = `₹${safeGstAmount.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    if (document.getElementById('detail-roundoff')) document.getElementById('detail-roundoff').innerText = `₹${roundOffValue}`;
    if (document.getElementById('detail-total')) document.getElementById('detail-total').innerText = `₹${safeGrandTotal.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;

    // Update Strip
    if (document.getElementById('strip-order-count')) document.getElementById('strip-order-count').innerText = o.items.length;
    if (document.getElementById('strip-order-subtotal')) document.getElementById('strip-order-subtotal').innerText = `₹${safeSubTotal.toLocaleString('en-IN', {minimumFractionDigits: 2})}`;
    if (document.getElementById('strip-order-gst')) document.getElementById('strip-order-gst').innerText = `₹${safeGstAmount.toLocaleString('en-IN', {minimumFractionDigits: 2})}`;
    if (document.getElementById('strip-order-roundoff')) document.getElementById('strip-order-roundoff').innerText = `₹${roundOffValue}`;
    if (document.getElementById('strip-order-total')) document.getElementById('strip-order-total').innerText = `₹${safeGrandTotal.toLocaleString('en-IN', {minimumFractionDigits: 2})}`;

    const rejectBtn = document.getElementById('detail-reject-btn');
    const approveBtn = document.getElementById('detail-approve-btn');
    const deleteBtn = document.getElementById('detail-delete-btn');

    if (o.status === 'pending') {
        approveBtn.classList.remove('hidden');
        approveBtn.onclick = () => {
            if(confirm("Approve this order for billing?")) {
                approveOrder(o._id);
                closeOrderModal();
            }
        };

        rejectBtn.classList.remove('hidden');
        rejectBtn.onclick = () => {
            if(confirm("Reject this order? It will be marked as REJECTED for the stockist.")) {
                rejectOrder(o._id);
                closeOrderModal();
            }
        };
    } else {
        approveBtn.classList.add('hidden');
        rejectBtn.classList.add('hidden');
    }

    // Invoice Buttons logic
    const invoiceBtn = document.getElementById('detail-invoice-btn');
    const downloadBtn = document.getElementById('detail-download-btn');
    const editBtn = document.getElementById('detail-edit-btn');
    const invNoEl = document.getElementById('detail-invoice-no');
    
    const inv = allInvoices.find(i => (i.orderId || i.order?._id || i.order) == o._id);

    if (inv) {
        invNoEl.innerText = inv.invoiceNo;
        invNoEl.style.color = 'var(--accent)';
    } else {
        invNoEl.innerText = 'N/A';
        invNoEl.style.color = 'var(--text-muted)';
    }

    if (o.status === 'approved') {
        invoiceBtn.style.display = 'inline-flex';
        invoiceBtn.onclick = () => generateInvoice(o._id);
        downloadBtn.style.display = 'none';
        editBtn.style.display = 'none';
    } else if (o.status === 'invoiced') {
        invoiceBtn.style.display = 'none';
        downloadBtn.style.display = 'inline-flex';
        editBtn.style.display = 'inline-flex';
        if (inv) {
            downloadBtn.onclick = () => downloadInvoicePDF(inv._id);
            editBtn.onclick = () => openOrderEditMode(o._id);
        }
    } else {
        invoiceBtn.style.display = 'none';
        downloadBtn.style.display = 'none';
        editBtn.style.display = 'none';
    }

    deleteBtn.innerText = 'CANCEL RECORD';
    deleteBtn.onclick = () => {
        if (confirm(`⚠️ POLICY: Are you sure you want to CANCEL this record? Inventory will be restored, but the document number will be preserved for audit.`)) {
            cancelInvoice(o._id);
            closeOrderModal();
        }
    };

    // HQ Assignment / Display Logic
    const hqSelection = document.getElementById('hq-selection-container');
    const hqDisplay = document.getElementById('hq-display-container'); // Might be null in new strip
    const hqSelect = document.getElementById('detail-hq-select');
    const hqName = document.getElementById('detail-hq-name');

    if (o.stockist && o.stockist.hq) {
        if (hqSelection) hqSelection.classList.add('hidden');
        if (hqDisplay) hqDisplay.classList.remove('hidden');
        if (hqName) hqName.innerText = o.stockist.hq;
    } else if (o.status === 'pending') {
        if (hqSelection) hqSelection.classList.remove('hidden');
        if (hqDisplay) hqDisplay.classList.add('hidden');
        // Populate hqSelect from window.masters.hq
        if (hqSelect) hqSelect.innerHTML = '<option value="">-- Select Headquarters --</option>' + 
            (window.masters.hq || []).map(h => `<option value="${h.name}">${h.name}</option>`).join('');
    } else {
        if (hqSelection) hqSelection.classList.add('hidden');
        if (hqDisplay) hqDisplay.classList.add('hidden');
    }

    document.getElementById('orderDetailModal').classList.remove('hidden');
    } catch (err) {
        console.error("Critical error in viewOrderDetails:", err);
        alert("⚠️ Failed to load order details. Please check console for errors.");
        // Attempt to open anyway if modal ID exists
        if (document.getElementById('orderDetailModal')) document.getElementById('orderDetailModal').classList.remove('hidden');
    }
}

// Variables moved to top

function openOrderEditMode(orderId) {
    const o = allOrders.find(x => x._id == orderId);
    if (!o) return;
    const inv = allInvoices.find(i => (i.orderId || i.order?._id || i.order) == o._id);
    if (!inv) return alert("Invoice record not found for this order.");

    closeOrderModal();
    
    // Set Edit Mode flags
    isEditMode = true;
    editingInvoiceId = inv._id;

    // Reset and Populate directSaleItems
    directSaleItems = inv.items.map(item => ({
        product: item.productId || item.product,
        name: item.name,
        batch: item.batch,
        hsn: item.hsn,
        expDate: item.expDate || item.exp || item.expiry || '',
        mrp: item.mrp,
        ptr: item.ptr,
        qty: item.qty,
        free: item.bonusQty || item.free || 0,
        rate: item.priceUsed || item.rate,
        gstPercent: item.gstPercent,
        totalValue: (item.qty || 0) * (item.priceUsed || item.rate || 0)
    }));

    // Open Modal (Preserving the flags we just set)
    const type = o.channel === 'ONLINE' ? 'ONLINE' : 'DIRECT';
    openDirectSaleModal(type, true);

    // Override Header Title and Submit Button
    const modalTitle = document.getElementById('sale-modal-title');
    const submitBtn = document.querySelector('#directSaleModal button[type="submit"]');
    
    if (modalTitle) modalTitle.innerText = `Edit Invoiced Sale [${inv.invoiceNo}]`;
    if (submitBtn) submitBtn.innerText = '💡¾ SAVE UPDATES (NO COUNTER CHANGE)';

    // Populate Header Fields
    const partySelect = document.getElementById('sale-party');
    if (partySelect) {
        partySelect.value = o.stockistId || (o.stockist ? o.stockist._id : '');
        document.getElementById('sale-party-search').value = o.stockist ? o.stockist.name : 'Unknown';
    }
    
    safeSetVal('sale-date', inv.createdAt ? inv.createdAt.split('T')[0] : new Date().toISOString().split('T')[0]);
    safeSetVal('sale-ref-no', o.refNo || o.orderNo || '');
    safeSetVal('sale-remarks', o.remarks || '');
    const supply = inv.placeOfSupply || (o.stockist ? (o.stockist.state || o.stockist.city) : '') || (companyProfile ? companyProfile.defaultPlaceOfSupply : '');
    safeSetVal('sale-supply', supply);
    
    renderSaleItems();
}

function updateModalTotals(orderId, triggerItemId) {
    const o = allOrders.find(x => x._id == orderId);
    if (!o) return;

    let subTotal = 0;
    let gstAmount = 0;

    o.items.forEach(item => {
        const rateInput = document.getElementById(`rate-${orderId}-${item._id}`);
        const rate = Number(rateInput ? (rateInput.value || 0) : (item.priceUsed || 0));
        const qty = Number(item.qty || 0);
        const lineTotal = rate * qty;
        
        const lineTotalEl = document.getElementById(`linetotal-${orderId}-${item._id}`);
        if (lineTotalEl) lineTotalEl.innerText = `₹${lineTotal.toFixed(2)}`;
        
        const gstPct = Number(item.gstPercent || 0);
        const itemGst = (lineTotal * gstPct) / 100;
        subTotal += lineTotal;
        gstAmount += itemGst;
    });

    const netAmount = Number((subTotal + gstAmount).toFixed(2));
    const grandTotal = Math.round(netAmount);

    const roundOff = (grandTotal - netAmount).toFixed(2);

    // Update Modal Summary Fields
    document.getElementById('detail-subtotal').innerText = `₹${subTotal.toLocaleString('en-IN', {minimumFractionDigits: 2})}`;
    document.getElementById('detail-gst').innerText = `₹${gstAmount.toLocaleString('en-IN', {minimumFractionDigits: 2})}`;
    document.getElementById('detail-roundoff').innerText = `₹${roundOff}`;
    document.getElementById('detail-total').innerText = `₹${grandTotal.toLocaleString('en-IN', {minimumFractionDigits: 2})}`;

    // Update Sticky Strip if present
    if (document.getElementById('strip-order-subtotal')) document.getElementById('strip-order-subtotal').innerText = `₹${subTotal.toLocaleString('en-IN', {minimumFractionDigits: 2})}`;
    if (document.getElementById('strip-order-gst')) document.getElementById('strip-order-gst').innerText = `₹${gstAmount.toLocaleString('en-IN', {minimumFractionDigits: 2})}`;
    if (document.getElementById('strip-order-roundoff')) document.getElementById('strip-order-roundoff').innerText = `₹${roundOff}`;
    if (document.getElementById('strip-order-total')) document.getElementById('strip-order-total').innerText = `₹${grandTotal.toLocaleString('en-IN', {minimumFractionDigits: 2})}`;
}

async function rejectOrder(id) {
    try {
        const res = await fetch(`${API_BASE}/admin/orders/${id}/reject`, { method: 'PUT' });
        const result = await res.json();
        if (result.success) {
            alert("❌ Order rejected and marked accordingly.");
            loadOrders(); // Refresh history
        } else {
            alert("Rejection failed: " + result.message);
        }
    } catch (e) { alert("Rejection failed."); }
}

async function negotiateItem(orderId, itemId, action, btn) {
    if (!confirm(`Are you sure you want to apply the [${action.toUpperCase()}] negotiation logic to this item?`)) return;
    
    const originalHtml = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `⏳`;

    const customRate = document.getElementById(`rate-${orderId}-${itemId}`).value;

    try {
        const res = await fetch(`${API_BASE}/admin/orders/${orderId}/items/${itemId}/negotiate`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action, customRate })
        });
        const result = await res.json();
        if (result.success) {
            allOrders = allOrders.map(o => o._id === orderId ? result.order : o);
            viewOrderDetails(orderId);
            renderOrderHistory();
        }
    } catch (e) { alert("Negotiation failed."); }
    finally {
        btn.disabled = false;
        btn.innerHTML = originalHtml;
    }
}

async function approveOrder(id) {
    const o = allOrders.find(x => x._id == id);
    if (!o) return;

    const batchSelections = {};
    o.items.forEach(item => {
        const select = document.getElementById(`batch-${o._id}-${item._id}`);
        if (select) {
            batchSelections[item._id] = select.value;
        }
    });

    const hqSelect = document.getElementById('detail-hq-select');
    const selectedHq = hqSelect ? hqSelect.value : null;

    if (!o.stockist?.hq && !selectedHq && o.status === 'pending') {
        alert("⚠️ MANDATORY: Please assign a Headquarters (HQ) for this stockist before approving the order.");
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/admin/orders/${id}/approve`, { 
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ approvedBy: 'ADMIN', batchSelections, selectedHq })
        });
        const result = await res.json();
        if (result.success) {
            alert("✅ Order approved successfully.");
            loadOrders(); // Refresh history
        } else {
            alert(result.message || "Approval failed.");
        }
    } catch (e) { alert("Approval failed."); }
}
async function cancelInvoice(orderId) {
    try {
        // Find the invoice linked to this order
        const inv = allInvoices.find(i => (i.orderId || i.order?._id || i.order) == orderId);
        if (!inv) return alert("Could not find invoice record to cancel.");

        const res = await fetch(`${API_BASE}/admin/invoices/${inv._id}/cancel`, { method: 'PUT' });
        const result = await res.json();
        if (result.success) {
            alert("✅ Record Cancelled. Inventory restored. Record preserved for audit.");
            loadOrders();
            loadInvoices();
            renderOrderHistory();
            renderInvoices();
        } else {
            alert("Cancellation failed: " + result.message);
        }
    } catch (e) { alert("Cancellation failed."); }
}

// --- PRODUCT TIMELINE LOGIC ---

async function viewProductTimeline(productId) {
    const p = allProducts.find(x => x._id == productId);
    if (!p) return;

    document.getElementById('timeline-product-name').innerText = `📈¦ Timeline: ${p.name}`;
    const tbody = document.getElementById('timelineTableBody');
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:2rem; opacity:0.6;">⌛ Loading History...</td></tr>';
    document.getElementById('productTimelineModal').classList.remove('hidden');

    try {
        const res = await fetch(`${API_BASE}/admin/products/${productId}/timeline`);
        if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.error || `HTTP ${res.status}`);
        }
        const result = await res.json();
        if (result.success) {
            renderProductTimeline(result.timeline);
        } else {
            throw new Error(result.error || "Unknown error");
        }
    } catch (e) {
        console.error("Timeline load fail:", e);
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:2rem; color:#ef4444;">❌ Failed to load history: ${e.message}</td></tr>`;
    }
}

function renderProductTimeline(timeline) {
    const tbody = document.getElementById('timelineTableBody');
    if (timeline.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:3rem; opacity:0.5;">No transactions found for this product.</td></tr>';
        return;
    }

    tbody.innerHTML = timeline.map(entry => {
        const isSale = entry.type === 'SALE';
        const dateStr = new Date(entry.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
        const badgeColor = isSale ? '#ef4444' : '#10b981';
        const qtyColor = isSale ? '#ef4444' : '#10b981';
        
        // Setup deep link click handler
        const viewDetailAction = isSale ? `viewOrderDetails('${entry.orderId}')` : `viewPurchaseDetails('${entry.id}')`;

        return `
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                <td style="padding: 12px; font-weight: 600; opacity: 0.8;">${dateStr}</td>
                <td style="padding: 12px; text-align: center;">
                    <span style="background: ${badgeColor}22; color: ${badgeColor}; padding: 2px 8px; border-radius: 4px; font-size: 0.65rem; font-weight: 800; border: 1px solid ${badgeColor}44;">
                        ${entry.type}
                    </span>
                </td>
                <td style="padding: 12px;">
                    <a href="javascript:void(0)" onclick="${viewDetailAction}" style="color: var(--accent); font-weight: 700; text-decoration: none;">${entry.refNo}</a>
                </td>
                <td style="padding: 12px; font-weight: 600;">${entry.party}</td>
                <td style="padding: 12px; text-align: center; opacity: 0.8;">${entry.batch || '-'}</td>
                <td style="padding: 12px; text-align: right; font-family: monospace;">₹${Number(entry.rate).toFixed(2)}</td>
                <td style="padding: 12px; text-align: center; font-weight: 800; color: ${qtyColor};">
                    ${entry.qty > 0 ? '+' : ''}${entry.qty}
                </td>
            </tr>
        `;
    }).join('');
}

function closeTimelineModal() {
    document.getElementById('productTimelineModal').classList.add('hidden');
}

function closeOrderModal() {
    document.getElementById('orderDetailModal').classList.add('hidden');
}

// --- LEDGER & PAYMENTS LOGIC ---
let currentLedgerPartyId = null;

async function viewLedger(id) {
    const s = allStockists.find(x => x._id == id);
    if (!s) return;

    currentLedgerPartyId = id;
    const nameEl = document.getElementById('ledger-party-name');
    if(nameEl) nameEl.innerText = '📈‹ Ledger: ' + s.name;
    
    try {
        const res = await fetch('/api/admin/parties/' + id + '/ledger');
        const ledger = await res.json();
        renderLedger(ledger);
        document.getElementById('ledgerModal').classList.remove('hidden');
    } catch (e) { alert("Failed to load ledger"); }
}

function renderLedger(ledger) {
    const tbody = document.getElementById('ledgerTableBody');
    if(!tbody) return;
    let balance = 0;

    tbody.innerHTML = ledger.map(entry => {
        balance += (Number(entry.debit || 0) - Number(entry.credit || 0));
        return `
            <tr>
                <td style="font-size:0.75rem;">${new Date(entry.date).toLocaleDateString('en-GB')}</td>
                <td style="font-weight:700; color:var(--primary);">${entry.refNo}</td>
                <td style="font-size:0.65rem; color:var(--text-muted);">${entry.type}</td>
                <td style="font-size:0.7rem; font-style:italic;">${entry.description}</td>
                <td style="text-align:right; font-family:monospace; color:${entry.debit > 0 ? '#fff' : 'rgba(255,255,255,0.2)'};">${entry.debit > 0 ? '₹' + Number(entry.debit).toFixed(2) : '-'}</td>
                <td style="text-align:right; font-family:monospace; color:${entry.credit > 0 ? '#10b981' : 'rgba(255,255,255,0.2)'};">${entry.credit > 0 ? '₹' + Number(entry.credit).toFixed(2) : '-'}</td>
                <td style="text-align:right; font-family:monospace; font-weight:800; color:${balance >= 0 ? 'var(--accent)' : '#ef4444'};">₹${Math.abs(balance).toFixed(2)} ${balance >= 0 ? 'Dr' : 'Cr'}</td>
            </tr>
        `;
    }).join('');
}


function closeLedgerModal() {
    document.getElementById('ledgerModal').classList.add('hidden');
}

function openPaymentModalFromLedger() {
    if (!currentLedgerPartyId) return;

    const form = document.getElementById('paymentForm');
    if (form) form.reset();

    // Pre-fill date
    const dateEl = document.getElementById('pay-date');
    if (dateEl) dateEl.value = new Date().toISOString().split('T')[0];

    // Open modal and set correct type + party
    document.getElementById('paymentModal').classList.remove('hidden');

    // Set type based on party type
    const s = allStockists.find(x => x._id === currentLedgerPartyId);
    const typeEl = document.getElementById('pay-type');
    if (typeEl && s) {
        typeEl.value = (s.partyType || 'STOCKIST') === 'STOCKIST' ? 'RECEIPT' : 'PAYMENT';
    }

    // Trigger context update which populates party dropdown
    updatePaymentContext();

    // Then pre-select the party
    setTimeout(() => {
        const partyEl = document.getElementById('pay-party');
        if (partyEl) partyEl.value = currentLedgerPartyId;
        updatePartyBalanceDisplay();
    }, 50);
}

function closePaymentModal() {
    document.getElementById('paymentModal').classList.add('hidden');
}


// --- INVOICE LOGIC ---
// Duplicate loadInvoices removed

function renderInvoices(list = null) {
    const tbody = document.getElementById('invoiceTableBody');
    if (!tbody) return;

    const data = list || allInvoices;

    if (!data || data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; color:var(--text-muted); padding: 2rem;">No invoices found.</td></tr>';
        return;
    }

    tbody.innerHTML = data.map(inv => {
        const partyName = inv.stockist?.name || inv.stockistName || 'N/A';
        const subTotal = Number(inv.subTotal || 0);
        const gstAmount = Number(inv.gstAmount || 0);
        const grandTotal = Number(inv.grandTotal || 0);
        return `
        <tr>
            <td style="font-family:monospace; font-weight:700; color:var(--accent);">${inv.invoiceNo}</td>
            <td style="font-weight:600;">${partyName}</td>
            <td>${new Date(inv.createdAt).toLocaleDateString('en-GB')}</td>
            <td style="text-align:right;">₹${subTotal.toLocaleString('en-IN', {minimumFractionDigits:2})}</td>
            <td style="text-align:right;">₹${gstAmount.toLocaleString('en-IN', {minimumFractionDigits:2})}</td>
            <td style="text-align:right; font-weight:800; color:var(--primary);">₹${grandTotal.toLocaleString('en-IN', {minimumFractionDigits:2})}</td>
            <td style="text-align:right;">
                <button class="btn btn-ghost" style="padding:6px 12px; font-size: 0.65rem; color:var(--primary);" onclick="downloadInvoicePDF('${inv._id}')">DOWNLOAD PDF</button>
            </td>
            <td style="text-align:center;">
                <button class="btn btn-ghost" style="padding:5px 10px;" onclick="viewInvoicePDF('${inv._id}')" title="View PDF">👍ï¸</button>
            </td>
        </tr>`;
    }).join('');
}

function filterInvoices(query) {
    const q = query.toLowerCase();
    const filtered = allInvoices.filter(inv => {
        const matchesHeader = inv.invoiceNo.toLowerCase().includes(q) || 
            (inv.stockist && inv.stockist.name.toLowerCase().includes(q)) ||
            (inv.stockistName && inv.stockistName.toLowerCase().includes(q));
        
        const matchesItems = inv.items && inv.items.some(it => 
            it.name.toLowerCase().includes(q) || 
            (it.batch && it.batch.toLowerCase().includes(q))
        );

        return matchesHeader || matchesItems;
    });
    renderInvoices(filtered);
}

function downloadInvoiceTemplate() {
    const headers = [
        ["Invoice No*", "Date (DD-MM-YYYY)*", "Party Name*", "Product Name*", "Qty*", "Rate (Ex. GST)*", "GST %*", "Batch No", "Exp Date", "Bonus Qty"]
    ];
    const ws = XLSX.utils.aoa_to_sheet(headers);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Invoices");
    XLSX.writeFile(wb, "Emyris_Invoice_Bulk_Template.xlsx");
}

async function handleInvoiceBulkUpload(input) {
    const file = input.files[0];
    if (!file) return;

    try {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        if (!jsonData.length) throw new Error("File is empty.");

        // Group by Invoice No
        const invoicesMap = {};
        jsonData.forEach(row => {
            const invNo = String(row["Invoice No*"]).trim();
            if (!invoicesMap[invNo]) {
                invoicesMap[invNo] = {
                    invoiceNo: invNo,
                    date: row["Date (DD-MM-YYYY)*"],
                    partyName: row["Party Name*"],
                    items: []
                };
            }
            invoicesMap[invNo].items.push({
                productName: row["Product Name*"],
                qty: Number(row["Qty*"]),
                rate: Number(row["Rate (Ex. GST)*"]),
                gstPercent: Number(row["GST %*"]),
                batch: row["Batch No"] || 'N/A',
                expDate: row["Exp Date"] || '',
                bonusQty: Number(row["Bonus Qty"] || 0)
            });
        });

        const invoices = Object.values(invoicesMap);

        const res = await fetch(`${API_BASE}/admin/invoices/bulk`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ invoices })
        });

        const result = await res.json();
        if (result.success) {
            alert(`Bulk upload complete! Created: ${result.results.success}, Failed: ${result.results.failed}`);
            if (result.results.errors && result.results.errors.length > 0) {
                console.warn("Bulk Upload Errors:", result.results.errors);
            }
            await loadInvoices();
            renderInvoices();
        } else {
            alert("Bulk upload failed: " + result.message);
        }
    } catch (e) { 
        console.error("Bulk Upload Error:", e);
        alert("Bulk upload failed: " + e.message); 
    }
    input.value = '';
}

async function generateInvoice(orderId) {
    try {
        const res = await fetch(`${API_BASE}/admin/invoices/generate/${orderId}`, { method: 'POST' });
        const result = await res.json();
        if (result.success) {
            alert("✅ Invoice Generated Successfully!");
            await loadInvoices();
            await loadOrders();
            renderOrderHistory();
            renderInvoices();
        } else {
            alert("Generation failed: " + result.message);
        }
    } catch (e) { alert("Failed to generate invoice"); }
}

// --- PURCHASE ENTRY LOGIC ---
function renderPurchaseEntries() {
    const tbody = document.getElementById('purchaseTableBody');
    if (!tbody) return;

    tbody.innerHTML = allPurchaseEntries.map(p => `
        <tr>
            <td style="font-family:monospace; font-weight:700; color:var(--primary);">${p.purchaseNo || 'N/A'}</td>
            <td style="font-weight:600;">${p.supplierName}</td>
            <td>${p.supplierInvoiceNo || '-'}</td>
            <td>${new Date(p.invoiceDate).toLocaleDateString('en-GB')}</td>
            <td style="text-align:center;">${p.items?.length || 0}</td>
            <td style="text-align:right; font-weight:800; color:var(--primary);">₹${Number(p.grandTotal || 0).toLocaleString('en-IN', {minimumFractionDigits:2})}</td>

            <td style="text-align:right; white-space:nowrap;">
                <button class="btn btn-ghost" style="padding:6px 10px; font-size: 0.65rem;" onclick="viewPurchaseDetails('${p._id}')">INFO</button>
                <button class="btn btn-ghost" style="padding:6px 10px; font-size: 0.65rem; color:var(--accent);" onclick="viewPurchasePDF('${p._id}')">PDF</button>
                <button class="btn btn-ghost" style="padding:6px 10px; font-size: 0.65rem; color:var(--primary);" onclick="editPurchaseEntry('${p._id}')">EDIT</button>
            </td>
        </tr>
    `).join('');
}

function calculatePurchaseLineTotal() {
    const qty = Number(document.getElementById('pur-qty').value) || 0;
    const rate = Number(document.getElementById('pur-rate').value) || 0;
    const gstPct = Number(document.getElementById('pur-gst-pct').value) || 0;
    const taxable = Number((qty * rate).toFixed(2));
    const total = Number((taxable + taxable * (gstPct / 100)).toFixed(2));
    const el = document.getElementById('pur-line-total');
    if (el) el.innerText = `₹${total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function openPurchaseModal(id = null) {
    try {
        const form = document.getElementById('purchaseForm');
        if (form) form.reset();
        
        // Reset IDs and Search fields
        safeSetVal('pur-id', id || '');
        safeSetVal('pur-party-search', '');
        safeSetVal('pur-supplier', '');
        safeSetVal('pur-prod-search', '');
        safeSetVal('pur-prod-select', '');
        safeSetVal('pur-supplier-inv-no', '');
        
        // Reset Integrated Row Inputs (Memory Clean)
        safeSetVal('pur-hsn', '');
        safeSetVal('pur-pack', '');
        safeSetVal('pur-batch', '');
        safeSetVal('pur-mfg', '');
        safeSetVal('pur-exp', '');
        safeSetVal('pur-mrp', '');
        safeSetVal('pur-ptr', '');
        safeSetVal('pur-pts', '');
        safeSetVal('pur-rate', '');
        safeSetVal('pur-qty', '');
        safeSetVal('pur-gst-pct', '');
        if (document.getElementById('pur-line-total')) {
            document.getElementById('pur-line-total').innerText = '₹0.00';
        }

        // Set Today's Date
        const now = new Date();
        const today = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
        safeSetVal('pur-date', today);
        
        if (!id) {
            // Fetch next purchase bill number for NEW entries
            fetch(`${API_BASE}/admin/next-number/purchase`)
                .then(res => res.json())
                .then(data => { if (data.success) safeSetVal('pur-bill-no', data.nextNumber); })
                .catch(e => console.warn('Next purchase number fetch failed', e));
        }

        purchaseItems = [];
        purchaseCharges = [];
        ensurePurchaseEmptyRow();
        renderPurchaseItems();
        renderPurchaseCharges();
        document.getElementById('purchaseModal').classList.remove('hidden');
    } catch (e) { console.error('Error opening purchase modal', e); }
}

function closePurchaseModal() {
    document.getElementById('purchaseModal').classList.add('hidden');
}

// ============================================================
// GEMINI AI PURCHASE INVOICE UPLOAD
// ============================================================
async function uploadPurchaseInvoice(inputEl) {
    const file = inputEl.files[0];
    if (!file) return;
    inputEl.value = ''; // reset so same file can be re-uploaded

    const btn = document.getElementById('pur-ai-upload-btn');
    const origText = btn ? btn.innerHTML : '';
    if (btn) { btn.innerHTML = '⏳ Scanning...'; btn.disabled = true; }

    try {
        const formData = new FormData();
        formData.append('invoice', file);
        const supplierId = document.getElementById('pur-supplier').value || '';
        formData.append('supplierId', supplierId);

        const res = await fetch(`${API_BASE}/admin/upload-purchase-invoice`, { method: 'POST', body: formData });
        const data = await res.json();

        if (!data.success) throw new Error(data.message || 'Upload failed');

        const extracted = data.data;

        // --- Fill header fields ---
        if (extracted.invoiceNo) safeSetVal('pur-supplier-inv-no', extracted.invoiceNo);
        if (extracted.date) safeSetVal('pur-date', extracted.date);

        if (!extracted.items || !extracted.items.length) {
            showAlert('AI extracted 0 items. Please check the invoice file.', 'warning');
            return;
        }

        // --- Map extracted items to grid rows ---
        purchaseItems = [];
        for (const ei of extracted.items) {
            // Try to match to existing product by HSN or name
            let matched = null;
            if (ei.hsn) matched = allProducts.find(p => p.hsn && p.hsn.toString().trim() === ei.hsn.toString().trim());
            if (!matched && ei.name) {
                const eiName = ei.name.toUpperCase().replace(/[^A-Z0-9]/g, '');
                matched = allProducts.find(p => p.name && p.name.toUpperCase().replace(/[^A-Z0-9]/g, '').includes(eiName.substring(0, Math.min(eiName.length, 8))));
            }

            const defaultGst = window.companyProfile ? window.companyProfile.gstRate : 5;
            const gstPct = ei.gst || (matched ? (matched.gstRate || defaultGst) : defaultGst);
            const qty = Number(ei.qty) || 0;
            const rate = Number(ei.rate) || 0;
            const taxable = Number((qty * rate).toFixed(2));
            const gstAmount = Number((taxable * (gstPct / 100)).toFixed(2));

            purchaseItems.push({
                productId: matched ? (matched._id || matched.id || '') : '',
                productName: matched ? matched.name : (ei.name || ''),
                hsn: ei.hsn || (matched ? matched.hsn : '') || '',
                pack: matched ? (matched.packSize || matched.pack || '') : '',
                batch: ei.batch || '',
                mfg: '',
                exp: ei.expDate || '',
                mrp: Number(ei.mrp) || (matched ? matched.mrp || 0 : 0),
                ptr: Number(ei.ptr) || (matched ? matched.ptr || 0 : 0),
                pts: Number(ei.pts) || (matched ? matched.pts || 0 : 0),
                rate: rate,
                qty: qty,
                gstPercent: gstPct,
                taxable: taxable,
                gstAmount: gstAmount,
                lineTotal: Number((taxable + gstAmount).toFixed(2))
            });
        }

        // Add one empty row at the end
        ensurePurchaseEmptyRow();
        renderPurchaseItems();

        // Show success summary
        const unmapped = purchaseItems.filter(i => !i.productId && i.productName).length;
        let msg = `✨ AI loaded ${extracted.items.length} item(s) into the grid.`;
        if (unmapped > 0) msg += ` ${unmapped} item(s) not matched to your product catalog — please verify highlighted rows.`;
        showAlert(msg, unmapped > 0 ? 'warning' : 'success');

    } catch (err) {
        console.error('Purchase Invoice Upload Error:', err);
        showAlert('❌ AI Upload failed: ' + err.message, 'error');
    } finally {
        if (btn) { btn.innerHTML = origText; btn.disabled = false; }
    }
}


// ============================================================
// EXCEL-STYLE GRID — PURCHASE & SALE
// ============================================================

// Ensures at least one empty row exists
function ensurePurchaseEmptyRow() {
    const last = purchaseItems[purchaseItems.length - 1];
    if (!last || last.productId) {
        purchaseItems.push({
            productId: '', productName: '', hsn: '', pack: '',
            batch: '', mfg: '', exp: '', mrp: 0, ptr: 0, pts: 0,
            rate: 0, qty: 0, gstPercent: (window.companyProfile ? window.companyProfile.gstRate : 5),
            taxable: 0, gstAmount: 0, lineTotal: 0
        });
    }
}

function ensureSaleEmptyRow() {
    const last = directSaleItems[directSaleItems.length - 1];
    if (!last || last.product) {
        directSaleItems.push({
            product: '', name: '', batch: '', hsn: '', pack: '',
            mfgDate: '', expDate: '', mrp: '', ptr: 0, qty: 0,
            free: 0, rate: 0, gstPercent: 0, totalValue: 0,
            _batchOptions: []
        });
    }
}

// Focus a cell in the purchase grid: focusPurCell(rowIndex, colKey)
function focusPurCell(rowIdx, col) {
    const el = document.getElementById(`pur-cell-${rowIdx}-${col}`);
    if (el) {
        el.focus();
        if (el.select) el.select();
        // Scroll the row into view, staying clear of the sticky header
        const row = el.closest('tr');
        if (row) row.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
}

function focusSaleCell(rowIdx, col) {
    const el = document.getElementById(`sale-cell-${rowIdx}-${col}`) ||
               document.getElementById(`sale-cell-${rowIdx}-${col}-select`);
    if (el) {
        el.focus();
        if (el.select) el.select();
        const row = el.closest('tr');
        if (row) row.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
}

// ---- PURCHASE GRID: per-cell update ----
function updatePurCell(rowIdx, field, value) {
    if (!purchaseItems[rowIdx]) return;
    const numFields = ['mrp','ptr','pts','rate','qty','gstPercent'];
    purchaseItems[rowIdx][field] = numFields.includes(field) ? (parseFloat(value) || 0) : value;
    // Recalculate line total
    const item = purchaseItems[rowIdx];
    item.taxable = Number(((item.qty || 0) * (item.rate || 0)).toFixed(2));
    item.gstAmount = Number((item.taxable * ((item.gstPercent || 0) / 100)).toFixed(2));
    item.lineTotal = Number((item.taxable + item.gstAmount).toFixed(2));
    // Update the line total cell without full re-render
    const ltEl = document.getElementById(`pur-lt-${rowIdx}`);
    if (ltEl) ltEl.innerText = '₹' + item.lineTotal.toFixed(2);
    updatePurchaseFooter();
}

// ---- PURCHASE GRID: keyboard navigation ----
const PUR_COLS = ['product','hsn','pack','batch','mfg','exp','mrp','ptr','pts','rate','qty','gstPercent'];

function purGridKey(e, rowIdx, col) {
    const colIdx = PUR_COLS.indexOf(col);
    const isSearch = (col === 'product');

    // Close dropdown on Escape
    if (e.key === 'Escape') {
        closePurGridDropdown(rowIdx);
        return;
    }

    // Don't intercept while product dropdown is open
    if (isSearch) {
        const dd = document.getElementById(`pur-dd-${rowIdx}`);
        if (dd && dd.style.display !== 'none') {
            // let handleSearchKey do ArrowUp/Down/Enter
            return;
        }
    }

    if (e.key === 'Tab' || e.key === 'ArrowRight') {
        e.preventDefault();
        if (colIdx < PUR_COLS.length - 1) focusPurCell(rowIdx, PUR_COLS[colIdx + 1]);
    } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (colIdx > 0) focusPurCell(rowIdx, PUR_COLS[colIdx - 1]);
    } else if (e.key === 'ArrowDown' || e.key === 'Enter') {
        e.preventDefault();
        // Add new row if on last row
        if (rowIdx === purchaseItems.length - 1) {
            ensurePurchaseEmptyRow();
            renderPurchaseItems();
        }
        focusPurCell(rowIdx + 1, col);
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (rowIdx > 0) focusPurCell(rowIdx - 1, col);
    }
}

// ---- PURCHASE GRID: product search inside cell ----
function purGridSearch(rowIdx, inputEl) {
    const query = inputEl.value.toLowerCase().trim();
    const wasMapped = !!purchaseItems[rowIdx].productId;

    purchaseItems[rowIdx].productName = inputEl.value;
    purchaseItems[rowIdx].productId = '';

    if (wasMapped) {
        purchaseItems[rowIdx].hsn = '';
        purchaseItems[rowIdx].pack = '';
        purchaseItems[rowIdx].mrp = 0;
        purchaseItems[rowIdx].ptr = 0;
        purchaseItems[rowIdx].pts = 0;
        purchaseItems[rowIdx].rate = 0;
        purchaseItems[rowIdx].gstPercent = (window.companyProfile ? window.companyProfile.gstRate : 5);
        
        const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
        setVal(`pur-cell-${rowIdx}-hsn`, '');
        setVal(`pur-cell-${rowIdx}-pack`, '');
        setVal(`pur-cell-${rowIdx}-mrp`, '');
        setVal(`pur-cell-${rowIdx}-ptr`, '');
        setVal(`pur-cell-${rowIdx}-pts`, '');
        setVal(`pur-cell-${rowIdx}-rate`, '');
        setVal(`pur-cell-${rowIdx}-gstPercent`, purchaseItems[rowIdx].gstPercent);
        updatePurCell(rowIdx, 'qty', document.getElementById(`pur-cell-${rowIdx}-qty`)?.value || 0);
    }

    const dd = document.getElementById(`pur-dd-${rowIdx}`);
    if (!dd) return;

    if (!query) { dd.style.display = 'none'; return; }

    const matches = allProducts.filter(p =>
        p.name.toLowerCase().includes(query) ||
        (p.hsn && p.hsn.toLowerCase().includes(query))
    ).slice(0, 12);

    let html = '';
    if (!matches.length) { 
        html = '<div style="padding:8px;color:var(--text-muted);font-size:0.75rem;">No match found in master.</div>'; 
    } else {
        html = matches.map(p => `
            <div onmousedown="event.preventDefault(); purGridSelectProduct(${rowIdx}, '${p._id || p.id}')"
                 style="padding:6px 10px; cursor:pointer; border-bottom:1px solid rgba(255,255,255,0.05);
                        font-size:0.72rem; display:flex; gap:8px; align-items:center;"
                 onmouseover="this.style.background='rgba(99,102,241,0.18)'"
                 onmouseout="this.style.background='transparent'">
                <span style="font-weight:700; color:#fff; flex:1;">${p.name}</span>
                <span style="color:var(--text-muted); font-size:0.65rem;">${p.hsn || ''}</span>
            </div>`).join('');
    }

    const safeVal = inputEl.value.replace(/'/g, "\\'").replace(/"/g, '&quot;');
    html += `<div style="padding:4px; border-top:1px solid rgba(255,255,255,0.05);">
                <button type="button" onmousedown="event.preventDefault(); openProductModal('quick', '${safeVal}')" style="width:100%; padding:6px; background:rgba(16, 185, 129, 0.1); color:#10b981; border:1px dashed rgba(16,185,129,0.3); border-radius:4px; cursor:pointer; font-size:0.65rem; font-weight:800; text-transform:uppercase;">+ Add to Product Master</button>
             </div>`;

    dd.innerHTML = html;
    dd.style.display = 'block';
    
    const rect = inputEl.getBoundingClientRect();
    dd.style.top = (rect.bottom + 2) + 'px';
    dd.style.left = rect.left + 'px';
    dd.style.width = Math.max(rect.width, 280) + 'px';
}

function purGridSelectProduct(rowIdx, productId) {
    const p = allProducts.find(x => (x._id || x.id) == productId);
    if (!p) return;
    purchaseItems[rowIdx].productId = productId;
    purchaseItems[rowIdx].productName = p.name;
    purchaseItems[rowIdx].hsn = p.hsn || '';
    purchaseItems[rowIdx].pack = p.packSize || p.pack || '';
    purchaseItems[rowIdx].gstPercent = p.gstRate || (window.companyProfile ? window.companyProfile.gstRate : 5);
    purchaseItems[rowIdx].mrp = p.mrp || 0;
    purchaseItems[rowIdx].ptr = p.ptr || 0;
    purchaseItems[rowIdx].pts = p.pts || 0;
    closePurGridDropdown(rowIdx);
    // Re-render only that row
    const tbody = document.getElementById('purchase-items-body');
    if (tbody) {
        const tr = tbody.querySelector(`tr[data-purrow="${rowIdx}"]`);
        if (tr) {
            const newTr = buildPurchaseRow(rowIdx);
            tr.outerHTML = newTr;
        }
    }
    // Focus batch next
    setTimeout(() => focusPurCell(rowIdx, 'batch'), 30);
}

function closePurGridDropdown(rowIdx) {
    const dd = document.getElementById(`pur-dd-${rowIdx}`);
    if (dd) dd.style.display = 'none';
    const gstDd = document.getElementById(`pur-gst-dd-${rowIdx}`);
    if (gstDd) gstDd.style.display = 'none';
}

function deletePurRow(rowIdx) {
    if (purchaseItems.length <= 1) {
        purchaseItems[0] = { productId: '', productName: '', hsn: '', pack: '', batch: '', mfg: '', exp: '', mrp: 0, ptr: 0, pts: 0, rate: 0, qty: 0, gstPercent: (window.companyProfile ? window.companyProfile.gstRate : 5), taxable: 0, gstAmount: 0, lineTotal: 0 };
    } else {
        purchaseItems.splice(rowIdx, 1);
    }
    renderPurchaseItems();
}

// Build a single purchase row's HTML
function buildPurchaseRow(i) {
    const item = purchaseItems[i];
    const inp = (id, type, val, extra='') => `<input id="pur-cell-${i}-${id}" type="${type}" value="${val}" ${extra}
        onkeydown="purGridKey(event,${i},'${id}')"
        oninput="updatePurCell(${i},'${id === 'product' ? 'productName' : id}',this.value)"
        style="width:100%;background:transparent;border:none;color:#fff;font-size:0.7rem;padding:2px 4px;outline:none;"`;
    const cellSt = 'padding:1px 3px;border-right:1px solid rgba(255,255,255,0.06);';
    const isEmpty = !item.productId && !item.productName;

    return `<tr data-purrow="${i}" style="border-bottom:1px solid rgba(255,255,255,0.06); background:${isEmpty ? 'rgba(255,255,255,0.01)' : 'transparent'}; transition:background 0.15s;" 
        onmouseover="this.style.background='rgba(99,102,241,0.07)'" onmouseout="this.style.background='${isEmpty ? 'rgba(255,255,255,0.01)' : 'transparent'}'">
        <td style="text-align:center;padding:2px;border-right:1px solid rgba(255,255,255,0.06);">
            <button type="button" onclick="deletePurRow(${i})" style="background:none;border:none;color:#ef444499;cursor:pointer;font-size:0.9rem;padding:0 4px;" title="Delete row">✕</button>
        </td>
        <td style="${cellSt}position:relative;overflow:visible;">
            ${inp('product','text', escHtml(item.productName || ''), `onfocus="purGridSearch(${i},this)" oninput="updatePurCell(${i},'productName',this.value);purGridSearch(${i},this)" autocomplete="off" placeholder="Search product..."`)}>
            <div id="pur-dd-${i}" style="display:none;position:fixed;z-index:99999;background:#1e293b;border:1px solid rgba(99,102,241,0.4);border-radius:8px;max-height:220px;overflow-y:auto;box-shadow:0 8px 32px rgba(0,0,0,0.5);"></div>
        </td>
        <td style="${cellSt}">${inp('hsn','text',item.hsn||'')}></td>
        <td style="${cellSt}">${inp('pack','text',item.pack||'')}></td>
        <td style="${cellSt}">${inp('batch','text',item.batch||'')}></td>
        <td style="${cellSt}position:relative;">${inp('mfg','text',item.mfg||'','placeholder="MM-YY" maxlength="5"')}></td>
        <td style="${cellSt}position:relative;">${inp('exp','text',item.exp||'','placeholder="MM-YY" maxlength="5"')}></td>
        <td style="${cellSt}">${inp('mrp','number',item.mrp||0,'step="0.01"')}></td>
        <td style="${cellSt}">${inp('ptr','number',item.ptr||0,'step="0.01"')}></td>
        <td style="${cellSt}">${inp('pts','number',item.pts||0,'step="0.01"')}></td>
        <td style="${cellSt}">${inp('rate','number',item.rate||0,'step="0.01"')}></td>
        <td style="${cellSt}">${inp('qty','number',item.qty||0,'min="0"')}></td>
        <td style="${cellSt}position:relative;overflow:visible;">
            ${inp('gstPercent','number',item.gstPercent||0,'step="0.01" autocomplete="off" onfocus="openPurGstPicker('+i+', this)"')}
            <div id="pur-gst-dd-${i}" style="display:none;position:fixed;z-index:99999;background:#1e293b;border:1px solid rgba(99,102,241,0.4);border-radius:8px;max-height:180px;overflow-y:auto;box-shadow:0 8px 32px rgba(0,0,0,0.5);min-width:80px;"></div>
        </td>
        <td style="text-align:right;padding:2px 8px 2px 4px;font-weight:800;color:var(--primary);font-size:0.72rem;font-family:monospace;" id="pur-lt-${i}">₹${Number(item.lineTotal||0).toFixed(2)}</td>
    </tr>`;
}

function escHtml(str) { return String(str).replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

function openPurGstPicker(rowIdx, inputEl) {
    const dd = document.getElementById(`pur-gst-dd-${rowIdx}`);
    if (!dd) return;
    
    document.querySelectorAll('[id^="pur-dd-"], [id^="pur-gst-dd-"]').forEach(d => {
        if (d !== dd) d.style.display = 'none';
    });

    let html = '<div style="padding:6px 10px;font-size:0.6rem;color:rgba(255,255,255,0.4);text-transform:uppercase;border-bottom:1px solid rgba(255,255,255,0.05);position:sticky;top:0;background:#1e293b;z-index:2;">GST %</div>';
    
    const masterGsts = (window.masters && window.masters.gst) ? window.masters.gst.map(g => Number(g.rate)) : [0, 5, 12, 18, 28];
    const gstRates = [...new Set(masterGsts)].sort((a,b)=>a-b);
    
    gstRates.forEach(rate => {
        html += `<div style="padding:8px 12px;font-size:0.75rem;cursor:pointer;border-bottom:1px solid rgba(255,255,255,0.05);color:#f8fafc;display:flex;align-items:center;gap:8px;transition:0.2s;" 
                 onmouseover="this.style.background='rgba(99,102,241,0.1)'" onmouseout="this.style.background='transparent'"
                 onmousedown="event.preventDefault(); selectPurGst(${rowIdx}, ${rate})">
                    <span style="font-weight:700;">${rate}%</span>
                 </div>`;
    });
    
    dd.innerHTML = html;
    
    // Position fixed to avoid overflow clipping
    const rect = inputEl.getBoundingClientRect();
    dd.style.left = rect.left + 'px';
    dd.style.top = (rect.bottom + 2) + 'px';
    
    dd.style.display = 'block';

    setTimeout(() => {
        const handler = (e) => {
            if (!dd.contains(e.target) && e.target !== inputEl) {
                dd.style.display = 'none';
                document.removeEventListener('click', handler);
            }
        };
        document.addEventListener('click', handler);
    }, 50);
}

function selectPurGst(rowIdx, rate) {
    const dd = document.getElementById(`pur-gst-dd-${rowIdx}`);
    if (dd) dd.style.display = 'none';
    
    const input = document.getElementById(`pur-cell-${rowIdx}-gstPercent`);
    if (input) {
        input.value = rate;
        updatePurCell(rowIdx, 'gstPercent', rate);
        input.focus();
    }
}

function addPurchaseItem() {
    // Legacy compat: just add a new empty row and focus it
    ensurePurchaseEmptyRow();
    renderPurchaseItems();
    const lastIdx = purchaseItems.length - 1;
    setTimeout(() => focusPurCell(lastIdx, 'product'), 50);
}

function editPurchaseLineItem(index) {
    // No-op: rows are inline-editable in the new grid
    focusPurCell(index, 'product');
}





// --- ADDITIONAL CHARGES LOGIC ---
// Variables moved to top

function addPurchaseCharge() {
    const name = document.getElementById('pur-charge-name').value.trim();
    const hsn = document.getElementById('pur-charge-hsn').value.trim();
    const amount = parseFloat(document.getElementById('pur-charge-amount').value) || 0;
    const gstPct = parseFloat(document.getElementById('pur-charge-gst').value) || 0;

    if (!name || amount <= 0) return alert('⚠️ Please enter charge name and amount');

    const gstAmount = Number((amount * (gstPct / 100)).toFixed(2));
    const total = Number((amount + gstAmount).toFixed(2));

    purchaseCharges.push({ name, hsn, amount, gstPct, gstAmount, total });
    
    document.getElementById('pur-charge-name').value = '';
    document.getElementById('pur-charge-hsn').value = '';
    document.getElementById('pur-charge-amount').value = '';
    
    renderPurchaseCharges();
}

function renderPurchaseCharges() {
    const tbody = document.getElementById('purchase-charges-body');
    if (!tbody) return;

    tbody.innerHTML = purchaseCharges.map((c, idx) => `
        <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
            <td style="padding: 4px 8px;">${c.name}</td>
            <td style="padding: 4px 8px; text-align: right;">₹${c.amount.toFixed(2)}</td>
            <td style="padding: 4px 8px; text-align: center;">${c.gstPct}%</td>
            <td style="padding: 4px 8px; text-align: right; font-weight: 700;">₹${c.total.toFixed(2)}</td>
            <td style="padding: 4px 8px; text-align: center;">
                <button type="button" onclick="purchaseCharges.splice(${idx}, 1); renderPurchaseCharges();" style="background:none; border:none; color:#ef4444; cursor:pointer; font-size:0.8rem;">✓•</button>
            </td>
        </tr>
    `).join('');

    updatePurchaseFooter();
}

function renderPurchaseItems(focusRow, focusCol) {
    const tbody = document.getElementById('purchase-items-body');
    if (!tbody) return;
    // Ensure at least one row
    if (!purchaseItems.length) ensurePurchaseEmptyRow();
    tbody.innerHTML = purchaseItems.map((_, i) => buildPurchaseRow(i)).join('');
    updatePurchaseFooter();
    if (focusRow !== undefined) setTimeout(() => focusPurCell(focusRow, focusCol || 'product'), 30);
}


function editPurchaseLineItem(index) {
    // Inline editable — just focus the row
    setTimeout(() => focusPurCell(index, 'product'), 30);
}

function updatePurchaseFooter() {
    const prodTaxable = purchaseItems.reduce((acc, i) => acc + (i.taxable || 0), 0);
    const prodGst = purchaseItems.reduce((acc, i) => acc + (i.gstAmount || 0), 0);
    const prodGross = purchaseItems.reduce((acc, i) => acc + (i.lineTotal || 0), 0);
    
    const chargesTaxable = purchaseCharges.reduce((acc, c) => acc + (c.amount || 0), 0);
    const chargesGst = purchaseCharges.reduce((acc, c) => acc + (c.gstAmount || 0), 0);
    const chargesTotal = purchaseCharges.reduce((acc, c) => acc + (c.total || 0), 0);

    const totalGst = prodGst + chargesGst;
    const rawTotal = prodGross + chargesTotal;
    const grandTotal = Math.round(rawTotal);
    const roundOff = grandTotal - rawTotal;

    const safeEl = (id, val) => { const el = document.getElementById(id); if (el) el.innerText = val; };
    const format = (v) => '₹' + v.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    safeEl('strip-pur-count', purchaseItems.filter(i => i.productId).length);
    safeEl('strip-pur-prod-total', format(prodGross));
    safeEl('strip-pur-charges', format(chargesTotal));
    safeEl('strip-pur-gst', format(totalGst));
    safeEl('strip-pur-roundoff', (roundOff >= 0 ? '+' : '-') + '₹' + Math.abs(roundOff).toFixed(2));
    safeEl('strip-pur-total', format(grandTotal));
}

async function savePurchaseEntry(event) {
    if (event) event.preventDefault();
    // Strip empty rows before submitting
    purchaseItems = purchaseItems.filter(i => i.productId && i.qty > 0);
    if (!purchaseItems.length) return alert('⚠️ Please add at least one item with a product and quantity.');

    const supplier = safeGetVal('pur-supplier');
    if (!supplier) return alert('⚠️ Please select a Supplier first.');

    const billNo = safeGetVal('pur-bill-no');
    if (!billNo) return alert('⚠️ Internal Bill No is missing. Please close and reopen the form — the number is auto-generated from the server.');

    const billDate = safeGetVal('pur-date');
    if (!billDate) return alert('⚠️ Please select a Purchase Date.');

    // Detect the button that triggered the POST (works for both form submit and onclick)
    const btn = event?.submitter || (event?.currentTarget?.tagName === 'BUTTON' ? event.currentTarget : (event?.target?.tagName === 'BUTTON' ? event.target : null));
    const originalText = btn ? btn.innerText : '';
    if (btn) { btn.disabled = true; btn.innerText = '⏳ POSTING...'; }

    try {
        const subTotal = purchaseItems.reduce((acc, i) => acc + (i.taxable || 0), 0) + purchaseCharges.reduce((acc, c) => acc + (c.amount || 0), 0);
        const gstAmount = purchaseItems.reduce((acc, i) => acc + (i.gstAmount || 0), 0) + purchaseCharges.reduce((acc, c) => acc + (c.gstAmount || 0), 0);
        const otherChargesTotal = purchaseCharges.reduce((acc, c) => acc + (c.total || 0), 0);
        const rawTotal = subTotal + gstAmount;
        const grandTotal = Math.round(rawTotal);
        const roundOff = Number((grandTotal - rawTotal).toFixed(2));

        const payload = {
            supplierId: supplier,
            billNo,
            supplierInvoiceNo: safeGetVal('pur-supplier-inv-no'),
            date: billDate,
            paymentMode: safeGetVal('pur-payment-mode'),
            warehouse: safeGetVal('pur-warehouse') || 'MAIN',
            remarks: safeGetVal('pur-remarks'),
            items: purchaseItems,
            additionalCharges: purchaseCharges,
            otherChargesTotal,
            subTotal: Number(subTotal.toFixed(2)),
            gstAmount: Number(gstAmount.toFixed(2)),
            roundOff,
            grandTotal
        };

        console.log('POSTing purchase payload:', payload);

        const purchaseId = document.getElementById('pur-id')?.value;
        const url = purchaseId ? `${API_BASE}/admin/purchase-entries/${purchaseId}` : `${API_BASE}/admin/purchase-entries`;
        const method = purchaseId ? 'PUT' : 'POST';

        const res = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const result = await res.json();
        console.log('Purchase POST result:', result);

        if (result.success) {
            const savedBillNo = result.entry?.billNo || payload.billNo;
            alert(`✅ Purchase Inward Posted!\nBill No: ${savedBillNo}`);
            openPurchaseModal(); // Reset for next entry
            loadPurchaseEntries();
            loadProducts();
        } else {
            alert('Error saving purchase: ' + (result.error || result.message || 'Unknown server error'));
        }
    } catch (e) {
        console.error('Save Purchase Fail:', e);
        alert('Failed to save purchase entry: ' + e.message);
    } finally {
        if (btn) { btn.disabled = false; btn.innerText = originalText; }
    }
}


// --- DIRECT SALES LOGIC ---
function openOnlineOrderModal() {
    openDirectSaleModal('ONLINE');
}

function openDirectOrderModal() {
    openDirectSaleModal('DIRECT');
}

function refreshSaleParties(selectedId = null) {
    // No longer needed as dropdown since we use search, 
    // but we can use it to set the initial hidden value if needed.
    if (selectedId) {
        safeSetVal('sale-party', selectedId);
        const party = allStockists.find(s => (s._id || s.id) == selectedId);
        if (party) safeSetVal('sale-party-search', party.name);
    }
}

function openDirectSaleModal(type, preserveEdit = false) {
    try {
        if (!preserveEdit) {
            isEditMode = false;
            editingInvoiceId = null;
        }

        const form = document.getElementById('saleForm');
        if (form) form.reset();
        
        // Reset Modal Title and Button
        const modalTitle = document.getElementById('sale-modal-title');
        const submitBtn = document.querySelector('#directSaleModal button[type="submit"]');
        if (modalTitle) modalTitle.innerText = 'Generate Direct Invoice';
        if (submitBtn) submitBtn.innerText = '✓ POST FINAL SALE';
        
        // Reset Additional Charges
        saleCharges = [];
        renderSaleCharges();
        
        // Explicitly clear non-standard fields if not preserving edit
        if (!preserveEdit) {
            safeSetVal('sale-party-search', '');
            safeSetVal('sale-party', '');
            safeSetVal('sale-supply', '');
        }
        
        // Set Today's Date (Robust YYYY-MM-DD)
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const today = `${year}-${month}-${day}`;
        safeSetVal('sale-date', today);
        console.log("Prepopulating Sale Date:", today);
        
        const typeInput = document.getElementById('sale-type-input');
        if (typeInput) typeInput.value = type;
        
        if (!preserveEdit) {
            // Fetch next invoice number ONLY for new sales
            const url = `${API_BASE}/admin/next-number/invoice`;
            console.log("Fetching next invoice number from:", url);
            fetch(url)
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        console.log("Setting next invoice number:", data.nextNumber);
                        safeSetVal('sale-ref-no', data.nextNumber);
                    }
                })
                .catch(e => console.error("Could not fetch next number", e));

            directSaleItems = [];
            ensureSaleEmptyRow();
        }
        renderSaleItems();

        // UI Adjustments based on type
        const title = document.getElementById('sale-modal-title');
        const subtitle = document.getElementById('sale-modal-subtitle');
        const channelSelect = document.getElementById('sale-channel');

        if (title) {
            if (type === 'ONLINE') {
                title.innerText = '🌐 New Online Platform Order';
                if (subtitle) {
                    subtitle.innerText = 'ONLINE SALES MODULE';
                    subtitle.style.color = 'var(--primary)';
                }
                if (channelSelect) channelSelect.value = 'ONLINE';
            } else {
                title.innerText = '🏢 New Direct Company Sale';
                if (subtitle) {
                    subtitle.innerText = 'DIRECT SALES MODULE';
                    subtitle.style.color = 'var(--accent)';
                }
                if (channelSelect) channelSelect.value = 'DIRECT';
            }
        }

        // Clear search inputs
        safeSetVal('sale-party-search', '');
        safeSetVal('sale-party', '');
        safeSetVal('sale-prod-search', '');
        safeSetVal('sale-prod-select', '');
        safeSetVal('sale-batch-select', '');

        document.getElementById('directSaleModal').classList.remove('hidden');
    } catch (e) {
        console.error("Error opening Direct Sale modal:", e);
        alert("Failed to open Order Entry: " + e.message + "\nPlease refresh data.");
    }
}

function openDirectOrderFromParty() {
    const partyId = document.getElementById('party-id').value;
    if (!partyId) return;
    
    closePartyModal();
    openDirectSaleModal('DIRECT');
    
    // Set the party in the sale modal after it opens
    setTimeout(() => {
        const party = allStockists.find(s => (s._id || s.id) == partyId);
        if (party) {
            safeSetVal('sale-party', partyId);
            safeSetVal('sale-party-search', party.companyName || party.name);
            updateSalePartyContext();
        }
    }, 150);
}

function closeSaleModal() {
    document.getElementById('directSaleModal').classList.add('hidden');
}

function updateSalePartyContext() {
    const partyId = document.getElementById('sale-party')?.value || '';
    const party = allStockists.find(s => (s._id || s.id) == partyId);
    
    if (party) {
        const supplyEl = document.getElementById('sale-supply');
        if (supplyEl) {
            // Priority: Party State -> Party City -> Company Default
            // For GST, Place of Supply is usually the State.
            const state = party.state || party.city || (companyProfile ? companyProfile.defaultPlaceOfSupply : '');
            supplyEl.value = state;
        }
    }

    const prodId = document.getElementById('sale-prod-select').value;
    if (prodId) updateSaleProductMeta(prodId);
    
    renderSaleItems(); // Force re-render to update GST split labels
}

function updateSaleProductMeta(prodId) {
    if (!prodId) return;
    const prod = allProducts.find(p => (p._id || p.id) == prodId);
    if (!prod) return;

    // Set HSN and default MRP/Rate from product level
    safeSetVal('sale-hsn', prod.hsn || '');
    safeSetVal('sale-mrp', prod.mrp || 0);
    safeSetVal('sale-ptr', prod.ptr || 0);
    safeSetVal('sale-rate', prod.pts || 0); // Default to PTS as rate
    safeSetVal('sale-gst-pct', prod.gstPercent || 0);

    // Populate Batch Dropdown
    const batchSelect = document.getElementById('sale-batch-select');
    if (batchSelect) {
        const batches = prod.batches || [];
        batchSelect.innerHTML = '<option value="">-- Select Batch --</option>' +
            batches.map(b => {
                const info = checkBatchStatus(b.expDate);
                const isOutOfStock = (b.qtyAvailable || 0) <= 0;
                const disabled = info.status === 'expired' ? 'disabled' : '';
                const color = info.status === 'expired' ? '#ef4444' : (info.status === 'near' ? '#f59e0b' : (isOutOfStock ? '#6b7280' : ''));
                const stockLabel = isOutOfStock ? ' [OUT]' : ` (Q:${b.qtyAvailable}${info.label})`;
                return `<option value="${b.batchNo}" ${disabled} style="color:${color}">${b.batchNo}${stockLabel}</option>`;
            }).join('');

        // Auto-select first non-expired batch with stock
        if (batches.length > 0) {
            const bestBatch = batches.find(b => {
                const info = checkBatchStatus(b.expDate);
                return info.status !== 'expired' && (b.qtyAvailable || 0) > 0;
            }) || batches[0];
            
            batchSelect.value = bestBatch.batchNo;
            updateSaleBatchMeta(bestBatch.batchNo);
        }
    }

    // Check for negotiated price
    const partyId = document.getElementById('sale-party')?.value || '';
    const party = allStockists.find(s => (s._id || s.id) == partyId);
    let finalRate = parseFloat(prod.pts || 0);
    
    if (party && party.negotiatedPrices) {
        const neg = party.negotiatedPrices.find(n => (n.productId || n.product) == prodId);
        if (neg) finalRate = parseFloat(neg.lockedRate || neg.price || finalRate);
    }
    
    safeSetVal('sale-rate', finalRate);
    calculateSaleLineTotal();
    
    // Auto-focus Qty for fast entry
    const qtyEl = document.getElementById('sale-qty');
    if (qtyEl) { 
        qtyEl.focus(); 
        qtyEl.select(); 
    }
}

function updateSaleBatchMeta(batchNo) {
    const prodId = document.getElementById('sale-prod-select').value;
    const prod = allProducts.find(p => (p._id || p.id) == prodId);
    if (prod && batchNo) {
        const batch = prod.batches.find(b => b.batchNo === batchNo);
        if (batch) {
            safeSetVal('sale-pack', prod.packing || '');
            safeSetVal('sale-mfg-dt', batch.mfgDate || '');
            safeSetVal('sale-exp-dt', batch.expDate || '');
            if (batch.mrp) safeSetVal('sale-mrp', batch.mrp);
            if (batch.ptr) safeSetVal('sale-ptr', batch.ptr);
            // Optional: If batch has specific PTS, update rate
            if (batch.pts) safeSetVal('sale-rate', batch.pts);
        }
    }
    calculateSaleLineTotal();
}

function calculateSaleLineTotal() {
    const qty = Number(document.getElementById('sale-qty').value || 0);
    const rate = Number(document.getElementById('sale-rate').value || 0);
    const gstPct = Number(document.getElementById('sale-gst-pct').value || 0);
    
    const taxable = qty * rate;
    const gst = (taxable * gstPct) / 100;
    const total = taxable + gst;
    
    const el = document.getElementById('sale-line-total');
    if (el) el.innerText = '₹' + (total || 0).toLocaleString('en-IN', {minimumFractionDigits: 2});
}

// ============================================================
// EXCEL-STYLE GRID — SALE
// ============================================================

const SALE_COLS = ['name','batch','ptr','rate','qty','free'];

function updateSaleCell(rowIdx, field, value) {
    if (!directSaleItems[rowIdx]) return;
    const numFields = ['ptr','rate','qty','free','gstPercent','totalValue'];
    directSaleItems[rowIdx][field] = numFields.includes(field) ? (parseFloat(value) || 0) : value;
    const item = directSaleItems[rowIdx];
    item.totalValue = Number(((item.qty || 0) * (item.rate || 0)).toFixed(2));
    const ltEl = document.getElementById(`sale-lt-${rowIdx}`);
    const pct = Number(item.gstPercent) || 0;
    const gstAmt = (item.totalValue * pct) / 100;
    if (ltEl) ltEl.innerText = '₹' + (item.totalValue + gstAmt).toFixed(2);
    updateSaleStripTotals();
}

function saleGridKey(e, rowIdx, col) {
    const colIdx = SALE_COLS.indexOf(col);
    const isSearch = (col === 'name');

    if (e.key === 'Escape') { closeSaleGridDropdown(rowIdx); return; }

    if (isSearch) {
        const dd = document.getElementById(`sale-dd-${rowIdx}`);
        if (dd && dd.style.display !== 'none') return; // let dropdown handle
    }

    if (e.key === 'Tab' || e.key === 'ArrowRight') {
        e.preventDefault();
        if (colIdx < SALE_COLS.length - 1) focusSaleCell(rowIdx, SALE_COLS[colIdx + 1]);
    } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (colIdx > 0) focusSaleCell(rowIdx, SALE_COLS[colIdx - 1]);
    } else if (e.key === 'ArrowDown' || e.key === 'Enter') {
        e.preventDefault();
        if (rowIdx === directSaleItems.length - 1) {
            ensureSaleEmptyRow();
            renderSaleItems();
        }
        focusSaleCell(rowIdx + 1, col);
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (rowIdx > 0) focusSaleCell(rowIdx - 1, col);
    }
}

function saleGridSearch(rowIdx, inputEl) {
    const query = inputEl.value.toLowerCase().trim();
    directSaleItems[rowIdx].name = inputEl.value;
    directSaleItems[rowIdx].product = '';

    const dd = document.getElementById(`sale-dd-${rowIdx}`);
    if (!dd) return;
    if (!query) { dd.style.display = 'none'; return; }

    const matches = allProducts.filter(p =>
        p.name.toLowerCase().includes(query) ||
        (p.hsn && p.hsn.toLowerCase().includes(query))
    ).slice(0, 12);

    if (!matches.length) { dd.innerHTML = '<div style="padding:8px;color:var(--text-muted);font-size:0.75rem;">No match</div>'; dd.style.display = 'block'; return; }

    dd.innerHTML = matches.map(p => `
        <div onclick="saleGridSelectProduct(${rowIdx}, '${p._id || p.id}')"
             style="padding:6px 10px;cursor:pointer;border-bottom:1px solid rgba(255,255,255,0.05);font-size:0.72rem;display:flex;gap:8px;align-items:center;"
             onmouseover="this.style.background='rgba(16,185,129,0.18)'"
             onmouseout="this.style.background='transparent'">
            <span style="font-weight:700;color:#fff;flex:1;">${p.name}</span>
            <span style="color:var(--text-muted);font-size:0.65rem;">${p.hsn || ''}</span>
        </div>`).join('');
    dd.style.display = 'block';
    const rect = inputEl.getBoundingClientRect();
    dd.style.top = rect.bottom + 'px';
    dd.style.left = rect.left + 'px';
    dd.style.width = Math.max(rect.width, 280) + 'px';
}

function saleGridSelectProduct(rowIdx, productId) {
    const p = allProducts.find(x => (x._id || x.id) == productId);
    if (!p) return;
    const item = directSaleItems[rowIdx];
    item.product = productId;
    item.name = p.name;
    item.hsn = p.hsn || '';
    item.pack = p.packSize || p.pack || '';
    item.gstPercent = p.gstRate || (window.companyProfile ? window.companyProfile.gstRate : 5);
    item.mrp = p.mrp ? String(p.mrp) : '';
    item.ptr = p.ptr || 0;
    item.rate = p.ptr || 0;
    // Load batches
    item._batchOptions = (p.batches || []).map(b => ({ batchNo: b.batchNo, mfg: b.mfgDate || '', exp: b.expDate || '', mrp: b.mrp || p.mrp || '', qty: b.qtyAvailable || 0 }));
    closeSaleGridDropdown(rowIdx);
    renderSaleItems();
    setTimeout(() => focusSaleCell(rowIdx, 'batch'), 30);
}

function closeSaleGridDropdown(rowIdx) {
    const dd = document.getElementById(`sale-dd-${rowIdx}`);
    if (dd) dd.style.display = 'none';
}

function deleteSaleRow(rowIdx) {
    if (directSaleItems.length <= 1) {
        directSaleItems[0] = { product: '', name: '', batch: '', hsn: '', pack: '', mfgDate: '', expDate: '', mrp: '', ptr: 0, qty: 0, free: 0, rate: 0, gstPercent: 0, totalValue: 0, _batchOptions: [] };
    } else {
        directSaleItems.splice(rowIdx, 1);
    }
    renderSaleItems();
}

function buildSaleRow(i) {
    const item = directSaleItems[i];
    const cellSt = 'padding:1px 3px;border-right:1px solid rgba(255,255,255,0.06);';
    const isEmpty = !item.product && !item.name;
    const pct = Number(item.gstPercent) || 0;
    const gstAmt = (Number(item.totalValue || 0) * pct) / 100;
    const lineTotal = Number(item.totalValue || 0) + gstAmt;

    const inpSt = 'width:100%;background:transparent;border:none;color:#fff;font-size:0.7rem;padding:2px 4px;outline:none;';

    // Batch select options
    const batchOpts = (item._batchOptions || []).map(b =>
        `<option value="${escHtml(b.batchNo)}" ${item.batch === b.batchNo ? 'selected' : ''}>${escHtml(b.batchNo)} (${b.exp||'?'}) Qty:${b.qty}</option>`
    ).join('');

    return `<tr data-salerow="${i}" style="border-bottom:1px solid rgba(255,255,255,0.06);background:${isEmpty ? 'rgba(255,255,255,0.01)' : 'transparent'};transition:background 0.15s;"
        onmouseover="this.style.background='rgba(16,185,129,0.07)'" onmouseout="this.style.background='${isEmpty ? 'rgba(255,255,255,0.01)' : 'transparent'}'">
        <td style="text-align:center;padding:2px;border-right:1px solid rgba(255,255,255,0.06);">
            <button type="button" onclick="deleteSaleRow(${i})" style="background:none;border:none;color:#ef444499;cursor:pointer;font-size:0.9rem;padding:0 4px;" title="Delete row">✕</button>
        </td>
        <td style="${cellSt}position:relative;overflow:visible;min-width:160px;">
            <input id="sale-cell-${i}-name" type="text" value="${escHtml(item.name||'')}" autocomplete="off" placeholder="Search product..."
                onfocus="saleGridSearch(${i},this)"
                oninput="updateSaleCell(${i},'name',this.value);saleGridSearch(${i},this)"
                onkeydown="saleGridKey(event,${i},'name')"
                style="${inpSt}">
            <div id="sale-dd-${i}" style="display:none;position:fixed;z-index:99999;background:#1e293b;border:1px solid rgba(16,185,129,0.4);border-radius:8px;max-height:220px;overflow-y:auto;box-shadow:0 8px 32px rgba(0,0,0,0.5);"></div>
        </td>
        <td style="${cellSt}font-size:0.65rem;opacity:0.6;">${escHtml(item.hsn||'-')}</td>
        <td style="${cellSt}font-size:0.65rem;opacity:0.6;">${escHtml(item.pack||'-')}</td>
        <td style="${cellSt}min-width:110px;">
            <select id="sale-cell-${i}-batch" onchange="updateSaleCell(${i},'batch',this.value);updateSaleBatchMetaGrid(${i},this.value)"
                onkeydown="saleGridKey(event,${i},'batch')"
                style="width:100%;background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.1);color:#fff;font-size:0.68rem;padding:1px 2px;border-radius:2px;height:22px;">
                <option value="">-- Batch --</option>
                ${batchOpts}
            </select>
        </td>
        <td style="${cellSt}font-size:0.65rem;opacity:0.6;">${escHtml(item.mfgDate||'-')}</td>
        <td style="${cellSt}font-size:0.65rem;">${escHtml(item.expDate||item.exp||'-')}</td>
        <td style="${cellSt}font-size:0.65rem;opacity:0.6;">${item.mrp ? '₹'+Number(item.mrp).toFixed(2) : '-'}</td>
        <td style="${cellSt}">
            <input id="sale-cell-${i}-ptr" type="number" value="${item.ptr||0}" step="0.01" onkeydown="saleGridKey(event,${i},'ptr')" oninput="updateSaleCell(${i},'ptr',this.value)" style="${inpSt}">
        </td>
        <td style="${cellSt}">
            <input id="sale-cell-${i}-rate" type="number" value="${item.rate||0}" step="0.01" onkeydown="saleGridKey(event,${i},'rate')" oninput="updateSaleCell(${i},'rate',this.value)" style="${inpSt}">
        </td>
        <td style="${cellSt}">
            <input id="sale-cell-${i}-qty" type="number" value="${item.qty||0}" min="0" onkeydown="saleGridKey(event,${i},'qty')" oninput="updateSaleCell(${i},'qty',this.value)" style="${inpSt}">
        </td>
        <td style="${cellSt}">
            <input id="sale-cell-${i}-free" type="number" value="${item.free||0}" min="0" onkeydown="saleGridKey(event,${i},'free')" oninput="updateSaleCell(${i},'free',this.value)" style="${inpSt}">
        </td>
        <td style="${cellSt}font-size:0.65rem;opacity:0.6;text-align:center;">${pct}%</td>
        <td style="text-align:right;padding:2px 8px 2px 4px;font-weight:800;color:var(--accent);font-size:0.72rem;font-family:monospace;" id="sale-lt-${i}">₹${lineTotal.toFixed(2)}</td>
    </tr>`;
}

function updateSaleBatchMetaGrid(rowIdx, batchNo) {
    const item = directSaleItems[rowIdx];
    const b = (item._batchOptions || []).find(x => x.batchNo === batchNo);
    if (!b) return;
    item.batch = batchNo;
    item.mfgDate = b.mfg || '';
    item.expDate = b.exp || '';
    item.mrp = b.mrp ? String(b.mrp) : (item.mrp || '');
    // Re-render row to show updated meta
    const tbody = document.getElementById('sale-items-body');
    if (tbody) {
        const tr = tbody.querySelector(`tr[data-salerow="${rowIdx}"]`);
        if (tr) tr.outerHTML = buildSaleRow(rowIdx);
    }
    focusSaleCell(rowIdx, 'rate');
}

function addSaleItem() {
    // Legacy compat: add empty row and focus
    ensureSaleEmptyRow();
    renderSaleItems();
    const lastIdx = directSaleItems.length - 1;
    setTimeout(() => focusSaleCell(lastIdx, 'name'), 50);
}

function handleSalesRowKey(e, currentId) {
    // Legacy: no-op, grid handles its own keys
}

function renderSaleItems() {
    const tbody = document.getElementById('sale-items-body');
    if (!tbody) return;
    if (!directSaleItems.length) ensureSaleEmptyRow();
    tbody.innerHTML = directSaleItems.map((_, i) => buildSaleRow(i)).join('');
    updateSaleStripTotals();
}

function updateDirectSaleLine(index, field, value) {
    updateSaleCell(index, field, value);
}




// --- DIRECT SALE ADDITIONAL CHARGES ---

// Variables moved to top

function addSaleCharge() {
    const name = document.getElementById('sale-charge-name').value.trim();
    const hsn = document.getElementById('sale-charge-hsn').value.trim();
    const amount = parseFloat(document.getElementById('sale-charge-amount').value) || 0;
    const gstPct = parseFloat(document.getElementById('sale-charge-gst').value) || 0;

    if (!name || amount <= 0) return alert('⚠️ Please enter charge name and amount');

    const gstAmount = Number((amount * (gstPct / 100)).toFixed(2));
    const total = Number((amount + gstAmount).toFixed(2));

    saleCharges.push({ name, hsn, amount, gstPct, gstAmount, total });
    
    document.getElementById('sale-charge-name').value = '';
    document.getElementById('sale-charge-hsn').value = '';
    document.getElementById('sale-charge-amount').value = '';
    
    renderSaleCharges();
}

function renderSaleCharges() {
    const tbody = document.getElementById('sale-charges-body');
    if (!tbody) return;

    tbody.innerHTML = saleCharges.map((c, idx) => `
        <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
            <td style="padding: 4px 8px;">${c.name}</td>
            <td style="padding: 4px 8px; text-align: right;">₹${c.amount.toFixed(2)}</td>
            <td style="padding: 4px 8px; text-align: center;">${c.gstPct}%</td>
            <td style="padding: 4px 8px; text-align: right; font-weight: 700;">₹${c.total.toFixed(2)}</td>
            <td style="padding: 4px 8px; text-align: center;">
                <button type="button" onclick="saleCharges.splice(${idx}, 1); renderSaleCharges();" style="background:none; border:none; color:#ef4444; cursor:pointer; font-size:0.8rem;">✓•</button>
            </td>
        </tr>
    `).join('');

    updateSaleStripTotals();
}

function updateSaleStripTotals() {
    let prodTotal = 0;
    let gstTotal = 0;
    
    directSaleItems.forEach(item => {
        const val = (item.qty || 0) * (item.rate || 0);
        const gst = (val * (item.gstPercent || 0)) / 100;
        prodTotal += val;
        gstTotal += gst;
    });

    // Add Additional Charges
    const chargesTaxable = saleCharges.reduce((acc, c) => acc + (c.amount || 0), 0);
    const chargesGst = saleCharges.reduce((acc, c) => acc + (c.gstAmount || 0), 0);
    
    const subTotal = prodTotal + chargesTaxable;
    gstTotal += chargesGst;
    
    const total = subTotal + gstTotal;
    const rounded = Math.round(total);
    const roundOff = rounded - total;
    
    const setVal = (id, val) => { const el = document.getElementById(id); if(el) el.innerText = val; };
    
    setVal('strip-sale-count', directSaleItems.length);
    setVal('strip-sale-subtotal', '₹' + prodTotal.toLocaleString('en-IN', {minimumFractionDigits: 2}));
    setVal('strip-sale-charges', '₹' + chargesTaxable.toLocaleString('en-IN', {minimumFractionDigits: 2}));
    setVal('strip-sale-gst', '₹' + gstTotal.toLocaleString('en-IN', {minimumFractionDigits: 2}));
    setVal('strip-sale-roundoff', (roundOff >= 0 ? '+' : '') + '₹' + roundOff.toFixed(2));
    setVal('strip-sale-total', '₹' + rounded.toLocaleString('en-IN', {minimumFractionDigits: 2}));

    // Update Split GST Labels
    const supplyState = (document.getElementById('sale-supply')?.value || '').toLowerCase();
    const partyId = document.getElementById('sale-party')?.value || '';
    const party = allStockists.find(s => (s._id || s.id) == partyId);
    const partyGst = (party?.gst || party?.gstNo || '').substring(0, 2);
    const isIntra = (partyGst === '36') || (supplyState.includes('telangana'));
    
    const labelEl = document.getElementById('label-sale-gst');
    const splitEl = document.getElementById('strip-sale-gst-split');
    
    if (gstTotal > 0) {
        if (isIntra) {
            if (labelEl) labelEl.innerText = "CGST+SGST:";
            if (splitEl) splitEl.innerText = `(C:${(gstTotal/2).toFixed(2)}|S:${(gstTotal/2).toFixed(2)})`;
        } else {
            if (labelEl) labelEl.innerText = "IGST:";
            if (splitEl) splitEl.innerText = `(INTER-STATE)`;
        }
    } else {
        if (labelEl) labelEl.innerText = "GST:";
        if (splitEl) splitEl.innerText = "";
    }
}

async function saveDirectSale(e) {
    e.preventDefault();
    // Strip empty grid rows before submitting
    directSaleItems = directSaleItems.filter(i => i.product && i.qty > 0);
    if (!directSaleItems.length) return alert("Add at least one item with a product and quantity");

    const partyId = safeGetVal('sale-party');
    const party = allStockists.find(s => (s._id || s.id) == partyId);

    // Robust button selection to prevent UI hang
    const btn = e.submitter || e.target.querySelector('button[type="submit"]');
    const originalText = btn ? btn.innerText : 'CONFIRM SALE';
    
    if (btn) {
        btn.disabled = true;
        btn.innerText = '⌛ SAVING SALE...';
    }

    const subTotalItems = directSaleItems.reduce((s, i) => s + (Number(i.totalValue) || 0), 0);
    const gstAmountItems = directSaleItems.reduce((s, i) => s + ((Number(i.totalValue) || 0) * (Number(i.gstPercent) || 0) / 100), 0);
    
    const chargesTaxable = saleCharges.reduce((acc, c) => acc + (c.amount || 0), 0);
    const chargesGst = saleCharges.reduce((acc, c) => acc + (c.gstAmount || 0), 0);
    const otherChargesTotal = saleCharges.reduce((acc, c) => acc + (c.total || 0), 0);

    const subTotal = Number((subTotalItems + chargesTaxable).toFixed(2));
    const gstAmount = Number((gstAmountItems + chargesGst).toFixed(2));
    const grandTotal = Math.round(subTotal + gstAmount);

    const data = {
        party: partyId,
        partyName: party ? (party.companyName || party.name) : 'Direct Customer',
        refNo: safeGetVal('sale-ref-no'),
        date: safeGetVal('sale-date'),
        channel: safeGetVal('sale-channel'),
        paymentMode: safeGetVal('sale-payment-mode'),
        remarks: safeGetVal('sale-remarks'),
        placeOfSupply: safeGetVal('sale-supply') || (companyProfile ? companyProfile.defaultPlaceOfSupply : ''),
        dueDate: safeGetVal('sale-due-date'),
        items: directSaleItems,
        additionalCharges: saleCharges,
        otherChargesTotal,
        subTotal,
        gstAmount,
        grandTotal,
        type: safeGetVal('sale-type-input')
    };


    try {
        const url = isEditMode ? `${API_BASE}/admin/invoices/${editingInvoiceId}` : `${API_BASE}/admin/direct-sale`;
        const method = isEditMode ? 'PUT' : 'POST';

        const res = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await res.json();
        
        if (result.success) {
            // Reset button BEFORE alert to keep UI alive
            if (btn) { btn.disabled = false; btn.innerText = originalText; }
            
            const msg = isEditMode ? `✅ Invoice Updated Successfully!` : `✅ Direct Sale Recorded!\nOrder No: ${result.order.orderNo}\nInvoice No: ${result.invoice.invoiceNo}`;
            alert(msg);
            
            // RESET EVERYTHING for the next invoice
            isEditMode = false;
            editingInvoiceId = null;
            const currentType = document.getElementById('sale-type-input').value;
            openDirectSaleModal(currentType); 
            
            // Reload tables in background
            loadOrders();
            loadInvoices();
            refreshDashboard();
        } else {
            if (btn) { btn.disabled = false; btn.innerText = originalText; }
            alert("❌ Save failed: " + (result.error || "Unknown error"));
        }
    } catch (e) { 
        if (btn) { btn.disabled = false; btn.innerText = originalText; }
        console.error("Direct Sale Save Fail:", e);
        alert("❌ Network/Server Error while saving sale."); 
    }
}

function updateSaleChannelContext(val) {
    const subtitle = document.getElementById('sale-modal-subtitle');
    if (val === 'ONLINE') {
        subtitle.innerText = 'ONLINE SALES MODULE';
        subtitle.style.color = 'var(--primary)';
    } else {
        subtitle.innerText = 'DIRECT SALES MODULE';
        subtitle.style.color = 'var(--accent)';
    }
}

// --- REPORTING & COMPLIANCE LOGIC ---
async function exportGSTR1() {
    const month = document.getElementById('report-month').value;
    const year = document.getElementById('report-year').value;
    
    try {
        const res = await fetch('/api/admin/reports/gstr1?month=' + month + '&year=' + year);
        const data = await res.json();
        
        if (!data.length) {
            alert("No data found for selected period.");
            return;
        }

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "GSTR1_B2B");
        XLSX.writeFile(wb, "GSTR1_Report_" + month + "_" + year + ".xlsx");
    } catch (e) { alert("Report export failed"); }
}

function updateDirectSaleStats() {
    const totalVal = allProducts.reduce((sum, p) => sum + (Number(p.qtyAvailable || 0) * Number(p.pts || 0)), 0);
}

function refreshInventoryVal() {
    const totalVal = allProducts.reduce((sum, p) => sum + (Number(p.qtyAvailable || 0) * Number(p.pts || 0)), 0);
    const valEl = document.getElementById('report-inventory-val');
    if (valEl) {
        valEl.innerText = '₹' + totalVal.toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }
}

// --- MISSING UTILS & RECOVERED LOGIC ---
function updateStats() {
    const totalStockists = allStockists.length;
    const pendingOrders = allOrders.filter(o => o.status === 'pending').length;
    const totalProducts = allProducts.length;
    
    if(document.getElementById('stat-stockists')) document.getElementById('stat-stockists').innerText = totalStockists;
    if(document.getElementById('stat-pending')) document.getElementById('stat-pending').innerText = pendingOrders;
    if(document.getElementById('stat-orders')) document.getElementById('stat-orders').innerText = allOrders.length;
}

// --- FINANCIAL NOTES LOGIC ---


async function loadFinancialNotes() {
    try {
        const res = await fetch('/api/admin/financial-notes');
        const data = await res.json();
        if (!Array.isArray(data)) return;

        allNotes = data.map(n => ({
            ...n,
            _id: n._id || n.id,
            amount: Number(n.amount || 0),
            stockist: n.stockist || n.Stockist,
            partyName: n.partyName || (n.stockist || n.Stockist)?.name || 'Direct Customer'
        }));
        renderFinancialNotes();
    } catch (e) { console.error("Load notes fail", e); }
}

function filterNotes() {
    const query = document.getElementById('noteSearch').value.toLowerCase();
    
    // Update dynamic title
    const titleEl = document.getElementById('notes-page-title');
    if (titleEl) {
        if (currentNoteReason === 'ALL') titleEl.innerText = "📈 Global Financial Adjustments";
        else titleEl.innerText = `📈 ${currentNoteReason} Records`;
    }

    const filtered = allNotes.filter(n => {
        const nNo = (n.noteNo || '').toLowerCase();
        const nParty = (n.partyName || '').toLowerCase();
        const matchesQuery = nNo.includes(query) || nParty.includes(query);
        
        let matchesReason = currentNoteReason === 'ALL' || n.reason === currentNoteReason;
        
        // Combined filter for Price Difference
        if (currentNoteReason === 'Price Diff') {
            matchesReason = (n.reason === 'Price Diff CN' || n.reason === 'Price Diff DN');
        } else if (currentNoteReason === 'Salable Return') {
            matchesReason = (n.reason === 'Salable Return' || n.reason === 'Dmg/Exp/Brk Return' || n.reason === 'Exp/Brk/Damg CN');
        }
        
        return matchesQuery && matchesReason;
    });
    
    renderFinancialNotes(filtered);
}

function updateNotePartyDetails(id, infoId = 'note-party-info') {
    const s = allStockists.find(x => x._id == id);
    const info = document.getElementById(infoId);
    if (s && info) {
        info.innerText = `Current Outstanding: ₹${s.outstandingBalance.toLocaleString('en-IN')}`;
    } else if (info) {
        info.innerText = '';
    }
}

function renderFinancialNotes(data = allNotes) {
    const tbody = document.getElementById('noteTableBody');
    if (!tbody || !Array.isArray(data)) return;

    tbody.innerHTML = data.map(n => {
        const isPending = n.status === 'pending';
        const statusBadge = n.status 
            ? `<span class="badge ${n.status === 'approved' ? 'badge-approved' : (n.status === 'rejected' ? 'badge-rejected' : 'badge-pending')}" style="font-size:0.6rem; margin-top:2px;">${n.status.toUpperCase()}</span>`
            : '';

        return `
            <tr>
                <td style="font-family:monospace; font-weight:700; color:${n.noteType === 'CN' ? 'var(--accent)' : '#ef4444'};">
                    ${n.noteNo}
                    <br>${statusBadge}
                </td>
                <td><span class="badge ${n.noteType === 'CN' ? 'badge-approved' : 'badge-pending'}">${n.noteType === 'CN' ? 'CREDIT' : 'DEBIT'}</span></td>
                <td style="font-weight:600;">${n.partyName}</td>
                <td>
                    <div style="font-weight:700;">${n.reason}</div>
                    ${n.items && n.items.length > 0 
                        ? `<div style="font-size:0.7rem; color:var(--text-muted);">📦 ${n.items.length} Items | Inv: ${n.refInvoiceNo || '-'}</div>` 
                        : (n.productName ? `<div style="font-size:0.7rem; color:var(--text-muted);">📦 ${n.productName} | ${n.batchNo} | Qty: ${n.qty}</div>` : '')}
                </td>
                <td style="text-align:right; font-weight:800; color:${n.noteType === 'CN' ? 'var(--accent)' : '#ef4444'};">₹${Number(n.amount || 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>

                <td>${new Date(n.createdAt).toLocaleDateString('en-GB')}</td>
                <td style="text-align:right; display: flex; gap: 5px; justify-content: flex-end; align-items: center;">
                    ${isPending ? `
                        <button class="btn btn-primary" style="padding:4px 8px; font-size:0.65rem; background:#10b981;" onclick="reviewFinancialNote('${n.id || n._id}', 'approve')">APPROVE</button>
                        <button class="btn btn-primary" style="padding:4px 8px; font-size:0.65rem; background:#ef4444;" onclick="reviewFinancialNote('${n.id || n._id}', 'reject')">REJECT</button>
                    ` : ''}
                    <button class="btn btn-ghost" style="padding:5px 10px;" onclick="editNote('${n.id || n._id}')" title="Edit Record">✏️</button>
                    <button class="btn btn-ghost" style="padding:5px 10px;" onclick="downloadNotePDF('${n.id || n._id}')" title="Download PDF">⬇️</button>
                    <button class="btn btn-ghost" style="padding:5px 10px; color:#ef4444;" onclick="deleteNote('${n.id || n._id}')" title="Delete Record">🗑 </button>
                </td>
                <td style="text-align:center;">
                    <button class="btn btn-ghost" style="padding:5px 10px;" onclick="viewNotePDF('${n.id || n._id}')" title="View PDF">📄</button>
                </td>
            </tr>
        `;
    }).join('');
}

async function reviewFinancialNote(id, action) {
    if (!confirm(`Are you sure you want to ${action} this request?`)) return;
    try {
        const res = await fetch(`/api/admin/financial-notes/${action}/${id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        const result = await res.json();
        if (result.success) {
            alert(`Request ${action}d successfully`);
            loadFinancialNotes();
        } else {
            alert("Error: " + (result.message || result.error));
        }
    } catch (e) { alert("Action failed"); }
}

async function reviewPDCNClaim(id, action) {
    if (!confirm(`Are you sure you want to ${action} this claim?`)) return;
    try {
        const res = await fetch(`/api/admin/pdcn-claim/${id}/review`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action })
        });
        const result = await res.json();
        if (result.success) {
            alert(result.message);
            loadFinancialNotes();
        } else {
            alert("Error: " + result.error);
        }
    } catch (e) { alert("Action failed"); }
}

async function editNote(id) {
    const note = allNotes.find(x => x._id == id);
    if (!note) return;
    currentEditingNoteId = id;
    // Any note that was created with items OR belongs to a multi-item module goes to unified table
    const multiItemReasons = ['Salable Return','Exp/Brk/Damg CN','Price Diff CN','Purchase Return','Price Diff DN','Brk/Dmg/Loss DN'];
    if ((note.items && note.items.length > 0) || multiItemReasons.includes(note.reason)) {
        openReturnModal(note.reason, note);
    } else {
        openNoteModal(note);
    }
}

async function deleteNote(id) {
    if (!confirm("⚠️ CAUTION: Are you sure you want to COMPLETELY DELETE this note?\n\nThis will REVERSE all inventory changes and accounting impacts (Stockist balance will be adjusted back). This action cannot be undone.")) return;

    try {
        const res = await fetch(`/api/admin/financial-notes/${id}`, { method: 'DELETE' });
        const result = await res.json();
        if (result.success) {
            alert("✅ Note deleted and all impacts reversed successfully.");
            await loadFinancialNotes();
            await loadProducts();
            await loadStockists();
            renderFinancialNotes();
        } else {
            alert("Error: " + result.message);
        }
    } catch (e) { alert("Failed to delete note"); }
}

function openNoteModal(editData = null) {
    // Route ALL multi-item module types to the unified return modal
    const multiItemReasons = ['Salable Return','Exp/Brk/Damg CN','Price Diff CN','Purchase Return','Price Diff DN','Brk/Dmg/Loss DN'];
    const activeReason = editData ? editData.reason : currentNoteReason;
    if (!editData && multiItemReasons.includes(activeReason)) {
        openReturnModal(activeReason);
        return;
    }

    const select = document.getElementById('note-party');
    if(select) {
        select.innerHTML = '<option value="">-- Select Party --</option>' + 
            allStockists.map(s => `<option value="${s._id}">${s.name} (${s.partyType || 'STOCKIST'})</option>`).join('');
    }

    const prodSelect = document.getElementById('note-product');
    if(prodSelect) {
        prodSelect.innerHTML = '<option value="">-- Select Product --</option>' + 
            allProducts.map(p => `<option value="${p._id}">${p.name} (${p.packing})</option>`).join('');
    }
    
    const form = document.getElementById('noteForm');
    if(form) form.reset();
    document.getElementById('note-inventory-fields').classList.add('hidden');

    if (editData) {
        document.getElementById('note-type').value = editData.noteType;
        document.getElementById('note-party').value = editData.party?._id || editData.party;
        updateNotePartyDetails(editData.party?._id || editData.party);
        
        document.getElementById('note-amount').value = editData.amount;
        document.getElementById('note-reason').value = editData.reason;
        toggleNoteInventoryFields(editData.reason); // Trigger visibility toggle!
        
        document.getElementById('note-desc').value = editData.description;
        if (editData.productId) {
            document.getElementById('note-product').value = editData.productId;
            document.getElementById('note-batch').value = editData.batchNo || '';
            document.getElementById('note-qty').value = editData.qty || 0;
        }
        document.getElementById('note-modal-title').innerText = "✓ï¸ Edit Financial Note";
    } else {
        document.getElementById('note-modal-title').innerText = "📈 Record Financial Adjustment";
        currentEditingNoteId = null;
    }

    document.getElementById('noteModal').classList.remove('hidden');
}

function toggleNoteInventoryFields(reason) {
    const fields = document.getElementById('note-inventory-fields');
    const typeSelect = document.getElementById('note-type');
    
    // Auto-set Note Type based on common patterns
    if (reason.includes('CN') || reason === 'Salable Return') {
        typeSelect.value = 'CN';
    } else if (reason.includes('DN') || reason === 'Purchase Return') {
        typeSelect.value = 'DN';
    }

    if (reason === 'Salable Return' || reason === 'Purchase Return' || reason === 'Exp/Brk/Damg CN') {
        fields.classList.remove('hidden');
    } else {
        fields.classList.add('hidden');
    }
}

function updateNoteBatches(productId) {
    const p = allProducts.find(x => x._id === productId);
    if (!p) return;
    // We could make this a select, but for now we'll let them type or auto-fill first available
    if (p.batches && p.batches.length > 0) {
        document.getElementById('note-batch').value = p.batches[0].batchNo;
    }
}

function closeNoteModal() {
    document.getElementById('noteModal').classList.add('hidden');
    currentEditingNoteId = null;
}

// --- MULTI-ITEM RETURN LOGIC ---
let returnItems = [];

// Config map for all 6 return/note module types
const RETURN_MODULE_CONFIG = {
    'Salable Return':   { badge:'CREDIT NOTE', title:'Sale Return — Credit Note', noteType:'CN', submitLabel:'✓ POST & GENERATE CN', tabs:['Salable Return','Exp/Brk/Damg CN','Price Diff CN'], tabLabels:['Sale Return','Exp/Brk/Damg','Price Diff'] },
    'Exp/Brk/Damg CN':  { badge:'CREDIT NOTE', title:'Exp / Broken / Damaged — Credit Note', noteType:'CN', submitLabel:'✓ POST & GENERATE CN', tabs:['Salable Return','Exp/Brk/Damg CN','Price Diff CN'], tabLabels:['Sale Return','Exp/Brk/Damg','Price Diff'] },
    'Price Diff CN':    { badge:'CREDIT NOTE', title:'Price Difference — Credit Note', noteType:'CN', submitLabel:'✓ POST & GENERATE CN', tabs:['Salable Return','Exp/Brk/Damg CN','Price Diff CN'], tabLabels:['Sale Return','Exp/Brk/Damg','Price Diff'], isPriceDiff: true },
    'Purchase Return':  { badge:'DEBIT NOTE',  title:'Purchase Return — Debit Note', noteType:'DN', submitLabel:'✓ POST & GENERATE DN', tabs:['Purchase Return','Price Diff DN','Brk/Dmg/Loss DN'], tabLabels:['Purchase Return','Price Diff','Loss/Damage'] },
    'Price Diff DN':    { badge:'DEBIT NOTE',  title:'Price Difference — Debit Note', noteType:'DN', submitLabel:'✓ POST & GENERATE DN', tabs:['Purchase Return','Price Diff DN','Brk/Dmg/Loss DN'], tabLabels:['Purchase Return','Price Diff','Loss/Damage'], isPriceDiff: true },
    'Brk/Dmg/Loss DN': { badge:'DEBIT NOTE',  title:'Breakage / Damage / Loss — Debit Note', noteType:'DN', submitLabel:'✓ POST & GENERATE DN', tabs:['Purchase Return','Price Diff DN','Brk/Dmg/Loss DN'], tabLabels:['Purchase Return','Price Diff','Loss/Damage'] }
};

function openReturnModal(reason, editData = null) {
    const cfg = RETURN_MODULE_CONFIG[reason] || RETURN_MODULE_CONFIG['Salable Return'];
    currentEditingNoteId = editData ? editData._id : null;

    // Badge, title, note type, submit button
    document.getElementById('return-module-badge').innerText  = cfg.badge;
    document.getElementById('return-modal-title').innerText   = editData ? ('\u270f\ufe0f Edit: ' + editData.noteNo) : cfg.title;
    document.getElementById('return-note-type').value         = cfg.noteType;
    document.getElementById('return-reason').value            = reason;
    document.getElementById('return-submit-btn').innerHTML    = cfg.submitLabel;

    // CN = indigo, DN = red gradient
    const btn = document.getElementById('return-submit-btn');
    btn.style.background = cfg.noteType === 'CN'
        ? 'linear-gradient(135deg,#6366f1,#818cf8)'
        : 'linear-gradient(135deg,#ef4444,#f87171)';

    // Build 3-tab switcher
    const tabsEl = document.getElementById('return-action-tabs');
    tabsEl.innerHTML = cfg.tabs.map((t, i) => {
        const active = t === reason;
        const accentColor = cfg.noteType === 'CN' ? '#6366f1' : '#ef4444';
        return `<button type="button" onclick="switchReturnTab('${t}')"
            style="padding:5px 13px;border-radius:6px;font-size:0.63rem;font-weight:700;
                   letter-spacing:0.05em;border:1px solid ${active ? accentColor : 'transparent'};
                   cursor:pointer;transition:all 0.2s;
                   background:${active ? 'rgba(' + (cfg.noteType==='CN'?'99,102,241':'239,68,68') + ',0.22)' : 'transparent'};
                   color:${active ? '#fff' : '#64748b'};"
        >${cfg.tabLabels[i]}</button>`;
    }).join('');
    
    // --- Dynamic Table Structure ---
    const colgroup = document.getElementById('return-table-colgroup');
    const thead = document.getElementById('return-table-thead');
    const accentColor = cfg.noteType === 'CN' ? '#6366f1' : '#ef4444';
    const headerColor = cfg.isPriceDiff ? '#f59e0b' : '#475569'; // Gold for Price Diff
    
    if (cfg.isPriceDiff) {
        colgroup.innerHTML = `
            <col style="width:22%"><!-- Product -->
            <col style="width:8%"><!-- HSN -->
            <col style="width:10%"><!-- Batch -->
            <col style="width:9%"><!-- Exp -->
            <col style="width:5%"><!-- Qty -->
            <col style="width:8%"><!-- MRP -->
            <col style="width:10%"><!-- Diff Rate -->
            <col style="width:6%"><!-- GST% -->
            <col style="width:17%"><!-- Total -->
            <col style="width:5%"><!-- Del -->
        `;
        thead.innerHTML = `
            <tr style="background:rgba(245,158,11,0.1); border-bottom:1px solid rgba(245,158,11,0.25);">
                <th style="padding:7px 8px;text-align:left;font-size:0.65rem;font-weight:900;letter-spacing:0.1em;text-transform:uppercase;color:#ffffff;">Product</th>
                <th style="padding:7px 5px;text-align:left;font-size:0.65rem;font-weight:900;letter-spacing:0.1em;text-transform:uppercase;color:#ffffff;">HSN</th>
                <th style="padding:7px 5px;text-align:left;font-size:0.65rem;font-weight:900;letter-spacing:0.1em;text-transform:uppercase;color:#ffffff;">Batch No</th>
                <th style="padding:7px 5px;text-align:center;font-size:0.65rem;font-weight:900;letter-spacing:0.1em;text-transform:uppercase;color:#ffffff;">Exp (MM-YY)</th>
                <th style="padding:7px 5px;text-align:center;font-size:0.65rem;font-weight:900;letter-spacing:0.1em;text-transform:uppercase;color:#ffffff;">Qty</th>
                <th style="padding:7px 5px;text-align:center;font-size:0.65rem;font-weight:900;letter-spacing:0.1em;text-transform:uppercase;color:#ffffff;">MRP</th>
                <th style="padding:7px 12px 7px 5px;text-align:right;font-size:0.65rem;font-weight:900;letter-spacing:0.1em;text-transform:uppercase;color:#ffffff;">Diff Rate</th>
                <th style="padding:7px 5px;text-align:center;font-size:0.65rem;font-weight:900;letter-spacing:0.1em;text-transform:uppercase;color:#ffffff;">GST%</th>
                <th style="padding:7px 12px 7px 5px;text-align:right;font-size:0.65rem;font-weight:900;letter-spacing:0.1em;text-transform:uppercase;color:#ffffff;">Total</th>
                <th style="padding:7px 5px;text-align:center;font-size:0.65rem;font-weight:900;letter-spacing:0.1em;text-transform:uppercase;color:#ffffff;">Act</th>
            </tr>
        `;
        colgroup.innerHTML = `
            <col style="width:22%"><!-- Product -->
            <col style="width:8%"><!-- HSN -->
            <col style="width:10%"><!-- Batch -->
            <col style="width:9%"><!-- Exp MM-YY -->
            <col style="width:5%"><!-- Qty -->
            <col style="width:8%"><!-- MRP -->
            <col style="width:10%"><!-- Price -->
            <col style="width:6%"><!-- GST% -->
            <col style="width:17%"><!-- Total -->
            <col style="width:5%"><!-- Del -->
        `;
        thead.innerHTML = `
            <tr style="background:rgba(99,102,241,0.08);border-bottom:1px solid rgba(99,102,241,0.15);">
                <th style="padding:7px 8px;text-align:left;font-size:0.65rem;font-weight:900;letter-spacing:0.1em;text-transform:uppercase;color:#ffffff;">Product</th>
                <th style="padding:7px 5px;text-align:left;font-size:0.65rem;font-weight:900;letter-spacing:0.1em;text-transform:uppercase;color:#ffffff;">HSN</th>
                <th style="padding:7px 5px;text-align:left;font-size:0.65rem;font-weight:900;letter-spacing:0.1em;text-transform:uppercase;color:#ffffff;">Batch No</th>
                <th style="padding:7px 5px;text-align:center;font-size:0.65rem;font-weight:900;letter-spacing:0.1em;text-transform:uppercase;color:#ffffff;">Exp (MM-YY)</th>
                <th style="padding:7px 5px;text-align:center;font-size:0.65rem;font-weight:900;letter-spacing:0.1em;text-transform:uppercase;color:#ffffff;">Qty</th>
                <th style="padding:7px 5px;text-align:center;font-size:0.65rem;font-weight:900;letter-spacing:0.1em;text-transform:uppercase;color:#ffffff;">MRP</th>
                <th style="padding:7px 12px 7px 5px;text-align:right;font-size:0.65rem;font-weight:900;letter-spacing:0.1em;text-transform:uppercase;color:#ffffff;">Price</th>
                <th style="padding:7px 5px;text-align:center;font-size:0.65rem;font-weight:900;letter-spacing:0.1em;text-transform:uppercase;color:#ffffff;">GST%</th>
                <th style="padding:7px 8px;text-align:right;font-size:0.65rem;font-weight:900;letter-spacing:0.1em;text-transform:uppercase;color:#ffffff;">Total</th>
                <th style="padding:7px 5px;text-align:center;font-size:0.65rem;font-weight:900;letter-spacing:0.1em;text-transform:uppercase;color:#ffffff;">Act</th>
            </tr>
        `;
    }

    // Party dropdown
    // Party Search Setup
    document.getElementById('return-party-search').value = '';
    document.getElementById('return-party').value = '';
    document.getElementById('return-party-info').innerHTML = '';

    document.getElementById('returnForm').reset();
    document.getElementById('return-items-body').innerHTML = '';
    returnItems = [];

    if (editData && editData.items && editData.items.length > 0) {
        document.getElementById('return-party').value    = editData.party?._id || editData.party;
        updateNotePartyDetails(editData.party?._id || editData.party, 'return-party-info');
        document.getElementById('return-inv-no').value   = editData.refInvoiceNo  || '';
        document.getElementById('return-inv-date').value = editData.refInvoiceDate || '';
        editData.items.forEach(item => {
            const rowId = addReturnRow();
            const row   = document.getElementById(`return-row-${rowId}`);
            if (row) row.querySelector('.return-prod-select').value = item.productId;
            document.getElementById(`return-hsn-${rowId}`).value   = item.hsn      || '';
            document.getElementById(`return-batch-${rowId}`).value = item.batchNo  || '';
            // Populate MM-YY from stored expDate
            if (item.expDate) {
                document.getElementById(`return-exp-${rowId}`).value = item.expDate.replace('/', '-');
            }
            document.getElementById(`return-qty-${rowId}`).value     = item.qty;
            document.getElementById(`return-price-${rowId}`).value   = item.price;
            document.getElementById(`return-gst-pct-${rowId}`).value = item.gstPercent;
        });
    } else {
        addReturnRow();
    }
    calculateReturnTotals();
    document.getElementById('returnModal').classList.remove('hidden');
}

function switchReturnTab(reason) {
    // Switch tabs while preserving party/invoice header
    const party   = document.getElementById('return-party').value;
    const invNo   = document.getElementById('return-inv-no').value;
    const invDate = document.getElementById('return-inv-date').value;
    openReturnModal(reason);
    if (party)   { document.getElementById('return-party').value   = party; updateNotePartyDetails(party, 'return-party-info'); }
    if (invNo)   document.getElementById('return-inv-no').value    = invNo;
    if (invDate) document.getElementById('return-inv-date').value  = invDate;
}

function closeReturnModal() {
    document.getElementById('returnModal').classList.add('hidden');
    currentEditingNoteId = null;
}

function addReturnRow() {
    const id  = Date.now() + '-' + (returnRowCounter++);
    const row = document.createElement('tr');
    row.id    = `return-row-${id}`;
    row.style.cssText = 'border-bottom:1px solid rgba(255,255,255,0.04);transition:background 0.15s;';
    row.onmouseover = () => row.style.background = 'rgba(255,255,255,0.025)';
    row.onmouseout  = () => row.style.background = 'transparent';

    const reason = document.getElementById('return-reason').value;
    const cfg = RETURN_MODULE_CONFIG[reason] || {};
    const isPD = cfg.isPriceDiff;

    const cellStyle = 'padding:4px 5px;';
    const inputBase = 'width:100%;box-sizing:border-box;background:rgba(0,0,0,0.25);border:1px solid rgba(255,255,255,0.07);border-radius:5px;color:#e2e8f0;font-size:0.72rem;padding:4px 6px;transition:border-color 0.2s;';

    if (isPD) {
        row.innerHTML = `
            <td style="${cellStyle}padding-left:8px;" class="search-container">
                <div style="position:relative; display:flex; align-items:center;">
                    <input type="text" id="return-prod-search-${id}" placeholder="Search Product..." 
                        onfocus="handleProductSearch(this, 'RETURN-${id}')"
                        oninput="handleProductSearch(this, 'RETURN-${id}')"
                        onkeydown="handleSearchKey(event, 'return-search-results-${id}')"
                        style="${inputBase}font-size:0.71rem; border-color:rgba(245,158,11,0.2); padding-right:25px;">
                    <i class="fa fa-list-ul" onclick="document.getElementById('return-prod-search-${id}').focus(); handleProductSearch(document.getElementById('return-prod-search-${id}'), 'RETURN-${id}')" 
                       style="position:absolute; right:8px; font-size:0.65rem; color:rgba(245,158,11,0.5); cursor:pointer;"></i>
                </div>
                <input type="hidden" id="return-prod-select-${id}" class="return-prod-select">
                <div id="return-search-results-${id}" class="search-results"></div>
            </td>
            <td style="${cellStyle}">
                <input type="text" id="return-hsn-${id}" readonly
                    style="${inputBase}background:transparent;border-color:transparent;color:#e2e8f0;font-size:0.68rem;text-align:center;">
            </td>
            <td style="${cellStyle}">
                <input type="text" id="return-batch-${id}" placeholder="Batch" list="batch-list-${id}"
                    onchange="updateBatchDetails('${id}')"
                    style="${inputBase}">
                <datalist id="batch-list-${id}"></datalist>
            </td>
            <td style="${cellStyle}">
                <input type="text" id="return-exp-${id}" placeholder="MM-YY" readonly
                    onclick="openMonthYearPicker('return-exp-${id}')"
                    style="${inputBase}text-align:center; cursor:pointer; background:rgba(99,102,241,0.1); border-color:rgba(99,102,241,0.3);">
            </td>
            <td style="${cellStyle}">
                <input type="number" id="return-qty-${id}" oninput="calculateReturnTotals()" min="1" required
                    style="${inputBase}width:100%;text-align:center;">
            </td>
            <td style="${cellStyle}">
                <input type="number" id="return-mrp-${id}" readonly
                    style="${inputBase}text-align:right; font-family:monospace; color:#e2e8f0; opacity:1.0;">
            </td>
            <td style="${cellStyle}">
                <input type="number" id="return-price-${id}" oninput="calculateReturnTotals()" step="0.01" placeholder="Rate"
                    style="${inputBase}text-align:right; font-family:monospace; color:#fff; font-weight:700; border-color:rgba(245,158,11,0.3);">
            </td>
            <td style="${cellStyle}">
                <input type="number" id="return-gst-pct-${id}" oninput="calculateReturnTotals()" step="0.5"
                    style="${inputBase}text-align:center; color:#fff; font-weight:700;">
            </td>
            <td style="${cellStyle}padding-right:8px;text-align:right;font-weight:800;color:#e2e8f0;font-family:monospace;font-size:0.72rem;" id="return-row-total-${id}">₹0.00</td>
            <td style="padding:4px 6px;text-align:center;">
                <button type="button" onclick="removeReturnRow('${id}')" title="Delete Row"
                    style="background:#ef4444; border:none; color:#fff; cursor:pointer; font-size:0.65rem; font-weight:900; width:22px; height:22px; border-radius:6px; display:inline-flex; align-items:center; justify-content:center; transition:all 0.2s; box-shadow:0 2px 5px rgba(239,68,68,0.2);"
                    onmouseover="this.style.background='#dc2626'; this.style.transform='scale(1.1)';" 
                    onmouseout="this.style.background='#ef4444'; this.style.transform='scale(1)';">✓•</button>
            </td>
        `;
    } else {
        row.innerHTML = `
            <td style="${cellStyle}padding-left:8px;" class="search-container">
                <div style="position:relative; display:flex; align-items:center;">
                    <input type="text" id="return-prod-search-${id}" placeholder="Type Product..." 
                        onfocus="handleProductSearch(this, 'RETURN-${id}')"
                        oninput="handleProductSearch(this, 'RETURN-${id}')"
                        onkeydown="handleSearchKey(event, 'return-search-results-${id}')"
                        style="${inputBase}font-size:0.71rem; padding-right:25px;">
                    <i class="fa fa-list-ul" onclick="document.getElementById('return-prod-search-${id}').focus(); handleProductSearch(document.getElementById('return-prod-search-${id}'), 'RETURN-${id}')" 
                       style="position:absolute; right:8px; font-size:0.65rem; color:var(--primary); cursor:pointer; opacity:0.5;"></i>
                </div>
                <input type="hidden" id="return-prod-select-${id}" class="return-prod-select">
                <div id="return-search-results-${id}" class="search-results"></div>
            </td>
            <td style="${cellStyle}">
                <input type="text" id="return-hsn-${id}" readonly
                    style="${inputBase}background:transparent;border-color:transparent;color:#e2e8f0;font-size:0.68rem;text-align:center;">
            </td>
            <td style="${cellStyle}">
                <input type="text" id="return-batch-${id}" placeholder="Select Batch" list="batch-list-${id}"
                    onchange="updateBatchDetails('${id}')"
                    style="${inputBase}">
                <datalist id="batch-list-${id}"></datalist>
            </td>
            <td style="${cellStyle}">
                <input type="text" id="return-exp-${id}" placeholder="MM-YY" readonly
                    onclick="openMonthYearPicker('return-exp-${id}')"
                    style="${inputBase}text-align:center; cursor:pointer; background:rgba(99,102,241,0.1); border-color:rgba(99,102,241,0.3);">
            </td>
            <td style="${cellStyle}">
                <input type="number" id="return-qty-${id}" oninput="calculateReturnTotals()" min="1" required
                    style="${inputBase}width:100%;text-align:center;">
            </td>
            <td style="${cellStyle}">
                <input type="number" id="return-mrp-${id}" readonly
                    style="${inputBase}text-align:right; font-family:monospace; color:#e2e8f0; opacity:1.0;">
            </td>
            <td style="${cellStyle}">
                <input type="number" id="return-price-${id}" oninput="calculateReturnTotals()" step="0.01" min="0" required
                    style="${inputBase}width:100%;text-align:right;font-family:monospace;">
            </td>
            <td style="${cellStyle}">
                <input type="number" id="return-gst-pct-${id}" oninput="calculateReturnTotals()" step="0.5" min="0" required
                    style="${inputBase}text-align:center;color:#fff;font-weight:700;">
            </td>
            <td style="${cellStyle}padding-right:8px;text-align:right;font-weight:800;color:#e2e8f0;font-family:monospace;font-size:0.72rem;" id="return-row-total-${id}">₹0.00</td>
            <td style="padding:4px 6px;text-align:center;">
                <button type="button" onclick="removeReturnRow('${id}')" title="Delete Row"
                    style="background:#ef4444; border:none; color:#fff; cursor:pointer; font-size:0.65rem; font-weight:900; width:22px; height:22px; border-radius:6px; display:inline-flex; align-items:center; justify-content:center; transition:all 0.2s; box-shadow:0 2px 5px rgba(239,68,68,0.2);"
                    onmouseover="this.style.background='#dc2626'; this.style.transform='scale(1.1)';" 
                    onmouseout="this.style.background='#ef4444'; this.style.transform='scale(1)';">✓•</button>
            </td>
        `;
    }
    document.getElementById('return-items-body').appendChild(row);
    returnItems.push(id);
    return id;
}
function removeReturnRow(id) {
    if(returnItems.length <= 1) return;
    document.getElementById(`return-row-${id}`).remove();
    returnItems = returnItems.filter(x => x != id);
    calculateReturnTotals();
}

function updateReturnRowData(rowId, productId) {
    const p = allProducts.find(x => String(x._id) === String(productId));
    if (p) {
        const reason = document.getElementById('return-reason').value;
        const isPD = (RETURN_MODULE_CONFIG[reason] || {}).isPriceDiff;

        if (isPD) {
            if (document.getElementById(`return-price-${rowId}`)) document.getElementById(`return-price-${rowId}`).value = p.pts || 0;
            if (document.getElementById(`return-mrp-${rowId}`)) document.getElementById(`return-mrp-${rowId}`).value = p.mrp || 0;
            if (document.getElementById(`return-hsn-${rowId}`)) document.getElementById(`return-hsn-${rowId}`).value = p.hsn || '';
            if (document.getElementById(`return-exp-${rowId}`)) {
                const b = (p.batches || [])[0];
                if (b && b.expDate) document.getElementById(`return-exp-${rowId}`).value = b.expDate.replace('/', '-');
            }
        } else {
            if (document.getElementById(`return-hsn-${rowId}`)) document.getElementById(`return-hsn-${rowId}`).value   = p.hsn || '';
            if (document.getElementById(`return-mrp-${rowId}`)) document.getElementById(`return-mrp-${rowId}`).value   = p.mrp || 0;
            if (document.getElementById(`return-price-${rowId}`)) document.getElementById(`return-price-${rowId}`).value = p.pts || 0;
        }

        const gstVal = p.gstPercent || 0;
        if (document.getElementById(`return-gst-pct-${rowId}`)) {
            document.getElementById(`return-gst-pct-${rowId}`).value = gstVal;
        }
        
        // Populate Batch Datalist
        const batchList = document.getElementById(`batch-list-${rowId}`);
        if (batchList) {
            batchList.innerHTML = (p.batches || []).map(b => `<option value="${b.batchNo}">${b.batchNo} (Exp: ${b.expDate})</option>`).join('');
        }

        if (p.batches && p.batches.length > 0) {
            const b = p.batches[0];
            document.getElementById(`return-batch-${rowId}`).value = b.batchNo || '';
            
            // Auto-fill MM-YY from batch expDate (only if standard return)
            if (b.expDate && !isPD) {
                const el = document.getElementById(`return-exp-${rowId}`);
                if (el) el.value = b.expDate.replace('/', '-');
            }
        }
    }
    calculateReturnTotals();
}

function updateBatchDetails(rowId) {
    const prodId = document.getElementById(`return-prod-select-${rowId}`).value;
    const batchNo = document.getElementById(`return-batch-${rowId}`).value;
    const p = allProducts.find(x => x._id === prodId);
    if (p && p.batches) {
        const b = p.batches.find(x => x.batchNo === batchNo);
        if (b) {
            const reason = document.getElementById('return-reason').value;
            const isPD = (RETURN_MODULE_CONFIG[reason] || {}).isPriceDiff;
            
            if (!isPD) {
                if (b.mrp) document.getElementById(`return-mrp-${rowId}`).value = b.mrp;
                if (b.pts) document.getElementById(`return-price-${rowId}`).value = b.pts;
                if (b.expDate) {
                    const el = document.getElementById(`return-exp-${rowId}`);
                    if (el) el.value = b.expDate.replace('/', '-');
                }
            } else {
                if (b.mrp) document.getElementById(`return-mrp-${rowId}`).value = b.mrp;
                if (b.pts) document.getElementById(`return-price-${rowId}`).value = b.pts;
                if (b.expDate) {
                    const el = document.getElementById(`return-exp-${rowId}`);
                    if (el) el.value = b.expDate.replace('/', '-');
                }
            }
        }
    }
    calculateReturnTotals();
}

function calculateReturnTotals() {
    let subtotal = 0;
    let gstTotal = 0;

    const reason = document.getElementById('return-reason').value;
    const isPD = (RETURN_MODULE_CONFIG[reason] || {}).isPriceDiff;

    returnItems.forEach(id => {
        const qty   = Number(document.getElementById(`return-qty-${id}`).value) || 0;
        const price = Number(document.getElementById(`return-price-${id}`).value) || 0;
        const gstPct = Number(document.getElementById(`return-gst-pct-${id}`).value) || 0;
        
        const taxable = Number((qty * price).toFixed(2));
        const gst = Number((taxable * (gstPct / 100)).toFixed(2));
        const rowTotal = taxable + gst;
        
        subtotal += taxable;
        gstTotal += gst;
        
        document.getElementById(`return-row-total-${id}`).innerText = `₹${rowTotal.toFixed(2)}`;
    });


    const total = subtotal + gstTotal;
    const rounded = Math.round(total);
    const roundOff = rounded - total;

    document.getElementById('return-subtotal').innerText = `₹${subtotal.toLocaleString('en-IN', {minimumFractionDigits:2})}`;
    document.getElementById('return-gst').innerText = `₹${gstTotal.toLocaleString('en-IN', {minimumFractionDigits:2})}`;
    document.getElementById('return-roundoff').innerText = `₹${roundOff.toFixed(2)}`;
    document.getElementById('return-total').innerText = `₹${rounded.toLocaleString('en-IN', {minimumFractionDigits:2})}`;
}

async function saveMultiItemReturn(e) {
    e.preventDefault();
    const reasonValue = document.getElementById('return-reason').value;
    const isPD = (RETURN_MODULE_CONFIG[reasonValue] || {}).isPriceDiff;
    const pId = document.getElementById('return-party').value;
    const pName = allStockists.find(s => s._id == pId)?.name || 'Direct Customer';
    
    // Strict Header Validation
    if(!pId) return alert("❌ Please select a Party.");
    if(!document.getElementById('return-inv-no').value) return alert("❌ Ref. Invoice No is mandatory.");
    if(!document.getElementById('return-inv-date').value) return alert("❌ Invoice Date is mandatory.");

    try {
        const items = returnItems.map(id => {
            const prodId = document.querySelector(`#return-row-${id} .return-prod-select`).value;
            const p      = allProducts.find(x => x._id === prodId);
            const qty    = Number(document.getElementById(`return-qty-${id}`).value);
            const price  = Number(document.getElementById(`return-price-${id}`).value);
            const gstPct = Number(document.getElementById(`return-gst-pct-${id}`).value);
            const batch  = document.getElementById(`return-batch-${id}`).value;
            const hsn    = isPD ? '' : document.getElementById(`return-hsn-${id}`).value;
            const exp    = isPD ? 'N/A' : (document.getElementById(`return-exp-${id}`).value || 'N/A');

            if (!prodId || !qty || !price || !batch) {
                throw new Error('Required columns (Product, Batch, Qty, Rate) are mandatory.');
            }
            if (!isPD && exp === 'N/A') {
                throw new Error('Expiry Month/Year is mandatory for Returns.');
            }
            const taxable = qty * price;
            return {
                productId:    prodId,
                name:         p ? p.name : 'Unknown',
                manufacturer: p ? p.manufacturer : 'EMYRIS',
                qty, hsn, batchNo: batch, expDate: exp, price, gstPercent: gstPct,
                totalValue: taxable + (taxable * (gstPct / 100))
            };
        });

        if(items.length === 0) return alert("Please add at least one product.");

        // --- PDCN QUANTITY VALIDATION ---
        if (reasonValue === 'Price Diff CN') {
            const partyId = document.getElementById('return-party').value;
            try {
                const elRes = await fetch(`/api/admin/pdcn/eligibility/${partyId}`);
                const elData = await elRes.json();
                if (elData.success) {
                    const eligibility = elData.eligibility;
                    for (const item of items) {
                        const pid = String(item.productId);
                        const data = eligibility[pid];
                        const billed = data ? data.totalBilledQty : 0;
                        
                        if (item.qty > billed) {
                            return alert(`❌ QUANTITY ERROR: Product "${item.name}" was only billed ${billed} units. You cannot raise a PDCN for ${item.qty} units.`);
                        }
                    }
                }
            } catch (e) { console.error("Eligibility check failed:", e); }
        }

        const data = {
            party:        pId,
            partyName:    pName,
            reason:       reasonValue,
            noteType:     document.getElementById('return-note-type').value,
            refInvoiceNo: document.getElementById('return-inv-no').value,
            refInvoiceDate: document.getElementById('return-inv-date').value,
            items,
            amount:       items.reduce((s, i) => s + i.totalValue, 0)
        };

        const url = currentEditingNoteId ? `/api/admin/financial-notes/${currentEditingNoteId}` : '/api/admin/financial-notes';
        const method = currentEditingNoteId ? 'PUT' : 'POST';

        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await res.json();
        if(result.success) {
            alert(currentEditingNoteId ? "Note Updated Successfully!" : "Return Processed & Document Generated!");
            closeReturnModal();
            await loadFinancialNotes();
            await loadProducts();
            await loadStockists();
            // Automatically trigger download of the new/updated note
            if (result.note && result.note._id) {
                downloadNotePDF(result.note._id);
            }
        } else {
            alert("Error: " + result.error);
        }
    } catch (e) { alert(e.message || "Submission failed"); }
}

async function saveFinancialNote(e) {
    e.preventDefault();
    const data = {
        noteType: document.getElementById('note-type').value,
        party: document.getElementById('note-party').value,
        amount: Number(document.getElementById('note-amount').value),
        reason: document.getElementById('note-reason').value,
        description: document.getElementById('note-desc').value,
        productId: document.getElementById('note-product').value,
        batchNo: document.getElementById('note-batch').value,
        qty: Number(document.getElementById('note-qty').value)
    };

    try {
        const url = currentEditingNoteId ? `/api/admin/financial-notes/${currentEditingNoteId}` : '/api/admin/financial-notes';
        const method = currentEditingNoteId ? 'PUT' : 'POST';

        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await res.json();
        if (result.success) {
            alert(currentEditingNoteId ? "✅ Note Updated Successfully!" : "✅ Financial Note Issued Successfully!");
            await loadFinancialNotes();
            await loadStockists();
            await loadProducts();
            renderFinancialNotes();
            closeNoteModal();
        } else {
            alert("❌ SAVE FAILED: " + (result.error || result.message || "Unknown error"));
        }
    } catch (e) { 
        console.error("Save note error:", e);
        alert("❌ CRITICAL ERROR: Could not save note. Check your connection."); 
    }
}

// --- MASTER PDF ENGINE (EXTRACTED TEMPLATE) ---
function numberToWords(num) {
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const g = ['', 'Thousand', 'Lakh', 'Crore'];
    const makeGroup = (n) => {
        let s = '';
        if (n >= 100) { s += a[Math.floor(n / 100)] + 'Hundred '; n %= 100; }
        if (n >= 20) { s += b[Math.floor(n / 10)] + ' '; n %= 10; }
        if (n > 0) s += a[n];
        return s;
    };
    if (num === 0) return 'Zero';
    let ns = num.toString().split('.');
    let integer = parseInt(ns[0]);
    let fraction = ns[1] ? parseInt(ns[1]) : 0;
    let out = ''; let i = 0;
    while (integer > 0) {
        let group = (i === 0) ? integer % 1000 : integer % 100;
        integer = (i === 0) ? Math.floor(integer / 1000) : Math.floor(integer / 100);
        if (group > 0) out = makeGroup(group) + (g[i] ? g[i] + ' ' : '') + out;
        i++;
    }
    let final = 'Rupees ' + out.trim();
    if (fraction > 0) final += ' and ' + (fraction < 10 ? '0'+fraction : fraction) + '/100 Paise';
    return final + ' Only';
}

async function generateStandardPDF({ 
    doc: passedDoc, title, subTitle = "Original For Recipient", docNo, docTypeLabel = "Invoice No", date, party, items, additionalCharges = [], grandTotal, terms, showBank, extraFields = [], filename = null
}) {
    const PDFLib = window.jspdf ? window.jspdf.jsPDF : (window.jsPDF || window.jspdf);
    const doc = passedDoc || new PDFLib('p', 'mm', 'a4');
    const style = (companyProfile && companyProfile.invoiceStyle) || 'sample';

    if (style === 'sample' || style === 'classic') {
        // Use the comprehensive version defined later in the file
        return await generateSampleMatchedPDF({ 
            doc, title, subTitle, docNo, docTypeLabel, date, party, items, additionalCharges, grandTotal, terms, showBank, extraFields, filename 
        });
    }

    // Header
    doc.setFont("helvetica", "bold"); doc.setFontSize(16);
    doc.text(companyProfile.name || "EMYRIS", 105, 15, { align: 'center' });
    doc.setFontSize(8); doc.setFont("helvetica", "normal");
    doc.text(companyProfile.address || "", 105, 20, { align: 'center' });
    doc.text(`GSTIN: ${companyProfile.gstNo} | DL: ${companyProfile.dlNo}`, 105, 25, { align: 'center' });
    doc.line(10, 30, 200, 30);

    // Party & Doc Info
    doc.setFontSize(9); doc.text(`Party: ${party.name}`, 15, 38);
    doc.text(`Address: ${party.address || 'N/A'}`, 15, 43);
    doc.text(`GSTIN: ${party.gst || 'N/A'}`, 15, 48);
    
    doc.text(`${docTypeLabel}: ${docNo}`, 140, 38);
    doc.text(`Date: ${date}`, 140, 43);
    extraFields.forEach((f, i) => doc.text(`${f.label}: ${f.value}`, 140, 48 + (i * 5)));

    // Table
    doc.autoTable({
        startY: 65,
        head: [['S.No', 'Description', 'HSN', 'Batch', 'Exp', 'MRP', 'PTR', 'PTS', 'Qty', 'Free', 'GST%', 'Total']],
        body: items.map((it, idx) => {
            const price = Number(it.price) || 0;
            const pts = Number(it.pts || price) || 0;
            const ptr = Number(it.ptr) || 0;
            const bonus = Number(it.bonusQty || 0);
            const rate = Number(it.gstPercent) || 0;
            const taxable = Number(it.qty) * price;
            const total = taxable + (taxable * rate / 100);
            return [
                idx + 1, it.name, it.hsn || '-', it.batch || '-', it.expDate || it.exp || it.expiry || '-', 
                (Number(it.mrp) || 0).toFixed(2), ptr.toFixed(2), pts.toFixed(2), 
                it.qty, bonus, rate + '%', total.toFixed(2)
            ];
        }),
        theme: 'grid', headStyles: { fillColor: [99, 102, 241] }, styles: { fontSize: 7 }
    });


    const finalY = doc.lastAutoTable.finalY + 10;
    const gTotal = Number(grandTotal) || 0;
    doc.text(`Grand Total: Rs. ${gTotal.toFixed(2)}`, 195, finalY, { align: 'right' });
    doc.text(`Words: ${numberToWords(gTotal)}`, 15, finalY + 10);

    
    if (filename) {
        doc.save(filename);
    }
    return doc;
}

// Duplicate generateSampleMatchedPDF removed (replaced by the one at line 4711 area)
// Dead code removed

async function viewInvoicePDF(id) {
    try {
        const inv = allInvoices.find(x => x._id == id);
        if (!inv) return alert("Invoice not found in system.");
        const partyData = allStockists.find(s => (s._id || s.id) == (inv.stockistId || inv.stockist?._id || inv.stockist)) || {};
        const extraFields = [
            { label: 'Place of Supply', value: inv.placeOfSupply || partyData.state || partyData.city || companyProfile.defaultPlaceOfSupply || 'Telangana' },
            { label: 'Due Date', value: inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('en-GB') : 'N/A' }
        ];
        
        const PDFLib = window.jspdf ? window.jspdf.jsPDF : window.jsPDF;
        if (!PDFLib) throw new Error("PDF Library (jsPDF) not loaded properly.");
        
        const doc = new PDFLib('p', 'mm', 'a4');
        await generateStandardPDF({
            doc, title: "TAX INVOICE", docNo: inv.invoiceNo, date: new Date(inv.createdAt).toLocaleDateString('en-GB'),
            party: { 
                name: inv.stockist?.name || inv.stockistName || 'Direct Customer', 
                address: partyData.address || '', 
                gst: partyData.gstNo || partyData.gst || '', 
                dl: partyData.dlNo || partyData.dl || '' 
            },
            items: (inv.items || []).map(it => ({ ...it, price: it.priceUsed || it.price || 0 })),
            additionalCharges: inv.additionalCharges || [],
            grandTotal: Number(inv.grandTotal || 0), extraFields
        });
        window.open(doc.output('bloburl'), '_blank');
    } catch (e) { 
        console.error("View PDF error:", e);
        alert("View failed: " + e.message); 
    }
}

async function downloadInvoicePDF(id) {
    try {
        const inv = allInvoices.find(x => x._id == id);
        if (!inv) return alert("Invoice not found in system.");
        const partyData = allStockists.find(s => (s._id || s.id) == (inv.stockistId || inv.stockist?._id || inv.stockist)) || {};
        const extraFields = [
            { label: 'Place of Supply', value: inv.placeOfSupply || partyData.state || partyData.city || companyProfile.defaultPlaceOfSupply || 'Telangana' },
            { label: 'Due Date', value: inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('en-GB') : 'N/A' }
        ];
        await generateStandardPDF({
            title: "TAX INVOICE", docNo: inv.invoiceNo, date: new Date(inv.createdAt).toLocaleDateString('en-GB'),
            party: { 
                name: inv.stockist?.name || inv.stockistName || 'Direct Customer', 
                address: partyData.address || '', 
                gst: partyData.gstNo || partyData.gst || '', 
                dl: partyData.dlNo || partyData.dl || '' 
            },
            items: (inv.items || []).map(it => ({ ...it, price: it.priceUsed || it.price || 0 })),
            additionalCharges: inv.additionalCharges || [],
            grandTotal: Number(inv.grandTotal || 0), extraFields, filename: `Invoice_${inv.invoiceNo}.pdf`
        });
    } catch (e) { 
        console.error("PDF Download Error:", e);
        alert("Download failed: " + e.message); 
    }
}

function previewInvoiceStyle(style) {
    generateStandardPDF({
        title: "PREVIEW: TAX INVOICE",
        subTitle: "Specimen Copy", docNo: "TEMP-001", docTypeLabel: "Invoice No",
        date: new Date().toLocaleDateString('en-GB'),
        party: { name: "SAMPLE STOCKIST PVT LTD", address: "123 Business Park, Pharma Zone, Industrial Estate", dl: "DL-12345-X", gst: "36AAAAA0000A1Z5" },
        items: [
            { name: "PARACETAMOL 500MG", manufacturer: "EMYRIS", hsn: "3004", batch: "BT2401", exp: "12/2026", mrp: 15.00, qty: 100, price: 10.00, gstPercent: 12, totalValue: 1120.00 },
            { name: "AMOXICILLIN CAPSULES", manufacturer: "EMYRIS", hsn: "3004", batch: "AX992", exp: "06/2025", mrp: 45.00, qty: 50, price: 30.00, gstPercent: 12, totalValue: 1680.00 }
        ],
        grandTotal: 2800.00,
        terms: "1. Sample Preview Terms.\n2. This is a specimen copy.",
        showBank: true,
        filename: `Preview_${style}.pdf`
    });
}

function viewPurchaseDetails(id) {
    const p = allPurchaseEntries.find(x => x._id == id);
    if (!p) return alert('Purchase record not found.');
    
    const dateStr = p.date || p.invoiceDate || p.createdAt;
    const formattedDate = dateStr ? new Date(dateStr).toLocaleDateString('en-GB') : 'N/A';
    const items = Array.isArray(p.items) ? p.items : [];
    
    const itemLines = items.map((i, idx) => {
        const product = allProducts.find(pr => (pr._id || pr.id) == i.productId) || {};
        const name = product.name || i.productName || 'Unknown';
        const batch = i.batch || 'N/A';
        const qty = i.qty || 0;
        const rate = Number(i.rate || i.purchaseRate || 0).toFixed(2);
        const gst = i.gstPercent || 0;
        const hsn = i.hsn || product.hsn || '-';
        const total = Number(i.lineTotal || i.totalValue || 0).toFixed(2);
        const mfg = i.manufacturer || product.manufacturer || 'EMYRIS';
        return `  ${idx+1}. ${name}\n     Mfg: ${mfg} | HSN: ${hsn} | Batch: ${batch} | Qty: ${qty} | Rate: ₹${rate} | GST: ${gst}% | Total: ₹${total}`;
    }).join('\n');
    
    alert(
        `📈‹ PURCHASE RECORD DETAILS\n` +
        `${'─'.repeat(44)}\n` +
        `Internal Bill No : ${p.purchaseNo || p.billNo || 'N/A'}\n` +
        `Supplier Inv No  : ${p.supplierInvoiceNo || 'N/A'}\n` +
        `Supplier         : ${p.supplierName || 'N/A'}\n` +
        `Date             : ${formattedDate}\n` +
        `Payment Mode     : ${p.paymentMode || 'N/A'}\n` +
        `Remarks          : ${p.remarks || '-'}\n` +
        `${'─'.repeat(44)}\n` +
        `ITEMS (${items.length}):\n${itemLines}\n` +
        `${'─'.repeat(44)}\n` +
        `Taxable   : ₹${Number(p.subTotal || 0).toLocaleString('en-IN', {minimumFractionDigits:2})}\n` +
        `GST       : ₹${Number(p.gstAmount || 0).toLocaleString('en-IN', {minimumFractionDigits:2})}\n` +
        `Round Off : ${p.roundOff >= 0 ? '+' : ''}₹${Number(p.roundOff || 0).toFixed(2)}\n` +
        `GRAND TOTAL: ₹${Number(p.grandTotal || 0).toLocaleString('en-IN', {minimumFractionDigits:2})}`
    );
}

async function viewPurchasePDF(id) {
    try {
        const p = allPurchaseEntries.find(x => x._id == id);
        if (!p) return alert("Purchase record not found.");
        
        const supplierData = allStockists.find(s => (s._id || s.id) == (p.supplierId || p.supplier)) || {};
        
        const PDFLib = window.jspdf ? window.jspdf.jsPDF : (window.jsPDF || window.jspdf);
        if (!PDFLib) throw new Error("PDF Library (jsPDF) not loaded properly.");
        
        const doc = new PDFLib('p', 'mm', 'a4');
        
        // Map items for PDF
        const pdfItems = (p.items || []).map(it => {
            const product = allProducts.find(pr => (pr._id || pr.id) == it.productId) || {};
            return {
                name: product.name || it.productName || 'Unknown Product',
                manufacturer: it.manufacturer || product.manufacturer || 'EMYRIS',
                hsn: it.hsn || product.hsn || '',
                batch: it.batch || '-',
                exp: it.expDate || it.exp || '-',
                mrp: it.mrp || product.mrp || 0,
                pts: it.pts || product.pts || 0,
                ptr: it.ptr || product.ptr || 0,
                qty: it.qty || 0,
                price: it.purchaseRate || it.rate || 0,
                gstPercent: it.gstPercent || 0
            };
        });

        const gdoc = await generateStandardPDF({
            doc, 
            title: "PURCHASE INWARD INVOICE", 
            docNo: p.purchaseNo || p.billNo || 'N/A', 
            docTypeLabel: "Internal No",
            date: new Date(p.invoiceDate).toLocaleDateString('en-GB'),
            party: { 
                name: supplierData.name || p.supplierName || 'N/A', 
                address: supplierData.address || '', 
                gst: supplierData.gstNo || '' 
            },
            items: pdfItems,
            additionalCharges: p.additionalCharges || [],
            grandTotal: p.grandTotal,
            extraFields: [
                { label: 'Supplier Inv No', value: p.supplierInvoiceNo || 'N/A' },
                { label: 'Payment Mode', value: p.paymentMode || 'CREDIT' },
                { label: 'Remarks', value: p.remarks || '-' },
                { label: 'Audit Gen', value: new Date().toLocaleString('en-GB') }
            ]
        });

        window.open(gdoc.output('bloburl'), '_blank');
    } catch (e) {
        console.error("PDF Gen Fail:", e);
        alert("Failed to generate Purchase PDF: " + e.message);
    }
}

function editPurchaseEntry(id) {
    const p = allPurchaseEntries.find(x => x._id == id);
    if (!p) return alert('Purchase record not found.');

    openPurchaseModal(id);

    // Use setTimeout to allow the modal reset to complete first
    setTimeout(() => {
        // --- Header Fields ---
        safeSetVal('pur-bill-no', p.purchaseNo || p.billNo || '');
        safeSetVal('pur-supplier-inv-no', p.supplierInvoiceNo || '');
        
        const dateStr = p.date || p.invoiceDate;
        if (dateStr) safeSetVal('pur-date', dateStr.split('T')[0]);
        
        safeSetVal('pur-payment-mode', p.paymentMode || 'CREDIT');
        safeSetVal('pur-remarks', p.remarks || '');

        // --- Additional Charges ---
        purchaseCharges = Array.isArray(p.additionalCharges) ? JSON.parse(JSON.stringify(p.additionalCharges)) : [];
        renderPurchaseCharges();

        // --- Supplier Search ---
        const supplier = allStockists.find(s => (s._id || s.id) == p.supplier);
        if (supplier) {
            safeSetVal('pur-party-search', supplier.name);
            safeSetVal('pur-supplier', p.supplier);
        } else if (p.supplierName) {
            // fallback: show name even if not found in local list
            safeSetVal('pur-party-search', p.supplierName);
            safeSetVal('pur-supplier', p.supplier || '');
        }

        // --- Items ---
        purchaseItems = (p.items || []).map(i => {
            const product = allProducts.find(pr => (pr._id || pr.id) == (i.productId || i.product)) || i.Product || {};
            const qty = Number(i.qty || 0);
            const rate = Number(i.rate || i.purchaseRate || 0);
            const gstPct = Number(i.gstPercent || (window.companyProfile ? window.companyProfile.gstRate : 5));
            const taxable = Number((qty * rate).toFixed(2));
            const gstAmount = Number((taxable * (gstPct / 100)).toFixed(2));
            const lineTotal = Number((taxable + gstAmount).toFixed(2));

            return {
                productId: i.productId || i.product || '',
                productName: product.name || i.name || i.productName || 'Unknown Product',
                hsn: i.hsn || product.hsn || '',
                pack: i.pack || product.packing || '',
                batch: i.batch || '',
                mfg: i.mfg || i.mfgDate || '',
                exp: i.exp || i.expDate || '',
                mrp: Number(i.mrp || product.mrp || 0),
                ptr: Number(i.ptr || product.ptr || 0),
                pts: Number(i.pts || product.pts || 0),
                rate,
                qty,
                gstPercent: gstPct,
                taxable,
                gstAmount,
                lineTotal
            };
        });

        renderPurchaseItems();
        console.log('Edit mode loaded for purchase:', p.purchaseNo, 'Items:', purchaseItems.length);
    }, 150);
}


function setInvoiceStyle(style) {
    const styleEl = document.getElementById('set-inv-style');
    if (styleEl) styleEl.value = style;
    const styles = ['classic', 'modern', 'compact', 'sample'];
    const colors = {
        classic: { border: '2px solid var(--primary)', shadow: '0 0 20px rgba(99?02,241,0.3)', bg: 'rgba(99?02,241,0.05)' },
        modern:  { border: '2px solid #10b981', shadow: '0 0 20px rgba(16?85?29,0.3)', bg: 'rgba(16?85?29,0.05)' },
        compact: { border: '2px solid #f59e0b', shadow: '0 0 20px rgba(245?58?1,0.3)', bg: 'rgba(245?58?1,0.05)' },
        sample:  { border: '2px solid var(--accent)', shadow: '0 0 20px rgba(16?85?29,0.3)', bg: 'rgba(16?85?29,0.05)' }
    };
    styles.forEach(s => {
        const card = document.getElementById(`specimen-${s}`);
        const badge = document.getElementById(`check-${s}`);
        if (!card || !badge) return;
        if (s === style) {
            card.style.border = colors[s].border;
            card.style.boxShadow = colors[s].shadow;
            card.style.background = colors[s].bg;
            badge.style.display = 'inline';
        } else {
            card.style.border = '1px solid var(--glass-border)';
            card.style.boxShadow = 'none';
            card.style.background = 'transparent';
            badge.style.display = 'none';
        }
    });
}

function updateSupplierDetailsDisplay(id) {
    const s = allStockists.find(x => x._id == id);
    const box = document.getElementById('supplier-compliance-box');
    if (!box) return;
    if (!s) { box.innerHTML = 'Select a supplier to view compliance data.'; return; }
    box.innerHTML = `
        <strong>Address:</strong> ${s.address || 'N/A'}<br>
        <strong>DL:</strong> ${s.dl || 'N/A'} | <strong>GST:</strong> ${s.gst || 'N/A'}<br>
        <strong>PAN:</strong> ${s.pan || 'N/A'} | <strong>FSSAI:</strong> ${s.fssai || 'N/A'}<br>
        <strong>Phone:</strong> ${s.phone || 'N/A'}
    `;
}

function updateProductEntryMeta(id) {
    const p = allProducts.find(x => x._id == id || x.id == id);
    if (!p) return;
    // Auto-fill purchase rate (PTS), GST%, and MRP from product master
    safeSetVal('pur-hsn', p.hsn || '');
    safeSetVal('pur-pack', p.packing || p.pack || '');
    safeSetVal('pur-ptr', p.ptr || 0);
    safeSetVal('pur-pts', p.pts || 0);
    safeSetVal('pur-rate', p.purchaseRate || p.pts || 0);
    safeSetVal('pur-mrp', p.mrp || 0);
    safeSetVal('pur-gst-pct', p.gstPercent || p.gst || (window.companyProfile ? window.companyProfile.gstRate : 5));
    // Focus qty for fast entry
    const qtyEl = document.getElementById('pur-qty');
    if (qtyEl) { qtyEl.focus(); qtyEl.select(); }
}


// --- UNIFIED REPORTING ENGINE ---
// Consolidates logic from both heads to provide a single, robust reporting suite

async function generateReport(type) {
    // This function now opens the visual report modal
    document.getElementById('current-report-type').value = type;
    document.getElementById('report-modal-title').innerText = `📈Š Report: ${type.toUpperCase().replace(/-/g, ' ')}`;
    
    // Default dates: First day of current month to today
    const today = new Date();
    const firstDay = new Date('2024-04-01'); // Wide default range
    
    document.getElementById('report-to-date').value = today.toISOString().split('T')[0];
    document.getElementById('report-from-date').value = firstDay.toISOString().split('T')[0];
    
    // Reset filters
    document.getElementById('report-party-search').value = '';
    document.getElementById('report-item-filter').value = '';
    document.getElementById('report-pay-status').value = '';

    // Show/Hide specific filters based on type
    const partyFilter = document.getElementById('report-party-filter-container');
    const extraFilters = document.getElementById('report-extra-filters');
    
    if (type === 'party-statement' || type === 'party-sales' || type === 'consolidated-ledger') {
        partyFilter.style.display = 'flex';
        // Populate Datalist
        const dl = document.getElementById('report-party-list');
        dl.innerHTML = (allStockists || []).map(s => `<option value="${s.name}">${s.companyName || ''} [${s.city || ''}]</option>`).join('');
    } else {
        partyFilter.style.display = 'none';
    }

    if (type === 'sales-summary' || type === 'product-sales' || type === 'bill-profit' || type === 'party-statement') {
        extraFilters.style.display = 'flex';
    } else {
        extraFilters.style.display = 'none';
    }

    document.getElementById('reportModal').classList.remove('hidden');
    renderReportView();
}

function getReportDataByType(type, data, fromDate, toDate) {
    const { invoices, purchases, payments, notes, expenses, products, stockists } = data;
    
    const fromD = fromDate ? new Date(fromDate) : new Date(0);
    const toD = toDate ? new Date(toDate) : new Date();
    toD.setHours(23, 59, 59, 999);
    
    const filterByDate = (list, dateField = 'createdAt') => {
        return (list || []).filter(x => {
            const d = new Date(x[dateField] || x.date || x.createdAt);
            return d >= fromD && d <= toD;
        });
    };

    const filteredInvoices = filterByDate(invoices);
    const filteredPurchases = filterByDate(purchases);
    const filteredPayments = filterByDate(payments, 'date');
    const filteredExpenses = filterByDate(expenses, 'date');
    const filteredNotes = filterByDate(notes, 'date');

    const itemFilter = document.getElementById('report-item-filter').value.toLowerCase().trim();
    const payStatusFilter = document.getElementById('report-pay-status').value;

    let reportData = [];
    let fileName = `Emyris_${type}_${new Date().toISOString().split('T')[0]}`;

    switch (type) {
        case 'sales-summary':
            fileName = "Sales_Summary_Report";
            reportData = filteredInvoices.map(inv => ({
                "Invoice No": inv.invoiceNo,
                "Date": new Date(inv.createdAt).toLocaleDateString('en-GB'),
                "Party Name": inv.stockistName,
                "Items": inv.items.length,
                "Taxable Value": inv.subTotal,
                "GST Amount": inv.gstAmount,
                "Grand Total": inv.grandTotal
            }));
            break;

        case 'party-sales':
        case 'party-profit-loss':
        case 'sale-purchase-party':
            fileName = "Party_Wise_Analytics";
            (stockists || []).forEach(s => {
                const partyInvs = filteredInvoices.filter(inv => (inv.stockistId || inv.stockist?._id || '').toString() === s._id.toString());
                if (partyInvs.length === 0 && type === 'party-sales') return;
                const revenue = partyInvs.reduce((sum, inv) => sum + inv.subTotal, 0);
                const grandTotal = partyInvs.reduce((sum, inv) => sum + inv.grandTotal, 0);
                
                let partyProfit = 0;
                partyInvs.forEach(inv => {
                    inv.items.forEach(item => {
                        const prodId = (item.product || item.productId || '').toString();
                        const prod = (products || []).find(p => (p._id || p.id || '').toString() === prodId);
                        const cost = prod ? Number(prod.pts || 0) : 0;
                        partyProfit += (Number(item.priceUsed || 0) - cost) * Number(item.qty || 0);
                    });
                });

                const row = {
                    "Party Name": s.companyName || s.name,
                    "Total Orders": partyInvs.length,
                    "Taxable Revenue": revenue.toFixed(2),
                    "Total Billing": grandTotal.toFixed(2),
                    "Current Outstanding": (s.outstandingBalance || 0).toFixed(2)
                };

                if (type === 'party-profit-loss') {
                    row["Gross Profit"] = partyProfit.toFixed(2);
                    row["Margin %"] = revenue > 0 ? ((partyProfit / revenue) * 100).toFixed(2) + '%' : '0%';
                }

                reportData.push(row);
            });
            break;

        case 'product-sales':
            fileName = "Product_Movement_Report";
            const prodMap = {};
            filteredInvoices.forEach(inv => {
                inv.items.forEach(item => {
                    if (itemFilter && !item.name.toLowerCase().includes(itemFilter)) return;
                    if(!prodMap[item.name]) prodMap[item.name] = { Name: item.name, QtySold: 0, Revenue: 0 };
                    prodMap[item.name].QtySold += item.qty;
                    prodMap[item.name].Revenue += item.totalValue;
                });
            });
            reportData = Object.values(prodMap).sort((a,b) => b.QtySold - a.QtySold);
            break;

        case 'purchase-register':
        case 'gstr-2':
            fileName = type === 'gstr-2' ? "GSTR_2_Purchases_Inward" : "Purchase_Register";
            reportData = filteredPurchases.map(p => ({
                "Pur No": p.purchaseNo,
                "Supplier": p.supplierName,
                "Inv No": p.supplierInvoiceNo || p.invoiceNo,
                "Date": new Date(p.invoiceDate || p.date || p.createdAt).toLocaleDateString('en-GB'),
                "Taxable": p.subTotal || 0,
                "GST": p.gstAmount || 0,
                "Total Value": p.grandTotal || 0
            }));
            break;

        case 'outstanding-summary':
        case 'ageing-report':
            fileName = "Party_Outstanding_Summary";
            (stockists || []).forEach(s => {
                if (s.outstandingBalance !== 0 || type !== 'outstanding-summary') {
                    reportData.push({
                        "Party Name": s.name,
                        "City": s.city || '-',
                        "Type": s.partyType || 'STOCKIST',
                        "Credit Limit": s.creditLimit || 0,
                        "Outstanding Balance": (s.outstandingBalance || 0).toFixed(2),
                        "Status": (s.outstandingBalance || 0) > (s.creditLimit || 0) ? "LIMIT EXCEEDED" : "OK"
                    });
                }
            });
            break;

        case 'party-statement':
        case 'consolidated-ledger':
            const searchName = document.getElementById('report-party-search').value.trim();
            const selectedParty = (stockists || []).find(s => s.name === searchName);
            
            if (!selectedParty) {
                fileName = "Outstanding_Snapshot";
                reportData = (stockists || []).map(s => ({
                    "Party Name": s.name,
                    "City": s.city || '-',
                    "Outstanding": (s.outstandingBalance || 0).toFixed(2)
                }));
            } else {
                fileName = `Statement_${selectedParty.name.replace(/\s+/g,'_')}`;
                const pid = (selectedParty._id || selectedParty.id).toString();
                const isSupplier = selectedParty.partyType === 'SUPPLIER';
                
                const pInvs = filteredInvoices.filter(i => (i.stockistId || i.stockist?._id || '').toString() === pid);
                const pNotes = filteredNotes.filter(n => (n.stockistId || n.stockist?._id || '').toString() === pid);
                const pPays = filteredPayments.filter(p => (p.stockistId || p.stockist?._id || '').toString() === pid);
                const pPurchases = filteredPurchases.filter(p => (p.supplierId || p.Supplier?._id || '').toString() === pid);
                
                let runningBal = 0;
                const rows = [];

                pInvs.forEach(i => {
                    const hasItem = !itemFilter || i.items.some(it => it.name.toLowerCase().includes(itemFilter));
                    const matchStatus = !payStatusFilter || i.paymentStatus === payStatusFilter || i.status === payStatusFilter;
                    if (hasItem && matchStatus) {
                        rows.push({ date: i.createdAt, ref: i.invoiceNo, type: 'INV', desc: 'Sales Invoice', dr: i.grandTotal, cr: 0 });
                    }
                });
                pPurchases.forEach(p => {
                    rows.push({ date: p.invoiceDate || p.date || p.createdAt, ref: p.supplierInvoiceNo || p.purchaseNo, type: 'PUR', desc: 'Purchase Inward', dr: 0, cr: p.grandTotal });
                });
                pNotes.forEach(n => {
                    if (!itemFilter && !payStatusFilter) {
                        rows.push({ date: n.date, ref: n.noteNo, type: n.noteType, desc: n.reason || 'Financial Note', dr: n.noteType==='DN'?n.amount:0, cr: n.noteType==='CN'?n.amount:0 });
                    }
                });
                pPays.forEach(p => {
                    if (!itemFilter && !payStatusFilter) {
                        rows.push({ date: p.date, ref: p.paymentNo || 'PAY', type: p.type, desc: `Payment via ${p.method}`, dr: p.type==='PAYMENT'?p.amount:0, cr: p.type==='RECEIPT'?p.amount:0 });
                    }
                });
                
                rows.sort((a,b) => new Date(a.date) - new Date(b.date));
                
                reportData = rows.map(r => {
                    // For Customers: DR increases balance. For Suppliers: CR increases balance.
                    if (isSupplier) runningBal += (r.cr - r.dr);
                    else runningBal += (r.dr - r.cr);

                    return {
                        "Date": new Date(r.date).toLocaleDateString('en-GB'),
                        "Ref No": r.ref,
                        "Type": r.type,
                        "Description": r.desc,
                        "Debit (Dr)": r.dr.toFixed(2),
                        "Credit (Cr)": r.cr.toFixed(2),
                        "Running Balance": runningBal.toFixed(2) + (isSupplier ? (runningBal >= 0 ? ' Cr' : ' Dr') : (runningBal >= 0 ? ' Dr' : ' Cr'))
                    };
                });
            }
            break;

        case 'bill-profit':
            fileName = "Bill_Profitability_Report";
            filteredInvoices.forEach(inv => {
                const partyName = inv.Stockist?.name || inv.stockistName || 'N/A';
                inv.items.forEach(item => {
                    const prodId = (item.product || item.productId || '').toString();
                    const prod = (products || []).find(p => (p._id || p.id || '').toString() === prodId);
                    
                    const costRate = Number(item.pts || (prod ? prod.purchaseRate : 0)); // Use item PTS if saved
                    const saleRate = Number(item.priceUsed || 0);
                    const qty = Number(item.qty || 0);
                    const brand = prod ? (prod.category || prod.group || 'GENERAL') : 'GENERAL';
                    
                    const profitAmt = (saleRate - costRate) * qty;
                    const marginPct = saleRate > 0 ? (((saleRate - costRate) / saleRate) * 100).toFixed(2) : '0';

                    reportData.push({
                        "Invoice No": inv.invoiceNo,
                        "Date": new Date(inv.createdAt).toLocaleDateString('en-GB'),
                        "Party": partyName,
                        "Brand": brand,
                        "Product": item.name,
                        "Qty": qty,
                        "Cost Rate": costRate.toFixed(2),
                        "Sale Rate": saleRate.toFixed(2),
                        "Profit Amt": profitAmt.toFixed(2),
                        "Margin %": marginPct + '%'
                    });
                });
            });
            break;

        case 'p-and-l':
            fileName = "Profit_and_Loss_Statement";
            const totalSales = filteredInvoices.reduce((s, x) => s + x.subTotal, 0);
            const totalPurchases = filteredPurchases.reduce((s, x) => s + x.subTotal, 0);
            const totalExpenses = filteredExpenses.reduce((s, x) => s + x.amount, 0);
            const salesReturns = filteredNotes.filter(n => n.noteType === 'CN').reduce((s, x) => s + x.amount, 0);
            const purchaseReturns = filteredNotes.filter(n => n.noteType === 'DN').reduce((s, x) => s + x.amount, 0);
            
            let totalCogs = 0;
            filteredInvoices.forEach(inv => {
                inv.items.forEach(item => {
                    const prodId = (item.product || item.productId || '').toString();
                    const prod = (products || []).find(p => (p._id || p.id || '').toString() === prodId);
                    totalCogs += (prod ? Number(prod.purchaseRate || 0) : 0) * Number(item.qty || 0);
                });
            });
            
            reportData = [
                { "Metric": "Total Sales (Revenue)", "Amount": totalSales.toFixed(2) },
                { "Metric": "Less: Sales Returns (CN)", "Amount": salesReturns.toFixed(2) },
                { "Metric": "Net Sales", "Amount": (totalSales - salesReturns).toFixed(2) },
                { "Metric": "Cost of Goods Sold (COGS)", "Amount": totalCogs.toFixed(2) },
                { "Metric": "Gross Profit", "Amount": (totalSales - salesReturns - totalCogs).toFixed(2) },
                { "Metric": "Total Indirect Expenses", "Amount": totalExpenses.toFixed(2) },
                { "Metric": "NET PROFIT / LOSS", "Amount": (totalSales - salesReturns - totalCogs - totalExpenses).toFixed(2) }
            ];
            break;

        case 'stock-summary':
        case 'inventory-val':
            fileName = "Inventory_Valuation_Report";
            (products || []).forEach(p => {
                reportData.push({
                    "Product Name": p.name,
                    "Packing": p.packing,
                    "HSN": p.hsn,
                    "Current Stock": p.qtyAvailable || p.stock || 0,
                    "PTS Rate": p.pts,
                    "Valuation (PTS)": ((p.qtyAvailable || p.stock || 0) * p.pts).toFixed(2),
                    "Valuation (MRP)": ((p.qtyAvailable || p.stock || 0) * p.mrp).toFixed(2)
                });
            });
            break;

        case 'low-stock':
            fileName = "Shortage_Reorder_List";
            (products || []).filter(p => (p.qtyAvailable || p.stock || 0) <= 20).forEach(p => {
                reportData.push({
                    "Product Name": p.name,
                    "Packing": p.packing,
                    "Current Stock": p.qtyAvailable || p.stock || 0,
                    "Status": (p.qtyAvailable || p.stock || 0) === 0 ? "OUT OF STOCK" : "LOW STOCK"
                });
            });
            break;

        case 'gstr-1':
        case 'gstr1':
            fileName = "GSTR_1_Sales_Outward";
            const myState = (companyProfile.state || "GUJARAT").toUpperCase();
            reportData = filteredInvoices.map(inv => {
                const party = (stockists || []).find(s => s._id.toString() === (inv.stockistId || inv.stockist?._id || '').toString());
                const partyState = (party ? (party.state || "GUJARAT") : "GUJARAT").toUpperCase();
                const isInterstate = partyState !== myState;
                
                return {
                    "GSTIN": party ? (party.gstin || party.gstNo || "URD") : "URD",
                    "Receiver Name": inv.stockistName,
                    "Invoice No": inv.invoiceNo,
                    "Date": new Date(inv.createdAt).toLocaleDateString('en-GB'),
                    "Total Value": inv.grandTotal,
                    "Taxable Value": inv.subTotal,
                    "IGST": isInterstate ? inv.gstAmount : 0,
                    "CGST": !isInterstate ? inv.gstAmount / 2 : 0,
                    "SGST": !isInterstate ? inv.gstAmount / 2 : 0
                };
            });
            break;

        case 'exp-txn':
        case 'expense-transaction':
        case 'expense-category':
            fileName = "Expense_Management_Log";
            reportData = filteredExpenses.map(e => ({
                "Exp No": e.expenseNo,
                "Date": new Date(e.date).toLocaleDateString('en-GB'),
                "Category": e.categoryName,
                "Title": e.title,
                "Method": e.paymentMethod,
                "Amount": e.amount
            }));
            break;

        case 'bank-statement':
        case 'business-status':
            fileName = "Bank_Statement_UPI_Status";
            const bankTxns = filteredPayments.filter(p => p.method === 'Bank Transfer' || p.method === 'UPI');
            reportData = bankTxns.map(p => ({
                "Date": new Date(p.date).toLocaleDateString('en-GB'),
                "Ref No": p.refNo,
                "Party": p.partyName,
                "Type": p.type,
                "Amount": p.amount
            }));
            break;

        case 'cashflow':
        case 'balance-sheet':
            fileName = "Financial_Cashflow_Statement";
            const tIn = filteredPayments.filter(p => p.type === 'RECEIPT').reduce((s, x) => s + x.amount, 0);
            const tOut = filteredPayments.filter(p => p.type === 'PAYMENT').reduce((s, x) => s + x.amount, 0);
            const tExp = filteredExpenses.reduce((s, x) => s + x.amount, 0);
            reportData = [
                { "Metric": "Total Inflow (Receipts)", "Amount": tIn.toFixed(2) },
                { "Metric": "Total Outflow (Payments)", "Amount": tOut.toFixed(2) },
                { "Metric": "Total Expenses (Overhead)", "Amount": tExp.toFixed(2) },
                { "Metric": "Net Cash Position", "Amount": (tIn - tOut - tExp).toFixed(2) }
            ];
            break;

        case 'discount-report':
        case 'item-discount':
            fileName = "Discount_Analysis_Report";
            filteredInvoices.forEach(inv => {
                inv.items.forEach(item => {
                    if(item.bonusQty > 0 || (item.mrp - item.priceUsed) > 0) {
                        reportData.push({
                            "Invoice": inv.invoiceNo,
                            "Party": inv.stockistName,
                            "Item": item.name,
                            "Billed Qty": item.qty,
                            "Bonus Qty": item.bonusQty || 0,
                            "MRP": item.mrp || 0,
                            "Billed Rate": item.priceUsed,
                            "Discount Value": (((item.mrp || 0) - item.priceUsed) * item.qty).toFixed(2)
                        });
                    }
                });
            });
            break;

        case 'item-profit-loss':
            fileName = "Item_Wise_Profit_Loss_Report";
            (products || []).forEach(p => {
                let qtySold = 0;
                let revenue = 0;
                
                filteredInvoices.forEach(inv => {
                    inv.items.forEach(item => {
                        const prodId = (item.product || item.productId || '').toString();
                        if (prodId === (p._id || p.id || '').toString()) {
                            qtySold += Number(item.qty || 0);
                            revenue += Number(item.totalValue || 0);
                        }
                    });
                });
                
                const costRate = Number(p.pts || p.purchaseRate || 0);
                const totalCost = costRate * qtySold;
                const profit = revenue - totalCost;
                const marginPct = revenue > 0 ? ((profit / revenue) * 100).toFixed(2) : '0.00';
                
                if (qtySold > 0 || revenue > 0) {
                    reportData.push({
                        "Product Name": p.name,
                        "Packing": p.packing || '-',
                        "Total Qty Sold": qtySold,
                        "Sales Revenue (INR)": revenue.toFixed(2),
                        "Total Cost (INR)": totalCost.toFixed(2),
                        "Gross Profit (INR)": profit.toFixed(2),
                        "Margin (%)": marginPct + '%'
                    });
                }
            });
            break;

        case 'gstr-3b':
            fileName = "GSTR_3B_Monthly_Summary";
            const myState3B = (companyProfile.state || "GUJARAT").toUpperCase();
            
            let totalSalesTaxable3B = 0;
            let totalSalesIgst3B = 0;
            let totalSalesCgst3B = 0;
            let totalSalesSgst3B = 0;
            
            filteredInvoices.forEach(inv => {
                totalSalesTaxable3B += inv.subTotal;
                const party = (stockists || []).find(s => s._id.toString() === (inv.stockistId || inv.stockist?._id || '').toString());
                const partyState = (party ? (party.state || "GUJARAT") : "GUJARAT").toUpperCase();
                const isInterstate = partyState !== myState3B;
                
                if (isInterstate) {
                    totalSalesIgst3B += inv.gstAmount;
                } else {
                    totalSalesCgst3B += inv.gstAmount / 2;
                    totalSalesSgst3B += inv.gstAmount / 2;
                }
            });

            let totalPurchTaxable3B = 0;
            let totalPurchIgst3B = 0;
            let totalPurchCgst3B = 0;
            let totalPurchSgst3B = 0;
            
            filteredPurchases.forEach(p => {
                totalPurchTaxable3B += p.subTotal || 0;
                const isInterstate = false;
                if (isInterstate) {
                    totalPurchIgst3B += p.gstAmount || 0;
                } else {
                    totalPurchCgst3B += (p.gstAmount || 0) / 2;
                    totalPurchSgst3B += (p.gstAmount || 0) / 2;
                }
            });

            reportData = [
                { "GSTR-3B Table / Section": "3.1.a Outward Taxable Supplies (Sales)", "Taxable Value (INR)": totalSalesTaxable3B.toFixed(2), "Integrated Tax (IGST)": totalSalesIgst3B.toFixed(2), "Central Tax (CGST)": totalSalesCgst3B.toFixed(2), "State/UT Tax (SGST)": totalSalesSgst3B.toFixed(2) },
                { "GSTR-3B Table / Section": "4.A.5 Eligible ITC (Purchases Inward)", "Taxable Value (INR)": totalPurchTaxable3B.toFixed(2), "Integrated Tax (IGST)": totalPurchIgst3B.toFixed(2), "Central Tax (CGST)": totalPurchCgst3B.toFixed(2), "State/UT Tax (SGST)": totalPurchSgst3B.toFixed(2) },
                { "GSTR-3B Table / Section": "5. Exempt, Nil and Non-GST Inward Supplies", "Taxable Value (INR)": "0.00", "Integrated Tax (IGST)": "0.00", "Central Tax (CGST)": "0.00", "State/UT Tax (SGST)": "0.00" },
                { "GSTR-3B Table / Section": "6.1 Net Tax Payable (Outward Tax - ITC)", "Taxable Value (INR)": "—", "Integrated Tax (IGST)": Math.max(0, totalSalesIgst3B - totalPurchIgst3B).toFixed(2), "Central Tax (CGST)": Math.max(0, totalSalesCgst3B - totalPurchCgst3B).toFixed(2), "State/UT Tax (SGST)": Math.max(0, totalSalesSgst3B - totalPurchSgst3B).toFixed(2) }
            ];
            break;

        case 'gstr-9':
            fileName = "GSTR_9_Annual_Tax_Consolidated_Return";
            const myState9 = (companyProfile.state || "GUJARAT").toUpperCase();
            
            let totalSalesTaxable9 = 0;
            let totalSalesIgst9 = 0;
            let totalSalesCgst9 = 0;
            let totalSalesSgst9 = 0;
            let totalSalesGross9 = 0;
            
            filteredInvoices.forEach(inv => {
                totalSalesGross9 += inv.grandTotal;
                totalSalesTaxable9 += inv.subTotal;
                const party = (stockists || []).find(s => s._id.toString() === (inv.stockistId || inv.stockist?._id || '').toString());
                const partyState = (party ? (party.state || "GUJARAT") : "GUJARAT").toUpperCase();
                const isInterstate = partyState !== myState9;
                
                if (isInterstate) {
                    totalSalesIgst9 += inv.gstAmount;
                } else {
                    totalSalesCgst9 += inv.gstAmount / 2;
                    totalSalesSgst9 += inv.gstAmount / 2;
                }
            });

            let totalPurchTaxable9 = 0;
            let totalPurchIgst9 = 0;
            let totalPurchCgst9 = 0;
            let totalPurchSgst9 = 0;
            let totalPurchGross9 = 0;
            
            filteredPurchases.forEach(p => {
                totalPurchGross9 += p.grandTotal || 0;
                totalPurchTaxable9 += p.subTotal || 0;
                const isInterstate = false;
                if (isInterstate) {
                    totalPurchIgst9 += p.gstAmount || 0;
                } else {
                    totalPurchCgst9 += (p.gstAmount || 0) / 2;
                    totalPurchSgst9 += (p.gstAmount || 0) / 2;
                }
            });

            const salesCN9 = filteredNotes.filter(n => n.noteType === 'CN').reduce((s, x) => s + x.amount, 0);
            const purchDN9 = filteredNotes.filter(n => n.noteType === 'DN').reduce((s, x) => s + x.amount, 0);

            reportData = [
                { "GSTR-9 Table Source": "Table 4: Details of Outward Supplies (Sales)", "Gross Value (INR)": totalSalesGross9.toFixed(2), "Taxable Value (INR)": totalSalesTaxable9.toFixed(2), "IGST (INR)": totalSalesIgst9.toFixed(2), "CGST (INR)": totalSalesCgst9.toFixed(2), "SGST (INR)": totalSalesSgst9.toFixed(2) },
                { "GSTR-9 Table Source": "Table 6: Details of ITC Availed (Purchases)", "Gross Value (INR)": totalPurchGross9.toFixed(2), "Taxable Value (INR)": totalPurchTaxable9.toFixed(2), "IGST (INR)": totalPurchIgst9.toFixed(2), "CGST (INR)": totalPurchCgst9.toFixed(2), "SGST (INR)": totalPurchSgst9.toFixed(2) },
                { "GSTR-9 Table Source": "Table 8: Credit Notes Issued (Sales CN)", "Gross Value (INR)": salesCN9.toFixed(2), "Taxable Value (INR)": salesCN9.toFixed(2), "IGST (INR)": "0.00", "CGST (INR)": "0.00", "SGST (INR)": "0.00" },
                { "GSTR-9 Table Source": "Table 8: Debit Notes Issued (Purch DN)", "Gross Value (INR)": purchDN9.toFixed(2), "Taxable Value (INR)": purchDN9.toFixed(2), "IGST (INR)": "0.00", "CGST (INR)": "0.00", "SGST (INR)": "0.00" },
                { "GSTR-9 Table Source": "Table 9: Consolidated Tax Liability", "Gross Value (INR)": "—", "Taxable Value (INR)": "—", "IGST (INR)": totalSalesIgst9.toFixed(2), "CGST (INR)": totalSalesCgst9.toFixed(2), "SGST (INR)": totalSalesSgst9.toFixed(2) }
            ];
            break;

        case 'doc-expiry':
            fileName = "Compliance_Expiry_Tracker";
            (stockists || []).forEach(s => {
                reportData.push({
                    "Party": s.companyName || s.name,
                    "Drug License": s.dlNo || "N/A",
                    "FSSAI": s.fssaiNo || "N/A",
                    "GSTIN": s.gstNo || s.gstin || "URD",
                    "Verification Status": s.approved ? "ACTIVE" : "PENDING"
                });
            });
            break;

        case 'item-batch':
            fileName = "Batch_Wise_Inventory";
            (products || []).forEach(p => {
                (p.batches || []).forEach(b => {
                    reportData.push({
                        "Product": p.name,
                        "Batch No": b.batchNo,
                        "Expiry": b.expDate,
                        "Qty Available": b.qtyAvailable,
                        "Valuation (PTS)": (b.qtyAvailable * p.pts).toFixed(2)
                    });
                });
            });
            break;

        case 'credit-debit-summary':
            fileName = "Financial_Adjustment_Notes";
            reportData = filteredNotes.map(n => ({
                "Note Type": n.noteType || n.type,
                "Note Ref": n.noteNo,
                "Date": new Date(n.date || n.createdAt).toLocaleDateString('en-GB'),
                "Party Name": n.partyName,
                "Reason": n.reason,
                "Impact Amount": n.amount
            }));
            break;

        default:
            fileName = `Emyris_${type}_Data_Dump`;
            reportData = filteredInvoices.map(i => ({ "Date": i.createdAt, "No": i.invoiceNo, "Party": i.stockistName, "Amount": i.grandTotal }));
    }

    return { reportData, fileName };
}





// --- SYSTEM HEALTH & EMAIL RECOVERY ---
async function loadFailedEmails() {
    const tbody = document.getElementById('failedEmailTableBody');
    if(!tbody) return;

    try {
        const res = await fetch(`${API_BASE}/admin/failed-emails`);
        const failed = await res.json();
        
        if (failed.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: #10b981; padding: 20px;">✅ All system emails delivered successfully.</td></tr>`;
            return;
        }

        tbody.innerHTML = failed.map(e => `
            <tr>
                <td style="font-size: 0.8rem; font-weight: 700;">${e.to}</td>
                <td style="font-size: 0.8rem;">${e.subject}</td>
                <td style="color: #ef4444; font-size: 0.75rem;">${e.error}</td>
                <td style="text-align: right;">
                    <button class="btn btn-primary" style="padding: 5px 10px; font-size: 0.7rem;" onclick="retryEmail('${e._id}', this)">🔍„ RETRY</button>
                    <button class="btn btn-ghost" style="padding: 5px 10px; color: #ef4444;" onclick="deleteFailedEmail('${e._id}')">🗑️</button>
                </td>
            </tr>
        `).join('');
    } catch (e) { console.error("Load failed emails error:", e); }
}

async function retryEmail(id, btn) {
    const originalHtml = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `⏳`;

    try {
        const res = await fetch(`${API_BASE}/admin/failed-emails/${id}/retry`, { method: 'POST' });
        const result = await res.json();
        if (result.success) {
            alert("✅ Email delivered successfully on retry!");
            loadFailedEmails();
        } else {
            alert("❌ Retry failed: " + (result.message || "Unknown error"));
        }
    } catch (e) { alert("Retry failed"); }
    finally {
        btn.disabled = false;
        btn.innerHTML = originalHtml;
    }
}

async function deleteFailedEmail(id) {
    if(!confirm("Are you sure you want to dismiss this failure log?")) return;
    try {
        const res = await fetch(`${API_BASE}/admin/failed-emails/${id}`, { method: 'DELETE' });
        const result = await res.json();
        if (result.success) {
            loadFailedEmails();
        }
    } catch (e) { alert("Delete failed"); }
}
// --- TREASURY & PAYMENTS MODULE ---

async function loadPayments() {
    try {
        const res = await fetch(`${API_BASE}/admin/payments`);
        const data = await res.json();
        allPayments = data.map(p => ({
            ...p,
            _id: p._id || p.id,
            amount: Number(p.amount || 0),
            stockist: p.stockist || p.Stockist,
            partyName: p.partyName || (p.stockist || p.Stockist)?.name || 'Direct Customer'
        }));
        if (allPayments) renderPayments();
    } catch (e) { console.error("Error loading payments:", e); }
}

function renderPayments() {
    const tbody = document.getElementById('paymentTableBody');
    if (!tbody) return;

    const filtered = allPayments.filter(p => p.type === currentPaymentTypeFilter);
    
    // Update Monthly Stats
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const monthlyReceipts = allPayments.filter(p => p.type === 'RECEIPT' && new Date(p.date).getMonth() === currentMonth && new Date(p.date).getFullYear() === currentYear).reduce((s, x) => s + x.amount, 0);
    const monthlyPayouts = allPayments.filter(p => p.type === 'PAYMENT' && new Date(p.date).getMonth() === currentMonth && new Date(p.date).getFullYear() === currentYear).reduce((s, x) => s + x.amount, 0);

    document.getElementById('stat-receipts-total').innerText = `₹${monthlyReceipts.toLocaleString('en-IN', {minimumFractionDigits:2})}`;
    document.getElementById('stat-payouts-total').innerText = `₹${monthlyPayouts.toLocaleString('en-IN', {minimumFractionDigits:2})}`;
    document.getElementById('stat-net-flow').innerText = `₹${(monthlyReceipts - monthlyPayouts).toLocaleString('en-IN', {minimumFractionDigits:2})}`;
    document.getElementById('stat-net-flow').style.color = (monthlyReceipts - monthlyPayouts) >= 0 ? '#10b981' : '#ef4444';

    // Update Page Header
    document.getElementById('payment-page-title').innerText = currentPaymentTypeFilter === 'RECEIPT' ? "💡° Customer Collections (Payment In)" : "💡¸ Supplier Payouts (Payment Out)";

    tbody.innerHTML = filtered.map(p => `
        <tr>
            <td style="font-family:monospace; font-weight:700;">${p.paymentNo}</td>
            <td><span class="badge" style="background:${p.type === 'RECEIPT' ? '#10b981' : '#ef4444'}; color:#fff; font-size:0.6rem;">${p.type}</span></td>
            <td style="font-weight:600;">${p.partyName}</td>
            <td>${p.method}</td>
            <td>${p.refNo || '-'}</td>
            <td style="text-align:right; font-weight:800; color:${p.type === 'RECEIPT' ? '#10b981' : '#ef4444'};">₹${p.amount.toLocaleString('en-IN', {minimumFractionDigits:2})}</td>
            <td>${new Date(p.date).toLocaleDateString('en-GB')}</td>
            <td style="text-align:right;">
                <button class="btn btn-ghost" style="padding:4px 8px; font-size:0.6rem; color:var(--primary);" onclick="editPayment('${p._id}')">✓ï¸ EDIT</button>
                <button class="btn btn-ghost" style="padding:4px 8px; font-size:0.6rem; color:#ef4444;" onclick="deletePayment('${p._id}')">✓• DELETE</button>
            </td>
        </tr>
    `).join('');
}

async function editPayment(id) {
    const p = allPayments.find(x => x._id == id);
    if (!p) return;

    openPaymentModal();
    // Update Modal for Edit Mode
    document.getElementById('payment-modal-title').innerText = "✓ï¸ Edit Payment Voucher";
    document.getElementById('pay-submit-btn').innerHTML = "💡¾ UPDATE VOUCHER";
    
    // Set values
    safeSetVal('pay-id', p._id);
    safeSetVal('pay-type', p.type);
    safeSetVal('pay-date', p.date ? p.date.split('T')[0] : '');
    
    updatePaymentContext(); // Re-populate parties based on type
    
    safeSetVal('pay-party', p.stockistId || p.stockist?._id || p.stockist);
    safeSetVal('pay-amount', p.amount);
    safeSetVal('pay-method', p.method);
    safeSetVal('pay-ref', p.refNo);

    updatePartyBalanceDisplay();
}

function openPaymentModal() {
    const modal = document.getElementById('paymentModal');
    const form = document.getElementById('paymentForm');
    if(!modal || !form) return;
    
    form.reset();
    document.getElementById('pay-date').value = new Date().toISOString().split('T')[0];
    document.getElementById('pay-type').value = currentPaymentTypeFilter;
    
    // Reset badges and amounts for memory-free UI
    const unallocatedEl = document.getElementById('unallocated-amount');
    if (unallocatedEl) unallocatedEl.innerText = '₹0.00';
    const linkedBadge = document.getElementById('linked-total-badge');
    if (linkedBadge) linkedBadge.innerText = 'LINKED: ₹0.00';
    const balanceEl = document.getElementById('party-total-due');
    if (balanceEl) balanceEl.innerText = 'Outstanding: ₹0.00';
    const listEl = document.getElementById('bill-preview-list');
    if (listEl) listEl.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 1rem; font-style: italic;">Select a party to see outstanding bills...</div>';
    const submitBtn = document.getElementById('pay-submit-btn');
    if (submitBtn) submitBtn.innerHTML = "✓ CONFIRM & POST";

    updatePaymentContext();
    modal.classList.remove('hidden');
}

function closePaymentModal() {
    document.getElementById('paymentModal').classList.add('hidden');
}

function updatePaymentContext() {
    const type = document.getElementById('pay-type').value;
    const partySelect = document.getElementById('pay-party');
    const partyLabel = document.getElementById('pay-party-label');
    const modalTitle = document.getElementById('payment-modal-title');
    const badge = document.getElementById('pay-badge');
    const vPlaceholder = document.getElementById('pay-voucher-placeholder');

    const month = new Date().getMonth() + 1;
    const year  = new Date().getFullYear();
    const fiscalStart = month >= 4 ? year : year - 1;
    const fiscalEnd   = (fiscalStart + 1).toString().slice(-2);
    const yearTag     = `${fiscalStart.toString().slice(-2)}${fiscalEnd}`;

    badge.innerText = type === 'RECEIPT' ? "RECEIPT" : "PAYMENT OUT";
    badge.style.background = type === 'RECEIPT' ? '#10b981' : '#ef4444';
    
    vPlaceholder.innerText = 'Loading...';
    const docType = type === 'RECEIPT' ? 'payin' : 'payout';
    fetch(`/api/admin/next-doc-no?type=${docType}`)
        .then(res => res.json())
        .then(data => {
            if (data && data.docNo) vPlaceholder.innerText = data.docNo;
            else vPlaceholder.innerText = `PAY${type === 'RECEIPT' ? 'IN' : 'OUT'}-${yearTag}-XXXX`;
        })
        .catch(e => {
            console.error('Failed to fetch next doc no:', e);
            vPlaceholder.innerText = `PAY${type === 'RECEIPT' ? 'IN' : 'OUT'}-${yearTag}-XXXX`;
        });

    modalTitle.innerText = type === 'RECEIPT' ? "💡° Customer Collection (Pay-In)" : "💡¸ Supplier Settlement (Pay-Out)";
    partyLabel.innerText = type === 'RECEIPT' ? "1. SELECT CUSTOMER / STOCKIST" : "1. SELECT SUPPLIER / VENDOR";

    partySelect.innerHTML = `<option value="">-- Choose Party --</option>`;
    const filteredParties = allStockists.filter(s => type === 'RECEIPT' ? (s.partyType || 'STOCKIST') === 'STOCKIST' : s.partyType === 'SUPPLIER');
    
    filteredParties.forEach(s => {
        partySelect.innerHTML += `<option value="${s._id}">${s.name} (${s.city || '-'})</option>`;
    });

    updatePartyBalanceDisplay();
}

function updatePartyBalanceDisplay() {
    const partyId = document.getElementById('pay-party').value;
    const balanceEl = document.getElementById('party-total-due');
    const listEl = document.getElementById('bill-preview-list');

    if (!partyId) {
        if (balanceEl) {
            balanceEl.innerText = "Outstanding: ₹0.00";
            balanceEl.style.color = 'var(--text-muted)';
        }
        if (listEl) listEl.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 1rem; font-style: italic;">Select a party to see outstanding bills...</div>';
        return;
    }
    previewBillAdjustment();
}

function previewBillAdjustment() {
    const partyId = document.getElementById('pay-party').value;
    const amount = Number(document.getElementById('pay-amount').value) || 0;
    const type = document.getElementById('pay-type').value;
    const listEl = document.getElementById('bill-preview-list');
    const balanceEl = document.getElementById('party-total-due');

    if (!partyId) return;

    let remaining = amount;
    
    const bills = type === 'RECEIPT' 
        ? allInvoices.filter(i => (String(i.stockist?._id) === String(partyId) || String(i.stockistId) === String(partyId)) && (Number(i.outstandingAmount ?? i.grandTotal) > 0)).sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt))
        : allPurchaseEntries.filter(p => (String(p.supplierId) === String(partyId)) && (Number(p.outstandingAmount ?? p.grandTotal) > 0)).sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt));

    // Calculate total actual outstanding from active bills
    const totalActualOutstanding = bills.reduce((sum, b) => sum + Number(b.outstandingAmount ?? b.grandTotal), 0);
    
    if (balanceEl) {
        balanceEl.innerText = `Outstanding: ₹${totalActualOutstanding.toLocaleString('en-IN', {minimumFractionDigits:2})}`;
        balanceEl.style.color = totalActualOutstanding > 0 ? '#f59e0b' : '#10b981';
    }

    if (bills.length === 0) {
        const emptyMsg = '<div style="text-align: center; color: var(--text-muted); padding: 2rem; font-style: italic; opacity: 0.6;">No outstanding bills found for this party.</div>';
        if (listEl) listEl.innerHTML = emptyMsg;
        
        const unallocatedEl = document.getElementById('unallocated-amount');
        if (unallocatedEl) unallocatedEl.innerText = `₹0.00`;
        
        const linkedBadge = document.getElementById('linked-total-badge');
        if (linkedBadge) linkedBadge.innerText = `LINKED: ₹0.00`;
        return;
    }

    // Render Logic for container
    let previewHtml = `<table style="width:100%; border-collapse:collapse; font-size:0.75rem;">
        <thead style="background:rgba(255,255,255,0.02); color:var(--primary);">
            <tr><th style="text-align:left; padding:8px;">Bill No</th><th style="text-align:right;">Due</th><th style="text-align:right; color:var(--accent);">Adjusting</th></tr>
        </thead>
        <tbody>`;

    let totalLinked = 0;

    bills.forEach(b => {
        const due = Number(b.outstandingAmount ?? b.grandTotal);
        const adj = Math.min(remaining, due);
        totalLinked += adj;
        
        // Form Preview
        previewHtml += `<tr style="border-bottom:1px solid rgba(255,255,255,0.03); opacity: ${adj > 0 ? 1 : 0.4};">
            <td style="padding:8px; font-family:monospace;">${b.invoiceNo || b.purchaseNo}</td>
            <td style="text-align:right; padding:8px;">₹${due.toLocaleString('en-IN', {minimumFractionDigits:2})}</td>
            <td style="text-align:right; padding:8px; font-weight:800; color:var(--accent);">₹${adj.toLocaleString('en-IN', {minimumFractionDigits:2})}</td>
        </tr>`;

        remaining -= adj;
    });

    previewHtml += '</tbody></table>';
    if (listEl) listEl.innerHTML = previewHtml;

    // Update unallocated and linked badges
    const unallocatedEl = document.getElementById('unallocated-amount');
    if (unallocatedEl) {
        unallocatedEl.innerText = `₹${remaining.toLocaleString('en-IN', {minimumFractionDigits:2})}`;
        unallocatedEl.style.color = remaining > 0 ? '#ef4444' : '#10b981';
    }
    
    const linkedBadge = document.getElementById('linked-total-badge');
    if (linkedBadge) {
        linkedBadge.innerText = `LINKED: ₹${totalLinked.toLocaleString('en-IN', {minimumFractionDigits:2})}`;
    }
}


async function savePayment(e) {
    e.preventDefault();
    const type = document.getElementById('pay-type').value;
    const btn = document.getElementById('pay-submit-btn');
    const originalText = btn.innerHTML;

    const data = {
        type: type,
        date: document.getElementById('pay-date').value,
        party: document.getElementById('pay-party').value,
        amount: Number(document.getElementById('pay-amount').value),
        method: document.getElementById('pay-method').value,
        refNo: document.getElementById('pay-ref').value
    };

    if (!data.party) return alert("Please select a party.");
    if (data.amount <= 0) return alert("Amount must be greater than zero.");

    try {
        btn.disabled = true;
        btn.innerHTML = "⏳ POSTING VOUCHER...";

        const payId = document.getElementById('pay-id').value;
        const method = payId ? 'PUT' : 'POST';
        const url = payId ? `${API_BASE}/admin/payments/${payId}` : `${API_BASE}/admin/payments`;

        const res = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await res.json();
        if (result.success) {
            alert(`✅ Voucher ${result.payment.paymentNo} ${payId ? 'updated' : 'posted'} successfully!`);
            closePaymentModal();
            await loadPayments();
            renderPayments();
            await loadInvoices(); 
            await loadPurchaseEntries();
            await loadStockists(); 
        } else {
            alert("Error: " + result.error);
        }
    } catch (e) { alert("Server error posting payment."); }
    finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}


async function deletePayment(id) {
    if(!confirm("Warning: Deleting a payment voucher will NOT automatically reverse the balance in the ledger in this version. Proceed?")) return;
    try {
        const res = await fetch(`${API_BASE}/admin/payments/${id}`, { method: 'DELETE' });
        const result = await res.json();
        if (result.success) {
            loadPayments();
            loadStockists();
        }
    } catch (e) { alert("Delete failed."); }
}

function filterPayments() {
    const val = document.getElementById('paymentSearch').value.toLowerCase();
    const tbody = document.getElementById('paymentTableBody');
    const filtered = allPayments.filter(p => 
        p.type === currentPaymentTypeFilter && 
        (p.paymentNo.toLowerCase().includes(val) || p.partyName.toLowerCase().includes(val))
    );

    tbody.innerHTML = filtered.map(p => `
        <tr>
            <td style="font-family:monospace; font-weight:700;">${p.paymentNo}</td>
            <td><span class="badge" style="background:${p.type === 'RECEIPT' ? '#10b981' : '#ef4444'}; color:#fff; font-size:0.6rem;">${p.type}</span></td>
            <td style="font-weight:600;">${p.partyName}</td>
            <td>${p.method}</td>
            <td>${p.refNo || '-'}</td>
            <td style="text-align:right; font-weight:800; color:${p.type === 'RECEIPT' ? '#10b981' : '#ef4444'};">₹${p.amount.toLocaleString('en-IN', {minimumFractionDigits:2})}</td>
            <td>${new Date(p.date).toLocaleDateString('en-GB')}</td>
            <td style="text-align:right;">
                <button class="btn btn-ghost" style="padding:4px 8px; font-size:0.6rem; color:#ef4444;" onclick="deletePayment('${p._id}')">✓• DELETE</button>
            </td>
        </tr>
    `).join('');
}

// --- INTELLIGENCE & REPORTING ENGINE ---


let currentReportData = [];
let currentReportName = "Report";

function closeReportModal() {
    document.getElementById('reportModal').classList.add('hidden');
}

async function renderReportView() {
    const type = document.getElementById('current-report-type').value;
    const fromDateStr = document.getElementById('report-from-date').value;
    const toDateStr = document.getElementById('report-to-date').value;
    
    const loading = document.getElementById('report-loading-spinner');
    const empty = document.getElementById('report-empty-state');
    const thead = document.getElementById('report-table-head');
    const tbody = document.getElementById('report-table-body');
    
    thead.innerHTML = '';
    tbody.innerHTML = '';
    empty.style.display = 'none';
    loading.style.display = 'block';
    
    try {
        const res = await fetch(`${API_BASE}/admin/reports/full-audit`);
        const data = await res.json();
        
        const stdContainer = document.getElementById('standard-report-table-container') || document.querySelector('.table-container');
        const agingWorkspace = document.getElementById('aging-report-workspace');
        
        if (type === 'ageing-report') {
            loading.style.display = 'none';
            if (stdContainer) stdContainer.classList.add('hidden');
            if (agingWorkspace) {
                agingWorkspace.classList.remove('hidden');
                initAgingReportWorkspace(data, fromDateStr, toDateStr);
            }
            return;
        } else {
            if (stdContainer) stdContainer.classList.remove('hidden');
            if (agingWorkspace) agingWorkspace.classList.add('hidden');
        }

        const { reportData, fileName } = getReportDataByType(type, data, fromDateStr, toDateStr);
        
        currentReportData = reportData;
        currentReportName = fileName;
        
        loading.style.display = 'none';
        
        if (!reportData || reportData.length === 0) {
            empty.style.display = 'block';
            return;
        }
        
        // Render Table Headers
        const headers = Object.keys(reportData[0]);
        headers.forEach(h => {
            const th = document.createElement('th');
            th.textContent = h;
            th.style.padding = '10px';
            th.style.borderBottom = '2px solid rgba(255,255,255,0.1)';
            th.style.textAlign = 'left';
            th.style.whiteSpace = 'nowrap';
            thead.appendChild(th);
        });
        
        // Render Rows
        reportData.forEach(row => {
            const tr = document.createElement('tr');
            headers.forEach(h => {
                const td = document.createElement('td');
                td.textContent = row[h];
                td.style.padding = '8px 10px';
                td.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
                td.style.whiteSpace = 'nowrap';
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        });
        
    } catch (e) {
        console.error("Report generation error:", e);
        loading.style.display = 'none';
        alert("Failed to compile report. Check console.");
    }
}

let currentAgingData = null;
let currentAgingFromDate = '';
let currentAgingToDate = '';

function initAgingReportWorkspace(data, fromDate, toDate) {
    currentAgingData = data;
    currentAgingFromDate = fromDate;
    currentAgingToDate = toDate;
    
    const invoices = data.invoices || [];
    
    // 1. Calculate overall metrics & buckets
    let totalOutstanding = 0;
    let totalReceivable = 0;
    
    const buckets = {
        '1-30': 0,
        '31-45': 0,
        '46-60': 0,
        '60+': 0
    };
    
    const reportFrom = fromDate ? new Date(fromDate) : new Date(0);
    const reportTo = toDate ? new Date(toDate) : new Date();
    reportTo.setHours(23, 59, 59, 999);
    
    invoices.forEach(inv => {
        const invDate = new Date(inv.createdAt || inv.date);
        if (invDate < reportFrom || invDate > reportTo) return;
        if (inv.status === 'paid' || inv.paymentStatus === 'PAID') return;
        
        const bal = Number(inv.outstandingAmount ?? inv.grandTotal ?? 0);
        if (bal <= 0) return;
        
        totalOutstanding += bal;
        
        const dueDate = inv.dueDate ? new Date(inv.dueDate) : new Date(invDate.getTime() + 30 * 24 * 60 * 60 * 1000);
        const today = new Date();
        const diffTime = today.getTime() - dueDate.getTime();
        const daysLate = Math.max(0, Math.floor(diffTime / (24 * 60 * 60 * 1000)));
        
        if (daysLate > 0) {
            totalReceivable += bal;
            if (daysLate <= 30) buckets['1-30'] += bal;
            else if (daysLate <= 45) buckets['31-45'] += bal;
            else if (daysLate <= 60) buckets['46-60'] += bal;
            else buckets['60+'] += bal;
        }
    });
    
    document.getElementById('aging-total-balance').innerText = '₹' + totalOutstanding.toLocaleString('en-IN', { minimumFractionDigits: 2 });
    document.getElementById('aging-total-receivable').innerText = '₹' + totalReceivable.toLocaleString('en-IN', { minimumFractionDigits: 2 });
    
    renderSvgDonut('aging-system-chart-container', 'aging-system-legend', buckets);
    renderAgingDirectory();
    
    document.getElementById('aging-dossier-panel').innerHTML = `
        <div style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.3;">📂</div>
        <div style="font-size: 0.85rem; font-style: italic; color: var(--text-muted);">Select a stockist from the directory to compile their collections dossier.</div>
    `;
}

function renderAgingDirectory() {
    const listEl = document.getElementById('aging-directory-list');
    if (!listEl) return;
    listEl.innerHTML = '';
    
    const stockists = currentAgingData.stockists || [];
    const invoices = currentAgingData.invoices || [];
    
    const reportFrom = currentAgingFromDate ? new Date(currentAgingFromDate) : new Date(0);
    const reportTo = currentAgingToDate ? new Date(currentAgingToDate) : new Date();
    reportTo.setHours(23, 59, 59, 999);
    
    const activeList = [];
    stockists.forEach(s => {
        let bal = 0;
        invoices.forEach(inv => {
            const invDate = new Date(inv.createdAt || inv.date);
            if (invDate < reportFrom || invDate > reportTo) return;
            if (inv.status === 'paid' || inv.paymentStatus === 'PAID') return;
            
            const invBal = Number(inv.outstandingAmount ?? inv.grandTotal ?? 0);
            if (invBal <= 0) return;
            
            const stockistId = (inv.stockistId || inv.stockist?._id || '').toString();
            if (stockistId === (s._id || s.id || '').toString()) {
                bal += invBal;
            }
        });
        
        if (bal > 0) {
            activeList.push({
                id: s._id || s.id,
                name: s.companyName || s.name,
                city: s.city || '-',
                balance: bal
            });
        }
    });
    
    activeList.sort((a,b) => b.balance - a.balance);
    
    if (activeList.length === 0) {
        listEl.innerHTML = '<div style="text-align: center; font-size: 0.75rem; color: var(--text-muted); padding: 2rem;">No active receivables found.</div>';
        return;
    }
    
    activeList.forEach(item => {
        const itemEl = document.createElement('div');
        itemEl.className = 'aging-directory-item';
        itemEl.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; background: rgba(255,255,255,0.02); border: 1px solid var(--glass-border); border-radius: 8px; cursor: pointer; transition: 0.2s; margin-bottom: 6px;';
        itemEl.setAttribute('onmouseover', 'this.style.background="rgba(255,255,255,0.05)"');
        itemEl.setAttribute('onmouseout', 'this.style.background="rgba(255,255,255,0.02)"');
        itemEl.onclick = () => selectAgingStockist(item.id);
        
        itemEl.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 4px; max-width: 65%;">
                <span style="font-size: 0.75rem; font-weight: 800; color: var(--primary); text-decoration: underline; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${item.name}</span>
                <span style="font-size: 0.6rem; color: var(--text-muted);">${item.city}</span>
            </div>
            <div style="text-align: right;">
                <span style="font-size: 0.75rem; font-weight: 900; color: #fff;">₹${item.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
        `;
        listEl.appendChild(itemEl);
    });
}

function filterAgingDirectory() {
    const query = document.getElementById('aging-directory-search').value.toLowerCase();
    const items = document.querySelectorAll('.aging-directory-item');
    items.forEach(item => {
        const text = item.textContent.toLowerCase();
        if (text.includes(query)) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
}

function renderSvgDonut(containerId, legendId, buckets) {
    const container = document.getElementById(containerId);
    const legend = document.getElementById(legendId);
    if (!container || !legend) return;
    
    const colors = {
        '1-30': '#eab308',
        '31-45': '#10b981',
        '46-60': '#ef4444',
        '60+': '#475569'
    };
    
    const total = Object.values(buckets).reduce((sum, v) => sum + v, 0);
    
    if (total === 0) {
        container.innerHTML = `
            <svg width="80" height="80" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="16" />
                <circle cx="50" cy="50" r="24" fill="#0f172a" />
            </svg>
        `;
        legend.innerHTML = `
            <div style="grid-column: span 2; text-align: center; color: var(--text-muted); font-size: 0.7rem; font-style: italic;">No overdue receivables.</div>
        `;
        return;
    }
    
    let accumulatedPercent = 0;
    const paths = [];
    
    const slices = Object.entries(buckets).map(([key, val]) => ({
        key,
        value: val,
        color: colors[key],
        percent: val / total
    })).filter(s => s.value > 0);
    
    function getCoordinatesForPercent(percent) {
        const x = Math.cos(2 * Math.PI * (percent - 0.25));
        const y = Math.sin(2 * Math.PI * (percent - 0.25));
        return [x, y];
    }
    
    if (slices.length === 1) {
        paths.push(`<circle cx="50" cy="50" r="40" fill="none" stroke="${slices[0].color}" stroke-width="16" />`);
    } else {
        slices.forEach(slice => {
            const [startX, startY] = getCoordinatesForPercent(accumulatedPercent);
            accumulatedPercent += slice.percent;
            const [endX, endY] = getCoordinatesForPercent(accumulatedPercent);
            
            const x1 = 50 + startX * 40;
            const y1 = 50 + startY * 40;
            const x2 = 50 + endX * 40;
            const y2 = 50 + endY * 40;
            
            const largeArcFlag = slice.percent > 0.5 ? 1 : 0;
            const pathData = `M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
            paths.push(`<path d="${pathData}" fill="${slice.color}" style="transition: 0.3s; cursor: pointer;" />`);
        });
    }
    
    container.innerHTML = `
        <svg width="80" height="80" viewBox="0 0 100 100">
            ${paths.join('')}
            <circle cx="50" cy="50" r="24" fill="#0f172a" />
        </svg>
    `;
    
    legend.innerHTML = Object.entries(buckets).map(([key, val]) => {
        const pct = total > 0 ? ((val / total) * 100).toFixed(1) : '0.0';
        return `
            <div style="display: flex; align-items: center; gap: 6px;">
                <span style="display: inline-block; width: 8px; height: 8px; border-radius: 2px; background: ${colors[key]};"></span>
                <span style="color: var(--text-muted); text-transform: uppercase; font-size: 0.65rem; font-weight: 700;">${key} Days:</span>
                <span style="color: #fff; font-weight: 800;">₹${val.toLocaleString('en-IN', { maximumFractionDigits: 0 })} (${pct}%)</span>
            </div>
        `;
    }).join('');
}

function selectAgingStockist(partyId) {
    const dossier = document.getElementById('aging-dossier-panel');
    if (!dossier) return;
    
    const stockist = (currentAgingData.stockists || []).find(s => (s._id || s.id || '').toString() === partyId.toString());
    if (!stockist) return;
    
    const invoices = currentAgingData.invoices || [];
    
    const reportFrom = currentAgingFromDate ? new Date(currentAgingFromDate) : new Date(0);
    const reportTo = currentAgingToDate ? new Date(currentAgingToDate) : new Date();
    reportTo.setHours(23, 59, 59, 999);
    
    let totalOutstanding = 0;
    let totalReceivable = 0;
    
    const buckets = {
        '1-30': 0,
        '31-45': 0,
        '46-60': 0,
        '60+': 0
    };
    
    const ledger = [];
    
    invoices.forEach(inv => {
        const invDate = new Date(inv.createdAt || inv.date);
        if (invDate < reportFrom || invDate > reportTo) return;
        
        const stockistId = (inv.stockistId || inv.stockist?._id || '').toString();
        if (stockistId !== partyId.toString()) return;
        
        if (inv.status === 'paid' || inv.paymentStatus === 'PAID') return;
        
        const bal = Number(inv.outstandingAmount ?? inv.grandTotal ?? 0);
        if (bal <= 0) return;
        
        totalOutstanding += bal;
        
        const dueDate = inv.dueDate ? new Date(inv.dueDate) : new Date(invDate.getTime() + 30 * 24 * 60 * 60 * 1000);
        const today = new Date();
        const diffTime = today.getTime() - dueDate.getTime();
        const daysLate = Math.max(0, Math.floor(diffTime / (24 * 60 * 60 * 1000)));
        
        let bucket = 'Current';
        if (daysLate > 0) {
            totalReceivable += bal;
            if (daysLate <= 30) { bucket = '1-30'; buckets['1-30'] += bal; }
            else if (daysLate <= 45) { bucket = '31-45'; buckets['31-45'] += bal; }
            else if (daysLate <= 60) { bucket = '46-60'; buckets['46-60'] += bal; }
            else { bucket = '60+'; buckets['60+'] += bal; }
        }
        
        ledger.push({
            id: inv._id || inv.id,
            invoiceNo: inv.invoiceNo,
            date: invDate,
            dueDate: dueDate,
            daysLate: daysLate,
            total: inv.grandTotal,
            balance: bal,
            bucket: bucket
        });
    });
    
    ledger.sort((a,b) => b.date - a.date);
    
    dossier.style.cssText = 'flex: 1; display: flex; flex-direction: column; padding: 1.5rem; overflow: hidden; background: rgba(255,255,255,0.01); justify-content: flex-start; align-items: stretch; color: #fff;';
    
    dossier.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid var(--glass-border); padding-bottom: 1rem; margin-bottom: 1rem; flex-shrink: 0;">
            <div>
                <h3 style="margin: 0; font-size: 1.1rem; color: var(--primary); font-weight: 900; display: flex; align-items: center; gap: 8px;">
                    🏢 ${stockist.companyName || stockist.name}
                </h3>
                <p style="font-size: 0.65rem; color: var(--text-muted); margin: 4px 0 0 0; text-transform: uppercase; font-weight: 700;">
                    GSTIN: ${stockist.gstNo || stockist.gstin || 'URD'} | DL No: ${stockist.dlNo || 'N/A'}
                </p>
            </div>
            
            <div style="display: flex; gap: 8px;">
                <button onclick="downloadPartyAgingExcel('${partyId}')" class="btn btn-ghost" style="padding: 6px 12px; font-size: 0.7rem; border-color: #10b981; color: #10b981; font-weight: 800;">📊 EXCEL DOSSIER</button>
                <button onclick="downloadPartyAgingPDF('${partyId}')" class="btn btn-ghost" style="padding: 6px 12px; font-size: 0.7rem; border-color: #ef4444; color: #ef4444; font-weight: 800;">📥 PDF DOSSIER</button>
            </div>
        </div>
        
        <div style="display: flex; gap: 1rem; margin-bottom: 1.5rem; flex-shrink: 0; flex-wrap: wrap;">
            <div style="display: flex; flex-direction: column; gap: 10px; min-width: 180px;">
                <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--glass-border); border-radius: 12px; padding: 10px 14px;">
                    <span style="font-size: 0.55rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Total Balance</span>
                    <h4 style="margin: 4px 0 0 0; font-size: 1.2rem; font-weight: 900; color: #fff;">₹${totalOutstanding.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h4>
                </div>
                <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--glass-border); border-radius: 12px; padding: 10px 14px;">
                    <span style="font-size: 0.55rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Total Receivable</span>
                    <h4 style="margin: 4px 0 0 0; font-size: 1.2rem; font-weight: 900; color: #ef4444;">₹${totalReceivable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h4>
                </div>
            </div>
            
            <div style="flex: 1; min-width: 280px; display: flex; align-items: center; gap: 1.5rem; background: rgba(255,255,255,0.02); border: 1px solid var(--glass-border); border-radius: 16px; padding: 10px 20px;">
                <div id="aging-party-chart-container" style="width: 80px; height: 80px; position: relative;"></div>
                <div id="aging-party-legend" style="display: grid; grid-template-columns: 1fr; gap: 4px; font-size: 0.65rem; width: 100%;"></div>
            </div>
        </div>
        
        <h4 style="margin: 0 0 8px 0; font-size: 0.75rem; color: var(--primary); text-transform: uppercase; letter-spacing: 0.05em; font-weight: 800; flex-shrink: 0;">Ledger Outstanding Schedule</h4>
        <div style="flex: 1; overflow-y: auto; border: 1px solid var(--glass-border); border-radius: 12px; background: rgba(0,0,0,0.2);">
            <table style="width: 100%; border-collapse: collapse; font-size: 0.75rem;">
                <thead style="position: sticky; top: 0; background: #0f172a; z-index: 5; border-bottom: 2px solid var(--glass-border);">
                    <tr>
                        <th style="padding: 10px; text-align: left; color: var(--text-muted);">Invoice No</th>
                        <th style="padding: 10px; text-align: left; color: var(--text-muted);">Inv Date</th>
                        <th style="padding: 10px; text-align: left; color: var(--text-muted);">Due Date</th>
                        <th style="padding: 10px; text-align: center; color: var(--text-muted);">Days Late</th>
                        <th style="padding: 10px; text-align: right; color: var(--text-muted);">Total (₹)</th>
                        <th style="padding: 10px; text-align: right; color: var(--text-muted);">Balance (₹)</th>
                    </tr>
                </thead>
                <tbody>
                    ${ledger.map(row => {
                        let borderStyle = '';
                        if (row.bucket === '1-30') borderStyle = 'border-left: 4px solid #eab308; background: rgba(234,179,8,0.02);';
                        else if (row.bucket === '31-45') borderStyle = 'border-left: 4px solid #10b981; background: rgba(16,185,129,0.02);';
                        else if (row.bucket === '46-60') borderStyle = 'border-left: 4px solid #ef4444; background: rgba(239,68,68,0.02);';
                        else if (row.bucket === '60+') borderStyle = 'border-left: 4px solid #475569; background: rgba(71,85,105,0.02);';
                        else borderStyle = 'border-left: 4px solid rgba(255,255,255,0.1);';
                        
                        return `
                            <tr style="border-bottom: 1px solid var(--glass-border); ${borderStyle}">
                                <td style="padding: 10px; font-weight: 800; font-family: monospace;">${row.invoiceNo}</td>
                                <td style="padding: 10px; color: var(--text-muted);">${row.date.toLocaleDateString('en-GB')}</td>
                                <td style="padding: 10px; color: var(--text-muted);">${row.dueDate.toLocaleDateString('en-GB')}</td>
                                <td style="padding: 10px; text-align: center; font-weight: 900; color: ${row.daysLate > 0 ? '#ef4444' : '#10b981'};">${row.daysLate} Days</td>
                                <td style="padding: 10px; text-align: right;">₹${row.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                <td style="padding: 10px; text-align: right; font-weight: 900; color: #fff;">₹${row.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                            </tr>
                        `;
                    }).join('')}
                    ${ledger.length === 0 ? '<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 2rem;">No outstanding ledger entries.</td></tr>' : ''}
                </tbody>
            </table>
        </div>
    `;
    
    renderSvgDonut('aging-party-chart-container', 'aging-party-legend', buckets);
}

function downloadPartyAgingExcel(partyId) {
    const stockist = (currentAgingData.stockists || []).find(s => (s._id || s.id || '').toString() === partyId.toString());
    if (!stockist) return;
    
    const invoices = currentAgingData.invoices || [];
    
    const reportFrom = currentAgingFromDate ? new Date(currentAgingFromDate) : new Date(0);
    const reportTo = currentAgingToDate ? new Date(currentAgingToDate) : new Date();
    reportTo.setHours(23, 59, 59, 999);
    
    let totalOutstanding = 0;
    let totalReceivable = 0;
    
    const buckets = { '1-30': 0, '31-45': 0, '46-60': 0, '60+': 0 };
    const rows = [];
    
    invoices.forEach(inv => {
        const invDate = new Date(inv.createdAt || inv.date);
        if (invDate < reportFrom || invDate > reportTo) return;
        
        const stockistId = (inv.stockistId || inv.stockist?._id || '').toString();
        if (stockistId !== partyId.toString()) return;
        
        if (inv.status === 'paid' || inv.paymentStatus === 'PAID') return;
        
        const bal = Number(inv.outstandingAmount ?? inv.grandTotal ?? 0);
        if (bal <= 0) return;
        
        totalOutstanding += bal;
        
        const dueDate = inv.dueDate ? new Date(inv.dueDate) : new Date(invDate.getTime() + 30 * 24 * 60 * 60 * 1000);
        const today = new Date();
        const diffTime = today.getTime() - dueDate.getTime();
        const daysLate = Math.max(0, Math.floor(diffTime / (24 * 60 * 60 * 1000)));
        
        let bucket = 'Current';
        if (daysLate > 0) {
            totalReceivable += bal;
            if (daysLate <= 30) { bucket = '1-30'; buckets['1-30'] += bal; }
            else if (daysLate <= 45) { bucket = '31-45'; buckets['31-45'] += bal; }
            else if (daysLate <= 60) { bucket = '46-60'; buckets['46-60'] += bal; }
            else { bucket = '60+'; buckets['60+'] += bal; }
        }
        
        rows.push({
            "Invoice No": inv.invoiceNo,
            "Invoice Date": invDate.toLocaleDateString('en-GB'),
            "Due Date": dueDate.toLocaleDateString('en-GB'),
            "Days Late": daysLate,
            "Total Value": inv.grandTotal,
            "Balance Due": bal,
            "Bucket": bucket
        });
    });
    
    rows.unshift({ "Invoice No": "" });
    rows.unshift({ "Invoice No": `60+ Days Bucket`, "Invoice Date": `Rs. ${buckets['60+'].toFixed(2)}` });
    rows.unshift({ "Invoice No": `46-60 Days Bucket`, "Invoice Date": `Rs. ${buckets['46-60'].toFixed(2)}` });
    rows.unshift({ "Invoice No": `31-45 Days Bucket`, "Invoice Date": `Rs. ${buckets['31-45'].toFixed(2)}` });
    rows.unshift({ "Invoice No": `1-30 Days Bucket`, "Invoice Date": `Rs. ${buckets['1-30'].toFixed(2)}` });
    rows.unshift({ "Invoice No": `Total Receivable Overdue`, "Invoice Date": `Rs. ${totalReceivable.toFixed(2)}` });
    rows.unshift({ "Invoice No": `Total Balance Outstanding`, "Invoice Date": `Rs. ${totalOutstanding.toFixed(2)}` });
    rows.unshift({ "Invoice No": "--- DOSSIER SUMMARY ---" });
    rows.unshift({ "Invoice No": `Party Name: ${stockist.companyName || stockist.name} | GSTIN: ${stockist.gstNo || 'URD'}` });
    
    downloadExcel(rows, `Aging_Ledger_${stockist.name.replace(/\s+/g, '_')}`);
}

function downloadPartyAgingPDF(partyId) {
    const stockist = (currentAgingData.stockists || []).find(s => (s._id || s.id || '').toString() === partyId.toString());
    if (!stockist) return;
    
    const invoices = currentAgingData.invoices || [];
    
    const reportFrom = currentAgingFromDate ? new Date(currentAgingFromDate) : new Date(0);
    const reportTo = currentAgingToDate ? new Date(currentAgingToDate) : new Date();
    reportTo.setHours(23, 59, 59, 999);
    
    let totalOutstanding = 0;
    let totalReceivable = 0;
    const buckets = { '1-30': 0, '31-45': 0, '46-60': 0, '60+': 0 };
    const items = [];
    
    invoices.forEach(inv => {
        const invDate = new Date(inv.createdAt || inv.date);
        if (invDate < reportFrom || invDate > reportTo) return;
        
        const stockistId = (inv.stockistId || inv.stockist?._id || '').toString();
        if (stockistId !== partyId.toString()) return;
        
        if (inv.status === 'paid' || inv.paymentStatus === 'PAID') return;
        
        const bal = Number(inv.outstandingAmount ?? inv.grandTotal ?? 0);
        if (bal <= 0) return;
        
        totalOutstanding += bal;
        
        const dueDate = inv.dueDate ? new Date(inv.dueDate) : new Date(invDate.getTime() + 30 * 24 * 60 * 60 * 1000);
        const today = new Date();
        const diffTime = today.getTime() - dueDate.getTime();
        const daysLate = Math.max(0, Math.floor(diffTime / (24 * 60 * 60 * 1000)));
        
        let bucket = 'Current';
        if (daysLate > 0) {
            totalReceivable += bal;
            if (daysLate <= 30) { bucket = '1-30'; buckets['1-30'] += bal; }
            else if (daysLate <= 45) { bucket = '31-45'; buckets['31-45'] += bal; }
            else if (daysLate <= 60) { bucket = '46-60'; buckets['46-60'] += bal; }
            else { bucket = '60+'; buckets['60+'] += bal; }
        }
        
        items.push([
            inv.invoiceNo,
            invDate.toLocaleDateString('en-GB'),
            dueDate.toLocaleDateString('en-GB'),
            `${daysLate} Days`,
            `Rs. ${inv.grandTotal.toFixed(2)}`,
            `Rs. ${bal.toFixed(2)}`
        ]);
    });
    
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.text("EMYOMS - COLLECTION & AGING DOSSIER", 15, 20);
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.text(`Party: ${stockist.companyName || stockist.name}`, 15, 28);
        doc.text(`GSTIN: ${stockist.gstNo || 'URD'} | DL No: ${stockist.dlNo || 'N/A'}`, 15, 34);
        doc.text(`Period Bounds: ${currentAgingFromDate || 'start'} to ${currentAgingToDate || 'end'}`, 15, 40);
        
        doc.line(15, 44, 195, 44);
        
        doc.setFont("helvetica", "bold");
        doc.text("Dossier Summary", 15, 52);
        
        doc.setFont("helvetica", "normal");
        doc.text(`Total Balance Outstanding: Rs. ${totalOutstanding.toFixed(2)}`, 15, 58);
        doc.text(`Total Receivable Overdue: Rs. ${totalReceivable.toFixed(2)}`, 15, 64);
        
        doc.text(`1-30 Days Overdue: Rs. ${buckets['1-30'].toFixed(2)}`, 15, 72);
        doc.text(`31-45 Days Overdue: Rs. ${buckets['31-45'].toFixed(2)}`, 15, 78);
        doc.text(`46-60 Days Overdue: Rs. ${buckets['46-60'].toFixed(2)}`, 15, 84);
        doc.text(`Over 60 Days Overdue: Rs. ${buckets['60+'].toFixed(2)}`, 15, 90);
        
        doc.line(15, 94, 195, 94);
        
        doc.setFont("helvetica", "bold");
        doc.text("Ledger Schedule", 15, 102);
        
        doc.autoTable({
            startY: 108,
            head: [['Invoice No', 'Inv Date', 'Due Date', 'Days Late', 'Total Value', 'Balance Due']],
            body: items,
            theme: 'striped',
            headStyles: { fillColor: [15, 23, 42] }
        });
        
        doc.save(`Aging_Ledger_${stockist.name.replace(/\s+/g, '_')}.pdf`);
    } catch(e) {
        alert("Failed to export PDF.");
    }
}

function exportReportExcel() {
    if(!currentReportData || currentReportData.length === 0) return alert("No data to export.");
    downloadExcel(currentReportData, currentReportName);
}

function exportReportPDF() {
    if(!currentReportData || currentReportData.length === 0) return alert("No data to export.");
    
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('landscape');
        
        doc.setFontSize(14);
        doc.text(`Report: ${currentReportName.replace(/_/g, ' ')}`, 14, 15);
        
        const fromDateStr = document.getElementById('report-from-date').value;
        const toDateStr = document.getElementById('report-to-date').value;
        doc.setFontSize(10);
        doc.text(`Period: ${fromDateStr} to ${toDateStr}`, 14, 22);
        
        const headers = Object.keys(currentReportData[0]);
        const body = currentReportData.map(row => headers.map(h => row[h]));
        
        doc.autoTable({
            head: [headers],
            body: body,
            startY: 28,
            theme: 'grid',
            styles: { fontSize: 8 },
            headStyles: { fillColor: [16, 185, 129] }
        });
        
        doc.save(`${currentReportName}.pdf`);
    } catch(e) {
        console.error(e);
        alert("Failed to export PDF. Ensure jsPDF library is loaded.");
    }
}

async function exportAllReports() {
    alert("🚀 Generating Consolidated Intelligence Pack... Please wait.");
    try {
        const res = await fetch(`${API_BASE}/admin/reports/full-audit`);
        const data = await res.json();
        
        const wb = XLSX.utils.book_new();
        const reports = [
            { id: 'sales-summary', name: 'Sales Summary' },
            { id: 'party-sales', name: 'Party Analytics' },
            { id: 'product-sales', name: 'Product Movement' },
            { id: 'p-and-l', name: 'P&L Statement' },
            { id: 'stock-summary', name: 'Inventory Val' },
            { id: 'outstanding-summary', name: 'Outstandings' },
            { id: 'exp-txn', name: 'Expenses' }
        ];

        reports.forEach(r => {
            const { reportData } = getReportDataByType(r.id, data);
            if (reportData && reportData.length > 0) {
                const ws = XLSX.utils.json_to_sheet(reportData);
                XLSX.utils.book_append_sheet(wb, ws, r.name);
            }
        });

        XLSX.writeFile(wb, `Emyris_Consolidated_Pack_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (e) {
        console.error("Export all failed:", e);
        alert("Consolidated export failed. Check console.");
    }
}

function downloadExcel(data, fileName, sheetName = "Report") {
    if (!data || data.length === 0) return alert("No data to export.");
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, `${fileName}.xlsx`);
}



// --- EXPENSE MODULE ---

// Live Expense Category Cache - populated from DB on demand
let EXPENSE_CATEGORIES_CACHE = { Direct: [], Indirect: [] };

async function fetchExpenseCategories() {
    try {
        const res = await fetch('/api/expense-categories');
        const data = await res.json();
        EXPENSE_CATEGORIES_CACHE = { Direct: [], Indirect: [] };
        data.forEach(cat => {
            const type = cat.expenseType || 'Indirect';
            if (!EXPENSE_CATEGORIES_CACHE[type]) EXPENSE_CATEGORIES_CACHE[type] = [];
            EXPENSE_CATEGORIES_CACHE[type].push(cat.name);
        });
        // Populate JV expense-head datalist for autocomplete
        const headList = document.getElementById('expense-head-list');
        if (headList) {
            headList.innerHTML = data.map(c => '<option value="' + c.name + '"></option>').join('');
        }
    } catch(e) {
        console.warn('Could not fetch expense categories from DB:', e);
    }
}

async function loadExpenseCategoryOptions() {
    const catSelect = document.getElementById('exp-category');
    catSelect.innerHTML = '<option value="">Loading...</option>';

    // Fetch fresh categories from database
    await fetchExpenseCategories();

    // Show ALL categories (Direct and Indirect)
    const direct = EXPENSE_CATEGORIES_CACHE.Direct || [];
    const indirect = EXPENSE_CATEGORIES_CACHE.Indirect || [];
    
    catSelect.innerHTML = '<option value="">-- Select Head --</option>';
    
    if (direct.length > 0) {
        catSelect.innerHTML += '<optgroup label="DIRECT EXPENSES">';
        direct.forEach(c => catSelect.innerHTML += `<option value="${c}">${c}</option>`);
        catSelect.innerHTML += '</optgroup>';
    }
    
    if (indirect.length > 0) {
        catSelect.innerHTML += '<optgroup label="INDIRECT EXPENSES">';
        indirect.forEach(c => catSelect.innerHTML += `<option value="${c}">${c}</option>`);
        catSelect.innerHTML += '</optgroup>';
    }

    if (direct.length === 0 && indirect.length === 0) {
        catSelect.innerHTML += '<option disabled>No categories found. Add in Global Masters.</option>';
    }
}

async function openExpenseModal() {
    const modal = document.getElementById('expenseModal');
    modal.classList.remove('hidden');

    // Reset fields
    document.getElementById('expenseForm').reset();
    document.getElementById('exp-date').value = new Date().toISOString().split('T')[0];
    
    // Load all categories into the single dropdown
    await loadExpenseCategoryOptions();

    // Auto-fetch next Expense Reference Number
    try {
        const res = await fetch(`${API_BASE}/admin/next-doc-no?type=expense`);
        if (res.ok) {
            const { docNo } = await res.json();
            document.getElementById('exp-ref').value = docNo;
        }
    } catch(e) {
        document.getElementById('exp-ref').value = 'EXP-' + Date.now();
    }
}

async function saveExpense(e) {
    e.preventDefault();
    const btn = e.submitter;
    const originalText = btn.innerHTML;

    const data = {
        categoryName: document.getElementById('exp-category').value,
        title: document.getElementById('exp-title').value,
        date: document.getElementById('exp-date').value,
        amount: Number(document.getElementById('exp-amount').value),
        paymentMethod: document.getElementById('exp-method').value,
        refNo: document.getElementById('exp-ref').value,
        notes: document.getElementById('exp-notes').value
    };

    if (!data.categoryName) return alert('Please select an Expense Head.');
    if (data.amount <= 0) return alert('Amount must be greater than zero.');

    try {
        btn.disabled = true;
        btn.innerHTML = '⏳ POSTING...';

        const res = await fetch(`${API_BASE}/admin/expenses`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await res.json();

        if (result.success) {
            alert(`✅ Expense posted successfully!`);
            document.getElementById('expenseModal').classList.add('hidden');
            loadExpenses();
            document.getElementById('expenseForm').reset();
        } else {
            alert('Error: ' + (result.error || 'Unknown error'));
        }
    } catch (err) {
        console.error(err);
        alert('Server error. Please try again.');
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

async function generateSampleMatchedPDF({ 
    doc, title, subTitle, docNo, docTypeLabel, date, party, items, additionalCharges = [], grandTotal, terms, showBank, extraFields, filename 
}) {
    // --- 1. SETTINGS & COLORS ---
    const pageH = 297; const pageW = 210;
    const themeHex = (companyProfile && companyProfile.themeColor) || "#6366f1";
    
    // Helper to convert Hex to RGB
    const hexToRgb = (hex) => {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return [r, g, b];
    };
    const themeRgb = hexToRgb(themeHex);

    doc.setDrawColor(themeRgb[0], themeRgb[1], themeRgb[2]); 
    doc.setLineWidth(0.5);
    doc.rect(10, 10, 190, 277); // Outer Main Theme Border

    // --- 2. HEADER SECTION (LOGO + COMPANY) ---
    let headerY = 15;
    if (companyProfile && companyProfile.logoImage) {
        try { 
            const imgData = companyProfile.logoImage;
            const format = imgData.toLowerCase().includes('png') ? 'PNG' : 'JPEG';
            // Wider logo as requested (40x22), moved slightly left
            doc.addImage(imgData, format, 12, headerY - 3, 40, 22);
        } catch(e) { console.warn("Logo add failed", e); }
    }

    // Company Name & Details - Shifted Right to accommodate wider logo
    const headerX = 58; 
    doc.setFont("helvetica", "bold"); doc.setFontSize(18); doc.setTextColor(themeRgb[0], themeRgb[1], themeRgb[2]);
    doc.text((companyProfile && companyProfile.name) || "EMYRIS BIOLIFESCIENCES", headerX, headerY + 5);
    
    doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(60);
    const coAddr = (companyProfile && companyProfile.address) || "Office Address Loading...";
    const addrLines = doc.splitTextToSize(coAddr, 140);
    doc.text(addrLines, headerX, headerY + 10);
    
    let infoY = headerY + 10 + (addrLines.length * 4);
    doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(0);
    doc.text(`GSTIN: ${(companyProfile && companyProfile.gstNo) || 'N/A'} | DL No: ${(companyProfile && companyProfile.dlNo) || 'N/A'}`, headerX, infoY);
    doc.setFont("helvetica", "normal");
    doc.text(`Contact: ${(companyProfile && companyProfile.phones?.[0]) || 'N/A'} | Email: ${(companyProfile && companyProfile.emails?.[0]) || 'N/A'}`, headerX, infoY + 4);

    // TAX INVOICE LABEL - Clean Bold Design (No Box)
    doc.setTextColor(themeRgb[0], themeRgb[1], themeRgb[2]);
    const isPurchase = title.includes("PURCHASE");
    doc.setFontSize(isPurchase ? 9 : 12); doc.setFont("helvetica", "bold");
    doc.text(title.toUpperCase(), pageW - 10, infoY - 1, { align: 'right' });
    doc.setTextColor(0);

    // Right Top Label below border line - Perfectly aligned with the box edge
    doc.setFontSize(7); doc.setFont("helvetica", "normal");
    doc.text("Original Inv. for Buyer", pageW - 10, 14, { align: 'right' });

    let nextY = infoY + 8;
    doc.setDrawColor(themeRgb[0], themeRgb[1], themeRgb[2]);
    doc.line(10, nextY, 200, nextY); // Header Separator

    // --- 3. METADATA BOX (PARTY & INVOICE DETAILS) ---
    let boxY = nextY + 5;
    let boxH = 35;
    doc.setDrawColor(themeRgb[0], themeRgb[1], themeRgb[2]); doc.setLineWidth(0.2);
    doc.rect(10, boxY, 190, boxH); // Metadata Outer Box (Standardized 10-200)
    doc.line(120, boxY, 120, boxY + boxH); // Vertical Split

    // LEFT: PARTY INFO
    doc.setFontSize(8); doc.setFont("helvetica", "bold"); doc.setTextColor(themeRgb[0], themeRgb[1], themeRgb[2]);
    doc.text(isPurchase ? "BILL FROM (SUPPLIER DETAILS):" : "BILL TO (PARTY DETAILS):", 15, boxY + 5);
    doc.setFontSize(10); doc.setTextColor(0);
    doc.text(party.name || 'N/A', 15, boxY + 10);
    doc.setFontSize(7.5); doc.setFont("helvetica", "normal");
    const pAddrLines = doc.splitTextToSize(party.address || 'N/A', 100);
    doc.text(pAddrLines, 15, boxY + 14);
    
    let partySubY = boxY + 14 + (pAddrLines.length * 3.5);
    doc.setFont("helvetica", "bold"); doc.setFontSize(7);
    doc.text(`GSTIN: ${party.gst || 'N/A'} | DL: ${party.dl || 'N/A'}`, 15, partySubY + 2);

    // RIGHT: INVOICE INFO
    doc.setFontSize(8); doc.setFont("helvetica", "bold"); doc.setTextColor(themeRgb[0], themeRgb[1], themeRgb[2]);
    doc.text("DOCUMENT DETAILS:", 123, boxY + 5);
    doc.setFontSize(8); doc.setTextColor(0); doc.setFont("helvetica", "normal");
    doc.text(`${docTypeLabel}:`, 123, boxY + 10); doc.setFont("helvetica", "bold"); doc.text(docNo, 155, boxY + 10);
    doc.setFont("helvetica", "normal"); doc.text(`Date:`, 123, boxY + 15); doc.setFont("helvetica", "bold"); doc.text(date, 155, boxY + 15);
    
    extraFields.forEach((f, i) => {
        doc.setFont("helvetica", "normal"); doc.text(`${f.label}:`, 123, boxY + 20 + (i * 5));
        doc.setFont("helvetica", "bold"); doc.text(f.value || '-', 155, boxY + 20 + (i * 5));
    });

    // --- 4. ITEMS TABLE ---
    const tableHead = isPurchase 
        ? [['Sn', 'HSN', 'Product Description', 'Batch', 'Exp', 'MRP', 'Purc. Rate', 'Qty', 'Free', 'GST%', 'Amount']]
        : [['Sn', 'HSN', 'Product Description', 'Batch', 'Exp', 'MRP', 'PTR', 'PTS', 'Qty', 'Free', 'GST%', 'Amount']];

    doc.autoTable({
        startY: boxY + boxH + 5,
        head: tableHead,
        body: [
            ...items.map((it, idx) => {
                const mrp = Number(it.mrp || 0);
                const price = Number(it.price || it.pts || 0);
                const ptr = Number(it.ptr || 0);
                const pts = Number(it.pts || 0);
                const qty = Number(it.qty || 0);
                const bonus = Number(it.bonusQty || 0);
                const expStr = it.expDate || it.expiry || it.exp || '-';
                const mfgName = it.manufacturer || (it.product && it.product.manufacturer) || 'EMYRIS';
                
                if (isPurchase) {
                    return [
                        idx + 1, it.hsn || '-', 
                        { content: `${it.name}\n[Mfg: ${mfgName}]`, styles: { fontStyle: 'bold' } }, 
                        it.batch || '-', expStr, 
                        mrp.toFixed(2), price.toFixed(2), 
                        qty, bonus, Math.floor(it.gstPercent || 0) + '%', 
                        (qty * price).toFixed(2)
                    ];
                } else {
                    return [
                        idx + 1, it.hsn || '-', 
                        { content: `${it.name}\n[Mfg: ${mfgName}]`, styles: { fontStyle: 'bold' } }, 
                        it.batch || '-', expStr, 
                        mrp.toFixed(2), ptr.toFixed(2), pts.toFixed(2), 
                        qty, bonus, Math.floor(it.gstPercent || 0) + '%', 
                        (qty * pts).toFixed(2)
                    ];
                }
            }),
            ...additionalCharges.map((c, idx) => {
                const baseAmt = Number(c.amount || 0);
                if (isPurchase) {
                    return [
                        '#', c.hsn || '-', 
                        { content: `CHARGE: ${c.name}`, styles: { fontStyle: 'italic', textColor: [100, 100, 100] } },
                        '-', '-', '-', baseAmt.toFixed(2), 
                        '1', '0', Math.floor(c.gstPct || 0) + '%', c.total.toFixed(2)
                    ];
                } else {
                    return [
                        '#', c.hsn || '-', 
                        { content: `CHARGE: ${c.name}`, styles: { fontStyle: 'italic', textColor: [100, 100, 100] } },
                        '-', '-', '-', '-', baseAmt.toFixed(2), '1', '0', Math.floor(c.gstPct || 0) + '%', c.total.toFixed(2)
                    ];
                }
            })
        ],
        theme: 'grid',
        headStyles: { fillColor: themeRgb, textColor: 255, fontStyle: 'bold', fontSize: 7, halign: 'center' },
        styles: { fontSize: 7, cellPadding: 2, textColor: 0, lineWidth: 0.1, lineColor: themeRgb },
        columnStyles: isPurchase ? {
            0: { cellWidth: 8, halign: 'center' },
            2: { cellWidth: 'auto' },
            5: { halign: 'right' },
            6: { halign: 'right' },
            9: { halign: 'right' },
            10: { halign: 'right', fontStyle: 'bold' }
        } : {
            0: { cellWidth: 8, halign: 'center' },
            2: { cellWidth: 'auto' },
            5: { halign: 'right' },
            10: { halign: 'right' },
            11: { halign: 'right', fontStyle: 'bold' }
        },
        margin: { left: 10, right: 10 }
    });

    let tableFinalY = doc.lastAutoTable.finalY;

    // --- 5. TAX SUMMARY & TOTALS ---
    const summaryY = tableFinalY + 5;
    if (summaryY > 230) doc.addPage(); 
    
    const taxMap = {};
    let totalTaxable = 0; let totalGST = 0;
    items.forEach(it => {
        const rate = parseFloat(it.gstPercent) || 0;
        const price = Number(it.price || it.pts || 0);
        const qty = Number(it.qty || 0);
        const taxable = qty * price;
        const gst = (taxable * rate) / 100;
        if (!taxMap[rate]) taxMap[rate] = { taxable: 0, tax: 0 };
        taxMap[rate].taxable += taxable;
        taxMap[rate].tax += gst;
        totalTaxable += taxable; totalGST += gst;
    });

    // Add Additional Charges to Tax Map
    additionalCharges.forEach(c => {
        const rate = parseFloat(c.gstPct) || 0;
        const taxable = Number(c.amount || 0);
        const gst = Number(c.gstAmount || 0);
        if (!taxMap[rate]) taxMap[rate] = { taxable: 0, tax: 0 };
        taxMap[rate].taxable += taxable;
        taxMap[rate].tax += gst;
        totalTaxable += taxable; totalGST += gst;
    });

    const supplyField = extraFields.find(f => f.label === 'Place of Supply');
    const supplyState = (supplyField ? supplyField.value : '').toLowerCase();
    const isIntra = (companyProfile.gstNo?.substring(0,2) === party.gst?.substring(0,2)) || supplyState.includes('telangana');
    const isInter = !isIntra;
    const taxHeader = isInter ? [['GST%', 'Taxable', 'IGST', 'Total Tax']] : [['GST%', 'Taxable', 'CGST', 'SGST', 'Total Tax']];
    let taxBody = [];
    Object.keys(taxMap).sort((a,b)=>a-b).forEach(r => {
        const rate = parseFloat(r); const d = taxMap[r];
        const label = Math.floor(rate) + '%';
        if (isInter) { taxBody.push([label, d.taxable.toFixed(2), d.tax.toFixed(2), d.tax.toFixed(2)]); }
        else { taxBody.push([label, d.taxable.toFixed(2), (d.tax/2).toFixed(2), (d.tax/2).toFixed(2), d.tax.toFixed(2)]); }
    });

    doc.setFontSize(7.5); doc.setFont("helvetica", "bold"); doc.text("GST TAX SUMMARY", 12, summaryY);
    doc.autoTable({
        startY: summaryY + 2,
        head: taxHeader,
        body: taxBody,
        theme: 'grid',
        headStyles: { fillColor: [245, 245, 245], textColor: 0, fontSize: 6.5, halign: 'center' },
        styles: { fontSize: 6.5, halign: 'right', cellPadding: 1.5, lineColor: themeRgb },
        margin: { left: 10 },
        tableWidth: isInter ? 65 : 85
    });

    // Totals Block
    const tX = 145;
    doc.setFontSize(8.5); doc.setFont("helvetica", "normal");
    doc.text("Total Taxable Amt:", tX, summaryY + 5); doc.text(`Rs. ${totalTaxable.toFixed(2)}`, 198, summaryY + 5, { align: 'right' });
    doc.text("Total GST Amt:", tX, summaryY + 10); doc.text(`Rs. ${totalGST.toFixed(2)}`, 198, summaryY + 10, { align: 'right' });
    const roundOff = (grandTotal - (totalTaxable + totalGST)).toFixed(2);
    doc.text("Round Off Adj:", tX, summaryY + 15); doc.text(`Rs. ${roundOff}`, 198, summaryY + 15, { align: 'right' });
    doc.line(tX - 2, summaryY + 18, 200, summaryY + 18);
    doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.setTextColor(themeRgb[0], themeRgb[1], themeRgb[2]);
    doc.text("GRAND TOTAL:", tX, summaryY + 24); doc.text(`Rs. ${grandTotal.toLocaleString('en-IN', {minimumFractionDigits:2})}`, 198, summaryY + 24, { align: 'right' });
    doc.setTextColor(0);

    doc.setFontSize(7.5); doc.setFont("helvetica", "italic");
    doc.text(`Amount in Words: ${numberToWords(grandTotal)}`, 12, doc.lastAutoTable.finalY + 10);

    // --- 6. FOOTER (BANK, TERMS, SIGN, QR) ---
    const footerY = 250;
    doc.setDrawColor(themeRgb[0], themeRgb[1], themeRgb[2]); doc.line(10, footerY - 2, 200, footerY - 2);
    
    // Bank Details
    doc.setFontSize(7.5); doc.setFont("helvetica", "bold"); doc.text("BANK DETAILS:", 12, footerY + 2);
    doc.setFont("helvetica", "normal"); doc.setFontSize(6.5);
    const bankLines = (companyProfile.bankDetails || "").split('\n');
    let bankLastY = footerY + 2;
    bankLines.forEach((l, i) => {
        bankLastY = footerY + 6 + (i * 3);
        doc.text(l.trim(), 12, bankLastY);
    });

    // QR Code Generation
    let upiLink = "";
    if (companyProfile.upiId) {
        // Ensure grandTotal is formatted to 2 decimal places for UPI
        const am = Number(grandTotal).toFixed(2);
        upiLink = `upi://pay?pa=${companyProfile.upiId}&pn=${encodeURIComponent(companyProfile.name)}&am=${am}&cu=INR`;
    } else if (companyProfile.bankAccountNo && companyProfile.bankIfsc) {
        const am = Number(grandTotal).toFixed(2);
        upiLink = `upi://pay?pa=${companyProfile.bankAccountNo}@${companyProfile.bankIfsc}.ifsc.npci&pn=${encodeURIComponent(companyProfile.name)}&am=${am}&cu=INR`;
    }

    if (upiLink && window.QRCode) {
        try { 
            // Use local QRCode library for faster, offline-capable generation
            const qrDataUrl = await QRCode.toDataURL(upiLink, { width: 150, margin: 1 });
            doc.addImage(qrDataUrl, 'PNG', 95, footerY + 5, 22, 22); // Two lines below (moved down from -5)
            doc.setFontSize(6); doc.text("Scan to Pay", 106, footerY + 29, { align: 'center' });
        } catch(e){
            console.warn("Local QR failed. Fallback to API/Image.", e);
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(upiLink)}`;
            try { 
                doc.addImage(qrUrl, 'PNG', 95, footerY, 20, 20); 
                doc.setFontSize(6); doc.text("Scan to Pay", 105, footerY + 22, { align: 'center' });
            } catch(e2){
                if (companyProfile.qrImage) {
                    try { 
                        const fmt = companyProfile.qrImage.includes('jpeg') ? 'JPEG' : 'PNG';
                        doc.addImage(companyProfile.qrImage, fmt, 95, footerY, 20, 20); 
                        doc.setFontSize(6); doc.text("Scan to Pay", 105, footerY + 22, { align: 'center' });
                    } catch(e3){}
                }
            }
        }
    } else if (companyProfile.qrImage) {
        try { 
            const fmt = companyProfile.qrImage.includes('jpeg') ? 'JPEG' : 'PNG';
            doc.addImage(companyProfile.qrImage, fmt, 95, footerY + 5, 22, 22); 
            doc.setFontSize(6); doc.text("Scan to Pay", 106, footerY + 29, { align: 'center' });
        } catch(e){}
    }

    // Terms & Conditions - Shifted UP to prevent bottom border overflow
    const termsY = Math.max(footerY + 22, bankLastY + 8); 
    doc.setFontSize(7); doc.setFont("helvetica", "bold"); doc.text("TERMS & CONDITIONS:", 12, termsY);
    doc.setFont("helvetica", "normal"); doc.setFontSize(6);
    const termsText = terms || companyProfile.invoiceTerms || "1. Goods once sold will not be taken back.\n2. Interest @18% p.a. will be charged for delayed payment.";
    const termsLines = doc.splitTextToSize(termsText, 80);
    doc.text(termsLines, 12, termsY + 4);

    // Signatory
    doc.setFont("helvetica", "bold"); doc.setFontSize(8);
    doc.text(`For ${(companyProfile.name) || "EMYRIS BIOLIFESCIENCES"}`, 198, footerY + 2, { align: 'right' });
    if (companyProfile.signatureImage) {
        try { 
            const sigData = companyProfile.signatureImage;
            const fmt = sigData.toLowerCase().includes('png') ? 'PNG' : 'JPEG';
            doc.addImage(sigData, fmt, 160, footerY + 4, 35, 12); // Slightly larger signature
        } catch(e){}
    }
    doc.text("Authorised Signatory", 198, footerY + 25, { align: 'right' });

    if (filename) doc.save(filename);
    return doc;
}
// --- KEYBOARD NAVIGATION FOR SEARCH ---
let currentSearchFocus = -1;

function handleSearchKey(e, resultsId) {
    const resultsDiv = document.getElementById(resultsId);
    if (!resultsDiv || resultsDiv.style.display === 'none') return;

    const rows = resultsDiv.querySelectorAll('tbody tr');
    if (rows.length === 0) return;

    if (e.key === 'ArrowDown') {
        e.preventDefault();
        currentSearchFocus++;
        addActive(rows);
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        currentSearchFocus--;
        addActive(rows);
    } else if (e.key === 'Enter') {
        e.preventDefault();
        if (currentSearchFocus > -1) {
            if (rows[currentSearchFocus]) rows[currentSearchFocus].click();
        }
    } else if (e.key === 'Escape') {
        resultsDiv.style.display = 'none';
    }
}

function addActive(rows) {
    if (!rows) return false;
    removeActive(rows);
    if (currentSearchFocus >= rows.length) currentSearchFocus = 0;
    if (currentSearchFocus < 0) currentSearchFocus = rows.length - 1;
    rows[currentSearchFocus].classList.add('active');
    rows[currentSearchFocus].scrollIntoView({ block: 'nearest' });
}

function removeActive(rows) {
    rows.forEach(r => r.classList.remove('active'));
}

// --- PRODUCT SEARCH ENGINE (AUTOCOMPLETE) ---
function handleProductSearch(input, context) {
    currentSearchFocus = -1;
    const query = input.value.toLowerCase().trim();
    const resultsDiv = document.getElementById(
        context.startsWith('RETURN-') ? `return-search-results-${context.replace('RETURN-', '')}` :
        context === 'SALE' ? 'sale-search-results' : 
        context === 'PURCHASE' ? 'pur-search-results' : 
        context.startsWith('SALE-GRID') ? 'sale-grid-search-results' :
        context.startsWith('PUR-GRID') ? 'pur-grid-search-results' : 'note-search-results'
    );
    
    if (resultsDiv && (context === 'SALE' || context === 'PURCHASE')) {
        const rect = input.getBoundingClientRect();
        resultsDiv.style.position = 'fixed';
        resultsDiv.style.top = (rect.bottom + 5) + 'px';
        resultsDiv.style.left = rect.left + 'px';
        resultsDiv.style.width = context === 'SALE' ? '700px' : '650px';
        resultsDiv.style.display = 'block';
        resultsDiv.style.zIndex = '99999';
    }
    
    if (query.length < 0) { // Changed to allow 0 length for focus results
        resultsDiv.style.display = 'none';
        return;
    }

    let matches = [];
    if (query.length === 0) {
        matches = allProducts.slice(0, 15);
    } else {
        matches = allProducts.filter(p => 
            p.name.toLowerCase().includes(query) || 
            (p.hsn && p.hsn.toLowerCase().includes(query)) ||
            (p.group && p.group.toLowerCase().includes(query)) ||
            (p.category && p.category.toLowerCase().includes(query))
        ).slice(0, 15);
    }

    if (matches.length === 0 && query.length > 0) {
        resultsDiv.innerHTML = `<div style="padding:15px; text-align:center; color:var(--text-muted); font-size:0.8rem;">No matches found for "${query}"</div>`;
        resultsDiv.style.display = 'block';
        return;
    } else if (matches.length === 0 && query.length === 0) {
        resultsDiv.style.display = 'none';
        return;
    }

    let html = `<div class="search-results-ribbon">
        <span>PRODUCT SEARCH RESULTS</span>
        <span>${matches.length} MATCHES</span>
    </div>
    <table>
        <thead>
            <tr>
                <th>Product Name</th>
                <th>Packing</th>
                <th>Stock</th>
                <th>MRP</th>
                <th>PTS</th>
            </tr>
        </thead>
        <tbody>`;

    matches.forEach(p => {
        const stock = p.qtyAvailable || 0;
        const stockClass = stock > 50 ? 'stock-ok' : (stock > 0 ? 'stock-low' : 'stock-out');
        const stockLabel = stock > 0 ? stock : 'OUT';

        html += `<tr onmousedown="event.preventDefault(); selectProduct('${p._id || p.id}', '${context}')" style="white-space: nowrap; cursor: pointer;">
            <td style="min-width: 200px;">
                <div style="font-weight:700; color:#fff;">${p.name}</div>
                <div style="font-size:0.65rem; color:var(--text-muted);">${p.hsn || '-'} | ${p.group || 'GENERAL'}</div>
            </td>
            <td>${p.packing || '-'}</td>
            <td><span class="stock-badge ${stockClass}">${stockLabel}</span></td>
            <td>₹${p.mrp}</td>
            <td style="color:var(--accent); font-weight:700;">₹${p.pts}</td>
        </tr>`;
    });

    html += `</tbody></table>`;
    resultsDiv.innerHTML = html;
    resultsDiv.style.display = 'block';
}

function selectProduct(id, context) {
    const p = allProducts.find(x => x._id == id);
    if (!p) return;

    if (context === 'SALE') {
        document.getElementById('sale-prod-search').value = p.name;
        document.getElementById('sale-prod-select').value = id;
        document.getElementById('sale-search-results').style.display = 'none';
        updateSaleProductMeta(id);
    } else if (context === 'PURCHASE') {
        document.getElementById('pur-prod-search').value = p.name;
        document.getElementById('pur-prod-select').value = id;
        document.getElementById('pur-search-results').style.display = 'none';
        updateProductEntryMeta(id);
    } else if (context === 'NOTE') {
        document.getElementById('note-prod-search').value = p.name;
        document.getElementById('note-product').value = id;
        document.getElementById('note-search-results').style.display = 'none';
        updateNoteBatches(id);
    } else if (context.startsWith('RETURN-')) {
        const rowId = context.replace('RETURN-', '');
        document.getElementById(`return-prod-search-${rowId}`).value = p.name;
        document.getElementById(`return-prod-select-${rowId}`).value = id;
        document.getElementById(`return-search-results-${rowId}`).style.display = 'none';
        updateReturnRowData(rowId, id);
    }
}

function handlePartySearch(input, context) {
    currentSearchFocus = -1;
    const query = input.value.toLowerCase().trim();
    const resultsDiv = document.getElementById(
        context === 'SALE' ? 'sale-party-search-results' : 
        context === 'PURCHASE' ? 'pur-party-search-results' : 'return-party-search-results'
    );
    
    if (resultsDiv && (context === 'SALE' || context === 'PURCHASE')) {
        const rect = input.getBoundingClientRect();
        resultsDiv.style.position = 'fixed';
        resultsDiv.style.top = (rect.bottom + 5) + 'px';
        resultsDiv.style.left = rect.left + 'px';
        resultsDiv.style.width = rect.width + 'px';
        resultsDiv.style.display = 'block';
        resultsDiv.style.zIndex = '99999';
    }
    
    let matches = [];
    if (query.length === 0) {
        // Show all relevant parties for the context (Stockists for Sale/Return, Suppliers for Purchase)
        const typeFilter = (context === 'PURCHASE') ? 'SUPPLIER' : 'STOCKIST';
        matches = allStockists.filter(s => {
            const type = s.partyType || 'STOCKIST';
            return type === typeFilter;
        }).slice(0, 15);
    } else {
        matches = allStockists.filter(s => {
            const nameMatch = s.name.toLowerCase().includes(query);
            const cityMatch = (s.city || '').toLowerCase().includes(query);
            const typeFilter = (context === 'PURCHASE') ? 'SUPPLIER' : 'STOCKIST';
            const typeMatch = (s.partyType || 'STOCKIST') === typeFilter;
            return (nameMatch || cityMatch) && typeMatch;
        }).slice(0, 15);
    }

    if (!matches || matches.length === 0) {
        if (query.length > 0) {
            resultsDiv.innerHTML = `<div style="padding:10px; text-align:center; color:var(--text-muted); font-size:0.75rem;">No parties found.</div>`;
            resultsDiv.style.display = 'block';
        } else {
            resultsDiv.style.display = 'none';
        }
        return;
    }

    let html = `<div class="search-results-ribbon">
        <span>PARTY / STOCKIST SEARCH</span>
        <span>${matches.length} MATCHES</span>
    </div>
    <table>
        <thead>
            <tr>
                <th>Party Name</th>
                <th>City</th>
                <th>Outstanding</th>
            </tr>
        </thead>
        <tbody>`;

    matches.forEach(s => {
        html += `<tr onmousedown="event.preventDefault(); selectParty('${s._id || s.id}', '${context}')" style="cursor: pointer;">
            <td>
                <div style="font-weight:700; color:#fff;">${s.name}</div>
                <div style="font-size:0.6rem; color:var(--text-muted);">${s.gst || 'No GST'}</div>
            </td>
            <td>${s.city || '-'}</td>
            <td style="color:#f59e0b; font-weight:700;">₹${(s.outstandingBalance || 0).toLocaleString()}</td>
        </tr>`;
    });

    html += `</tbody></table>`;
    resultsDiv.innerHTML = html;
    resultsDiv.style.display = 'block';
}

function selectParty(id, context) {
    const s = allStockists.find(x => x._id == id);
    if (!s) return;

    if (context === 'SALE') {
        document.getElementById('sale-party-search').value = s.name;
        document.getElementById('sale-party').value = id;
        document.getElementById('sale-party-search-results').style.display = 'none';
        updateSalePartyContext();
    } else if (context === 'PURCHASE') {
        // Fix: use correct field ID pur-party-search (not old pur-supplier-search)
        const searchEl = document.getElementById('pur-party-search');
        const hiddenEl = document.getElementById('pur-supplier');
        if (searchEl) searchEl.value = s.name;
        if (hiddenEl) hiddenEl.value = s._id || s.id;
        document.getElementById('pur-party-search-results').style.display = 'none';
        // Show supplier details if box exists
        const box = document.getElementById('supplier-compliance-box');
        if (box) updateSupplierDetailsDisplay(s._id || s.id);
    } else if (context === 'RETURN') {
        document.getElementById('return-party-search').value = s.name;
        document.getElementById('return-party').value = id;
        const supplyEl = document.getElementById('return-supply');
        if (supplyEl) supplyEl.value = s.state || '';
        document.getElementById('return-party-search-results').style.display = 'none';
        updateNotePartyDetails(id, 'return-party-info');
    }
}

// Global click listener to close search results
document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-container')) {
        document.querySelectorAll('.search-results').forEach(el => el.style.display = 'none');
    }
});

// --- PDCN APPROVALS LOGIC ---
let allPDCNClaims = [];

async function fetchPDCNClaims() {
    try {
        const res = await fetch(`${API_BASE}/admin/pdcn/claims`);
        const data = await res.json();
        allPDCNClaims = data.map(c => ({
            ...c,
            _id: c._id || c.id,
            items: (c.items || []).map(i => ({
                ...i,
                id: i.id || i._id, // Ensure Sequelize 'id' is preserved
                billedPrice: Number(i.billedPrice || 0),
                specialPrice: Number(i.specialPrice || 0),
                qty: Number(i.qty || 0),
                gstPercent: Number(i.gstPercent || 0),
                marginPct: Number(i.marginPct || 10)
            }))
        }));
        renderPDCNClaims();
        updatePDCNBadge();
    } catch (e) { console.error("Fetch PDCN Claims failed", e); }
}

function renderPDCNClaims() {
    const tbody = document.getElementById('pdcn-claims-body');
    if (!tbody) return;

    const filter = document.getElementById('pdcn-status-filter').value;
    let filtered = allPDCNClaims;
    if (filter !== 'all') {
        filtered = allPDCNClaims.filter(c => c.status === filter);
    }

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 3rem; color: var(--text-muted);">No ${filter} claims found.</td></tr>`;
        return;
    }

    tbody.innerHTML = filtered.map(c => `
        <tr>
            <td>${new Date(c.createdAt).toLocaleDateString('en-GB')}</td>
            <td style="font-weight: 800; color: var(--accent); font-size: 0.75rem;">CL-ID-${String(c.id).padStart(4, '0')}</td>
            <td style="font-weight: 700; color: #fff;">${c.Stockist ? c.Stockist.name : 'Unknown'}</td>
            <td style="font-family: monospace; color: #fff; font-weight: 700;">${c.invoiceNo}</td>
            <td style="text-align: center;">${c.items.length}</td>
            <td style="text-align: right; font-weight: 800; color: var(--primary);">₹${parseFloat(c.totalAmount || 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
            <td style="text-align: center;">
                <span class="badge ${c.status === 'approved' ? 'badge-approved' : (c.status === 'rejected' ? 'badge-pending' : 'badge-pending')}" 
                      style="${c.status === 'rejected' ? 'background: #ef4444; color: #fff;' : ''}">
                    ${c.status.toUpperCase()}
                </span>
            </td>
            <td style="text-align: right;">
                <button class="btn btn-primary" style="padding: 6px 12px; font-size: 0.65rem;" onclick="openPDCNClaimModal('${c.id}')">REVIEW CLAIM</button>
            </td>
        </tr>
    `).join('');

}

function updatePDCNBadge() {
    const pendingCount = allPDCNClaims.filter(c => c.status === 'pending').length;
    const badge = document.getElementById('pdcn-pending-count');
    if (badge) {
        if (pendingCount > 0) {
            badge.innerText = pendingCount;
            badge.style.display = 'inline-block';
        } else {
            badge.style.display = 'none';
        }
    }
}

let currentPDCNReviewItems = [];

async function openPDCNClaimModal(id) {
    const claim = allPDCNClaims.find(c => c.id == id);
    if (!claim) return;

    window.currentPDCNReviewId = id;
    // Deep clone items for editing
    currentPDCNReviewItems = claim.items.map(i => ({
        ...i,
        marginPct: i.marginPct || 10 // Default to 10 if not set
    }));

    document.getElementById('pdcn-modal-party').innerText = claim.Stockist ? claim.Stockist.name : 'Unknown';
    document.getElementById('pdcn-modal-invoice').innerText = claim.invoiceNo;
    
    const statusEl = document.getElementById('pdcn-modal-status');
    statusEl.innerHTML = `<span class="badge ${claim.status === 'approved' ? 'badge-approved' : (claim.status === 'rejected' ? 'badge-pending' : 'badge-pending')}" 
                                style="${claim.status === 'rejected' ? 'background: #ef4444; color: #fff;' : ''}">
                            ${claim.status.toUpperCase()}
                          </span>`;

    // Store for printing
    window.currentAdminViewingPDCN = claim;

    renderPDCNReviewItems();

    document.getElementById('pdcn-admin-remarks').value = claim.adminRemarks || '';

    // Action buttons visibility
    const actionBtns = document.getElementById('pdcn-action-buttons');
    if (claim.status === 'pending') {
        actionBtns.classList.remove('hidden');
    } else {
        actionBtns.classList.add('hidden');
    }

    // SHOW MODAL
    document.getElementById('pdcnClaimModal').classList.remove('hidden');
}

function renderPDCNReviewItems() {
    const tbody = document.getElementById('pdcn-modal-items-body');
    if (!tbody) return;

    let grandTotal = 0;

    tbody.innerHTML = currentPDCNReviewItems.map((item, idx) => {
        const billed = parseFloat(item.billedPrice || 0);
        const special = parseFloat(item.specialPrice || 0);
        const qty = Number(item.qty || 0);
        const gstPct = parseFloat(item.gstPercent) || 0;
        const marginPct = parseFloat(item.marginPct) || 10;
        
        // Canonical formula:
        const unitDiffBase  = billed - special;
        const unitDiffIncl  = unitDiffBase * (1 + gstPct / 100);
        const unitMargin    = (special * marginPct) / 100;
        const finalItemPDCN = (unitDiffIncl + unitMargin) * qty;

        item.saleDiff = parseFloat((unitDiffIncl * qty).toFixed(2));
        item.stkMargin = parseFloat((unitMargin * qty).toFixed(2));
        item.finalPDCN = parseFloat(finalItemPDCN.toFixed(2));
        grandTotal += item.finalPDCN;

        return `
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.03);">
                <td style="padding: 12px; font-weight: 700; color: #fff; width: 250px; overflow: hidden; text-overflow: ellipsis;">${item.name}</td>
                <td style="padding: 12px; text-align: center; color: #fff; width: 60px;">${qty}</td>
                <td style="padding: 12px; text-align: center; color: #fff; font-size: 0.75rem; width: 60px;">${gstPct}%</td>
                <td style="padding: 12px; text-align: right; color: rgba(255,255,255,0.6); font-size: 0.75rem; width: 100px;">₹${billed.toFixed(2)}</td>
                <td style="padding: 12px; text-align: center; width: 100px;">
                    <input type="number" step="0.01" value="${special}" 
                        oninput="updateAdminPDCNItem(${idx}, 'specialPrice', this.value)"
                        style="width: 80px; background: rgba(16, 185, 129, 0.1); border: 1px solid var(--accent); color: var(--accent); font-weight: 800; text-align: right; font-size: 0.8rem; border-radius: 4px; padding: 4px;">
                </td>
                <td style="padding: 12px; text-align: center; width: 80px;">
                    <input type="number" step="0.1" value="${marginPct}" 
                        oninput="updateAdminPDCNItem(${idx}, 'marginPct', this.value)"
                        style="width: 45px; background: rgba(99, 102, 241, 0.1); border: 1px solid var(--primary); color: var(--primary); font-weight: 800; text-align: center; font-size: 0.8rem; border-radius: 4px; padding: 4px;">
                    <span style="font-size: 0.6rem; color: var(--text-muted);">%</span>
                </td>
                <td id="admin-pdcn-row-final-${idx}" style="padding: 12px; text-align: right; font-weight: 800; color: #fff; width: 120px; background: rgba(255,255,255,0.02);">₹${finalItemPDCN.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                <td style="padding: 12px; font-size: 0.65rem; color: var(--text-muted); font-style: italic;">${item.remarks || '-'}</td>
            </tr>
        `;
    }).join('');

    updatePDCNTotals(grandTotal);
}

function updatePDCNTotals(unroundedSum) {
    const subtotalEl = document.getElementById('pdcn-modal-subtotal');
    const roundoffEl = document.getElementById('pdcn-modal-roundoff');
    const grandTotalEl = document.getElementById('pdcn-modal-grand-total');

    const rounded = Math.round(unroundedSum);
    const roundOff = rounded - unroundedSum;

    if (subtotalEl) subtotalEl.innerText = `₹${unroundedSum.toLocaleString('en-IN', {minimumFractionDigits: 2})}`;
    if (roundoffEl) roundoffEl.innerText = `₹${roundOff.toFixed(2)}`;
    if (grandTotalEl) grandTotalEl.innerText = `₹${rounded.toLocaleString('en-IN', {minimumFractionDigits: 2})}`;
}

function updateAdminPDCNItem(idx, field, val) {
    // Update data source
    const newVal = parseFloat(val) || 0;
    currentPDCNReviewItems[idx][field] = newVal;
    
    // Recalculate row specifically
    const item = currentPDCNReviewItems[idx];
    const billed = parseFloat(item.billedPrice || 0);
    const special = parseFloat(item.specialPrice || 0);
    const qty = Number(item.qty || 0);
    const gstPct = parseFloat(item.gstPercent) || 0;
    const marginPct = parseFloat(item.marginPct) || 10;
    
    const unitDiffBase  = billed - special;
    const unitDiffIncl  = unitDiffBase * (1 + gstPct / 100);
    const unitMargin    = (special * marginPct) / 100;
    const finalItemPDCN = (unitDiffIncl + unitMargin) * qty;

    // Update broken-down fields for server storage
    item.saleDiff = parseFloat((unitDiffIncl * qty).toFixed(2));
    item.stkMargin = parseFloat((unitMargin * qty).toFixed(2));
    item.finalPDCN = parseFloat(finalItemPDCN.toFixed(2));

    // Update row total cell
    const rowTotalEl = document.getElementById(`admin-pdcn-row-final-${idx}`);
    if (rowTotalEl) {
        rowTotalEl.innerText = `₹${item.finalPDCN.toLocaleString('en-IN', {minimumFractionDigits: 2})}`;
    }

    // Update Grand Total
    let totalSum = 0;
    currentPDCNReviewItems.forEach(it => totalSum += (it.finalPDCN || 0));
    updatePDCNTotals(totalSum);
}

function closePDCNClaimModal() {
    document.getElementById('pdcnClaimModal').classList.add('hidden');
}

async function processPDCNClaim(action) {
    const id = window.currentPDCNReviewId;
    if (!id) return;

    const remarks = document.getElementById('pdcn-admin-remarks').value;
    if (action === 'reject' && !remarks.trim()) {
        return alert("Please provide a reason for rejection in Admin Remarks.");
    }

    if (!confirm(`Are you sure you want to ${action.toUpperCase()} this claim with the current adjustments?`)) return;

    const btnId = action === 'approve' ? 'btn-pdcn-approve' : 'btn-pdcn-reject';
    const btn = document.getElementById(btnId);
    const originalHTML = btn ? btn.innerHTML : (action === 'approve' ? "APPROVE" : "REJECT");

    if (btn) {
        btn.disabled = true;
        btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> PROCESSING...`;
        btn.style.opacity = "0.7";
    }

    try {
        const body = { remarks };
        if (action === 'approve') {
            // Safety check: Ensure no NaN values are sent
            currentPDCNReviewItems.forEach(it => {
                it.finalPDCN = Number(it.finalPDCN) || 0;
                it.specialPrice = Number(it.specialPrice) || 0;
                it.marginPct = Number(it.marginPct) || 0;
            });
            body.editedItems = currentPDCNReviewItems;
        }

        const res = await fetch(`${API_BASE}/admin/pdcn/claims/${id}/${action}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        const result = await res.json().catch(() => ({ success: false, error: "Invalid server response (not JSON)." }));
        console.log(`PDCN Action [${action}] Result:`, result);

        if (result.success) {
            alert(`✅ Claim ${action === 'approve' ? 'Approved & CN Generated' : 'Rejected'} Successfully!`);
            closePDCNClaimModal();
            fetchPDCNClaims();
        } else {
            const errMsg = result.message || result.error || result.details || "Unknown server error.";
            alert("Error: " + errMsg);
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = originalHTML;
                btn.style.opacity = "1";
            }
        }
    } catch (e) { 
        console.error("PDCN Process Error:", e);
        alert("Action Error: " + e.message); 
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = originalHTML;
            btn.style.opacity = "1";
        }
    }
}



async function downloadAdminPDCN_PDF() {
    const claim = window.currentAdminViewingPDCN;
    if (!claim) return alert("No claim data found to print.");

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Header - Admin panel can use cached company settings
    const co = window.currentCompany || {};
    
    doc.setFontSize(22);
    doc.setTextColor(99, 102, 241);
    doc.text(co.name || 'EMYRIS BIOLIFESCIENCES', 20, 25);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(co.address || '', 20, 32);
    doc.text(`GST: ${co.gstNo || ''} | DL: ${co.dlNo || ''}`, 20, 37);

    doc.setDrawColor(99, 102, 241);
    doc.line(20, 42, 190, 42);

    doc.setFontSize(16);
    doc.setTextColor(0);
    doc.text('PDCN CLAIM REVIEW REPORT', 20, 55);
    
    doc.setFontSize(10);
    doc.text(`Claim ID: CL-ID-${String(claim.id).padStart(4, '0')}`, 20, 65);
    doc.text(`Ref Invoice: ${claim.invoiceNo}`, 20, 70);
    doc.text(`Date: ${new Date(claim.createdAt).toLocaleDateString('en-GB')}`, 140, 65);
    doc.text(`Status: ${(claim.status || 'pending').toUpperCase()}`, 140, 70);

    doc.setFontSize(11);
    doc.text('Stockist Details:', 20, 85);
    doc.setFontSize(10);
    doc.text(claim.Stockist ? claim.Stockist.name : 'Unknown Stockist', 20, 92);
    doc.text(claim.Stockist ? (claim.Stockist.address || '') : '', 20, 97);

    const tableData = (claim.items || []).map(i => [
        i.name,
        i.qty,
        parseFloat(i.billedPrice || 0).toFixed(2),
        parseFloat(i.specialPrice || 0).toFixed(2),
        (parseFloat(i.billedPrice || 0) - parseFloat(i.specialPrice || 0)).toFixed(2),
        parseFloat(i.finalPDCN || 0).toFixed(2)
    ]);

    doc.autoTable({
        startY: 110,
        head: [['Product Name', 'Qty', 'Billed Rate', 'Spl Rate', 'Diff', 'Final PDCN']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [99, 102, 241], fontSize: 9 },
        bodyStyles: { fontSize: 8 },
        columnStyles: {
            0: { cellWidth: 70 },
            1: { halign: 'center' },
            2: { halign: 'right' },
            3: { halign: 'right' },
            4: { halign: 'right' },
            5: { halign: 'right', fontStyle: 'bold' }
        }
    });

    const finalY = doc.lastAutoTable.finalY + 15;
    doc.setFontSize(12);
    doc.text(`TOTAL PDCN VALUE: Rs. ${parseFloat(claim.totalAmount).toLocaleString('en-IN', {minimumFractionDigits: 2})}`, 190, finalY, { align: 'right' });

    if (claim.adminRemarks) {
        doc.setFontSize(10);
        doc.text('Admin Remarks:', 20, finalY + 10);
        doc.setFontSize(9);
        doc.setTextColor(80);
        doc.text(doc.splitTextToSize(claim.adminRemarks, 170), 20, finalY + 17);
    }

    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Generated on ${new Date().toLocaleString()} | Emyris OMS Admin Hub`, 105, 285, { align: 'center' });

    doc.save(`ADMIN_PDCN_${claim.invoiceNo}_${claim.id}.pdf`);
}

async function downloadLedgerPDF() {
    if (!currentLedgerPartyId) return;
    const s = allStockists.find(x => (x._id || x.id) == currentLedgerPartyId);
    if (!s) return alert("Party not found");

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    const co = window.companyProfile || {};
    
    doc.setFontSize(22);
    doc.setTextColor(99, 102, 241);
    doc.text(co.name || 'EMYRIS BIOLIFESCIENCES', 20, 25);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(co.address || '', 20, 32);
    doc.text(`GST: ${co.gstNo || ''} | DL: ${co.dlNo || ''}`, 20, 37);

    doc.setDrawColor(99, 102, 241);
    doc.line(20, 42, 190, 42);

    doc.setFontSize(16);
    doc.setTextColor(0);
    doc.text('STATEMENT OF ACCOUNT', 20, 55);
    
    doc.setFontSize(10);
    doc.text(`Party: ${s.name}`, 20, 65);
    doc.text(`Address: ${s.address || ''}`, 20, 70);
    doc.text(`GSTIN: ${s.gstNo || ''}`, 20, 75);
    doc.text(`Period: Up to ${new Date().toLocaleDateString('en-GB')}`, 140, 65);

    // Fetch latest ledger data to be sure
    const res = await fetch('/api/admin/parties/' + currentLedgerPartyId + '/ledger');
    const ledger = await res.json();

    let balance = 0;
    const tableData = ledger.map(entry => {
        balance += (parseFloat(entry.debit) - parseFloat(entry.credit));
        return [
            new Date(entry.date).toLocaleDateString('en-GB'),
            entry.refNo,
            entry.type,
            entry.description,
            entry.debit > 0 ? entry.debit.toFixed(2) : '',
            entry.credit > 0 ? entry.credit.toFixed(2) : '',
            `${Math.abs(balance).toFixed(2)} ${balance >= 0 ? 'Dr' : 'Cr'}`
        ];
    });

    doc.autoTable({
        startY: 85,
        head: [['Date', 'Ref No', 'Type', 'Description', 'Debit', 'Credit', 'Balance']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [99, 102, 241], fontSize: 9 },
        bodyStyles: { fontSize: 7 },
        columnStyles: {
            0: { cellWidth: 20 },
            1: { cellWidth: 25 },
            2: { cellWidth: 25 },
            4: { halign: 'right' },
            5: { halign: 'right' },
            6: { halign: 'right', fontStyle: 'bold' }
        }
    });

    const finalY = doc.lastAutoTable.finalY + 15;
    doc.setFontSize(12);
    doc.text(`CLOSING BALANCE: Rs. ${Math.abs(balance).toLocaleString('en-IN', {minimumFractionDigits: 2})} ${balance >= 0 ? 'Dr' : 'Cr'}`, 190, finalY, { align: 'right' });

    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Generated on ${new Date().toLocaleString()} | Emyris OMS`, 105, 285, { align: 'center' });

    doc.save(`LEDGER_${s.name.replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`);
}


// --- JOURNAL ENTRY (JV) MODULE ---

function openJvModal() {
    document.getElementById('jv-date').value = new Date().toISOString().split('T')[0];
    document.getElementById('jv-narration').value = '';
    document.getElementById('jv-lines-container').innerHTML = '';
    addJvLine();
    addJvLine();
    calculateJvTotals();
    document.getElementById('jvModal').classList.remove('hidden');
}

function addJvLine() {
    const container = document.getElementById('jv-lines-container');
    const row = document.createElement('div');
    row.style.display = 'grid';
    row.style.gridTemplateColumns = '80px 150px 250px 1fr 1fr 50px';
    row.style.gap = '0.5rem';
    row.style.marginBottom = '0.5rem';
    
    // Entity options based on system
    let entityOptions = `<option value="">-- Name --</option>`;
    
    row.innerHTML = `
        <select class="jv-type" onchange="calculateJvTotals()" style="padding:8px; background:rgba(0,0,0,0.4); border:1px solid var(--glass-border); border-radius:8px; color:#fff;">
            <option value="DR">DR</option>
            <option value="CR">CR</option>
        </select>
        <select class="jv-ledger" onchange="updateJvEntityOptions(this)" style="padding:8px; background:rgba(0,0,0,0.4); border:1px solid var(--glass-border); border-radius:8px; color:#fff;">
            <option value="Stockist">Stockist</option>
            <option value="ExpenseCategory">Expense Header</option>
            <option value="Bank">Bank Account</option>
            <option value="SystemLedger">System Ledger</option>
        </select>
        <div style="display:flex; gap: 4px; width:100%;">
            <input type="hidden" class="jv-entity-id">
            <input type="text" class="jv-entity-name" required list="stockist-list" placeholder="Select Name..." oninput="syncJvId(this)" style="padding:8px; background:rgba(0,0,0,0.4); border:1px solid var(--glass-border); border-radius:8px; color:#fff; width:100%;">
        </div>
        <input type="text" class="jv-notes" placeholder="Optional notes" style="padding:8px; background:rgba(0,0,0,0.4); border:1px solid var(--glass-border); border-radius:8px; color:#fff;">
        <input type="number" class="jv-amount" required step="0.01" min="0.01" value="0.00" oninput="calculateJvTotals()" style="padding:8px; background:rgba(0,0,0,0.4); border:1px solid var(--glass-border); border-radius:8px; color:#fff; font-weight:bold; text-align:right;">
        <button type="button" onclick="removeJvLine(this)" class="btn btn-ghost" style="color:#ef4444; padding:8px;"><i class="fas fa-trash"></i></button>
    `;
    container.appendChild(row);
}

function updateJvEntityOptions(selectElem) {
    // In a full implementation, this would populate a dropdown or autocomplete for the entityName field.
    // For now, it's a free-text input field so the accountant can type the name directly.
}

function removeJvLine(btn) {
    const container = document.getElementById('jv-lines-container');
    if (container.children.length <= 2) return alert("A Journal Entry must have at least two lines.");
    btn.parentElement.remove();
    calculateJvTotals();
}

function calculateJvTotals() {
    let dr = 0, cr = 0;
    document.querySelectorAll('#jv-lines-container > div').forEach(row => {
        const type = row.querySelector('.jv-type').value;
        const amt = Number(row.querySelector('.jv-amount').value) || 0;
        if (type === 'DR') dr += amt;
        else cr += amt;
    });
    
    document.getElementById('jv-total-dr').innerText = '₹' + dr.toFixed(2);
    document.getElementById('jv-total-cr').innerText = '₹' + cr.toFixed(2);
    
    const saveBtn = document.getElementById('save-jv-btn');
    if (dr > 0 && Math.abs(dr - cr) < 0.01) {
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<i class="fas fa-save"></i> POST JOURNAL ENTRY';
        saveBtn.style.opacity = '1';
    } else {
        saveBtn.disabled = true;
        saveBtn.innerHTML = '⚠️ TOTALS MUST MATCH';
        saveBtn.style.opacity = '0.5';
    }
}

async function saveJv(e) {
    e.preventDefault();
    
    const lines = [];
    document.querySelectorAll('#jv-lines-container > div').forEach(row => {
        lines.push({
            type: row.querySelector('.jv-type').value,
            entityType: row.querySelector('.jv-ledger').value,
            entityId: row.querySelector('.jv-entity-id').value || null,
            entityName: row.querySelector('.jv-entity-name').value,
            notes: row.querySelector('.jv-notes').value,
            amount: Number(row.querySelector('.jv-amount').value)
        });
    });

    const payload = {
        date: document.getElementById('jv-date').value,
        narration: document.getElementById('jv-narration').value,
        lines
    };

    const btn = document.getElementById('save-jv-btn');
    btn.disabled = true;
    btn.innerHTML = '⏳ POSTING...';

    try {
        const res = await fetch('/api/admin/journal-vouchers', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success) {
            document.getElementById('jvModal').classList.add('hidden');
            loadJvs();
            // Show toast
            const toast = document.createElement('div');
            toast.className = 'toast success';
            toast.innerHTML = `<i class="fas fa-check-circle"></i> JV ${data.jv.jvNo} posted successfully!`;
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 3000);
        } else {
            alert(data.error || 'Failed to post JV');
            calculateJvTotals(); // Reset button
        }
    } catch(err) {
        alert(err.message);
        calculateJvTotals();
    }
}

let jvDataList = [];
async function loadJvs() {
    try {
        const res = await fetch('/api/admin/journal-vouchers');
        jvDataList = await res.json();
        renderJvs();
    } catch(e) { console.error('JV Load Error:', e); }
}

function renderJvs() {
    const tbody = document.getElementById('jv-grid-body');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    if (!jvDataList || jvDataList.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 2rem; color: var(--text-muted);">No Journal Entries found.</td></tr>';
        return;
    }

    jvDataList.forEach(jv => {
        tbody.innerHTML += `
            <tr>
                <td><strong style="color: #a855f7;">${jv.jvNo}</strong></td>
                <td>${new Date(jv.date).toLocaleDateString()}</td>
                <td style="max-width: 250px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${jv.narration}">${jv.narration}</td>
                <td style="color: #ef4444; font-weight: bold;">₹${Number(jv.totalAmount).toLocaleString('en-IN', {minimumFractionDigits:2})}</td>
                <td style="color: #10b981; font-weight: bold;">₹${Number(jv.totalAmount).toLocaleString('en-IN', {minimumFractionDigits:2})}</td>
                <td>
                    <button class="btn btn-ghost" onclick="viewJv(${jv.id})" style="padding: 4px 8px; font-size: 0.7rem;"><i class="fas fa-eye"></i> View Details</button>
                </td>
            </tr>
        `;
    });
}

let currentlyViewedJv = null;

function viewJv(id) {
    const jv = jvDataList.find(j => j.id === id);
    if (!jv) return;
    
    currentlyViewedJv = jv;
    
    document.getElementById('view-jv-no').innerText = jv.jvNo;
    document.getElementById('view-jv-date').innerText = new Date(jv.date).toLocaleDateString();
    document.getElementById('view-jv-total').innerText = `₹${Number(jv.totalAmount).toLocaleString('en-IN', {minimumFractionDigits:2})}`;
    document.getElementById('view-jv-narration').innerText = jv.narration || '-';
    
    const tbody = document.getElementById('view-jv-lines');
    tbody.innerHTML = '';
    
    jv.lines.forEach(l => {
        const isDr = l.type === 'DR';
        tbody.innerHTML += `
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                <td style="padding: 12px 10px;">
                    <div style="color: #fff; font-weight: 600;">${l.entityName}</div>
                    <div style="font-size: 0.65rem; color: var(--text-muted); margin-top: 2px;">[${l.entityType}]</div>
                </td>
                <td style="padding: 12px 10px;">
                    <span style="font-weight: 900; background: ${isDr ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)'}; color: ${isDr ? '#ef4444' : '#10b981'}; padding: 2px 6px; border-radius: 4px; font-size: 0.7rem;">${l.type}</span>
                </td>
                <td style="padding: 12px 10px; color: var(--text-muted); font-size: 0.8rem;">${l.notes || '-'}</td>
                <td style="padding: 12px 10px; text-align: right; color: ${isDr ? '#ef4444' : '#444'}; font-weight: ${isDr ? 'bold' : 'normal'};">
                    ${isDr ? `₹${Number(l.amount).toLocaleString('en-IN', {minimumFractionDigits:2})}` : '-'}
                </td>
                <td style="padding: 12px 10px; text-align: right; color: ${!isDr ? '#10b981' : '#444'}; font-weight: ${!isDr ? 'bold' : 'normal'};">
                    ${!isDr ? `₹${Number(l.amount).toLocaleString('en-IN', {minimumFractionDigits:2})}` : '-'}
                </td>
            </tr>
        `;
    });
    
    document.getElementById('jvViewModal').classList.remove('hidden');
}

function downloadAllJvs() {
    if (!jvDataList || jvDataList.length === 0) return alert("No Journal Entries to download.");
    
    const fromDate = document.getElementById('jv-from-date').value;
    const toDate = document.getElementById('jv-to-date').value;
    
    let filtered = jvDataList;
    if (fromDate) filtered = filtered.filter(j => new Date(j.date) >= new Date(fromDate));
    if (toDate) {
        const end = new Date(toDate);
        end.setHours(23, 59, 59, 999);
        filtered = filtered.filter(j => new Date(j.date) <= end);
    }
    
    if (filtered.length === 0) return alert("No Journal Entries found for the selected date range.");

    let csv = "DATE,JV NO,ACCOUNT/ENTITY,TYPE,REMARKS,DEBIT (DR),CREDIT (CR),NARRATION\n";
    
    filtered.sort((a,b) => new Date(a.date) - new Date(b.date)).forEach(jv => {
        jv.lines.forEach((l, idx) => {
            const isDr = l.type === 'DR';
            csv += `"${idx===0?new Date(jv.date).toLocaleDateString():''}","${idx===0?jv.jvNo:''}","${(l.entityName||'').replace(/"/g, '""')} [${l.entityType}]","${l.type}","${(l.notes||'').replace(/"/g, '""')}","${isDr ? l.amount : ''}","${!isDr ? l.amount : ''}","${idx===0?(jv.narration||'').replace(/"/g, '""'):''}"\n`;
        });
        csv += "\n"; // Empty line between JVs for readability
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Journal_Register_${fromDate || 'start'}_to_${toDate || 'end'}.csv`;
    a.click();
}

function downloadSingleJv() {
    if (!currentlyViewedJv) return;
    const jv = currentlyViewedJv;
    
    let csv = "JV NO,DATE,NARRATION,TOTAL AMOUNT\n";
    csv += `"${jv.jvNo}","${new Date(jv.date).toLocaleDateString()}","${(jv.narration||'').replace(/"/g, '""')}","${jv.totalAmount}"\n\n`;
    
    csv += "POSTING DETAILS\n";
    csv += "ACCOUNT/ENTITY,TYPE,REMARKS,DEBIT (DR),CREDIT (CR)\n";
    
    jv.lines.forEach(l => {
        const isDr = l.type === 'DR';
        csv += `"${(l.entityName||'').replace(/"/g, '""')} [${l.entityType}]","${l.type}","${(l.notes||'').replace(/"/g, '""')}","${isDr ? l.amount : ''}","${!isDr ? l.amount : ''}"\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Journal_Voucher_${jv.jvNo}.csv`;
    a.click();
}

// Hook into existing initialLoad function if possible, otherwise just call loadJvs()
document.addEventListener('DOMContentLoaded', () => {
    // Attempt to load JVs when the dashboard boots up
    loadJvs();
});


function syncJvId(input) {
    const row = input.parentElement.parentElement;
    const ledger = row.querySelector('.jv-ledger').value;
    const idInput = row.querySelector('.jv-entity-id');
    const name = input.value;
    
    if (ledger === 'Stockist') {
        const s = allStockists.find(x => x.name === name);
        if (s) idInput.value = s.id;
        else idInput.value = '';
    }
}


// =============================================
// LEDGER MASTER MODULE
// =============================================

let allLedgers = [];
let allLedgerEntities = []; // Combined: Stockists + Ledgers + ExpCats

async function loadLedgers() {
    try {
        const res = await fetch('/api/admin/ledgers');
        allLedgers = await res.json();
        renderLedgerMasterList();

        // Also refresh combined entity list for JV autocomplete
        const res2 = await fetch('/api/admin/all-ledger-entities');
        const data = await res2.json();
        allLedgerEntities = [
            ...(data.stockists || []),
            ...(data.ledgers   || []),
            ...(data.expCats   || [])
        ];
        populateJvEntityDatalist();
    } catch(e) { console.error('Load ledgers failed', e); }
}

function renderLedgerMasterList() {
    const container = document.getElementById('ledger-master-list');
    if (!container) return;

    if (!allLedgers.length) {
        container.innerHTML = '<div style="padding:1rem; color:var(--text-muted); font-size:0.75rem;">No ledgers yet. Add one above.</div>';
        return;
    }

    // Group by group name
    const grouped = {};
    allLedgers.forEach(l => {
        if (!grouped[l.group]) grouped[l.group] = [];
        grouped[l.group].push(l);
    });

    let html = '';
    Object.keys(grouped).sort().forEach(grp => {
        html += '<div style="margin-bottom:0.5rem;">';
        html += '<div style="font-size:0.6rem; font-weight:900; color:#a855f7; letter-spacing:0.1em; padding: 4px 8px; background: rgba(168,85,247,0.08); border-radius:4px; margin-bottom:4px;">' + grp.toUpperCase() + '</div>';
        grouped[grp].forEach(l => {
            html += '<div style="display:flex; align-items:center; gap:0.5rem; padding:5px 8px; border-radius:6px; margin-bottom:2px; background:rgba(255,255,255,0.02);">';
            html += '<span style="font-size:0.65rem; font-weight:800; background:' + (l.nature==='DR'?'rgba(16,185,129,0.15)':'rgba(239,68,68,0.15)') + '; color:' + (l.nature==='DR'?'#10b981':'#ef4444') + '; padding:1px 6px; border-radius:4px;">' + l.nature + '</span>';
            html += '<span style="flex:1; font-size:0.78rem; color:#fff;">' + l.name + '</span>';
            html += '<span style="font-size:0.7rem; color:var(--text-muted);">Bal: ₹' + Number(l.openingBalance||0).toLocaleString('en-IN',{minimumFractionDigits:2}) + '</span>';
            html += '<button onclick="deleteLedger(' + l.id + ')" class="btn btn-ghost" style="padding:2px 6px; font-size:0.65rem; color:#ef4444;">✓•</button>';
            html += '</div>';
        });
        html += '</div>';
    });
    container.innerHTML = html;
}

async function addLedger() {
    const name   = (document.getElementById('new-ledger-name')?.value || '').trim();
    const group  = document.getElementById('new-ledger-group')?.value;
    const nature = document.getElementById('new-ledger-nature')?.value;
    const ob     = Number(document.getElementById('new-ledger-ob')?.value) || 0;

    if (!name) return alert('Please enter a ledger name.');

    try {
        const res = await fetch('/api/admin/ledgers', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ name, group, nature, openingBalance: ob })
        });
        const data = await res.json();
        if (data.success) {
            document.getElementById('new-ledger-name').value = '';
            document.getElementById('new-ledger-ob').value = '0';
            await loadLedgers();
        } else {
            alert(data.error || 'Failed to add ledger');
        }
    } catch(e) { alert(e.message); }
}

async function deleteLedger(id) {
    if (!confirm('Delete this ledger?')) return;
    try {
        await fetch('/api/admin/ledgers/' + id, { method: 'DELETE' });
        await loadLedgers();
    } catch(e) { alert(e.message); }
}

function populateJvEntityDatalist() {
    // Build a combined datalist for the JV entity name field
    const list = document.getElementById('jv-entity-list');
    if (!list) {
        // Create it if not present
        const dl = document.createElement('datalist');
        dl.id = 'jv-entity-list';
        document.body.appendChild(dl);
    }
    const dl = document.getElementById('jv-entity-list');
    dl.innerHTML = allLedgerEntities.map(e => '<option value="' + e.name + '" data-type="' + e.entityType + '" data-id="' + e.id + '"></option>').join('');
}

// Override addJvLine to use the combined smart datalist
function addJvLine() {
    const container = document.getElementById('jv-lines-container');
    const row = document.createElement('div');
    row.style.cssText = 'display:grid; grid-template-columns:70px 130px 1fr 1fr 120px 40px; gap:0.5rem; margin-bottom:0.5rem; align-items:center;';

    row.innerHTML = `
        <select class="jv-type" onchange="calculateJvTotals()" style="padding:7px; background:rgba(0,0,0,0.4); border:1px solid var(--glass-border); border-radius:8px; color:#fff; font-weight:900;">
            <option value="DR" style="color:#10b981;">DR</option>
            <option value="CR" style="color:#ef4444;">CR</option>
        </select>
        <select class="jv-ledger" onchange="onJvLedgerChange(this)" style="padding:7px; background:rgba(0,0,0,0.4); border:1px solid var(--glass-border); border-radius:8px; color:#fff; font-size:0.75rem;">
            <option value="Stockist">Stockist / Party</option>
            <option value="Ledger">Ledger A/c</option>
            <option value="ExpenseCategory">Expense Head</option>
        </select>
        <div style="position:relative;">
            <input type="hidden" class="jv-entity-id">
            <input type="text" class="jv-entity-name" list="jv-entity-list" required placeholder="Search name..." oninput="syncJvId(this)" style="width:100%; padding:7px 10px; background:rgba(0,0,0,0.4); border:1px solid var(--glass-border); border-radius:8px; color:#fff; font-size:0.78rem; box-sizing:border-box;">
        </div>
        <input type="text" class="jv-notes" placeholder="Notes (optional)" style="padding:7px 10px; background:rgba(0,0,0,0.4); border:1px solid var(--glass-border); border-radius:8px; color:#fff; font-size:0.75rem;">
        <input type="number" class="jv-amount" required step="0.01" min="0.01" value="" oninput="calculateJvTotals()" style="padding:7px 10px; background:rgba(0,0,0,0.4); border:1px solid #a855f7; border-radius:8px; color:#a855f7; font-weight:900; font-size:0.9rem; text-align:right;">
        <button type="button" onclick="removeJvLine(this)" class="btn btn-ghost" style="color:#ef4444; padding:5px; border-radius:6px; font-size:0.9rem;">✓•</button>
    `;
    container.appendChild(row);
}

function onJvLedgerChange(selectEl) {
    const row = selectEl.parentElement;
    const nameInput = row.querySelector('.jv-entity-name');
    const type = selectEl.value;
    
    // Update placeholder
    if (type === 'Stockist') nameInput.placeholder = 'Search stockist / party...';
    else if (type === 'Ledger') nameInput.placeholder = 'Search ledger account...';
    else nameInput.placeholder = 'Search expense head...';
    
    nameInput.value = '';
    row.querySelector('.jv-entity-id').value = '';
}

// Override syncJvId to use combined entity list
function syncJvId(input) {
    const row = input.parentElement.parentElement;
    const ledgerType = row.querySelector('.jv-ledger').value;
    const name = input.value;
    
    const entity = allLedgerEntities.find(e => e.name === name && e.entityType === ledgerType);
    const idInput = row.querySelector('.jv-entity-id');
    idInput.value = entity ? entity.id : '';
}

// Auto-load ledgers on page ready
document.addEventListener("DOMContentLoaded", () => { loadLedgers(); });


// =============================================
// EXPENSE REGISTER (List, Edit, Delete)
// =============================================

let allExpenses = [];
let expensesFiltered = [];

async function loadExpenses() {
    try {
        const res = await fetch('/api/admin/expenses');
        allExpenses = await res.json();
        filterExpenses();
    } catch(e) { console.error('Load expenses failed', e); }
}

function filterExpenses() {
    const search  = (document.getElementById('exp-search')?.value || '').toLowerCase();
    const typeFilter = document.getElementById('exp-filter-type')?.value || '';

    expensesFiltered = allExpenses.filter(e => {
        const matchType   = !typeFilter || e.type === typeFilter;
        const matchSearch = !search || 
            (e.categoryName || '').toLowerCase().includes(search) ||
            (e.title || '').toLowerCase().includes(search) ||
            (e.expenseNo || '').toLowerCase().includes(search) ||
            (e.paymentMethod || '').toLowerCase().includes(search);
        return matchType && matchSearch;
    });

    renderExpenseRegister();
}

function renderExpenseRegister() {
    const tbody = document.getElementById('expense-register-body');
    if (!tbody) return;

    // Compute stats
    const total    = expensesFiltered.reduce((s, e) => s + Number(e.amount || 0), 0);
    const direct   = expensesFiltered.filter(e => e.type === 'Direct').reduce((s, e) => s + Number(e.amount || 0), 0);
    const indirect = expensesFiltered.filter(e => e.type === 'Indirect').reduce((s, e) => s + Number(e.amount || 0), 0);

    const fmt = v => '₹' + Number(v).toLocaleString('en-IN', { minimumFractionDigits: 2 });
    const el = id => document.getElementById(id);
    if (el('exp-stat-total'))   el('exp-stat-total').innerText   = fmt(total);
    if (el('exp-stat-direct'))  el('exp-stat-direct').innerText  = fmt(direct);
    if (el('exp-stat-indirect'))el('exp-stat-indirect').innerText = fmt(indirect);

    if (!expensesFiltered.length) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:2rem; color:var(--text-muted);">No expenses found.</td></tr>';
        return;
    }

    tbody.innerHTML = expensesFiltered
        .sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt))
        .map(e => {
            const typeBadge = e.type === 'Direct'
                ? '<span style="background:rgba(245,158,11,0.15);color:#f59e0b;padding:2px 7px;border-radius:4px;font-size:0.6rem;font-weight:900;">DIRECT</span>'
                : '<span style="background:rgba(168,85,247,0.15);color:#a855f7;padding:2px 7px;border-radius:4px;font-size:0.6rem;font-weight:900;">INDIRECT</span>';

            return `<tr style="border-bottom:1px solid rgba(255,255,255,0.04); transition:background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.03)'" onmouseout="this.style.background='transparent'">
                <td style="padding:8px 10px; color:#ef4444; font-weight:800; font-size:0.75rem;">${e.expenseNo || '-'}</td>
                <td style="padding:8px 10px; color:var(--text-muted); font-size:0.72rem;">${e.date ? new Date(e.date).toLocaleDateString('en-IN') : new Date(e.createdAt).toLocaleDateString('en-IN')}</td>
                <td style="padding:8px 10px;">${typeBadge}</td>
                <td style="padding:8px 10px; color:#fff; font-weight:600; font-size:0.75rem;">${e.categoryName || '-'}</td>
                <td style="padding:8px 10px; color:var(--text-muted); font-size:0.72rem; max-width:200px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${e.title || ''}">${e.title || '-'}</td>
                <td style="padding:8px 10px; color:var(--text-muted); font-size:0.72rem;">${e.paymentMethod || '-'}</td>
                <td style="padding:8px 10px; text-align:right; color:#ef4444; font-weight:900; font-size:0.85rem;">${fmt(e.amount)}</td>
                <td style="padding:8px 10px; text-align:center;">
                    <button onclick="openEditExpense(${e.id})" class="btn btn-ghost" style="padding:3px 10px; font-size:0.65rem; border:1px solid rgba(245,158,11,0.4); color:#f59e0b; border-radius:6px;">&#9998; Edit</button>
                </td>
            </tr>`;
        }).join('');
}

function openEditExpense(id) {
    const e = allExpenses.find(x => x.id === id);
    if (!e) return;

    document.getElementById('edit-exp-id').value      = e.id;
    document.getElementById('edit-exp-refno').innerText = e.expenseNo || '';
    document.getElementById('edit-exp-date').value    = e.date ? e.date.split('T')[0] : '';
    document.getElementById('edit-exp-type').value    = e.type || 'Indirect';
    document.getElementById('edit-exp-title').value   = e.title || '';
    document.getElementById('edit-exp-amount').value  = e.amount || '';
    document.getElementById('edit-exp-method').value  = e.paymentMethod || 'Cash';
    document.getElementById('edit-exp-notes').value   = e.notes || '';

    loadEditExpenseCategoryOptions(e.categoryName);
    document.getElementById('editExpenseModal').classList.remove('hidden');
}

async function loadEditExpenseCategoryOptions(selectValue) {
    const type = document.getElementById('edit-exp-type').value;
    await fetchExpenseCategories();
    const cats = EXPENSE_CATEGORIES_CACHE[type] || [];
    const catSelect = document.getElementById('edit-exp-category');
    catSelect.innerHTML = cats.map(c => '<option value="' + c + '"' + (c === selectValue ? ' selected' : '') + '>' + c + '</option>').join('');
}

async function updateExpense(e) {
    e.preventDefault();
    const id = document.getElementById('edit-exp-id').value;

    const payload = {
        date:          document.getElementById('edit-exp-date').value,
        type:          document.getElementById('edit-exp-type').value,
        categoryName:  document.getElementById('edit-exp-category').value,
        title:         document.getElementById('edit-exp-title').value,
        amount:        Number(document.getElementById('edit-exp-amount').value),
        paymentMethod: document.getElementById('edit-exp-method').value,
        notes:         document.getElementById('edit-exp-notes').value
    };

    try {
        const res = await fetch('/api/admin/expenses/' + id, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success) {
            document.getElementById('editExpenseModal').classList.add('hidden');
            await loadExpenses();
        } else { alert(data.error || 'Update failed'); }
    } catch(err) { alert(err.message); }
}

async function deleteExpense(id) {
    if (!confirm('Are you sure you want to DELETE this expense? This cannot be undone.')) return;
    try {
        const res = await fetch('/api/admin/expenses/' + id, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) {
            document.getElementById('editExpenseModal').classList.add('hidden');
            await loadExpenses();
        } else { alert(data.error || 'Delete failed'); }
    } catch(err) { alert(err.message); }
}

// Hook into saveExpense to refresh the grid after saving
const _origSaveExpense = saveExpense;

// Auto-load expense register
document.addEventListener('DOMContentLoaded', () => { loadExpenses(); });

// =============================================
// ACCOUNTS & LEDGERS (Finance Views)
// =============================================

function switchFinanceTab(viewId, btnEl) {
    document.querySelectorAll('.finance-view').forEach(el => el.classList.add('hidden'));
    document.getElementById('finance-view-' + viewId).classList.remove('hidden');

    document.querySelectorAll('.finance-nav-btn').forEach(btn => {
        btn.classList.remove('btn-primary');
        btn.classList.add('btn-ghost');
    });
    btnEl.classList.remove('btn-ghost');
    btnEl.classList.add('btn-primary');

    if (viewId === 'trial-balance') loadTrialBalance();
    if (viewId === 'jv-register') loadJvs();
}

async function loadTrialBalance() {
    const tbody = document.getElementById('trial-balance-body');
    const tfoot = document.getElementById('trial-balance-foot');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:2rem; color:var(--text-muted);">Loading Trial Balance...</td></tr>';
    tfoot.innerHTML = '';

    try {
        const from = document.getElementById('tb-from')?.value || '';
        const to = document.getElementById('tb-to')?.value || '';
        const res = await fetch(`/api/admin/trial-balance?from=${from}&to=${to}`);
        const data = await res.json();
        
        if (!data.success) throw new Error(data.error);

        let html = '';
        let totalDr = 0;
        let totalCr = 0;
        const fmt = v => '₹' + Number(v).toLocaleString('en-IN', {minimumFractionDigits:2});

        // Grouping
        const groups = {};
        data.trialBalance.forEach(row => {
            if (!groups[row.group]) groups[row.group] = [];
            groups[row.group].push(row);
        });

        Object.keys(groups).sort().forEach(grp => {
            html += `<tr><td colspan="4" style="padding:10px 15px; background:rgba(255,255,255,0.03); color:#f59e0b; font-weight:900; font-size:0.65rem; letter-spacing:0.1em;">${grp.toUpperCase()}</td></tr>`;
            groups[grp].sort((a,b)=>a.name.localeCompare(b.name)).forEach(row => {
                totalDr += row.dr;
                totalCr += row.cr;
                html += `
                <tr style="border-bottom:1px solid rgba(255,255,255,0.02);">
                    <td style="padding:8px 15px;"></td>
                    <td style="padding:8px 15px; color:#fff; font-size:0.8rem;">${row.name}</td>
                    <td style="padding:8px 15px; text-align:right; color:#10b981; font-family:monospace; font-size:0.85rem;">${row.dr > 0 ? fmt(row.dr) : '-'}</td>
                    <td style="padding:8px 15px; text-align:right; color:#ef4444; font-family:monospace; font-size:0.85rem;">${row.cr > 0 ? fmt(row.cr) : '-'}</td>
                </tr>`;
            });
        });

        if (data.trialBalance.length === 0) {
            html = '<tr><td colspan="4" style="text-align:center; padding:2rem; color:var(--text-muted);">No entries found.</td></tr>';
        }

        tbody.innerHTML = html;

        // Difference check
        const diff = Math.abs(totalDr - totalCr);
        const diffHtml = diff > 0.01 
            ? `<div style="color:#ef4444; font-size:0.7rem; margin-top:4px;">Difference: ${fmt(diff)}</div>` 
            : `<div style="color:#10b981; font-size:0.7rem; margin-top:4px;">Matched</div>`;

        tfoot.innerHTML = `
            <tr style="background:rgba(0,0,0,0.5); font-weight:900;">
                <td colspan="2" style="padding:12px 15px; text-align:right; color:#fff;">GRAND TOTAL</td>
                <td style="padding:12px 15px; text-align:right; color:#10b981; font-size:0.95rem;">${fmt(totalDr)} ${diffHtml}</td>
                <td style="padding:12px 15px; text-align:right; color:#ef4444; font-size:0.95rem;">${fmt(totalCr)} ${diffHtml}</td>
            </tr>`;

    } catch (e) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:2rem; color:#ef4444;">Error: ' + e.message + '</td></tr>';
    }
}

function onLedgerStmtTypeChange() {
    const type = document.getElementById('ledger-stmt-type').value;
    const nameInput = document.getElementById('ledger-stmt-search');
    nameInput.value = '';
    document.getElementById('ledger-stmt-id').value = '';
    
    if (type === 'Stockist') nameInput.placeholder = 'Search party...';
    else if (type === 'Ledger') nameInput.placeholder = 'Search ledger account...';
    else nameInput.placeholder = 'Search expense head...';
}

function syncLedgerStmtId(input) {
    const type = document.getElementById('ledger-stmt-type').value;
    const entity = allLedgerEntities.find(e => e.name === input.value && e.entityType === type);
    document.getElementById('ledger-stmt-id').value = entity ? entity.id : '';
}

async function loadLedgerStatement() {
    const type = document.getElementById('ledger-stmt-type').value;
    const id = document.getElementById('ledger-stmt-id').value;
    const name = document.getElementById('ledger-stmt-search').value;
    const container = document.getElementById('ledger-stmt-results');

    if (!id) {
        container.innerHTML = '<div style="text-align:center; padding:3rem; color:#ef4444;">Please select a valid ledger from the list.</div>';
        return;
    }

    container.innerHTML = '<div style="text-align:center; padding:3rem; color:var(--text-muted);">Loading statement...</div>';

    try {
        const res = await fetch(`/api/admin/ledger-statement?type=${type}&id=${id}`);
        const data = await res.json();
        
        if (!data.success) throw new Error(data.error);

        let runningBal = data.openingBalance;
        let balType = data.obType; // DR or CR

        const fmt = v => '₹' + Number(Math.abs(v)).toLocaleString('en-IN', {minimumFractionDigits:2});
        
        // Header
        let html = `
        <div style="background:rgba(255,255,255,0.02); padding:1rem; border-radius:12px; border:1px solid var(--glass-border); margin-bottom:1rem;">
            <div style="font-size:0.6rem; color:var(--text-muted); font-weight:900; letter-spacing:0.1em; margin-bottom:4px;">LEDGER ACCOUNT</div>
            <div style="font-size:1.2rem; font-weight:900; color:#fff; display:flex; justify-content:space-between; align-items:center;">
                ${name}
                <span style="font-size:0.8rem; padding:4px 10px; background:rgba(0,0,0,0.5); border-radius:8px;">
                    <span style="color:var(--text-muted); font-size:0.6rem; margin-right:5px;">OPENING BAL:</span> 
                    ${fmt(runningBal)} <span style="font-size:0.6rem; color:${balType==='DR'?'#10b981':'#ef4444'};">${balType}</span>
                </span>
            </div>
        </div>
        <div style="overflow-x:auto;">
            <table class="modern-table">
                <thead>
                    <tr>
                        <th>DATE</th>
                        <th>VOUCHER NO</th>
                        <th>PARTICULARS</th>
                        <th style="text-align:right;">DEBIT (DR)</th>
                        <th style="text-align:right;">CREDIT (CR)</th>
                        <th style="text-align:right;">BALANCE</th>
                    </tr>
                </thead>
                <tbody>
        `;

        // We need to keep a numerical running balance where DR is positive and CR is negative (or vice versa)
        // Let's standardise: DR = positive, CR = negative for calculation.
        let calcBal = balType === 'DR' ? Number(runningBal) : -Number(runningBal);

        data.lines.forEach(line => {
            const v = line.voucher;
            const amt = Number(line.amount);
            
            if (line.type === 'DR') calcBal += amt;
            else calcBal -= amt;

            const currentBalType = calcBal >= 0 ? 'DR' : 'CR';
            
            html += `
            <tr style="border-bottom:1px solid rgba(255,255,255,0.02);">
                <td style="font-size:0.75rem; color:var(--text-muted);">${new Date(v.date).toLocaleDateString('en-IN')}</td>
                <td style="font-size:0.75rem; color:#a855f7; font-weight:900;">${v.jvNo}</td>
                <td style="font-size:0.75rem;">
                    <div style="color:#fff;">${v.narration || '-'}</div>
                    ${line.notes ? `<div style="font-size:0.65rem; color:var(--text-muted); margin-top:2px;">${line.notes}</div>` : ''}
                </td>
                <td style="text-align:right; color:#10b981; font-family:monospace;">${line.type === 'DR' ? fmt(amt) : ''}</td>
                <td style="text-align:right; color:#ef4444; font-family:monospace;">${line.type === 'CR' ? fmt(amt) : ''}</td>
                <td style="text-align:right; font-family:monospace; font-weight:800; color:${currentBalType==='DR'?'#10b981':'#ef4444'}">
                    ${fmt(calcBal)} <span style="font-size:0.6rem;">${currentBalType}</span>
                </td>
            </tr>`;
        });

        if (data.lines.length === 0) {
            html += '<tr><td colspan="6" style="text-align:center; padding:2rem; color:var(--text-muted);">No transactions found for this ledger.</td></tr>';
        } else {
            const finalBalType = calcBal >= 0 ? 'DR' : 'CR';
            html += `
            <tr style="background:rgba(0,0,0,0.4); font-weight:900;">
                <td colspan="3" style="text-align:right; color:#fff;">CLOSING BALANCE</td>
                <td colspan="3" style="text-align:right; font-size:1rem; color:${finalBalType==='DR'?'#10b981':'#ef4444'};">
                    ${fmt(calcBal)} <span style="font-size:0.7rem;">${finalBalType}</span>
                </td>
            </tr>`;
        }

        html += '</tbody></table></div>';
        container.innerHTML = html;

    } catch (e) {
        container.innerHTML = '<div style="text-align:center; padding:3rem; color:#ef4444;">Error: ' + e.message + '</div>';
    }
}

// Ensure loadTrialBalance is called when tab is activated from sidebar
const origSwitchTab = switchTab;
switchTab = function(tabId, el, ...args) {
    origSwitchTab(tabId, el, ...args);
    if (tabId === 'jvs') {
        loadTrialBalance(); // Default view in Accounts & Ledgers
    }
    if (tabId === 'reports') {
        loadExpenses();
        refreshInventoryVal();
    }
};

async function loadFinancialStatements() {
    try {
        // Try to get dates from P&L or Balance Sheet inputs (they are synced)
        const from = document.getElementById('pl-from')?.value || document.getElementById('bs-from')?.value || '';
        const to = document.getElementById('pl-to')?.value || document.getElementById('bs-to')?.value || '';
        
        const res = await fetch(`/api/admin/financial-statements?from=${from}&to=${to}`);
        const data = await res.json();
        if (!data.success) throw new Error(data.error);

        renderPL(data.pl);
        renderBS(data.bs);
    } catch (e) { console.error("Finance load error", e); }
}

function renderPL(pl) {
    const container = document.getElementById('pl-results');
    if (!container) return;
    const fmt = v => '₹' + Number(v).toLocaleString('en-IN', {minimumFractionDigits:2});

    let html = `
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:2rem;">
        <!-- INCOME -->
        <div>
            <h4 style="color:#10b981; border-bottom:1px solid #10b981; padding-bottom:5px; font-size:0.8rem;">REVENUE / INCOME</h4>
            <table style="width:100%; border-collapse:collapse; margin-top:10px;">
                ${pl.income.map(x => `<tr><td style="padding:5px 0; color:var(--text-muted); font-size:0.75rem;">${x.name}</td><td style="text-align:right; color:#fff; font-size:0.75rem;">${fmt(x.amount)}</td></tr>`).join('')}
                <tr style="border-top:1px solid var(--glass-border); font-weight:900;"><td style="padding:10px 0; color:#fff;">TOTAL INCOME</td><td style="text-align:right; color:#10b981;">${fmt(pl.totalIncome)}</td></tr>
            </table>
        </div>
        <!-- EXPENSES -->
        <div>
            <h4 style="color:#ef4444; border-bottom:1px solid #ef4444; padding-bottom:5px; font-size:0.8rem;">OPERATIONAL EXPENSES</h4>
            <table style="width:100%; border-collapse:collapse; margin-top:10px;">
                ${pl.expenses.map(x => `<tr><td style="padding:5px 0; color:var(--text-muted); font-size:0.75rem;">${x.name}</td><td style="text-align:right; color:#fff; font-size:0.75rem;">${fmt(x.amount)}</td></tr>`).join('')}
                <tr style="border-top:1px solid var(--glass-border); font-weight:900;"><td style="padding:10px 0; color:#fff;">TOTAL EXPENSES</td><td style="text-align:right; color:#ef4444;">${fmt(pl.totalExpenses)}</td></tr>
            </table>
        </div>
    </div>
    <div style="margin-top:2rem; background:rgba(16,185,129,0.1); border:1px solid #10b981; border-radius:12px; padding:1.5rem; text-align:center;">
        <div style="font-size:0.7rem; color:var(--text-muted); font-weight:900; letter-spacing:0.1em; margin-bottom:5px;">NET PROFIT / LOSS</div>
        <div style="font-size:2rem; font-weight:900; color:${pl.netProfit >= 0 ? '#10b981' : '#ef4444'};">${fmt(pl.netProfit)}</div>
    </div>`;
    container.innerHTML = html;
}

function renderBS(bs) {
    const container = document.getElementById('bs-results');
    if (!container) return;
    const fmt = v => '₹' + Number(v).toLocaleString('en-IN', {minimumFractionDigits:2});

    let html = `
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:2rem;">
        <!-- LIABILITIES -->
        <div>
            <h4 style="color:#f59e0b; border-bottom:1px solid #f59e0b; padding-bottom:5px; font-size:0.8rem;">LIABILITIES & CAPITAL</h4>
            <table style="width:100%; border-collapse:collapse; margin-top:10px;">
                ${bs.liabilities.map(x => `<tr><td style="padding:5px 0; color:var(--text-muted); font-size:0.75rem;">${x.name}</td><td style="text-align:right; color:#fff; font-size:0.75rem;">${fmt(x.amount)}</td></tr>`).join('')}
                <tr style="border-top:1px solid var(--glass-border); font-weight:900;"><td style="padding:10px 0; color:#fff;">TOTAL LIABILITIES</td><td style="text-align:right; color:#f59e0b;">${fmt(bs.totalLiabilities)}</td></tr>
            </table>
        </div>
        <!-- ASSETS -->
        <div>
            <h4 style="color:#3b82f6; border-bottom:1px solid #3b82f6; padding-bottom:5px; font-size:0.8rem;">ASSETS</h4>
            <table style="width:100%; border-collapse:collapse; margin-top:10px;">
                ${bs.assets.map(x => `<tr><td style="padding:5px 0; color:var(--text-muted); font-size:0.75rem;">${x.name}</td><td style="text-align:right; color:#fff; font-size:0.75rem;">${fmt(x.amount)}</td></tr>`).join('')}
                <tr style="border-top:1px solid var(--glass-border); font-weight:900;"><td style="padding:10px 0; color:#fff;">TOTAL ASSETS</td><td style="text-align:right; color:#3b82f6;">${fmt(bs.totalAssets)}</td></tr>
            </table>
        </div>
    </div>`;
    container.innerHTML = html;
}

// Update switchFinanceTab to load statements
const origSwitchFinanceTab = switchFinanceTab;
switchFinanceTab = function(viewId, btnEl) {
    origSwitchFinanceTab(viewId, btnEl);
    if (viewId === 'pl-stmt' || viewId === 'balance-sheet') {
        loadFinancialStatements();
    }
};

let currentPendingBills = [];

async function fetchPendingBills() {
    const partyId = document.getElementById('pay-party').value;
    const listEl = document.getElementById('pending-bills-list');
    if (!partyId) {
        listEl.innerHTML = '<div style="text-align: center; padding: 4rem 2rem; color: var(--text-muted); font-size: 0.8rem; border: 2px dashed var(--glass-border); border-radius: 20px;">Select a party to view pending bills.</div>';
        currentPendingBills = [];
        return;
    }

    listEl.innerHTML = '<div style="text-align: center; padding: 2rem; color: var(--text-muted); font-size: 0.8rem;">Loading pending bills...</div>';

    try {
        const res = await fetch(`/api/admin/stockists/${partyId}/pending-bills`);
        const data = await res.json();
        if (data.success) {
            currentPendingBills = [...(data.invoices || []), ...(data.purchases || [])];
            renderPendingBills();
        }
    } catch (e) {
        listEl.innerHTML = '<div style="text-align: center; padding: 2rem; color: #ef4444; font-size: 0.8rem;">Failed to load bills.</div>';
    }
}

function renderPendingBills() {
    const listEl = document.getElementById('pending-bills-list');
    if (currentPendingBills.length === 0) {
        listEl.innerHTML = '<div style="text-align: center; padding: 4rem 2rem; color: var(--text-muted); font-size: 0.8rem; border: 2px dashed var(--glass-border); border-radius: 20px;">No pending bills found for this party.</div>';
        return;
    }

    listEl.innerHTML = currentPendingBills.map((bill, index) => {
        const no = bill.invoiceNo || bill.purchaseNo;
        const date = new Date(bill.createdAt || bill.invoiceDate).toLocaleDateString('en-IN');
        return `
            <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--glass-border); border-radius: 12px; padding: 12px; display: flex; flex-direction: column; gap: 8px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 0.6rem; font-weight: 900; color: var(--primary); letter-spacing: 1px;">${no}</span>
                    <span style="font-size: 0.6rem; color: var(--text-muted); text-transform: uppercase;">${date}</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: baseline;">
                    <div>
                        <div style="font-size: 0.85rem; font-weight: 900; color: #fff;">₹${Number(bill.outstandingAmount).toLocaleString('en-IN', {minimumFractionDigits:2})}</div>
                        <div style="font-size: 0.55rem; color: var(--text-muted); font-weight: 700;">PENDING / ₹${Number(bill.grandTotal).toLocaleString('en-IN')}</div>
                    </div>
                    <input type="number" step="0.01" class="bill-link-amt" data-index="${index}" placeholder="0.00" oninput="updateLinkedTotal()" style="width: 100px; padding: 6px 10px; background: rgba(0,0,0,0.3); border: 1.5px solid var(--glass-border); border-radius: 8px; color: #fff; font-size: 0.8rem; text-align: right; font-weight: 800;">
                </div>
            </div>
        `;
    }).join('');
    updateLinkedTotal();
}

function updateLinkedTotal() {
    const totalAmt = Number(document.getElementById('pay-amount').value) || 0;
    let linked = 0;
    document.querySelectorAll('.bill-link-amt').forEach(input => {
        linked += Number(input.value) || 0;
    });

    const badge = document.getElementById('linked-total-badge');
    if(badge) badge.innerText = `LINKED: ₹${linked.toLocaleString('en-IN', {minimumFractionDigits:2})}`;
    
    const unallocated = totalAmt - linked;
    const unallocatedEl = document.getElementById('unallocated-amount');
    if(unallocatedEl) {
        unallocatedEl.innerText = `₹${Math.abs(unallocated).toLocaleString('en-IN', {minimumFractionDigits:2})} ${unallocated < 0 ? 'OVER' : ''}`;
        unallocatedEl.style.color = unallocated < 0 ? '#ef4444' : (unallocated === 0 ? '#10b981' : '#f59e0b');
    }
}

function autoAllocatePayment() {
    let remaining = Number(document.getElementById('pay-amount').value) || 0;
    const inputs = document.querySelectorAll('.bill-link-amt');
    
    inputs.forEach(input => {
        const index = input.dataset.index;
        const bill = currentPendingBills[index];
        const outstanding = Number(bill.outstandingAmount);
        
        if (remaining > 0) {
            const allocate = Math.min(remaining, outstanding);
            input.value = allocate.toFixed(2);
            remaining -= allocate;
        } else {
            input.value = '';
        }
    });
    updateLinkedTotal();
}

async function downloadPLReport() {
    try {
        const from = document.getElementById('pl-from')?.value || '';
        const to = document.getElementById('pl-to')?.value || '';
        const res = await fetch(`/api/admin/financial-statements?from=${from}&to=${to}`);
        const data = await res.json();
        if (!data.success) throw new Error(data.error);

        const rows = [];
        rows.push({ "Profit & Loss Section": "--- REVENUE / INCOME ---" });
        data.pl.income.forEach(x => {
            rows.push({ "Profit & Loss Section": x.name, "Amount (INR)": x.amount });
        });
        rows.push({ "Profit & Loss Section": "TOTAL INCOME", "Amount (INR)": data.pl.totalIncome });
        
        rows.push({ "Profit & Loss Section": "" });
        rows.push({ "Profit & Loss Section": "--- OPERATIONAL EXPENSES ---" });
        data.pl.expenses.forEach(x => {
            rows.push({ "Profit & Loss Section": x.name, "Amount (INR)": x.amount });
        });
        rows.push({ "Profit & Loss Section": "TOTAL EXPENSES", "Amount (INR)": data.pl.totalExpenses });
        
        rows.push({ "Profit & Loss Section": "" });
        rows.push({ "Profit & Loss Section": "NET PROFIT / LOSS", "Amount (INR)": data.pl.netProfit });

        downloadExcel(rows, `Profit_and_Loss_Statement_${from}_to_${to}`);
    } catch(e) {
        console.error(e);
        alert("Failed to export P&L report.");
    }
}

async function downloadBSReport() {
    try {
        const from = document.getElementById('bs-from')?.value || '';
        const to = document.getElementById('bs-to')?.value || '';
        const res = await fetch(`/api/admin/financial-statements?from=${from}&to=${to}`);
        const data = await res.json();
        if (!data.success) throw new Error(data.error);

        const rows = [];
        rows.push({ "Balance Sheet Section": "--- LIABILITIES & CAPITAL ---" });
        data.bs.liabilities.forEach(x => {
            rows.push({ "Balance Sheet Section": x.name, "Amount (INR)": x.amount });
        });
        rows.push({ "Balance Sheet Section": "TOTAL LIABILITIES", "Amount (INR)": data.bs.totalLiabilities });
        
        rows.push({ "Balance Sheet Section": "" });
        rows.push({ "Balance Sheet Section": "--- ASSETS ---" });
        data.bs.assets.forEach(x => {
            rows.push({ "Balance Sheet Section": x.name, "Amount (INR)": x.amount });
        });
        rows.push({ "Balance Sheet Section": "TOTAL ASSETS", "Amount (INR)": data.bs.totalAssets });

        downloadExcel(rows, `Balance_Sheet_${from}_to_${to}`);
    } catch(e) {
        console.error(e);
        alert("Failed to export Balance Sheet report.");
    }
}




