const express = require('express');
const db = require('./models'); // Import Sequelize models
const cors = require('cors');
const dotenv = require('dotenv');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

dotenv.config();
const cloudinary = require('cloudinary').v2;

// Cloudinary Configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Ensure uploads folder exists
const uploadDir = path.join(__dirname, 'uploads', 'media');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Storage Configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ 
    storage,
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['audio/mpeg', 'video/mp4', 'audio/mp3'];
        if (allowedTypes.includes(file.mimetype)) cb(null, true);
        else cb(new Error('Invalid file type. Only MP3 and MP4 allowed.'));
    }
});
const docUpload = multer({ 
    storage,
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
        if (allowedTypes.includes(file.mimetype)) cb(null, true);
        else cb(new Error('Invalid file type. Only PDF, JPG, PNG allowed.'));
    }
});

const GOOGLE_SCRIPT_URL = process.env.GOOGLE_SCRIPT_URL;

// --- EMAIL CONFIGURATION (VIA GOOGLE SCRIPT BRIDGE) ---
async function sendEmail(to, subject, html, retryCount = 0) {
    if (!GOOGLE_SCRIPT_URL) {
        console.warn("⚠️ No GOOGLE_SCRIPT_URL configured. Email not sent to:", to);
        return false;
    }
    try {
        console.log(`📤 Attempting email (Attempt ${retryCount + 1}) to: ${to}`);
        const res = await axios.post(GOOGLE_SCRIPT_URL, { to, subject, html }, { timeout: 15000 });
        
        if (res.data && (res.data.status === 'success' || res.data.success === true)) {
            console.log(`✅ Email Sent Successfully to: ${to}`);
            return true;
        } else {
            throw new Error(res.data ? JSON.stringify(res.data) : "Unknown Bridge Error");
        }
    } catch (e) {
        console.error(`❌ Email attempt ${retryCount + 1} failed for ${to}:`, e.message);
        if (retryCount < 1) {
            console.log(`🔄 Retrying email to ${to}...`);
            return await sendEmail(to, subject, html, retryCount + 1);
        }
        return false;
    }
}

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(__dirname));

// --- CLOUD HEALTH CHECK ---
app.get('/health', (req, res) => res.status(200).json({ status: 'UP', timestamp: new Date() }));

// DB Stats (PostgreSQL version)
app.get('/api/admin/db-stats', async (req, res) => {
    try {
        const [[sizeResult]] = await db.sequelize.query('SELECT pg_database_size(current_database()) as size_bytes');
        const usedBytes = parseInt(sizeResult.size_bytes);
        const usedMB = (usedBytes / (1024 * 1024)).toFixed(2);
        const capacityMB = 1024; // Render Free Tier limit
        const percent = ((usedMB / capacityMB) * 100).toFixed(2);

        res.json({
            productCount: await db.Product.count(),
            stockistCount: await db.Stockist.count(),
            orderCount: await db.Order.count(),
            usedMB,
            capacityMB,
            percent,
            dbType: 'PostgreSQL',
            counters: (await db.Company.findOne())?.documentCounters || {}
        });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

async function getNextDocNo(type) {
    let company = await db.Company.findOne();
    if (!company) company = await db.Company.create({});
    
    const counters = company.documentCounters || {};
    const config = counters[type] || { prefix: type.toUpperCase().slice(0, 3) + '-', nextNumber: 0 };
    
    // Increment first so that if nextNumber was 0, the first doc is 0001
    config.nextNumber = (Number(config.nextNumber) || 0) + 1;
    const docNo = `${config.prefix}${config.nextNumber.toString().padStart(4, '0')}`;
    
    counters[type] = config;
    await company.update({ documentCounters: counters });
    return docNo;
}


app.get('/api/admin/company', async (req, res) => {
    try {
        let company = await db.Company.findOne();
        if (!company) company = await db.Company.create({});
        res.json({ success: true, company });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// --- PUBLIC CONFIG (FOR LANDING PAGE) ---
app.get('/api/public/config', async (req, res) => {
    try {
        const company = await db.Company.findOne();
        if (!company) return res.json({ success: true, config: {} });
        
        // Return only safe fields
        res.json({ 
            success: true, 
            config: {
                name: company.name,
                address: company.address,
                websites: company.websites,
                phones: company.phones,
                tollFree: company.tollFree,
                emails: company.emails,
                videoUrl: company.videoUrl,
                musicUrl: company.musicUrl,
                scrollingMessage: company.scrollingMessage
            }
        });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});


app.put('/api/admin/company', async (req, res) => {
    try {
        let company = await db.Company.findOne();
        if (!company) company = await db.Company.create({});
        await company.update(req.body);
        res.json({ success: true, company });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// --- MULTIMEDIA & BRANDING UPLOADS ---

app.post('/api/admin/upload-media', upload.single('media'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded" });
        const { type } = req.body;

        const result = await cloudinary.uploader.upload(req.file.path, {
            resource_type: type === 'video' ? 'video' : 'auto',
            folder: 'emyoms/media'
        });

        // Clean up local file
        fs.unlinkSync(req.file.path);

        const company = await db.Company.findOne();
        if (type === 'music') await company.update({ musicUrl: result.secure_url });
        else if (type === 'video') await company.update({ videoUrl: result.secure_url });

        res.json({ success: true, url: result.secure_url });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.post('/api/admin/settings/upload-design', docUpload.single('design'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ success: false, error: "No file uploaded" });

        const result = await cloudinary.uploader.upload(req.file.path, {
            resource_type: 'auto',
            folder: 'emyoms/blueprints'
        });

        fs.unlinkSync(req.file.path);

        const company = await db.Company.findOne();
        await company.update({ referenceInvoiceUrl: result.secure_url });

        res.json({ success: true, url: result.secure_url });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.post('/api/admin/upload-logo', docUpload.single('logo'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ success: false, error: "No file uploaded" });
        const result = await cloudinary.uploader.upload(req.file.path, { folder: 'emyoms/branding' });
        fs.unlinkSync(req.file.path);
        const company = await db.Company.findOne();
        await company.update({ logoImage: result.secure_url });
        res.json({ success: true, url: result.secure_url });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.post('/api/admin/upload-signature', docUpload.single('signature'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ success: false, error: "No file uploaded" });
        const result = await cloudinary.uploader.upload(req.file.path, { folder: 'emyoms/branding' });
        fs.unlinkSync(req.file.path);
        const company = await db.Company.findOne();
        await company.update({ signatureImage: result.secure_url });
        res.json({ success: true, url: result.secure_url });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

const PORT = process.env.PORT || 4000;

// Database Initialization & Server Start
db.sequelize.authenticate()
    .then(() => {
        console.log('✅ PostgreSQL Connected Successfully');
        return db.sequelize.sync({ alter: true });
    })
    .then(() => {
        console.log('✅ Database Models Synced');
        app.listen(PORT, () => {
            console.log(`🚀 EMYOMS Server running on http://localhost:${PORT}`);
        });
    })
    .catch(err => {
        console.error('❌ CRITICAL: Server Failed to Start:', err);
        process.exit(1); 
    });

// --- NEGOTIATION ENDPOINTS ---

app.put('/api/admin/orders/:orderId/items/:itemId/negotiate', async (req, res) => {
    const { action } = req.body;
    try {
        const order = await db.Order.findByPk(req.params.orderId, {
            include: [{ model: db.OrderItem, as: 'items' }]
        });
        if (!order) return res.status(404).json({ success: false, message: "Order not found" });

        const item = order.items.find(i => i.id == req.params.itemId);
        if (!item) return res.status(404).json({ success: false, message: "Item not found" });

        const { customRate } = req.body;
        const finalRate = customRate !== undefined ? Number(customRate) : (item.askingRate || item.priceUsed);

        if (action === 'reject') {
            item.priceUsed = item.masterRate;
            item.askingRate = null;
        } else if (action === 'onetime') {
            item.priceUsed = finalRate;
        } else {
            item.priceUsed = finalRate;
            let expiry = new Date();
            if (action === 'month') expiry.setMonth(expiry.getMonth() + 1);
            if (action === 'year') expiry.setFullYear(expiry.getFullYear() + 1);

            const stockist = await db.Stockist.findByPk(order.stockistId);
            const negotiatedPrices = stockist.negotiatedPrices.filter(p => p.productId !== item.productId);
            negotiatedPrices.push({
                productId: item.productId,
                lockedRate: item.priceUsed,
                expiryDate: expiry,
                note: item.negotiationNote
            });
            await stockist.update({ negotiatedPrices });
        }

        item.totalValue = Number((Number(item.priceUsed || 0) * Number(item.qty || 0)).toFixed(2));
        await item.save();

        // Recalculate Totals
        const allItems = await db.OrderItem.findAll({ where: { orderId: order.id } });
        let newSubTotal = 0;
        let newGstAmount = 0;

        for (const i of allItems) {
            const rate = Number(i.gstPercent || 0);
            const val = Number(i.totalValue || 0);
            newSubTotal += val;
            newGstAmount += Number(((val * rate) / 100).toFixed(2));
        }

        await order.update({
            subTotal: Number(newSubTotal.toFixed(2)),
            gstAmount: Number(newGstAmount.toFixed(2)),
            grandTotal: Math.round(newSubTotal + newGstAmount)
        });


        res.json({ success: true, order });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// --- ADMIN AUTH ---
app.post('/api/admin/login', (req, res) => {
    const { adminId, password } = req.body;
    const correctId = process.env.ADMIN_ID || "EMYRIS";
    const correctPass = process.env.ADMIN_PASSWORD || "1234";
    
    if (adminId === correctId && password === correctPass) {
        res.json({ success: true, message: "Welcome Admin" });
    } else {
        res.status(401).json({ success: false, message: "Invalid Credentials" });
    }
});

// --- STOCKIST AUTH & REGISTRATION ---

app.post('/api/stockist/register', async (req, res) => {
    try {
        const { name, password, address, phone, email, dlNo, gstNo, fssaiNo, panNo, city, state, pincode } = req.body;
        
        let loginId;
        let isUnique = false;
        while (!isUnique) {
            loginId = 'EMY' + Math.floor(100000 + Math.random() * 900000);
            const existing = await db.Stockist.findOne({ where: { loginId } });
            if (!existing) isUnique = true;
        }

        const newStockist = await db.Stockist.create({ name, loginId, password, address, phone, email, dlNo, gstNo, fssaiNo, panNo, city, state, pincode });

        // Email logic stays the same...
        res.json({ success: true, loginId, password });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/stockist/login', async (req, res) => {
    let { loginId, password } = req.body;
    try {
        if (!loginId || !password) return res.status(400).json({ success: false, message: 'All fields required' });
        
        // Case-insensitive lookup for SQL
        const user = await db.Stockist.findOne({ 
            where: db.Sequelize.where(
                db.Sequelize.fn('LOWER', db.Sequelize.col('loginId')), 
                loginId.trim().toLowerCase()
            )
        });

        if (!user || user.password !== password.trim()) {
            return res.status(401).json({ success: false, message: 'Invalid Credentials' });
        }
        
        if (!user.approved) return res.status(403).json({ success: false, message: 'Account pending approval' });
        res.json({ success: true, user });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/stockist/profile/:id', async (req, res) => {
    try {
        const stockist = await db.Stockist.findByPk(req.params.id);
        if (!stockist) return res.status(404).json({ success: false, message: 'User not found' });
        res.json({ success: true, stockist });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/stockist/forgot-id-pw', async (req, res) => {
    let { email } = req.body;
    try {
        if (!email) return res.status(400).json({ success: false, message: 'Email is required' });
        email = email.trim().toLowerCase();
        
        const user = await db.Stockist.findOne({ 
            where: db.Sequelize.where(
                db.Sequelize.fn('LOWER', db.Sequelize.col('email')), 
                email
            )
        });
        
        if (!user) {
            return res.status(404).json({ success: false, message: 'No account found with this email address.' });
        }

        const emailContent = `
            <div style="font-family: Arial, sans-serif; padding: 20px; background: #f4f4f4;">
                <div style="background: #fff; padding: 30px; border-radius: 10px; max-width: 500px; margin: 0 auto;">
                    <h2 style="color: #6366f1;">EMYRIS BIOLIFESCIENCES</h2>
                    <p>Hello <strong>${user.name}</strong>,</p>
                    <p>Your account credentials are:</p>
                    <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
                        <p><strong>Login ID:</strong> ${user.loginId}</p>
                        <p><strong>Password:</strong> ${user.password}</p>
                    </div>
                </div>
            </div>
        `;

        await sendEmail(user.email, "Account Credentials Recovery", emailContent);
        res.json({ success: true, message: "Credentials sent to your email." });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- GLOBAL MASTERS ---

const addIdAlias = (data) => {
    if (Array.isArray(data)) return data.map(item => ({ ...item.toJSON(), _id: item.id }));
    if (data && data.toJSON) return { ...data.toJSON(), _id: data.id };
    return data;
};

app.get('/api/categories', async (req, res) => {
    try {
        const data = await db.Category.findAll();
        res.json(addIdAlias(data));
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/admin/categories', async (req, res) => {
    try {
        const item = await db.Category.create(req.body);
        res.json({ success: true, item: addIdAlias(item) });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/admin/categories/:id', async (req, res) => {
    try {
        await db.Category.destroy({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/hsns', async (req, res) => {
    try {
        const data = await db.HSN.findAll();
        res.json(addIdAlias(data));
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/admin/hsns', async (req, res) => {
    try {
        const item = await db.HSN.create(req.body);
        res.json({ success: true, item: addIdAlias(item) });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/admin/hsns/:id', async (req, res) => {
    try {
        await db.HSN.destroy({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/gst', async (req, res) => {
    try {
        const data = await db.GST.findAll();
        res.json(addIdAlias(data));
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/admin/gst', async (req, res) => {
    try {
        const item = await db.GST.create(req.body);
        res.json({ success: true, item: addIdAlias(item) });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/admin/gst/:id', async (req, res) => {
    try {
        await db.GST.destroy({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/groups', async (req, res) => {
    try {
        const data = await db.Group.findAll();
        res.json(addIdAlias(data));
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/admin/groups', async (req, res) => {
    try {
        const item = await db.Group.create(req.body);
        res.json({ success: true, item: addIdAlias(item) });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/admin/groups/:id', async (req, res) => {
    try {
        await db.Group.destroy({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/hq', async (req, res) => {
    try {
        const data = await db.HQ.findAll();
        res.json(addIdAlias(data));
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/admin/hq', async (req, res) => {
    try {
        const item = await db.HQ.create(req.body);
        res.json({ success: true, item: addIdAlias(item) });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/admin/hq/:id', async (req, res) => {
    try {
        await db.HQ.destroy({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/expense-categories', async (req, res) => {
    try {
        const data = await db.ExpenseCategory.findAll();
        res.json(addIdAlias(data));
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/admin/expense-categories', async (req, res) => {
    try {
        const item = await db.ExpenseCategory.create(req.body);
        res.json({ success: true, item: addIdAlias(item) });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- PRODUCT MANAGEMENT ---

app.get('/api/admin/products', async (req, res) => {
    try {
        const products = await db.Product.findAll({ 
            include: [{ model: db.Batch, as: 'batches' }],
            order: [['name', 'ASC']]
        });
        res.json(products);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/products', async (req, res) => {
    try {
        const products = await db.Product.findAll({ 
            where: { active: true },
            include: [{ model: db.Batch, as: 'batches' }]
        });
        res.json(products);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/admin/products', async (req, res) => {
    try {
        const product = await db.Product.create(req.body);
        if (req.body.batches && Array.isArray(req.body.batches)) {
            for (const b of req.body.batches) {
                await db.Batch.create({ ...b, productId: product.id });
            }
        }
        res.json({ success: true, product });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

app.put('/api/admin/products/:id', async (req, res) => {
    try {
        const product = await db.Product.findByPk(req.params.id);
        if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
        
        await product.update(req.body);
        
        if (req.body.batches) {
            await db.Batch.destroy({ where: { productId: product.id } });
            for (const b of req.body.batches) {
                await db.Batch.create({ ...b, productId: product.id });
            }
        }
        res.json({ success: true, product });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/products/:id', async (req, res) => {
    try {
        const product = await db.Product.findByPk(req.params.id);
        if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
        
        // Deleting the product will automatically clean up batches if cascading is enabled, 
        // but we'll do it explicitly here for safety since we're starting fresh.
        await db.Batch.destroy({ where: { productId: req.params.id } });
        await product.destroy();
        
        res.json({ success: true, message: 'Product deleted successfully' });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

app.delete('/api/admin/products/:id', async (req, res) => {
    try {
        await db.Batch.destroy({ where: { productId: req.params.id } });
        await db.Product.destroy({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});


app.post('/api/admin/products/bulk', async (req, res) => {
    try {
        const { products } = req.body;
        let success = 0;
        let failed = 0;

        for (const p of products) {
            try {
                await db.Product.create({
                    ...p,
                    active: true,
                    qtyAvailable: p.qtyAvailable || 0,
                    bonusScheme: { buy: p.buy || 0, get: p.get || 0 }
                });
                success++;
            } catch (e) { 
                console.error("Bulk Product Fail:", e.message);
                failed++; 
            }
        }
        res.json({ success: true, results: { success, failed } });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- SETTINGS ---

app.get('/api/admin/settings', async (req, res) => {
    let settings = await db.Company.findOne();
    if (!settings) settings = await db.Company.create({});
    res.json(settings);
});

app.post('/api/admin/settings', async (req, res) => {
    try {
        console.log("Settings Update Payload:", JSON.stringify(req.body, null, 2));
        let settings = await db.Company.findOne();
        if (!settings) {
            settings = await db.Company.create(req.body);
            console.log("Settings created successfully");
        } else {
            await settings.update(req.body);
            console.log("Settings updated successfully");
        }
        res.json({ success: true, settings });
    } catch (e) { 
        console.error("Settings Update Fail:", e);
        res.status(500).json({ error: e.message }); 
    }
});

// --- STOCKIST MANAGEMENT ---

app.get('/api/admin/stockists', async (req, res) => {
    try {
        const { type } = req.query;
        let where = {};
        if (type === 'pending') where.approved = false;
        else if (type === 'approved') where.approved = true;

        const stockists = await db.Stockist.findAll({ 
            where,
            order: [['name', 'ASC']]
        });
        res.json(stockists);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/admin/stockists', async (req, res) => {
    try {
        const stockist = await db.Stockist.create(req.body);
        res.json({ success: true, stockist });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/admin/stockists/bulk', async (req, res) => {
    try {
        const { stockists } = req.body;
        let success = 0;
        let failed = 0;

        for (const s of stockists) {
            try {
                // Check for existing loginId
                const existing = await db.Stockist.findOne({ where: { loginId: s.loginId } });
                if (existing) { failed++; continue; }

                await db.Stockist.create({
                    ...s,
                    approved: true,
                    outstandingBalance: s.outstandingBalance || 0
                });
                success++;
            } catch (e) { 
                console.error("Bulk Stockist Fail:", e.message);
                failed++; 
            }
        }
        res.json({ success: true, results: { success, failed } });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/admin/stockists/:id', async (req, res) => {
    try {
        const stockist = await db.Stockist.findByPk(req.params.id);
        if (!stockist) return res.status(404).json({ success: false, message: 'Stockist not found' });
        await stockist.update(req.body);
        res.json({ success: true, stockist });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/admin/stockists/:id/approve', async (req, res) => {
    try {
        const stockist = await db.Stockist.findByPk(req.params.id);
        if (!stockist) return res.status(404).json({ success: false, message: 'Stockist not found' });
        await stockist.update({ approved: true });
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/admin/stockists/:id', async (req, res) => {
    try {
        await db.Stockist.destroy({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- MEDIA UPLOADS (Cloudinary) ---

app.post('/api/admin/upload-media', upload.single('media'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
        const { type } = req.body;

        const result = await cloudinary.uploader.upload(req.file.path, {
            resource_type: 'auto',
            folder: 'emyris_media'
        });

        // Update company profile & Save to Media Library
        const settings = await db.Company.findOne();
        if (settings) {
            if (type === 'music') await settings.update({ musicUrl: result.secure_url });
            else if (type === 'video') await settings.update({ videoUrl: result.secure_url });
        }
        await db.Media.create({
            name: req.file.originalname,
            url: result.secure_url,
            type: type || 'document'
        });

        // Clean up local file
        fs.unlinkSync(req.file.path);

        res.json({ success: true, url: result.secure_url });
    } catch (e) { 
        console.error("Upload Error:", e);
        res.status(500).json({ success: false, message: e.message }); 
    }
});

app.post('/api/admin/settings/upload-design', docUpload.single('design'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded' });

        const result = await cloudinary.uploader.upload(req.file.path, {
            resource_type: 'auto',
            folder: 'emyris_blueprints'
        });

        const settings = await db.Company.findOne();
        if (settings) {
            await settings.update({ referenceInvoiceUrl: result.secure_url });
        }

        await db.Media.create({
            name: req.file.originalname,
            url: result.secure_url,
            type: 'document'
        });

        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        res.json({ success: true, url: result.secure_url });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.post('/api/admin/upload-logo', docUpload.single('logo'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ success: false, error: 'No logo file' });
        const result = await cloudinary.uploader.upload(req.file.path, { folder: 'emyris_branding' });
        const settings = await db.Company.findOne();
        if (settings) await settings.update({ logoImage: result.secure_url });
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        res.json({ success: true, url: result.secure_url });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.post('/api/admin/upload-signature', docUpload.single('signature'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ success: false, error: 'No signature file' });
        const result = await cloudinary.uploader.upload(req.file.path, { folder: 'emyris_branding' });
        const settings = await db.Company.findOne();
        if (settings) await settings.update({ signatureImage: result.secure_url });
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        res.json({ success: true, url: result.secure_url });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// --- MEDIA LIBRARY ENDPOINTS ---
app.get('/api/admin/media', async (req, res) => {
    try {
        const media = await db.Media.findAll({ order: [['createdAt', 'DESC']] });
        res.json(media);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/admin/media/:id', async (req, res) => {
    try {
        await db.Media.destroy({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Orders

app.post('/api/orders', async (req, res) => {
    try {
        const { stockistId, stockistCode, items, subTotal, gstAmount, grandTotal } = req.body;
        
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const orderCount = await db.Order.count();
        const orderNo = `EMY-${dateStr}-${(orderCount + 1).toString().padStart(4, '0')}`;

        const newOrder = await db.Order.create({
            orderNo,
            stockistId,
            stockistCode,
            subTotal,
            gstAmount,
            grandTotal
        });

        for (const item of items) {
            await db.OrderItem.create({
                ...item,
                orderId: newOrder.id
            });
        }

        res.json({ success: true, order: newOrder });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/orders/my-orders/:id', async (req, res) => {
    try {
        const orders = await db.Order.findAll({
            where: { stockistId: req.params.id },
            include: [{ model: db.OrderItem, as: 'items' }],
            order: [['createdAt', 'DESC']]
        });
        res.json(orders);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/admin/orders', async (req, res) => {
    try {
        const orders = await db.Order.findAll({ 
            include: [
                { model: db.Stockist },
                { model: db.OrderItem, as: 'items' }
            ],
            order: [['createdAt', 'DESC']]
        });
        res.json(orders);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/admin/orders/:id/approve', async (req, res) => {
    try {
        const { approvedBy, selectedHq, batchSelections } = req.body;
        const order = await db.Order.findByPk(req.params.id, {
            include: [{ model: db.OrderItem, as: 'items' }]
        });
        
        if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
        if (order.status === 'approved') return res.status(400).json({ success: false, message: 'Order already approved' });

        for (const item of order.items) {
            let totalDeduction = (item.qty || 0) + (item.bonusQty || 0);
            if (totalDeduction > 0) {
                const product = await db.Product.findByPk(item.productId);
                if (product) {
                    await product.decrement('qtyAvailable', { by: totalDeduction });
                    
                    const selectedBatchNo = batchSelections ? batchSelections[item.id] : null;
                    let firstBatch = null;

                    if (selectedBatchNo) {
                        const targetBatch = await db.Batch.findOne({ where: { productId: item.productId, batchNo: selectedBatchNo } });
                        if (targetBatch && targetBatch.qtyAvailable >= totalDeduction) {
                            await targetBatch.decrement('qtyAvailable', { by: totalDeduction });
                            firstBatch = targetBatch;
                            totalDeduction = 0;
                        }
                    }

                    if (totalDeduction > 0) {
                        const batches = await db.Batch.findAll({ 
                            where: { productId: item.productId },
                            order: [['expDate', 'ASC']]
                        });

                        for (const b of batches) {
                            if (totalDeduction <= 0) break;
                            if (b.qtyAvailable > 0 && b.batchNo !== selectedBatchNo) {
                                if (!firstBatch) firstBatch = b;
                                const deduct = Math.min(b.qtyAvailable, totalDeduction);
                                await b.decrement('qtyAvailable', { by: deduct });
                                totalDeduction -= deduct;
                            }
                        }
                    }
                    
                    if (firstBatch) {
                        await item.update({
                            batch: firstBatch.batchNo,
                            mfgDate: firstBatch.mfgDate,
                            expDate: firstBatch.expDate
                        });
                    }
                }
            }
        }

        await order.update({ status: 'approved', hq: selectedHq || order.hq });
        res.json({ success: true, order });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/admin/invoices', async (req, res) => {
    try {
        const invoices = await db.Invoice.findAll({ 
            include: [
                { model: db.Stockist },
                { model: db.InvoiceItem, as: 'items' }
            ],
            order: [['createdAt', 'DESC']]
        });
        res.json(invoices);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/stockist/invoice/:invoiceNo', async (req, res) => {
    try {
        const { stockistId } = req.query;
        const invoice = await db.Invoice.findOne({
            where: { invoiceNo: req.params.invoiceNo, stockistId },
            include: [
                { 
                    model: db.InvoiceItem, 
                    as: 'items',
                    include: [{ model: db.Product }] // Added product inclusion
                }
            ]
        });
        if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found or access denied' });

        // Fetch previously claimed quantities for this invoice (Pending or Approved)
        const existingClaims = await db.PDCNClaim.findAll({
            where: { invoiceNo: invoice.invoiceNo, stockistId, status: { [db.Sequelize.Op.ne]: 'rejected' } },
            include: [{ model: db.PDCNClaimItem, as: 'items' }]
        });

        const claimedSummary = {}; // { productId: totalQty }
        existingClaims.forEach(c => {
            c.items.forEach(i => {
                claimedSummary[i.productId] = (claimedSummary[i.productId] || 0) + Number(i.qty || 0);
            });
        });

        // Attach claimed quantity to each invoice item
        const invoiceData = invoice.toJSON();
        invoiceData.items.forEach(item => {
            item.alreadyClaimedQty = claimedSummary[item.productId] || 0;
            item.availableQty = Math.max(0, Number(item.qty || 0) - item.alreadyClaimedQty);
        });

        res.json({ success: true, invoice: invoiceData });

    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.get('/api/stockist/invoices', async (req, res) => {
    try {
        const { stockistId } = req.query;
        const invoices = await db.Invoice.findAll({
            where: { stockistId },
            attributes: ['id', 'invoiceNo', 'grandTotal', 'createdAt'],
            order: [['createdAt', 'DESC']]
        });
        res.json({ success: true, invoices });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.get('/api/stockist/orders/:orderId/invoice', async (req, res) => {
    try {
        const invoice = await db.Invoice.findOne({
            where: { orderId: req.params.orderId },
            include: [
                { model: db.InvoiceItem, as: 'items' },
                { model: db.Stockist }
            ]
        });
        if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
        res.json({ success: true, invoice });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.post('/api/admin/invoices/generate/:orderId', async (req, res) => {
    try {
        const order = await db.Order.findByPk(req.params.orderId, {
            include: [{ model: db.OrderItem, as: 'items' }]
        });
        if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
        
        // Check if invoice already exists
        const existing = await db.Invoice.findOne({ where: { orderId: order.id } });
        if (existing) return res.status(400).json({ success: false, message: 'Invoice already generated for this order' });

        const invoiceNo = await getNextDocNo('invoice');
        
        // Ensure totals are rounded
        const roundedGrandTotal = Math.round(order.grandTotal);

        const newInvoice = await db.Invoice.create({
            invoiceNo,
            orderId: order.id,
            stockistId: order.stockistId,
            subTotal: order.subTotal,
            gstAmount: order.gstAmount,
            grandTotal: roundedGrandTotal,
            outstandingAmount: roundedGrandTotal,
            status: 'approved'
        });

        // Copy Items
        for (const item of order.items) {
            await db.InvoiceItem.create({
                invoiceId: newInvoice.id,
                productId: item.productId,
                name: item.name,
                manufacturer: item.manufacturer,
                batch: item.batch,
                qty: item.qty,
                priceUsed: item.priceUsed,
                mrp: item.mrp,
                gstPercent: item.gstPercent,
                totalValue: item.totalValue,
                hsn: item.hsn,
                bonusQty: item.bonusQty || 0
            });

        }

        await order.update({ status: 'invoiced' });
        res.json({ success: true, invoice: newInvoice });
    } catch (err) { 
        console.error("Invoice Generation Error:", err);
        res.status(500).json({ error: err.message }); 
    }
});

// Admin: Direct Sale (Online/Manual) -> Creates Order + Deducts Inventory + Generates Invoice

app.post('/api/admin/direct-sale', async (req, res) => {
    try {
        const { party, items, subTotal, gstAmount, grandTotal } = req.body;
        
        const invoiceNo = await getNextDocNo('invoice');
        const stockist = await db.Stockist.findByPk(parseInt(party));

        const numSubTotal = Number(subTotal) || 0;
        const numGstAmount = Number(gstAmount) || 0;
        const numGrandTotal = Number(grandTotal) || 0;

        const newInvoice = await db.Invoice.create({
            invoiceNo,
            stockistId: parseInt(party),
            subTotal: numSubTotal,
            gstAmount: numGstAmount,
            grandTotal: numGrandTotal,
            outstandingAmount: numGrandTotal,
            status: 'approved'
        });


        for (const item of items) {
            const productId = parseInt(item.productId || item.product);
            const product = await db.Product.findByPk(productId);
            if (product) {
                await product.decrement('qtyAvailable', { by: item.qty });
                const batch = await db.Batch.findOne({ where: { productId, batchNo: item.batch } });
                if (batch) await batch.decrement('qtyAvailable', { by: item.qty });

                await db.InvoiceItem.create({
                    ...item,
                    productId,
                    invoiceId: newInvoice.id
                });
            }
        }

        if (stockist) {
            await stockist.increment('outstandingBalance', { by: grandTotal });
        }

        res.json({ success: true, invoice: newInvoice });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- PURCHASE ENTRY ---

app.get('/api/admin/purchase-entries', async (req, res) => {
    try {
        const entries = await db.PurchaseEntry.findAll({ 
            include: [{ model: db.PurchaseItem, as: 'items' }, { model: db.Stockist, as: 'Supplier' }],
            order: [['createdAt', 'DESC']] 
        });
        res.json(entries);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/admin/purchase-entries', async (req, res) => {
    try {
        const { supplierId, items } = req.body;
        const subTotal = Number(req.body.subTotal) || 0;
        const gstAmount = Number(req.body.gstAmount) || 0;
        const grandTotal = Number(req.body.grandTotal) || 0;
        const purchaseNo = await getNextDocNo('purchase');

        const entry = await db.PurchaseEntry.create({
            ...req.body,
            subTotal,
            gstAmount,
            grandTotal
        });

        for (const item of items) {
            const pId = item.productId || item.product;
            const bNo = item.batchNo || item.batch;
            const product = await db.Product.findByPk(pId);
            if (product) {
                await product.increment('qtyAvailable', { by: item.qty });
                let [batch] = await db.Batch.findOrCreate({
                    where: { productId: pId, batchNo: bNo },
                    defaults: { 
                        productId: pId,
                        batchNo: bNo,
                        mfgDate: item.mfgDate,
                        expDate: item.expDate,
                        mrp: item.mrp || product.mrp,
                        pts: item.pts || product.pts,
                        ptr: item.ptr || product.ptr,
                        qtyAvailable: 0 
                    }
                });
                await batch.increment('qtyAvailable', { by: item.qty });
                
                await db.PurchaseItem.create({
                    ...item,
                    productId: pId,
                    batch: bNo,
                    purchaseEntryId: entry.id
                });
            }
        }

        if (supplierId) {
            const stockist = await db.Stockist.findByPk(supplierId);
            if (stockist) await stockist.decrement('outstandingBalance', { by: grandTotal });
        }

        res.json({ success: true, entry });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- FINANCIAL NOTES (CN/DN) ---

app.get('/api/admin/financial-notes', async (req, res) => {
    try {
        const notes = await db.FinancialNote.findAll({ 
            include: [{ model: db.Stockist }, { model: db.NoteItem, as: 'items' }],
            order: [['createdAt', 'DESC']]
        });
        res.json(notes);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/admin/financial-notes', async (req, res) => {
    try {
        const { noteType, partyId, amount, reason, items } = req.body;
        
        let counterKey = (noteType === 'CN') ? 'lcn' : 'ldn'; // Defaults
        if (noteType === 'CN') {
            if (reason === 'Salable Return') counterKey = 'scn';
            else if (reason === 'Price Diff CN') counterKey = 'pdcn';
        } else {
            if (reason === 'Purchase Return') counterKey = 'pdn';
            else if (reason === 'Price Diff DN') counterKey = 'pddn';
        }

        const noteNo = await getNextDocNo(counterKey);

        const numAmount = Number(amount) || 0;
        const newNote = await db.FinancialNote.create({
            noteNo,
            noteType,
            stockistId: partyId,
            amount: numAmount,
            reason,
            ...req.body
        });


        // Inventory Logic for Salable Return / Purchase Return
        const adjFactor = reason === 'Salable Return' ? 1 : (reason === 'Purchase Return' ? -1 : 0);
        
        for (const item of items) {
            // Save Note Item regardless of inventory impact
            await db.NoteItem.create({
                ...item,
                financialNoteId: newNote.id
            });

            if (adjFactor !== 0) {
                const product = await db.Product.findByPk(item.productId);
                if (product) {
                    const adj = adjFactor * item.qty;
                    await product.increment('qtyAvailable', { by: adj });
                    const batch = await db.Batch.findOne({ where: { productId: item.productId, batchNo: item.batchNo } });
                    if (batch) await batch.increment('qtyAvailable', { by: adj });
                }
            }
        }

        const adjustment = noteType === 'CN' ? -amount : amount;
        await db.Stockist.increment('outstandingBalance', { by: adjustment, where: { id: partyId } });

        res.json({ success: true, note: newNote });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.post('/api/stockist/pdcn/submit', async (req, res) => {
    try {
        const { invoiceNo, stockistId, items, totalAmount } = req.body;

        // 1. Fetch all existing non-rejected claims for this invoice/stockist
        const existingClaims = await db.PDCNClaim.findAll({
            where: { 
                invoiceNo, 
                stockistId, 
                status: { [db.Sequelize.Op.ne]: 'rejected' } 
            },
            include: [{ model: db.PDCNClaimItem, as: 'items' }]
        });

        // 2. Validate quantities across all items
        for (const newItem of items) {
            let previouslyClaimed = 0;
            existingClaims.forEach(claim => {
                const match = claim.items.find(i => i.productId === newItem.productId);
                if (match) previouslyClaimed += Number(match.qty || 0);
            });

            // We need to know the original invoice qty for this product
            const inv = await db.Invoice.findOne({
                where: { invoiceNo, stockistId },
                include: [{ model: db.InvoiceItem, as: 'items', where: { productId: newItem.productId } }]
            });

            if (!inv || !inv.items[0]) continue; // Should not happen if UI is correct
            
            const originalQty = Number(inv.items[0].qty || 0);
            if ((previouslyClaimed + Number(newItem.claimQty)) > originalQty) {
                return res.status(400).json({ 
                    success: false, 
                    message: `⚠️ OVER-CLAIM ERROR: Product '${newItem.name}' already has ${previouslyClaimed} units claimed. Only ${originalQty - previouslyClaimed} units remaining.` 
                });
            }
        }

        // 3. Create the new claim
        const claim = await db.PDCNClaim.create({
            invoiceNo,
            stockistId,
            totalAmount: 0, // Will be updated after items are added
            status: 'pending'
        });

        let calculatedTotal = 0;
        for (const item of items) {
            const qty = Number(item.claimQty) || 0;
            const billed = Number(item.billedPrice) || 0;
            const spl = Number(item.splPrice) || 0;
            const diff = billed - spl;
            const gst = Number(item.gstPercent || item.gstPct) || 0;
            const marginPct = 10.0; 

            // Formula: (Diff * Qty * (1 + GST/100)) + (Diff * Qty * Margin/100)
            const taxableValue = (diff * qty) * (1 + gst / 100);
            const marginValue = (diff * qty) * (marginPct / 100);
            const finalItemPDCN = taxableValue + marginValue;

            await db.PDCNClaimItem.create({
                pdcnClaimId: claim.id,
                productId: item.productId,
                name: item.name,
                qty: qty,
                billedPrice: billed,
                specialPrice: spl,
                gstPercent: gst,
                marginPct: marginPct,
                stkMargin: marginValue,
                saleDiff: diff,
                finalPDCN: finalItemPDCN,
                remarks: item.remarks
            });
            calculatedTotal += finalItemPDCN;
        }

        // Force header to match item sum exactly with decimal precision
        await claim.update({ totalAmount: parseFloat(calculatedTotal.toFixed(2)) });



        res.json({ success: true, message: 'PDCN Worksheet submitted for review', claimId: claim.id });

    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.get('/api/admin/pdcn/claims', async (req, res) => {
    try {
        const claims = await db.PDCNClaim.findAll({
            include: [
                { model: db.Stockist },
                { model: db.PDCNClaimItem, as: 'items' }
            ],
            order: [['createdAt', 'DESC']]
        });
        res.json(claims);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/admin/pdcn/claims/:id/approve', async (req, res) => {
    try {
        const { editedItems, remarks } = req.body;
        const claim = await db.PDCNClaim.findByPk(req.params.id, {
            include: [{ model: db.PDCNClaimItem, as: 'items' }]
        });
        if (!claim) return res.status(404).json({ success: false, message: "Claim not found" });
        if (claim.status !== 'pending') return res.status(400).json({ success: false, message: "Claim already processed" });

        // Apply edits if provided by admin
        if (editedItems && editedItems.length > 0) {
            let newTotal = 0;
            for (const editedItem of editedItems) {
                const dbItem = claim.items.find(i => i.id === editedItem.id);
                if (dbItem) {
                    await dbItem.update({
                        specialPrice: editedItem.specialPrice,
                        marginPct: editedItem.marginPct,
                        finalPDCN: editedItem.finalPDCN,
                        stkMargin: editedItem.stkMargin,
                        saleDiff: editedItem.saleDiff
                    });
                    newTotal += Number(editedItem.finalPDCN);
                }
            }
            await claim.update({ totalAmount: newTotal });
        }

        await claim.reload(); // Ensure we have the latest totalAmount after edits
        const noteNo = await getNextDocNo('pdcn');
        const financialNote = await db.FinancialNote.create({
            noteNo,
            noteType: 'CN',
            stockistId: claim.stockistId,
            amount: claim.totalAmount,
            reason: 'Price Diff CN',
            description: `PDCN for Invoice ${claim.invoiceNo}. ${remarks || ''}`
        });

        // Refresh items after updates
        const updatedItems = await db.PDCNClaimItem.findAll({ where: { pdcnClaimId: claim.id } });

        for (const item of updatedItems) {
            await db.NoteItem.create({
                financialNoteId: financialNote.id,
                productId: item.productId,
                name: item.name,
                qty: item.qty,
                price: item.specialPrice,
                totalValue: item.finalPDCN,
                remarks: item.remarks
            });
        }

        // Update Stockist Balance
        await db.Stockist.decrement('outstandingBalance', { 
            by: claim.totalAmount, 
            where: { id: claim.stockistId } 
        });

        await claim.update({ 
            status: 'approved',
            creditNoteNo: noteNo,
            adminRemarks: remarks
        });

        res.json({ success: true, financialNote });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});


app.put('/api/admin/pdcn/claims/:id/reject', async (req, res) => {
    try {
        const claim = await db.PDCNClaim.findByPk(req.params.id);
        if (!claim) return res.status(404).json({ success: false, message: "Claim not found" });
        
        await claim.update({ status: 'rejected', adminRemarks: req.body.remarks });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/admin/financial-notes/:id', async (req, res) => {
    try {
        const note = await db.FinancialNote.findByPk(req.params.id);
        if (!note) return res.status(404).json({ success: false, message: "Note not found" });

        // Reverse Accounting
        const adjustment = note.noteType === 'CN' ? note.amount : -note.amount;
        await db.Stockist.increment('outstandingBalance', { by: adjustment, where: { id: note.stockistId } });

        await note.destroy();
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});
app.get('/api/stockist/pdcn/history/:stockistId', async (req, res) => {
    try {
        const claims = await db.PDCNClaim.findAll({
            where: { stockistId: req.params.stockistId },
            include: [{ model: db.PDCNClaimItem, as: 'items' }],
            order: [['createdAt', 'DESC']]
        });
        res.json({ success: true, claims });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// --- PDCN ELIGIBILITY ---


app.get('/api/admin/pdcn/eligibility/:partyId', async (req, res) => {
    try {
        const { partyId } = req.params;
        const invoices = await db.Invoice.findAll({ 
            where: { stockistId: partyId },
            include: [{ model: db.InvoiceItem, as: 'items' }]
        });
        const claimedNotes = await db.FinancialNote.findAll({ 
            where: { stockistId: partyId, reason: 'Price Diff CN' }
        });

        const eligibility = {};
        // Logic to calculate eligible qty would go here, simplified for migration
        res.json({ success: true, eligibility });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- PAYMENTS & EXPENSES ---

app.post('/api/admin/payments', async (req, res) => {
    try {
        const { party, amount, method, type, date } = req.body;
        const partyId = party; 
        
        const paymentNo = await getNextDocNo(type === 'RECEIPT' ? 'payin' : 'payout');

        const numAmount = Number(amount) || 0;
        const payment = await db.Payment.create({
            paymentNo,
            stockistId: partyId,
            amount: numAmount,
            method,
            type,
            date: date || new Date()
        });


        const stockist = await db.Stockist.findByPk(partyId);
        const adj = type === 'RECEIPT' ? -Number(amount) : Number(amount);
        if (stockist) await stockist.increment('outstandingBalance', { by: adj });


        res.json({ success: true, payment: { ...payment.toJSON(), linkedBills: [] } });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.put('/api/admin/payments/:id', async (req, res) => {
    try {
        const payment = await db.Payment.findByPk(req.params.id);
        if (!payment) return res.status(404).json({ success: false, message: "Voucher not found" });

        const oldAmount = payment.amount;
        const oldType = payment.type;
        const oldPartyId = payment.stockistId;

        // 1. REVERSE Ledger Balance for the OLD party
        const oldParty = await db.Stockist.findByPk(oldPartyId);
        if (oldParty) {
            const reverseAdj = oldType === 'RECEIPT' ? oldAmount : -oldAmount;
            await oldParty.increment('outstandingBalance', { by: reverseAdj });
        }

        // 2. UPDATE Voucher
        const { party, amount, method, type, date } = req.body;
        await payment.update({
            stockistId: party,
            amount,
            method,
            type,
            date: date || new Date()
        });

        // 3. APPLY NEW Ledger Balance for the NEW party
        const newParty = await db.Stockist.findByPk(party);
        if (newParty) {
            const newAdj = type === 'RECEIPT' ? -Number(amount) : Number(amount);
            await newParty.increment('outstandingBalance', { by: newAdj });
        }


        res.json({ success: true, payment: { ...payment.toJSON(), linkedBills: [] } });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.get('/api/admin/payments', async (req, res) => {
    try {
        const payments = await db.Payment.findAll({ 
            include: [{ model: db.Stockist }],
            order: [['date', 'DESC']]
        });
        res.json(payments);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/admin/expenses', async (req, res) => {
    try {
        const expenses = await db.Expense.findAll({ include: [{ model: db.ExpenseCategory }] });
        res.json(expenses);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/admin/expenses', async (req, res) => {
    try {
        const expenseNo = await getNextDocNo('expense');
        const expense = await db.Expense.create({
            ...req.body,
            amount: Number(req.body.amount) || 0,
            expenseNo
        });

        res.json({ success: true, expense });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// --- AUDIT REPORT ---

app.get('/api/admin/reports/full-audit', async (req, res) => {
    try {
        const [invoices, purchases, payments, notes, expenses] = await Promise.all([
            db.Invoice.findAll({ include: [{ model: db.Stockist }, { model: db.InvoiceItem, as: 'items' }] }),
            db.PurchaseEntry.findAll({ include: [{ model: db.Stockist, as: 'Supplier' }, { model: db.PurchaseItem, as: 'items' }] }),
            db.Payment.findAll({ include: [db.Stockist] }),
            db.FinancialNote.findAll({ include: [{ model: db.Stockist }, { model: db.NoteItem, as: 'items' }] }),
            db.Expense.findAll({ include: [db.ExpenseCategory] })
        ]);
        res.json({ invoices, purchases, payments, notes, expenses });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/admin/parties/:id/ledger', async (req, res) => {
    try {
        const partyId = req.params.id;
        
        const [invoices, notes, payments, purchases] = await Promise.all([
            db.Invoice.findAll({ where: { stockistId: partyId } }),
            db.FinancialNote.findAll({ where: { stockistId: partyId } }),
            db.Payment.findAll({ where: { stockistId: partyId } }),
            db.PurchaseEntry.findAll({ where: { supplierId: partyId } })
        ]);

        const ledger = [];
        
        // 1. Invoices (Debit for Customers)
        invoices.forEach(i => ledger.push({
            date: i.createdAt,
            refNo: i.invoiceNo,
            type: 'INVOICE',
            description: 'Sales Invoice',
            debit: parseFloat(i.grandTotal),
            credit: 0
        }));

        // 2. Financial Notes (CN = Credit, DN = Debit)
        notes.forEach(n => ledger.push({
            date: n.createdAt,
            refNo: n.noteNo,
            type: n.noteType === 'CN' ? 'CREDIT NOTE' : 'DEBIT NOTE',
            description: n.reason || 'Financial Adjustment',
            debit: n.noteType === 'DN' ? parseFloat(n.amount) : 0,
            credit: n.noteType === 'CN' ? parseFloat(n.amount) : 0
        }));

        // 3. Payments (RECEIPT = Credit, PAYMENT = Debit)
        payments.forEach(p => ledger.push({
            date: p.date || p.createdAt,
            refNo: p.paymentNo || `VOU-${p.id}`,
            type: p.type, // RECEIPT or PAYMENT
            description: `Via ${p.method}`,
            debit: p.type === 'PAYMENT' ? parseFloat(p.amount) : 0,
            credit: p.type === 'RECEIPT' ? parseFloat(p.amount) : 0
        }));

        // 4. Purchases (Credit for Suppliers)
        purchases.forEach(p => ledger.push({
            date: p.invoiceDate || p.createdAt,
            refNo: p.supplierInvoiceNo || p.purchaseNo,
            type: 'PURCHASE',
            description: 'Stock-In Entry',
            debit: 0,
            credit: parseFloat(p.grandTotal)
        }));

        ledger.sort((a, b) => new Date(a.date) - new Date(b.date));
        res.json(ledger);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- REPORTING MODULE ---

app.get('/api/admin/reports/gstr1', async (req, res) => {
    try {
        const { month, year } = req.query;
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);

        const invoices = await db.Invoice.findAll({
            where: { createdAt: { [db.Sequelize.Op.between]: [startDate, endDate] } },
            include: [{ model: db.Stockist }]
        });

        const report = invoices.map(inv => ({
            "GSTIN of Recipient": inv.Stockist?.gstNo || "N/A",
            "Receiver Name": inv.Stockist?.name || "N/A",
            "Invoice Number": inv.invoiceNo,
            "Invoice Date": inv.createdAt,
            "Invoice Value": inv.grandTotal,
            "Taxable Value": inv.subTotal,
            "Integrated Tax": inv.gstAmount
        }));

        res.json(report);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

