/* eslint-disable prettier/prettier */
import type { routes } from './index.ts'

export interface ApiDefinition {
  auth: {
    newAccount: {
      store: typeof routes['auth.new_account.store']
    }
    accessTokens: {
      store: typeof routes['auth.access_tokens.store']
    }
  }
  profile: {
    profile: {
      show: typeof routes['profile.profile.show']
    }
    accessTokens: {
      destroy: typeof routes['profile.access_tokens.destroy']
    }
  }
  channels: {
    channels: {
      index: typeof routes['channels.channels.index']
      join: typeof routes['channels.channels.join']
      leave: typeof routes['channels.channels.leave']
      destroy: typeof routes['channels.channels.destroy']
      kick: typeof routes['channels.channels.kick']
      invite: typeof routes['channels.channels.invite']
      revoke: typeof routes['channels.channels.revoke']
      seen: typeof routes['channels.channels.seen']
    }
    messages: {
      index: typeof routes['channels.messages.index']
      store: typeof routes['channels.messages.store']
    }
  }
}
