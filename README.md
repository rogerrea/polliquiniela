# PolliQuiniela Mundialista - Grupalia

App local para que varias personas se registren, pronostiquen partidos del Mundial 2026, vean sus puntos y comparen la tabla.

## Qué Necesitas Primero

Necesitas tener `npm` instalado. Si `npm --version` no muestra un número, instala Node.js LTS desde:

https://nodejs.org/

## Cómo Correr La App

Abre una terminal en esta carpeta y corre:

```bash
npm install
npx prisma migrate dev
npm run seed
npm run dev
```

Luego abre:

```text
http://localhost:3000
```

## Cuentas De Prueba

Después de correr `npm run seed`, puedes entrar con:

```text
Admin:
email: admin@grupalia.com

Usuario normal:
email: usuario@grupalia.com
```

No hay contraseña. Para entrar solo escribe un correo que termine en `@grupalia.com`.
La app envía un código de 6 dígitos a ese correo y solo entra quien pueda leerlo.

En ambiente local/pruebas, también puedes entrar con este código fijo:

```text
111111
```

Para enviar correos de verdad puedes usar un servicio externo.

Opción recomendada para esta app: Resend.

```text
RESEND_API_KEY="re_xxxxxxxxx"
RESEND_FROM="PolliQuiniela Mundialista <login@quiniela.grupalia.com>"
```

Para que Resend mande a cualquier persona de Grupalia, tienes que verificar un dominio o subdominio. Recomendación:

```text
quiniela.grupalia.com
```

Así no dependes de una cuenta personal como `alguien@grupalia.com`; Resend puede mandar desde `login@quiniela.grupalia.com`.

También puedes usar SMTP si prefieres:

```text
SMTP_HOST="smtp.example.com"
SMTP_PORT="587"
SMTP_USER="usuario"
SMTP_PASS="password"
SMTP_FROM="quiniela@grupalia.com"
SMTP_SECURE="false"
```

En desarrollo, si Resend y SMTP no están configurados, el código aparece en la terminal donde corre `npm run dev`.

Para probar si el envío real ya funciona:

```bash
npm run test:email -- tu-correo@grupalia.com
```

Si Grupalia usa Google Workspace/Gmail, normalmente los datos serían:

```text
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="correo-que-envia@grupalia.com"
SMTP_PASS="app-password-o-password-smtp"
SMTP_FROM="correo-que-envia@grupalia.com"
SMTP_SECURE="false"
```

Con Resend no necesitas `SMTP_USER` ni `SMTP_PASS`; solo necesitas `RESEND_API_KEY` y el dominio verificado.
Con SMTP sí necesitas `SMTP_USER` y `SMTP_PASS` de la cuenta que enviará los códigos.

## Páginas

- `/register` muestra el mismo acceso simple por correo.
- `/login` entra a la app con correo `@grupalia.com`.
- `/logout` cierra sesión.
- `/dashboard` muestra tu lugar, puntos, pendientes y top 10.
- `/predictions` permite guardar pronósticos.
- `/leaderboard` muestra la tabla general.
- `/admin` permite editar equipos, partidos, resultados y recalcular puntos.
- En `/admin` también puedes configurar premios para 1er y segundo lugar; se muestran flotando abajo en la app.

## Datos Del Mundial

La semilla incluye los 48 países clasificados, grupos A-L y calendario de partidos del Mundial 2026. Cada partido muestra un link para verificar fecha y equipos en FIFA.

En fase de grupos pronosticas 1º y 2º lugar de cada grupo. Puedes guardar un grupo a la vez. Los partidos de grupos aparecen para consulta, pero no se capturan marcadores.

Puntos de grupos:
- 1º lugar exacto: 5 puntos.
- 2º lugar exacto: 5 puntos.
- Equipo en top 2 pero en posición invertida: 2 puntos.
- Máximo por grupo: 10 puntos.

En eliminatorias pronosticas marcador y ganador solo cuando el partido ya tiene equipos definidos. Los partidos que todavía dependen de clasificados aparecen como "Aún no disponible".

Los pronósticos se cierran automáticamente 5 minutos antes del partido o del primer partido del grupo. La regla se revisa en el servidor, no solo en la pantalla.

La quiniela del torneo incluye campeón y subcampeón. Ya no incluye goleador.

## Correr Pruebas

```bash
npm run test
```

## Probar Escenarios Falsos En Local

Para revisar cómo se vería la tabla a mitad o al final del torneo, puedes cargar datos falsos en tu base local:

```bash
npm run scenario:mid
npm run scenario:end
```

Esto crea usuarios demo, resultados ficticios, puntos, premios y pronósticos. Solo debe usarse en local/desarrollo, no en producción.

## Deployment En Vercel

La app local usa SQLite, pero en Vercel debe usar Postgres porque SQLite es un archivo local y no sirve como base permanente en producción.

Ya quedó preparada esta estructura:

- `vercel.json`: le dice a Vercel que use el build especial de producción.
- `prisma-postgres/schema.prisma`: misma base de datos, pero en versión Postgres para Vercel.
- `prisma-postgres/migrations`: tablas que Vercel aplicará en la base Postgres.
- `.vercelignore`: evita subir archivos locales como `.next`, `node_modules` y `prisma/dev.db`.

### Pasos En Vercel

1. Sube este proyecto a GitHub.
2. Entra a Vercel y crea un proyecto importando ese repositorio.
3. En el proyecto de Vercel, agrega una base Postgres desde Storage / Marketplace. Puedes usar Neon, Prisma Postgres o Supabase.
4. Asegúrate de que Vercel agregue `DATABASE_URL` al proyecto.
5. Agrega estas variables de entorno en Vercel:

```text
AUTH_SECRET="un-texto-largo-y-secreto"
RESEND_API_KEY="re_xxxxxxxxx"
RESEND_FROM="PolliQuiniela Mundialista <login@quiniela.grupalia.com>"
SMTP_HOST="tu-servidor-smtp"
SMTP_PORT="587"
SMTP_USER="tu-usuario-smtp"
SMTP_PASS="tu-password-smtp"
SMTP_FROM="quiniela@grupalia.com"
SMTP_SECURE="false"
```

Si usas Resend, las variables SMTP pueden quedar vacías.

6. Haz deploy. Vercel correrá:

```bash
npm run build:vercel
```

Ese comando genera Prisma para Postgres y construye la app.

Después de conectar la base Postgres, aplica las tablas con:

```bash
npm run prisma:migrate:vercel
```

### Cargar Datos Iniciales En Producción

Después de crear la base por primera vez, corre una sola vez:

```bash
npm run seed:vercel:initial
```

Importante: no uses ese comando cuando ya haya quinielas reales guardadas, porque reinicia equipos, partidos y datos de prueba.
