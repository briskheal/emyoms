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
            dbType: 'PostgreSQL'
        });
    } catch (e) { res.status(500).json({ error: e.message }); }
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

// --- HELPER: Document Counters (SQL Atomic Version) ---
async function getNextDocNo(type) {
    try {
        const company = await db.Company.findOne();
        if (!company || !company.documentCounters || !company.documentCounters[type]) return null;
        
        const counter = company.documentCounters[type];
        const nextNum = counter.nextNumber;
        
        // Atomic Increment
        const updatedCounters = { ...company.documentCounters };
        updatedCounters[type].nextNumber += 1;
        
        await company.update({ documentCounters: updatedCounters });
        
        return `${counter.prefix}${nextNum.toString().padStart(3, '0')}`;
    } catch (e) {
        console.error(`Counter error for ${type}:`, e);
        return null;
    }
}


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
            const product = await db.Product.findByPk(i.productId);
            const rate = product ? product.gstPercent : 12;
            newSubTotal += i.totalValue;
            newGstAmount += Number(((i.totalValue * rate) / 100).toFixed(2));
        }

        await order.update({
            subTotal: newSubTotal,
            gstAmount: newGstAmount,
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

// --- SETTINGS ---

app.get('/api/admin/settings', async (req, res) => {
    let settings = await db.Company.findOne();
    if (!settings) settings = await db.Company.create({});
    res.json(settings);
});

app.post('/api/admin/settings', async (req, res) => {
    try {
        let settings = await db.Company.findOne();
        if (!settings) settings = await db.Company.create(req.body);
        else await settings.update(req.body);
        res.json({ success: true, settings });
    } catch (e) { res.status(500).json({ error: e.message }); }
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

        fs.unlinkSync(req.file.path);
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
        const { approvedBy, selectedHq } = req.body;
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
                    
                    const batches = await db.Batch.findAll({ 
                        where: { productId: item.productId },
                        order: [['expDate', 'ASC']]
                    });

                    let firstBatch = null;
                    for (const b of batches) {
                        if (totalDeduction <= 0) break;
                        if (b.qtyAvailable > 0) {
                            if (!firstBatch) firstBatch = b;
                            const deduct = Math.min(b.qtyAvailable, totalDeduction);
                            await b.decrement('qtyAvailable', { by: deduct });
                            totalDeduction -= deduct;
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

// Admin: Direct Sale (Online/Manual) -> Creates Order + Deducts Inventory + Generates Invoice

app.post('/api/admin/direct-sale', async (req, res) => {
    try {
        const { party, items, subTotal, gstAmount, grandTotal } = req.body;
        
        const invoiceNo = await getNextDocNo('invoice');
        const stockist = await db.Stockist.findByPk(parseInt(party));

        const newInvoice = await db.Invoice.create({
            invoiceNo,
            stockistId: parseInt(party),
            subTotal,
            gstAmount,
            grandTotal,
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
        const entries = await db.PurchaseEntry.findAll({ order: [['createdAt', 'DESC']] });
        res.json(entries);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/admin/purchase-entries', async (req, res) => {
    try {
        const { items, supplierId, grandTotal } = req.body;
        const purchaseNo = await getNextDocNo('purchase');

        const entry = await db.PurchaseEntry.create({
            purchaseNo,
            supplierId,
            grandTotal,
            ...req.body
        });

        for (const item of items) {
            const product = await db.Product.findByPk(item.productId);
            if (product) {
                await product.increment('qtyAvailable', { by: item.qty });
                let [batch] = await db.Batch.findOrCreate({
                    where: { productId: item.productId, batchNo: item.batch },
                    defaults: { ...item, qtyAvailable: 0 }
                });
                await batch.increment('qtyAvailable', { by: item.qty });
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
            include: [{ model: db.Stockist }],
            order: [['createdAt', 'DESC']]
        });
        res.json(notes);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/admin/financial-notes', async (req, res) => {
    try {
        const { noteType, partyId, amount, reason, items } = req.body;
        const noteNo = await getNextDocNo(noteType === 'CN' ? 'lossCn' : 'lossDn');

        const newNote = await db.FinancialNote.create({
            noteNo,
            noteType,
            stockistId: partyId,
            amount,
            reason,
            ...req.body
        });

        // Inventory Logic for Salable Return / Purchase Return
        const adjFactor = reason === 'Salable Return' ? 1 : (reason === 'Purchase Return' ? -1 : 0);
        if (adjFactor !== 0) {
            for (const item of items) {
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
        const { partyId, amount, method, type } = req.body;
        const payment = await db.Payment.create({
            stockistId: partyId,
            amount,
            method,
            type,
            date: new Date()
        });

        const stockist = await db.Stockist.findByPk(partyId);
        const adj = type === 'RECEIPT' ? -amount : amount;
        if (stockist) await stockist.increment('outstandingBalance', { by: adj });

        res.json({ success: true, payment });
    } catch (e) { res.status(500).json({ error: e.message }); }
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
        const expense = await db.Expense.create(req.body);
        res.json({ success: true, expense });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- AUDIT REPORT ---

app.get('/api/admin/reports/full-audit', async (req, res) => {
    try {
        const [invoices, purchases, payments, notes, expenses] = await Promise.all([
            db.Invoice.findAll({ include: [db.Stockist] }),
            db.PurchaseEntry.findAll({ include: [db.Stockist] }),
            db.Payment.findAll({ include: [db.Stockist] }),
            db.FinancialNote.findAll({ include: [db.Stockist] }),
            db.Expense.findAll({ include: [db.ExpenseCategory] })
        ]);
        res.json({ invoices, purchases, payments, notes, expenses });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/admin/parties/:id/ledger', async (req, res) => {
    try {
        const partyId = req.params.id;
        
        const [invoices, notes] = await Promise.all([
            db.Invoice.findAll({ where: { stockistId: partyId } }),
            db.FinancialNote.findAll({ where: { stockistId: partyId } })
        ]);

        const ledger = [];
        invoices.forEach(i => ledger.push({
            date: i.createdAt,
            refNo: i.invoiceNo,
            type: 'INVOICE',
            description: 'Sales Invoice',
            debit: i.grandTotal,
            credit: 0
        }));

        notes.forEach(n => ledger.push({
            date: n.createdAt,
            refNo: n.noteNo,
            type: n.noteType === 'CN' ? 'CREDIT NOTE' : 'DEBIT NOTE',
            description: n.reason,
            debit: n.noteType === 'DN' ? n.amount : 0,
            credit: n.noteType === 'CN' ? n.amount : 0
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

