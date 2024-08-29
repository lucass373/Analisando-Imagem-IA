import initDb from './init';

async function createMeasure(customer_id: number, measure_uuid: string, measure_datetime: string, measure_type: string, has_confirmed: number, image_url: string, measure_value: string) {
    const db = await initDb.openDb();
    if (!db) {
        throw new Error('Database has not been initialized.');
    }

    const insertQuery = `
        INSERT INTO measures (
            customer_id, 
            measure_uuid, 
            measure_datetime, 
            measure_type, 
            has_confirmed, 
            image_url, 
            measure_value
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    await db.run(insertQuery, customer_id, measure_uuid, measure_datetime, measure_type, has_confirmed, image_url, measure_value);

    console.log('New measure inserted successfully.');

}

async function checkIfMeasureExistsForCurrentMonth(customer_id: number, measure_datetime: string, measure_type: string) {
    const db = await initDb.openDb();
    if (!db) {
        throw new Error('Database has not been initialized.');
    }

    const startOfMonth = new Date(measure_datetime);
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const endOfMonth = new Date(startOfMonth);
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);

    const selectQuery = `
        SELECT * FROM measures 
        WHERE customer_id = ? 
        AND measure_type = ? 
        AND measure_datetime >= ? 
        AND measure_datetime < ?
    `;

    const existingMeasure = await db.get(selectQuery, customer_id, measure_type.toUpperCase(), startOfMonth.toISOString(), endOfMonth.toISOString());

    return !!existingMeasure;  // Retorna true se encontrar uma medição, false caso contrário
}

export default { createMeasure, checkIfMeasureExistsForCurrentMonth};