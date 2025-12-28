<script setup lang="ts">
const value = ref({
  type: "doc",
  content: [
    {
      type: "heading",
      attrs: {
        level: 1,
      },
      content: [
        {
          type: "text",
          text: "Hello World",
        },
      ],
    },
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "This is a ",
        },
        {
          type: "text",
          marks: [
            {
              type: "bold",
            },
          ],
          text: "rich text",
        },
        {
          type: "text",
          text: " editor.",
        },
      ],
    },
  ],
});
</script>

<template></template>
