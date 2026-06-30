import { QUESTIONS as basic } from "./basic";
import { QUESTIONS as advanced } from "./advanced";
import { VocabItem } from "../types";

export const QUESTIONS: Omit<VocabItem, "id">[] = [...basic, ...advanced];
