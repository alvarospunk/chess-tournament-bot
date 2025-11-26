# 🎯 Instrucciones para Cargar tu Torneo

## Paso 1: Obtener el Chat ID del grupo 📱

1. Abre el grupo de Telegram donde está el bot
2. Envía el comando: `/chatid` o `/start`
3. El bot te responderá con el Chat ID del grupo (algo como `-1001234567890`)
4. **Copia ese número**

## Paso 2: Actualizar el archivo de datos 📝

1. Abre el archivo: `/Users/JGARRI/repos/chess-tournament-bot/data/tournaments.json`
2. Busca la línea: `"YOUR_CHAT_ID": {`
3. Reemplázala por tu Chat ID real, por ejemplo: `"-1001234567890": {`
4. Guarda el archivo

**Ejemplo:**
```json
{
  "-1001234567890": {
    "name": "Liga del Chesito",
    ...
  }
}
```

## Paso 3: Reiniciar el bot 🔄

Desde la carpeta del proyecto, ejecuta:
```bash
cd /Users/JGARRI/repos/chess-tournament-bot
./start.sh
```

O manualmente:
```bash
cd /Users/JGARRI/repos/chess-tournament-bot
node src/index.js
```

## Paso 4: ¡Prueba tu torneo! 🎉

En el grupo, envía:
- `/clasificacion` - Deberías ver: Álvaro (1 pto), Alberto (1 pto), Jorge (0), Donas (0)
- `/jornada_actual` - Verás: Jorge vs Alberto y Donas vs Álvaro (pendientes)
- `/ultima_jornada` - Verás la jornada 1 completada

---

## 📊 Estado Actual de tu Torneo

**Jugadores:**
- 🥇 Álvaro: 1 punto (1J, 1V-0E-0D)
- 🥇 Alberto: 1 punto (1J, 1V-0E-0D)
- Jorge: 0 puntos (1J, 0V-0E-1D)
- Donas: 0 puntos (1J, 0V-0E-1D)

**Jornada 1 ✅ Completada:**
- Jorge 0-1 Álvaro ✅
- Donas 0-1 Alberto ✅

**Jornada 2 ⏳ En Proceso:**
- Jorge vs Alberto (pendiente)
- Donas vs Álvaro (pendiente)

**Jornada 3 📅 Programada:**
- Jorge vs Donas
- Álvaro vs Alberto

---

## 🎮 Registrar Resultados de la Jornada 2

Para registrar los resultados pendientes:

1. Envía: `/registrar_resultado`
2. Para Jorge vs Alberto: `3 1-0` (si gana Jorge) o `3 0-1` (si gana Alberto) o `3 0.5-0.5` (empate)
3. Para Donas vs Álvaro: `4 1-0` o `4 0-1` o `4 0.5-0.5`

---

## 🆘 Solución de Problemas

**"No hay ningún torneo activo":**
- El Chat ID en `tournaments.json` no coincide con el grupo
- Envía `/chatid` en el grupo para verificar el ID correcto
- Asegúrate de reiniciar el bot después de editar el archivo

**El bot no responde:**
- Verifica que el bot esté en el grupo
- Asegúrate de que el bot tenga permisos para leer mensajes
- Comprueba que el bot esté ejecutándose (revisa la terminal)

**Chat ID de grupos siempre empiezan con `-` (número negativo)**

---

## 💡 Comandos Útiles

- `/chatid` - Ver el ID del chat actual
- `/start` - Ver comandos e información del chat
- `/clasificacion` - Tabla de posiciones
- `/jornada_actual` - Partidos pendientes
- `/registrar_resultado` - Añadir resultados
