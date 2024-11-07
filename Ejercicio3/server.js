const http = require('http');
const fs = require('fs');
const WebSocket = require('ws');
const axios = require('axios');

// Crear un servidor HTTP
const server = http.createServer((req, res) => {
  const filePath = `public${req.url === '/' ? '/index.html' : req.url}`;

  // Verificamos la extensión del archivo para asignar el tipo de contenido correcto
  const extname = filePath.split('.').pop();
  const contentTypes = {
    'html': 'text/html',
    'css': 'text/css',
    'js': 'application/javascript',
    'json': 'application/json'
  };

  const contentType = contentTypes[extname] || 'text/plain';

  // Si el archivo existe, lo leemos y lo enviamos
  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
});

// Crear un servidor WebSocket
const wss = new WebSocket.Server({ server });

// Lista de criptomonedas a consultar
const cryptocurrencies = ['bitcoin', 'ethereum', 'litecoin']; // Usamos los nombres de los tokens según CoinGecko
const urlTemplate = 'https://api.coingecko.com/api/v3/simple/price?ids={symbol}&vs_currencies=eur&include_24hr_change=true&include_24hr_vol=true';

// Función para obtener los datos de una criptomoneda usando la API de CoinGecko
const fetchCryptoData = async (symbol) => {
  const url = urlTemplate.replace('{symbol}', symbol); // Reemplazamos {symbol} con la criptomoneda actual
  let retries = 0;
  const maxRetries = 5;
  
  while (retries < maxRetries) {
    try {
      const response = await axios.get(url); // Realizamos la solicitud con axios
      const data = response.data;

      // Verificamos si la criptomoneda está presente en la respuesta
      if (data[symbol]) {
        // Extraemos el precio en EUR, el cambio en las últimas 24h y el volumen
        const price = data[symbol].eur;
        const change = data[symbol].eur_24h_change;  // Porcentaje de cambio
        const volume = data[symbol].eur_24h_vol;    // Volumen

        return {
          symbol: `${symbol.toUpperCase()}/EUR`,
          price: price,
          change: change,    // El porcentaje de cambio
          volume: volume,    // El volumen
          date: new Date().toISOString(), // Agregamos la fecha actual
        };
      } else {
        throw new Error('No se encontraron datos para la criptomoneda solicitada');
      }
    } catch (error) {
      if (error.response && error.response.status === 429) {
        // Si recibimos un error 429 (Demasiadas solicitudes), esperamos antes de reintentar
        console.log(`Límite de solicitudes alcanzado. Esperando antes de reintentar... (${retries + 1}/${maxRetries})`);
        retries++;
        await new Promise(resolve => setTimeout(resolve, 10000)); // Esperar 10 segundos
      } else {
        // Si es otro tipo de error, lo lanzamos
        throw new Error('Error al obtener datos de la criptomoneda: ' + error.message);
      }
    }
  }

  throw new Error('Se superó el número máximo de reintentos.');
};

// Conectar y enviar datos al cliente WebSocket
wss.on('connection', (ws) => {
  console.log('Cliente conectado');

  // Función para enviar datos de una criptomoneda seleccionada aleatoriamente
  const sendCryptoData = async () => {
    try {
      // Elegimos una criptomoneda aleatoria de la lista
      const randomIndex = Math.floor(Math.random() * cryptocurrencies.length);
      const symbol = cryptocurrencies[randomIndex];

      const data = await fetchCryptoData(symbol);
      
      // Enviar los datos de la criptomoneda seleccionada al cliente WebSocket
      ws.send(JSON.stringify(data));

      console.log('Datos enviados:', data);
    } catch (error) {
      console.error('Error al obtener datos de criptomonedas:', error);
    }
  };

  // Enviar los datos cada 5 segundos
  const interval = setInterval(sendCryptoData, 5000);

  // Enviar los datos inmediatamente al conectarse
  sendCryptoData();

  // Limpiar el intervalo cuando el cliente se desconecta
  ws.on('close', () => {
    console.log('Cliente desconectado');
    clearInterval(interval);
  });
});

// Escuchar en el puerto 8080
server.listen(8080, () => {
  console.log('Servidor escuchando en http://localhost:8080');
});
