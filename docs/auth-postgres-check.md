# Auth + PostgreSQL Manual Check

This guide gives a ready flow to verify auth behavior and what is written to PostgreSQL.

## 1) Enable SQL trace (optional but useful)

In root `.env`:

```env
SQL_TRACE=true
```

Then restart backend dev server. Prisma queries will appear in backend logs.

## 2) Full auth flow with curl

Use one shell session so cookie jar and token variable are reused.

```bash
BASE_URL="http://localhost:3100"
COOKIE_JAR="./.tmp-auth-cookies.txt"
USERNAME="authcheck_$(date +%s)"
PASSWORD="Password123!"
EMAIL="${USERNAME}@example.com"
```

### Register

```bash
curl -i -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"$USERNAME\",\"password\":\"$PASSWORD\",\"email\":\"$EMAIL\"}"
```

### Login (stores refresh cookie)

```bash
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -c "$COOKIE_JAR" \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"$USERNAME\",\"password\":\"$PASSWORD\"}")
echo "$LOGIN_RESPONSE"
ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | sed -n 's/.*"accessToken":"\([^"]*\)".*/\1/p')
echo "ACCESS_TOKEN=$ACCESS_TOKEN"
```

### Profile (Bearer token)

```bash
curl -i "$BASE_URL/auth/profile" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### Refresh (uses httpOnly refresh cookie)

```bash
REFRESH_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/refresh" \
  -b "$COOKIE_JAR" -c "$COOKIE_JAR")
echo "$REFRESH_RESPONSE"
NEW_ACCESS_TOKEN=$(echo "$REFRESH_RESPONSE" | sed -n 's/.*"accessToken":"\([^"]*\)".*/\1/p')
echo "NEW_ACCESS_TOKEN=$NEW_ACCESS_TOKEN"
```

### Sessions (shows active refresh-token sessions)

```bash
curl -i "$BASE_URL/auth/sessions" \
  -H "Authorization: Bearer $NEW_ACCESS_TOKEN"
```

### Logout

```bash
curl -i -X POST "$BASE_URL/auth/logout" \
  -b "$COOKIE_JAR" -c "$COOKIE_JAR"
```

## 3) PostgreSQL queries to inspect writes

Use from repo root:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec -T postgres \
  sh -lc 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"'
```

Then run:

```sql
-- Latest users
SELECT id, username, email, "createdAt"
FROM users
ORDER BY "createdAt" DESC
LIMIT 10;

-- Latest refresh tokens (device + revoke status)
SELECT id, "userId", "isRevoked", "deviceInfo", "ipAddress", "createdAt", "lastUsedAt", "expiresAt"
FROM refresh_tokens
ORDER BY "createdAt" DESC
LIMIT 20;

-- Sessions count by user
SELECT u.username, COUNT(rt.id) AS refresh_tokens_total
FROM users u
LEFT JOIN refresh_tokens rt ON rt."userId" = u.id
GROUP BY u.username
ORDER BY refresh_tokens_total DESC, u.username;

-- Revoked vs active tokens
SELECT "isRevoked", COUNT(*) AS cnt
FROM refresh_tokens
GROUP BY "isRevoked";
```
