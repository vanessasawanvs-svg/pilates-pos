
const $ = s => document.querySelector(s);
const money = n => `$${Number(n||0).toFixed(2)}`;
const today = () => new Date().toISOString().slice(0,10);
const uid = () => Date.now().toString(36)+Math.random().toString(36).slice(2,7);

const seed = {
  clients: [],
  memberships: [
    {id:uid(),name:"Single Session",sessions:1,price:25,days:30},
    {id:uid(),name:"5 Sessions",sessions:5,price:110,days:45},
    {id:uid(),name:"10 Sessions",sessions:10,price:200,days:60},
    {id:uid(),name:"Monthly Unlimited",sessions:999,price:250,days:30}
  ],
  products: [
    {id:uid(),name:"Grip Socks",category:"Retail",cost:8,price:18,stock:0,min:5},
    {id:uid(),name:"Water",category:"Retail",cost:.30,price:1,stock:0,min:12}
  ],
  sales: [],
  expenses: [],
  classes: [],
  team: []
};

let db = JSON.parse(localStorage.getItem("studioflow-db") || "null") || seed;
let page = "dashboard";
let cart = [];

function save(){localStorage.setItem("studioflow-db",JSON.stringify(db)); render()}
function esc(s=""){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
function nav(){
  return ["dashboard","clients","schedule","pos","memberships","inventory","expenses","finance","team","settings"].map(x =>
    `<button data-page="${x}" class="${page===x?"active":""}">${({dashboard:"⌂ Dashboard",clients:"◎ Clients",schedule:"□ Schedule",pos:"$ POS / Sales",memberships:"◇ Memberships",inventory:"▣ Inventory",expenses:"− Expenses",finance:"↗ Finance",team:"◌ Team",settings:"⚙ Settings"})[x]}</button>`
  ).join("")
}
function totals(){
  const rev=db.sales.reduce((a,s)=>a+Number(s.total),0), exp=db.expenses.reduce((a,e)=>a+Number(e.amount),0);
  return {rev,exp,profit:rev-exp}
}
function layout(content,title,subtitle=""){
  $("#app").innerHTML=`<div class="app"><aside class="sidebar"><div class="brand">${esc(localStorage.getItem("studio-name")||"StudioFlow")}<small>Pilates Studio Manager</small></div><div class="nav">${nav()}</div></aside><main class="main"><div class="topbar"><div><h1>${title}</h1><p>${subtitle}</p></div><button class="btn" onclick="exportData()">Backup data</button></div>${content}</main></div>`;
  document.querySelectorAll("[data-page]").forEach(b=>b.onclick=()=>{page=b.dataset.page;render()})
}
function dashboard(){
  const t=totals(), low=db.products.filter(p=>Number(p.stock)<=Number(p.min));
  const todays=db.classes.filter(c=>c.date===today());
  layout(`<div class="grid kpis">
    <div class="card kpi"><div class="label">Revenue</div><div class="value">${money(t.rev)}</div><div class="sub">All recorded sales</div></div>
    <div class="card kpi"><div class="label">Expenses</div><div class="value">${money(t.exp)}</div><div class="sub">Bills, stock, payroll & more</div></div>
    <div class="card kpi"><div class="label">Estimated profit</div><div class="value">${money(t.profit)}</div><div class="sub">Revenue − expenses</div></div>
    <div class="card kpi"><div class="label">Clients</div><div class="value">${db.clients.length}</div><div class="sub">${db.products.length} inventory items</div></div>
  </div><div class="spacer"></div><div class="grid two">
    <div class="card"><h3>Today's classes</h3>${todays.length?todays.map(c=>`<div class="cart-row"><span><b>${esc(c.time)}</b> ${esc(c.type)}</span><span>${esc(c.instructor||"")} · ${esc(c.booked||0)}/${esc(c.capacity||0)}</span></div>`).join(""):'<div class="empty">No classes scheduled today.</div>'}</div>
    <div class="card"><h3>Low stock</h3>${low.length?low.map(p=>`<div class="cart-row"><span>${esc(p.name)}</span><span class="badge low">${p.stock} left</span></div>`).join(""):'<div class="empty">Stock levels look good.</div>'}</div>
  </div>`, "Dashboard","Your studio at a glance");
}
function clients(){
  layout(`<div class="card"><div class="toolbar"><button class="btn primary" onclick="clientModal()">+ Add client</button></div>
  ${db.clients.length?`<table><thead><tr><th>Client</th><th>Phone</th><th>Package</th><th>Sessions</th><th>Expiry</th><th></th></tr></thead><tbody>${db.clients.map(c=>`<tr><td><b>${esc(c.name)}</b><div class="muted">${esc(c.email||"")}</div></td><td>${esc(c.phone||"")}</td><td>${esc(c.package||"—")}</td><td>${c.sessions??0}</td><td>${esc(c.expiry||"—")}</td><td><button class="btn small" onclick="useSession('${c.id}')">Use session</button> <button class="btn small" onclick="sellMembership('${c.id}')">Add package</button> <button class="btn small danger" onclick="removeItem('clients','${c.id}')">Delete</button></td></tr>`).join("")}</tbody></table>`:'<div class="empty">Add your first client.</div>'}</div>`,"Clients","Packages, attendance and contact details");
}
function schedule(){
  layout(`<div class="card"><div class="toolbar"><button class="btn primary" onclick="classModal()">+ Add class</button></div>
  ${db.classes.length?`<table><thead><tr><th>Date</th><th>Time</th><th>Class</th><th>Instructor</th><th>Bookings</th><th></th></tr></thead><tbody>${[...db.classes].sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time)).map(c=>`<tr><td>${c.date}</td><td>${esc(c.time)}</td><td>${esc(c.type)}</td><td>${esc(c.instructor||"")}</td><td>${c.booked||0}/${c.capacity||0}</td><td><button class="btn small danger" onclick="removeItem('classes','${c.id}')">Delete</button></td></tr>`).join("")}</tbody></table>`:'<div class="empty">No classes yet.</div>'}</div>`,"Schedule","Group classes, privates and studio capacity");
}
function pos(){
  const sellables=[...db.memberships.map(m=>({...m,kind:"membership"})),...db.products.map(p=>({...p,kind:"product"}))];
  layout(`<div class="pos"><div class="card"><h3>Products & packages</h3><div class="product-grid">${sellables.map(p=>`<div class="product" onclick='addCart(${JSON.stringify(p).replace(/'/g,"&#39;")})'><b>${esc(p.name)}</b><small>${p.kind==="product"?`${p.stock} in stock`:`${p.sessions===999?"Unlimited":p.sessions+" sessions"}`}</small><div style="margin-top:8px">${money(p.price)}</div></div>`).join("")}</div></div>
  <div class="card"><h3>Current sale</h3>${cart.length?cart.map((x,i)=>`<div class="cart-row"><span>${esc(x.name)}</span><span>${money(x.price)} <button class="btn small" onclick="cart.splice(${i},1);render()">×</button></span></div>`).join(""):'<div class="empty">Tap an item to add it.</div>'}
  <div class="spacer"></div><label class="muted">Client (optional)</label><select id="saleClient"><option value="">Walk-in</option>${db.clients.map(c=>`<option value="${c.id}">${esc(c.name)}</option>`).join("")}</select>
  <div class="spacer"></div><label class="muted">Payment</label><select id="payment"><option>Cash</option><option>Card</option><option>Whish</option><option>Transfer</option></select>
  <h2 class="right">${money(cart.reduce((a,x)=>a+Number(x.price),0))}</h2><button class="btn primary" style="width:100%" onclick="checkout()">Complete sale</button></div></div>`,"POS / Sales","Sell memberships, sessions and retail products");
}
function memberships(){
  layout(`<div class="card"><div class="toolbar"><button class="btn primary" onclick="membershipModal()">+ Add membership</button></div>
  <table><thead><tr><th>Name</th><th>Sessions</th><th>Price</th><th>Validity</th><th></th></tr></thead><tbody>${db.memberships.map(m=>`<tr><td><b>${esc(m.name)}</b></td><td>${m.sessions===999?"Unlimited":m.sessions}</td><td>${money(m.price)}</td><td>${m.days} days</td><td><button class="btn small danger" onclick="removeItem('memberships','${m.id}')">Delete</button></td></tr>`).join("")}</tbody></table></div>`,"Memberships","Create your class packages and validity rules");
}
function inventory(){
  layout(`<div class="grid two"><div class="card"><div class="toolbar"><button class="btn primary" onclick="productModal()">+ Add product</button><button class="btn" onclick="stockPurchaseModal()">Record stock purchase</button></div>
  <table><thead><tr><th>Product</th><th>Cost</th><th>Sell</th><th>Stock</th><th></th></tr></thead><tbody>${db.products.map(p=>`<tr><td><b>${esc(p.name)}</b><div class="muted">${esc(p.category||"")}</div></td><td>${money(p.cost)}</td><td>${money(p.price)}</td><td><span class="badge ${Number(p.stock)<=Number(p.min)?"low":"good"}">${p.stock}</span></td><td><button class="btn small danger" onclick="removeItem('products','${p.id}')">Delete</button></td></tr>`).join("")}</tbody></table></div>
  <div class="card"><h3>How stock purchases work</h3><p class="muted">When you buy socks, water or other stock, record the purchase here. The quantity is added to inventory and the total cost is automatically added to Expenses.</p></div></div>`,"Inventory","Retail stock, purchase cost and selling price");
}
function expenses(){
  layout(`<div class="card"><div class="toolbar"><button class="btn primary" onclick="expenseModal()">+ Add expense</button></div>
  ${db.expenses.length?`<table><thead><tr><th>Date</th><th>Category</th><th>Description</th><th>Payment</th><th>Amount</th><th></th></tr></thead><tbody>${[...db.expenses].reverse().map(e=>`<tr><td>${e.date}</td><td>${esc(e.category)}</td><td>${esc(e.description)}</td><td>${esc(e.payment||"")}</td><td class="money-out">${money(e.amount)}</td><td><button class="btn small danger" onclick="removeItem('expenses','${e.id}')">Delete</button></td></tr>`).join("")}</tbody></table>`:'<div class="empty">Record electricity, rent, salaries, inventory purchases and other costs.</div>'}</div>`,"Expenses","Everything your studio pays for");
}
function finance(){
  const t=totals();
  const byCat={}; db.expenses.forEach(e=>byCat[e.category]=(byCat[e.category]||0)+Number(e.amount));
  layout(`<div class="grid three"><div class="card kpi"><div class="label">Revenue</div><div class="value">${money(t.rev)}</div></div><div class="card kpi"><div class="label">Expenses</div><div class="value">${money(t.exp)}</div></div><div class="card kpi"><div class="label">Estimated profit</div><div class="value">${money(t.profit)}</div></div></div><div class="spacer"></div>
  <div class="grid two"><div class="card"><h3>Expense breakdown</h3>${Object.keys(byCat).length?Object.entries(byCat).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`<div class="cart-row"><span>${esc(k)}</span><b>${money(v)}</b></div>`).join(""):'<div class="empty">No expenses yet.</div>'}</div>
  <div class="card"><h3>Recent sales</h3>${db.sales.length?[...db.sales].reverse().slice(0,10).map(s=>`<div class="cart-row"><span>${esc(s.date)} · ${esc(s.payment)}</span><span class="money-in">${money(s.total)}</span></div>`).join(""):'<div class="empty">No sales yet.</div>'}</div></div>`,"Finance","Revenue, expenses and estimated profit");
}
function team(){
  layout(`<div class="card"><div class="toolbar"><button class="btn primary" onclick="teamModal()">+ Add team member</button></div>
  ${db.team.length?`<table><thead><tr><th>Name</th><th>Role</th><th>Phone</th><th>Rate / Commission</th><th></th></tr></thead><tbody>${db.team.map(t=>`<tr><td><b>${esc(t.name)}</b></td><td>${esc(t.role)}</td><td>${esc(t.phone||"")}</td><td>${esc(t.rate||"")}</td><td><button class="btn small danger" onclick="removeItem('team','${t.id}')">Delete</button></td></tr>`).join("")}</tbody></table>`:'<div class="empty">Add instructors or staff.</div>'}</div>`,"Team","Instructors, staff and pay notes");
}
function settings(){
  layout(`<div class="grid two"><div class="card"><h3>Studio identity</h3><label class="muted">Studio name</label><input id="studioName" value="${esc(localStorage.getItem("studio-name")||"StudioFlow")}"><div class="spacer"></div><button class="btn primary" onclick="localStorage.setItem('studio-name',$('#studioName').value);render()">Save name</button></div>
  <div class="card"><h3>Data</h3><p class="muted">This version saves data in this browser. Use Backup Data regularly. Clearing browser storage can erase it.</p><div class="toolbar"><button class="btn" onclick="exportData()">Backup data</button><label class="btn">Restore backup<input type="file" accept=".json" style="display:none" onchange="importData(event)"></label><button class="btn danger" onclick="resetAll()">Reset everything</button></div></div></div>`,"Settings","Studio name and data backup");
}
function render(){({dashboard,clients,schedule,pos,memberships,inventory,expenses,finance,team,settings})[page]()}
function modal(title,body){document.body.insertAdjacentHTML("beforeend",`<div class="modal-wrap" id="modal"><div class="modal"><div class="row" style="justify-content:space-between"><h2>${title}</h2><button class="btn" onclick="$('#modal').remove()">×</button></div>${body}</div></div>`)}
function clientModal(){modal("Add client",`<div class="form"><div><label>Name</label><input id="cname"></div><div><label>Phone</label><input id="cphone"></div><div><label>Email</label><input id="cemail"></div><div class="full"><label>Notes</label><textarea id="cnotes"></textarea></div><div class="full"><button class="btn primary" onclick="addClient()">Save client</button></div></div>`)}
function addClient(){db.clients.push({id:uid(),name:$("#cname").value,phone:$("#cphone").value,email:$("#cemail").value,notes:$("#cnotes").value,sessions:0,package:"",expiry:""});$("#modal").remove();save()}
function classModal(){modal("Add class",`<div class="form"><div><label>Date</label><input type="date" id="cldate" value="${today()}"></div><div><label>Time</label><input type="time" id="cltime"></div><div><label>Class type</label><input id="cltype" placeholder="Reformer / Lagree / Private"></div><div><label>Instructor</label><input id="clinstructor"></div><div><label>Capacity</label><input type="number" id="clcap" value="10"></div><div><label>Booked</label><input type="number" id="clbooked" value="0"></div><div class="full"><button class="btn primary" onclick="addClass()">Save class</button></div></div>`)}
function addClass(){db.classes.push({id:uid(),date:$("#cldate").value,time:$("#cltime").value,type:$("#cltype").value,instructor:$("#clinstructor").value,capacity:+$("#clcap").value,booked:+$("#clbooked").value});$("#modal").remove();save()}
function membershipModal(){modal("Add membership",`<div class="form"><div><label>Name</label><input id="mname"></div><div><label>Sessions</label><input type="number" id="msessions"></div><div><label>Price</label><input type="number" step=".01" id="mprice"></div><div><label>Validity (days)</label><input type="number" id="mdays" value="30"></div><div class="full"><button class="btn primary" onclick="addMembership()">Save membership</button></div></div>`)}
function addMembership(){db.memberships.push({id:uid(),name:$("#mname").value,sessions:+$("#msessions").value,price:+$("#mprice").value,days:+$("#mdays").value});$("#modal").remove();save()}
function productModal(){modal("Add product",`<div class="form"><div><label>Name</label><input id="pname"></div><div><label>Category</label><input id="pcat" value="Retail"></div><div><label>Cost per unit</label><input type="number" step=".01" id="pcost"></div><div><label>Selling price</label><input type="number" step=".01" id="pprice"></div><div><label>Current stock</label><input type="number" id="pstock" value="0"></div><div><label>Low stock alert</label><input type="number" id="pmin" value="5"></div><div class="full"><button class="btn primary" onclick="addProduct()">Save product</button></div></div>`)}
function addProduct(){db.products.push({id:uid(),name:$("#pname").value,category:$("#pcat").value,cost:+$("#pcost").value,price:+$("#pprice").value,stock:+$("#pstock").value,min:+$("#pmin").value});$("#modal").remove();save()}
function expenseModal(){modal("Add expense",`<div class="form"><div><label>Date</label><input type="date" id="edate" value="${today()}"></div><div><label>Category</label><select id="ecat"><option>Electricity</option><option>Rent</option><option>Water</option><option>Internet</option><option>Cleaning</option><option>Payroll</option><option>Inventory</option><option>Marketing</option><option>Maintenance</option><option>Other</option></select></div><div class="full"><label>Description</label><input id="edesc"></div><div><label>Amount</label><input type="number" step=".01" id="eamount"></div><div><label>Payment method</label><select id="epay"><option>Cash</option><option>Card</option><option>Whish</option><option>Transfer</option></select></div><div class="full"><button class="btn primary" onclick="addExpense()">Save expense</button></div></div>`)}
function addExpense(){db.expenses.push({id:uid(),date:$("#edate").value,category:$("#ecat").value,description:$("#edesc").value,amount:+$("#eamount").value,payment:$("#epay").value});$("#modal").remove();save()}
function stockPurchaseModal(){modal("Record stock purchase",`<div class="form"><div class="full"><label>Product</label><select id="spid">${db.products.map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join("")}</select></div><div><label>Quantity bought</label><input type="number" id="spqty"></div><div><label>Total paid</label><input type="number" step=".01" id="sptotal"></div><div><label>Date</label><input type="date" id="spdate" value="${today()}"></div><div><label>Payment</label><select id="sppay"><option>Cash</option><option>Card</option><option>Whish</option><option>Transfer</option></select></div><div class="full"><button class="btn primary" onclick="recordStockPurchase()">Save purchase</button></div></div>`)}
function recordStockPurchase(){const p=db.products.find(x=>x.id==$("#spid").value),q=+$("#spqty").value,total=+$("#sptotal").value;p.stock+=q;if(q>0)p.cost=total/q;db.expenses.push({id:uid(),date:$("#spdate").value,category:"Inventory",description:`Stock purchase: ${p.name} × ${q}`,amount:total,payment:$("#sppay").value});$("#modal").remove();save()}
function teamModal(){modal("Add team member",`<div class="form"><div><label>Name</label><input id="tname"></div><div><label>Role</label><input id="trole" placeholder="Instructor"></div><div><label>Phone</label><input id="tphone"></div><div><label>Rate / commission</label><input id="trate" placeholder="$20/class or 30%"></div><div class="full"><button class="btn primary" onclick="addTeam()">Save team member</button></div></div>`)}
function addTeam(){db.team.push({id:uid(),name:$("#tname").value,role:$("#trole").value,phone:$("#tphone").value,rate:$("#trate").value});$("#modal").remove();save()}
function addCart(p){cart.push(p);render()}
function checkout(){if(!cart.length)return alert("Add something to the sale first.");const clientId=$("#saleClient").value,payment=$("#payment").value,total=cart.reduce((a,x)=>a+Number(x.price),0);
  cart.forEach(x=>{if(x.kind==="product"){const p=db.products.find(p=>p.id===x.id);if(p&&p.stock>0)p.stock--} if(x.kind==="membership"&&clientId){applyMembership(clientId,x)}})
  db.sales.push({id:uid(),date:new Date().toLocaleString(),clientId,payment,total,items:cart.map(x=>({id:x.id,name:x.name,price:x.price,kind:x.kind}))});cart=[];save();alert("Sale recorded.");
}
function applyMembership(clientId,m){const c=db.clients.find(c=>c.id===clientId);if(!c)return;c.package=m.name;c.sessions=m.sessions;const d=new Date();d.setDate(d.getDate()+Number(m.days));c.expiry=d.toISOString().slice(0,10)}
function sellMembership(clientId){if(!db.memberships.length)return;modal("Add package to client",`<div class="form"><div class="full"><label>Membership</label><select id="smid">${db.memberships.map(m=>`<option value="${m.id}">${esc(m.name)} — ${money(m.price)}</option>`).join("")}</select></div><div><label>Payment</label><select id="smpay"><option>Cash</option><option>Card</option><option>Whish</option><option>Transfer</option></select></div><div class="full"><button class="btn primary" onclick="confirmMembership('${clientId}')">Sell package</button></div></div>`)}
function confirmMembership(clientId){const m=db.memberships.find(x=>x.id==$("#smid").value);applyMembership(clientId,m);db.sales.push({id:uid(),date:new Date().toLocaleString(),clientId,payment:$("#smpay").value,total:m.price,items:[{id:m.id,name:m.name,price:m.price,kind:"membership"}]});$("#modal").remove();save()}
function useSession(id){const c=db.clients.find(c=>c.id===id);if(!c)return;if(c.sessions===999)return alert("Unlimited membership — attendance noted conceptually; session count stays unlimited.");if(c.sessions<=0)return alert("This client has no sessions remaining.");c.sessions--;save()}
function removeItem(key,id){if(confirm("Delete this item?")){db[key]=db[key].filter(x=>x.id!==id);save()}}
function exportData(){const blob=new Blob([JSON.stringify(db,null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="studioflow-backup.json";a.click();URL.revokeObjectURL(a.href)}
function importData(e){const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{db=JSON.parse(r.result);save();alert("Backup restored.")}catch{alert("Invalid backup file.")}};r.readAsText(f)}
function resetAll(){if(confirm("This will erase all StudioFlow data saved in this browser. Continue?")){db=JSON.parse(JSON.stringify(seed));save()}}
render();
