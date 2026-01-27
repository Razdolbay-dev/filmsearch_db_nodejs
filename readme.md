Создание базы данных и пользователей MySQL

1.1. Создать базу данных
```sql
CREATE DATABASE tmdb_content CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

```

1.2. Создать пользователей
```sql
CREATE USER 'user_media'@'127.0.0.1' IDENTIFIED BY '123321';

```

1.3. Выдать права пользователям
```sql
GRANT ALL PRIVILEGES ON tmdb_content.* TO 'user_media'@'127.0.0.1';

```

1.4. Применяем изменения
```sql
FLUSH PRIVILEGES;

```

Готово.

Простой запрос на вывод фильмов по популярности > 1

```sql
SELECT COUNT(*) as count
FROM `tmdb_export_movies`
WHERE `popularity` > 1
ORDER BY `popularity` DESC;
```