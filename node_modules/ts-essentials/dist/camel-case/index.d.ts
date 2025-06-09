declare type IsStringLiteral<Type> = Type extends string ? (string extends Type ? false : true) : false;
declare type WordInCamelCase<Type, Word extends string = ""> = Type extends `${Word}${infer NextCharacter}${infer _}` ? NextCharacter extends Capitalize<NextCharacter> ? Word : WordInCamelCase<Type, `${Word}${NextCharacter}`> : Word;
declare type Separator = "_" | "-";
declare type IncludesSeparator<Type> = Type extends `${string}${Separator}${string}` ? true : false;
declare type IsOneWord<Type> = Type extends Lowercase<Type & string> ? true : Type extends Uppercase<Type & string> ? true : false;
declare type IsCamelCase<Type> = Type extends Uncapitalize<Type & string> ? true : false;
declare type IsPascalCase<Type> = Type extends Capitalize<Type & string> ? true : false;
/** snake_case, CONSTANT_CASE, kebab-case or COBOL-CASE */
declare type SeparatorCaseParser<Type, Tuple extends readonly any[] = []> = Type extends `${infer Word}${Separator}${infer Tail}` ? SeparatorCaseParser<Tail, [...Tuple, Lowercase<Word>]> : Type extends `${infer Word}` ? [...Tuple, Lowercase<Word>] : Tuple;
declare type CamelCaseParser<Type, Tuple extends readonly any[] = []> = Type extends "" ? Tuple : Type extends `${WordInCamelCase<Type>}${infer Tail}` ? Type extends `${infer Word}${Tail}` ? CamelCaseParser<Uncapitalize<Tail>, [...Tuple, Lowercase<Word>]> : never : never;
declare type PascalCaseParser<Type> = Type extends string ? CamelCaseParser<Uncapitalize<Type>> : never;
declare type SplitAnyCase<Type> = IncludesSeparator<Type> extends true ? SeparatorCaseParser<Type> : IsOneWord<Type> extends true ? [Lowercase<Type & string>] : IsCamelCase<Type> extends true ? CamelCaseParser<Type> : IsPascalCase<Type> extends true ? PascalCaseParser<Type> : [];
declare type PascalCapitalizer<Type, Tuple extends readonly any[] = []> = Type extends [infer Head, ...infer Tail] ? Head extends string ? PascalCapitalizer<Tail, [...Tuple, Capitalize<Head>]> : PascalCapitalizer<Tail, Tuple> : Tuple;
declare type CamelCapitalizer<Type> = Type extends [infer First, ...infer Tail] ? PascalCapitalizer<Tail, [First]> : [];
declare type Join<Type, JoinedString extends string = ""> = Type extends [infer Head, ...infer Tail] ? Head extends string ? Join<Tail, `${JoinedString}${Head}`> : Join<Tail> : JoinedString;
export declare type CamelCase<Type> = IsStringLiteral<Type> extends true ? Join<CamelCapitalizer<SplitAnyCase<Type>>> : Type;
export {};
