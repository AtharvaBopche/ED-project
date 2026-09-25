// Deterministic business rules backed by each business's own data. This is not an LLM.
export function buildRecommendations(db,businessId){
 const low=db.prepare('SELECT name,stock,min_stock FROM products WHERE business_id=? AND archived=0 AND stock<=min_stock ORDER BY stock ASC LIMIT 6').all(businessId);
 const expiring=db.prepare("SELECT name,expiry_date,stock FROM products WHERE business_id=? AND archived=0 AND expiry_date<>'' AND date(expiry_date)<=date('now','+30 days') AND stock>0 ORDER BY expiry_date LIMIT 4").all(businessId);
 const slow=db.prepare("SELECT p.name,p.stock,COALESCE(SUM(CASE WHEN s.created_at>=datetime('now','-30 days') THEN i.quantity ELSE 0 END),0) sold FROM products p LEFT JOIN sale_items i ON i.product_id=p.id LEFT JOIN sales s ON s.id=i.sale_id WHERE p.business_id=? AND p.archived=0 GROUP BY p.id ORDER BY sold ASC LIMIT 4").all(businessId);
 const fast=db.prepare("SELECT p.name,SUM(i.quantity) sold FROM sale_items i JOIN sales s ON s.id=i.sale_id JOIN products p ON p.id=i.product_id WHERE s.business_id=? AND p.business_id=? AND s.created_at>=datetime('now','-30 days') GROUP BY p.id ORDER BY sold DESC LIMIT 3").all(businessId,businessId);
 const result=[];
 for(const p of low)result.push({type:p.stock===0?'out':'restock',priority:p.stock===0?'high':'high',title:p.stock===0?`Restock ${p.name}`:`Reorder ${p.name}`,detail:p.stock===0?'Out of stock':`${p.stock} on hand · reorder point ${p.min_stock}`,action:'Review product'});
 for(const p of expiring)result.push({type:'expiry',priority:'medium',title:`Check ${p.name} expiry`,detail:`${p.stock} units · expires ${p.expiry_date}`,action:'Review stock'});
 for(const p of slow)if(Number(p.sold)===0&&Number(p.stock)>0)result.push({type:'slow',priority:'low',title:'Review slow-moving stock',detail:`${p.name} has no recorded sales in the past 30 days.`,action:'View inventory'});
 if(fast.length)result.push({type:'trend',priority:'low',title:'Top seller this month',detail:`${fast[0].name} sold ${fast[0].sold} units in the last 30 days.`,action:'View sales'});
 if(!result.length)result.push({type:'healthy',priority:'low',title:'Inventory is in good shape',detail:'No urgent stock or expiry actions based on current records.',action:'View inventory'});
 return result.slice(0,8);
}
