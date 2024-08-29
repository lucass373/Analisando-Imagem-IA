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

export default { createMeasure };