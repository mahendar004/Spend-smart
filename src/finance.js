export const CATEGORIES={expense:['Food & Dining','Transportation','Shopping','Bills & Utilities','Entertainment','Healthcare','Education','Travel','Housing','Other'],income:['Salary','Freelance','Business','Investment','Gift','Other']}
export const KEY='spendsmart.data.v1'
export const today=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
export const money=n=>new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(Number.isFinite(+n)?+n:0)
export const totals=xs=>xs.reduce((r,x)=>({...r,[x.type]:r[x.type]+(+x.amount||0)}),{income:0,expense:0})
export const monthKey=date=>typeof date==='string'?date.slice(0,7):`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}`
export const inMonth=(transactions,month)=>transactions.filter(x=>monthKey(x.date)===month)
export const savingsRate=(income,expense)=>income>0?(income-expense)/income*100:null
export const categoryTotals=(transactions,type='expense')=>transactions.filter(x=>x.type===type).reduce((out,x)=>({...out,[x.category]:(out[x.category]||0)+(+x.amount||0)}),{})
export const budgetStatus=(spent,limit)=>({remaining:Math.max(0,limit-spent),percent:limit>0?spent/limit*100:null,status:limit<=0?'unset':spent>=limit?'over':spent/limit>=.8?'near':'normal'})
export const validAmount=value=>Number.isFinite(Number(value))&&Number(value)>0
export function filterTransactions(transactions,{query='',type='All',category='All',month='All months',sort='Newest first'}={}){
  return [...transactions].filter(x=>String(x.description||'').toLowerCase().includes(query.toLowerCase())&&(type==='All'||x.type===type)&&(category==='All'||x.category===category)&&(month==='All months'||monthKey(x.date)===month)).sort((a,b)=>sort==='Newest first'?b.date.localeCompare(a.date):sort==='Oldest first'?a.date.localeCompare(b.date):sort==='Highest amount'?b.amount-a.amount:a.amount-b.amount)
}
export function load(){try{const d=JSON.parse(localStorage.getItem(KEY));return d?.version===1&&Array.isArray(d.transactions)&&d.budgets?d:{version:1,transactions:[],budgets:{}}}catch{return{version:1,transactions:[],budgets:{}}}}
export function persist(d){try{localStorage.setItem(KEY,JSON.stringify(d));return true}catch{return false}}
