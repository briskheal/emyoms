// EMYRIS OMS - Stockist Logic
const API_BASE = '/api';
let currentUser = null;
let allProducts = [];
let cart = {}; // { productId: qty }
let manualBonuses = {}; // Track manually edited bonuses
let currentCat = 'ALL';
let currentSearch = '';
let companySettings = null;
let askingRates = {}; // Store negotiated rates
let negotiationNotes = {}; // Store authorization details
let myOrdersHistory = []; // Store history for modal lookup
let currentViewOrderId = null; // Track order for invoice downloading

// --- GLOBAL CUSTOM ALERT SYSTEM ---
function showAlert(message, type = 'info') {
    const overlay = document.getElementById('globalAlertOverlay');
    const box = document.getElementById('globalAlertBox');
    const icon = document.getElementById('alertIcon');
    const title = document.getElementById('alertTitle');
    const msg = document.getElementById('alertMsg');
    
    if (!overlay || !box) return console.log("Alert:", message);

    // Set Colors
    box.className = ''; 
    if (type === 'success') {
        box.classList.add('alert-success');
        icon.innerHTML = '<i class="fas fa-check-circle" style="color:#fff;"></i>';
        title.innerText = "SUCCESS";
    } else if (type === 'error') {
        box.classList.add('alert-error');
        icon.innerHTML = '<i class="fas fa-times-circle" style="color:#fff;"></i>';
        title.innerText = "ERROR OCCURRED";
    } else if (type === 'warning') {
        box.classList.add('alert-warning');
        icon.innerHTML = '<i class="fas fa-exclamation-circle" style="color:#fff;"></i>';
        title.innerText = "PLEASE CHECK";
    } else {
        box.classList.add('alert-info');
        icon.innerHTML = '<i class="fas fa-info-circle" style="color:#fff;"></i>';
        title.innerText = "NOTIFICATION";
    }

    msg.innerText = message;
    overlay.classList.add('show-alert');
    overlay.classList.remove('hidden');
}

function closeAlert() {
    const overlay = document.getElementById('globalAlertOverlay');
    if (overlay) overlay.classList.remove('show-alert');
    setTimeout(() => { if (overlay) overlay.classList.add('hidden'); }, 300);
}

// Override standard window.alert
window.alert = function(message) {
    let type = 'info';
    if (message.toUpperCase().includes('FAILED') || message.toUpperCase().includes('ERROR') || message.toUpperCase().includes('INVALID')) type = 'error';
    if (message.toUpperCase().includes('SUCCESS') || message.includes('✓')) type = 'success';
    if (message.toUpperCase().includes('REQUIRED') || message.toUpperCase().includes('CHECK') || message.toUpperCase().includes('MANDATORY') || message.includes('⚠️')) type = 'warning';
    
    showAlert(message, type);
};


async function syncProfile() {
    if (!currentUser || !currentUser._id) return;
    try {
        const res = await fetch(`${API_BASE}/stockist/profile/${currentUser._id}`);
        const data = await res.json();
        if (data.success) {
            currentUser = data.stockist;
            localStorage.setItem('emyris_user', JSON.stringify(currentUser));
            console.log("🔄 [SYNC] Latest Price Locks Loaded");
        }
    } catch (e) { console.error("❌ Profile Sync Failed:", e.message); }
}

// --- INITIALIZATION ---
window.onload = () => {
    // 1. Immediately attach login listener safety (in case DOMContentLoaded hasn't finished)
    const loginForm = document.querySelector('form');
    if (loginForm) {
        loginForm.onsubmit = (e) => handleLogin(e);
    }

    // 2. Load settings in background (non-blocking)
    loadSettings();

    const savedUser = localStorage.getItem('emyris_user');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        switchView('order');
        initOrderSystem();
    } else {
        switchView('login');
    }
};


function switchView(view) {
    const views = ['section-auth', 'view-order'];
    const authCards = ['view-auth-combined', 'view-login', 'view-register', 'view-forgot', 'view-pin', 'view-reg-success'];
    
    // Hide all
    views.forEach(v => {
        const el = document.getElementById(v);
        if (el) el.classList.add('hidden');
    });
    authCards.forEach(c => {
        const el = document.getElementById(c);
        if (el) el.classList.add('hidden');
    });

    const navbar = document.querySelector('.navbar');
    if (navbar) navbar.classList.add('hidden');

    const marquee = document.getElementById('marquee');
    if (marquee) marquee.classList.add('hidden');

    const globalFooter = document.getElementById('global-footer');
    if (globalFooter) globalFooter.classList.add('hidden');
    const landMarquee = document.getElementById('land-marquee');
    if (landMarquee) landMarquee.classList.add('hidden');


    if (view === 'order') {
        document.getElementById('view-order').classList.remove('hidden');
        if (navbar) navbar.classList.remove('hidden');
        const userMenu = document.getElementById('userMenu');
        if (userMenu) userMenu.classList.remove('hidden');
        if (marquee) marquee.classList.remove('hidden');
        if (globalFooter) globalFooter.classList.remove('hidden');
        document.getElementById('stockistName').innerText = currentUser.name;
    } else {
        // Show auth section
        document.getElementById('section-auth').classList.remove('hidden');
        const userMenu = document.getElementById('userMenu');

        if (userMenu) userMenu.classList.add('hidden');

        if (view === 'login' || view === 'register') {
            if (landMarquee) landMarquee.classList.remove('hidden');
            document.getElementById('view-auth-combined').classList.remove('hidden');

            document.getElementById('view-login').classList.remove('hidden');
            document.getElementById('view-register').classList.remove('hidden');
            // Smooth scroll to auth section if needed
            const authSection = document.getElementById('view-auth-combined');
            if (authSection) authSection.scrollIntoView({ behavior: 'smooth' });
        } else {
            const card = document.getElementById(`view-${view}`);
            if (card) card.classList.remove('hidden');
        }
    }
}

function switchOrderTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    const targetBtn = document.getElementById(`btn-tab-${tab}`);
    if (targetBtn) targetBtn.classList.add('active');
    
    // Hide all guide arrows first
    ['guide-place', 'guide-history', 'guide-pdcn', 'guide-pdcn-history', 'guide-arrow'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add('hidden');
    });

    // Hide all sections first
    ['section-place-order', 'section-order-history', 'section-pdcn', 'section-pdcn-history', 'section-registry'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add('hidden');
    });

    if (tab === 'place') {
        document.getElementById('section-place-order').classList.remove('hidden');
        if (document.getElementById('orderFooter')) document.getElementById('orderFooter').classList.remove('hidden');
        
        const g = document.getElementById('guide-place');
        if (g) g.classList.remove('hidden');
        
        setTimeout(() => {
            document.getElementById('section-place-order').scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);

    } else if (tab === 'history') {
        document.getElementById('section-order-history').classList.remove('hidden');
        if (document.getElementById('orderFooter')) document.getElementById('orderFooter').classList.add('hidden');
        fetchMyOrders();

        const g = document.getElementById('guide-history');
        if (g) g.classList.remove('hidden');

        setTimeout(() => {
            document.getElementById('section-order-history').scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);

    } else if (tab === 'pdcn') {
        document.getElementById('section-pdcn').classList.remove('hidden');
        if (document.getElementById('orderFooter')) document.getElementById('orderFooter').classList.add('hidden');
        fetchPDCNInvoices();

        const g = document.getElementById('guide-pdcn');
        if (g) g.classList.remove('hidden');

        setTimeout(() => {
            document.getElementById('section-pdcn').scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);

    } else if (tab === 'pdcn-history') {
        document.getElementById('section-pdcn-history').classList.remove('hidden');
        if (document.getElementById('orderFooter')) document.getElementById('orderFooter').classList.add('hidden');
        fetchPDCNHistory();

        const g = document.getElementById('guide-pdcn-history');
        if (g) g.classList.remove('hidden');

        setTimeout(() => {
            document.getElementById('section-pdcn-history').scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    } else if (tab === 'registry') {
        document.getElementById('section-registry').classList.remove('hidden');
        if (document.getElementById('orderFooter')) document.getElementById('orderFooter').classList.add('hidden');
        
        // --- GUIDE NEW USER ---
        const arrow = document.getElementById('guide-arrow');
        if (arrow) arrow.classList.remove('hidden');
        
        setTimeout(() => {
            document.getElementById('section-registry').scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const btn = document.getElementById('regBtn');
    const originalText = btn.innerText;
    
    try {
        btn.innerText = "⌛ CREATING ACCOUNT...";
        btn.disabled = true;

        const data = {
            name: document.getElementById('reg-name').value.toUpperCase(),
            email: document.getElementById('reg-email').value,
            phone: document.getElementById('reg-phone').value,
            password: document.getElementById('reg-pass').value,
            address: document.getElementById('reg-address').value.toUpperCase(),
            dlNo: document.getElementById('reg-dl').value.toUpperCase(),
            gstNo: document.getElementById('reg-gst').value.toUpperCase(),
            fssaiNo: document.getElementById('reg-fssai').value.toUpperCase(),
            panNo: document.getElementById('reg-pan').value.toUpperCase(),
            city: document.getElementById('reg-city').value.toUpperCase(),
            state: document.getElementById('reg-state').value.toUpperCase(),
            pincode: document.getElementById('reg-pin').value
        };


        console.log("📝 Registering Stockist:", data);

        const res = await fetch(`${API_BASE}/stockist/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await res.json();
        if (result.success) {
            // Show registration success card with credentials and summary
            document.getElementById('success-login-id').innerText = result.loginId;
            document.getElementById('success-password').innerText = result.password;
            
            // Populate Summary
            document.getElementById('summary-name').innerText = data.name;
            document.getElementById('summary-email').innerText = data.email;
            document.getElementById('summary-gst').innerText = data.gstNo;
            document.getElementById('summary-dl').innerText = data.dlNo;
            document.getElementById('summary-address').innerText = data.address;
            document.getElementById('summary-city').innerText = data.city;
            document.getElementById('summary-state').innerText = data.state;

            
            switchView('reg-success');
            stopMusic(); // Stop music when finished

        } else {
            alert(result.message || "Registration failed. Please check your details.");
        }
    } catch (e) { 
        console.error("❌ Registration Error:", e);
        alert("Registration failed. Server error."); 
    } finally {
        btn.innerText = originalText;
        btn.disabled = false;
    }
}

function handleGstInput(el) {
    try {
        const gst = el.value.toUpperCase();
        el.value = gst;
        const statusEl = document.getElementById('gst-status');
        const panEl = document.getElementById('reg-pan');
        
        if (!statusEl) return;
        
        const states = {
            "01": "Jammu & Kashmir", "02": "Himachal Pradesh", "03": "Punjab", "04": "Chandigarh", "05": "Uttarakhand",
            "06": "Haryana", "07": "Delhi", "08": "Rajasthan", "09": "Uttar Pradesh", "10": "Bihar",
            "11": "Sikkim", "12": "Arunachal Pradesh", "13": "Nagaland", "14": "Manipur", "15": "Mizoram",
            "16": "Tripura", "17": "Meghalaya", "18": "Assam", "19": "West Bengal", "20": "Jharkhand",
            "21": "Odisha", "22": "Chhattisgarh", "23": "Madhya Pradesh", "24": "Gujarat", "27": "Maharashtra",
            "28": "Andhra Pradesh", "29": "Karnataka", "30": "Goa", "31": "Lakshadweep", "32": "Kerala",
            "33": "Tamil Nadu", "34": "Puducherry", "35": "Andaman & Nicobar Islands", "36": "Telangana", "37": "Andhra Pradesh"
        };

        const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

        if (gst.length === 15) {
            if (gstRegex.test(gst)) {
                const stateCode = gst.substring(0, 2);
                statusEl.innerHTML = `<span style="color:var(--accent);">✅ VALID GST: ${states[stateCode] || 'Unknown State'}</span>`;
                // Extract PAN (characters 3 to 12)
                const pan = gst.substring(2, 12);
                if (panEl) panEl.value = pan;
                statusEl.innerHTML += ' • <span style="color:var(--primary);">PAN AUTO-FILLED</span>';
            } else {
                statusEl.innerHTML = '<span style="color:#ef4444;">❌ INVALID GST FORMAT</span>';
            }
        } else if (gst.length < 2) {
            statusEl.innerHTML = '';
        }
    } catch (err) { console.warn("GST Validation Error:", err); }
}

function handlePinInput(el) {
    const pin = el.value.toString();
    const stateEl = document.getElementById('reg-state');
    if (!stateEl) return;

    if (pin.length >= 2) {
        const prefix = parseInt(pin.substring(0, 2));
        let state = "";

        if (prefix === 11) state = "Delhi";
        else if (prefix >= 12 && prefix <= 13) state = "Haryana";
        else if (prefix >= 14 && prefix <= 15) state = "Punjab";
        else if (prefix === 16) state = "Chandigarh";
        else if (prefix === 17) state = "Himachal Pradesh";
        else if (prefix >= 18 && prefix <= 19) state = "Jammu & Kashmir";
        else if (prefix >= 20 && prefix <= 28) state = "Uttar Pradesh";
        else if (prefix >= 30 && prefix <= 34) state = "Rajasthan";
        else if (prefix >= 36 && prefix <= 39) state = "Gujarat";
        else if (prefix >= 40 && prefix <= 44) state = "Maharashtra";
        else if (prefix >= 45 && prefix <= 48) state = "Madhya Pradesh";
        else if (prefix === 49) state = "Chhattisgarh";
        else if (prefix >= 50 && prefix <= 53) state = "Telangana / Andhra Pradesh";
        else if (prefix >= 56 && prefix <= 59) state = "Karnataka";
        else if (prefix >= 60 && prefix <= 64) state = "Tamil Nadu";
        else if (prefix >= 67 && prefix <= 69) state = "Kerala";
        else if (prefix >= 70 && prefix <= 74) state = "West Bengal";
        else if (prefix >= 75 && prefix <= 77) state = "Odisha";
        else if (prefix === 78) state = "Assam";
        else if (prefix === 79) state = "NE States";
        else if (prefix >= 80 && prefix <= 85) state = "Bihar / Jharkhand";

        stateEl.value = state;
    } else {
        stateEl.value = "";
    }
}


async function handleLogin(e) {
    e.preventDefault();
    const loginId = document.getElementById('login-id').value;
    const password = document.getElementById('login-pass').value;
    const btn = document.getElementById('loginBtn');
    const originalText = btn.innerText;

    try {
        btn.innerText = "⌛ SECURING SESSION...";
        btn.disabled = true;

        const res = await fetch(`${API_BASE}/stockist/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ loginId, password })
        });
        const result = await res.json();
        if (result.success) {
            currentUser = result.user;
            localStorage.setItem('emyris_user', JSON.stringify(currentUser));
            switchView('order');
            initOrderSystem();
            console.log('✅ [LOGIN] Direct session established for:', currentUser.name);
        } else {
            alert(result.message);
        }
    } catch (e) { 
        console.error("❌ [LOGIN] Connection failed:", e);
        alert("Login failed. Server error."); 
    }
    finally {
        btn.innerText = originalText;
        btn.disabled = false;
    }
}


async function handleForgotPassword(e) {
    e.preventDefault();
    const email = document.getElementById('forgot-email').value;

    try {
        const res = await fetch(`${API_BASE}/stockist/forgot-id-pw`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        const result = await res.json();
        alert(result.message);
        if (result.success) switchView('login');
    } catch (e) { alert("Recovery request failed."); }
}

function logout() {
    handleLogout();
}

// --- ORDERING SYSTEM ---
async function initOrderSystem() {
    await syncProfile(); // CRITICAL: Get latest negotiated prices first
    await loadSettings();
    await fetchProducts(); // Fetch products first so loadMasters can harvest categories
    await loadMasters();
    renderExcelProducts();
    fetchMyOrders();
}


async function loadSettings() {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

    try {
        // 1. Fetch Public Config (Always accessible for landing page)
        const pubRes = await fetch(`${API_BASE}/public/config`, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (pubRes.ok) {
            const pubData = await pubRes.json();
            if (pubData.success) companySettings = pubData.config;
        }

        // 2. Try Admin Settings (If logged in, gives more info)
        try {
            const adminRes = await fetch(`${API_BASE}/admin/settings`);
            if (adminRes.ok) {
                const adminData = await adminRes.json();
                companySettings = { ...companySettings, ...adminData };
            }
        } catch(e) { /* Fallback to public config */ }

        if (!companySettings) return;

        const safeSet = (id, text) => {
            const el = document.getElementById(id);
            if (el) el.innerText = text;
        };

        // UI Population
        safeSet('co-name', companySettings.name || "EMYRIS BIOLIFESCIENCES");
        safeSet('co-address', companySettings.address || "Office Address Loading...");
        safeSet('co-tollfree', companySettings.tollFree || "7993163300");
        
        const mainPhone = (companySettings.phones && companySettings.phones[0]) ? companySettings.phones[0] : '+91-XXXXXXXXXX';
        safeSet('co-phone', `WhatsApp: ${mainPhone}`);
        
        if (companySettings.websites) {
            safeSet('co-web1', `🌐 ${companySettings.websites[0] || ''}`);
        }
        if (companySettings.emails) {
            safeSet('co-email1', `✉️ ${companySettings.emails[0] || ''}`);
        }

        // Footers
        const web = (companySettings.websites && companySettings.websites[0]) ? companySettings.websites[0] : 'www.emyrisbio.com';
        const toll = companySettings.tollFree || '7993163300';
        const email = (companySettings.emails && companySettings.emails[0]) ? companySettings.emails[0] : 'contact@emyrisbio.com';
        
        safeSet('land-web', `🌐 ${web}`);
        safeSet('land-tollfree', `📞 TOLL-FREE: ${toll}`);
        safeSet('land-phone', `💬 WHATSAPP: ${mainPhone}`);
        safeSet('land-email', `✉️ ${email}`);
        safeSet('land-address', companySettings.address || "Corporate Office: EMYRIS BIOLIFESCIENCES");

        safeSet('f-co-web', web);
        safeSet('f-co-phone', mainPhone);
        safeSet('f-co-email', email);
        safeSet('f-co-address', companySettings.address || "Corporate Office: EMYRIS BIOLIFESCIENCES");

        // --- DYNAMIC LOGO ---
        if (companySettings.logoImage) {
            const logoEls = document.querySelectorAll('.logo');
            logoEls.forEach(el => {
                el.innerHTML = `<img src="${companySettings.logoImage}" style="height: 40px; width: auto; object-fit: contain; margin-right: 10px;"> ${el.innerText}`;
                el.style.display = 'flex';
                el.style.alignItems = 'center';
            });
        }

        // --- BLUEPRINT PREVIEW ---
        if (companySettings.referenceInvoiceUrl) {
            const footer = document.getElementById('global-footer');
            if (footer) {
                const blueprintLink = document.createElement('div');
                blueprintLink.style.marginTop = '10px';
                blueprintLink.style.textAlign = 'center';
                blueprintLink.innerHTML = `<a href="${companySettings.referenceInvoiceUrl}" target="_blank" style="color:var(--accent); font-size: 0.65rem; text-decoration: none; opacity: 0.8; font-weight: 700;">📄 VIEW ACTIVE INVOICE BLUEPRINT</a>`;
                footer.appendChild(blueprintLink);
            }
        }

        // --- DYNAMIC BACKGROUND VIDEO ---
        const videoContainer = document.getElementById('video-loop-container');
        if (videoContainer && companySettings.videoUrl && companySettings.videoUrl.trim() !== '') {
            const url = companySettings.videoUrl;
            const isYoutube = url.includes('youtube.com') || url.includes('youtu.be');
            const isDirect = url.includes('cloudinary.com') || url.endsWith('.mp4') || url.endsWith('.webm');

            if (isYoutube) {
                let vidId = '';
                if (url.includes('v=')) vidId = url.split('v=')[1].split('&')[0];
                else if (url.includes('be/')) vidId = url.split('be/')[1].split('?')[0];
                else if (url.includes('embed/')) vidId = url.split('embed/')[1].split('?')[0];
                
                if (vidId) {
                    videoContainer.innerHTML = `
                        <iframe style="width: 100%; height: 100%; border: none; opacity: 0.8; pointer-events: none;" 
                            src="https://www.youtube.com/embed/${vidId}?autoplay=1&mute=1&loop=1&playlist=${vidId}&controls=0&showinfo=0&rel=0&modestbranding=1" 
                            allow="autoplay; encrypted-media"></iframe>
                        <div style="position: absolute; bottom: 5px; left: 8px; font-size: 0.55rem; color: #fff; background: rgba(0,0,0,0.7); padding: 2px 6px; border-radius: 3px; letter-spacing: 1px; font-weight: 700;">EMYRIS LIVE SERIES</div>
                    `;
                }
            } else if (isDirect) {
                videoContainer.innerHTML = `
                    <video autoplay muted loop playsinline style="width: 100%; height: 100%; object-fit: cover; opacity: 0.8;">
                        <source src="${url}" type="video/mp4">
                    </video>
                    <div style="position: absolute; bottom: 5px; left: 8px; font-size: 0.55rem; color: #fff; background: rgba(0,0,0,0.7); padding: 2px 6px; border-radius: 3px; letter-spacing: 1px; font-weight: 700;">EMYRIS LIVE SERIES</div>
                `;
            }
        }

        // --- MARQUEE LOGIC ---
        if (companySettings.scrollingMessage && companySettings.scrollingMessage.text) {
            const m = document.getElementById('marquee');
            const mc = document.getElementById('marquee-content');
            if (m && mc) {
                m.classList.remove('hidden');
                m.style.background = companySettings.scrollingMessage.color || 'var(--primary)';
                mc.innerText = companySettings.scrollingMessage.text;
                mc.style.animationDuration = `${companySettings.scrollingMessage.speed || 30}s`;
            }
            const lm = document.getElementById('land-marquee');
            const lmc = document.getElementById('land-marquee-content');
            if (lm && lmc) {
                lm.style.background = companySettings.scrollingMessage.color || 'rgba(99, 102, 241, 0.15)';
                lmc.innerText = companySettings.scrollingMessage.text;
                lmc.style.animationDuration = `${companySettings.scrollingMessage.speed || 30}s`;
            }
        }

        // --- MUSIC LOGIC ---
        if (companySettings.musicUrl && companySettings.musicUrl.trim() !== '') {
            const audio = document.getElementById('bgMusic');
            if (audio) {
                const targetSrc = companySettings.musicUrl.startsWith('http') ? companySettings.musicUrl : window.location.origin + companySettings.musicUrl;
                if (audio.src !== targetSrc) {
                    audio.src = targetSrc;
                    audio.load();
                }
                if (companySettings.musicVolume !== undefined) audio.volume = companySettings.musicVolume;
                if (localStorage.getItem('emyris_music_on') === 'true' && audio.paused) {
                    audio.play().catch(() => {});
                }
            }
        }
    } catch (e) { console.error("❌ [SETTINGS] Load failed:", e); }
}


async function loadMasters() {
    try {
        const res = await fetch(`${API_BASE}/categories`);
        const catsMaster = await res.json();
        
        // Combine categories from master and existing products to ensure nothing is missed
        const catSet = new Set(catsMaster.map(c => c.name.toUpperCase()));
        allProducts.forEach(p => {
            if (p.category) catSet.add(p.category.toUpperCase());
        });

        const container = document.getElementById('categoryChips');
        if (!container) return;
        
        const uniqueCats = ['ALL', ...Array.from(catSet).sort()];
        container.innerHTML = uniqueCats.map(c => {
            let icon = '📦';
            if (c === 'ALL') icon = '🌍';
            else if (c.includes('SYRUP')) icon = '🧪';
            else if (c.includes('TABLET')) icon = '💊';
            else if (c.includes('CAPSULE')) icon = '💊';
            else if (c.includes('INJECTION')) icon = '💉';
            else if (c.includes('PROTEIN')) icon = '💪';
            else if (c.includes('ANTIBIOTIC')) icon = '🦠';
            else if (c.includes('ANTIFUNGAL')) icon = '🍄';

            return `
                <div class="cat-chip ${c === currentCat ? 'active' : ''}" onclick="filterCat('${c}', this)">
                    <span class="cat-icon">${icon}</span> ${c}
                </div>
            `;
        }).join('');
    } catch (e) { console.error("Load masters failed", e); }
}

async function fetchProducts() {
    try {
        const res = await fetch(`${API_BASE}/products`);
        const data = await res.json();
        allProducts = data.map(p => ({ ...p, _id: p._id || p.id }));
    } catch (e) { console.error("Fetch products failed"); }
}

function filterCat(cat, el) {
    document.querySelectorAll('.cat-chip').forEach(c => c.classList.remove('active'));
    el.classList.add('active');
    currentCat = cat;
    
    // Clear search input when clicking a category chip
    const searchInput = document.getElementById('productSearch');
    if (searchInput) {
        searchInput.value = '';
        currentSearch = '';
    }
    
    renderExcelProducts();
}

function searchProducts(query) {
    currentSearch = query.toLowerCase().trim();
    
    // Reset category chip to ALL when typing in search
    if (currentSearch !== '') {
        currentCat = 'ALL';
        document.querySelectorAll('.cat-chip').forEach(c => {
            if (c.innerText.toUpperCase() === 'ALL' || c.innerText.toUpperCase() === 'ALL PRODUCTS') {
                c.classList.add('active');
            } else {
                c.classList.remove('active');
            }
        });
    }
    
    renderExcelProducts();
}

function renderExcelProducts() {
    const tbody = document.getElementById('excelProductBody');
    if (!tbody) return;

    let filtered = allProducts || [];
    
    // 1. Apply Category Filter
    if (currentCat !== 'ALL') {
        filtered = filtered.filter(p => p.category && p.category.toString().toUpperCase().trim() === currentCat.toUpperCase().trim());
    }
    
    // 2. Apply Search Filter (Name, HSN, or Category)
    if (currentSearch) {
        filtered = filtered.filter(p => 
            (p.name && p.name.toLowerCase().includes(currentSearch)) || 
            (p.hsn && p.hsn.toString().toLowerCase().includes(currentSearch)) ||
            (p.category && p.category.toString().toLowerCase().includes(currentSearch))
        );
    }

    tbody.innerHTML = filtered.map(p => {
        const pId = p._id || p.id;
        const qty = cart[pId] || '';
        const locked = currentUser?.negotiatedPrices?.find(n => (n.productId == pId || n.product == pId) && new Date(n.expiryDate) > new Date());
        
        const masterRate = parseFloat(p.pts || 0);
        const currentRate = askingRates[pId] !== undefined ? parseFloat(askingRates[pId]) : (locked ? parseFloat(locked.lockedRate || 0) : masterRate);
        const note = negotiationNotes[pId] || (locked ? locked.note : '');
        
        const totalVal = Number(qty || 0) * currentRate;
        const totalFormatted = totalVal.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2});
        
        const isWarning = currentRate < masterRate;
        const free = manualBonuses[pId] !== undefined ? manualBonuses[pId] : (p.bonusScheme && qty >= p.bonusScheme.buy ? Math.floor(qty / p.bonusScheme.buy) * p.bonusScheme.get : 0);

        return `
            <tr id="row-${pId}">
                <td>
                    <div class="${isWarning ? 'price-warning' : ''}" style="font-weight: 800; color: ${isWarning ? '#f59e0b' : 'var(--primary)'};">${p.name}</div>
                    <div style="font-size: 0.65rem; color: var(--text-muted); text-transform: uppercase;">${p.category || 'GENERAL'}</div>
                </td>
                <td style="text-align: center; font-weight: 700; color: #fff; font-size: 0.8rem;">${p.packing || '-'}</td>
                <td style="font-family: monospace; text-align: center; color: #cbd5e1;">${p.hsn || '-'}</td>
                <td style="text-align: right; color: #ffffff;">₹${p.mrp}</td>
                <td style="text-align: right; color: #94a3b8;">₹${p.ptr || '-'}</td>
                <td style="text-align: center;">
                    <input type="number" class="negotiation-input ${isWarning ? 'price-warning' : ''}" 
                        value="${currentRate}" 
                        oninput="updateRate('${pId}', this.value, ${masterRate})"
                        title="Master PTS: ₹${masterRate}">
                </td>
                <td style="text-align: center;">
                    <input type="text" class="note-input" 
                        value="${note}" 
                        placeholder="Auth Details..."
                        oninput="updateNote('${pId}', this.value)">
                </td>
                <td style="text-align: center; color: #ffffff; font-weight: 600;">${p.gstPercent}%</td>
                <td style="text-align: center;">
                    <input type="number" class="qty-input" value="${qty}" min="0" step="1"
                        oninput="updateCart('${pId}', this.value, this)" 
                        style="width: 80px; padding: 0.5rem; border: 1px solid var(--border); border-radius: 8px; text-align: center; font-weight: 700;">
                </td>
                <td style="text-align: center;">
                    <input type="number" class="bonus-input" value="${free}" min="0" step="1"
                        id="bonus-${pId}"
                        oninput="updateBonus('${pId}', this.value)"
                        style="width: 70px; padding: 0.5rem; border: 1px solid var(--border); border-radius: 8px; text-align: center; font-weight: 700; color: #10b981;">
                </td>
                <td style="text-align: right;" class="total-cell" id="total-${pId}">₹${totalFormatted}</td>
            </tr>
        `;
    }).join('');
}

function updateRate(id, val, master) {
    const rate = parseFloat(val) || 0;
    askingRates[id] = rate;
    
    // Direct DOM update instead of full re-render
    const input = document.querySelector(`#row-${id} .negotiation-input`);
    const totalEl = document.getElementById(`total-${id}`);
    const qty = cart[id] || 0;
    
    if (input) {
        if (rate < master) input.classList.add('price-warning');
        else input.classList.remove('price-warning');
    }
    
    if (totalEl) {
        const formattedTotal = (qty * rate).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2});
        totalEl.innerText = `₹${formattedTotal}`;
    }
    updateFooter();
}

function updateNote(id, val) {
    negotiationNotes[id] = val;
}

function updateCart(pid, qty, inputEl) {
    qty = parseInt(qty) || 0;
    if (qty < 0) {
        qty = 0;
        if (inputEl) inputEl.value = 0;
    }
    const p = allProducts.find(x => (x._id || x.id) == pid);
    if (!p) {
        console.warn("⚠️ Product not found in catalog:", pid);
        return;
    }

    if (qty > 0) cart[pid] = qty;
    else {
        delete cart[pid];
        delete manualBonuses[pid];
    }

    // --- SMART PRICING LOGIC ---
    // Use the same priority as the final order: Negotiated > Locked > Master
    const locked = currentUser?.negotiatedPrices?.find(n => (n.productId == (p._id || p.id) || n.product == (p._id || p.id)) && new Date(n.expiryDate) > new Date());
    const rate = parseFloat(askingRates[pid] !== undefined ? askingRates[pid] : (locked ? (locked.lockedRate || 0) : (p.pts || p.ptr || 0)));

    const rowTotal = (Number(qty || 0) * Number(rate || 0)).toFixed(2);
    const totalEl = document.getElementById(`total-${pid}`);
    if (totalEl) {
        totalEl.innerText = `₹${parseFloat(rowTotal).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    }
    
    // Auto-calculate Bonus if not manually edited
    if (manualBonuses[pid] === undefined) {
        const free = p.bonusScheme && qty >= p.bonusScheme.buy ? Math.floor(qty / p.bonusScheme.buy) * p.bonusScheme.get : 0;
        const bonusEl = document.getElementById(`bonus-${pid}`);
        if (bonusEl) bonusEl.value = free;
    }

    // Highlight row if qty > 0
    const row = document.getElementById(`row-${pid}`);
    if (row) row.style.background = qty > 0 ? 'rgba(99, 102, 241, 0.05)' : 'transparent';
    
    if (inputEl) {
        inputEl.style.borderColor = qty > 0 ? 'var(--primary)' : 'var(--border)';
    }

    updateFooter();
}

function updateBonus(pid, bonusQty) {
    bonusQty = parseInt(bonusQty) || 0;
    manualBonuses[pid] = bonusQty;
    
    // Visual feedback for manual edit
    const bonusEl = document.getElementById(`bonus-${pid}`);
    if (bonusEl) {
        bonusEl.style.borderColor = '#10b981';
        bonusEl.style.background = '#f0fdf4';
    }
    updateFooter();
}

function updateFooter() {
    let taxableValue = 0;
    let gstTotal = 0;
    let itemCount = 0;

    Object.keys(cart).forEach(pid => {
        const p = allProducts.find(x => (x._id || x.id) == pid);
        if (!p) return;

        const qty = cart[pid];
        
        // Use Negotiated Rate for Calculations
        const locked = currentUser?.negotiatedPrices?.find(n => (n.productId == (p._id || p.id) || n.product == (p._id || p.id)) && new Date(n.expiryDate) > new Date());
        const rate = parseFloat(askingRates[pid] !== undefined ? askingRates[pid] : (locked ? (locked.lockedRate || 0) : (p.pts || p.ptr || 0)));
        
        const itemVal = Number(qty || 0) * rate;
        const itemGst = Number(((itemVal * parseFloat(p.gstPercent || 12)) / 100).toFixed(2));
        
        taxableValue += itemVal;
        gstTotal += itemGst;
        itemCount++;
    });

    const netAmount = Number(taxableValue || 0) + Number(gstTotal || 0);
    const grandTotal = Math.round(netAmount) || 0;
    const roundOff = (Number(grandTotal) - Number(netAmount)).toFixed(2);

    // Update UI elements
    const taxableEl = document.getElementById('footer-subtotal');
    const gstEl = document.getElementById('footer-gst');
    const roundEl = document.getElementById('footer-roundoff');
    const netEl = document.getElementById('footer-net');
    const totalEl = document.getElementById('footer-total');

    if (taxableEl) taxableEl.innerText = `₹${(taxableValue || 0).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    if (gstEl) gstEl.innerText = `₹${(gstTotal || 0).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    if (roundEl) roundEl.innerText = `₹${roundOff}`;
    if (netEl) netEl.innerText = `₹${(netAmount || 0).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    if (totalEl) totalEl.innerText = `₹${(grandTotal || 0).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;

    const footer = document.getElementById('orderFooter');
    if (footer) {
        if (itemCount > 0) footer.classList.remove('hidden');
        else footer.classList.add('hidden');
    }
}

async function placeOrder() {
    if (!currentUser) return alert("Session expired. Please login again.");

    const btn = document.querySelector('button[onclick="placeOrder()"]');
    if (!btn) return;
    const originalHtml = btn.innerHTML;

    // Validate negotiation notes
    for (const pid of Object.keys(cart)) {
        const p = allProducts.find(x => (x._id || x.id) == pid);
        const locked = currentUser?.negotiatedPrices?.find(n => (n.productId == (p._id || p.id) || n.product == (p._id || p.id)) && new Date(n.expiryDate) > new Date());
        const rate = parseFloat(askingRates[pid] !== undefined ? askingRates[pid] : (locked ? locked.lockedRate : (p.pts || p.ptr || 0)));
        
        if (rate < parseFloat(p.pts || 0) && !negotiationNotes[pid] && !(locked && locked.note)) {
            alert(`⚠️ MANDATORY: Please provide an 'Auth Note' for negotiated price on: ${p.name}`);
            return;
        }
    }

    const pids = Object.keys(cart);
    if(pids.length === 0) return alert("Please enter quantity for at least one product.");

    btn.disabled = true;
    btn.innerHTML = `⏳ PLACING ORDER...`;

    const orderItems = pids.map(pid => {
        const p = allProducts.find(x => (x._id || x.id) == pid);
        const qty = cart[pid];
        const locked = currentUser?.negotiatedPrices?.find(n => (n.productId == (p._id || p.id) || n.product == (p._id || p.id)) && new Date(n.expiryDate) > new Date());
        const rate = askingRates[pid] !== undefined ? askingRates[pid] : (locked ? locked.lockedRate : (p.pts || 0));
        
        return {
            productId: pid,
            name: p.name,
            qty: qty,
            bonusQty: manualBonuses[pid] !== undefined ? manualBonuses[pid] : (p.bonusScheme && qty >= p.bonusScheme.buy ? Math.floor(qty / p.bonusScheme.buy) * p.bonusScheme.get : 0),
            priceUsed: Number(rate) || 0,
            askingRate: askingRates[pid] !== undefined ? Number(askingRates[pid]) : Number(rate),
            masterRate: Number(p.pts) || 0,
            negotiationNote: negotiationNotes[pid] || (locked ? locked.note : ''),
            mrp: p.mrp,
            gstPercent: p.gstPercent || 12,
            hsn: p.hsn || '',
            totalValue: Number(qty * rate) || 0
        };
    });

    const subTotal = orderItems.reduce((a, b) => a + (Number(b.totalValue) || 0), 0);
    let gstAmt = 0;
    orderItems.forEach(item => {
        const p = allProducts.find(x => (x._id || x.id) == item.productId);
        const rate = Number(item.gstPercent || (p ? p.gstPercent : 0) || 0);
        gstAmt += Number(((Number(item.totalValue) || 0) * rate / 100).toFixed(2));
    });

    
    const orderData = {
        stockistId: currentUser._id,
        stockistCode: currentUser.loginId,
        items: orderItems,
        subTotal: Number(subTotal) || 0,
        gstAmount: Number(gstAmt) || 0,
        grandTotal: Math.round(subTotal + gstAmt) || 0,
        bonusApproval: {
            isManual: Object.keys(manualBonuses).length > 0
        }
    };

    try {
        const res = await fetch(`${API_BASE}/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });
        const result = await res.json();
        if (result.success) {
            alert(`✅ Order Placed Successfully! Order No: ${result.order.orderNo}`);
            cart = {};
            askingRates = {};
            negotiationNotes = {};
            renderExcelProducts();
            updateFooter();
            switchOrderTab('history');
        } else { alert(result.message); }
    } catch (e) { alert("Order submission failed."); }
    finally {
        btn.disabled = false;
        btn.innerHTML = originalHtml;
    }
}



async function fetchMyOrders() {
    try {
        const res = await fetch(`${API_BASE}/orders/my-orders/${currentUser._id}`);
        const orders = await res.json();
        myOrdersHistory = orders;
        renderMyOrders(orders);
    } catch (e) { console.error("Fetch orders failed", e); }
}

function renderMyOrders(orders) {
    const container = document.getElementById('history-container');
    if (!container) return;

    if (orders.length === 0) {
        container.innerHTML = `<div class="glass-card" style="text-align:center; color:var(--text-muted); padding: 3rem;">No orders found in your history.</div>`;
        return;
    }

    // Group by Month (Year-Month)
    const grouped = {};
    orders.forEach(o => {
        const date = new Date(o.createdAt);
        const monthYear = date.toLocaleString('default', { month: 'long', year: 'numeric' });
        if (!grouped[monthYear]) grouped[monthYear] = [];
        grouped[monthYear].push(o);
    });

    let html = '';
    for (const [month, list] of Object.entries(grouped)) {
        html += `
            <div style="margin-bottom: 3rem;">
                <h3 style="color:var(--primary); border-bottom: 1px solid var(--glass-border); padding-bottom: 0.5rem; margin-bottom: 1.5rem; font-size: 1.1rem; display: flex; align-items: center; gap: 10px;">
                    📅 ${month} <span style="font-size: 0.75rem; background: rgba(99, 102, 241, 0.1); padding: 2px 10px; border-radius: 20px; font-weight: 500;">${list.length} Orders</span>
                </h3>
                <div class="excel-container" style="border-radius: 16px;">
                    <table class="excel-table">
                        <thead>
                            <tr>
                                <th style="width: 180px;">Order Number</th>
                                <th style="width: 180px;">Placed Date & Time</th>
                                <th>Items Summary</th>
                                <th style="width: 120px; text-align: center;">Status</th>
                                <th style="width: 150px; text-align: right;">Grand Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${list.map(o => {
                                const dateObj = new Date(o.createdAt);
                                const dateStr = dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
                                const timeStr = dateObj.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: true });
                                
                                const itemsBrief = o.items.map(i => `${i.name} (${i.qty})`).join(', ');
                                const statusColor = o.status === 'invoiced' ? '#6366f1' : (o.status === 'approved' ? '#10b981' : (o.status === 'rejected' ? '#ef4444' : '#f59e0b'));
                                
                                return `
                                    <tr onclick="viewOrderDetails('${o._id}')" style="cursor: pointer; transition: all 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.03)'" onmouseout="this.style.background='transparent'">
                                        <td style="font-family: monospace; font-weight: 800; color: #fff;">${o.orderNo}</td>
                                        <td style="font-size: 0.8rem;">
                                            <div style="color: #fff; font-weight: 600;">${dateStr}</div>
                                            <div style="color: var(--text-muted); font-size: 0.7rem;">🕒 ${timeStr}</div>
                                        </td>
                                        <td style="font-size: 0.8rem; color: #cbd5e1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 400px;">
                                            ${itemsBrief}
                                        </td>
                                        <td style="text-align: center;">
                                            <span style="background: ${statusColor}15; color: ${statusColor}; border: 1px solid ${statusColor}30; padding: 4px 10px; border-radius: 8px; font-size: 0.65rem; font-weight: 800; text-transform: uppercase; display: inline-block;">
                                                ${o.status}
                                            </span>
                                        </td>
                                        <td style="text-align: right; font-weight: 900; color: var(--primary); font-size: 1rem;">
                                            ₹${Number(o.grandTotal || 0).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                        </td>

                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }
    container.innerHTML = html;
}

function handleLogout() {
    if (!confirm('Are you sure you want to log out from your secure session?')) return;
    
    // Clear Session Variables
    currentUser = null;
    cart = {};
    manualBonuses = {};
    askingRates = {};
    negotiationNotes = {};
    myOrdersHistory = [];

    // Reset UI
    renderExcelProducts();
    updateFooter();
    
    // Clear persistent storage
    localStorage.removeItem('emyris_user');
    
    // Redirect to home/auth
    window.location.href = '/';
    
    console.log('🚪 [LOGOUT] Session ended successfully');
}

// --- MUSIC LOGIC ---
var isMusicPlaying = false; 
function toggleMusic() {
    console.log('🎵 [MUSIC] Toggle clicked');
    const audio = document.getElementById('bgMusic');
    const btnLanding = document.getElementById('musicToggle');
    const btnMain = document.getElementById('musicToggleMain');
    
    if (!audio) return;

    const updateUI = (isPlaying) => {
        const text = isPlaying ? 'Music On' : 'Music Off';
        const icon = isPlaying ? '🔊' : '🔇';
        const border = isPlaying ? '#6366f1' : 'rgba(255,255,255,0.1)';
        const bg = isPlaying ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255,255,255,0.05)';
        const color = isPlaying ? '#6366f1' : '#fff';

        [btnLanding, btnMain].forEach(btn => {
            if (btn) {
                btn.style.borderColor = border;
                btn.style.background = bg;
                btn.style.color = color;
                const iconEl = btn.querySelector('span');
                if (iconEl) iconEl.innerText = icon;
                const textEl = btn.querySelector('span:nth-child(2)');
                if (textEl) textEl.innerText = text;
            }
        });
    };

    if (audio.paused) {
        audio.volume = 0.15;
        audio.play().then(() => {
            isMusicPlaying = true;
            localStorage.setItem('emyris_music_on', 'true');
            updateUI(true);
            console.log('✅ [MUSIC] Playing...');
        }).catch(e => {
            console.warn("🎵 [MUSIC] Playback blocked by browser policy. Interaction required.");
            updateUI(false);
        });

    } else {
        audio.pause();
        isMusicPlaying = false;
        localStorage.setItem('emyris_music_on', 'false');
        updateUI(false);
        console.log('⏸️ [MUSIC] Paused');
    }
}







function viewOrderDetails(orderId) {
    const o = myOrdersHistory.find(x => x._id == orderId);
    if (!o) {
        console.error("❌ Order not found in history:", orderId);
        return;
    }
    currentViewOrderId = orderId;
    console.log("📂 Opening Order/Invoice Details:", orderId, o);
    
    document.getElementById('detail-order-no').innerText = o.status === 'invoiced' ? `Invoice Details (${o.orderNo})` : `Order Details (${o.orderNo})`;
    document.getElementById('detail-date').innerText = `Placed on ${new Date(o.createdAt).toLocaleString('en-GB')}`;
    
    const statusEl = document.getElementById('detail-status');
    statusEl.innerText = o.status.toUpperCase();
    statusEl.style.color = o.status === 'invoiced' ? '#6366f1' : (o.status === 'approved' ? '#10b981' : (o.status === 'rejected' ? '#ef4444' : '#f59e0b'));

    const dlBtn = document.getElementById('btn-download-invoice');
    if (o.status === 'invoiced' && dlBtn) dlBtn.classList.remove('hidden');
    else if (dlBtn) dlBtn.classList.add('hidden');

    document.getElementById('detail-item-count').innerText = `${o.items.length} Items`;

    const body = document.getElementById('detail-items-body');
    body.innerHTML = o.items.map(i => {
        const requested = i.askingRate || i.masterRate || i.priceUsed;
        const approved = i.priceUsed;
        const gstPct = parseFloat(i.gstPercent) || 12;
        const lineTotal = Number(approved) * Number(i.qty) * (1 + gstPct / 100);
        
        return `
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.05); transition: 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.02)'" onmouseout="this.style.background='transparent'">
                <td style="padding: 1rem 1.25rem; font-weight: 700; color: #fff; font-size: 0.9rem;">${i.name}</td>
                <td style="padding: 1rem 1.25rem; text-align: right; color: var(--text-muted); font-size: 0.85rem;">₹${requested.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                <td style="padding: 1rem 1.25rem; text-align: right; color: var(--accent); font-weight: 800; font-size: 0.9rem;">₹${approved.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                <td style="padding: 1rem 1.25rem; text-align: center; font-weight: 800; color: #fff; font-size: 0.9rem;">${i.qty}</td>
                <td style="padding: 1rem 1.25rem; text-align: center; color: var(--accent); font-weight: 700; font-size: 0.9rem;">+${i.bonusQty || 0}</td>
                <td style="padding: 1rem 1.25rem; text-align: center; color: #fff; font-weight: 700; font-size: 0.9rem;">${gstPct}%</td>
                <td style="padding: 1rem 1.25rem; text-align: right; font-weight: 900; color: #fff; font-size: 0.95rem;">₹${lineTotal.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
            </tr>
        `;
    }).join('');

    const safeSubTotal = Number(o.subTotal || 0);
    const safeGstAmount = Number(o.gstAmount || 0);
    const safeGrandTotal = Number(o.grandTotal || 0);

    const unroundedTotal = Number((safeSubTotal + safeGstAmount).toFixed(2));
    const roundOffValue = (safeGrandTotal - unroundedTotal).toFixed(2);

    document.getElementById('detail-subtotal').innerText = `₹${safeSubTotal.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    document.getElementById('detail-gst').innerText = `₹${safeGstAmount.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    document.getElementById('detail-roundoff').innerText = `₹${roundOffValue}`;
    document.getElementById('detail-total').innerText = `₹${safeGrandTotal.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;


    document.getElementById('orderDetailModal').style.display = 'flex';
}

function closeOrderModal() {
    document.getElementById('orderDetailModal').style.display = 'none';
    currentViewOrderId = null;
}

async function downloadStockistInvoice() {
    if (!currentViewOrderId) return;
    try {
        const btn = document.getElementById('btn-download-invoice');
        if (btn) {
            btn.innerText = "⏳ Generating...";
            btn.disabled = true;
        }

        const res = await fetch(`${API_BASE}/stockist/orders/${currentViewOrderId}/invoice`);
        const data = await res.json();
        
        if (!data.success || !data.invoice) {
            alert("Could not load invoice data: " + (data.message || 'Unknown error'));
            if (btn) { btn.innerText = "📄 Download Invoice"; btn.disabled = false; }
            return;
        }

        await generateInvoicePDF(data.invoice);
        
        if (btn) {
            btn.innerText = "✅ Downloaded";
            setTimeout(() => { btn.innerText = "📄 Download Invoice"; btn.disabled = false; }, 2000);
        }
    } catch (e) {
        console.error(e);
        alert("Download failed.");
        const btn = document.getElementById('btn-download-invoice');
        if (btn) { btn.innerText = "📄 Download Invoice"; btn.disabled = false; }
    }
}

async function generateInvoicePDF(inv) {
    if (companySettings?.invoiceStyle === 'sample') {
        return await generateSampleMatchedPDF(inv);
    }

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
        let out = '';
        let i = 0;
        while (integer > 0) {
            let group = (i === 0) ? integer % 1000 : integer % 100;
            integer = (i === 0) ? Math.floor(integer / 1000) : Math.floor(integer / 100);
            if (group > 0) out = makeGroup(group) + (g[i] ? g[i] + ' ' : '') + out;
            i++;
        }
        let final = 'Rupees ' + out.trim();
        if (fraction > 0) final += ' and ' + fraction + '/100 Paise';
        return final + ' Only';
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');
    const style = companySettings?.invoiceStyle || 'classic';

    doc.setFont("helvetica");
    if (style === 'modern') {
        doc.setFillColor(99, 102, 241);
        doc.rect(0, 0, 210, 40, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.text("TAX INVOICE", 105, 20, { align: 'center' });
        doc.setFontSize(10);
        doc.text(`${companySettings?.name || 'COMPANY NAME'}`, 105, 30, { align: 'center' });
        doc.setTextColor(40, 44, 52);
    } else {
        doc.setFontSize(12);
        doc.setTextColor(99, 102, 241);
        doc.setFont("helvetica", "bold");
        doc.text("TAX INVOICE", 105, 10, { align: 'center' });
        doc.setDrawColor(99, 102, 241);
        doc.line(105, 15, 105, 65); 
        if (companySettings?.logoImage) doc.addImage(companySettings.logoImage, 'PNG', 15, 8, 30, 15);
        doc.setFontSize(10);
        doc.text(companySettings?.name || "COMPANY NAME", 15, 28);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        const addr = doc.splitTextToSize(companySettings?.address || "Address Not Configured", 80);
        doc.text(addr, 15, 33);
        let currY = 33 + (addr.length * 4);
        doc.text(`DL No: ${companySettings?.dlNo || 'N/A'} | GSTIN: ${companySettings?.gstNo || 'N/A'}`, 15, currY);
    }

    const party = currentUser || {};
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(99, 102, 241);
    doc.text("BILL TO:", 115, 15);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(40, 44, 52);
    doc.text(inv.stockistName || 'N/A', 115, 20);
    const sAddr = doc.splitTextToSize(party.address || 'N/A', 80);
    doc.text(sAddr, 115, 25);
    let sY = 25 + (sAddr.length * 4);
    doc.text(`GSTIN: ${party.gst || 'N/A'}`, 115, sY);
    doc.setFont("helvetica", "bold");
    doc.text(`Invoice No: ${inv.invoiceNo} | Date: ${new Date(inv.createdAt).toLocaleDateString('en-GB')}`, 15, 65);

    doc.autoTable({
        startY: 70,
        head: [['S.No', 'Product', 'Batch', 'MRP', 'Qty', 'Price', 'Taxable', 'GST%', 'Total']],
        body: inv.items.map((item, idx) => {
            const price = Number(item.priceUsed) || 0;
            const taxable = Number(item.totalValue) || 0;
            const rate = Number(item.gstPercent) || 0;
            const total = taxable + (taxable * rate / 100);
            return [
                idx + 1, item.name, item.batch || '-', (Number(item.mrp) || 0).toFixed(2), item.qty, 
                price.toFixed(2), taxable.toFixed(2), rate + '%', 
                total.toFixed(2)
            ];
        }),

        theme: 'grid',
        headStyles: { fillColor: [99, 102, 241], fontSize: 7, halign: 'center' },
        styles: { fontSize: 7, cellPadding: 2 },
        margin: { left: 15, right: 15, bottom: 60 }
    });

    const tableFinalY = doc.lastAutoTable.finalY + 5;

    // Per-rate GST breakdown (CGST/SGST or IGST)
    const taxMap = {};
    let totalTaxable = 0, totalGST = 0;
    inv.items.forEach(it => {
        const rate = parseFloat(it.gstPercent) || 0;
        const taxable = it.qty * (it.priceUsed || it.price || 0);
        const gst = (taxable * rate) / 100;
        if (!taxMap[rate]) taxMap[rate] = { taxable: 0, tax: 0 };
        taxMap[rate].taxable += taxable;
        taxMap[rate].tax += gst;
        totalTaxable += taxable;
        totalGST += gst;
    });
    const companyGST = companySettings?.gstNo || '';
    const buyerGST = party.gstNo || party.gst || '';
    const isInterstate = buyerGST.length > 2 && companyGST.length > 2 && companyGST.substring(0, 2) !== buyerGST.substring(0, 2);
    let taxBody = [];
    Object.keys(taxMap).sort((a,b)=>a-b).forEach(r => {
        const rate = parseFloat(r), d = taxMap[r];
        if (isInterstate) { taxBody.push([`IGST @ ${rate}%`, d.taxable.toFixed(2), `${rate}%`, d.tax.toFixed(2)]); }
        else {
            const hR = (rate/2).toFixed(1), hT = (d.tax/2).toFixed(2);
            taxBody.push([`CGST @ ${hR}%`, d.taxable.toFixed(2), `${hR}%`, hT]);
            taxBody.push([`SGST @ ${hR}%`, d.taxable.toFixed(2), `${hR}%`, hT]);
        }
    });

    doc.autoTable({
        startY: tableFinalY,
        head: [['Tax Summary', 'Taxable', 'Rate', 'Tax Amount']],
        body: taxBody,
        theme: 'plain',
        headStyles: { fillColor: false, textColor: [99, 102, 241], fontStyle: 'bold', fontSize: 7, halign: 'right' },
        styles: { fontSize: 7, halign: 'right', cellPadding: 1 },
        margin: { left: 110, right: 15 },
        tableWidth: 85
    });

    const finalY = 240;
    doc.setDrawColor(99, 102, 241); doc.setLineWidth(0.5); doc.line(15, finalY - 15, 195, finalY - 15);
    doc.setFont("helvetica", "bold"); doc.setTextColor(99, 102, 241); doc.setFontSize(9);
    doc.text("Amount in Words:", 15, finalY - 10);
    doc.setTextColor(40, 44, 52); doc.setFont("helvetica", "normal");
    const totalVal = Number(inv.grandTotal) || 0;
    doc.text("(" + numberToWords(totalVal) + ")", 15, finalY + 5);

    const unroundedNet = Number((totalTaxable + totalGST).toFixed(2));
    const roundOffValue = (totalVal - unroundedNet).toFixed(2);
    doc.setFontSize(9); doc.setFont("helvetica", "normal"); doc.setTextColor(40, 44, 52);
    doc.text(`Sub Total (Taxable): Rs. ${totalTaxable.toLocaleString('en-IN', {minimumFractionDigits:2})}`, 195, finalY - 10, { align: 'right' });
    doc.text(`GST Amount: Rs. ${totalGST.toLocaleString('en-IN', {minimumFractionDigits:2})}`, 195, finalY - 5, { align: 'right' });
    doc.text(`Round Off: Rs. ${roundOffValue}`, 195, finalY, { align: 'right' });
    doc.setFont("helvetica", "bold"); doc.setTextColor(99, 102, 241);
    doc.text(`NET PAYABLE: Rs. ${totalVal.toLocaleString('en-IN', {minimumFractionDigits:2})}`, 195, finalY + 5, { align: 'right' });


    // Bank Details & QR
    if (companySettings?.invoiceBankVisible !== false && companySettings?.bankDetails) {
        doc.setTextColor(0, 0, 0);
        doc.setFont("courier", "bold"); doc.setFontSize(8);
        doc.text("Bank Details:", 15, finalY + 15);
        doc.setFont("courier", "normal");
        companySettings.bankDetails.split('\n').forEach((line, i) => doc.text(line, 15, finalY + 19 + (i * 4)));
        let upiTarget = companySettings.upiId;
        if (!upiTarget && companySettings.bankAccountNo && companySettings.bankIfsc)
            upiTarget = `${companySettings.bankAccountNo}@${companySettings.bankIfsc.toUpperCase().trim()}.ifsc.npci`;
        if (upiTarget && window.QRCode) {
            try {
                const upiUrl = `upi://pay?pa=${upiTarget}&pn=${encodeURIComponent(companySettings.name||'EMYRIS')}&am=${Math.round(inv.grandTotal)}&cu=INR`;
                const qrDataUrl = await QRCode.toDataURL(upiUrl, { width: 150, margin: 1 });
                doc.addImage(qrDataUrl, 'PNG', 100, finalY + 10, 30, 30);
                doc.setFontSize(6); doc.text("Scan to Pay", 115, finalY + 42, { align: 'center' });
            } catch(err) { console.error("QR Error:", err); }
        }
    }
    // Terms & Conditions
    doc.setFontSize(8); doc.setFont("helvetica", "italic"); doc.setTextColor(0, 0, 0);
    const tConds = (companySettings?.invoiceTerms || companySettings?.termsConditions || "1. Goods once sold will not be taken back. 2. Subject to local Jurisdiction.").split('\n');
    tConds.forEach((line, i) => doc.text(line, 15, 280 + (i * 4)));
    // Signatory
    doc.setFont("helvetica", "bold"); doc.setTextColor(40, 44, 52);
    doc.text(`For ${companySettings?.name || "EMYRIS BIOLIFESCIENCES"}`, 195, finalY + 30, { align: 'right' });
    if (companySettings?.signatureImage) { try { doc.addImage(companySettings.signatureImage, 'JPEG', 165, finalY + 32, 30, 10); } catch(e){} }
    doc.setFont("helvetica", "normal");
    doc.text("Authorised Signatory", 195, finalY + 45, { align: 'right' });

    doc.save(`Invoice_${inv.invoiceNo}.pdf`);
}

// --- INITIALIZATION TRIGGER ---
document.addEventListener('DOMContentLoaded', () => {
    // Initial UI check
    if (!localStorage.getItem('emyris_user')) {
        switchView('login');
    }
});


// Resilient Media Handling: Ensure music/video doesn't stop on layout shifts
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        // Only resume if it was already playing
        if (localStorage.getItem('emyris_music_on') === 'true') {
            const audio = document.getElementById('bgMusic');
            if (audio && audio.paused) {
                audio.play().catch(() => {});
            }
        }
    }, 250); // Debounce
});


function startMusic() {
    const audio = document.getElementById('bgMusic');
    if (!audio || !audio.src) return;
    // Only attempt auto-start if music should be playing (state is true)
    if (isMusicPlaying && audio.paused) {
        audio.play().catch(e => {
            console.warn("Music start blocked by browser policies.");
        });
    }
}



/**
 * AI-DRIVEN COORDINATE ENGINE (SYNCED FROM ADMIN)
 */
async function generateSampleMatchedPDF(inv) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');
    const filename = `Invoice_${inv.invoiceNo}.pdf`;

    // Helper: numberToWords (Copied from generateInvoicePDF)
    const numberToWords = (num) => {
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
        let out = '';
        let i = 0;
        while (integer > 0) {
            let group = (i === 0) ? integer % 1000 : integer % 100;
            integer = (i === 0) ? Math.floor(integer / 1000) : Math.floor(integer / 100);
            if (group > 0) out = makeGroup(group) + (g[i] ? g[i] + ' ' : '') + out;
            i++;
        }
        let final = 'Rupees ' + out.trim();
        if (fraction > 0) final += ' and ' + fraction + '/100 Paise';
        return final + ' Only';
    };

    let headerY = 15;
    if (companySettings?.logoImage) {
        try {
            const format = companySettings.logoImage.toLowerCase().includes('png') ? 'PNG' : 'JPEG';
            // Wider logo as requested (40x22), moved slightly left
            doc.addImage(companySettings.logoImage, format, 12, headerY - 3, 40, 22);
        } catch(e){}
    }

    // Company Name & Details - Shifted Right to accommodate wider logo
    const headerX = 58; 
    doc.setFont("helvetica", "bold"); doc.setFontSize(18); doc.setTextColor(0);
    doc.text(companySettings?.name || "EMYRIS BIOLIFESCIENCES", headerX, headerY + 5);
    
    doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(60);
    const coAddr = companySettings?.address || "Office Address Here";
    const addrLines = doc.splitTextToSize(coAddr, 140);
    doc.text(addrLines, headerX, headerY + 10);
    
    let infoY = headerY + 10 + (addrLines.length * 4);
    doc.setFontSize(8);
    doc.text(`GSTIN: ${companySettings?.gstNo || 'N/A'} | DL No: ${companySettings?.dlNo || 'N/A'}`, headerX, infoY);
    doc.text(`Contact: ${companySettings?.phones?.[0] || 'N/A'} | Email: ${companySettings?.emails?.[0] || 'N/A'}`, headerX, infoY + 4);

    const themeHex = companySettings?.themeColor || '#6366f1';
    const r = parseInt(themeHex.slice(1, 3), 16);
    const g = parseInt(themeHex.slice(3, 5), 16);
    const b = parseInt(themeHex.slice(5, 7), 16);
    const themeRgb = [r, g, b];

    doc.setDrawColor(themeRgb[0], themeRgb[1], themeRgb[2]); doc.setLineWidth(0.5); doc.line(10, infoY + 6, 200, infoY + 6);
    
    // Right Top Label below border line
    doc.setFontSize(7); doc.setFont("helvetica", "normal");
    doc.text("Original Inv. for Buyer", 200, 14, { align: 'right' });

    // TAX INVOICE LABEL - Clean Bold Design (No Box)
    doc.setTextColor(0);
    doc.setFontSize(12); doc.setFont("helvetica", "bold");
    doc.text("TAX INVOICE", 200, infoY + 12, { align: 'right' });
    doc.setTextColor(0);
    
    doc.setFontSize(9); doc.setFont("helvetica", "normal");
    doc.text(`Invoice No:`, 145, 50); doc.setFont("helvetica", "bold"); doc.text(inv.invoiceNo, 170, 50);
    doc.setFont("helvetica", "normal"); doc.text(`Date:`, 145, 55); doc.setFont("helvetica", "bold"); doc.text(new Date(inv.createdAt).toLocaleDateString('en-GB'), 170, 55);
    
    doc.setFontSize(9); doc.setFont("helvetica", "normal");
    doc.text("M/s:", 15, 50); 
    doc.setFont("helvetica", "bold"); doc.setFontSize(10);
    doc.text(inv.stockistName || 'N/A', 25, 50);
    doc.setFont("helvetica", "normal"); doc.setFontSize(8);
    const pAddrLines = doc.splitTextToSize(currentUser?.address || 'N/A', 80);
    doc.text(pAddrLines, 25, 55);
    
    let partyBottomY = 55 + (pAddrLines.length * 4);
    doc.text(`GSTIN: ${currentUser?.gst || 'N/A'}`, 25, partyBottomY + 2);
    doc.text(`DL No: ${currentUser?.dl || 'N/A'}`, 25, partyBottomY + 6);

    doc.autoTable({
        startY: 85,
        head: [['Sn', 'HSN', 'Description', 'Batch', 'Exp', 'MRP', 'Qty', 'Free', 'Rate', 'GST%', 'Amount']],
        body: inv.items.map((it, idx) => [
            idx + 1, it.hsn || '-', it.name, it.batch || '-', it.expDate || it.exp || it.expiry || '-', 
            (it.mrp || 0).toFixed(2), it.qty, it.bonusQty || 0, 
            (it.priceUsed || it.rate || 0).toFixed(2), (it.gstPercent || 0) + '%', 
            (it.qty * (it.priceUsed || it.rate || 0)).toFixed(2)
        ]),
        theme: 'grid',
        headStyles: { fillColor: themeRgb, textColor: 255, fontStyle: 'bold', fontSize: 7, halign: 'center', lineWidth: 0.1 },
        styles: { fontSize: 7, cellPadding: 1.5, textColor: 0, lineWidth: 0.1, lineColor: themeRgb },
        columnStyles: {
            0: { cellWidth: 8, halign: 'center' },
            1: { cellWidth: 15, halign: 'center' },
            2: { cellWidth: 'auto' },
            5: { halign: 'right' },
            6: { halign: 'center' },
            7: { halign: 'center' },
            8: { halign: 'right' },
            9: { halign: 'center' },
            10: { halign: 'right', fontStyle: 'bold' }
        },
        margin: { left: 10, right: 10, bottom: 60 }
    });

    let tableFinalY = doc.lastAutoTable.finalY + 5;

    const taxMap = {};
    let totalTaxable = 0; let totalGST = 0;
    inv.items.forEach(it => {
        const rate = parseFloat(it.gstPercent) || 0;
        const taxable = it.qty * it.priceUsed;
        const gst = (taxable * rate) / 100;
        if (!taxMap[rate]) taxMap[rate] = { taxable: 0, tax: 0 };
        taxMap[rate].taxable += taxable;
        taxMap[rate].tax += gst;
        totalTaxable += taxable; totalGST += gst;
    });

    const isInter = (currentUser?.gstNo || currentUser?.gst) && companySettings?.gstNo && companySettings.gstNo.substring(0,2) !== (currentUser.gstNo || currentUser.gst).substring(0,2);
    let taxBody = [];
    Object.keys(taxMap).sort((a,b)=>a-b).forEach(r => {
        const rate = parseFloat(r); const d = taxMap[r];
        if (isInter) { taxBody.push([`${rate}%`, d.taxable.toFixed(2), '0.00', '0.00', d.tax.toFixed(2)]); }
        else {
            const hT = (d.tax / 2).toFixed(2);
            taxBody.push([`${rate}%`, d.taxable.toFixed(2), hT, hT, d.tax.toFixed(2)]);
        }
    });

    doc.setFontSize(7); doc.setFont("helvetica", "bold"); doc.text("TAX SUMMARY", 10, tableFinalY);
    doc.autoTable({
        startY: tableFinalY + 2,
        head: [['GST%', 'Taxable', 'CGST', 'SGST', 'Total Tax']],
        body: taxBody,
        theme: 'grid',
        headStyles: { fillColor: [250, 250, 250], textColor: 0, fontSize: 6, halign: 'center' },
        styles: { fontSize: 6, halign: 'right', cellPadding: 1, lineColor: themeRgb },
        margin: { left: 10 },
        tableWidth: 80
    });

    const summaryY = tableFinalY + 2;
    doc.setFontSize(8); doc.setFont("helvetica", "normal");
    doc.text("Sub Total:", 150, summaryY); doc.text(`Rs. ${totalTaxable.toFixed(2)}`, 195, summaryY, { align: 'right' });
    doc.text("Total GST:", 150, summaryY + 5); doc.text(`Rs. ${totalGST.toFixed(2)}`, 195, summaryY + 5, { align: 'right' });
    
    const unrounded = totalTaxable + totalGST;
    const roundOff = (inv.grandTotal - unrounded).toFixed(2);
    doc.text("Round Off:", 150, summaryY + 10); doc.text(`Rs. ${roundOff}`, 195, summaryY + 10, { align: 'right' });
    
    doc.setFont("helvetica", "bold"); doc.setFontSize(10);
    doc.text("GRAND TOTAL:", 150, summaryY + 16); doc.text(`Rs. ${inv.grandTotal.toLocaleString('en-IN', {minimumFractionDigits:2})}`, 195, summaryY + 16, { align: 'right' });

    doc.setFontSize(8); doc.setFont("helvetica", "italic");
    doc.text(`(Amount in Words: ${numberToWords(inv.grandTotal)})`, 10, summaryY + 30);

    const footerY = 270;
    // QR Code Generation
    let upiLink = "";
    if (companySettings?.upiId) {
        const am = Number(inv.grandTotal).toFixed(2);
        upiLink = `upi://pay?pa=${companySettings.upiId}&pn=${encodeURIComponent(companySettings.name || 'EMYRIS')}&am=${am}&cu=INR`;
    } else if (companySettings?.bankAccountNo && companySettings?.bankIfsc) {
        const am = Number(inv.grandTotal).toFixed(2);
        upiLink = `upi://pay?pa=${companySettings.bankAccountNo}@${companySettings.bankIfsc.toUpperCase().trim()}.ifsc.npci&pn=${encodeURIComponent(companySettings.name || 'EMYRIS')}&am=${am}&cu=INR`;
    }

    if (upiLink && window.QRCode) {
        try {
            const qrDataUrl = await QRCode.toDataURL(upiLink, { width: 150, margin: 1 });
            doc.addImage(qrDataUrl, 'PNG', 95, footerY - 10, 22, 22);
            doc.setFontSize(6); doc.text("Scan to Pay", 106, footerY + 14, { align: 'center' });
        } catch(err) { 
            console.error("Local QR Error:", err);
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(upiLink)}`;
            try { 
                doc.addImage(qrUrl, 'PNG', 95, footerY - 20, 20, 20); 
                doc.setFontSize(6); doc.text("Scan to Pay", 105, footerY + 2, { align: 'center' });
            } catch(e2){}
        }
    }

    doc.setFontSize(7); doc.setFont("helvetica", "normal"); doc.setTextColor(80);
    const bankLines = (companySettings?.bankDetails) ? companySettings.bankDetails.split('\n') : [];
    doc.text("BANK DETAILS:", 10, footerY);
    let bankLastY = footerY;
    bankLines.forEach((l, i) => {
        bankLastY = footerY + 4 + (i * 3);
        doc.text(l, 10, bankLastY);
    });

    // Terms & Conditions
    const termsY = Math.max(footerY + 20, bankLastY + 6);
    doc.setFont("helvetica", "bold"); doc.setFontSize(7);
    doc.text("TERMS & CONDITIONS:", 10, termsY);
    doc.setFont("helvetica", "normal"); doc.setFontSize(6);
    const termsText = companySettings?.invoiceTerms || companySettings?.termsConditions || "1. Goods once sold will not be taken back.\n2. Subject to local Jurisdiction.";
    const termsLines = doc.splitTextToSize(termsText, 80);
    doc.text(termsLines, 10, termsY + 4);

    doc.setFont("helvetica", "bold"); doc.setTextColor(0);
    doc.text(`For ${companySettings?.name || "EMYRIS BIOLIFESCIENCES"}`, 195, footerY, { align: 'right' });
    if (companySettings?.signatureImage) {
        try { doc.addImage(companySettings.signatureImage, 'JPEG', 160, footerY + 2, 35, 12); } catch(e){}
    }
    doc.text("Authorised Signatory", 195, footerY + 18, { align: 'right' });

    doc.save(filename);
}
// --- PDCN WORKSHEET LOGIC ---
async function fetchPDCNInvoices() {
    const container = document.getElementById('pdcn-invoice-selector');
    if (!container) return;

    try {
        const res = await fetch(`${API_BASE}/stockist/invoices?stockistId=${currentUser._id}`);
        const result = await res.json();
        if (result.success) {
            renderPDCNInvoiceList(result.invoices);
        } else {
            container.innerHTML = `<div style="text-align: center; padding: 2rem; color: #ef4444;">${result.message || 'Failed to load invoices.'}</div>`;
        }
    } catch (e) {
        container.innerHTML = `<div style="text-align: center; padding: 2rem; color: #ef4444;">Error loading invoices. Please try again.</div>`;
    }
}

function renderPDCNInvoiceList(invoices) {
    const container = document.getElementById('pdcn-invoice-selector');
    if (!container) return;

    if (!invoices || invoices.length === 0) {
        container.innerHTML = `<div style="text-align: center; padding: 3rem; color: var(--text-muted);">
            <div style="font-size: 3rem; margin-bottom: 1rem;">📦</div>
            <p>No invoices found to process PDCN.</p>
        </div>`;
        return;
    }

    // Group by month
    const groups = {};
    invoices.forEach(inv => {
        const date = new Date(inv.createdAt);
        const month = date.toLocaleString('default', { month: 'long', year: 'numeric' });
        if (!groups[month]) groups[month] = [];
        groups[month].push(inv);
    });

    let html = '';
    Object.keys(groups).forEach(month => {
        html += `
            <div style="margin-bottom: 2rem;">
                <h3 style="font-size: 0.9rem; color: var(--accent); text-transform: uppercase; letter-spacing: 2px; margin-bottom: 1rem; border-left: 4px solid var(--accent); padding-left: 15px; font-weight: 800;">${month}</h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem;">
                    ${groups[month].map(inv => `
                        <div class="glass-card" onclick="loadPDCNInvoice('${inv.invoiceNo}')" style="cursor: pointer; padding: 1.25rem; transition: 0.3s; position: relative; overflow: hidden; border: 1px solid rgba(255,255,255,0.05);" onmouseover="this.style.borderColor='var(--primary)'; this.style.transform='translateY(-2px)';" onmouseout="this.style.borderColor='rgba(255,255,255,0.05)'; this.style.transform='none';">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                                <span style="font-family: monospace; font-weight: 800; color: var(--primary); font-size: 1.1rem;">${inv.invoiceNo}</span>
                                <span style="font-size: 0.65rem; color: var(--text-muted); font-weight: 700;">${new Date(inv.createdAt).toLocaleDateString('en-GB')}</span>
                            </div>
                            <div style="font-size: 0.75rem; color: var(--text-muted); display: flex; justify-content: space-between;">
                                <span>Bill Value:</span>
                                <span style="font-weight: 800; color: #fff;">₹${parseFloat(inv.grandTotal).toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                            </div>
                            <div style="margin-top: 10px; font-size: 0.65rem; color: var(--accent); font-weight: 900; text-transform: uppercase; letter-spacing: 1px;">Click to prepare PDCN →</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

function resetPDCNWorksheet() {
    document.getElementById('pdcn-worksheet-container').classList.add('hidden');
    document.getElementById('pdcn-invoice-selector').classList.remove('hidden');
    currentPDCNInvoice = null;
    pdcnClaims = {};
}

async function loadPDCNInvoice(invNo) {
    try {
        const res = await fetch(`${API_BASE}/stockist/invoice/${invNo}?stockistId=${currentUser._id}`);
        const result = await res.json();
        if (result.success) {
            currentPDCNInvoice = result.invoice;
            pdcnClaims = {}; // Reset
            
            // Initialize claims with GST from Invoice
            currentPDCNInvoice.items.forEach(item => {
                const billedPrice = parseFloat(item.priceUsed || item.rate || (item.totalValue / item.qty) || 0);
                // Prioritize Product Master GST over Invoice Snapshot
                const gst = parseFloat((item.Product ? item.Product.gstPercent : item.gstPercent) || 0);
                pdcnClaims[item.id] = [{ 
                    claimQty: item.availableQty || 0, 
                    splPrice: billedPrice, 
                    remarks: '', 
                    active: false,
                    gstPercent: gst
                }];
            });

            document.getElementById('pdcn-active-inv-no').innerText = invNo;
            document.getElementById('pdcn-worksheet-container').classList.remove('hidden');
            document.getElementById('pdcn-invoice-selector').classList.add('hidden');
            renderPDCNTable();
        } else {
            alert(result.message || "Invoice not found.");
        }
    } catch (e) { alert("Failed to load invoice. Server error."); }
}

function renderPDCNTable() {
    const tbody = document.getElementById('pdcn-items-body');
    if (!tbody || !currentPDCNInvoice) return;

    let html = '';
    currentPDCNInvoice.items.forEach(item => {
        const variations = pdcnClaims[item.id];
        if (!variations) return;

        const billedPrice = parseFloat(item.priceUsed || item.rate || (item.totalValue / item.qty) || 0);
        const availableFromInvoice = Number(item.availableQty !== undefined ? item.availableQty : item.qty);
        const totalClaimedInWorksheet = variations.reduce((sum, v) => sum + (parseFloat(v.claimQty) || 0), 0);
        const qtyOverLimit = totalClaimedInWorksheet > availableFromInvoice;

        let cumulativeClaimed = 0;

        variations.forEach((v, idx) => {
            const rowId = `pdcn-row-${item.id}-${idx}`;
            const isFirst = idx === 0;
            const gst = v.gstPercent || 0;
            const diffPerUnit = (billedPrice - (v.splPrice || 0));
            const finalPDCN = (diffPerUnit * (v.claimQty || 0)) * (1 + (gst/100));
            v.finalPDCN = finalPDCN;
            
            // Calculate available balance for this specific line
            const balanceLeft = Math.max(0, availableFromInvoice - cumulativeClaimed);
            cumulativeClaimed += (parseFloat(v.claimQty) || 0);

            html += `
                <tr id="${rowId}" style="border-bottom: 1px solid rgba(255,255,255,0.03); ${qtyOverLimit ? 'background: rgba(239, 68, 68, 0.05);' : ''}">
                    ${isFirst ? `
                        <td rowspan="${variations.length}" class="sticky-col" style="min-width: 130px; font-weight: 700; color: #fff; font-size: 0.7rem; background: var(--card-bg); padding: 6px;">
                            ${item.Product?.name || item.name}
                            ${item.alreadyClaimedQty > 0 ? `<div style="font-size: 0.55rem; color: var(--accent); margin-top: 2px;">Claimed: ${item.alreadyClaimedQty}</div>` : ''}
                            ${availableFromInvoice === 0 ? `<div style="font-size: 0.55rem; color: #ef4444; font-weight: 900;">⚠️ FULLY CLAIMED</div>` : ''}
                        </td>
                    ` : ''}
                    <td style="padding: 6px; text-align: center;">
                        <div style="font-size: 0.75rem; font-weight: 900; color: ${balanceLeft <= 0 ? '#ef4444' : '#10b981'}; margin-bottom: 2px;">
                            ${balanceLeft <= 0 ? 'EXHAUSTED' : `PEN: ${balanceLeft}`}
                        </div>
                        <div style="font-size: 0.55rem; color: var(--text-muted); font-weight: 700;">
                            INV: ${item.qty}
                        </div>
                    </td>
                    <td style="padding: 6px; text-align: right; color: #fff; font-size: 0.7rem;">₹${billedPrice.toFixed(2)}</td>
                    <td style="padding: 6px; text-align: center; color: #fff; font-size: 0.7rem;">${gst}%</td>
                    <td style="padding: 6px; text-align: center;">
                        <input type="number" step="1" min="0" max="${balanceLeft}" 
                            value="${v.claimQty}" 
                            oninput="calculatePDCNRow('${item.id}', ${idx}, 'qty', this.value)"
                            style="width: 50px; padding: 2px; background: ${qtyOverLimit ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255,255,255,0.05)'}; border: 1px solid ${qtyOverLimit ? '#ef4444' : 'rgba(255,255,255,0.1)'}; color: #fff; font-weight: 800; font-size: 0.7rem; text-align: center; border-radius: 4px;">
                    </td>

                    <td style="padding: 6px;">
                        <input type="number" step="0.01" class="qty-input" 
                            value="${v.splPrice}" 
                            oninput="calculatePDCNRow('${item.id}', ${idx}, 'price', this.value)"
                            style="width: 65px; padding: 2px; background: rgba(16, 185, 129, 0.15); border-color: var(--accent); color: #fff; font-weight: 800; font-size: 0.7rem;">
                    </td>
                    <td id="pdcn-diff-${item.id}-${idx}" style="padding: 6px; text-align: right; font-weight: 700; color: #f59e0b; font-size: 0.7rem;">₹0.00</td>
                    <td id="pdcn-stk-margin-${item.id}-${idx}" style="padding: 6px; text-align: right; font-weight: 700; color: var(--primary); font-size: 0.7rem;">₹0.00</td>
                    <td id="pdcn-final-${item.id}-${idx}" style="padding: 6px; text-align: right; font-weight: 900; color: #fff; background: rgba(99,102,241,0.2); font-size: 0.75rem;">₹0.00</td>

                    <td style="padding: 4px;">
                        <textarea class="note-input" 
                            placeholder="Remarks..." 
                            oninput="calculatePDCNRow('${item.id}', ${idx}, 'remarks', this.value)"
                            style="width: 100%; min-height: 25px; padding: 4px; font-size: 0.65rem; color: #fff; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1);">${v.remarks}</textarea>
                    </td>
                    <td style="padding: 6px; text-align: center;">
                        <div style="display: flex; gap: 4px; justify-content: center;">
                            <button onclick="addPDCNVariation('${item.id}')" style="background: var(--accent); color: #fff; border: none; border-radius: 4px; width: 20px; height: 20px; cursor: pointer; font-weight: 900; font-size: 0.7rem; line-height: 1;">+</button>
                            ${!isFirst ? `<button onclick="removePDCNVariation('${item.id}', ${idx})" style="background: #ef4444; color: #fff; border: none; border-radius: 4px; width: 20px; height: 20px; cursor: pointer; font-weight: 900; font-size: 0.7rem; line-height: 1;">-</button>` : ''}
                        </div>
                    </td>
                </tr>
            `;
        });
    });

    tbody.innerHTML = html;
    
    // Trigger recalculation for all visible rows
    currentPDCNInvoice.items.forEach(item => {
        if (pdcnClaims[item.id]) {
            pdcnClaims[item.id].forEach((v, idx) => {
                calculatePDCNRow(item.id, idx, 'init', null);
            });
        }
    });
}

function addPDCNVariation(itemId) {
    const item = currentPDCNInvoice.items.find(i => i.id == itemId);
    if (!item) return;

    const variations = pdcnClaims[itemId] || [];
    const totalClaimedSoFar = variations.reduce((sum, v) => sum + (parseFloat(v.claimQty) || 0), 0);
    
    // Safety Guard: Prevent splitting if no qty remains
    if (totalClaimedSoFar >= item.qty) {
        alert("⚠️ NOT ALLOWED FOR FURTHER SPLIT: Total invoiced quantity is already fully allocated.");
        return;
    }

    const billedPrice = parseFloat(item.priceUsed || item.rate || (item.totalValue / item.qty) || 0);
    const firstVar = variations[0];
    
    pdcnClaims[itemId].push({ 
        claimQty: 0, 
        splPrice: billedPrice, 
        remarks: '', 
        active: true,
        gstPercent: firstVar ? firstVar.gstPercent : 0 
    });
    renderPDCNTable();
}


function removePDCNVariation(itemId, idx) {
    pdcnClaims[itemId].splice(idx, 1);
    renderPDCNTable();
}

function togglePDCNItem(itemId) {
    const variations = pdcnClaims[itemId];
    if (variations && variations.length > 0) {
        const newState = !variations[0].active;
        variations.forEach(v => v.active = newState);
    }
    renderPDCNTable();
}

function calculatePDCNRow(itemId, idx, field, value) {
    const item = currentPDCNInvoice.items.find(i => i.id == itemId);
    if (!item || !pdcnClaims[itemId]) return;

    const variation = pdcnClaims[itemId][idx];
    
    // Update data
    if (field === 'qty') {
        variation.claimQty = parseFloat(value) || 0;
        variation.active = variation.claimQty > 0;
    } else if (field === 'price') {
        variation.splPrice = parseFloat(value) || 0;
        variation.active = true;
    } else if (field === 'remarks') {
        variation.remarks = value;
    }

    const gstPct = variation.gstPercent;
    const billedPrice = parseFloat(item.priceUsed || item.rate || (item.totalValue / item.qty) || 0);
    const claimQty = variation.claimQty;
    const splPrice = variation.splPrice;

    const bPrice = Number(billedPrice);
    const sPrice = Number(splPrice);
    const gPct = Number(gstPct);
    
    // Per unit difference breakdown
    const unitTaxableDiff = Number((bPrice - sPrice).toFixed(2));
    const unitTaxDiff     = Number((unitTaxableDiff * gPct / 100).toFixed(2));
    const unitSaleDiff    = Number((unitTaxableDiff + unitTaxDiff).toFixed(2)); // Diff/Unit (incl. GST)

    // Stockist Margin = 10% of Special Price (per unit)
    const unitStkMargin = Number((sPrice * 0.10).toFixed(2));

    // Final PDCN per unit = Diff/Unit + Stockist Margin
    const finalPDCN = Number(((unitSaleDiff + unitStkMargin) * Number(claimQty)).toFixed(2));

    // Update UI
    const diffEl   = document.getElementById(`pdcn-diff-${itemId}-${idx}`);
    const marginEl = document.getElementById(`pdcn-stk-margin-${itemId}-${idx}`);
    const finalEl  = document.getElementById(`pdcn-final-${itemId}-${idx}`);

    if (diffEl)   diffEl.innerText   = `₹${unitSaleDiff.toFixed(2)}`;
    if (marginEl) marginEl.innerText = `₹${unitStkMargin.toFixed(2)}`;
    if (finalEl)  finalEl.innerText  = `₹${finalPDCN.toFixed(2)}`;


    updatePDCNGrandTotals();
}

function updatePDCNGrandTotals() {
    let totalTaxable = 0;
    let totalTax = 0;
    let totalMargin = 0;

    Object.keys(pdcnClaims).forEach(itemId => {
        const item = currentPDCNInvoice.items.find(i => i.id == itemId);
        const variations = pdcnClaims[itemId];
        if (!Array.isArray(variations)) return;

        variations.forEach(v => {
            if (!v.active) return;
            const billedPrice = Number(item.priceUsed || item.rate || (item.totalValue / item.qty) || 0);
            const claimQty    = Number(v.claimQty || 0);
            const splPrice    = Number(v.splPrice || 0);
            const gstPct      = Number(v.gstPercent || 0);

            const unitTaxableDiff = billedPrice - splPrice;
            const unitTaxDiff     = unitTaxableDiff * (gstPct / 100);
            
            totalTaxable += Number((unitTaxableDiff * claimQty).toFixed(2));
            totalTax     += Number((unitTaxDiff     * claimQty).toFixed(2));
            totalMargin  += Number((splPrice * 0.10      * claimQty).toFixed(2));
        });
    });

    const netAmount = totalTaxable + totalTax + totalMargin;
    const finalGrandTotal = Math.round(netAmount);
    const roundOffValue = finalGrandTotal - netAmount;

    document.getElementById('pdcn-total-taxable').innerText = `₹${totalTaxable.toLocaleString('en-IN', {minimumFractionDigits: 2})}`;
    document.getElementById('pdcn-total-tax').innerText = `₹${totalTax.toLocaleString('en-IN', {minimumFractionDigits: 2})}`;
    document.getElementById('pdcn-total-roundoff').innerText = `${roundOffValue >= 0 ? '+' : ''}₹${roundOffValue.toFixed(2)}`;
    document.getElementById('pdcn-grand-total').innerText = `₹${finalGrandTotal.toLocaleString('en-IN', {minimumFractionDigits: 0})}`;
}

async function submitPDCNClaim() {
    const itemsToSubmit = [];
    let validationError = null;

    currentPDCNInvoice.items.forEach(item => {
        const variations = pdcnClaims[item.id] || [];
        const activeVariations = variations.filter(v => v.active && v.claimQty > 0);
        
        const totalQty = activeVariations.reduce((sum, v) => sum + v.claimQty, 0);
        const maxEligible = item.availableQty !== undefined ? item.availableQty : item.qty;
        
        if (totalQty > maxEligible) {
            validationError = `⚠️ Qty Error: Total claimed qty for ${item.name} (${totalQty}) exceeds remaining eligible qty (${maxEligible}).`;
        }

        activeVariations.forEach(v => {
            if (!v.remarks.trim()) {
                validationError = `⚠️ Remarks Required: Please provide remarks for ${item.name} (Qty: ${v.claimQty})`;
            }

            const billedPrice = Number(item.priceUsed || item.rate || (item.totalValue / item.qty) || 0);
            const gstPct      = Number(v.gstPercent || 0);
            const splPrice    = Number(v.splPrice || 0);
            const claimQty    = Number(v.claimQty || 0);

            // Canonical formula:
            // Diff/Unit    = (Billed - Special) * (1 + GST%)
            // Stk Margin   = Special Price * 10%  (per unit)
            // Final PDCN   = (Diff/Unit + Stk Margin) * Qty
            const baseDiff      = billedPrice - splPrice;
            const unitSaleDiff  = baseDiff * (1 + gstPct / 100);
            const unitStkMargin = splPrice * 0.10;
            const finalPDCN     = parseFloat(((unitSaleDiff + unitStkMargin) * claimQty).toFixed(2));

            itemsToSubmit.push({
                productId:    item.productId,
                name:         item.name,
                qty:          claimQty,
                gstPercent:   gstPct,
                billedPrice:  billedPrice,
                specialPrice: splPrice,
                saleDiff:     parseFloat((unitSaleDiff  * claimQty).toFixed(2)),
                stkMargin:    parseFloat((unitStkMargin * claimQty).toFixed(2)),
                finalPDCN:    finalPDCN,
                remarks:      v.remarks
            });

        });
    });

    if (validationError) return alert(validationError);
    if (itemsToSubmit.length === 0) return alert("Please enter at least one valid claim qty.");

    const claimData = {
        invoiceNo: currentPDCNInvoice.invoiceNo,
        stockistId: currentUser._id,
        items: itemsToSubmit,
        totalAmount: Math.round(itemsToSubmit.reduce((sum, i) => sum + i.finalPDCN, 0))
    };

    console.log("📤 Submitting PDCN Claim:", claimData);
    
    const btn = document.getElementById('pdcn-submit-btn');
    const originalBtnHTML = btn ? btn.innerHTML : "SUBMIT CLAIM";

    if (btn) {
        btn.disabled = true;
        btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> SUBMITTING...`;
        btn.style.opacity = "0.7";
        btn.style.cursor = "not-allowed";
    }

    try {
        const res = await fetch(`${API_BASE}/stockist/pdcn/submit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(claimData)
        });
        const result = await res.json();
        if (result.success) {
            alert("✅ PDCN Claim Submitted Successfully! Admin will review and issue CN.");
            switchOrderTab('pdcn-history'); // Change to history tab to see submission
            resetPDCNWorksheet();
        } else {
            alert("Submission failed: " + result.message);
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = originalBtnHTML;
                btn.style.opacity = "1";
                btn.style.cursor = "pointer";
            }
        }
    } catch (e) { 
        console.error("PDCN Submit Error:", e);
        alert("Action failed. Please check your connection.");
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = originalBtnHTML;
            btn.style.opacity = "1";
            btn.style.cursor = "pointer";
        }
    }
}

async function fetchPDCNHistory() {
    const container = document.getElementById('pdcn-history-container');
    if (!container) return;
    
    container.innerHTML = `<div style="text-align: center; padding: 2rem; color: var(--text-muted);"><i class="fas fa-spinner fa-spin"></i> Loading claim history...</div>`;

    try {
        const uid = currentUser.id || currentUser._id;
        console.log("Fetching PDCN History for UID:", uid);
        const res = await fetch(`${API_BASE}/stockist/pdcn/history/${uid}`);
        const result = await res.json();
        console.log("PDCN History Data:", result);


        if (result.success && result.claims.length > 0) {
            window.allMyPDCNClaims = result.claims; // Store for viewing details
            let html = '';
            
            // Group by Month/Year
            const grouped = {};
            result.claims.forEach(c => {
                const d = new Date(c.createdAt);
                const monthYear = d.toLocaleString('default', { month: 'long', year: 'numeric' });
                if (!grouped[monthYear]) grouped[monthYear] = [];
                grouped[monthYear].push(c);
            });

            for (const month in grouped) {
                html += `
                    <div style="margin-bottom: 2rem;">
                        <div style="background: rgba(99, 102, 241, 0.1); padding: 8px 20px; border-radius: 8px; font-weight: 800; color: var(--primary); margin-bottom: 1rem; font-size: 0.8rem; border-left: 4px solid var(--primary); letter-spacing: 1px;">${month.toUpperCase()}</div>
                        <div class="excel-container" style="background: rgba(0,0,0,0.2); border-radius: 12px; overflow: hidden; border: 1px solid rgba(255,255,255,0.05);">
                            <table class="excel-table" style="width: 100%; min-width: 800px; border-collapse: collapse;">
                                <thead style="background: rgba(255,255,255,0.02);">
                                    <tr>
                                        <th style="text-align: left; padding: 12px 20px; font-size: 0.65rem; text-transform: uppercase; color: var(--text-muted);">Invoice No</th>
                                        <th style="text-align: left; padding: 12px 20px; font-size: 0.65rem; text-transform: uppercase; color: var(--text-muted);">Claim No</th>
                                        <th style="text-align: center; padding: 12px 20px; font-size: 0.65rem; text-transform: uppercase; color: var(--text-muted);">Products</th>
                                        <th style="text-align: center; padding: 12px 20px; font-size: 0.65rem; text-transform: uppercase; color: var(--text-muted);">Status</th>
                                        <th style="text-align: center; padding: 12px 20px; font-size: 0.65rem; text-transform: uppercase; color: var(--text-muted);">Claim Date</th>
                                        <th style="text-align: right; padding: 12px 20px; font-size: 0.65rem; text-transform: uppercase; color: var(--text-muted);">Claim Amount</th>
                                        <th style="text-align: center; padding: 12px 20px; font-size: 0.65rem; text-transform: uppercase; color: var(--text-muted);">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${grouped[month].map(c => {
                                        const status = (c.status || 'pending').toLowerCase();
                                        const statusColor = status === 'approved' ? '#10b981' : (status === 'rejected' ? '#ef4444' : '#f59e0b');
                                        const statusBg = status === 'approved' ? 'rgba(16, 185, 129, 0.1)' : (status === 'rejected' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)');
                                        
                                        return `
                                        <tr style="border-bottom: 1px solid rgba(255,255,255,0.03); transition: 0.3s;" onmouseover="this.style.background='rgba(255,255,255,0.02)'" onmouseout="this.style.background='transparent'">
                                            <td style="padding: 12px 20px; font-weight: 700; color: #fff; font-size: 0.85rem;">${c.invoiceNo}</td>
                                            <td style="padding: 12px 20px; color: var(--accent); font-weight: 800; font-size: 0.8rem;">
                                                ${status === 'approved' && c.creditNoteNo ? c.creditNoteNo : `CL-ID-${String(c.id).padStart(4, '0')}`}
                                            </td>
                                            <td style="padding: 12px 20px; text-align: center; font-weight: 700; color: #fff; font-size: 0.85rem;">${c.items?.length || 0}</td>

                                            <td style="padding: 12px 20px; text-align: center;">
                                                <span style="padding: 4px 10px; border-radius: 20px; font-size: 0.65rem; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px; background: ${statusBg}; color: ${statusColor}; border: 1px solid ${statusColor}33;">${status}</span>
                                                ${c.adminRemarks ? `<div style="font-size: 0.6rem; color: #ef4444; margin-top: 5px; max-width: 150px; overflow: hidden; text-overflow: ellipsis;">Note: ${c.adminRemarks}</div>` : ''}
                                            </td>
                                            <td style="padding: 12px 20px; text-align: center; color: var(--text-muted); font-size: 0.8rem;">${new Date(c.createdAt).toLocaleDateString('en-IN', {day:'2-digit', month:'2-digit', year:'numeric'})}</td>
                                            <td style="padding: 12px 20px; text-align: right; font-weight: 900; color: var(--primary); font-size: 1rem;">₹${Math.round(parseFloat(c.totalAmount || 0)).toLocaleString('en-IN')}</td>
                                            <td style="padding: 12px 20px; text-align: center;">
                                                <button class="btn" onclick="openPDCNViewModal(${c.id})" 
                                                    style="padding: 6px 14px; font-size: 0.65rem; font-weight: 800; background: rgba(99, 102, 241, 0.15); color: var(--primary); border: 1px solid rgba(99, 102, 241, 0.3); border-radius: 8px; cursor: pointer; transition: 0.3s; display: inline-flex; align-items: center; gap: 6px;">
                                                    <i class="fas fa-eye" style="font-size: 0.7rem;"></i> VIEW
                                                </button>
                                            </td>
                                        </tr>

                                        `;
                                    }).join('')}
                                </tbody>


                            </table>
                        </div>
                    </div>
                `;
            }

            container.innerHTML = html;
        } else {
            container.innerHTML = `
                <div style="text-align: center; padding: 4rem; color: var(--text-muted);">
                    <i class="fas fa-history" style="font-size: 3rem; opacity: 0.1; margin-bottom: 1rem;"></i>
                    <p>No PDCN claims submitted yet.</p>
                </div>
            `;
        }
    } catch (e) {
        container.innerHTML = `<div style="color: #ef4444; text-align: center; padding: 2rem;">Error loading history: ${e.message}</div>`;
    }
}

// PDCN View Functions
async function openPDCNViewModal(id) {
    console.log("Attempting to open PDCN View for ID:", id);
    const modal = document.getElementById('pdcnDetailModal');
    if (!modal) {
        console.error("CRITICAL: pdcnDetailModal element NOT FOUND in DOM!");
        return alert("UI Error: Detail modal not found. Please reload the page.");
    }

    let claim = (window.allMyPDCNClaims || []).find(c => c.id == id);
    
    // Fail-safe: If not in cache, fetch directly
    if (!claim) {
        try {
            const uid = (currentUser && (currentUser.id || currentUser._id)) || null;
            if (!uid) throw new Error("User identity not found.");
            
            console.log("Fetching missing claim data for UID:", uid);
            const res = await fetch(`${API_BASE}/stockist/pdcn/history/${uid}`);
            const result = await res.json();
            if (result.success) {
                window.allMyPDCNClaims = result.claims;
                claim = result.claims.find(c => c.id == id);
            }
        } catch (e) { console.error("Data retrieval failed:", e); }
    }

    if (!claim) {
        return alert("Could not load claim details. The record might be still synchronizing.");
    }

    // Populate Data
    const status = (claim.status || 'pending').toLowerCase();
    const statusColor = status === 'approved' ? '#10b981' : (status === 'rejected' ? '#ef4444' : '#f59e0b');
    const statusBg = status === 'approved' ? 'rgba(16, 185, 129, 0.1)' : (status === 'rejected' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)');

    document.getElementById('pdcn-view-id').innerText = status === 'approved' && claim.creditNoteNo ? claim.creditNoteNo : `CL-ID-${String(claim.id).padStart(4, '0')}`;
    document.getElementById('pdcn-view-invoice').innerText = claim.invoiceNo;
    document.getElementById('pdcn-view-date').innerText = new Date(claim.createdAt).toLocaleDateString('en-IN', {day:'2-digit', month:'long', year:'numeric'});
    document.getElementById('pdcn-view-status').innerHTML = `<span style="padding: 4px 12px; border-radius: 20px; font-size: 0.7rem; font-weight: 900; text-transform: uppercase; background: ${statusBg}; color: ${statusColor}; border: 1px solid ${statusColor}33;">${status}</span>`;
    document.getElementById('pdcn-view-remarks').innerText = claim.adminRemarks || 'No admin remarks provided.';
    document.getElementById('pdcn-view-total').innerText = `₹${parseFloat(claim.totalAmount || 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}`;

    const tbody = document.getElementById('pdcn-view-items-body');
    let recalcTotal = 0;

    tbody.innerHTML = (claim.items || []).map(item => {
        const billed   = parseFloat(item.billedPrice || 0);
        const special  = parseFloat(item.specialPrice || 0);
        const qty      = Number(item.qty || 0);
        const gstPct   = parseFloat(item.gstPercent || 0);
        const marginPct = parseFloat(item.marginPct || 10);

        // Canonical formula — same as worksheet display & server
        // Diff/Unit  = (Billed - Special) * (1 + GST%)
        // Stk Margin = Special Price * marginPct%  (per unit)
        // Final PDCN = (Diff/Unit + Stk Margin) * Qty
        const baseDiff      = billed - special;
        const unitSaleDiff  = baseDiff * (1 + gstPct / 100);
        const unitStkMargin = special * (marginPct / 100);
        const finalPDCN     = parseFloat(((unitSaleDiff + unitStkMargin) * qty).toFixed(2));

        recalcTotal += finalPDCN;

        return `
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.03);">
                <td style="padding: 15px 20px; font-weight: 700; color: #fff; font-size: 0.85rem;">${item.name}</td>
                <td style="padding: 15px 20px; text-align: center; color: #fff; font-weight: 700;">${qty}</td>
                <td style="padding: 15px 20px; text-align: center; color: #fff; font-size: 0.75rem;">${gstPct}%</td>
                <td style="padding: 15px 20px; text-align: right; color: rgba(255,255,255,0.6); font-size: 0.8rem;">₹${billed.toFixed(2)}</td>
                <td style="padding: 15px 20px; text-align: right; color: var(--accent); font-weight: 700;">₹${special.toFixed(2)}</td>
                <td style="padding: 15px 20px; text-align: right; color: #f59e0b; font-weight: 700;">₹${(baseDiff * qty * (1 + gstPct / 100)).toFixed(2)}</td>
                <td style="padding: 15px 20px; text-align: right; color: var(--primary); font-weight: 700;">₹${(unitStkMargin * qty).toFixed(2)}</td>
                <td style="padding: 15px 20px; text-align: right; font-weight: 900; color: #fff; background: rgba(99,102,241,0.1);">₹${finalPDCN.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
            </tr>
        `;
    }).join('');

    // Overwrite grand total with recalculated sum (fixes stale/corrupt stored totalAmount)
    document.getElementById('pdcn-view-total').innerText = `₹${Math.round(recalcTotal).toLocaleString('en-IN')}`;


    // Store for printing
    window.currentViewingPDCNClaim = claim;

    // Force Visibility
    modal.style.display = 'flex';
    modal.classList.remove('hidden');
}

async function downloadPDCN_PDF() {
    const claim = window.currentViewingPDCNClaim;
    if (!claim) return alert("No claim data found to print.");

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Header - Use Company Data from script.js global
    const co = window.companyProfile || {};
    
    doc.setFontSize(22);
    doc.setTextColor(99, 102, 241); // var(--primary)
    doc.text(co.name || 'EMYRIS BIOLIFESCIENCES', 20, 25);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(co.address || '', 20, 32);
    doc.text(`GST: ${co.gstNo || ''} | DL: ${co.dlNo || ''}`, 20, 37);

    doc.setDrawColor(99, 102, 241);
    doc.line(20, 42, 190, 42);

    // Claim Title
    doc.setFontSize(16);
    doc.setTextColor(0);
    doc.text('PDCN CLAIM BREAKDOWN', 20, 55);
    
    // Metadata
    doc.setFontSize(10);
    doc.text(`Claim ID: CL-ID-${String(claim.id).padStart(4, '0')}`, 20, 65);
    doc.text(`Ref Invoice: ${claim.invoiceNo}`, 20, 70);
    doc.text(`Date: ${new Date(claim.createdAt).toLocaleDateString('en-GB')}`, 140, 65);
    doc.text(`Status: ${(claim.status || 'pending').toUpperCase()}`, 140, 70);

    // Party Info
    doc.setFontSize(11);
    doc.text('Party Details:', 20, 85);
    doc.setFontSize(10);
    doc.text(currentUser.name || 'Stockist', 20, 92);
    doc.text(currentUser.address || '', 20, 97);

    // Table
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
        theme: 'striped',
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
    
    // Totals
    doc.setFontSize(12);
    doc.text(`TOTAL CLAIM VALUE: Rs. ${parseFloat(claim.totalAmount).toLocaleString('en-IN', {minimumFractionDigits: 2})}`, 190, finalY, { align: 'right' });

    // Remarks
    if (claim.adminRemarks) {
        doc.setFontSize(10);
        doc.text('Admin Remarks:', 20, finalY + 10);
        doc.setFontSize(9);
        doc.setTextColor(80);
        doc.text(doc.splitTextToSize(claim.adminRemarks, 170), 20, finalY + 17);
    }

    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Generated on ${new Date().toLocaleString()} via Emyris OMS Portal`, 105, 285, { align: 'center' });

    doc.save(`PDCN_${claim.invoiceNo}_${String(claim.id).padStart(4, '0')}.pdf`);
}

function closePDCNViewModal() {
    const modal = document.getElementById('pdcnDetailModal');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.add('hidden');
    }
}





// --- EXTERNAL INVOICE REGISTRY LOGIC ---
let lastExtractedData = null;

async function uploadExtInvoice() {
    const fileInput = document.getElementById('ext-inv-file');
    if (!fileInput.files[0]) return showCenteredMessage("Please select an invoice file (PDF/JPG/PNG).", "warning");

    // --- SPECIMEN GATE: Block uploads if no calibration blueprint exists ---
    if (currentUser) {
        const stockistId = currentUser._id || currentUser.id;
        try {
            const chkRes = await fetch(`${API_BASE}/admin/ocr-templates/${stockistId}`);
            const chkData = await chkRes.json();
            if (!chkData.success || !chkData.template) {
                return showCenteredMessage(
                    "⚠️ SETUP REQUIRED\n\nYou must complete the one-time Invoice Layout Setup before uploading invoices. Click 🗺️ MAP LAYOUT in the navigation above to complete setup.",
                    "warning"
                );
            }
        } catch(e) {
            console.warn("Could not verify calibration template; proceeding anyway.");
        }
    }

    // Hide guide arrow once user starts
    const arrow = document.getElementById('guide-arrow');
    if (arrow) arrow.classList.add('hidden');

    const btn = document.getElementById('upload-btn');
    const originalText = btn.innerHTML;
    btn.innerHTML = "<i class='fas fa-spinner fa-spin'></i> READING...";
    btn.disabled = true;

    // --- RESET PREVIEW UI FOR NEW UPLOAD ---
    clearInvoiceRegistry(true);

    // --- INITIALIZE STEP-BY-STEP PROGRESS BAR ---
    const progBlock = document.getElementById('ext-progress-block');
    const progTitle = document.getElementById('ext-progress-title');
    const progBar = document.getElementById('ext-progress-bar');
    const progMsg = document.getElementById('ext-progress-msg');

    if (progBlock) {
        progBlock.classList.remove('hidden');
        progTitle.innerText = "Processing Supplier Invoice...";
        progBar.style.width = "15%";
        progMsg.innerText = "Step 1/4: Uploading PDF and extracting layout streams...";
    }

    const progressTimer1 = setTimeout(() => {
        if (progBar && progMsg) {
            progBar.style.width = "45%";
            progMsg.innerText = "Step 2/4: Decoding custom Type3 glyphs and mapping columns...";
        }
    }, 1800);

    const progressTimer2 = setTimeout(() => {
        if (progBar && progMsg) {
            progBar.style.width = "75%";
            progMsg.innerText = "Step 3/4: Sorting horizontal token boundaries & reassembling product lines...";
        }
    }, 4200);

    try {
        const formData = new FormData();
        formData.append('invoice', fileInput.files[0]);
        formData.append('stockistName', currentUser.name);
        formData.append('stockistId', currentUser._id || currentUser.id);

        const res = await fetch(`${API_BASE}/stockist/upload-invoice-read`, {
            method: 'POST',
            body: formData
        });
        const result = await res.json();
        
        // --- COMPLETE PROGRESS BAR ON SUCCESS/FAILURE ---
        clearTimeout(progressTimer1);
        clearTimeout(progressTimer2);
        
        if (progBar && progMsg) {
            progBar.style.width = "100%";
            progMsg.innerText = result.success 
                ? "Step 4/4: Complete! Loading visual purchase entry ledger preview..."
                : "Failed to read invoice layout details.";
            setTimeout(() => {
                if (progBlock) progBlock.classList.add('hidden');
            }, 1500);
        }

        if (result.success) {
                lastExtractedData = result.data;
                document.getElementById('ext-inv-no').value = result.data.invoiceNo;
                document.getElementById('ext-inv-date').value = result.data.date;
                document.getElementById('ext-inv-pos').value = result.data.placeOfSupply || '';
                
                if (result.profile) {
                    document.getElementById('prof-name').value = result.profile.name;
                    document.getElementById('prof-phone').value = result.data.phone || result.profile.phone || '';
                    document.getElementById('prof-email').value = result.data.email || result.profile.email || '';
                    document.getElementById('prof-address').value = result.data.address || result.profile.address || '';
                    document.getElementById('prof-pin').value = result.data.pincode || result.profile.pincode || '';
                    document.getElementById('prof-fssai').value = result.data.fssaiNo || result.profile.fssaiNo || '';
                    document.getElementById('prof-city').value = result.profile.city || '';
                    document.getElementById('prof-state').value = result.data.state || result.profile.state || '';
                    document.getElementById('prof-dl').value = result.data.dlNo || result.profile.dlNo || '';
                    document.getElementById('prof-gst').value = result.data.gstNo || result.profile.gstNo || '';
                    document.getElementById('prof-bank').value = result.profile.bankName || '';
                    document.getElementById('prof-ifsc').value = result.profile.bankIfsc || '';
                }
                
                document.getElementById('ext-preview-section').classList.remove('hidden');

                // --- AUTO SCROLL TO ENRICHMENT FORM ---
                setTimeout(() => {
                    document.getElementById('ext-preview-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 300);
                
                // --- RENDER TABLE VIA CENTRAL FUNCTION ---
                renderExtTable();
                
                // Show warning if identity mismatch occurred but extraction succeeded
                if (result.warning) {
                    setTimeout(() => showCenteredMessage(result.warning, "warning"), 800);
                } else {
                    showCenteredMessage("Invoice Extracted Successfully!", "success");
                }
                
            } else {
                showCenteredMessage(result.message || "Failed to read invoice.", "error");
            }
    } catch (e) {
        showCenteredMessage("Server error during upload.", "error");
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

async function postToRegistry() {
    if (!lastExtractedData) return;
    
    const invNo = document.getElementById('ext-inv-no').value.trim();
    const invDate = document.getElementById('ext-inv-date').value;
    
    if (!invNo) return showCenteredMessage("Invoice No is required.", "warning");

    const profileUpdate = {
        address: document.getElementById('prof-address').value.trim().toUpperCase(),
        city: document.getElementById('prof-city').value.trim().toUpperCase(),
        state: document.getElementById('prof-state').value.trim().toUpperCase(),
        pincode: document.getElementById('prof-pin').value.trim(),
        dlNo: document.getElementById('prof-dl').value.trim().toUpperCase(),
        gstNo: document.getElementById('prof-gst').value.trim().toUpperCase(),
        fssaiNo: document.getElementById('prof-fssai').value.trim().toUpperCase(),
        email: document.getElementById('prof-email').value.trim().toLowerCase(),
        bankName: document.getElementById('prof-bank').value.trim().toUpperCase(),
        bankIfsc: document.getElementById('prof-ifsc').value.trim().toUpperCase(),
        phone: document.getElementById('prof-phone').value.trim()
    };

    // --- STRICT VALIDATION FOR FIRST-TIME CODE OPENING ---
    const mandatory = ['address', 'city', 'state', 'pincode', 'dlNo', 'gstNo', 'fssaiNo', 'phone', 'email'];
    const missing = mandatory.filter(key => !profileUpdate[key]);
    
    if (missing.length > 0) {
        showCenteredMessage("MANDATORY FIELDS MISSING: " + missing.join(', ').toUpperCase() + "\n\nAll starred (*) fields must be completed for the first-time upload to open your code.", "error");
        return;
    }

    // --- SOFT VALIDATION FOR FSSAI (14 DIGITS) ---
    const fssai = profileUpdate.fssaiNo.replace(/[^0-9]/g, '');
    if (fssai && fssai.length !== 14) {
        if (!confirm(`⚠️ FSSAI/Food License numbers are typically 14 digits. Your entry (${fssai}) is ${fssai.length} digits.\n\nAre you sure you want to save this as-is?`)) return;
    }

    if (!confirm("⚠️ FINAL CHECK: Are all details complete and accurate? This will overwrite your official Stockist Master records.")) return;

    const payload = {
        invoiceNo: invNo,
        date: invDate,
        stockistId: currentUser._id || currentUser.id,
        items: lastExtractedData.items,
        grandTotal: lastExtractedData.items.reduce((sum, i) => {
            const line = parseFloat(i.qty) * parseFloat(i.rate);
            return sum + line + (line * parseFloat(i.gst || 0) / 100);
        }, 0),
        profileUpdate: profileUpdate
    };

    try {
        const res = await fetch(`${API_BASE}/stockist/invoice-external`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const result = await res.json();
        
        if (result.success) {
            showCenteredMessage("Invoice successfully posted to final registry!", "success");
            document.getElementById('ext-preview-section').classList.add('hidden');
            document.getElementById('ext-inv-file').value = '';
            lastExtractedData = null;
            syncProfile(); // Refresh local profile
        } else {
            showCenteredMessage(result.error || "Failed to post invoice.", "error");
        }
    } catch (e) {
        showCenteredMessage("Server error during posting.", "error");
    }
}

function removeExtRow(idx) {
    if (!lastExtractedData) return;
    lastExtractedData.items.splice(idx, 1);
    renderExtTable();
}

function addManualRow() {
    if (!lastExtractedData) lastExtractedData = { items: [] };
    lastExtractedData.items.push({
        name: "NEW PRODUCT",
        hsn: "3004",
        batch: "NEW",
        expDate: "12/2026",
        mrp: 0,
        qty: 1,
        rate: 0,
        gst: 12
    });
    renderExtTable();
}

function renderExtTable() {
    const tbody = document.getElementById('ext-preview-body');
    tbody.innerHTML = lastExtractedData.items.map((item, i) => `
        <tr>
            <td><input type="text" value="${item.name}" oninput="lastExtractedData.items[${i}].name=this.value" style="font-size:0.75rem; padding:6px; background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.1); border-radius:4px; color:#fff; width:100%;"></td>
            <td><input type="text" value="${item.hsn||''}" oninput="lastExtractedData.items[${i}].hsn=this.value" style="font-size:0.75rem; padding:6px; background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.1); border-radius:4px; color:#fff; width:90px;"></td>
            <td><input type="text" value="${item.batch}" oninput="lastExtractedData.items[${i}].batch=this.value" style="font-size:0.75rem; padding:6px; background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.1); border-radius:4px; color:#fff; width:100px;"></td>
            <td><input type="text" value="${item.expDate||''}" oninput="lastExtractedData.items[${i}].expDate=this.value" style="font-size:0.75rem; padding:6px; background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.1); border-radius:4px; color:#fff; width:80px;"></td>
            <td><input type="number" step="0.01" value="${item.mrp||0}" oninput="lastExtractedData.items[${i}].mrp=this.value" style="font-size:0.75rem; padding:6px; background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.1); border-radius:4px; color:#fff; width:75px; text-align:right;"></td>
            <td><input type="number" value="${item.qty}" oninput="lastExtractedData.items[${i}].qty=this.value" style="font-size:0.75rem; padding:6px; background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.1); border-radius:4px; color:#fff; width:65px; text-align:center;"></td>
            <td><input type="number" step="0.01" value="${item.rate}" oninput="lastExtractedData.items[${i}].rate=this.value" style="font-size:0.75rem; padding:6px; background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.1); border-radius:4px; color:#fff; width:85px; text-align:right;"></td>
            <td><input type="number" value="${item.gst}" oninput="lastExtractedData.items[${i}].gst=this.value" style="font-size:0.75rem; padding:6px; background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.1); border-radius:4px; color:#fff; width:55px; text-align:center;"></td>
            <td style="text-align:center;"><button onclick="removeExtRow(${i})" style="background:none; border:none; color:#ef4444; cursor:pointer;"><i class="fas fa-trash"></i></button></td>
        </tr>
    `).join('');
}

function cancelUpload() {
    clearInvoiceRegistry();
}

function clearInvoiceRegistry(silent = false) {
    document.getElementById('ext-preview-section')?.classList.add('hidden');
    const fileInput = document.getElementById('ext-inv-file');
    if (!silent && fileInput) fileInput.value = '';

    const fields = [
        'ext-inv-no', 'ext-inv-date', 'ext-inv-pos',
        'prof-name', 'prof-phone', 'prof-email', 'prof-address', 'prof-pin', 
        'prof-fssai', 'prof-city', 'prof-state', 'prof-dl', 'prof-gst', 
        'prof-bank', 'prof-ifsc'
    ];
    fields.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });

    lastExtractedData = null;
    const tbody = document.getElementById('ext-preview-body');
    if (tbody) tbody.innerHTML = '';
    
    if (!silent) showCenteredMessage("Invoice Registry cleared. Ready for new upload.", "info");
}

// GLOBAL ALERT SYSTEM
function showCenteredMessage(msg, type = "info") {
    const overlay = document.getElementById('globalAlertOverlay');
    const box = document.getElementById('globalAlertBox');
    const iconEl = document.getElementById('alertIcon');
    const titleEl = document.getElementById('alertTitle');
    const msgEl = document.getElementById('alertMsg');

    if (!overlay) return alert(msg);

    // Reset classes
    box.className = '';
    
    // Configure based on type
    let icon = "ℹ️", title = "Information", colorClass = "alert-info";
    
    if (type === "success") {
        icon = "✅"; title = "Success"; colorClass = "alert-success";
    } else if (type === "error") {
        icon = "❌"; title = "Error"; colorClass = "alert-error";
    } else if (type === "warning") {
        icon = "⚠️"; title = "Warning"; colorClass = "alert-warning";
    }

    box.classList.add(colorClass);
    iconEl.innerHTML = icon;
    titleEl.innerText = title;
    msgEl.innerText = msg;

    overlay.classList.remove('hidden');
    // Force reflow
    void overlay.offsetWidth;
    overlay.classList.add('show-alert');
}

function closeAlert() {
    const overlay = document.getElementById('globalAlertOverlay');
    if (overlay) {
        overlay.classList.remove('show-alert');
        setTimeout(() => overlay.classList.add('hidden'), 300);
    }
}

function downloadParsedInvoiceAsExcel() {
    if (!lastExtractedData || !lastExtractedData.items || lastExtractedData.items.length === 0) {
        showCenteredMessage("No extracted data available to download.", "error");
        return;
    }

    try {
        const invoiceNo = document.getElementById('ext-inv-no').value || lastExtractedData.invoiceNo || 'DRAFT';
        const invoiceDate = document.getElementById('ext-inv-date').value || lastExtractedData.date || '';

        // Construct rows for SheetJS
        const excelRows = lastExtractedData.items.map((item, idx) => ({
            "S.No": idx + 1,
            "Product Name": (item.name || '').toUpperCase(),
            "HSN Code": item.hsn || '',
            "Batch": (item.batch || '').toUpperCase(),
            "Expiry": item.expDate || '',
            "MRP (INR)": Number(item.mrp) || 0,
            "Quantity": Number(item.qty) || 0,
            "Billed Rate (INR)": Number(item.rate) || 0,
            "GST %": Number(item.gst) || 12,
            "Total Value (Ex. GST) (INR)": (Number(item.qty) || 0) * (Number(item.rate) || 0),
        }));

        const ws = XLSX.utils.json_to_sheet(excelRows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Invoice Data");

        // Beautify column widths
        const maxLens = {};
        excelRows.forEach(row => {
            Object.keys(row).forEach(key => {
                const val = String(row[key]);
                maxLens[key] = Math.max(maxLens[key] || 10, val.length + 3);
            });
        });
        ws['!cols'] = Object.keys(maxLens).map(key => ({ wch: maxLens[key] }));

        XLSX.writeFile(wb, `EMYRIS_Invoice_${invoiceNo}_${invoiceDate}.xlsx`);
        showCenteredMessage("📊 Excel sheet downloaded successfully!", "success");
    } catch (err) {
        console.error("❌ Failed to download Excel:", err);
        showCenteredMessage(`Failed to generate Excel: ${err.message}`, "error");
    }
}

// ==========================================
// 🗺️ VISUAL INVOICE CALIBRATION & MEMORIZATION SYSTEM
// ==========================================
window.calTokens = [];

async function openCalibrationModal() {
    if (!currentUser) {
        return showCenteredMessage("Session expired. Please login again.", "error");
    }

    const stockistId = currentUser._id || currentUser.id;
    document.getElementById('cal-distributor-name').innerText = currentUser.name || "Default Stockist";
    document.getElementById('cal-distributor-code').innerText = `ID: ${stockistId} | Code: ${currentUser.loginId || 'N/A'}`;

    // Load saved template
    try {
        const res = await fetch(`${API_BASE}/admin/ocr-templates/${stockistId}`);
        const data = await res.json();
        
        if (data.success && data.template) {
            const t = data.template;
            document.getElementById('cal-anchor').value = t.anchorKeyword || 'HSN';
            document.getElementById('cal-product-start').value = t.colProductStart;
            document.getElementById('cal-product-end').value = t.colProductEnd;
            document.getElementById('cal-hsn-start').value = t.colHSNStart !== undefined ? t.colHSNStart : "36.0";
            document.getElementById('cal-hsn-end').value = t.colHSNEnd !== undefined ? t.colHSNEnd : "42.0";
            document.getElementById('cal-batch-start').value = t.colBatchStart;
            document.getElementById('cal-batch-end').value = t.colBatchEnd;
            document.getElementById('cal-exp-start').value = t.colExpStart;
            document.getElementById('cal-exp-end').value = t.colExpEnd;
            document.getElementById('cal-mrp-start').value = t.colMRPStart;
            document.getElementById('cal-mrp-end').value = t.colMRPEnd;
            document.getElementById('cal-rate-start').value = t.colRateStart;
            document.getElementById('cal-rate-end').value = t.colRateEnd;
            document.getElementById('cal-qty-start').value = t.colQtyStart;
            document.getElementById('cal-qty-end').value = t.colQtyEnd;
        } else {
            // Default template values
            document.getElementById('cal-anchor').value = "HSN";
            document.getElementById('cal-product-start').value = "5.0";
            document.getElementById('cal-product-end').value = "35.0";
            document.getElementById('cal-hsn-start').value = "36.0";
            document.getElementById('cal-hsn-end').value = "42.0";
            document.getElementById('cal-batch-start').value = "43.0";
            document.getElementById('cal-batch-end').value = "55.0";
            document.getElementById('cal-exp-start').value = "56.0";
            document.getElementById('cal-exp-end').value = "64.0";
            document.getElementById('cal-mrp-start').value = "65.0";
            document.getElementById('cal-mrp-end').value = "72.0";
            document.getElementById('cal-rate-start').value = "73.0";
            document.getElementById('cal-rate-end').value = "82.0";
            document.getElementById('cal-qty-start').value = "83.0";
            document.getElementById('cal-qty-end').value = "95.0";
        }
    } catch (e) {
        console.error("❌ Failed to fetch saved blueprint template:", e);
    }

    const modal = document.getElementById('calibrationModal');
    modal.style.display = 'flex';
    modal.classList.remove('hidden');

    // Trigger visual overlay updates
    updateCalGuides();

    // Check if file is already selected in main uploader
    const fileInput = document.getElementById('ext-inv-file');
    if (fileInput.files && fileInput.files[0]) {
        analyzeCalibrationPDF(fileInput.files[0]);
    } else {
        document.getElementById('cal-tokens-board').innerHTML = `
            <div style="display:flex; flex-direction:column; justify-content:center; align-items:center; height:100%; color:var(--text-muted); font-style:italic; padding: 4rem 1rem; text-align: center; gap: 15px;">
                <i class="fas fa-file-pdf" style="font-size: 3rem; opacity: 0.2; color: var(--accent);"></i>
                <div>No file uploaded. Please select a PDF invoice in the registry first, then click Map Layout!</div>
            </div>
        `;
    }
}

function closeCalibrationModal() {
    const modal = document.getElementById('calibrationModal');
    modal.style.display = 'none';
    modal.classList.add('hidden');
    
    // Clear preview drawer
    document.getElementById('cal-preview-panel').style.display = 'none';
}

function updateCalGuides() {
    const getVal = (id) => parseFloat(document.getElementById(id).value) || 0;

    const pS = getVal('cal-product-start'), pE = getVal('cal-product-end');
    const hS = getVal('cal-hsn-start'), hE = getVal('cal-hsn-end');
    const bS = getVal('cal-batch-start'), bE = getVal('cal-batch-end');
    const eS = getVal('cal-exp-start'), eE = getVal('cal-exp-end');
    const mS = getVal('cal-mrp-start'), mE = getVal('cal-mrp-end');
    const rS = getVal('cal-rate-start'), rE = getVal('cal-rate-end');
    const qS = getVal('cal-qty-start'), qE = getVal('cal-qty-end');

    // Update textual badges
    document.getElementById('cal-label-val-product').innerText = `${pS.toFixed(1)} - ${pE.toFixed(1)}`;
    document.getElementById('cal-label-val-hsn').innerText = `${hS.toFixed(1)} - ${hE.toFixed(1)}`;
    document.getElementById('cal-label-val-batch').innerText = `${bS.toFixed(1)} - ${bE.toFixed(1)}`;
    document.getElementById('cal-label-val-exp').innerText = `${eS.toFixed(1)} - ${eE.toFixed(1)}`;
    document.getElementById('cal-label-val-mrp').innerText = `${mS.toFixed(1)} - ${mE.toFixed(1)}`;
    document.getElementById('cal-label-val-rate').innerText = `${rS.toFixed(1)} - ${rE.toFixed(1)}`;
    document.getElementById('cal-label-val-qty').innerText = `${qS.toFixed(1)} - ${qE.toFixed(1)}`;

    // Shift transparent guide overlay rectangles
    const setGuide = (id, start, end) => {
        const el = document.getElementById(`cal-guide-${id}`);
        if (el) {
            el.style.left = `${start * 10}px`;
            el.style.width = `${(end - start) * 10}px`;
        }
    };

    setGuide('product', pS, pE);
    setGuide('hsn', hS, hE);
    setGuide('batch', bS, bE);
    setGuide('exp', eS, eE);
    setGuide('mrp', mS, mE);
    setGuide('rate', rS, rE);
    setGuide('qty', qS, qE);

    // Colorize rendered token elements in real-time
    const tokens = document.querySelectorAll('.cal-token-item');
    tokens.forEach(tok => {
        const x = parseFloat(tok.dataset.x);
        const w = parseFloat(tok.dataset.w);
        const cx = x + w / 2;

        const inside = (start, end) => (cx >= start && cx <= end);

        // Reset styling
        tok.style.color = '#fff';
        tok.style.background = 'rgba(255,255,255,0.02)';
        tok.style.borderColor = 'rgba(255,255,255,0.05)';
        tok.style.boxShadow = 'none';

        if (inside(pS, pE)) {
            tok.style.color = '#818cf8'; // product
            tok.style.background = 'rgba(99, 102, 241, 0.15)';
            tok.style.borderColor = 'rgba(99, 102, 241, 0.4)';
        } else if (inside(hS, hE)) {
            tok.style.color = '#fbbf24'; // hsn
            tok.style.background = 'rgba(245, 158, 11, 0.15)';
            tok.style.borderColor = 'rgba(245, 158, 11, 0.4)';
        } else if (inside(bS, bE)) {
            tok.style.color = '#34d399'; // batch
            tok.style.background = 'rgba(16, 185, 129, 0.15)';
            tok.style.borderColor = 'rgba(16, 185, 129, 0.4)';
        } else if (inside(eS, eE)) {
            tok.style.color = '#a78bfa'; // exp
            tok.style.background = 'rgba(139, 92, 246, 0.15)';
            tok.style.borderColor = 'rgba(139, 92, 246, 0.4)';
        } else if (inside(mS, mE)) {
            tok.style.color = '#f472b6'; // mrp
            tok.style.background = 'rgba(236, 72, 153, 0.15)';
            tok.style.borderColor = 'rgba(236, 72, 153, 0.4)';
        } else if (inside(rS, rE)) {
            tok.style.color = '#38bdf8'; // rate
            tok.style.background = 'rgba(14, 165, 233, 0.15)';
            tok.style.borderColor = 'rgba(14, 165, 233, 0.4)';
        } else if (inside(qS, qE)) {
            tok.style.color = '#f87171'; // qty
            tok.style.background = 'rgba(239, 68, 68, 0.15)';
            tok.style.borderColor = 'rgba(239, 68, 68, 0.4)';
        }
    });
}

async function analyzeCalibrationPDF(file) {
    if (!file) return;

    const board = document.getElementById('cal-tokens-board');
    board.innerHTML = `
        <div style="display:flex; flex-direction:column; justify-content:center; align-items:center; height:100%; color:var(--primary); padding: 5rem 0; text-align: center; gap: 15px;">
            <i class="fas fa-spinner fa-spin" style="font-size: 3rem;"></i>
            <div>🤖 AI Engine analyzing PDF layout coordinates, please wait...</div>
        </div>
    `;

    const formData = new FormData();
    formData.append('file', file);

    try {
        const res = await fetch(`${API_BASE}/admin/ocr-analyze-pdf`, {
            method: 'POST',
            body: formData
        });
        const data = await res.json();
        
        if (data.success && data.tokens) {
            window.calTokens = data.tokens;
            board.innerHTML = '';
            
            if (data.tokens.length === 0) {
                board.innerHTML = '<div style="display:flex; justify-content:center; align-items:center; height:100%; color:#ef4444; padding:5rem 0;">No text tokens extracted from this PDF.</div>';
                return;
            }

            data.tokens.forEach(tok => {
                const div = document.createElement('div');
                div.style.position = 'absolute';
                div.style.left = `${tok.x * 10}px`;
                div.style.top = `${tok.y * 30 + (tok.page - 1) * 1300}px`; // Stack pages with vertical gap
                div.style.width = `${tok.w * 10}px`;
                div.style.padding = '2px';
                div.style.fontSize = '9px';
                div.style.fontWeight = 'bold';
                div.style.color = '#fff';
                div.style.background = 'rgba(255,255,255,0.02)';
                div.style.border = '1px solid rgba(255,255,255,0.05)';
                div.style.borderRadius = '3px';
                div.style.whiteSpace = 'nowrap';
                div.style.overflow = 'hidden';
                div.innerText = tok.text;
                div.className = 'cal-token-item';
                div.dataset.x = tok.x;
                div.dataset.w = tok.w;
                board.appendChild(div);
            });

            // Adjust workspace container size to fit height
            const maxPage = Math.max(...data.tokens.map(t => t.page));
            board.style.height = `${maxPage * 1350}px`;
            
            showCenteredMessage("PDF coordinate matrix computed! Column guides applied.", "success");
            updateCalGuides();
        } else {
            board.innerHTML = `<div style="display:flex; justify-content:center; align-items:center; height:100%; color:#ef4444; padding:5rem 0; text-align:center;">Extraction Error: ${data.message || 'Unknown error'}</div>`;
        }
    } catch (e) {
        console.error("❌ PDF extraction failure:", e);
        board.innerHTML = `<div style="display:flex; justify-content:center; align-items:center; height:100%; color:#ef4444; padding:5rem 0; text-align:center;">Connection Error: ${e.message}</div>`;
    }
}

function verifyCalLayoutLocal() {
    if (!window.calTokens || window.calTokens.length === 0) {
        return showCenteredMessage("Please upload/load a sample invoice PDF before running local verification.", "warning");
    }

    const anchorKeyword = document.getElementById('cal-anchor').value.trim() || 'HSN';
    const pS = parseFloat(document.getElementById('cal-product-start').value) || 0;
    const pE = parseFloat(document.getElementById('cal-product-end').value) || 0;
    const hS = parseFloat(document.getElementById('cal-hsn-start').value) || 0;
    const hE = parseFloat(document.getElementById('cal-hsn-end').value) || 0;
    const bS = parseFloat(document.getElementById('cal-batch-start').value) || 0;
    const bE = parseFloat(document.getElementById('cal-batch-end').value) || 0;
    const eS = parseFloat(document.getElementById('cal-exp-start').value) || 0;
    const eE = parseFloat(document.getElementById('cal-exp-end').value) || 0;
    const mS = parseFloat(document.getElementById('cal-mrp-start').value) || 0;
    const mE = parseFloat(document.getElementById('cal-mrp-end').value) || 0;
    const rS = parseFloat(document.getElementById('cal-rate-start').value) || 0;
    const rE = parseFloat(document.getElementById('cal-rate-end').value) || 0;
    const qS = parseFloat(document.getElementById('cal-qty-start').value) || 0;
    const qE = parseFloat(document.getElementById('cal-qty-end').value) || 0;

    // Locate visual anchor keyword
    const anchorToken = window.calTokens.find(t => t.text.toUpperCase().includes(anchorKeyword.toUpperCase()));
    const anchorY = anchorToken ? anchorToken.y : 0;

    // Sort and group by line Y (threshold 0.25)
    const tokens = [...window.calTokens];
    tokens.sort((a, b) => {
        if (a.page !== b.page) return a.page - b.page;
        return a.y - b.y;
    });

    let rows = [];
    let currentY = -1;
    let currentRow = [];
    let yThreshold = 0.25;

    tokens.forEach(token => {
        if (anchorToken && token.page === 1 && token.y <= anchorY) return;
        
        const lower = token.text.toLowerCase();
        if (lower === 'total' || lower === 'grand total' || lower.includes('for ') || lower.includes('authorized')) return;

        if (currentY === -1 || Math.abs(token.y - currentY) > yThreshold) {
             if (currentRow.length > 0) {
                 rows.push({ y: currentY, page: token.page, tokens: currentRow });
             }
             currentRow = [token];
             currentY = token.y;
        } else {
             currentRow.push(token);
        }
    });
    if (currentRow.length > 0) {
        rows.push({ y: currentY, page: tokens[tokens.length - 1].page, tokens: currentRow });
    }

    let extractedItems = [];
    rows.forEach(row => {
        let productText = [];
        let hsnText = "";
        let batchText = "";
        let expText = "";
        let mrpText = "";
        let rateText = "";
        let qtyText = "";

        row.tokens.forEach(tok => {
            const centerX = tok.x + tok.w / 2;

            const checkIn = (start, end) => (centerX >= start && centerX <= end);

            if (checkIn(pS, pE)) {
                productText.push(tok.text);
            } else if (checkIn(hS, hE)) {
                hsnText = tok.text;
            } else if (checkIn(bS, bE)) {
                batchText = tok.text;
            } else if (checkIn(eS, eE)) {
                expText = tok.text;
            } else if (checkIn(mS, mE)) {
                mrpText = tok.text;
            } else if (checkIn(rS, rE)) {
                rateText = tok.text;
            } else if (checkIn(qS, qE)) {
                qtyText = tok.text;
            }
        });

        const name = productText.join(" ").trim().toUpperCase();
        const cleanNum = (txt) => {
            if (!txt) return 0;
            return parseFloat(txt.replace(/,/g, '').replace(/[^0-9.]/g, '')) || 0;
        };

        const qty = cleanNum(qtyText);
        const mrp = cleanNum(mrpText);
        const rate = cleanNum(rateText);

        if (name && name.length > 2 && (qty > 0 || mrp > 0 || batchText)) {
            extractedItems.push({
                name,
                hsn: hsnText.trim() || "3004",
                batch: batchText.trim().toUpperCase() || "EXTRACTED",
                expDate: expText.trim() || "12/2026",
                mrp: mrp || 0,
                qty: qty || 0,
                rate: rate || 0
            });
        }
    });

    // Render test table in verify drawer
    const tbody = document.getElementById('cal-preview-body');
    if (extractedItems.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color:#ef4444; padding:3rem 0;">No items extracted. Try shifting ranges to match visual text coordinates.</td></tr>`;
    } else {
        tbody.innerHTML = extractedItems.map(item => `
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                <td style="font-weight:700; color:#fff; padding: 8px 10px;">${item.name}</td>
                <td style="color:#34d399; font-weight:800; padding: 8px 10px;">${item.batch}</td>
                <td style="text-align:right; font-family:monospace; padding: 8px 10px;">₹${item.mrp.toFixed(2)}</td>
                <td style="text-align:right; font-family:monospace; color:#38bdf8; padding: 8px 10px;">₹${item.rate.toFixed(2)}</td>
                <td style="text-align:center; font-weight:800; color:#fbbf24; padding: 8px 10px;">${item.qty}</td>
            </tr>
        `).join('');
    }

    // Slide open drawer
    document.getElementById('cal-preview-panel').style.display = 'flex';
    showCenteredMessage(`Verification simulation complete! Successfully parsed ${extractedItems.length} lines.`, "success");
}

async function saveCalibrationTemplate() {
    if (!currentUser) return showCenteredMessage("Session expired. Please login again.", "error");

    const stockistId = currentUser._id || currentUser.id;
    const payload = {
        stockistId,
        anchorKeyword: document.getElementById('cal-anchor').value.trim() || 'HSN',
        colProductStart: parseFloat(document.getElementById('cal-product-start').value),
        colProductEnd: parseFloat(document.getElementById('cal-product-end').value),
        colHSNStart: parseFloat(document.getElementById('cal-hsn-start').value),
        colHSNEnd: parseFloat(document.getElementById('cal-hsn-end').value),
        colBatchStart: parseFloat(document.getElementById('cal-batch-start').value),
        colBatchEnd: parseFloat(document.getElementById('cal-batch-end').value),
        colExpStart: parseFloat(document.getElementById('cal-exp-start').value),
        colExpEnd: parseFloat(document.getElementById('cal-exp-end').value),
        colMRPStart: parseFloat(document.getElementById('cal-mrp-start').value),
        colMRPEnd: parseFloat(document.getElementById('cal-mrp-end').value),
        colRateStart: parseFloat(document.getElementById('cal-rate-start').value),
        colRateEnd: parseFloat(document.getElementById('cal-rate-end').value),
        colQtyStart: parseFloat(document.getElementById('cal-qty-start').value),
        colQtyEnd: parseFloat(document.getElementById('cal-qty-end').value)
    };

    try {
        const res = await fetch(`${API_BASE}/admin/ocr-templates`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        
        if (data.success) {
            showCenteredMessage("🎯 Invoice layout coordinate template memorized successfully!", "success");
            closeCalibrationModal();
            
            // Automatically trigger the main upload and parsing sequence on the active PDF
            const fileInput = document.getElementById('ext-inv-file');
            if (fileInput.files && fileInput.files[0]) {
                setTimeout(() => {
                    uploadExtInvoice();
                }, 600);
            }
        } else {
            showCenteredMessage(`Failed to save template: ${data.message}`, "error");
        }
    } catch (e) {
        console.error("❌ Failed to save template blueprint:", e);
        showCenteredMessage(`Save Error: ${e.message}`, "error");
    }
}
