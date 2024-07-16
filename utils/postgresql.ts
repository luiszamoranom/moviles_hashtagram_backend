// @ts-ignore
import postgres from 'postgres'
import 'dotenv/config'

const host: string | undefined= process.env.POSTGRESQL_HOST;
const port: number = 5432;
const database: string | undefined = process.env.POSTGRESQL_DATABASE;
const username: string | undefined = process.env.POSTGRESQL_USERNAME;
const password: string | undefined =  process.env.POSTGRESQL_PASSWORD;

export const sql = postgres(`postgres://${username}:${password}@${host}:${port}/${database}`, {
})