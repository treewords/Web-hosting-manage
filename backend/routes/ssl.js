const express = require('express');
const router = express.Router();
const acme = require('acme-client');
const fs = require('fs').promises;
const path = require('path');
const authMiddleware = require('../middleware/authMiddleware');

const LETSENCRYPT_DIR = '/etc/letsencrypt';
const CHALLENGE_DIR = '/var/www/acme_challenges';

// @route   POST /api/ssl/issue
// @desc    Issue a new SSL certificate for a domain
// @access  Private
router.post('/issue', authMiddleware, async (req, res) => {
    const { domainName } = req.body;

    if (!domainName) {
        return res.status(400).json({ msg: 'Domain name is required.' });
    }

    try {
        /* Create an ACME client */
        const client = new acme.Client({
            directoryUrl: acme.directory.letsencrypt.staging, // Use staging for testing
            // directoryUrl: acme.directory.letsencrypt.production, // Use production for real certs
            accountKey: await acme.crypto.createPrivateKey()
        });

        /* Create a new order */
        const order = await client.createOrder({
            identifiers: [{ type: 'dns', value: domainName }]
        });

        /* Get challenges */
        const authorizations = await client.getAuthorizations(order);
        const httpChallenge = authorizations[0].challenges.find(
            (challenge) => challenge.type === 'http-01'
        );

        if (!httpChallenge) {
            throw new Error('HTTP-01 challenge not found');
        }

        /* Satisfy challenge */
        const keyAuthorization = await client.getkeyAuthorization(httpChallenge.token);
        const challengePath = path.join(CHALLENGE_DIR, httpChallenge.token);

        await fs.writeFile(challengePath, keyAuthorization);
        console.log(`Wrote challenge file to ${challengePath}`);

        /* Verify challenge */
        await client.verifyChallenge(authorizations[0], httpChallenge);
        console.log('Challenge verification started...');

        /* Finalize order */
        await client.completeChallenge(httpChallenge);
        console.log('Challenge completed.');

        /* Wait for order to be ready */
        await client.waitForOrder(order);
        console.log('Order is ready.');

        /* Clean up challenge file */
        await fs.unlink(challengePath);

        /* Finalize order with a new CSR */
        const [key, csr] = await acme.crypto.createCsr({
            commonName: domainName
        });

        const finalizedOrder = await client.finalizeOrder(order, csr);
        const certificate = await client.getCertificate(finalizedOrder);

        /* Save certificate and key */
        const certDir = path.join(LETSENCRYPT_DIR, 'live', domainName);
        await fs.mkdir(certDir, { recursive: true });
        await fs.writeFile(path.join(certDir, 'fullchain.pem'), certificate);
        await fs.writeFile(path.join(certDir, 'privkey.pem'), key);

        console.log(`Certificate for ${domainName} issued and saved.`);
        res.status(201).json({ msg: `Certificate for ${domainName} issued successfully.` });

    } catch (err) {
        console.error(`Failed to issue certificate for ${domainName}:`, err);
        res.status(500).json({ msg: 'Failed to issue certificate.', error: err.message });
    }
});

module.exports = router;
