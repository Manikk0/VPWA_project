/* eslint-disable prettier/prettier */
import type { AdonisEndpoint } from '@tuyau/core/types'
import type { Registry } from './schema.d.ts'
import type { ApiDefinition } from './tree.d.ts'

export type { Route, Path } from './schema.d.ts'

const placeholder: any = {}

const routes = {
  'auth.new_account.store': {
    methods: ["POST"],
    pattern: '/api/v1/auth/signup',
    tokens: [[0,"api"],[0,"v1"],[0,"auth"],[0,"signup"]],
    types: placeholder as Registry['auth.new_account.store']['types'],
  },
  'auth.access_tokens.store': {
    methods: ["POST"],
    pattern: '/api/v1/auth/login',
    tokens: [[0,"api"],[0,"v1"],[0,"auth"],[0,"login"]],
    types: placeholder as Registry['auth.access_tokens.store']['types'],
  },
  'profile.profile.show': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/account/profile',
    tokens: [[0,"api"],[0,"v1"],[0,"account"],[0,"profile"]],
    types: placeholder as Registry['profile.profile.show']['types'],
  },
  'profile.access_tokens.destroy': {
    methods: ["POST"],
    pattern: '/api/v1/account/logout',
    tokens: [[0,"api"],[0,"v1"],[0,"account"],[0,"logout"]],
    types: placeholder as Registry['profile.access_tokens.destroy']['types'],
  },
  'channels.channels.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/channels',
    tokens: [[0,"api"],[0,"v1"],[0,"channels"]],
    types: placeholder as Registry['channels.channels.index']['types'],
  },
  'channels.channels.join': {
    methods: ["POST"],
    pattern: '/api/v1/channels/join',
    tokens: [[0,"api"],[0,"v1"],[0,"channels"],[0,"join"]],
    types: placeholder as Registry['channels.channels.join']['types'],
  },
  'channels.channels.leave': {
    methods: ["POST"],
    pattern: '/api/v1/channels/:id/leave',
    tokens: [[0,"api"],[0,"v1"],[0,"channels"],[1,"id"],[0,"leave"]],
    types: placeholder as Registry['channels.channels.leave']['types'],
  },
  'channels.channels.destroy': {
    methods: ["DELETE"],
    pattern: '/api/v1/channels/:id',
    tokens: [[0,"api"],[0,"v1"],[0,"channels"],[1,"id"]],
    types: placeholder as Registry['channels.channels.destroy']['types'],
  },
  'channels.channels.kick': {
    methods: ["POST"],
    pattern: '/api/v1/channels/:id/kick',
    tokens: [[0,"api"],[0,"v1"],[0,"channels"],[1,"id"],[0,"kick"]],
    types: placeholder as Registry['channels.channels.kick']['types'],
  },
} as const satisfies Record<string, AdonisEndpoint>

export { routes }

export const registry = {
  routes,
  $tree: {} as ApiDefinition,
}

declare module '@tuyau/core/types' {
  export interface UserRegistry {
    routes: typeof routes
    $tree: ApiDefinition
  }
}
