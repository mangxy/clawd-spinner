import type { Draw } from '../acts'
import { SCENES as g1 } from './g1'
import { SCENES as g2 } from './g2'
import { SCENES as g3 } from './g3'
import { SCENES as g4 } from './g4'
import { SCENES as g5 } from './g5'
import { SCENES as g6 } from './g6'

/** One scene per spinner word, keyed by keyOf(word). */
export const SCENES: Record<string, Draw> = { ...g1, ...g2, ...g3, ...g4, ...g5, ...g6 }
