const db = require('../models');

async function addMedia() {
    const url = "https://res.cloudinary.com/dqtwbavrh/video/upload/v1777320648/emyris_media/xnogrue5pbesoddgb9oz.mp4";
    try {
        const [media, created] = await db.Media.findOrCreate({
            where: { url: url },
            defaults: {
                name: "Emyris Promotional Video",
                url: url,
                type: "video"
            }
        });
        if (created) {
            console.log("✅ Media added successfully");
        } else {
            console.log("ℹ️ Media already exists");
        }
        process.exit(0);
    } catch (e) {
        console.error("❌ Error adding media:", e);
        process.exit(1);
    }
}

addMedia();
