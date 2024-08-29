import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import fs from 'fs';
import path from 'path';

// Caminho para o diretório e arquivo do banco de dados
const dbPath = path.resolve(__dirname, './');
const dbFile = path.join(dbPath, 'measures.db');

// Função para abrir o banco de dados
async function openDb(): Promise<Database<sqlite3.Database, sqlite3.Statement>> {
    // Crie o diretório se não existir
    if (!fs.existsSync(dbPath)) {
        fs.mkdirSync(dbPath, { recursive: true });
    }

    // Abre a conexão com o banco de dados
    const db = await open({
        filename: dbFile,
        driver: sqlite3.Database,
    });

    return db;
}

// Função para inicializar o banco de dados
async function initializeDatabase() {
    try {
        const db = await openDb();

        // Criação das tabelas se elas não existirem
        await db.exec(`  
            CREATE TABLE IF NOT EXISTS measures (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                customer_id INTEGER NOT NULL,
                measure_uuid TEXT UNIQUE NOT NULL,
                measure_datetime TEXT NOT NULL,
                measure_type TEXT NOT NULL,
                has_confirmed INTEGER DEFAULT 0,
                image_url TEXT,
                measure_value REAL
            );
        `);

        console.log('Database initialized successfully.');
    } catch (err) {
        console.error('Error initializing database:', err);
        throw err; // Repassa o erro para ser tratado onde a função é chamada
    }
}

// Executa a função de inicialização
initializeDatabase().catch((err) => {
    console.error('Error during database initialization:', err);
});

export default { initializeDatabase, openDb };
