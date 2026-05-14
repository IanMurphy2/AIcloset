import 'reflect-metadata'; // ¡Obligatorio para que funcionen los decoradores!
import config from '../Config';
import { initializeDB } from '../dbConnection';
import { createExpressApp } from './ExpressApp';

const startServer = async () => {
  try {
    // 1. Inicializar la Base de Datos (PostgreSQL)
    await initializeDB();
    console.log('✅ Base de datos conectada');

    // 2. Crear la instancia de Express
    const app = createExpressApp();
    
    // 3. Obtener el puerto desde Convict (default 3000)
    const port = config.get('port');

    // 4. ¡A la cancha!
    app.listen(port, () => {
      console.log(`🚀 Servidor listo en: http://localhost:${port}`);
      console.log(`📜 Documentación (Swagger) en: http://localhost:${port}/docs`);
    });

  } catch (error) {
    console.error('💥 Error al arrancar el servidor:', error);
    process.exit(1); // Cerramos el proceso si algo falla críticamente
  }
};

startServer();