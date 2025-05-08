const express = require('express');
const router = express.Router();
const viacepService = require('../services/viacepService');

router.get('/cep/:zipcode', async (req, res) => {
    const { zipcode } = req.params;
    
    // Check if zipcode contains non-numeric characters
    if (!/^\d+$/.test(zipcode)) {
        return res.status(400).json({ 
            message: 'Zip code must contain only numbers until the government decides otherwise.' 
        });
    }
    
    try {
        const address = await viacepService.getAddressByZipCode(zipcode);
        if (address) {
            res.json(address);
        } else {
            res.status(404).json({ message: 'Address not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving address', error: error.message });
    }
});

module.exports = router;