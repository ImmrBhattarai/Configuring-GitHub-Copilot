# Node CEP API

This project is a simple Node.js API that allows users to search for address information based on a Brazilian zip code (CEP) using the ViaCEP API.

## Features

- Fetch address details by providing a zip code (CEP).
- Simple and easy-to-use API endpoint.

## Getting Started

### Prerequisites

- Node.js (version 12 or higher)
- npm (Node package manager)

### Installation

1. Clone the repository:

   ```
   git clone https://github.com/yourusername/node-cep-api.git
   ```

2. Navigate to the project directory:

   ```
   cd node-cep-api
   ```

3. Install the dependencies:

   ```
   npm install
   ```

### Running the API

To start the server, run the following command:

```
npm start
```

The server will start on `http://localhost:3000`.

### API Endpoint

- **GET /cep/:zipcode**

  Replace `:zipcode` with the desired Brazilian zip code (CEP). The API will return the address information in JSON format.

### Example Request

```
GET http://localhost:3000/cep/01001-000
```

### Example Response

```json
{
  "cep": "01001-000",
  "logradouro": "Praça da Sé",
  "complemento": "",
  "bairro": "Sé",
  "localidade": "São Paulo",
  "uf": "SP",
  "ibge": "3550308",
  "gia": "1004",
  "ddd": "11",
  "siafi": "7087"
}
```

### Contributing

Contributions are welcome! Please open an issue or submit a pull request for any improvements or bug fixes.

### License

This project is licensed under the MIT License. See the LICENSE file for details.