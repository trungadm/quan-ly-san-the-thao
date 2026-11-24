CREATE TABLE IF NOT EXISTS users (
    id INT NOT NULL AUTO_INCREMENT,
    name VARCHAR(150) NOT NULL,
    username VARCHAR(100) NOT NULL,
<<<<<<< HEAD
=======
    password VARCHAR(64) NOT NULL DEFAULT '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92',
>>>>>>> 988d88e4f6f9ce7ec6b7c096403d907c2e1891e2
    role VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Hoạt động',
    PRIMARY KEY (id),
    UNIQUE KEY users_username_unique (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
<<<<<<< HEAD
=======

SET @has_password = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = 'sportiva'
      AND TABLE_NAME = 'users'
      AND COLUMN_NAME = 'password'
);
SET @add_password_sql = IF(
    @has_password = 0,
    "ALTER TABLE users ADD COLUMN password VARCHAR(64) NOT NULL DEFAULT '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92'",
    'SELECT 1'
);
PREPARE add_password_statement FROM @add_password_sql;
EXECUTE add_password_statement;
DEALLOCATE PREPARE add_password_statement;

INSERT INTO users (name, username, password, role, status)
VALUES ('Quản trị viên', 'admin', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'Quản trị viên', 'Hoạt động')
ON DUPLICATE KEY UPDATE name = VALUES(name), role = VALUES(role), status = VALUES(status);
>>>>>>> 988d88e4f6f9ce7ec6b7c096403d907c2e1891e2
