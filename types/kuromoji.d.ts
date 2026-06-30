declare module "kuromoji" {
  interface BuilderOptions {
    dicPath: string;
  }
  interface Tokenizer {
    tokenize(text: string): any[];
  }
  function builder(options: BuilderOptions): {
    build(callback: (error: Error | null, tokenizer: Tokenizer) => void): void;
  };
}
