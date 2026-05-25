-- Sleutelbeheer-MVV29 — MySQL initialisatie schema
-- Dit bestand wordt automatisch uitgevoerd bij eerste opstart van de database.

CREATE TABLE IF NOT EXISTS persons (
    id          VARCHAR(36)  NOT NULL PRIMARY KEY,
    first_name  VARCHAR(100) NOT NULL,
    last_name   VARCHAR(100) NOT NULL,
    created_at  DATETIME     DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS rooms (
    id          VARCHAR(50)  NOT NULL PRIMARY KEY,
    name        VARCHAR(200) NOT NULL
);

CREATE TABLE IF NOT EXISTS key_types (
    id          VARCHAR(36)  NOT NULL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    rooms_json  TEXT         -- komma-gescheiden ruimtenamen (backward compat)
);

CREATE TABLE IF NOT EXISTS `keys` (
    id           VARCHAR(36)  NOT NULL PRIMARY KEY,
    number       VARCHAR(50)  NOT NULL UNIQUE,
    key_type_id  VARCHAR(36)  NOT NULL,
    FOREIGN KEY (key_type_id) REFERENCES key_types(id)
);

CREATE TABLE IF NOT EXISTS key_rooms (
    key_id   VARCHAR(36) NOT NULL,
    room_id  VARCHAR(50) NOT NULL,
    PRIMARY KEY (key_id, room_id),
    FOREIGN KEY (key_id)  REFERENCES `keys`(id)  ON DELETE CASCADE,
    FOREIGN KEY (room_id) REFERENCES rooms(id)   ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS transactions (
    id              VARCHAR(36)  NOT NULL PRIMARY KEY,
    key_id          VARCHAR(36)  NOT NULL,
    person_id       VARCHAR(36)  NOT NULL,
    type            ENUM('ISSUED','RETURNED','LOST','BROKEN','EXTENDED') NOT NULL,
    timestamp       BIGINT       NOT NULL,
    signature       MEDIUMTEXT,
    expiration_date BIGINT,
    FOREIGN KEY (key_id)    REFERENCES `keys`(id),
    FOREIGN KEY (person_id) REFERENCES persons(id)
);
