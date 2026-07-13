const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

const proxyOptions = {
    target: 'http://localhost:3005/api/v1',
    changeOrigin: true,
    on: {
        proxyReq: (proxyReq, req, res) => {
            console.log(`target: http://localhost:3005/api/v1, proxyReq.path: ${proxyReq.path}`);
        }
    }
};

const router = express.Router();
router.use('/api/v1/clustering/subject', createProxyMiddleware(proxyOptions));
app.use('/', router);

app.listen(3000, () => {
    console.log('Test proxy running on port 3000');
    const http = require('http');
    http.get('http://localhost:3000/api/v1/clustering/subject/search-smart', (res) => {
        process.exit(0);
    });
});
