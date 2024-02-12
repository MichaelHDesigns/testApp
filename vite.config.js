import path from 'path';

export default {
  server: {
    open: true,
    hmr: {
      overlay: false,
    },
  },
  resolve: {
    alias: {
      '/components': path.resolve(__dirname, 'src', 'components'),
    },
  },
};
