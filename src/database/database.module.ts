import { Inject, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';

export const DATABASE_POOL = Symbol('DATABASE_POOL');

@Module({
        providers:[
        {
            provide: DATABASE_POOL,
            inject:[ConfigService],
            useFactory: async (configService: ConfigService) => {
                const pool = new Pool({
                    connectionString: configService.getOrThrow('DATABASE_URL')
                })

                await pool.query('SELECT 1'); // test connection is valid
                return pool;
            }
        }
    ],

    exports:[DATABASE_POOL]
})
export class DatabaseModule {
    constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

    async onApplicationShutdown() {
        await this.pool.end();
    }
}
