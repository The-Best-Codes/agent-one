CREATE TABLE registry_entries (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    version TEXT NOT NULL,
    is_latest INTEGER NOT NULL,
    status TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    keywords TEXT NOT NULL,
    has_stdio INTEGER NOT NULL,
    has_http INTEGER NOT NULL,
    summary_json TEXT NOT NULL,
    entry_json TEXT NOT NULL,
    UNIQUE(name, version)
);

CREATE INDEX registry_browse ON registry_entries(is_latest, status, title, name);

CREATE VIRTUAL TABLE registry_fts USING fts5(
    name, title, description, keywords,
    content='registry_entries', content_rowid='id',
    tokenize='unicode61', prefix='2 3 4'
);

CREATE TRIGGER registry_insert AFTER INSERT ON registry_entries BEGIN
    INSERT INTO registry_fts(rowid, name, title, description, keywords)
    VALUES (new.id, new.name, new.title, new.description, new.keywords);
    UPDATE registry_entries SET is_latest = 0
    WHERE new.is_latest = 1 AND name = new.name AND id != new.id AND is_latest = 1;
END;

CREATE TRIGGER registry_update AFTER UPDATE ON registry_entries BEGIN
    INSERT INTO registry_fts(registry_fts, rowid, name, title, description, keywords)
    VALUES ('delete', old.id, old.name, old.title, old.description, old.keywords);
    INSERT INTO registry_fts(rowid, name, title, description, keywords)
    VALUES (new.id, new.name, new.title, new.description, new.keywords);
    UPDATE registry_entries SET is_latest = 0
    WHERE new.is_latest = 1 AND name = new.name AND id != new.id AND is_latest = 1;
END;

CREATE TRIGGER registry_delete AFTER DELETE ON registry_entries BEGIN
    INSERT INTO registry_fts(registry_fts, rowid, name, title, description, keywords)
    VALUES ('delete', old.id, old.name, old.title, old.description, old.keywords);
END;

CREATE TABLE registry_sync (
    id INTEGER PRIMARY KEY CHECK(id = 1),
    initial_complete INTEGER NOT NULL DEFAULT 0,
    last_success INTEGER NOT NULL DEFAULT 0,
    checkpoint TEXT,
    pending_since TEXT,
    pending_cursor TEXT,
    pending_started TEXT
);

INSERT INTO registry_sync(id) VALUES (1);
