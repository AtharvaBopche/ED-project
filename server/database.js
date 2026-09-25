import 'dotenv/config';
import initSqlJs from 'sql.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const directory=path.dirname(fileURLToPath(import.meta.url));
const location=path.resolve(process.env.DB_PATH||'./data/stockpilot.sqlite');
fs.mkdirSync(path.dirname(location),{recursive:true});
const SQL=await initSqlJs({locateFile:file=>path.join(directory,'..','node_modules','sql.js','dist',file)});
const raw=fs.existsSync(location)?new SQL.Database(fs.readFileSync(location)):new SQL.Database();
raw.run('PRAGMA foreign_keys = ON');
raw.run(fs.readFileSync(path.join(directory,'schema.sql'),'utf8'));
let transactionDepth=0;
const persist=()=>{if(!transactionDepth){const temporary=`${location}.tmp`;fs.writeFileSync(temporary,Buffer.from(raw.export()));fs.renameSync(temporary,location);}};

function prepare(sql){return{
 all(...params){const st=raw.prepare(sql);try{if(params.length)st.bind(params);const rows=[];while(st.step())rows.push(st.getAsObject());return rows;}finally{st.free();}},
 get(...params){return this.all(...params)[0];},
 run(...params){const st=raw.prepare(sql);try{if(params.length)st.bind(params);while(st.step()){}const changes=raw.getRowsModified();const id=raw.exec('SELECT last_insert_rowid() AS id')[0]?.values[0]?.[0]??0;persist();return{changes,lastInsertRowid:id};}finally{st.free();}}
};}

export const db={
 prepare,
 exec(sql){raw.run(sql);persist();},
 pragma(_statement){return undefined;},
 transaction(fn){return(...args)=>{raw.run('BEGIN');transactionDepth++;try{const out=fn(...args);raw.run('COMMIT');transactionDepth--;persist();return out;}catch(e){raw.run('ROLLBACK');transactionDepth--;throw e;}};},
 close(){persist();raw.close();}
};
