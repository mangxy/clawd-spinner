declare module 'claude-code' {
  interface PluginState {
    'clawd-spinner': {
      /** The act's continuity: the word being acted out, when the turn began, and
       *  the /clawd-word override. Kept by the host so a plugin reload picks the
       *  act up where it stood instead of flashing a restart. */
      act: {
        /** The word being acted out, as the Spinner last handed it over. */
        word: string
        /** When the current turn began: the act's clock zero. */
        turnAt: number
        /** The /clawd-word override, or null following the real words. */
        force: string | null
        /** Rises by one each load: an older module's heartbeat sees it move and stops itself. */
        gen: number
      }
    }
  }
}
