import type { WritableDeep } from "type-fest";

export type Updater<A> = (draft: WritableDeep<A>) => void | A;
