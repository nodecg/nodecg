export declare type ElementOf<Type extends readonly any[]> = Type extends readonly (infer Values)[] ? Values : never;
