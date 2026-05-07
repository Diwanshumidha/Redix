import { contextBridge, ipcRenderer } from 'electron'
import { CH } from '@shared/ipc-channels'
import type { ElectronAPI } from '@shared/types'

const invoke = (ch: string, ...args: unknown[]) => ipcRenderer.invoke(ch, ...args)

const api: ElectronAPI = {
  connection: {
    list:   ()               => invoke(CH.CONN_LIST),
    create: (conn)           => invoke(CH.CONN_CREATE, conn),
    update: (id, patch)      => invoke(CH.CONN_UPDATE, id, patch),
    remove: (id)             => invoke(CH.CONN_DELETE, id),
    test:   (conn)           => invoke(CH.CONN_TEST,   conn),
    open:   (id)             => invoke(CH.CONN_OPEN,   id),
    close:  (id)             => invoke(CH.CONN_CLOSE,  id),
    status: (id)             => invoke(CH.CONN_STATUS, id),
  },
  keys: {
    scan:    (cid, pat, cur, n) => invoke(CH.KEYS_SCAN,    cid, pat, cur, n),
    type:    (cid, key)         => invoke(CH.KEYS_TYPE,    cid, key),
    delete:  (cid, keys)        => invoke(CH.KEYS_DELETE,  cid, keys),
    ttl:     (cid, key)              => invoke(CH.KEYS_TTL,     cid, key),
    expire:  (cid, key, s)           => invoke(CH.KEYS_EXPIRE,  cid, key, s),
    persist: (cid, key)              => invoke(CH.KEYS_PERSIST, cid, key),
    rename:  (cid, oldKey, newKey)   => invoke(CH.KEYS_RENAME,  cid, oldKey, newKey),
  },
  string: {
    get: (cid, key)          => invoke(CH.STR_GET, cid, key),
    set: (cid, key, val, ttl) => invoke(CH.STR_SET, cid, key, val, ttl),
  },
  hash: {
    getAll: (cid, key)           => invoke(CH.HASH_GETALL, cid, key),
    set:    (cid, key, f, v)     => invoke(CH.HASH_SET,    cid, key, f, v),
    del:    (cid, key, f)        => invoke(CH.HASH_DEL,    cid, key, f),
  },
  list: {
    range: (cid, key, s, e)    => invoke(CH.LIST_RANGE, cid, key, s, e),
    push:  (cid, key, val, sd) => invoke(CH.LIST_PUSH,  cid, key, val, sd),
    set:   (cid, key, i, val)  => invoke(CH.LIST_SET,   cid, key, i, val),
    rem:   (cid, key, i)       => invoke(CH.LIST_REM,   cid, key, i),
  },
  set: {
    members: (cid, key)      => invoke(CH.SET_MEMBERS, cid, key),
    add:     (cid, key, m)   => invoke(CH.SET_ADD,     cid, key, m),
    remove:  (cid, key, m)   => invoke(CH.SET_REMOVE,  cid, key, m),
  },
  zset: {
    range:  (cid, key, s, e) => invoke(CH.ZSET_RANGE,  cid, key, s, e),
    add:    (cid, key, sc, m) => invoke(CH.ZSET_ADD,   cid, key, sc, m),
    remove: (cid, key, m)     => invoke(CH.ZSET_REMOVE, cid, key, m),
  },
  cli: {
    execute: (cid, cmd) => invoke(CH.CLI_EXEC, cid, cmd),
  },
  server: {
    info:    (cid) => invoke(CH.SRV_INFO,   cid),
    dbSize:  (cid) => invoke(CH.SRV_DBSIZE, cid),
    flushDb: (cid) => invoke(CH.SRV_FLUSH,  cid),
  },
  app: {
    version: () => invoke(CH.APP_VERSION),
  },
}

contextBridge.exposeInMainWorld('electron', api)
