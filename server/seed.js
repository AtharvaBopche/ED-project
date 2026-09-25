import bcrypt from 'bcryptjs';
import { db } from './database.js';

const run = async () => {
  const email='demo@stockpilot.local';
  if(db.prepare('SELECT id FROM users WHERE email=?').get(email)){console.log('Demo account already exists.');return;}
  const result=db.prepare("INSERT INTO businesses(name,email,address,phone,currency,trial_end) VALUES(?,?,?,?,?,datetime('now','+60 days'))").run('Northstar Supply Co.','hello@northstar.example','Indiranagar, Bengaluru','+91 80 5555 0100','INR');
  const businessId=Number(result.lastInsertRowid);
  db.prepare('INSERT INTO settings(business_id) VALUES(?)').run(businessId);
  const role=db.prepare('INSERT INTO roles(business_id,name,permissions) VALUES(?,?,?)').run(businessId,'Owner','["*"]');
  const user=db.prepare('INSERT INTO users(business_id,name,email,password_hash,role) VALUES(?,?,?,?,?)').run(businessId,'Aarav Mehta',email,await bcrypt.hash('StockPilotDemo!',10),'Owner');
  db.prepare('INSERT INTO employees(business_id,user_id,role_id) VALUES(?,?,?)').run(businessId,user.lastInsertRowid,role.lastInsertRowid);
  const party=db.prepare('INSERT INTO parties(business_id,name,kind,company,email,phone) VALUES(?,?,?,?,?,?)');
  const customer1=Number(party.run(businessId,'Mira Kapoor','customer','','mira@example.com','+91 98765 10234').lastInsertRowid);
  party.run(businessId,'Kabir Shah','customer','','kabir@example.com','+91 98765 43210');
  const supplier=Number(party.run(businessId,'Willow Home Goods','supplier','Willow Home Goods','orders@willow.example','+91 22 5555 0100').lastInsertRowid);
  const product=db.prepare('INSERT INTO products(business_id,name,sku,category,cost,price,stock,min_stock,max_stock,gst,supplier_id) VALUES(?,?,?,?,?,?,?,?,?,?,?)');
  const products=[
    ['Ceramic Pour-over Set','KIT-014','Kitchen',680,1290,24,8,60,12,supplier],['Everyday Bottle · 750ml','BOT-022','Outdoors',260,590,8,12,80,5,supplier],['Linen Desk Organizer','DSK-009','Workspace',420,890,31,10,70,12,supplier],['Travel Mug · Sage','MUG-031','Kitchen',310,720,5,10,50,12,supplier],['Canvas Market Tote','BAG-006','Accessories',190,490,42,15,100,5,supplier],['Clip-on Reading Light','LGT-018','Workspace',350,790,16,8,60,18,supplier],['Pocket Notebook Set','PAP-003','Stationery',95,240,67,20,200,12,supplier],['Brass Page Clips','DSK-011','Workspace',120,320,3,8,60,18,supplier]
  ].map(p=>Number(product.run(businessId,...p).lastInsertRowid));
  const sale=db.prepare('INSERT INTO sales(business_id,party_id,total,subtotal,payment_method,created_at) VALUES(?,?,?,?,?,datetime(\'now\',?))');
  const item=db.prepare('INSERT INTO sale_items(sale_id,product_id,quantity,unit_price) VALUES(?,?,?,?)');
  for(const [days,index,qty] of [[0,0,2],[0,4,1],[0,6,3],[1,2,1],[2,1,2],[3,3,1],[4,4,2],[5,5,1],[6,0,1],[8,2,2],[10,6,3],[13,3,2],[17,5,1],[21,0,1],[26,4,3]]){
    const p=db.prepare('SELECT id,price FROM products WHERE id=?').get(products[index]);const s=Number(sale.run(businessId,customer1,p.price*qty,p.price*qty,'Card',`-${days} days`).lastInsertRowid);item.run(s,p.id,qty,p.price);
  }
  db.prepare('INSERT INTO purchases(business_id,supplier_id,total,invoice_number,payment_status,created_at) VALUES(?,?,?,?,?,datetime(\'now\',\'-3 days\'))').run(businessId,supplier,3490,'WH-1042','Paid');
  console.log('Demo data created. Login: demo@stockpilot.local / StockPilotDemo!');
};
run().catch(e=>{console.error(e);process.exitCode=1;});
