const SUPABASE_URL="https://cwehahuxcupodqklxaal.supabase.co";
const SUPABASE_KEY="sb_publishable_0dVqqdCdDrFgqRfh7E1DvQ_uhJvj1Bh";
const sb=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
const $=s=>document.querySelector(s), money=n=>`$${Number(n||0).toFixed(2)}`, today=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`};
const esc=(s="")=>String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
let db={clients:[],memberships:[],products:[],sales:[],expenses:[],classes:[],team:[],bookings:[],class_levels:[],package_orders:[],notification_settings:[],notification_queue:[],studio_settings:[],announcements:[],promo_codes:[],custom_sections:[],custom_entries:[],audit_log:[],instructor_availability:[],client_payments:[],client_packages:[],class_substitutions:[],client_rewards:[],studio_events:[],guest_profiles:[],guest_bookings:[],client_notes:[],package_freezes:[],payroll_adjustments:[],client_notifications:[]};
let session=null,profile=null,page="dashboard",cart=[],scheduleWeekOffset=0,studioTab="Pilates",selectedSaleClient=null,posPackageTab="Pilates",posPromo=null;
const isOwner=()=>profile?.role==="owner",isInstructor=()=>profile?.role==="instructor",isReceptionist=()=>profile?.role==="receptionist",isClient=()=>profile?.role==="client",isStaff=()=>isOwner()||isInstructor(),isFrontDeskStaff=()=>isInstructor()||isReceptionist();
const sortedMemberships=(arr=db.memberships)=>[...(arr||[])].filter(x=>!x.archived_at).sort((a,b)=>(Number(a.sort_order||0)-Number(b.sort_order||0))||String(a.name||'').localeCompare(String(b.name||'')));
const PHONE_COUNTRIES=[['Lebanon','+961'],['France','+33'],['United Arab Emirates','+971'],['Kuwait','+965'],['Saudi Arabia','+966'],['Qatar','+974'],['Bahrain','+973'],['Jordan','+962'],['Egypt','+20'],['Cyprus','+357'],['Greece','+30'],['Italy','+39'],['Spain','+34'],['Portugal','+351'],['Germany','+49'],['United Kingdom','+44'],['Ireland','+353'],['Switzerland','+41'],['Belgium','+32'],['Netherlands','+31'],['Sweden','+46'],['Norway','+47'],['Denmark','+45'],['Austria','+43'],['United States / Canada','+1'],['Australia','+61'],['New Zealand','+64'],['Turkey','+90'],['Armenia','+374'],['Georgia','+995'],['Iraq','+964'],['Oman','+968'],['Morocco','+212'],['Tunisia','+216'],['Algeria','+213'],['South Africa','+27'],['India','+91'],['Philippines','+63'],['Other','']];
const countryOptions=()=>PHONE_COUNTRIES.map(([n,c])=>`<option value="${c}" ${c==='+961'?'selected':''}>${n}${c?' ('+c+')':''}</option>`).join('');


function authScreen(msg=""){$("#app").innerHTML=`<div class="auth-shell"><div class="auth-card"><div class="auth-brand">CORE THEORY<small>PILATES · MEGACORE</small></div><h2>Sign in</h2><form id="loginForm"><label>Email</label><input id="loginEmail" type="email" required><label>Password</label><input id="loginPassword" type="password" required><button class="btn primary full" type="submit">Sign in</button><div class="auth-error" id="authError">${esc(msg)}</div></form><div class="auth-links"><button class="link-btn" onclick="forgotPassword()">Forgot password?</button><button class="link-btn" onclick="signupScreen()">New client? Create account</button></div></div></div>`;$("#loginForm").onsubmit=login}
async function login(e){e.preventDefault();$("#authError").textContent="Signing in…";const {data,error}=await sb.auth.signInWithPassword({email:$("#loginEmail").value.trim(),password:$("#loginPassword").value});if(error)return $("#authError").textContent=error.message;session=data.session;await loadAll()}
function signupScreen(msg=""){$("#app").innerHTML=`<div class="auth-shell"><div class="auth-card"><div class="auth-brand">CORE THEORY<small>CLIENT ACCOUNT</small></div><h2>Create account</h2><form id="signupForm"><label>Full name</label><input id="suName" required><label>Email</label><input id="suEmail" type="email" required><label>Country / calling code</label><select id="suCountry" required>${countryOptions()}</select><label>Phone number</label><input id="suPhone" type="tel" placeholder="e.g. 70123456" required><small class="muted">Choose your country first. Core Theory saves the full international number.</small><label>Password</label><input id="suPass" type="password" minlength="8" required><button class="btn primary full" type="submit">Create account</button><div class="auth-error" id="authError">${esc(msg)}</div></form><button class="link-btn" onclick="authScreen()">← Back to sign in</button></div></div>`;$("#signupForm").onsubmit=signup}
async function signup(e){e.preventDefault();const code=$("#suCountry").value.trim(),raw=$("#suPhone").value.trim().replace(/^0+/,'').replace(/\s+/g,'');if(!code)return $("#authError").textContent="Please choose a country with a calling code.";if(!raw)return $("#authError").textContent="Phone number is required.";const phone=code+raw;const {error}=await sb.auth.signUp({email:$("#suEmail").value.trim(),password:$("#suPass").value,options:{emailRedirectTo:location.origin,data:{full_name:$("#suName").value.trim(),phone,phone_country_code:code}}});if(error)return $("#authError").textContent=error.message;authScreen("Account created. Check your email to confirm, then sign in.")}
async function forgotPassword(){const email=prompt("Enter your Core Theory email:");if(!email)return;const {error}=await sb.auth.resetPasswordForEmail(email,{redirectTo:location.origin});alert(error?error.message:"Password reset email sent.")}
function setPasswordScreen(){$("#app").innerHTML=`<div class="auth-shell"><div class="auth-card"><div class="auth-brand">CORE THEORY<small>SECURE ACCOUNT</small></div><h2>Create your password</h2><p class="muted">Choose the password you'll use to sign in.</p><form id="pwForm"><label>New password</label><input id="pw1" type="password" minlength="8" required><label>Confirm password</label><input id="pw2" type="password" minlength="8" required><button class="btn primary full" type="submit">Save password</button><div class="auth-error" id="authError"></div></form></div></div>`;$("#pwForm").onsubmit=savePassword}
async function savePassword(e){e.preventDefault();if($("#pw1").value!==$("#pw2").value)return $("#authError").textContent="Passwords do not match.";const {error}=await sb.auth.updateUser({password:$("#pw1").value});if(error)return $("#authError").textContent=error.message;history.replaceState({},document.title,location.pathname);await loadAll()}
async function logout(){await sb.auth.signOut();session=null;profile=null;authScreen()}

async function ensureForeverClasses(){
  if(!session?.user)return;
  try{await sb.rpc('ensure_recurring_classes')}catch(e){}
}

async function loadAll(){
  await ensureForeverClasses();if(!session)return authScreen();$("#app").innerHTML='<div class="loading">Loading Core Theory…</div>';let pr=await sb.from("profiles").select("*").eq("id",session.user.id).maybeSingle();if(pr.error)return authScreen("Profile error: "+pr.error.message);profile=pr.data;if(!profile)return authScreen("This account does not have a Core Theory profile yet.");if(isClient()){await sb.rpc("ensure_client_record");await sb.rpc("issue_my_birthday_reward");}if(isOwner()){await sb.rpc('process_today_birthdays');}const tables=isOwner()?['clients','memberships','products','sales','expenses','classes','team','bookings','class_levels','package_orders','notification_settings','notification_queue','studio_settings','announcements','promo_codes','custom_sections','custom_entries','audit_log','instructor_availability','client_packages','class_substitutions','client_rewards','studio_events','guest_profiles','guest_bookings','client_notes','package_freezes','payroll_adjustments','client_notifications']:isInstructor()?['classes','bookings','class_levels','announcements','studio_events','client_notes']:isReceptionist()?[]:['clients','memberships','classes','bookings','class_levels','package_orders','announcements','client_packages','client_rewards','studio_events','client_notifications'];db={clients:[],memberships:[],products:[],sales:[],expenses:[],classes:[],team:[],bookings:[],class_levels:[],package_orders:[],notification_settings:[],notification_queue:[],studio_settings:[],announcements:[],promo_codes:[],custom_sections:[],custom_entries:[],audit_log:[],instructor_availability:[],client_payments:[],client_packages:[],class_substitutions:[],client_rewards:[],studio_events:[],guest_profiles:[],guest_bookings:[],client_notes:[],package_freezes:[],payroll_adjustments:[],client_notifications:[],roster:[],guestRoster:[]};const rs=await Promise.all(tables.map(t=>sb.from(t).select("*")));const bad=rs.find(x=>x.error);if(bad)return authScreen("Database error: "+bad.error.message);tables.forEach((t,i)=>db[t]=rs[i].data||[]);if(isClient()){const cp=await sb.rpc('client_payment_history');if(!cp.error)db.client_payments=cp.data||[]}if(isInstructor()){const [rr,mc,gr]=await Promise.all([sb.rpc('my_instructor_roster'),sb.rpc('my_instructor_classes'),sb.rpc('my_instructor_guest_roster')]);if(rr.error)return authScreen('Schedule access error: '+rr.error.message);if(mc.error)return authScreen('Schedule access error: '+mc.error.message);db.roster=rr.data||[];db.classes=mc.data||[];db.guestRoster=gr.error?[]:(gr.data||[]);}if(isFrontDeskStaff()){const fd=await sb.rpc('is_front_desk_on_duty');db.frontDeskDuty=fd.data===true;if(db.frontDeskDuty){const [fr,fm,fp,fc]=await Promise.all([sb.rpc('front_desk_today'),sb.rpc('front_desk_memberships_v2'),sb.rpc('front_desk_products'),sb.rpc('front_desk_booking_classes',{p_days:14})]);if(!fr.error)db.frontDeskToday=fr.data||[];if(!fm.error)db.frontDeskMemberships=fm.data||[];if(!fp.error)db.frontDeskProducts=fp.data||[];if(!fc.error)db.frontDeskBookingClasses=fc.data||[];}}if(isInstructor()){const allowed=['instructorhome','schedule','account',...(db.frontDeskDuty?['frontdesk','pos']:[])];if(!allowed.includes(page))page='instructorhome';}if(isReceptionist()){const allowed=['account',...(db.frontDeskDuty?['frontdesk','pos']:[])];if(!allowed.includes(page))page=db.frontDeskDuty?'frontdesk':'account';}if(isClient()&&!['clienthome','book','mybookings','packages','clientaccount'].includes(page))page='clienthome';render()}
function nav(){const pages=isOwner()?['dashboard','clients','schedule','pos','memberships','inventory','expenses','finance','team','operations','settings']:isInstructor()?['instructorhome','schedule',...(db.frontDeskDuty?['frontdesk','pos']:[]),'account']:isReceptionist()?[...(db.frontDeskDuty?['frontdesk','pos']:[]),'account']:['clienthome','book','mybookings','packages','clientaccount'];const labels={dashboard:'⌂ Dashboard',instructorhome:'⌂ Home',clienthome:'⌂ Home',clients:'◎ Clients',schedule:'□ Schedule',pos:'$ POS / Sales',memberships:'◇ Memberships',inventory:'▣ Inventory',expenses:'− Expenses',finance:'↗ Finance',team:'◌ Team',operations:'✦ Operations',settings:'⚙ Settings',payment:'$ Record Payment',frontdesk:'$ Front Desk',account:'⚙ Account',book:'□ Book a Class',mybookings:'✓ My Bookings',packages:'◇ Packages',clientaccount:'◎ My Account'};return pages.map(x=>`<button data-page="${x}" class="${page===x?'active':''}">${labels[x]}</button>`).join('')+(isOwner()?db.custom_sections.filter(x=>x.visible_owner!==false).sort((a,b)=>(a.sort_order||0)-(b.sort_order||0)).map(x=>`<button data-custom="${x.id}" class="${page==='custom:'+x.id?'active':''}">${esc(x.icon||'•')} ${esc(x.name)}</button>`).join(''):'')}
function activeAnnouncementBanners(){const target=isClient()?'Clients':(isInstructor()||isReceptionist())?'Instructors':'Everyone';return (db.announcements||[]).filter(a=>a.active!==false&&(isOwner()||a.audience==='Everyone'||a.audience===target)).map(a=>`<div class="notice card" style="margin-bottom:12px"><b>${esc(a.title)}</b><p>${esc(a.message)}</p></div>`).join('')}
function layout(content,title,subtitle=''){const role=isOwner()?'Owner':isInstructor()?'Instructor':isReceptionist()?'Receptionist':'Client';$("#app").innerHTML=`<div class="app"><aside class="sidebar"><div class="brand">CORE THEORY<small>${role} Portal</small></div><div class="nav">${nav()}</div><div class="role-chip">${esc(profile?.full_name||profile?.email||'')}<small>${role}</small></div><button class="btn logout" onclick="logout()">Log out</button></aside><main class="main"><div class="topbar"><div><h1>${title}</h1><p>${subtitle}</p><div class="sync-note">☁ Cloud connected</div></div><button class="btn" onclick="loadAll()">Refresh</button></div>${activeAnnouncementBanners()}${content}</main></div>`;document.querySelectorAll('[data-page]').forEach(b=>b.onclick=()=>{page=b.dataset.page;render()});document.querySelectorAll('[data-custom]').forEach(b=>b.onclick=()=>{page='custom:'+b.dataset.custom;render()})}
function render(){if(page.startsWith('custom:'))return customSectionPage(page.split(':')[1]);const f={dashboard,instructorhome,clienthome,clients,schedule,pos,memberships,inventory,expenses,finance,team,operations,settings,payment,frontdesk,account,book,mybookings,packages,clientaccount}[page];(f||schedule)()}

const bookingCount=id=>db.bookings.filter(b=>String(b.class_id)===String(id)&&!['cancelled'].includes(b.status)).length;
const activeBookings=id=>db.bookings.filter(b=>String(b.class_id)===String(id)&&b.status!=='cancelled');
function dashboard(){const rev=db.sales.filter(s=>!s.voided_at).reduce((a,s)=>a+Number(s.total||0),0),exp=db.expenses.reduce((a,e)=>a+Number(e.amount||0),0);layout(`<div class="grid kpis"><div class="card kpi"><div class="label">Revenue</div><div class="value">${money(rev)}</div></div><div class="card kpi"><div class="label">Expenses</div><div class="value">${money(exp)}</div></div><div class="card kpi"><div class="label">Estimated profit</div><div class="value">${money(rev-exp)}</div></div><div class="card kpi"><div class="label">Clients</div><div class="value">${db.clients.length}</div></div></div><div class="spacer"></div><div class="card"><h3>Today's classes</h3>${db.classes.filter(c=>c.class_date===today()).map(classCard).join('')||'<div class="empty">No classes today.</div>'}</div>`,`Dashboard`,`Your studio at a glance`)}
function clients(){layout(`<div class="card">${isOwner()?'<div class="toolbar"><button class="btn primary" onclick="clientModal()">+ Add client</button></div>':''}${db.clients.length?`<table><thead><tr><th>Client</th><th>Phone</th><th>Package</th><th>Sessions</th><th>Expiry</th>${isOwner()?'<th></th>':''}</tr></thead><tbody>${db.clients.map(c=>`<tr><td><b>${esc(c.name)}</b><div class="muted">${esc(c.email||'')}</div></td><td>${esc(c.phone||'')}</td><td>${esc(c.package||'—')}</td><td>${c.sessions??0}</td><td>${esc(c.expiry||'—')}</td>${isOwner()?`<td><button class="btn small" onclick="clientHistory('${c.id}')">History</button> <button class="btn small" onclick="clientModal('${c.id}')">Edit</button> <button class="btn small" onclick="sellMembership('${c.id}')">Add package</button> <button class="btn small danger" onclick="deleteClient('${c.id}')">Delete</button></td>`:''}</tr>`).join('')}</tbody></table>`:'<div class="empty">No clients yet.</div>'}</div>`,`Clients`,isOwner()?'Packages, attendance and payment history':'Client details and package balances')}
function clientHistory(id){const c=db.clients.find(x=>String(x.id)===String(id)),bs=db.bookings.filter(b=>String(b.client_id)===String(id));modal(`${esc(c?.name||'Client')} history`,`<p><b>Package:</b> ${esc(c?.package||'—')} · <b>Sessions:</b> ${c?.sessions??0} · <b>Expiry:</b> ${esc(c?.expiry||'—')}</p><h3>Attendance / bookings</h3>${bs.map(b=>{const cl=db.classes.find(x=>String(x.id)===String(b.class_id));return `<div class="cart-row"><span>${esc(cl?.class_date||'')} · ${esc(cl?.class_type||'Class')}</span><span class="badge">${esc(b.status)}</span></div>`}).join('')||'<div class="empty">No booking history.</div>'}`)}

function mondayOfWeek(offset=0){const d=new Date(),day=(d.getDay()+6)%7;d.setHours(12,0,0,0);d.setDate(d.getDate()-day+offset*7);return d}const dateISO=d=>d.toISOString().slice(0,10);function formatTime(t){const [h,m]=t.split(':').map(Number);return `${h%12||12}:${String(m).padStart(2,'0')} ${h>=12?'PM':'AM'}`}
function levelColor(level){return db.class_levels.find(x=>x.name===level)?.color||'#eee8df'}
function schedule(){const mon=mondayOfWeek(scheduleWeekOffset),days=[];for(let i=0;i<6;i++){const d=new Date(mon);d.setDate(mon.getDate()+i);days.push(d)}layout(`<div class="schedule-tabs"><button class="tab ${studioTab==='Pilates'?'active':''}" onclick="studioTab='Pilates';schedule()">PILATES</button><button class="tab ${studioTab==='Megacore'?'active':''}" onclick="studioTab='Megacore';schedule()">MEGACORE</button></div><div class="schedule-tools"><div class="toolbar">${isOwner()?'<button class="btn primary" onclick="classModal()">+ Add class</button>':''}<button class="btn" onclick="scheduleWeekOffset--;schedule()">← Previous</button><button class="btn" onclick="scheduleWeekOffset=0;schedule()">This week</button><button class="btn" onclick="scheduleWeekOffset++;schedule()">Next →</button></div></div>${scheduleTable(days,studioTab)}`,`Schedule`,`${studioTab} weekly timetable — same times stay on the same row`)}
function scheduleTable(days,type){const dates=new Set(days.map(dateISO)),cs=db.classes.filter(c=>dates.has(c.class_date)&&(c.studio_type||'Pilates')===type),times=[...new Set(cs.map(c=>(c.class_time||'').slice(0,5)).filter(Boolean))].sort();if(!times.length)for(let h=7;h<=20;h++)times.push(String(h).padStart(2,'0')+':00');return `<div class="card schedule-wrap"><table class="weekly-schedule"><thead><tr><th class="time-col">Time</th>${days.map(d=>`<th>${d.toLocaleDateString(undefined,{weekday:'long'})}<small>${d.toLocaleDateString(undefined,{month:'short',day:'numeric'})}</small></th>`).join('')}</tr></thead><tbody>${times.map(t=>`<tr><th class="time-col">${formatTime(t)}</th>${days.map(d=>`<td class="schedule-cell">${cs.filter(c=>c.class_date===dateISO(d)&&(c.class_time||'').slice(0,5)===t).map(classCard).join('')}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`}
function classCard(c){const n=bookingCount(c.id);return `<div class="class-card" style="--level:${levelColor(c.level)}" onclick="openClass('${c.id}')"><b>${esc(c.class_type||'Class')}</b><span>${esc(c.level||'Open Level')} · ${esc(c.instructor||'No instructor')}</span><small>${formatTime((c.class_time||'00:00').slice(0,5))} · ${n}/${c.capacity||0} booked</small></div>`}
function openClass(id){const c=db.classes.find(x=>String(x.id)===String(id));if(!c)return;const bs=activeBookings(id);const rows=bs.map(b=>{const roster=db.roster?.find(r=>String(r.booking_id)===String(b.id));const cl=isOwner()?db.clients.find(x=>String(x.id)===String(b.client_id)):null;const clientName=cl?.name||roster?.client_name||'Client';return `<div class="booking-person"><span><b>${esc(clientName)}</b><small>${esc(b.status)} · ${b.payment_status==='pending'?'<b>Payment Pending</b>':esc(b.payment_status||'paid')}</small></span>${isStaff()?`<span>${b.status==='booked'?`<button class="btn small" onclick="checkIn('${b.id}')">Check in</button>`:''}<button class="btn small" onclick="setBookingStatus('${b.id}','no_show')">No-show</button></span>`:''}</div>`}).join('');modal(`${esc(c.class_type)} · ${formatTime((c.class_time||'00:00').slice(0,5))}`,`<p><span class="badge" style="background:${levelColor(c.level)}">${esc(c.level||'Open Level')}</span> ${esc(c.studio_type||'Pilates')} · ${esc(c.instructor||'')}</p><h3>Bookings ${bs.length}/${c.capacity||0}</h3>${rows||'<div class="empty">No bookings yet.</div>'}${isOwner()?`<button class="btn primary" onclick="addBookingModal('${c.id}')">+ Add client</button> <button class="btn" onclick="$('#modal').remove();editClassModal('${c.id}')">Edit class</button>`:''}`)}
function addBookingModal(classId){const booked=new Set(activeBookings(classId).map(b=>String(b.client_id)));modal('Add client to class',`<div class="form"><div class="full"><label>Client</label><select id="bkclient">${db.clients.filter(c=>!booked.has(String(c.id))).map(c=>`<option value="${c.id}">${esc(c.name)} · ${c.sessions??0} sessions</option>`).join('')}</select></div><div class="full"><button class="btn primary" onclick="staffBook('${classId}')">Add booking</button></div></div>`)}
async function staffBook(classId){const clientId=$("#bkclient").value;if(!clientId)return;const {data,error}=await sb.rpc('staff_book_client',{p_class_id:String(classId),p_client_id:String(clientId)});if(error)return alert(error.message);$("#modal").remove();await loadAll();alert(data?.payment_status==='pending'?(data?.status==='waitlist'?'Client added to waitlist. Payment is pending.':'Client booked. Payment is pending because there is no valid session/package.'):(data?.status==='waitlist'?'Client added to waitlist.':'Client booked using their valid package.'));openClass(classId)}
async function checkIn(bookingId){const b=db.bookings.find(x=>String(x.id)===String(bookingId));const pending=b?.payment_status==='pending';const {error}=await sb.rpc('check_in_booking',{p_booking_id:bookingId});if(error)return alert(error.message);await loadAll();alert(pending?'Attendance marked. Payment is still pending; the session will be deducted automatically after payment.':'Checked in. Session deducted.')}
async function setBookingStatus(id,status){if(status!=='no_show')return;const {error}=await sb.rpc('mark_booking_no_show',{p_booking_id:id});if(error)return alert(error.message);$("#modal")?.remove();await loadAll();alert('Marked as no-show.')}

function classModal(){modal('Add class',classForm())}function classForm(c={}){return `<div class="form"><div><label>Date</label><input type="date" id="cldate" value="${c.class_date||today()}"></div><div><label>Time</label><input type="time" id="cltime" value="${(c.class_time||'').slice(0,5)}"></div><div><label>Studio</label><select id="clstudio"><option ${c.studio_type==='Pilates'?'selected':''}>Pilates</option><option ${c.studio_type==='Megacore'?'selected':''}>Megacore</option></select></div><div><label>Level</label><select id="cllevel">${db.class_levels.map(l=>`<option ${c.level===l.name?'selected':''}>${esc(l.name)}</option>`).join('')}</select></div><div><label>Class name</label><input id="cltype" value="${esc(c.class_type||'')}" placeholder="Rise & Shine"></div><div><label>Instructor</label><select id="clinstructor">${db.team.filter(t=>t.role==='Instructor'&&t.auth_user_id).map(t=>`<option value="${t.auth_user_id}" data-name="${esc(t.name)}" ${String(c.instructor_user_id||'')===String(t.auth_user_id)?'selected':''}>${esc(t.name)}</option>`).join('')}<option value="" ${!c.instructor_user_id?'selected':''}>Unassigned</option></select></div><div><label>Capacity</label><input type="number" id="clcap" value="${c.capacity||10}"></div>${!c.id?'<div><label>Repeat weekly</label><select id="clrepeat"><option value="1">No</option><option value="4">4 weeks</option><option value="8">8 weeks</option><option value="12">12 weeks</option></select></div>':''}<div class="full"><button class="btn primary" onclick="${c.id?`saveClass('${c.id}')`:'addClass()'}">Save</button>${c.id?` <button class="btn danger" onclick="deleteClass('${c.id}')">Delete</button>`:''}</div></div>`}
async function addClass(){
  const date=$("#cldate")?.value,time=$("#cltime")?.value,name=$("#cltype")?.value.trim();
  if(!date||!time||!name)return alert('Date, time and class name are required.');

  const mode=$("#clrepeatmode")?.value||'single';
  const base=new Date(date+'T12:00:00');
  const group=crypto.randomUUID();

  const instructor=$("#clinstructor");
  const common={
    class_type:name,
    instructor:instructor.selectedOptions[0]?.dataset.name||'',
    instructor_user_id:instructor.value||null,
    capacity:+$("#clcap").value||10,
    studio_type:$("#clstudio").value,
    level:$("#cllevel").value
  };

  const foreverWeekly = mode==='weekly' && ($("#clweeklyweeks")?.value==='forever');
  const foreverDays = mode==='days' && ($("#cldaysweeks")?.value==='forever');

  if(foreverWeekly || foreverDays){
    let patternRows=[];
    if(foreverWeekly){
      patternRows=[{day:base.getDay(),time}];
    }else{
      patternRows=[...document.querySelectorAll('.cldaycheck:checked')].map(cb=>({
        day:Number(cb.dataset.day),
        time:document.getElementById(`cldaytime_${cb.dataset.day}`)?.value
      })).filter(x=>x.time);
      if(!patternRows.length)return alert('Choose at least one day.');
    }

    const {data,error}=await sb.rpc('create_recurring_class_series',{
      p_start_date:date,
      p_class_type:common.class_type,
      p_instructor:common.instructor,
      p_instructor_user_id:common.instructor_user_id,
      p_capacity:common.capacity,
      p_studio_type:common.studio_type,
      p_level:common.level,
      p_pattern:patternRows
    });

    if(error)return alert(error.message);

    $("#modal").remove();
    await loadAll();
    alert(`Recurring class series created. ${data?.created_now||0} upcoming classes were added and it will keep generating automatically.`);
    return;
  }

  let instances=[];

  try{
    if(mode==='single'){
      instances=[{date,time}];
    }else if(mode==='weekly'){
      const weeks=Math.max(1,Number($("#clweeklyweeks")?.value||4));
      for(let i=0;i<weeks;i++){
        const d=new Date(base);
        d.setDate(base.getDate()+7*i);
        instances.push({date:dateISO(d),time});
      }
    }else{
      instances=selectedClassDayRows(base);
    }
  }catch(e){
    return alert(e.message);
  }

  const rows=instances.map(x=>({...common,class_date:x.date,class_time:x.time,recurring_group:instances.length>1?group:null}));

  const conflicts=rows.filter(r=>db.classes.some(c=>
    !c.cancelled &&
    c.class_date===r.class_date &&
    String(c.class_time||'').slice(0,5)===String(r.class_time).slice(0,5) &&
    (c.studio_type||'Pilates')===r.studio_type
  ));

  if(conflicts.length){
    const sample=conflicts.slice(0,3).map(r=>`${r.class_date} ${formatTime(String(r.class_time).slice(0,5))}`).join(', ');
    if(!confirm(`${conflicts.length} selected time slot${conflicts.length===1?' already has':'s already have'} a ${common.studio_type} class (${sample}${conflicts.length>3?'…':''}). Add anyway?`))return;
  }

  const {error}=await sb.from('classes').insert(rows);
  if(error)return alert(error.message);

  $("#modal").remove();
  await loadAll();
  alert(rows.length===1?'Class added.':`${rows.length} classes added.`);
}

function applyRecurringClassStyles(){
  if(document.getElementById('coreTheoryRecurringClassStyles'))return;
  const s=document.createElement('style');
  s.id='coreTheoryRecurringClassStyles';
  s.textContent=`
    .repeat-day-list{display:grid;gap:8px;margin-top:8px}
    .repeat-day-row{
      display:grid;
      grid-template-columns:minmax(120px,1fr) 130px;
      gap:10px;
      align-items:center;
      padding:8px 10px;
      border:1px solid rgba(0,0,0,.08);
      border-radius:10px;
      background:rgba(255,255,255,.55);
    }
    .repeat-day-check{
      display:flex;
      align-items:center;
      gap:8px;
      margin:0;
      font-weight:600;
    }
    .repeat-day-check input{width:auto}
    @media(max-width:520px){
      .repeat-day-row{grid-template-columns:1fr 118px}
    }
  `;
  document.head.appendChild(s);
}


function applyPosPromoStyles(){
  if(document.getElementById('coreTheoryPosPromoStyles'))return;
  const s=document.createElement('style');
  s.id='coreTheoryPosPromoStyles';
  s.textContent=`
    .pos-promo-box{
      margin-top:16px;
      padding-top:14px;
      border-top:1px solid rgba(0,0,0,.08);
    }
    .pos-promo-row{
      display:grid;
      grid-template-columns:1fr auto;
      gap:8px;
      align-items:center;
    }
    .pos-promo-row input{
      text-transform:uppercase;
    }
    .promo-success{
      margin-top:8px;
      padding:9px 11px;
      border-radius:9px;
      background:rgba(114,47,55,.08);
      color:#722F37;
      font-weight:600;
      font-size:13px;
    }
    .pos-total-lines{
      margin-top:16px;
      padding-top:12px;
      border-top:1px solid rgba(0,0,0,.08);
      display:grid;
      gap:7px;
    }
    .pos-total-lines>div,.pos-grand-total{
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:14px;
    }
    .promo-discount{
      color:#722F37;
    }
    .pos-grand-total{
      margin:8px 0 14px;
    }
    .pos-grand-total h2{
      margin:0;
    }
    @media(max-width:520px){
      .pos-promo-row{grid-template-columns:1fr}
      .pos-promo-row .btn{width:100%}
    }
  `;
  document.head.appendChild(s);
}

function applyMobileButtonColorFix(){
  if(document.getElementById('coreTheoryMobileColorFix'))return;
  const s=document.createElement('style');s.id='coreTheoryMobileColorFix';
  s.textContent=`
    button,.btn,.tab,.schedule-tabs button,.schedule-tools button,.topbar button,.logout,.link-btn{
      color:#333 !important;-webkit-text-fill-color:#333 !important;
    }
    button:disabled,.btn:disabled,.tab:disabled{color:#777 !important;-webkit-text-fill-color:#777 !important;}
    .btn.primary,.nav button.active,.tab.active{
      color:#fff !important;-webkit-text-fill-color:#fff !important;
    }
    .nav button,.nav .nav-item,.sidebar .nav button{
      color:#fff !important;-webkit-text-fill-color:#fff !important;
    }
    .nav button.active,.sidebar .nav button.active{
      color:#fff !important;-webkit-text-fill-color:#fff !important;
    }
    .btn.danger{color:#722F37 !important;-webkit-text-fill-color:#722F37 !important;}
    @media(max-width:760px){
      input,select,textarea,button{font-size:16px}
      .schedule-tabs .tab:not(.active),.schedule-tools .btn,.topbar .btn,.logout{
        color:#333 !important;-webkit-text-fill-color:#333 !important;
      }
      .sidebar .nav button,.sidebar .nav .nav-item{
        color:#fff !important;-webkit-text-fill-color:#fff !important;
      }
    }`;
  document.head.appendChild(s);
}

applyMobileButtonColorFix();
applyClickableAlertStyle();
applyPackageClarityStyle();
applyPackageFlowStyle();
applyPWAStyles();
applyMobileDrawerNav();
applyRecurringClassStyles();
applyPosPromoStyles();
init();
