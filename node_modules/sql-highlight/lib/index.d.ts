declare module 'sql-highlight' {
  export interface HighlightOptions {
    html?: boolean;
    htmlEscaper?: (str: string) => string;
    classPrefix?: string;
    colors?: {
      keyword: string;
      function: string;
      number: string;
      string: string;
      identifier: string;
      special: string;
      bracket: string;
      comment: string;
      clear: string;
    };
  }

  export interface Segment {
    name: string;
    content: string;
  }

  export function getSegments(sqlString: string): Array<Segment>;
  export function highlight(
    sqlString: string,
    options?: HighlightOptions
  ): string;
  export const DEFAULT_OPTIONS: HighlightOptions;
}
