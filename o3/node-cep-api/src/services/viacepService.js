const axios = require('axios');

const getAddressByZipCode = async (zipCode) => {
    try {
        const response = await axios.get(`https://viacep.com.br/ws/${zipCode}/json/`);
        return response.data;
    } catch (error) {
        throw new Error('Error fetching data from ViaCEP');
    }
};

module.exports = {
    getAddressByZipCode,
};