# 📱 Ejemplos de Uso

## Ejemplo 1: Crear un Torneo con 4 Jugadores

1. Inicia conversación con el bot: [@quesito_torneador_bot](https://t.me/quesito_torneador_bot)

2. Envía: `/nuevo_torneo`

3. Responde con los nombres:
   ```
   Alice, Bob, Charlie, Diana
   ```

4. El bot creará un torneo con 6 partidos en la fase de grupos (todos contra todos)

## Ejemplo 2: Ver la Jornada Actual

Envía: `/jornada_actual`

Respuesta del bot:
```
▶️ JORNADA ACTUAL

Jornada 1
1. Alice vs Bob - ⏳ Pendiente
2. Charlie vs Diana - ⏳ Pendiente
```

## Ejemplo 3: Registrar Resultados

1. Envía: `/registrar_resultado`

2. Para registrar que Alice ganó a Bob en el partido 1:
   ```
   1 1-0
   ```

3. Para registrar un empate en el partido 2:
   ```
   2 0.5-0.5
   ```

4. Para registrar que Diana ganó a Charlie en el partido 3:
   ```
   3 0-1
   ```

## Ejemplo 4: Ver la Clasificación

Envía: `/clasificacion`

Respuesta del bot:
```
🏆 CLASIFICACIÓN

🥇 Alice
   Puntos: 3 | PJ: 3 | V: 3 | E: 0 | D: 0

🥈 Diana
   Puntos: 2 | PJ: 3 | V: 2 | E: 0 | D: 1

🥉 Bob
   Puntos: 1.5 | PJ: 3 | V: 1 | E: 1 | D: 1

4. Charlie
   Puntos: 0.5 | PJ: 3 | V: 0 | E: 1 | D: 2
```

## Ejemplo 5: Ver Todas las Jornadas

Envía: `/todas_jornadas`

Respuesta del bot:
```
📅 TODAS LAS JORNADAS

Jornada 1
  1. Alice vs Bob - 1-0
  2. Charlie vs Diana - 0-1

Jornada 2
  3. Alice vs Charlie - 1-0
  4. Bob vs Diana - 0.5-0.5

Jornada 3
  5. Alice vs Diana - 1-0
  6. Bob vs Charlie - 1-0

FASE ELIMINATORIA

Semifinales
  7. Alice vs Bob - Pendiente
  8. Diana vs Charlie - Pendiente
```

## Ejemplo 6: Crear un Torneo Grande (8 Jugadores)

```
Magnus, Hikaru, Fabiano, Ding, Nepomniachtchi, Alireza, Wesley, Levon
```

Este torneo tendrá:
- **Fase de grupos**: 28 partidos (todos contra todos)
- **Fase eliminatoria**: Top 8 clasificados → Semifinales (4 partidos)
- **Final y Tercer Puesto**: 2 partidos finales

## 💡 Consejos

1. **Mantén un registro**: Anota los resultados de las partidas reales antes de registrarlas en el bot

2. **Consulta frecuentemente**: Usa `/clasificacion` para ver quién va primero

3. **Planifica jornadas**: Usa `/proximas_jornadas` para saber qué partidos vienen

4. **Revisa el historial**: Usa `/todas_jornadas` para verificar todos los resultados

5. **Un torneo por chat**: Cada grupo o chat puede tener su propio torneo independiente

## 🎯 Flujo Completo de un Torneo

1. `/nuevo_torneo` → Ingresar jugadores
2. `/jornada_actual` → Ver partidos a jugar
3. `/registrar_resultado` → Ingresar resultados de cada partido
4. Repetir pasos 2-3 hasta completar fase de grupos
5. El bot automáticamente genera las semifinales
6. Continuar registrando resultados
7. El bot genera la final y tercer puesto
8. `/clasificacion` → Ver clasificación final

---

¡Comienza tu torneo ahora en [@quesito_torneador_bot](https://t.me/quesito_torneador_bot)! 🏆
