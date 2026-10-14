/**
 * What a product copies from IDv1 with Sync 1 (`sync1`): the code scheme, its
 * counts and the scannable code, into a folder the copy owns whole.
 */
export default {
  exports: {
    ids: { owned: true, files: ({ tree }) => tree('src', { skip: /\.test\.ts$/ }) },
  },
}
