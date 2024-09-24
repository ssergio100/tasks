import Dexie from 'dexie';

const db = new Dexie('tasks');
db.version(3).stores({
    tasks: '++id, name, color, time, total_time, order, status_id, link, dev, homolog, prod,number,summary, comments, archived',
    config:'geral_time, width_task, theme',

});

export default db;
