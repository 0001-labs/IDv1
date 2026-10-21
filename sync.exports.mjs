/**
 * What a product copies from IDv1 with Sync 1 (`sync1`): the code scheme, its
 * counts and the scannable code, into a folder the copy owns whole. `advanced`
 * is the expanded version alone, an event's code with the shapes and words it
 * is read against, for a piece that needs nothing else (the Feedback loop's
 * client mints a session's code with it).
 */
export default {
  exports: {
    ids: { owned: true, files: ({ tree }) => tree('src', { skip: /\.test\.ts$/ }) },
    advanced: {
      owned: true,
      files: ({ read }) => ({ 'advanced.ts': read('src/advanced.ts'), 'shapes.ts': read('src/shapes.ts'), 'words.ts': read('src/words.ts') }),
    },
  },
}
