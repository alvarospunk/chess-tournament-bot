# 🤖 Bot de Torneos de Ajedrez para Telegram

Bot de Telegram para organizar y gestionar torneos de ajedrez con fase de clasificación, eliminatorias y final.

## 🎯 Características

- ♟️ **Fase de Clasificación**: Sistema round-robin donde todos juegan contra todos
- 🏆 **Fase Eliminatoria**: Los mejores clasificados compiten en semifinales
- 🥇 **Final y Tercer Puesto**: Partidos finales para determinar los ganadores
- 📊 **Clasificación en Tiempo Real**: Puntos, partidas jugadas, victorias, empates y derrotas
- 📅 **Gestión de Jornadas**: Consulta de jornadas pasadas, actuales y futuras
- ✅ **Registro de Resultados**: Sistema fácil para actualizar resultados de partidos

## 🚀 Instalación

1. Clona el repositorio:
```bash
cd chess-tournament-bot
```

2. Instala las dependencias:
```bash
npm install
```

3. Configura el token del bot:
   - El archivo `.env` ya está configurado con el token: `8560269302:AAHOZlnRUsnKZTyyAlmvhll5Mnh1ea7QccE`
   - Tu bot está disponible en: https://t.me/quesito_torneador_bot

4. Inicia el bot:
```bash
npm start
```

## 📖 Uso

### Comandos Disponibles

- `/start` - Inicia el bot y muestra la bienvenida
- `/ayuda` - Muestra la guía completa de uso
- `/nuevo_torneo` - Crea un nuevo torneo
- `/clasificacion` - Muestra la tabla de clasificación actual
- `/todas_jornadas` - Muestra el historial completo de partidos
- `/ultima_jornada` - Muestra los resultados de la última jornada completada
- `/jornada_actual` - Muestra los partidos de la jornada actual
- `/proximas_jornadas` - Muestra el calendario de próximos partidos
- `/registrar_resultado` - Registra el resultado de un partido

### 🎮 Cómo Crear un Torneo

1. Envía `/nuevo_torneo` al bot
2. Responde con los nombres de los participantes separados por comas:
   ```
   Juan, María, Pedro, Ana, Luis, Carmen
   ```
3. El bot creará automáticamente la fase de clasificación con todos los enfrentamientos

### 📝 Cómo Registrar Resultados

1. Envía `/registrar_resultado`
2. El bot te pedirá el ID del partido y el resultado
3. Responde con el formato: `ID resultado`
   - Ejemplo: `5 1-0` (partido 5, gana el primer jugador)
   
**Resultados válidos:**
- `1-0` - Gana el primer jugador (1 punto)
- `0-1` - Gana el segundo jugador (1 punto)
- `0.5-0.5` - Empate (0.5 puntos para cada uno)

### 🏆 Fases del Torneo

1. **Fase de Clasificación**: Sistema round-robin donde todos los jugadores se enfrentan entre sí
2. **Fase Eliminatoria**: Los mejores 8 clasificados (o todos si hay menos) juegan semifinales
3. **Final y Tercer Puesto**: Los ganadores de semifinales juegan la final, los perdedores juegan por el tercer puesto

## 🔧 Desarrollo

Para ejecutar en modo desarrollo con auto-recarga:
```bash
npm run dev
```

## 📦 Dependencias

- `node-telegram-bot-api`: Cliente de Telegram Bot API
- `dotenv`: Gestión de variables de entorno

## 📄 Estructura del Proyecto

```
chess-tournament-bot/
├── src/
│   ├── index.js         # Punto de entrada del bot
│   └── tournament.js    # Lógica del torneo
├── .env                 # Configuración (token del bot)
├── .gitignore
├── package.json
└── README.md
```

## 🛡️ Seguridad

⚠️ **IMPORTANTE**: El archivo `.env` contiene el token de tu bot. Nunca lo compartas públicamente ni lo subas a repositorios públicos. Ya está incluido en `.gitignore` para evitar commits accidentales.

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:
1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT.

## 👤 Autor

Creado para gestionar torneos de ajedrez de forma fácil y divertida.

## 🐛 Reportar Problemas

Si encuentras algún bug o tienes sugerencias, por favor abre un issue en el repositorio.

---

¡Disfruta organizando tus torneos de ajedrez! ♟️🏆
