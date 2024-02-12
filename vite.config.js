import path from 'path';

export default {
  server: {
    host: '0.0.0.0',
    port: process.env.VITE_PORT || 3000,
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
