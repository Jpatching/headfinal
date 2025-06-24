"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const app_module_1 = require("./app.module");
const cookieParser = require('cookie-parser');
async function bootstrap() {
    const logger = new common_1.Logger('Bootstrap');
    try {
        const app = await core_1.NestFactory.create(app_module_1.AppModule, {
            logger: ['error', 'warn', 'log', 'debug', 'verbose'],
        });
        app.useGlobalPipes(new common_1.ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
            transformOptions: {
                enableImplicitConversion: true,
            },
        }));
        app.use(cookieParser());
        app.enableCors({
            origin: process.env.NODE_ENV === 'production'
                ? [
                    'https://pv3-frontend.vercel.app',
                    'https://pv3.gaming',
                    'https://www.pv3.gaming',
                    'https://pv3-gaming-of16zi287-lowreyal70-gmailcoms-projects.vercel.app',
                    /^https:\/\/pv3-gaming-.*\.vercel\.app$/
                ]
                : [
                    'http://localhost:3000',
                    'http://localhost:3001',
                    'http://127.0.0.1:3000'
                ],
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: [
                'Origin',
                'X-Requested-With',
                'Content-Type',
                'Accept',
                'Authorization',
                'Cache-Control',
                'Pragma'
            ],
        });
        app.setGlobalPrefix('api/v1');
        app.getHttpAdapter().get('/health', (req, res) => {
            res.status(200).json({
                status: 'ok',
                timestamp: new Date().toISOString(),
                service: 'pv3-backend',
                version: '1.0.0',
            });
        });
        process.on('SIGTERM', async () => {
            logger.log('SIGTERM received, shutting down gracefully');
            await app.close();
            process.exit(0);
        });
        process.on('SIGINT', async () => {
            logger.log('SIGINT received, shutting down gracefully');
            await app.close();
            process.exit(0);
        });
        const port = process.env.PORT || 8000;
        await app.listen(port, '0.0.0.0');
        logger.log(`🚀 PV3 Backend API running on port ${port}`);
        logger.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
        logger.log(`🌐 API Base URL: http://localhost:${port}/api/v1`);
        logger.log(`❤️  Health Check: http://localhost:${port}/health`);
    }
    catch (error) {
        logger.error('Failed to start application:', error);
        process.exit(1);
    }
}
bootstrap();
//# sourceMappingURL=main.js.map