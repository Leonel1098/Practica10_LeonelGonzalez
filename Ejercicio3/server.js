const http = require('http');
const fs = require('fs');
const WebSocket = require('ws');
const axios = require('axios');

// Creamos el servidor http
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

  //Verificamos que el archivo exista, si existe se lee y se envia 
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

// Se crea el servidor websocket 
const wss = new WebSocket.Server({ server });

// Se crea una lista que contiene los nombres de las criptomonedas a consultar,estos nombres son los que nuestra pagina de la que extraemos los datos contiene informacion.
const cryptocurrencies = ['bitcoin', 'ethereum', 'litecoin','binance coin','cardano','solana']; 
const urlTemplate = 'https://api.coingecko.com/api/v3/simple/price?ids={symbol}&vs_currencies=eur&include_24hr_change=true&include_24hr_vol=true';

// Función para obtener los datos de CoinGecko que nos da la informacion de la criptomoneda por medio de la API
const fetchCryptoData = async (symbol) => {
  const url = urlTemplate.replace('{symbol}', symbol);
  let retries = 0;
  const maxRetries = 5;
  
  while (retries < maxRetries) {
    try {
      const response = await axios.get(url);
      const data = response.data;

      // Verificamos si la criptomoneda está presente en la respuesta y se extrae la informacion necesaria y disponible en la pagina
      if (data[symbol]) {
        const price = data[symbol].eur;
        const change = data[symbol].eur_24h_change;  
        const volume = data[symbol].eur_24h_vol;   

        return {
          symbol: `${symbol.toUpperCase()}/EUR`,
          price: price,
          change: change,   
          volume: volume,  
          date: new Date().toISOString(),
        };
      } else {
        throw new Error('No se encontraron datos para la criptomoneda solicitada');
      }
    } catch (error) {
      if (error.response && error.response.status === 429) {
        // En esta parte se crea una espera para seguir mostrando los datos al llegar al limite de solicitudes proporcionadas por la pagina. Esto debido a que al ser gratuita solamente proporciona un limite de solicitudes.
        console.log(`Límite de solicitudes alcanzado. Esperando antes de reintentar... (${retries + 1}/${maxRetries})`);
        retries++;
        await new Promise(resolve => setTimeout(resolve, 10000));
      } else {
        // Si es otro tipo de error, lo lanzamos
        throw new Error('Error al obtener datos de la criptomoneda: ' + error.message);
      }
    }
  }

  throw new Error('Se superó el número máximo de reintentos.');
};

// Aqui se realiza la conexion al servidor Websocket creado y se le envia la informacion obtenida
wss.on('connection', (ws) => {
  console.log('Cliente conectado');

  // Función para enviar datos de una criptomoneda seleccionada de forma aleatoria
  const sendCryptoData = async () => {
    try {
      // Elegimos una criptomoneda aleatoria de la lista para mostrar la informacion obtenida 
      const randomIndex = Math.floor(Math.random() * cryptocurrencies.length);
      const symbol = cryptocurrencies[randomIndex];

      const data = await fetchCryptoData(symbol);
      
      // Aqui se envia toda la informacion obtenida al servidor Websocket 
      ws.send(JSON.stringify(data));

      console.log('Datos enviados:', data);
    } catch (error) {
      console.error('Error al obtener datos de criptomonedas:', error);
    }
  };

  // Aqui se define el tiempo en el que la informacion se enviara al servidor para ser actualizado, en este caso es de 5 segiundos
  const interval = setInterval(sendCryptoData, 5000);

  //Al iniciar la conexion los datos se envian inmediatamente 
  sendCryptoData();

  // Limpiar el intervalo cuando el cliente se desconecta
  ws.on('close', () => {
    console.log('Cliente desconectado');
    clearInterval(interval);
  });
});

// Se habilita el puerto en el que se cargara el servidor, en este caso se usara el puerto 8080
server.listen(8080, () => {
  console.log('Servidor escuchando en http://localhost:8080');
});
