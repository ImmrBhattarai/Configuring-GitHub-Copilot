const express = require('express');
const axios = require('axios');
const app = express();

app.get('/cep/:cep', async (req, res) => {
  const { cep } = req.params;

  // Validate if CEP contains only numbers
  if (!/^\d+$/.test(cep)) {
    return res.status(400).json({
      message: "Invalid zip code. Please provide only numbers until the government resolves this."
    });
  }

  try {
    const response = await axios.get(`https://viacep.com.br/ws/${cep}/json/`); //viacep.com.br is a Brazillian Postal Code API Service
    if (response.data.erro) {
      return res.status(404).json({ error: 'CEP not found' });
    }
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching CEP' });
  }
});

app.listen(3000, () => {
  console.log('API running on http://localhost:3000');
});
