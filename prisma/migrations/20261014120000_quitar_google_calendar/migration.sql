-- Se elimina la sincronización con Google Calendar: esta tabla solo guardaba la equivalencia entre
-- un evento local (asesoría o audiencia) y su evento en Google. El calendario del sistema no depende de ella.
DROP TABLE IF EXISTS "calendar_event_sync";
