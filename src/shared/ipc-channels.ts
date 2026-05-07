/**
 * Single source of truth for all IPC channel names.
 * Imported by both the main-process handlers and the preload bridge,
 * so a rename here is the only change needed on both sides.
 */
export const CH = {
  // Connection CRUD (persisted in SQLite)
  CONN_LIST:   'connection:list',
  CONN_CREATE: 'connection:create',
  CONN_UPDATE: 'connection:update',
  CONN_DELETE: 'connection:delete',

  // Redis client lifecycle
  CONN_TEST:   'connection:test',
  CONN_OPEN:   'connection:open',
  CONN_CLOSE:  'connection:close',
  CONN_STATUS: 'connection:status',

  // Key operations
  KEYS_SCAN:    'keys:scan',
  KEYS_TYPE:    'keys:type',
  KEYS_DELETE:  'keys:delete',
  KEYS_TTL:     'keys:ttl',
  KEYS_EXPIRE:  'keys:expire',
  KEYS_PERSIST: 'keys:persist',
  KEYS_RENAME:  'keys:rename',

  // Value operations per type
  STR_GET:      'string:get',
  STR_SET:      'string:set',

  HASH_GETALL:  'hash:getAll',
  HASH_SET:     'hash:set',
  HASH_DEL:     'hash:del',

  LIST_RANGE:   'list:range',
  LIST_PUSH:    'list:push',
  LIST_SET:     'list:set',
  LIST_REM:     'list:rem',

  SET_MEMBERS:  'set:members',
  SET_ADD:      'set:add',
  SET_REMOVE:   'set:remove',

  ZSET_RANGE:   'zset:range',
  ZSET_ADD:     'zset:add',
  ZSET_REMOVE:  'zset:remove',

  // CLI
  CLI_EXEC:     'cli:execute',

  // Server
  SRV_INFO:     'server:info',
  SRV_DBSIZE:   'server:dbSize',
  SRV_FLUSH:    'server:flushDb',

  // App
  APP_VERSION:  'app:version',
} as const
