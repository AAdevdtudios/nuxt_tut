// test [foo.client.ts
import { defineNuxtPlugin } from "#app";

export default defineNuxtPlugin(() => {
  // Plugin logic here
  console.log("Hello world");
  return {
    provide: {
      foo: () => "bar",
    },
  };
});
