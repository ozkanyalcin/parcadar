import pg from 'pg'

const { Pool } = pg

const pool = new Pool({
  host:     process.env.PG_HOST     || 'localhost',
  port:     parseInt(process.env.PG_PORT || '5432'),
  database: process.env.PG_DATABASE || 'parcadar',
  user:     process.env.PG_USER     || 'parcadar',
  password: process.env.PG_PASSWORD || 'parcadar2026',
})

export default pool
