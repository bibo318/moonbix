import CryptoJS from 'crypto-js';

// Encryption function using AES-CBC (crypto-js)
export const encrypt = (text, key) => {
    const iv = CryptoJS.lib.WordArray.random(12); // Generate a random 12-byte IV
    const iv_base64 = CryptoJS.enc.Base64.stringify(iv);

    // Pad the text to match the block size (crypto-js handles padding by default in AES)
    const paddedText = CryptoJS.enc.Utf8.parse(text);

    // Encrypt the text using AES CBC mode
    const cipher = CryptoJS.AES.encrypt(paddedText, CryptoJS.enc.Utf8.parse(key), {
        iv: CryptoJS.enc.Utf8.parse(iv_base64.slice(0, 16)),
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
    });

    const encrypted_base64 = cipher.ciphertext.toString(CryptoJS.enc.Base64);
    return iv_base64 + encrypted_base64;
}

// Main function to simulate game data
export const getGameData = (gameResponse) => {
    const startTime = Date.now();
    const endTime = startTime + 45000; // 45 seconds in milliseconds
    const gameTag = gameResponse.data.gameTag;
    const itemSettings = gameResponse.data.cryptoMinerConfig.itemSettingList;

    let currentTime = startTime;
    let score = 100;
    const gameEvents = [];

    while (currentTime < endTime) {
        // Generate random time increment
        const timeIncrement = Math.floor(Math.random() * (2500 - 1500 + 1)) + 1500;
        currentTime += timeIncrement;

        if (currentTime >= endTime) {
            break;
        }

        // Generate random hook positions and angles
        const hookPosX = (Math.random() * (275 - 75) + 75).toFixed(3);
        const hookPosY = (Math.random() * (251 - 199) + 199).toFixed(3);
        const hookShotAngle = (Math.random() * (1 - (-1)) + (-1)).toFixed(3);
        const hookHitX = (Math.random() * (400 - 100) + 100).toFixed(3);
        const hookHitY = (Math.random() * (700 - 250) + 250).toFixed(3);

        let itemType = 0, itemSize = 0, points = 0;
        const randomValue = Math.random();

        if (randomValue < 0.6) {
            // Select a reward item
            const rewardItems = itemSettings.filter(item => item.type === 'REWARD');
            const selectedReward = rewardItems[Math.floor(Math.random() * rewardItems.length)];
            itemType = 1;
            itemSize = selectedReward.size;
            points = Math.min(selectedReward.rewardValueList[0], 10);
            score = Math.min(score + points, 200);
        } else if (randomValue < 0.8) {
            // Select a trap item
            const trapItems = itemSettings.filter(item => item.type === 'TRAP');
            const selectedTrap = trapItems[Math.floor(Math.random() * trapItems.length)];
            itemType = 1;
            itemSize = selectedTrap.size;
            points = Math.min(Math.abs(selectedTrap.rewardValueList[0]), 20);
            score = Math.max(100, score - points);
        } else {
            // Select a bonus item
            const bonusItem = itemSettings.find(item => item.type === 'BONUS');
            if (bonusItem) {
                itemType = 2;
                itemSize = bonusItem.size;
                points = Math.min(bonusItem.rewardValueList[0], 15);
                score = Math.min(score + points, 200);
            }
        }

        // Create event data string
        const eventData = `${currentTime}|${hookPosX}|${hookPosY}|${hookShotAngle}|${hookHitX}|${hookHitY}|${itemType}|${itemSize}|${points}`;
        gameEvents.push(eventData);
    }

    const payload = gameEvents.join(';');
    const encryptedPayload = encrypt(payload, gameTag);

    return { encryptedPayload, score };
}
