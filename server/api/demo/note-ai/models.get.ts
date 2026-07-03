import { defineEventHandler } from "h3";

export default defineEventHandler(() => {
  return {
    models: [
      { id: "gpt-4.1-mini", name: "GPT-4.1 Mini (Demo)" },
      { id: "gpt-4.1", name: "GPT-4.1 (Demo)" },
      { id: "gpt-5-mini", name: "GPT-5 Mini (Demo)" },
    ],
  };
});
