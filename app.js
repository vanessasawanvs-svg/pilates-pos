const SUPABASE_URL="https://cwehahuxcupodqklxaal.supabase.co";
const SUPABASE_KEY="sb_publishable_0dVqqdCdDrFgqRfh7E1DvQ_uhJvj1Bh";
const sb=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
const $=s=>document.querySelector(s), money=n=>`$${Number(n||0).toFixed(2)}`, today=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`};
const esc=(s="")=>String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
let db={clients:[],memberships:[],products:[],sales:[],expenses:[],classes:[],team:[],bookings:[],class_levels:[],package_orders:[],notification_settings:[],notification_queue:[],studio_settings:[],announcements:[],promo_codes:[],custom_sections:[],custom_entries:[],audit_log:[],instructor_availability:[],instructor_class_slots:[],client_payments:[],client_packages:[],class_substitutions:[],client_rewards:[],studio_events:[],guest_profiles:[],guest_bookings:[],client_notes:[],package_freezes:[],payroll_adjustments:[],client_notifications:[]};
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

async function loadAll(){
if(!session)return authScreen();$("#app").innerHTML='<div class="loading">Loading Core Theory…</div>';let pr=await sb.from("profiles").select("*").eq("id",session.user.id).maybeSingle();if(pr.error)return authScreen("Profile error: "+pr.error.message);profile=pr.data;if(!profile)return authScreen("This account does not have a Core Theory profile yet.");if(isClient()){await sb.rpc("ensure_client_record");await sb.rpc("issue_my_birthday_reward");}if(isOwner()){await sb.rpc('process_today_birthdays');}const tables=isOwner()?['clients','memberships','products','sales','expenses','classes','team','bookings','class_levels','package_orders','notification_settings','notification_queue','studio_settings','announcements','promo_codes','custom_sections','custom_entries','audit_log','instructor_availability','instructor_class_slots','client_packages','class_substitutions','client_rewards','studio_events','guest_profiles','guest_bookings','client_notes','package_freezes','payroll_adjustments','client_notifications']:isInstructor()?['classes','bookings','class_levels','announcements','studio_events','client_notes']:isReceptionist()?[]:['clients','memberships','classes','bookings','class_levels','package_orders','announcements','client_packages','client_rewards','studio_events','client_notifications'];db={clients:[],memberships:[],products:[],sales:[],expenses:[],classes:[],team:[],bookings:[],class_levels:[],package_orders:[],notification_settings:[],notification_queue:[],studio_settings:[],announcements:[],promo_codes:[],custom_sections:[],custom_entries:[],audit_log:[],instructor_availability:[],instructor_class_slots:[],client_payments:[],client_packages:[],class_substitutions:[],client_rewards:[],studio_events:[],guest_profiles:[],guest_bookings:[],client_notes:[],package_freezes:[],payroll_adjustments:[],client_notifications:[],roster:[],guestRoster:[]};const rs=await Promise.all(tables.map(t=>sb.from(t).select("*")));const bad=rs.find(x=>x.error);if(bad)return authScreen("Database error: "+bad.error.message);tables.forEach((t,i)=>db[t]=rs[i].data||[]);if(isClient()){const cp=await sb.rpc('client_payment_history');if(!cp.error)db.client_payments=cp.data||[]}if(isInstructor()){const [rr,mc,gr]=await Promise.all([sb.rpc('my_instructor_roster'),sb.rpc('my_instructor_classes'),sb.rpc('my_instructor_guest_roster')]);if(rr.error)return authScreen('Schedule access error: '+rr.error.message);if(mc.error)return authScreen('Schedule access error: '+mc.error.message);db.roster=rr.data||[];db.classes=mc.data||[];db.guestRoster=gr.error?[]:(gr.data||[]);}if(isFrontDeskStaff()){const fd=await sb.rpc('is_front_desk_on_duty');db.frontDeskDuty=fd.data===true;if(db.frontDeskDuty){const [fr,fm,fp,fc]=await Promise.all([sb.rpc('front_desk_today'),sb.rpc('front_desk_memberships_v2'),sb.rpc('front_desk_products'),sb.rpc('front_desk_booking_classes',{p_days:14})]);if(!fr.error)db.frontDeskToday=fr.data||[];if(!fm.error)db.frontDeskMemberships=fm.data||[];if(!fp.error)db.frontDeskProducts=fp.data||[];if(!fc.error)db.frontDeskBookingClasses=fc.data||[];}}if(isInstructor()){const allowed=['instructorhome','schedule','account',...(db.frontDeskDuty?['frontdesk','pos']:[])];if(!allowed.includes(page))page='instructorhome';}if(isReceptionist()){const allowed=['account',...(db.frontDeskDuty?['frontdesk','pos']:[])];if(!allowed.includes(page))page=db.frontDeskDuty?'frontdesk':'account';}if(isClient()&&!['clienthome','book','mybookings','packages','clientaccount'].includes(page))page='clienthome';render()}
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
async function addClass(){const repeats=+$("#clrepeat").value,base=new Date($("#cldate").value+'T12:00:00'),group=crypto.randomUUID(),rows=[];for(let i=0;i<repeats;i++){const d=new Date(base);d.setDate(base.getDate()+7*i);rows.push({class_date:dateISO(d),class_time:$("#cltime").value,class_type:$("#cltype").value,instructor:$("#clinstructor").selectedOptions[0]?.dataset.name||'',instructor_user_id:$("#clinstructor").value||null,capacity:+$("#clcap").value,studio_type:$("#clstudio").value,level:$("#cllevel").value,recurring_group:repeats>1?group:null})}const {error}=await sb.from('classes').insert(rows);if(error)return alert(error.message);$("#modal").remove();await loadAll()}
function editClassModal(id){const c=db.classes.find(x=>String(x.id)===String(id));modal('Edit class',classForm(c))}async function saveClass(id){const {error}=await sb.from('classes').update({class_date:$("#cldate").value,class_time:$("#cltime").value,class_type:$("#cltype").value,instructor:$("#clinstructor").selectedOptions[0]?.dataset.name||'',instructor_user_id:$("#clinstructor").value||null,capacity:+$("#clcap").value,studio_type:$("#clstudio").value,level:$("#cllevel").value}).eq('id',id);if(error)return alert(error.message);$("#modal").remove();await loadAll()}async function deleteClass(id){if(!confirm('Cancel this class? Existing bookings will be cancelled without session deductions.'))return;const {error}=await sb.rpc('cancel_class_safely',{p_class_id:String(id)});if(error)return alert(error.message);$("#modal")?.remove();await loadAll();alert('Class cancelled safely.')}

function book(){const days=[];for(let i=0;i<14;i++){const d=new Date();d.setDate(d.getDate()+i);days.push(d)}const cs=db.classes.filter(c=>days.map(dateISO).includes(c.class_date)&&!c.cancelled);layout(`<div class="schedule-tabs"><button class="tab ${studioTab==='Pilates'?'active':''}" onclick="studioTab='Pilates';book()">PILATES</button><button class="tab ${studioTab==='Megacore'?'active':''}" onclick="studioTab='Megacore';book()">MEGACORE</button></div><div class="client-class-grid">${cs.filter(c=>(c.studio_type||'Pilates')===studioTab).sort((a,b)=>(a.class_date+a.class_time).localeCompare(b.class_date+b.class_time)).map(c=>{const n=bookingCount(c.id),full=n>=Number(c.capacity||0);return `<div class="card client-class"><div class="date">${new Date(c.class_date+'T12:00').toLocaleDateString(undefined,{weekday:'short',month:'short',day:'numeric'})}</div><h3>${esc(c.class_type)}</h3><span class="badge" style="background:${levelColor(c.level)}">${esc(c.level||'Open Level')}</span><p>${formatTime((c.class_time||'00:00').slice(0,5))} · ${esc(c.instructor||'')}</p><p class="muted">${Math.max(0,Number(c.capacity||0)-n)} spots remaining</p><button class="btn primary" ${full?'disabled':''} onclick="clientBook('${c.id}')">${full?'Full':'Book'}</button></div>`}).join('')||'<div class="empty">No upcoming classes.</div>'}</div>`,`Book a Class`,`Choose Pilates or Megacore and reserve your spot`)}

function frontdesk(){
  if(!isInstructor()||!db.frontDeskDuty)return account();
  const rows=(db.frontDeskToday||[]);
  const byClass={};
  rows.forEach(r=>{const k=r.class_id; if(!byClass[k])byClass[k]={name:r.class_name,time:r.class_time,instructor:r.instructor_name,rows:[]};byClass[k].rows.push(r)});
  const html=Object.values(byClass).map(g=>`<div class="card"><h3>${esc(g.name)} · ${g.time?formatTime(String(g.time).slice(0,5)):''}</h3><p class="muted">${esc(g.instructor||'')}</p>${g.rows.map(r=>`<div class="booking-person"><span><b>${esc(r.client_name)}</b><small>${esc(r.booking_status)} · ${r.payment_status==='pending'?'<b>Payment Pending</b>':'Paid'}${r.membership_name?' · '+esc(r.membership_name):''}${r.coupon_code?` · Coupon ${esc(r.coupon_code)} (${r.discount_percent||0}% off)`:''}</small></span><span>${r.payment_status==='pending'&&r.package_order_id?`<button class="btn small primary" onclick="frontDeskPayment('${r.package_order_id}')">Collect payment</button>`:''}</span></div>`).join('')}</div>`).join('');
  layout(`<div class="notice card"><b>Front Desk Duty is active for today.</b><p>You can collect payments for any client in today's classes. Finance totals, expenses, payroll and the full Clients list remain private.</p></div>${html||'<div class="card empty">No bookings today.</div>'}`,'Front Desk',"Today's studio billing");
}
function frontDeskPayment(orderId){
  const r=(db.frontDeskToday||[]).find(x=>String(x.package_order_id)===String(orderId));
  const opts=(db.frontDeskMemberships||[]).map(m=>`<option value="${m.id}" ${String(m.id)===String(r?.membership_id)?'selected':''}>${esc(m.name)} — ${money(m.price)}</option>`).join('');
  modal('Collect payment',`<p><b>${esc(r?.client_name||'Client')}</b></p><label>Package / session</label><select id="fdMembership">${opts}</select><button class="btn" onclick="changeFrontDeskPackage('${orderId}')">Change pending package</button><label>Payment method</label><select id="fdMethod"><option>Cash</option><option>Card</option><option>Whish</option><option>Transfer</option></select><div class="toolbar"><button class="btn primary" id="fdPayBtn" onclick="settleFrontDeskOrder('${orderId}')">Confirm payment</button><button class="btn danger" onclick="cancelFrontDeskOrder('${orderId}')">Cancel pending order</button></div><p class="muted">If attendance was already marked, the session will be deducted automatically after payment.</p>`);
}
async function changeFrontDeskPackage(orderId){const id=$("#fdMembership")?.value;if(!id)return;const {error}=await sb.rpc('change_pending_package_order',{p_order_id:orderId,p_membership_id:id});if(error)return alert(error.message);$("#modal")?.remove();await loadAll();alert('Pending package changed. No payment was recorded.')}
async function settleFrontDeskOrder(orderId){const btn=$("#fdPayBtn");if(btn){btn.disabled=true;btn.textContent='Processing…'}const method=$("#fdMethod")?.value||'Cash';const {error}=await sb.rpc('settle_package_order',{p_order_id:orderId,p_payment_method:method});if(error){if(btn){btn.disabled=false;btn.textContent='Confirm payment'}return alert(error.message)}$("#modal")?.remove();await loadAll();alert('Payment recorded and package activated.')}
async function cancelFrontDeskOrder(orderId){if(!confirm('Cancel this pending package order?'))return;const {error}=await sb.rpc('cancel_package_order',{p_order_id:orderId});if(error)return alert(error.message);$("#modal")?.remove();await loadAll();}


function instructorhome(){const mine=[...db.classes].filter(c=>String(c.instructor_user_id||'')===String(session.user.id)&&!c.cancelled),now=new Date(),todayClasses=mine.filter(c=>c.class_date===today()).sort((a,b)=>String(a.class_time).localeCompare(String(b.class_time))),upcoming=mine.filter(c=>new Date(`${c.class_date}T${String(c.class_time||'00:00').slice(0,8)}`)>=now).sort((a,b)=>(a.class_date+a.class_time).localeCompare(b.class_date+b.class_time)),pastCount=mine.filter(c=>new Date(`${c.class_date}T${String(c.class_time||'00:00').slice(0,8)}`)<now).length,next=upcoming[0];layout(`<div class="grid three"><div class="card kpi"><div class="label">Classes today</div><div class="value">${todayClasses.length}</div></div><div class="card kpi"><div class="label">Classes taught</div><div class="value">${pastCount}</div></div><div class="card kpi"><div class="label">Front Desk</div><div class="value" style="font-size:22px">${db.frontDeskDuty?'Active':'Off'}</div></div></div><div class="spacer"></div><div class="card"><h3>Next class</h3>${next?`<div class="booking-person"><span><b>${esc(next.class_type||'Class')}</b><small>${esc(next.class_date)} · ${formatTime((next.class_time||'00:00').slice(0,5))} · ${esc(next.level||'Open Level')}</small></span><button class="btn primary" onclick="page='schedule';render()">Open schedule</button></div>`:'<div class="empty">No upcoming classes.</div>'}</div><div class="spacer"></div><div class="card"><h3>Today</h3>${todayClasses.map(classCard).join('')||'<div class="empty">No classes today.</div>'}</div>`,`Home`,`Your teaching day at a glance`)}

function packageWarning(c){if(!c)return '';const td=new Date(today()+'T12:00:00'),ex=c.expiry?new Date(c.expiry+'T12:00:00'):null;if(Number(c.sessions)===0)return 'No sessions remaining';if(Number(c.sessions)===1)return '1 session left';if(ex){const d=Math.ceil((ex-td)/86400000);if(d<0)return 'Package expired';if(d<=3)return `Expires in ${d} day${d===1?'':'s'}`}return ''}
function clienthome(){const c=myClient(),mine=db.bookings.filter(b=>String(b.client_id)===String(c?.id)&&!['cancelled','no_show'].includes(b.status)),upcoming=mine.map(b=>({b,cl:db.classes.find(x=>String(x.id)===String(b.class_id))})).filter(x=>x.cl&&!x.cl.cancelled&&new Date(`${x.cl.class_date}T${String(x.cl.class_time||'00:00').slice(0,8)}`)>=new Date()).sort((a,b)=>(a.cl.class_date+a.cl.class_time).localeCompare(b.cl.class_date+b.cl.class_time)),next=upcoming[0],pending=db.package_orders.find(o=>String(o.client_id)===String(c?.id)&&o.status==='pending'),warn=packageWarning(c),history=(db.client_payments||[]).slice(0,5);layout(`<div class="grid three"><div class="card kpi"><div class="label">Package</div><div class="value" style="font-size:22px">${esc(c?.package||'None')}</div></div><div class="card kpi"><div class="label">Sessions left</div><div class="value">${c?.sessions??0}</div></div><div class="card kpi"><div class="label">Expiry</div><div class="value" style="font-size:22px">${esc(c?.expiry||'—')}</div></div></div>${warn?`<div class="warning" style="margin-top:12px">${esc(warn)}</div>`:''}${pending?`<div class="notice card" style="margin-top:12px"><b>Payment pending</b><p>Your selected package is waiting for payment at Core Theory.</p></div>`:''}<div class="spacer"></div><div class="card"><h3>Next class</h3>${next?`<div class="booking-person"><span><b>${esc(next.cl.class_type||'Class')}</b><small>${esc(next.cl.class_date)} · ${formatTime((next.cl.class_time||'00:00').slice(0,5))} · ${esc(next.cl.studio_type||'Pilates')}</small></span><button class="btn" onclick="page='mybookings';render()">My bookings</button></div>`:'<div class="empty">No upcoming booking.</div>'}<button class="btn primary" onclick="page='book';render()">Book a Class</button></div><div class="spacer"></div><div class="card"><h3>Recent payments</h3>${history.map(p=>`<div class="cart-row"><span><b>${esc(p.description||'Payment')}</b><small>${new Date(p.created_at).toLocaleDateString()} · ${esc(p.payment_method||'')}${p.coupon_code?` · Coupon ${esc(p.coupon_code)} (${p.discount_percent||0}% off)`:''}</small></span><b>${money(p.total)}</b></div>`).join('')||'<div class="empty">No payment history yet.</div>'}</div>`,`Home`,`Your Core Theory account`)}

function myClient(){return db.clients[0]}
function packageEligible(m,cl){const scope=m.studio_scope||'Both',type=cl.studio_type||'Pilates';return scope==='Both'||scope===type}
function clientBook(classId){const c=myClient(),cl=db.classes.find(x=>String(x.id)===String(classId));if(!c||!cl)return alert('Booking details are not ready. Refresh and try again.');if(db.bookings.some(b=>String(b.class_id)===String(classId)&&String(b.client_id)===String(c.id)&&b.status!=='cancelled'))return alert('You are already booked.');const eligible=sortedMemberships(db.memberships.filter(m=>packageEligible(m,cl))),rewards=db.client_rewards.filter(r=>String(r.client_id)===String(c.id)&&r.status==='active'&&Number(r.sessions_remaining)>0&&r.valid_from<=today()&&r.valid_until>=today()&&(r.studio_scope==='Both'||r.studio_scope===(cl.studio_type||'Pilates'))),currentOk=(Number(c.sessions)===999||Number(c.sessions)>0)&&(!c.package_scope||c.package_scope==='Both'||c.package_scope===(cl.studio_type||'Pilates'));modal('Choose package',`<p><b>${esc(cl.class_type)}</b> · ${esc(cl.studio_type||'Pilates')} · ${esc(cl.class_date)}</p><label>How would you like to book?</label><select id="bookPackage">${rewards.map(r=>`<option value="reward:${r.id}">${esc(r.title)} — FREE</option>`).join('')}${currentOk?`<option value="current">Use my current package (${c.sessions===999?'Unlimited':c.sessions+' sessions left'})</option>`:''}${eligible.map(m=>`<option value="buy:${m.id}">Buy ${esc(m.name)} — ${money(m.price)} · Pay at Front Desk</option>`).join('')}</select><label>Coupon code <span class="muted">(optional, when buying a package)</span></label><input id="bookCoupon" placeholder="Enter coupon code"><p class="muted">Active coupon codes are applied before payment. Free rewards do not require payment.</p><button class="btn primary full" onclick="confirmClientBooking('${classId}')">Confirm booking</button>`)}
async function confirmClientBooking(classId){const choice=$("#bookPackage")?.value;if(!choice)return alert('Please choose an option.');let membershipId=null,rewardId=null;if(choice.startsWith('buy:'))membershipId=choice.split(':')[1];if(choice.startsWith('reward:'))rewardId=choice.split(':')[1];const coupon=membershipId?($("#bookCoupon")?.value||'').trim():null,btn=document.querySelector('#modal .btn.primary');if(btn){btn.disabled=true;btn.textContent='Booking…'}const {data,error}=await sb.rpc('book_class_v3',{p_class_id:String(classId),p_membership_id:membershipId,p_coupon_code:coupon||null,p_reward_id:rewardId});if(error){if(btn){btn.disabled=false;btn.textContent='Confirm booking'}return alert(error.message)}$("#modal")?.remove();await loadAll();const status=data?.status||'booked',pay=data?.payment_status||'paid';alert(status==='waitlist'?(pay==='pending'?'Added to waitlist. Package payment is pending at the front desk.':'Added to waitlist.'):(rewardId?'Booked with your free reward!':pay==='pending'?'Booked! Your package payment is due at the front desk.':'Booked!'))}
function mybookings(){const c=myClient(),bs=db.bookings.filter(b=>String(b.client_id)===String(c?.id)&&b.status!=='cancelled');layout(`<div class="card">${bs.map(b=>{const cl=db.classes.find(x=>String(x.id)===String(b.class_id));return `<div class="booking-person"><span><b>${esc(cl?.class_type||'Class')}</b><small>${esc(cl?.class_date||'')} · ${cl?.class_time?formatTime(cl.class_time.slice(0,5)):''} · ${esc(b.status)}</small></span>${b.status==='booked'?`<button class="btn small danger" onclick="cancelMyBooking('${b.id}')">Cancel</button>`:''}</div>`}).join('')||'<div class="empty">No upcoming bookings.</div>'}</div>`,`My Bookings`,`Your reservations and attendance`)}async function cancelMyBooking(id){if(!confirm('Cancel this booking?'))return;const {error}=await sb.rpc('cancel_booking_safely',{p_booking_id:id});if(error)return alert(error.message);await loadAll();alert('Booking cancelled.')}
function packages(){const c=myClient();layout(`<div class="grid three">${sortedMemberships().map(m=>`<div class="card"><h3>${esc(m.name)}</h3><div class="package-price">${money(m.price)}</div><p>${m.is_private?'Private Session':(m.sessions===999?'Unlimited':m.sessions+' sessions')} · ${m.validity_days} days</p><button class="btn primary" onclick="packageRequestModal('${m.id}')">Choose package</button></div>`).join('')}</div><div class="card notice"><b>Pay at Core Theory</b><p>Choose a package and optionally enter an active coupon code. Your request stays Payment Pending until payment is collected.</p></div>`,`Packages`,`Current package: ${esc(c?.package||'None')} · ${c?.sessions??0} sessions remaining`)}
function packageRequestModal(id){const m=db.memberships.find(x=>String(x.id)===String(id));if(!m)return;modal('Request package',`<p><b>${esc(m.name)}</b> · ${money(m.price)}</p><label>Coupon code <span class="muted">(optional)</span></label><input id="requestCoupon" placeholder="Enter coupon code"><button class="btn primary full" onclick="requestPackage('${m.id}')">Request package</button>`)}
async function requestPackage(id){const code=($("#requestCoupon")?.value||'').trim();const {data,error}=await sb.rpc('request_package_order_v2',{p_membership_id:String(id),p_coupon_code:code||null});if(error)return alert(error.message);$("#modal")?.remove();await loadAll();alert(data?.discount_percent?`Package request sent. Coupon applied: ${data.discount_percent}% off. Payment is pending.`:'Package request sent to Core Theory. Payment is pending.')}
function clientaccount(){const c=myClient();layout(`<div class="card compact-card"><h3>${esc(c?.name||profile?.full_name||'Client')}</h3><p>${esc(session.user.email)}</p><p><b>Package:</b> ${esc(c?.package||'None')}</p><p><b>Sessions:</b> ${c?.sessions??0}</p><p><b>Expiry:</b> ${esc(c?.expiry||'—')}</p><button class="btn" onclick="setPasswordScreen()">Change password</button> <button class="btn danger" onclick="logout()">Log out</button></div>`,`My Account`,`Core Theory client portal`)}

function payment(){layout(`<div class="card compact-card"><h3>Record client payment</h3><div class="form"><div class="full"><label>Client</label><select id="rpclient">${db.clients.map(c=>`<option value="${c.id}">${esc(c.name)}</option>`).join('')}</select></div><div><label>Amount</label><input id="rpamount" type="number" step=".01"></div><div><label>Method</label><select id="rppay"><option>Cash</option><option>Card</option><option>Whish</option><option>Transfer</option></select></div><div class="full"><label>Note</label><input id="rpnote" placeholder="Package / private / other"></div><div class="full"><button class="btn primary" onclick="recordPayment()">Record payment</button></div></div></div>`,`Record Payment`,`Payments are stamped with your account and time`)}async function recordPayment(){const {error}=await sb.from('sales').insert({client_id:$("#rpclient").value,total:+$("#rpamount").value,payment_method:$("#rppay").value,items:[{name:$("#rpnote").value||'Payment'}],created_by:session.user.id});if(error)return alert(error.message);await loadAll();alert('Payment recorded.')}
function expenses(){layout(`<div class="card"><div class="toolbar"><button class="btn primary" onclick="expenseModal()">+ Add expense</button></div>${db.expenses.length?`<table><thead><tr><th>Date</th><th>Category</th><th>Description</th><th>Amount</th><th></th></tr></thead><tbody>${db.expenses.map(e=>`<tr><td>${esc(e.expense_date)}</td><td>${esc(e.category)}</td><td>${esc(e.description||'')}</td><td>${money(e.amount)}</td><td><button class="btn small" onclick="expenseModal('${e.id}')">Edit</button> <button class="btn small danger" onclick="removeItem('expenses','${e.id}')">Delete</button></td></tr>`).join('')}</tbody></table>`:'<div class="empty">No expenses.</div>'}</div>`,`Expenses`,`Studio costs and audit trail`)}
function expenseModal(id=''){const e=id?db.expenses.find(x=>String(x.id)===String(id)):null;modal(e?'Edit expense':'Add expense',`<div class="form"><div><label>Date</label><input type="date" id="edate" value="${e?.expense_date||today()}"></div><div><label>Category</label><select id="ecat">${['Electricity','Rent','Water','Internet','Cleaning','Payroll','Inventory','Marketing','Maintenance','Other'].map(x=>`<option ${x===e?.category?'selected':''}>${x}</option>`).join('')}</select></div><div class="full"><label>Description</label><input id="edesc" value="${esc(e?.description||'')}"></div><div><label>Amount</label><input type="number" step=".01" id="eamount" value="${e?.amount??''}"></div><div><label>Payment</label><select id="epay">${['Cash','Card','Whish','Transfer'].map(x=>`<option ${x===e?.payment_method?'selected':''}>${x}</option>`).join('')}</select></div><div class="full"><button class="btn primary" onclick="${e?`saveExpense('${e.id}')`:'addExpense()'}">${e?'Save changes':'Save expense'}</button></div></div>`)}
async function addExpense(){const payload={expense_date:$("#edate").value,category:$("#ecat").value,description:$("#edesc").value,amount:+$("#eamount").value,payment_method:$("#epay").value,created_by:session.user.id};const {error}=await sb.from('expenses').insert(payload);if(error)return alert(error.message);$("#modal").remove();await loadAll()}
async function saveExpense(id){const payload={expense_date:$("#edate").value,category:$("#ecat").value,description:$("#edesc").value,amount:+$("#eamount").value,payment_method:$("#epay").value};const {error}=await sb.from('expenses').update(payload).eq('id',id);if(error)return alert(error.message);$("#modal").remove();await loadAll();alert('Expense updated.')}

function memberships(){const ms=sortedMemberships();layout(`<div class="card"><div class="toolbar"><button class="btn primary" onclick="membershipModal()">+ Add membership</button></div>${ms.length?ms.map((m,i)=>`<div class="cart-row"><span><b>${esc(m.name)}</b>${m.is_private?' <span class="badge">Private Session</span>':''}<small>${m.is_private?'Private Session':(m.sessions===999?'Unlimited':m.sessions+' sessions')} · ${m.validity_days} days · ${esc(m.studio_scope||'Both')}</small></span><span class="row"><b>${money(m.price)}</b><button class="btn small" ${i===0?'disabled':''} onclick="moveMembership('${m.id}',-1)">↑</button><button class="btn small" ${i===ms.length-1?'disabled':''} onclick="moveMembership('${m.id}',1)">↓</button><button class="btn small" onclick="editMembership('${m.id}')">Edit</button><button class="btn small danger" onclick="removeItem('memberships','${m.id}')">Delete</button></span></div>`).join(''):'<div class="empty">No memberships yet.</div>'}</div>`,`Memberships`,`Use ↑ and ↓ to choose the order shown here and in POS / Sales`)}
function membershipModal(m=null){const editing=!!m;modal(editing?'Edit membership':'Add membership',`<div class="form"><div><label>Name</label><input id="mname" value="${esc(m?.name||'')}"></div><div><label>Sessions</label><input type="number" id="msessions" value="${m?.sessions??''}" ${m?.is_private?'disabled':''}></div><div><label>Price</label><input type="number" step=".01" id="mprice" value="${m?.price??''}"></div><div><label>Validity days</label><input type="number" id="mdays" value="${m?.validity_days??30}"></div><div class="full"><label>Valid for</label><select id="mscope"><option ${(!m||m.studio_scope==='Both'||!m.studio_scope)?'selected':''}>Both</option><option ${m?.studio_scope==='Pilates'?'selected':''}>Pilates</option><option ${m?.studio_scope==='Megacore'?'selected':''}>Megacore</option></select></div><div class="full"><label><input type="checkbox" id="mprivate" ${m?.is_private?'checked':''} onchange="togglePrivateMembership()"> Private session</label><small class="muted">Private Session memberships are always 1 session.</small></div><div class="full"><button class="btn primary" onclick="saveMembership('${m?.id||''}')">${editing?'Save changes':'Save membership'}</button></div></div>`)}
function togglePrivateMembership(){const on=$("#mprivate")?.checked,s=$("#msessions");if(!s)return;if(on){s.value=1;s.disabled=true}else{s.disabled=false}}
function editMembership(id){const m=db.memberships.find(x=>String(x.id)===String(id));if(m)membershipModal(m)}
async function saveMembership(id=''){const isPrivate=$("#mprivate")?.checked===true,payload={name:$("#mname").value.trim(),sessions:isPrivate?1:+$("#msessions").value,price:+$("#mprice").value,validity_days:+$("#mdays").value,studio_scope:$("#mscope").value,is_private:isPrivate};if(!payload.name)return alert('Enter a membership name.');if(!id){payload.sort_order=(sortedMemberships().at(-1)?.sort_order||0)+10}const q=id?sb.from('memberships').update(payload).eq('id',id):sb.from('memberships').insert(payload);const {error}=await q;if(error)return alert(error.message);$("#modal").remove();await loadAll()}
async function moveMembership(id,direction){const ms=sortedMemberships(),i=ms.findIndex(m=>String(m.id)===String(id)),j=i+direction;if(i<0||j<0||j>=ms.length)return;const a=ms[i],b=ms[j],ao=Number(a.sort_order||i*10),bo=Number(b.sort_order||j*10);const {error:e1}=await sb.from('memberships').update({sort_order:bo}).eq('id',a.id);if(e1)return alert(e1.message);const {error:e2}=await sb.from('memberships').update({sort_order:ao}).eq('id',b.id);if(e2)return alert(e2.message);await loadAll();page='memberships';memberships()}


function saleClientSearchHtml(){return `<label>Client</label><div><input id="saleClientSearch" autocomplete="off" placeholder="Type a client name…" value="${esc(selectedSaleClient?.name||'')}" oninput="selectedSaleClient=null;searchSaleClients(this.value)"><div id="saleClientResults"></div></div><div class="muted" id="saleClientChosen">${selectedSaleClient?`Selected: ${esc(selectedSaleClient.name)}`:'Leave blank for a retail walk-in. A client is required when selling a package.'}</div>`}
async function searchSaleClients(q){const box=$("#saleClientResults");if(!box)return;const term=String(q||'').trim();if(term.length<2){box.innerHTML='';return}let rows=[];if(isOwner()){rows=db.clients.filter(c=>String(c.name||'').toLowerCase().includes(term.toLowerCase())).slice(0,8).map(c=>({id:String(c.id),name:c.name}))}else if(isFrontDeskStaff()&&db.frontDeskDuty){const {data,error}=await sb.rpc('front_desk_client_search',{p_query:term});if(error){box.innerHTML=`<div class="warning">${esc(error.message)}</div>`;return}rows=data||[]}box.innerHTML=rows.length?rows.map(c=>`<button type="button" class="btn small full" style="text-align:left;margin-top:6px" onclick="chooseSaleClient('${c.id}',decodeURIComponent('${encodeURIComponent(c.name||'')}'))">${esc(c.name)}</button>`).join(''):'<div class="muted" style="padding:8px 0">No matching client.</div>'}
function chooseSaleClient(id,name){selectedSaleClient={id:String(id),name:String(name)};const input=$("#saleClientSearch");if(input)input.value=selectedSaleClient.name;const box=$("#saleClientResults");if(box)box.innerHTML='';const chosen=$("#saleClientChosen");if(chosen)chosen.innerHTML=`Selected: <b>${esc(selectedSaleClient.name)}</b>`}

function pos(){
  const products=isOwner()?db.products:(db.frontDeskProducts||[]);
  const memberships=isOwner()?db.memberships:(db.frontDeskMemberships||[]);
  const packageItems=memberships.filter(x=>(x.studio_scope||'Both')===posPackageTab);
  const subtotal=cart.reduce((a,x)=>a+Number(x.price||0),0);
  const discount=Number(posPromo?.discount||0);
  const total=Math.max(0,subtotal-discount);

  layout(`<div class="pos">
    <div class="card">
      <h3>Packages</h3>
      <div class="schedule-tabs" style="margin-bottom:14px">
        <button class="tab ${posPackageTab==='Pilates'?'active':''}" onclick="posPackageTab='Pilates';pos()">PILATES</button>
        <button class="tab ${posPackageTab==='Megacore'?'active':''}" onclick="posPackageTab='Megacore';pos()">MEGACORE</button>
        <button class="tab ${posPackageTab==='Both'?'active':''}" onclick="posPackageTab='Both';pos()">MIX</button>
      </div>
      <div class="product-grid">
        ${packageItems.map(x=>`<div class="product" onclick="addCart('membership','${x.id}')">
          <b>${esc(x.name)}</b>
          <small>${x.is_private?'Private Session':(x.sessions===999?'Unlimited':x.sessions+' sessions')}</small>
          <div>${money(x.price)}</div>
        </div>`).join('')||`<div class="empty">No ${esc(posPackageTab==='Both'?'Mix':posPackageTab)} memberships yet.</div>`}
      </div>

      <div class="spacer"></div>
      <h3>Retail Products</h3>
      <div class="product-grid">
        ${products.map(x=>`<div class="product" onclick="addCart('product','${x.id}')">
          <b>${esc(x.name)}</b><small>${x.stock??0} in stock</small><div>${money(x.price)}</div>
        </div>`).join('')||'<div class="empty">No retail products yet.</div>'}
      </div>
    </div>

    <div class="card">
      <h3>Current sale</h3>

      ${cart.map((x,i)=>`<div class="cart-row">
        <span>${esc(x.name)}</span>
        <span>${money(x.price)} <button class="btn small" onclick="removeCartItem(${i})">×</button></span>
      </div>`).join('')||'<div class="empty">Add an item.</div>'}

      ${saleClientSearchHtml()}

      <label>Payment</label>
      <select id="payment">
        <option>Cash</option><option>Card</option><option>Whish</option><option>Transfer</option>
      </select>

      <div class="pos-promo-box">
        <label>Promo code</label>
        <div class="pos-promo-row">
          <input id="posPromoCode" placeholder="Enter promo code" value="${esc(posPromo?.code||'')}" oninput="this.value=this.value.toUpperCase()">
          ${posPromo
            ? `<button class="btn" type="button" onclick="removePosPromo()">Remove</button>`
            : `<button class="btn" type="button" onclick="applyPosPromo()">Apply</button>`}
        </div>
        ${posPromo
          ? `<div class="promo-success">✓ ${esc(posPromo.code)} applied · You save ${money(posPromo.discount)}</div>`
          : `<div class="muted">Promo codes apply to package purchases. Select the client and package first.</div>`}
      </div>

      ${posPromo?`
        <div class="pos-total-lines">
          <div><span>Subtotal</span><b>${money(subtotal)}</b></div>
          <div class="promo-discount"><span>Promo · ${esc(posPromo.code)}</span><b>−${money(discount)}</b></div>
        </div>`:''}

      <div class="pos-grand-total">
        <span>Total</span>
        <h2>${money(total)}</h2>
      </div>

      <button class="btn primary full" onclick="checkout()">Complete sale</button>
    </div>
  </div>`,`POS / Sales`,isOwner()?'Packages are grouped by Pilates, Megacore and Mix':'Front Desk Duty — packages grouped by studio type');
}

function removeCartItem(i){
  cart.splice(i,1);
  posPromo=null;
  pos();
}

function addCart(kind,id){
  const src=kind==='product'?(isOwner()?db.products:(db.frontDeskProducts||[])):(isOwner()?db.memberships:(db.frontDeskMemberships||[]));
  const x=src.find(a=>String(a.id)===String(id));
  if(!x)return alert('Item not found. Refresh and try again.');
  cart.push({...x,kind});
  posPromo=null;
  pos();
}

async function applyPosPromo(){
  const code=($("#posPromoCode")?.value||'').trim().toUpperCase();
  if(!code)return alert('Enter a promo code first.');
  if(!selectedSaleClient?.id)return alert('Select the client before applying a promo code.');

  const packages=cart.filter(x=>x.kind==='membership');
  if(!packages.length)return alert('Add a package before applying a promo code.');
  if(packages.length>1)return alert('A promo code can be applied to one package at a time. Complete this package sale first, then start the next one.');

  const btn=document.querySelector('.pos-promo-row .btn');
  if(btn){btn.disabled=true;btn.textContent='Checking…'}

  const {data,error}=await sb.rpc('preview_pos_promo',{
    p_client_id:String(selectedSaleClient.id),
    p_membership_id:String(packages[0].id),
    p_coupon_code:code
  });

  if(error){
    if(btn){btn.disabled=false;btn.textContent='Apply'}
    return alert(error.message);
  }

  posPromo={
    code:data?.code||code,
    discount:Number(data?.discount||0),
    final_amount:Number(data?.final_amount||packages[0].price||0),
    promo_id:data?.promo_id||null
  };
  pos();
}

function removePosPromo(){
  posPromo=null;
  pos();
}

async function checkout(){
  if(!cart.length)return;

  const cid=selectedSaleClient?.id||null;
  const method=$("#payment").value;

  if(cart.some(x=>x.kind==='membership')&&!cid)
    return alert('Search and select a client before selling a package.');

  if(posPromo){
    const packages=cart.filter(x=>x.kind==='membership');
    if(packages.length!==1)
      return alert('A promo code can be applied to one package at a time.');

    const btn=document.querySelector('.pos .btn.primary.full');
    if(btn){btn.disabled=true;btn.textContent='Processing…'}

    const items=cart.map(x=>({
      id:String(x.id),
      name:x.name,
      price:Number(x.price||0),
      kind:x.kind
    }));

    const {error}=await sb.rpc('complete_pos_sale_with_promo',{
      p_client_id:String(cid),
      p_payment_method:method,
      p_items:items,
      p_coupon_code:String(posPromo.code)
    });

    if(error){
      if(btn){btn.disabled=false;btn.textContent='Complete sale'}
      return alert(error.message);
    }

    cart=[];
    selectedSaleClient=null;
    posPromo=null;
    await loadAll();
    alert('Sale recorded with promo code.');
    return;
  }

  const btn=document.querySelector('.pos .btn.primary.full');
  if(btn){btn.disabled=true;btn.textContent='Processing…'}

  const items=cart.map(x=>({
    id:String(x.id),
    name:x.name,
    price:Number(x.price||0),
    kind:x.kind
  }));

  const {error}=await sb.rpc('complete_pos_sale',{
    p_client_id:cid,
    p_payment_method:method,
    p_items:items
  });

  if(error){
    if(btn){btn.disabled=false;btn.textContent='Complete sale'}
    return alert(error.message);
  }

  cart=[];
  selectedSaleClient=null;
  posPromo=null;
  await loadAll();
  alert('Sale recorded.');
}

async function applyMembership(cid,m){const d=new Date();d.setDate(d.getDate()+Number(m.validity_days));return sb.from('clients').update({package:m.name,sessions:m.sessions,expiry:dateISO(d)}).eq('id',cid)}function sellMembership(cid){modal('Add package',`<select id="smid">${db.memberships.map(m=>`<option value="${m.id}">${esc(m.name)} — ${money(m.price)}</option>`).join('')}</select><button class="btn primary full" onclick="confirmMembership('${cid}')">Apply package</button>`)}async function confirmMembership(cid){const m=db.memberships.find(x=>String(x.id)===$("#smid").value);if(!m)return;const {error}=await sb.rpc('owner_apply_membership',{p_client_id:String(cid),p_membership_id:String(m.id)});if(error)return alert(error.message);$("#modal").remove();await loadAll();alert('Package applied.')}
function inventory(){layout(`<div class="card"><div class="toolbar"><button class="btn primary" onclick="productModal()">+ Add product</button></div><table><thead><tr><th>Product</th><th>Cost</th><th>Sell</th><th>Stock</th><th>Low stock</th><th></th></tr></thead><tbody>${db.products.map(p=>`<tr><td><b>${esc(p.name)}</b><div class="muted">${esc(p.category||'')}</div></td><td>${money(p.cost)}</td><td>${money(p.price)}</td><td>${p.stock}</td><td>${p.minimum_stock??0}</td><td><button class="btn small" onclick="editProduct('${p.id}')">Edit</button> <button class="btn small danger" onclick="removeItem('products','${p.id}')">Delete</button></td></tr>`).join('')}</tbody></table></div>`,`Inventory`,`Retail stock — edit products, cost, price and quantities`)}
function productModal(p=null){const editing=!!p;modal(editing?'Edit product':'Add product',`<div class="form"><div><label>Name</label><input id="pname" value="${esc(p?.name||'')}"></div><div><label>Category</label><input id="pcat" value="${esc(p?.category||'Retail')}"></div><div><label>Cost</label><input id="pcost" type="number" step=".01" value="${p?.cost??''}"></div><div><label>Sell</label><input id="pprice" type="number" step=".01" value="${p?.price??''}"></div><div><label>Stock</label><input id="pstock" type="number" value="${p?.stock??0}"></div><div><label>Low stock</label><input id="pmin" type="number" value="${p?.minimum_stock??5}"></div><div class="full"><button class="btn primary" onclick="${editing?`saveProduct('${p.id}')`:'addProduct()'}">${editing?'Save changes':'Save product'}</button></div></div>`)}
function editProduct(id){const p=db.products.find(x=>String(x.id)===String(id));if(p)productModal(p)}
async function addProduct(){const payload={name:$("#pname").value.trim(),category:$("#pcat").value.trim(),cost:+$("#pcost").value,price:+$("#pprice").value,stock:+$("#pstock").value,minimum_stock:+$("#pmin").value};if(!payload.name)return alert('Enter a product name.');const {error}=await sb.from('products').insert(payload);if(error)return alert(error.message);$("#modal").remove();await loadAll()}
async function saveProduct(id){const payload={name:$("#pname").value.trim(),category:$("#pcat").value.trim(),cost:+$("#pcost").value,price:+$("#pprice").value,stock:+$("#pstock").value,minimum_stock:+$("#pmin").value};if(!payload.name)return alert('Enter a product name.');const {error}=await sb.from('products').update(payload).eq('id',id);if(error)return alert(error.message);$("#modal").remove();await loadAll();alert('Product updated.')}

function saleWhat(s){if(s.description)return s.description;const items=Array.isArray(s.items)?s.items:[];return items.map(i=>i?.name||i?.kind||'Item').filter(Boolean).join(', ')||'Payment'}
function saleClientName(s){return db.clients.find(c=>String(c.id)===String(s.client_id))?.name||(s.client_id?'Unknown client':'Walk-in')}
function saleCollector(s){if(String(s.created_by||'')===String(session?.user?.id||''))return 'Owner';return db.team.find(t=>String(t.auth_user_id||'')===String(s.created_by||''))?.name||'Staff'}
function finance(){const rev=db.sales.filter(s=>!s.voided_at).reduce((a,s)=>a+Number(s.total||0),0),exp=db.expenses.reduce((a,e)=>a+Number(e.amount||0),0),pending=db.package_orders.filter(o=>o.status==='pending');layout(`<div class="grid three"><div class="card kpi"><div class="label">Revenue</div><div class="value">${money(rev)}</div></div><div class="card kpi"><div class="label">Expenses</div><div class="value">${money(exp)}</div></div><div class="card kpi"><div class="label">Profit</div><div class="value">${money(rev-exp)}</div></div></div><div class="spacer"></div><div class="card"><h3>Pending package orders</h3>${pending.length?pending.map(o=>{const c=db.clients.find(x=>String(x.id)===String(o.client_id)),m=db.memberships.find(x=>String(x.id)===String(o.membership_id));return `<div class="booking-person"><span><b>${esc(c?.name||'Client')}</b><small>${esc(m?.name||'Package')} · ${money(o.amount)}${o.coupon_code?` · Coupon ${esc(o.coupon_code)} (${o.discount_percent||0}% off)`:''} · Payment Pending</small></span><span><button class="btn small" onclick="ownerChangePendingPackage('${o.id}')">Change Package</button> <button class="btn small primary" onclick="ownerCollectPendingPayment('${o.id}')">Collect Payment</button> <button class="btn small danger" onclick="ownerCancelPendingOrder('${o.id}')">Cancel</button></span></div>`}).join(''):'<div class="empty">No pending package orders.</div>'}</div><div class="spacer"></div><div class="card"><div class="toolbar"><h3 style="margin:0">Payment history</h3><input id="paymentHistorySearch" placeholder="Search client, item or payment method…" oninput="renderPaymentHistory(this.value)" style="max-width:340px"></div><div id="paymentHistoryRows"></div></div>`,`Finance`,`Owner-only studio financials`);renderPaymentHistory('')}
function renderPaymentHistory(query=''){const box=$("#paymentHistoryRows");if(!box)return;const q=String(query||'').trim().toLowerCase(),rows=[...db.sales].sort((a,b)=>String(b.created_at||'').localeCompare(String(a.created_at||''))).filter(s=>{const hay=[saleClientName(s),saleWhat(s),s.payment_method,s.total].join(' ').toLowerCase();return !q||hay.includes(q)});box.innerHTML=rows.length?`<div style="overflow:auto"><table><thead><tr><th>Date / time</th><th>Client</th><th>Paid for</th><th>Method</th><th>Amount</th><th>Recorded by</th><th></th></tr></thead><tbody>${rows.map(s=>`<tr><td>${s.created_at?new Date(s.created_at).toLocaleString():'—'}${s.edited_at?'<div class="muted">Edited</div>':''}</td><td><b>${esc(saleClientName(s))}</b></td><td>${esc(saleWhat(s))}</td><td>${esc(s.payment_method||'—')}</td><td><b>${money(s.total)}</b>${s.voided_at?'<div class="muted">Voided</div>':''}</td><td>${esc(saleCollector(s))}</td><td>${s.voided_at?'<span class="badge">Voided</span>':`<button class="btn small" onclick="editSaleModal('${s.id}')">Edit</button> <button class="btn small danger" onclick="voidSale('${s.id}')">Void</button>`}</td></tr>`).join('')}</tbody></table></div>`:'<div class="empty">No matching payments.</div>'}
function editSaleModal(id){const s=db.sales.find(x=>String(x.id)===String(id));if(!s)return;modal('Edit payment record',`<div class="warning" style="margin-bottom:12px">Owner only. This corrects the payment record and revenue history. It does not automatically change a client's package balance or attendance.</div><div class="form"><div class="full"><label>Client</label><select id="editSaleClient"><option value="">Walk-in / no client</option>${db.clients.map(c=>`<option value="${c.id}" ${String(c.id)===String(s.client_id)?'selected':''}>${esc(c.name)}</option>`).join('')}</select></div><div class="full"><label>Paid for</label><input id="editSaleWhat" value="${esc(saleWhat(s))}"></div><div><label>Amount</label><input id="editSaleAmount" type="number" step=".01" min="0" value="${Number(s.total||0)}"></div><div><label>Payment method</label><select id="editSaleMethod">${['Cash','Card','Whish','Transfer'].map(x=>`<option ${x===s.payment_method?'selected':''}>${x}</option>`).join('')}</select></div><div class="full"><button class="btn primary" onclick="saveSaleEdit('${s.id}')">Save correction</button></div></div>`)}
async function saveSaleEdit(id){const amount=Number($("#editSaleAmount").value);if(!Number.isFinite(amount)||amount<0)return alert('Enter a valid amount.');const {error}=await sb.rpc('edit_sale_record',{p_sale_id:id,p_client_id:$("#editSaleClient").value||null,p_total:amount,p_payment_method:$("#editSaleMethod").value,p_description:$("#editSaleWhat").value.trim()});if(error)return alert(error.message);$("#modal")?.remove();await loadAll();page='finance';finance();alert('Payment record updated. The edit is logged.')}

async function voidSale(id){const reason=prompt('Reason for voiding this payment:');if(reason===null)return;if(!reason.trim())return alert('Enter a reason.');if(!confirm('Void this payment? It will no longer count in Revenue.'))return;const {error}=await sb.rpc('void_sale_record',{p_sale_id:id,p_reason:reason.trim()});if(error)return alert(error.message);await loadAll();page='finance';finance();alert('Payment voided and kept in history.')}

function ownerCollectPendingPayment(orderId){
  const o=db.package_orders.find(x=>String(x.id)===String(orderId)),
        c=db.clients.find(x=>String(x.id)===String(o?.client_id)),
        m=db.memberships.find(x=>String(x.id)===String(o?.membership_id));
  if(!o)return alert('Pending order not found.');
  modal('Collect payment',`<p><b>${esc(c?.name||'Client')}</b></p><p>${esc(m?.name||'Package')} · ${money(o.amount)}${o.coupon_code?` · Coupon ${esc(o.coupon_code)} (${o.discount_percent||0}% off)`:''}</p><label>Payment method</label><select id="ownerPayMethod"><option>Cash</option><option>Card</option><option>Whish</option><option>Transfer</option></select><button class="btn primary full" id="ownerPayBtn" onclick="ownerConfirmPendingPayment('${orderId}')">Confirm payment & activate package</button><p class="muted">If this client already attended, the session will be reconciled automatically and only once.</p>`)
}
async function ownerConfirmPendingPayment(orderId){
  const btn=$("#ownerPayBtn"),method=$("#ownerPayMethod")?.value||'Cash';
  if(btn){btn.disabled=true;btn.textContent='Processing…'}
  const {error}=await sb.rpc('settle_package_order',{p_order_id:orderId,p_payment_method:method});
  if(error){if(btn){btn.disabled=false;btn.textContent='Confirm payment & activate package'}return alert(error.message)}
  $("#modal")?.remove();await loadAll();alert('Payment recorded and package activated.')
}
function ownerChangePendingPackage(orderId){
  const o=db.package_orders.find(x=>String(x.id)===String(orderId));
  if(!o)return alert('Pending order not found.');
  modal('Change pending package',`<label>Package / session</label><select id="ownerPendingMembership">${db.memberships.map(m=>`<option value="${m.id}" ${String(m.id)===String(o.membership_id)?'selected':''}>${esc(m.name)} — ${money(m.price)}</option>`).join('')}</select><button class="btn primary full" onclick="ownerSavePendingPackage('${orderId}')">Save change</button><p class="muted">This changes the unpaid order only. It does not record revenue until payment is collected.</p>`)
}
async function ownerSavePendingPackage(orderId){
  const membershipId=$("#ownerPendingMembership")?.value;
  if(!membershipId)return alert('Choose a package.');
  const {error}=await sb.rpc('change_pending_package_order',{p_order_id:orderId,p_membership_id:String(membershipId)});
  if(error)return alert(error.message);
  $("#modal")?.remove();await loadAll();alert('Pending package changed.')
}
async function ownerCancelPendingOrder(orderId){
  if(!confirm('Cancel this pending package order? No revenue has been recorded yet.'))return;
  const {error}=await sb.rpc('cancel_package_order',{p_order_id:orderId});
  if(error)return alert(error.message);
  await loadAll();
}

function classesTaughtCount(t){if(!t?.auth_user_id)return 0;const now=new Date();return db.classes.filter(c=>String(c.instructor_user_id||'')===String(t.auth_user_id)&&!c.cancelled&&new Date(`${c.class_date}T${String(c.class_time||'00:00').slice(0,8)}`)<=now).length}

const SHIFT_DAYS=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

function timeToMinutes(v=''){
  const [h,m]=String(v).slice(0,5).split(':').map(Number);
  return (h||0)*60+(m||0);
}

function instructorShiftSummary(t){
  const shifts=(db.instructor_shifts||[])
    .filter(s=>String(s.instructor_user_id)===String(t.auth_user_id))
    .sort((a,b)=>(a.weekday-b.weekday)||String(a.start_time).localeCompare(String(b.start_time)));
  if(!shifts.length)return '<span class="muted">No shifts set</span>';
  return shifts.map(s=>`
    <div class="shift-summary-line">
      <b>${SHIFT_DAYS[Number(s.weekday)]}</b>
      <span>${formatTime(String(s.start_time).slice(0,5))}–${formatTime(String(s.end_time).slice(0,5))}</span>
      <small>${esc(s.studio_scope||'All')}</small>
    </div>`).join('');
}

function instructorShiftsModal(teamId){
  const t=db.team.find(x=>String(x.id)===String(teamId));
  if(!t?.auth_user_id)return alert('This instructor needs an active login before shifts can be assigned.');

  const shifts=(db.instructor_shifts||[])
    .filter(s=>String(s.instructor_user_id)===String(t.auth_user_id))
    .sort((a,b)=>(a.weekday-b.weekday)||String(a.start_time).localeCompare(String(b.start_time)));

  modal(`${esc(t.name)} · Weekly shifts`,`
    <div class="shift-modal-copy">
      <p>Set the hours ${esc(t.name)} normally covers. Core Theory will automatically put her name on <b>unassigned</b> classes that fall inside these shifts.</p>
      <p class="muted">Classes that already have an instructor stay unchanged. If two instructors overlap the same class, Core Theory leaves that class unassigned so you can choose manually.</p>
    </div>

    <div id="shiftRows">
      ${shifts.map(shiftRowHtml).join('')}
    </div>

    <button class="btn" type="button" onclick="addShiftRow()">+ Add shift</button>

    <div class="full" style="margin-top:16px">
      <button class="btn primary" type="button" onclick="saveInstructorShifts('${t.id}','${t.auth_user_id}')">Save shifts & assign classes</button>
    </div>
  `);

  if(!shifts.length)addShiftRow();
}

function shiftRowHtml(s={}){
  const id=s.id||crypto.randomUUID();
  return `
    <div class="shift-edit-row" data-shift-row data-id="${id}">
      <div>
        <label>Day</label>
        <select class="shift-day">
          ${SHIFT_DAYS.map((d,i)=>`<option value="${i}" ${Number(s.weekday)===i?'selected':''}>${d}</option>`).join('')}
        </select>
      </div>
      <div>
        <label>From</label>
        <input class="shift-start" type="time" value="${String(s.start_time||'08:00').slice(0,5)}">
      </div>
      <div>
        <label>To</label>
        <input class="shift-end" type="time" value="${String(s.end_time||'13:00').slice(0,5)}">
      </div>
      <div>
        <label>Studio</label>
        <select class="shift-studio">
          <option value="All" ${(s.studio_scope||'All')==='All'?'selected':''}>All</option>
          <option value="Pilates" ${s.studio_scope==='Pilates'?'selected':''}>Pilates</option>
          <option value="Megacore" ${s.studio_scope==='Megacore'?'selected':''}>Megacore</option>
        </select>
      </div>
      <button class="btn small danger shift-remove" type="button" onclick="this.closest('[data-shift-row]').remove()">×</button>
    </div>`;
}

function addShiftRow(){
  const box=document.getElementById('shiftRows');
  if(box)box.insertAdjacentHTML('beforeend',shiftRowHtml({weekday:1,start_time:'08:00',end_time:'13:00',studio_scope:'All'}));
}

async function saveInstructorShifts(teamId,userId){
  const rows=[...document.querySelectorAll('[data-shift-row]')].map(r=>({
    weekday:Number(r.querySelector('.shift-day').value),
    start_time:r.querySelector('.shift-start').value,
    end_time:r.querySelector('.shift-end').value,
    studio_scope:r.querySelector('.shift-studio').value
  }));

  for(const r of rows){
    if(!r.start_time||!r.end_time)return alert('Add both a start and end time.');
    if(timeToMinutes(r.end_time)<=timeToMinutes(r.start_time))
      return alert(`${SHIFT_DAYS[r.weekday]}: the end time must be after the start time.`);
  }

  const btn=document.querySelector('#modal .btn.primary');
  if(btn){btn.disabled=true;btn.textContent='Saving…'}

  const {data,error}=await sb.rpc('set_instructor_weekly_shifts',{
    p_instructor_user_id:String(userId),
    p_shifts:rows
  });

  if(error){
    if(btn){btn.disabled=false;btn.textContent='Save shifts & assign classes'}
    return alert(error.message);
  }

  $("#modal")?.remove();
  await loadAll();

  const assigned=Number(data?.assigned||0);
  const ambiguous=Number(data?.ambiguous||0);
  let msg=`Shifts saved. ${assigned} class${assigned===1?' was':'es were'} assigned automatically.`;
  if(ambiguous)msg+=` ${ambiguous} class${ambiguous===1?' has':'es have'} overlapping instructor shifts and were left unassigned.`;
  alert(msg);
}

async function autoAssignUnassignedClasses(showResult=true){
  const {data,error}=await sb.rpc('auto_assign_classes_from_shifts');
  if(error)return alert(error.message);
  await loadAll();
  if(showResult){
    const assigned=Number(data?.assigned||0),ambiguous=Number(data?.ambiguous||0);
    alert(`${assigned} class${assigned===1?'':'es'} assigned.${ambiguous?` ${ambiguous} overlapping class${ambiguous===1?'':'es'} left unassigned.`:''}`);
  }
}

function applyInstructorShiftStyles(){
  if(document.getElementById('coreTheoryInstructorShiftStyles'))return;
  const s=document.createElement('style');
  s.id='coreTheoryInstructorShiftStyles';
  s.textContent=`
    .shift-summary-line{
      display:grid;
      grid-template-columns:78px 1fr auto;
      gap:8px;
      align-items:center;
      margin:3px 0;
      font-size:12px;
    }
    .shift-summary-line small{
      padding:2px 6px;
      border-radius:999px;
      background:rgba(114,47,55,.08);
      color:#722F37;
    }
    .shift-edit-row{
      display:grid;
      grid-template-columns:1.25fr 1fr 1fr 1.1fr auto;
      gap:8px;
      align-items:end;
      padding:12px 0;
      border-bottom:1px solid rgba(0,0,0,.08);
    }
    .shift-remove{margin-bottom:1px}
    .shift-modal-copy{margin-bottom:8px}
    @media(max-width:700px){
      .shift-edit-row{
        grid-template-columns:1fr 1fr;
      }
      .shift-edit-row>div:first-child,
      .shift-edit-row>div:nth-child(4){
        grid-column:1/-1;
      }
      .shift-remove{width:100%}
    }
  `;
  document.head.appendChild(s);
}

function team(){
  layout(`
    <div class="card">
      <div class="toolbar">
        <button class="btn primary" onclick="inviteInstructorModal()">+ Invite Instructor</button>
        <button class="btn" onclick="teamModal()">+ Add non-login team member</button>
        <button class="btn" onclick="autoAssignUnassignedClasses()">↻ Assign schedule from shifts</button>
      </div>

      <div class="warning" style="margin-bottom:14px">
        Set each instructor's weekly shifts here. Unassigned classes that fall inside exactly one instructor's shift are assigned automatically.
      </div>

      <table>
        <thead>
          <tr>
            <th>Name</th><th>Email</th><th>Phone</th><th>Role</th>
            <th>Weekly shifts</th><th>Classes taught</th><th>Rate / commission</th><th>Login</th><th></th>
          </tr>
        </thead>
        <tbody>
          ${db.team.map(t=>`
            <tr>
              <td><b>${esc(t.name)}</b></td>
              <td>${esc(t.email||'—')}</td>
              <td>${esc(t.phone||'')}</td>
              <td>${esc(t.role||'')}</td>
              <td>${t.role==='Instructor'&&t.auth_user_id?instructorShiftSummary(t):'<span class="muted">—</span>'}</td>
              <td><b>${classesTaughtCount(t)}</b></td>
              <td>${esc(t.rate||'')}</td>
              <td><span class="badge ${t.invite_status==='active'?'good':''}">${esc(t.invite_status||'No login')}</span></td>
              <td>
                <button class="btn small" onclick="editTeamMember('${t.id}')">Edit</button>
                ${t.role==='Instructor'&&t.auth_user_id?`<button class="btn small" onclick="instructorShiftsModal('${t.id}')">Shifts</button>`:''}
                ${t.email?`
                  <button class="btn small" onclick="resendInstructorInvite('${t.id}')">Resend invite</button>
                  ${t.auth_user_id?`
                    <button class="btn small" onclick="setFrontDeskDuty('${t.auth_user_id}',true)">Front Desk today</button>
                    <button class="btn small" onclick="setFrontDeskDuty('${t.auth_user_id}',false)">End duty</button>
                    <button class="btn small danger" onclick="toggleInstructorAccess('${t.id}',${t.invite_status==='disabled'?'true':'false'})">${t.invite_status==='disabled'?'Reactivate':'Deactivate login'}</button>
                  `:''}
                `:''}
                ${!t.auth_user_id?`<button class="btn small danger" onclick="removeItem('team','${t.id}')">Delete</button>`:''}
              </td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>`,
    `Team`,
    `Instructor shifts, activity, access and private pay information`
  );
}

function inviteInstructorModal(){modal('Invite Instructor',`<div class="form"><div><label>Full name</label><input id="iname" required></div><div><label>Email</label><input id="iemail" type="email" required></div><div><label>Phone number</label><input id="iphone" type="tel" required></div><div><label>Rate / commission</label><input id="irate" placeholder="$20/class or 30%"></div><div class="full"><p class="muted">They'll receive an email invitation and create their own password. Their account will automatically be Instructor access.</p><button class="btn primary" onclick="inviteInstructor()">Send invitation</button></div></div>`)}
async function callStaffAdmin(payload){const {data,error}=await sb.functions.invoke('manage-instructors',{body:payload});if(error)throw new Error(error.message);if(data?.error)throw new Error(data.error);return data}
async function inviteInstructor(){const name=$("#iname").value.trim(),email=$("#iemail").value.trim().toLowerCase(),phone=$("#iphone").value.trim(),rate=$("#irate").value.trim();if(!name||!email||!phone)return alert('Name, email and phone are required.');const btn=document.querySelector('#modal .btn.primary');btn.disabled=true;btn.textContent='Sending…';try{const r=await callStaffAdmin({action:'invite',name,email,phone,redirectTo:location.origin});const {error}=await sb.from('team').insert({name,email,phone,role:'Instructor',rate,auth_user_id:r.user_id,invite_status:'pending'});if(error)throw error;$("#modal").remove();await loadAll();alert('Instructor invitation sent.')}catch(e){alert(e.message)}finally{if(btn){btn.disabled=false;btn.textContent='Send invitation'}}}
async function resendInstructorInvite(id){const t=db.team.find(x=>String(x.id)===String(id));if(!t?.email)return;try{await callStaffAdmin({action:'invite',name:t.name,email:t.email,phone:t.phone,redirectTo:location.origin,resend:true});await sb.from('team').update({invite_status:'pending'}).eq('id',id);await loadAll();alert('Invitation sent.')}catch(e){alert(e.message)}}
async function toggleInstructorAccess(id,enable){const t=db.team.find(x=>String(x.id)===String(id));if(!t?.auth_user_id)return alert('No login is linked to this team member.');if(!confirm(enable?'Reactivate this instructor login?':'Deactivate this instructor login?'))return;try{await callStaffAdmin({action:enable?'activate':'deactivate',user_id:t.auth_user_id});await sb.from('team').update({invite_status:enable?'active':'disabled'}).eq('id',id);await loadAll()}catch(e){alert(e.message)}}
async function setFrontDeskDuty(userId,active){if(!isOwner())return;const {error}=await sb.rpc('set_front_desk_duty',{p_user_id:userId,p_active:active});if(error)return alert(error.message);alert(active?'Front Desk Duty is active for this instructor today.':'Front Desk Duty ended.');await loadAll();}
function teamModal(){modal('Add team member',`<div class="form"><div><label>Name</label><input id="tname"></div><div><label>Role</label><input id="trole" value="Staff"></div><div><label>Phone</label><input id="tphone"></div><div><label>Rate / commission</label><input id="trate"></div><div class="full"><button class="btn primary" onclick="addTeam()">Save</button></div></div>`)}
function editTeamMember(id){const t=db.team.find(x=>String(x.id)===String(id));if(!t)return;modal('Edit team member',`<div class="form"><div><label>Name</label><input id="tname" value="${esc(t.name||'')}"></div><div><label>Role</label><input id="trole" value="${esc(t.role||'')}"></div><div><label>Phone</label><input id="tphone" value="${esc(t.phone||'')}"></div><div><label>Rate / commission</label><input id="trate" value="${esc(t.rate||'')}"></div><div class="full"><button class="btn primary" onclick="saveTeamMember('${t.id}')">Save changes</button></div></div>`)}
async function addTeam(){const {error}=await sb.from('team').insert({name:$("#tname").value,role:$("#trole").value,phone:$("#tphone").value,rate:$("#trate").value,invite_status:'none'});if(error)return alert(error.message);$("#modal").remove();await loadAll()}
async function saveTeamMember(id){const {error}=await sb.from('team').update({name:$("#tname").value.trim(),role:$("#trole").value.trim(),phone:$("#tphone").value.trim(),rate:$("#trate").value.trim()}).eq('id',id);if(error)return alert(error.message);$("#modal").remove();await loadAll();alert('Team member updated.')}
function operations(){const ss=db.studio_settings[0]||{};const todayClasses=db.classes.filter(c=>c.class_date===today());const low=db.clients.filter(c=>Number(c.sessions||0)<=1);layout(`<div class="grid two"><div class="card"><h3>Booking rules</h3><div class="form"><div><label>Free cancellation (hours before)</label><input id="cancelHours" type="number" value="${ss.cancellation_hours??12}"></div><div><label>Booking closes (hours before)</label><input id="closeHours" type="number" value="${ss.booking_close_hours??1}"></div><div><label>Book up to (days ahead)</label><input id="aheadDays" type="number" value="${ss.booking_ahead_days??30}"></div><div><label>Late cancel deducts session</label><select id="lateDeduct"><option value="true" ${ss.late_cancel_deduct!==false?'selected':''}>Yes</option><option value="false" ${ss.late_cancel_deduct===false?'selected':''}>No</option></select></div><div><label>No-show deducts session</label><select id="noShowDeduct"><option value="true" ${ss.no_show_deduct!==false?'selected':''}>Yes</option><option value="false" ${ss.no_show_deduct===false?'selected':''}>No</option></select></div><div class="full"><button class="btn primary" onclick="saveStudioRules()">Save rules</button></div></div></div><div class="card"><h3>Announcements</h3><div class="toolbar"><button class="btn primary" onclick="announcementModal()">+ Announcement</button></div>${db.announcements.map(a=>`<div class="cart-row"><span><b>${esc(a.title)}</b><small>${esc(a.message)} · ${esc(a.audience||'Everyone')} · ${a.active===false?'Inactive':'Active'}</small></span><span><button class="btn small" onclick="announcementModal('${a.id}')">Edit</button> <button class="btn small" onclick="toggleAnnouncement('${a.id}',${a.active===false?'true':'false'})">${a.active===false?'Activate':'Deactivate'}</button> <button class="btn small danger" onclick="removeItem('announcements','${a.id}')">Delete</button></span></div>`).join('')||'<div class="empty">No announcements.</div>'}</div><div class="card"><h3>Promo codes</h3><div class="toolbar"><button class="btn primary" onclick="promoModal()">+ Promo code</button></div>${db.promo_codes.map(p=>`<div class="cart-row"><span><b>${esc(p.code)}</b><small>${p.discount_percent}% off · ${p.active?'Active':'Inactive'}</small></span><span><button class="btn small" onclick="promoModal('${p.id}')">Edit</button> <button class="btn small" onclick="togglePromo('${p.id}',${p.active?'false':'true'})">${p.active?'Deactivate':'Activate'}</button> <button class="btn small danger" onclick="removeItem('promo_codes','${p.id}')">Delete</button></span></div>`).join('')||'<div class="empty">No promo codes.</div>'}</div><div class="card"><h3>Studio alerts</h3><div class="cart-row"><span>Clients with ≤1 session</span><b>${low.length}</b></div><div class="cart-row"><span>Classes today</span><b>${todayClasses.length}</b></div><div class="cart-row"><span>Waitlisted bookings</span><b>${db.bookings.filter(b=>b.status==='waitlist').length}</b></div></div><div class="card"><h3>Data & reports</h3><p class="muted">Export your current studio data for reporting or backup.</p><button class="btn" onclick="exportData()">Export backup JSON</button> <button class="btn" onclick="exportClientsCSV()">Export clients CSV</button></div><div class="card"><h3>Audit log</h3>${db.audit_log.slice(-20).reverse().map(a=>`<div class="cart-row"><span><b>${esc(a.action)}</b><small>${esc(a.details||'')} · ${new Date(a.created_at).toLocaleString()}</small></span></div>`).join('')||'<div class="empty">Activity will appear here.</div>'}</div></div>`,`Operations`,`Rules, waitlists, promos, announcements, exports and audit trail`) }
async function saveStudioRules(){const row={id:1,cancellation_hours:+$('#cancelHours').value,booking_close_hours:+$('#closeHours').value,booking_ahead_days:+$('#aheadDays').value,late_cancel_deduct:$('#lateDeduct').value==='true',no_show_deduct:$('#noShowDeduct').value==='true'};const {error}=await sb.from('studio_settings').upsert(row);if(error)return alert(error.message);await loadAll();alert('Booking rules saved.')}
function announcementModal(id=''){const a=id?db.announcements.find(x=>String(x.id)===String(id)):null;modal(a?'Edit announcement':'New announcement',`<label>Title</label><input id="annTitle" value="${esc(a?.title||'')}"><label>Message</label><textarea id="annMsg">${esc(a?.message||'')}</textarea><label>Show to</label><select id="annAudience"><option ${(!a||a.audience==='Everyone'||!a.audience)?'selected':''}>Everyone</option><option ${a?.audience==='Clients'?'selected':''}>Clients</option><option ${a?.audience==='Instructors'?'selected':''}>Instructors</option></select><label>Status</label><select id="annActive"><option value="true" ${a?.active!==false?'selected':''}>Active</option><option value="false" ${a?.active===false?'selected':''}>Inactive</option></select><button class="btn primary full" onclick="${a?`saveAnnouncement('${a.id}')`:'addAnnouncement()'}">${a?'Save changes':'Publish'}</button>`)}
async function addAnnouncement(){const {error}=await sb.from('announcements').insert({title:$('#annTitle').value,message:$('#annMsg').value,audience:$('#annAudience').value,active:$('#annActive').value==='true',created_by:session.user.id});if(error)return alert(error.message);$('#modal').remove();await loadAll()}
async function saveAnnouncement(id){const {error}=await sb.from('announcements').update({title:$('#annTitle').value,message:$('#annMsg').value,audience:$('#annAudience').value,active:$('#annActive').value==='true'}).eq('id',id);if(error)return alert(error.message);$('#modal').remove();await loadAll();alert('Announcement updated.')}
async function toggleAnnouncement(id,active){const {error}=await sb.from('announcements').update({active}).eq('id',id);if(error)return alert(error.message);await loadAll()}
function promoModal(id=''){const p=id?db.promo_codes.find(x=>String(x.id)===String(id)):null;modal(p?'Edit promo code':'New promo code',`<label>Code</label><input id="promoCode" value="${esc(p?.code||'')}"><label>Discount %</label><input id="promoPct" type="number" min="0" max="100" value="${p?.discount_percent??''}"><label>Status</label><select id="promoActive"><option value="true" ${p?.active!==false?'selected':''}>Active</option><option value="false" ${p?.active===false?'selected':''}>Inactive</option></select><button class="btn primary full" onclick="${p?`savePromo('${p.id}')`:'addPromo()'}">${p?'Save changes':'Save'}</button>`)}
async function addPromo(){const {error}=await sb.from('promo_codes').insert({code:$('#promoCode').value.trim().toUpperCase(),discount_percent:+$('#promoPct').value,active:$('#promoActive').value==='true'});if(error)return alert(error.message);$('#modal').remove();await loadAll()}
async function savePromo(id){const {error}=await sb.from('promo_codes').update({code:$('#promoCode').value.trim().toUpperCase(),discount_percent:+$('#promoPct').value,active:$('#promoActive').value==='true'}).eq('id',id);if(error)return alert(error.message);$('#modal').remove();await loadAll();alert('Promo code updated.')}
async function togglePromo(id,active){const {error}=await sb.from('promo_codes').update({active}).eq('id',id);if(error)return alert(error.message);await loadAll()}

function exportData(){const blob=new Blob([JSON.stringify(db,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='core-theory-backup-'+today()+'.json';a.click();URL.revokeObjectURL(a.href)}function exportClientsCSV(){const rows=[['Name','Email','Phone','Package','Sessions','Expiry'],...db.clients.map(c=>[c.name,c.email,c.phone,c.package,c.sessions,c.expiry])];const csv=rows.map(r=>r.map(v=>'"'+String(v??'').replaceAll('"','""')+'"').join(',')).join('\n'),a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));a.download='core-theory-clients-'+today()+'.csv';a.click()}
function customSectionPage(id){const sec=db.custom_sections.find(x=>String(x.id)===String(id));if(!sec)return page='dashboard',render();const entries=db.custom_entries.filter(x=>String(x.section_id)===String(id));layout(`<div class="card"><div class="toolbar"><button class="btn primary" onclick="customEntryModal('${id}')">+ Add item</button><button class="btn" onclick="customSectionModal('${id}')">Edit section</button></div>${entries.map(e=>`<div class="cart-row"><span><b>${esc(e.title)}</b><small>${esc(e.notes||'')}</small></span><span><button class="btn small" onclick="customEntryModal('${id}','${e.id}')">Edit</button> <button class="btn small danger" onclick="removeItem('custom_entries','${e.id}')">Delete</button></span></div>`).join('')||'<div class="empty">No items yet.</div>'}</div>`,sec.name,'Custom Core Theory section')}
function customEntryModal(sectionId,entryId=''){const e=entryId?db.custom_entries.find(x=>String(x.id)===String(entryId)):null;modal(e?'Edit item':'Add item',`<label>Title</label><input id="ceTitle" value="${esc(e?.title||'')}"><label>Notes / details</label><textarea id="ceNotes">${esc(e?.notes||'')}</textarea><button class="btn primary full" onclick="${e?`saveCustomEntry('${e.id}')`:`addCustomEntry('${sectionId}')`}">${e?'Save changes':'Save'}</button>`)}
async function addCustomEntry(id){const {error}=await sb.from('custom_entries').insert({section_id:id,title:$('#ceTitle').value,notes:$('#ceNotes').value,created_by:session.user.id});if(error)return alert(error.message);$('#modal').remove();await loadAll()}
async function saveCustomEntry(id){const {error}=await sb.from('custom_entries').update({title:$('#ceTitle').value,notes:$('#ceNotes').value}).eq('id',id);if(error)return alert(error.message);$('#modal').remove();await loadAll();alert('Item updated.')}
function customSectionModal(id=''){const s=id?db.custom_sections.find(x=>String(x.id)===String(id)):null;modal(s?'Edit menu section':'Add menu section',`<label>Section name</label><input id="csName" value="${esc(s?.name||'')}" placeholder="Cleaning Checklist"><label>Icon</label><input id="csIcon" value="${esc(s?.icon||'•')}" maxlength="4"><label>Type</label><select id="csType">${['List','Notes','Checklist','Table'].map(x=>`<option ${x.toLowerCase()===String(s?.section_type||'list').toLowerCase()?'selected':''}>${x}</option>`).join('')}</select><button class="btn primary full" onclick="${s?`saveCustomSection('${s.id}')`:'addCustomSection()'}">${s?'Save changes':'Add to menu'}</button>`)}
async function addCustomSection(){const {error}=await sb.from('custom_sections').insert({name:$('#csName').value,icon:$('#csIcon').value||'•',section_type:$('#csType').value.toLowerCase(),visible_owner:true,sort_order:100});if(error)return alert(error.message);$('#modal').remove();await loadAll()}
async function saveCustomSection(id){const {error}=await sb.from('custom_sections').update({name:$('#csName').value,icon:$('#csIcon').value||'•',section_type:$('#csType').value.toLowerCase()}).eq('id',id);if(error)return alert(error.message);$('#modal').remove();await loadAll();alert('Section updated.')}

function settings(){const n=db.notification_settings[0]||{};layout(`<div class="grid two"><div class="card"><h3>Class level colors</h3>${db.class_levels.map(l=>`<div class="level-setting"><span>${esc(l.name)}</span><input type="color" value="${esc(l.color)}" onchange="changeLevelColor('${l.id}',this.value)"></div>`).join('')}</div><div class="card"><h3>Booking notifications</h3><p class="muted">Core Theory automatically queues a confirmation when a client books and a reminder for the night before.</p><div class="form"><div><label>Night-before reminder time</label><input id="nTime" type="time" value="${esc((n.reminder_time||'20:00').slice(0,5))}"></div><div><label>Time zone</label><input id="nZone" value="${esc(n.timezone||'Asia/Beirut')}"></div><div><label><input id="nEmailOn" type="checkbox" ${n.email_enabled!==false?'checked':''}> Email reminders</label></div><div><label><input id="nWaOn" type="checkbox" ${n.whatsapp_enabled?'checked':''}> WhatsApp reminders</label></div><div><label>Sender name</label><input id="nSender" value="${esc(n.sender_name||'Core Theory')}"></div><div><label>Sender email</label><input id="nEmail" type="email" value="${esc(n.sender_email||'')}" placeholder="bookings@yourdomain.com"></div><div class="full"><label>WhatsApp Business number</label><input id="nPhone" value="${esc(n.whatsapp_number||'')}" placeholder="+961..."></div><div class="full"><button class="btn primary" onclick="saveNotificationSettings()">Save notification settings</button></div></div><p class="warning">Email/WhatsApp delivery becomes live after a provider is connected. Until then, confirmations and reminders are safely queued with their scheduled send times.</p></div><div class="card"><h3>Menu & Custom Sections</h3><p class="muted">Create your own Owner menu pages for things like cleaning, equipment, suppliers or tasks.</p><button class="btn primary" onclick="customSectionModal()">+ Add Section</button>${db.custom_sections.map(x=>`<div class="cart-row"><span>${esc(x.icon||'•')} <b>${esc(x.name)}</b><small>${esc(x.section_type||'list')}</small></span><span><button class="btn small" onclick="customSectionModal('${x.id}')">Edit</button> <button class="btn small danger" onclick="removeItem('custom_sections','${x.id}')">Delete</button></span></div>`).join('')}</div><div class="card"><h3>App & account</h3><p class="muted">Core Theory is PWA-ready and can be added to a phone home screen from the browser.</p><button class="btn" onclick="setPasswordScreen()">Change password</button></div><div class="card"><h3>Notification queue</h3>${db.notification_queue.slice(0,10).map(q=>`<div class="cart-row"><span><b>${esc(q.kind)}</b><small>${esc(q.channel)} · ${new Date(q.scheduled_for).toLocaleString()}</small></span><span class="badge">${esc(q.status)}</span></div>`).join('')||'<div class="empty">No notifications queued yet.</div>'}</div></div>`,`Settings`,`Customize classes, reminders and account`) }
async function saveNotificationSettings(){const row={id:1,reminder_time:$("#nTime").value||'20:00',timezone:$("#nZone").value||'Asia/Beirut',email_enabled:$("#nEmailOn").checked,whatsapp_enabled:$("#nWaOn").checked,sender_name:$("#nSender").value.trim()||'Core Theory',sender_email:$("#nEmail").value.trim(),whatsapp_number:$("#nPhone").value.trim(),updated_at:new Date().toISOString()};const {error}=await sb.from('notification_settings').upsert(row);if(error)return alert(error.message);await loadAll();alert('Notification settings saved.')}async function changeLevelColor(id,color){const {error}=await sb.from('class_levels').update({color}).eq('id',id);if(error)return alert(error.message);await loadAll()}
function account(){layout(`<div class="card compact-card"><h3>${esc(profile?.full_name||'Instructor')}</h3><p>${esc(session.user.email)}</p><p class="muted">You can see only your assigned classes and the booked client names needed for attendance. Client lists, expenses, finance and other instructors’ schedules remain private.</p><button class="btn" onclick="setPasswordScreen()">Set / change password</button></div>`,`Account`,`Instructor access`)}
function clientModal(id=''){const c=id?db.clients.find(x=>String(x.id)===String(id)):null;modal(c?'Edit client':'Add client',`<div class="form"><div><label>Name</label><input id="cname" value="${esc(c?.name||'')}"></div><div><label>Phone</label><input id="cphone" value="${esc(c?.phone||'')}"></div><div><label>Email</label><input id="cemail" type="email" value="${esc(c?.email||'')}"></div><div class="full"><button class="btn primary" onclick="${c?`saveClient('${c.id}')`:'addClient()'}">${c?'Save changes':'Save'}</button></div></div>`)}
async function addClient(){const {error}=await sb.from('clients').insert({name:$("#cname").value.trim(),phone:$("#cphone").value.trim(),email:$("#cemail").value.trim(),sessions:0});if(error)return alert(error.message);$("#modal").remove();await loadAll()}
async function saveClient(id){const {error}=await sb.from('clients').update({name:$("#cname").value.trim(),phone:$("#cphone").value.trim(),email:$("#cemail").value.trim()}).eq('id',id);if(error)return alert(error.message);$("#modal").remove();await loadAll();alert('Client updated.')}
async function deleteClient(id){if(!confirm('Delete this client? This is only allowed if they have no bookings, sales or package orders.'))return;const {error}=await sb.rpc('owner_delete_client',{p_client_id:id});if(error)return alert(error.message);await loadAll();alert('Client deleted.')}

function modal(title,body){$("#modal")?.remove();document.body.insertAdjacentHTML('beforeend',`<div class="modal-wrap" id="modal"><div class="modal"><div class="row modal-head"><h2>${title}</h2><button class="btn" onclick="$('#modal').remove()">×</button></div>${body}</div></div>`)}async function removeItem(table,id){if(!isOwner())return;if(!confirm('Delete this item?'))return;const {error}=await sb.from(table).delete().eq('id',id);if(error)return alert(error.message);await loadAll()}
async function init(){const recovery=location.hash.includes('type=recovery')||location.hash.includes('type=invite')||location.search.includes('type=recovery')||location.search.includes('type=invite');const {data}=await sb.auth.getSession();session=data.session;sb.auth.onAuthStateChange(async(event,s)=>{session=s;if(event==='PASSWORD_RECOVERY')return setPasswordScreen();if(!s)return authScreen()});if(!session)return authScreen();if(recovery)return setPasswordScreen();await loadAll();if('serviceWorker'in navigator)navigator.serviceWorker.register('./service-worker.js').catch(()=>{})}

// ================= CORE THEORY V8 OPERATIONS =================

// Birthday required for every new client account.
function signupScreen(msg=""){$("#app").innerHTML=`<div class="auth-shell"><div class="auth-card"><div class="auth-brand">CORE THEORY<small>CLIENT ACCOUNT</small></div><h2>Create account</h2><form id="signupForm"><label>Full name</label><input id="suName" required><label>Birthday</label><input id="suBirthday" type="date" required><label>Email</label><input id="suEmail" type="email" required><label>Country / calling code</label><select id="suCountry" required>${countryOptions()}</select><label>Phone number</label><input id="suPhone" type="tel" placeholder="e.g. 70123456" required><small class="muted">Choose your country first. Core Theory saves the full international number.</small><label>Password</label><input id="suPass" type="password" minlength="8" required><button class="btn primary full" type="submit">Create account</button><div class="auth-error" id="authError">${esc(msg)}</div></form><button class="link-btn" onclick="authScreen()">← Back to sign in</button></div></div>`;$("#signupForm").onsubmit=signup}
async function signup(e){e.preventDefault();const code=$("#suCountry").value.trim(),raw=$("#suPhone").value.trim().replace(/^0+/,'').replace(/\s+/g,''),birthday=$("#suBirthday").value;if(!birthday)return $("#authError").textContent="Birthday is required.";if(!code)return $("#authError").textContent="Please choose a country with a calling code.";if(!raw)return $("#authError").textContent="Phone number is required.";const phone=code+raw;const {error}=await sb.auth.signUp({email:$("#suEmail").value.trim(),password:$("#suPass").value,options:{emailRedirectTo:location.origin,data:{full_name:$("#suName").value.trim(),birthday,phone,phone_country_code:code}}});if(error)return $("#authError").textContent=error.message;authScreen("Account created. Check your email to confirm, then sign in.")}

function monthStart(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-01`}
function salesActive(){return db.sales.filter(s=>!s.voided_at)}
function saleItems(s){return Array.isArray(s.items)?s.items:[]}
function revenueForScope(scope){return salesActive().reduce((sum,s)=>sum+saleItems(s).reduce((a,i)=>{if(i.kind!=='membership')return a;const m=db.memberships.find(x=>String(x.id)===String(i.id));return a+((m?.studio_scope||'Both')===scope?Number(i.price||0):0)},0),0)}
function occupancyStats(){const past=db.classes.filter(c=>!c.cancelled&&new Date(`${c.class_date}T${String(c.class_time||'00:00').slice(0,8)}`)<new Date());const cap=past.reduce((a,c)=>a+Number(c.capacity||0),0),booked=past.reduce((a,c)=>a+db.bookings.filter(b=>String(b.class_id)===String(c.id)&&['checked_in','no_show','booked'].includes(b.status)).length,0);return {booked,cap,pct:cap?Math.round(booked/cap*100):0}}

function dashboard(){const activeSales=salesActive(),rev=activeSales.reduce((a,s)=>a+Number(s.total||0),0),exp=db.expenses.reduce((a,e)=>a+Number(e.amount||0),0),todayRev=activeSales.filter(s=>String(s.created_at||'').slice(0,10)===today()).reduce((a,s)=>a+Number(s.total||0),0),monthRev=activeSales.filter(s=>String(s.created_at||'').slice(0,10)>=monthStart()).reduce((a,s)=>a+Number(s.total||0),0),monthExp=db.expenses.filter(e=>String(e.expense_date||'')>=monthStart()).reduce((a,e)=>a+Number(e.amount||0),0),pending=db.package_orders.filter(o=>o.status==='pending').length,low=db.clients.filter(c=>Number(c.sessions||0)<=1).length,expiring=db.clients.filter(c=>c.expiry&&c.expiry>=today()&&c.expiry<=dateISO(new Date(Date.now()+7*86400000))).length,occ=occupancyStats();layout(`<div class="grid kpis"><div class="card kpi"><div class="label">Revenue today</div><div class="value">${money(todayRev)}</div></div><div class="card kpi"><div class="label">Revenue this month</div><div class="value">${money(monthRev)}</div></div><div class="card kpi"><div class="label">Month profit</div><div class="value">${money(monthRev-monthExp)}</div></div><div class="card kpi"><div class="label">Occupancy</div><div class="value">${occ.pct}%</div></div></div><div class="spacer"></div><div class="grid three"><div class="card"><h3>Studio alerts</h3><div class="cart-row"><span>Pending payments</span><b>${pending}</b></div><div class="cart-row"><span>Clients with ≤1 session</span><b>${low}</b></div><div class="cart-row"><span>Packages expiring in 7 days</span><b>${expiring}</b></div><div class="cart-row"><span>Low-stock products</span><b>${db.products.filter(p=>Number(p.stock||0)<=Number(p.minimum_stock||0)).length}</b></div></div><div class="card"><h3>Revenue mix</h3><div class="cart-row"><span>Pilates</span><b>${money(revenueForScope('Pilates'))}</b></div><div class="cart-row"><span>Megacore</span><b>${money(revenueForScope('Megacore'))}</b></div><div class="cart-row"><span>Both packages</span><b>${money(revenueForScope('Both'))}</b></div></div><div class="card"><h3>Totals</h3><div class="cart-row"><span>All revenue</span><b>${money(rev)}</b></div><div class="cart-row"><span>All expenses</span><b>${money(exp)}</b></div><div class="cart-row"><span>Estimated profit</span><b>${money(rev-exp)}</b></div></div></div><div class="spacer"></div><div class="card"><h3>Today's classes</h3>${db.classes.filter(c=>c.class_date===today()&&!c.cancelled).map(classCard).join('')||'<div class="empty">No classes today.</div>'}</div>`,`Dashboard`,`Studio performance, alerts and today's operations`)}

function clientProfile(id,tab='overview'){const c=db.clients.find(x=>String(x.id)===String(id));if(!c)return;const bookings=db.bookings.filter(b=>String(b.client_id)===String(id)),packages=db.client_packages.filter(p=>String(p.client_id)===String(id)).sort((a,b)=>String(b.purchased_at||'').localeCompare(String(a.purchased_at||''))),payments=db.sales.filter(s=>String(s.client_id)===String(id)).sort((a,b)=>String(b.created_at||'').localeCompare(String(a.created_at||''))),upcoming=bookings.map(b=>({b,cl:db.classes.find(x=>String(x.id)===String(b.class_id))})).filter(x=>x.cl&&x.b.status!=='cancelled'&&new Date(`${x.cl.class_date}T${String(x.cl.class_time||'00:00').slice(0,8)}`)>=new Date()).sort((a,b)=>(a.cl.class_date+a.cl.class_time).localeCompare(b.cl.class_date+b.cl.class_time))[0],visits=bookings.filter(b=>b.status==='checked_in').length;const tabs=`<div class="schedule-tabs"><button class="tab ${tab==='overview'?'active':''}" onclick="clientProfile('${id}','overview')">Overview</button><button class="tab ${tab==='packages'?'active':''}" onclick="clientProfile('${id}','packages')">Packages</button><button class="tab ${tab==='attendance'?'active':''}" onclick="clientProfile('${id}','attendance')">Attendance</button><button class="tab ${tab==='payments'?'active':''}" onclick="clientProfile('${id}','payments')">Payments</button><button class="tab ${tab==='notes'?'active':''}" onclick="clientProfile('${id}','notes')">Notes</button></div>`;let body='';if(tab==='overview')body=`<div class="grid two"><div><p><b>Email:</b> ${esc(c.email||'—')}</p><p><b>Phone:</b> ${esc(c.phone||'—')}</p><p><b>Birthday:</b> ${esc(c.birthday||'—')}</p><p><b>Total visits:</b> ${visits}</p></div><div><p><b>Current package:</b> ${esc(c.package||'—')}</p><p><b>Sessions:</b> ${c.sessions??0}</p><p><b>Expiry:</b> ${esc(c.expiry||'—')}</p><p><b>Next class:</b> ${upcoming?`${esc(upcoming.cl.class_type)} · ${esc(upcoming.cl.class_date)}`:'—'}</p></div></div><div class="toolbar"><button class="btn" onclick="clientModal('${id}')">Edit client</button><button class="btn" onclick="sellMembership('${id}')">Add package</button><button class="btn" onclick="freezeClientModal('${id}')">Freeze package</button></div>`;if(tab==='packages')body=packages.map(p=>`<div class="cart-row"><span><b>${esc(p.package_name)}</b><small>${esc(p.status)} · ${p.sessions_remaining===999?'Unlimited':p.sessions_remaining+' / '+p.sessions_total+' left'} · ${esc(p.studio_scope||'Both')} · ${p.expiry||'No expiry'}</small></span><span>${p.price_paid!=null?money(p.price_paid):''}</span></div>`).join('')||'<div class="empty">No package history.</div>';if(tab==='attendance')body=bookings.map(b=>{const cl=db.classes.find(x=>String(x.id)===String(b.class_id));return `<div class="cart-row"><span><b>${esc(cl?.class_type||'Class')}</b><small>${esc(cl?.class_date||'')} · ${esc(cl?.studio_type||'')}</small></span><span class="badge">${esc(b.status)}</span></div>`}).join('')||'<div class="empty">No attendance history.</div>';if(tab==='payments')body=payments.map(s=>`<div class="cart-row"><span><b>${esc(saleWhat(s))}</b><small>${new Date(s.created_at).toLocaleString()} · ${esc(s.payment_method||'')}${s.voided_at?' · VOIDED':''}</small></span><span><b>${money(s.total)}</b> <button class="btn small" onclick="printReceipt('${s.id}')">Receipt</button></span></div>`).join('')||'<div class="empty">No payment history.</div>';if(tab==='notes')body=`<label>Internal notes</label><textarea id="clientInternalNotes">${esc(c.internal_notes||'')}</textarea><button class="btn primary" onclick="saveClientNotes('${id}')">Save notes</button>`;modal(esc(c.name),tabs+`<div style="margin-top:14px">${body}</div>`)}
function clientHistory(id){clientProfile(id,'overview')}
async function saveClientNotes(id){const {error}=await sb.from('clients').update({internal_notes:$("#clientInternalNotes").value}).eq('id',id);if(error)return alert(error.message);$("#modal")?.remove();await loadAll();alert('Notes saved.')}
function freezeClientModal(id){modal('Freeze package',`<label>Freeze for how many days?</label><input id="freezeDays" type="number" min="1" value="7"><button class="btn primary full" onclick="freezeClient('${id}')">Freeze & extend expiry</button>`)}
async function freezeClient(id){const days=Number($("#freezeDays").value);if(!Number.isFinite(days)||days<1)return alert('Enter a valid number of days.');const {error}=await sb.rpc('owner_freeze_client_package',{p_client_id:id,p_days:days});if(error)return alert(error.message);$("#modal")?.remove();await loadAll();alert('Package frozen and expiry extended.')}

function clientModal(id=''){const c=id?db.clients.find(x=>String(x.id)===String(id)):null;modal(c?'Edit client':'Add client',`<div class="form"><div><label>Name</label><input id="cname" value="${esc(c?.name||'')}"></div><div><label>Birthday</label><input id="cbirthday" type="date" value="${esc(c?.birthday||'')}"></div><div><label>Phone</label><input id="cphone" value="${esc(c?.phone||'')}"></div><div><label>Email</label><input id="cemail" type="email" value="${esc(c?.email||'')}"></div><div class="full"><button class="btn primary" onclick="${c?`saveClient('${c.id}')`:'addClient()'}">${c?'Save changes':'Save'}</button></div></div>`)}
async function addClient(){const {error}=await sb.from('clients').insert({name:$("#cname").value.trim(),birthday:$("#cbirthday").value||null,phone:$("#cphone").value.trim(),email:$("#cemail").value.trim(),sessions:0});if(error)return alert(error.message);$("#modal").remove();await loadAll()}
async function saveClient(id){const {error}=await sb.from('clients').update({name:$("#cname").value.trim(),birthday:$("#cbirthday").value||null,phone:$("#cphone").value.trim(),email:$("#cemail").value.trim()}).eq('id',id);if(error)return alert(error.message);$("#modal").remove();await loadAll();alert('Client updated.')}

function openClass(id){const c=db.classes.find(x=>String(x.id)===String(id));if(!c)return;const bs=activeBookings(id),checked=bs.filter(b=>b.status==='checked_in').length,noShows=bs.filter(b=>b.status==='no_show').length,wait=bs.filter(b=>b.status==='waitlist').length,pending=bs.filter(b=>b.payment_status==='pending').length;const rows=bs.map(b=>{const roster=db.roster?.find(r=>String(r.booking_id)===String(b.id));const cl=isOwner()?db.clients.find(x=>String(x.id)===String(b.client_id)):null;const clientName=cl?.name||roster?.client_name||'Client';return `<div class="booking-person"><span><b>${esc(clientName)}</b><small>${esc(b.status)} · ${b.payment_status==='pending'?'<b>Payment Pending</b>':esc(b.payment_status||'paid')}</small></span>${isStaff()?`<span>${b.status==='booked'?`<button class="btn small" onclick="checkIn('${b.id}')">Check in</button>`:''}<button class="btn small" onclick="setBookingStatus('${b.id}','no_show')">No-show</button></span>`:''}</div>`}).join('');modal(`${esc(c.class_type)} · ${formatTime((c.class_time||'00:00').slice(0,5))}`,`<p><span class="badge" style="background:${levelColor(c.level)}">${esc(c.level||'Open Level')}</span> ${esc(c.studio_type||'Pilates')} · ${esc(c.instructor||'')}</p><div class="grid three"><div class="card kpi"><div class="label">Booked</div><div class="value">${bs.length}</div></div><div class="card kpi"><div class="label">Checked in</div><div class="value">${checked}</div></div><div class="card kpi"><div class="label">Waitlist</div><div class="value">${wait}</div></div></div><p class="muted">No-shows: ${noShows} · Payment pending: ${pending} · Capacity: ${c.capacity||0}</p>${rows||'<div class="empty">No bookings yet.</div>'}${isOwner()?`<div class="toolbar"><button class="btn primary" onclick="addBookingModal('${c.id}')">+ Add client</button><button class="btn" onclick="$('#modal').remove();editClassModal('${c.id}')">Edit class</button><button class="btn" onclick="substituteClassModal('${c.id}')">Substitute</button></div>`:''}`)}
function substituteClassModal(classId){const c=db.classes.find(x=>String(x.id)===String(classId));const instructors=db.team.filter(t=>t.role==='Instructor'&&t.auth_user_id);modal('Assign substitute',`<p>${esc(c?.class_type||'Class')} · ${esc(c?.class_date||'')}</p><label>Substitute instructor</label><select id="subInstructor"><option value="">Remove substitute</option>${instructors.map(t=>`<option value="${t.auth_user_id}">${esc(t.name)}</option>`).join('')}</select><button class="btn primary full" onclick="saveSubstitute('${classId}')">Save substitute</button>`)}
async function saveSubstitute(classId){const uid=$("#subInstructor").value||null;const {error}=await sb.rpc('set_class_substitute',{p_class_id:classId,p_substitute_user_id:uid});if(error)return alert(error.message);$("#modal")?.remove();await loadAll();alert(uid?'Substitute assigned.':'Substitute removed.')}

function printReceipt(id){const s=db.sales.find(x=>String(x.id)===String(id));if(!s)return;const c=db.clients.find(x=>String(x.id)===String(s.client_id));const w=window.open('','_blank','width=520,height=700');if(!w)return alert('Allow pop-ups to print the receipt.');w.document.write(`<html><head><title>Core Theory Receipt</title><style>body{font-family:Arial;padding:32px;color:#222}h1{letter-spacing:2px}.row{display:flex;justify-content:space-between;border-bottom:1px solid #ddd;padding:9px 0}.muted{color:#666}</style></head><body><h1>CORE THEORY</h1><p class="muted">Payment receipt</p><div class="row"><span>Client</span><b>${esc(c?.name||'Walk-in')}</b></div><div class="row"><span>Paid for</span><b>${esc(saleWhat(s))}</b></div><div class="row"><span>Amount</span><b>${money(s.total)}</b></div><div class="row"><span>Method</span><b>${esc(s.payment_method||'')}</b></div><div class="row"><span>Date</span><b>${new Date(s.created_at).toLocaleString()}</b></div><div class="row"><span>Transaction</span><b>${esc(String(s.id).slice(0,8).toUpperCase())}</b></div><script>window.onload=()=>window.print()<\/script></body></html>`);w.document.close()}

function finance(){const active=salesActive(),rev=active.reduce((a,s)=>a+Number(s.total||0),0),exp=db.expenses.reduce((a,e)=>a+Number(e.amount||0),0),pending=db.package_orders.filter(o=>o.status==='pending');layout(`<div class="grid three"><div class="card kpi"><div class="label">Revenue</div><div class="value">${money(rev)}</div></div><div class="card kpi"><div class="label">Expenses</div><div class="value">${money(exp)}</div></div><div class="card kpi"><div class="label">Profit</div><div class="value">${money(rev-exp)}</div></div></div><div class="spacer"></div><div class="card"><h3>Pending package orders</h3>${pending.length?pending.map(o=>{const c=db.clients.find(x=>String(x.id)===String(o.client_id)),m=db.memberships.find(x=>String(x.id)===String(o.membership_id));return `<div class="booking-person"><span><b>${esc(c?.name||'Client')}</b><small>${esc(m?.name||'Package')} · ${money(o.amount)}${o.coupon_code?` · Coupon ${esc(o.coupon_code)}`:''} · Payment Pending</small></span><span><button class="btn small" onclick="ownerChangePendingPackage('${o.id}')">Change Package</button> <button class="btn small primary" onclick="ownerCollectPendingPayment('${o.id}')">Collect Payment</button> <button class="btn small danger" onclick="ownerCancelPendingOrder('${o.id}')">Cancel</button></span></div>`}).join(''):'<div class="empty">No pending package orders.</div>'}</div><div class="spacer"></div><div class="card"><h3>End-of-day reconciliation</h3><div class="toolbar"><input id="reconDate" type="date" value="${today()}" onchange="renderReconciliation()"><button class="btn" onclick="renderReconciliation()">Refresh</button></div><div id="reconBox"></div></div><div class="spacer"></div><div class="card"><div class="toolbar"><h3 style="margin:0">Payment history</h3><input id="paymentHistorySearch" placeholder="Search client, item or payment method…" oninput="renderPaymentHistory(this.value)" style="max-width:340px"></div><div id="paymentHistoryRows"></div></div>`,`Finance`,`Owner-only payments, corrections and reconciliation`);renderReconciliation();renderPaymentHistory('')}
function renderReconciliation(){const box=$("#reconBox");if(!box)return;const d=$("#reconDate")?.value||today(),rows=salesActive().filter(s=>String(s.created_at||'').slice(0,10)===d),methods=['Cash','Card','Whish','Transfer'];box.innerHTML=`<div class="grid three">${methods.map(m=>`<div class="card kpi"><div class="label">${m}</div><div class="value">${money(rows.filter(s=>s.payment_method===m).reduce((a,s)=>a+Number(s.total||0),0))}</div></div>`).join('')}</div><h3 style="margin-top:16px">By collector</h3>${Object.entries(rows.reduce((o,s)=>{const k=saleCollector(s);o[k]=(o[k]||0)+Number(s.total||0);return o},{})).map(([k,v])=>`<div class="cart-row"><span>${esc(k)}</span><b>${money(v)}</b></div>`).join('')||'<div class="empty">No payments on this date.</div>'}`}

function renderPaymentHistory(query=''){const box=$("#paymentHistoryRows");if(!box)return;const q=String(query||'').trim().toLowerCase(),rows=[...db.sales].sort((a,b)=>String(b.created_at||'').localeCompare(String(a.created_at||''))).filter(s=>{const hay=[saleClientName(s),saleWhat(s),s.payment_method,s.total,saleCollector(s)].join(' ').toLowerCase();return !q||hay.includes(q)});box.innerHTML=rows.length?`<div style="overflow:auto"><table><thead><tr><th>Date / time</th><th>Client</th><th>Paid for</th><th>Method</th><th>Amount</th><th>Recorded by</th><th></th></tr></thead><tbody>${rows.map(s=>`<tr><td>${s.created_at?new Date(s.created_at).toLocaleString():'—'}${s.edited_at?'<div class="muted">Edited</div>':''}</td><td><b>${esc(saleClientName(s))}</b></td><td>${esc(saleWhat(s))}</td><td>${esc(s.payment_method||'—')}</td><td><b>${money(s.total)}</b>${s.voided_at?'<div class="muted">Voided</div>':''}</td><td>${esc(saleCollector(s))}</td><td><button class="btn small" onclick="printReceipt('${s.id}')">Receipt</button> ${s.voided_at?'<span class="badge">Voided</span>':`<button class="btn small" onclick="editSaleModal('${s.id}')">Edit</button> <button class="btn small danger" onclick="voidSale('${s.id}')">Void</button>`}</td></tr>`).join('')}</tbody></table></div>`:'<div class="empty">No matching payments.</div>'}

function promoModal(id=''){const p=id?db.promo_codes.find(x=>String(x.id)===String(id)):null;modal(p?'Edit promo code':'New promo code',`<div class="form"><div><label>Code</label><input id="promoCode" value="${esc(p?.code||'')}"></div><div><label>Discount type</label><select id="promoType"><option value="percent" ${p?.discount_type!=='fixed'?'selected':''}>Percentage</option><option value="fixed" ${p?.discount_type==='fixed'?'selected':''}>Fixed amount</option></select></div><div><label>Discount value</label><input id="promoValue" type="number" min="0" step=".01" value="${p?.discount_value??p?.discount_percent??''}"></div><div><label>Valid for</label><select id="promoScope"><option ${(!p||p.studio_scope==='Both'||!p.studio_scope)?'selected':''}>Both</option><option ${p?.studio_scope==='Pilates'?'selected':''}>Pilates</option><option ${p?.studio_scope==='Megacore'?'selected':''}>Megacore</option></select></div><div><label>Starts</label><input id="promoStart" type="date" value="${p?.starts_at||''}"></div><div><label>Ends</label><input id="promoEnd" type="date" value="${p?.ends_at||''}"></div><div><label>Maximum total uses</label><input id="promoMax" type="number" min="1" value="${p?.max_uses??''}" placeholder="No limit"></div><div><label><input id="promoOneUse" type="checkbox" ${p?.one_use_per_client!==false?'checked':''}> One use per client</label><small class="muted">Turn this off if the same client may use the coupon more than once.</small></div><div class="full"><label>Specific membership (optional)</label><select id="promoMembership"><option value="">All memberships in scope</option>${sortedMemberships().map(m=>`<option value="${m.id}" ${String(p?.membership_id||'')===String(m.id)?'selected':''}>${esc(m.name)}</option>`).join('')}</select></div><div class="full"><label>Status</label><select id="promoActive"><option value="true" ${p?.active!==false?'selected':''}>Active</option><option value="false" ${p?.active===false?'selected':''}>Inactive</option></select></div><div class="full"><button class="btn primary" onclick="${p?`savePromo('${p.id}')`:'addPromo()'}">${p?'Save changes':'Save'}</button></div></div>`)}
function promoPayload(){return {code:$('#promoCode').value.trim().toUpperCase(),discount_type:$('#promoType').value,discount_value:+$('#promoValue').value,discount_percent:$('#promoType').value==='percent'?+$('#promoValue').value:0,studio_scope:$('#promoScope').value,starts_at:$('#promoStart').value||null,ends_at:$('#promoEnd').value||null,max_uses:$('#promoMax').value?+$('#promoMax').value:null,one_use_per_client:$('#promoOneUse').checked,membership_id:$('#promoMembership').value||null,active:$('#promoActive').value==='true'}}
async function addPromo(){const {error}=await sb.from('promo_codes').insert(promoPayload());if(error)return alert(error.message);$('#modal').remove();await loadAll()}
async function savePromo(id){const {error}=await sb.from('promo_codes').update(promoPayload()).eq('id',id);if(error)return alert(error.message);$('#modal').remove();await loadAll();alert('Promo code updated.')}

function eventModal(id=''){const e=id?db.studio_events.find(x=>String(x.id)===String(id)):null;modal(e?'Edit event':'New event',`<div class="form"><div><label>Event name</label><input id="eventTitle" value="${esc(e?.title||'')}" placeholder="Bring a Friend"></div><div><label>Type</label><select id="eventType"><option value="guest_pass" ${e?.event_type==='guest_pass'?'selected':''}>Free guest pass</option><option value="free_session" ${e?.event_type==='free_session'?'selected':''}>Free session</option><option value="announcement" ${e?.event_type==='announcement'?'selected':''}>Announcement only</option></select></div><div><label>Starts</label><input id="eventStart" type="date" value="${e?.start_date||today()}"></div><div><label>Ends</label><input id="eventEnd" type="date" value="${e?.end_date||today()}"></div><div><label>Studio</label><select id="eventScope"><option ${(!e||e.studio_scope==='Both')?'selected':''}>Both</option><option ${e?.studio_scope==='Pilates'?'selected':''}>Pilates</option><option ${e?.studio_scope==='Megacore'?'selected':''}>Megacore</option></select></div><div><label>Audience</label><select id="eventAudience"><option ${(!e||e.audience==='Clients')?'selected':''}>Clients</option><option ${e?.audience==='Everyone'?'selected':''}>Everyone</option></select></div><div><label>Maximum claims per client</label><input id="eventMax" type="number" min="1" value="${e?.max_claims_per_client??1}"></div><div><label>Status</label><select id="eventActive"><option value="true" ${e?.active!==false?'selected':''}>Active</option><option value="false" ${e?.active===false?'selected':''}>Inactive</option></select></div><div class="full"><label>Description</label><textarea id="eventDescription" placeholder="Bring one friend for free to any eligible class.">${esc(e?.description||'')}</textarea></div><div class="full"><button class="btn primary" onclick="${e?`saveEvent('${e.id}')`:'addEvent()'}">${e?'Save changes':'Create event'}</button></div></div>`)}
function eventPayload(){return {title:$('#eventTitle').value.trim(),description:$('#eventDescription').value.trim(),event_type:$('#eventType').value,start_date:$('#eventStart').value,end_date:$('#eventEnd').value,studio_scope:$('#eventScope').value,audience:$('#eventAudience').value,max_claims_per_client:+$('#eventMax').value||1,active:$('#eventActive').value==='true'}}
async function addEvent(){const p=eventPayload();if(!p.title)return alert('Enter an event name.');const {error}=await sb.from('studio_events').insert({...p,created_by:session.user.id});if(error)return alert(error.message);$('#modal').remove();await loadAll()}
async function saveEvent(id){const {error}=await sb.from('studio_events').update(eventPayload()).eq('id',id);if(error)return alert(error.message);$('#modal').remove();await loadAll();alert('Event updated.')}
async function toggleEvent(id,active){const {error}=await sb.from('studio_events').update({active}).eq('id',id);if(error)return alert(error.message);await loadAll()}

function operations(){const ss=db.studio_settings[0]||{},low=db.clients.filter(c=>Number(c.sessions||0)<=1),expiring=db.clients.filter(c=>c.expiry&&c.expiry>=today()&&c.expiry<=dateISO(new Date(Date.now()+7*86400000))),unassigned=db.classes.filter(c=>c.class_date>=today()&&!c.cancelled&&!c.instructor_user_id),occ=occupancyStats(),methodTotals=['Cash','Card','Whish','Transfer'].map(m=>[m,salesActive().filter(s=>s.payment_method===m).reduce((a,s)=>a+Number(s.total||0),0)]);layout(`<div class="grid two"><div class="card"><h3>Booking rules</h3><div class="form"><div><label>Free cancellation (hours before)</label><input id="cancelHours" type="number" value="${ss.cancellation_hours??12}"></div><div><label>Booking closes (hours before)</label><input id="closeHours" type="number" value="${ss.booking_close_hours??1}"></div><div><label>Book up to (days ahead)</label><input id="aheadDays" type="number" value="${ss.booking_ahead_days??30}"></div><div><label>Late cancel deducts session</label><select id="lateDeduct"><option value="true" ${ss.late_cancel_deduct!==false?'selected':''}>Yes</option><option value="false" ${ss.late_cancel_deduct===false?'selected':''}>No</option></select></div><div><label>No-show deducts session</label><select id="noShowDeduct"><option value="true" ${ss.no_show_deduct!==false?'selected':''}>Yes</option><option value="false" ${ss.no_show_deduct===false?'selected':''}>No</option></select></div><div class="full"><button class="btn primary" onclick="saveStudioRules()">Save rules</button></div></div></div><div class="card"><h3>Studio alerts</h3><div class="cart-row"><span>Pending payments</span><b>${db.package_orders.filter(o=>o.status==='pending').length}</b></div><div class="cart-row"><span>Clients with ≤1 session</span><b>${low.length}</b></div><div class="cart-row"><span>Packages expiring in 7 days</span><b>${expiring.length}</b></div><div class="cart-row"><span>Low-stock products</span><b>${db.products.filter(p=>Number(p.stock||0)<=Number(p.minimum_stock||0)).length}</b></div><div class="cart-row"><span>Classes without instructor</span><b>${unassigned.length}</b></div><div class="cart-row"><span>Waitlisted bookings</span><b>${db.bookings.filter(b=>b.status==='waitlist').length}</b></div></div><div class="card"><h3>Reports</h3><div class="cart-row"><span>Overall occupancy</span><b>${occ.pct}%</b></div><div class="cart-row"><span>Pilates revenue</span><b>${money(revenueForScope('Pilates'))}</b></div><div class="cart-row"><span>Megacore revenue</span><b>${money(revenueForScope('Megacore'))}</b></div>${methodTotals.map(([m,v])=>`<div class="cart-row"><span>${m} revenue</span><b>${money(v)}</b></div>`).join('')}<button class="btn" onclick="exportData()">Export backup JSON</button> <button class="btn" onclick="exportClientsCSV()">Export clients CSV</button></div><div class="card"><h3>Events & Specials</h3><div class="toolbar"><button class="btn primary" onclick="eventModal()">+ Event</button></div>${db.studio_events.map(e=>`<div class="cart-row"><span><b>${esc(e.title)}</b><small>${esc(e.event_type)} · ${esc(e.start_date)} → ${esc(e.end_date)} · ${esc(e.studio_scope)} · ${e.active?'Active':'Inactive'}</small><small>${esc(e.description||'')}</small></span><span><button class="btn small" onclick="eventModal('${e.id}')">Edit</button> <button class="btn small" onclick="toggleEvent('${e.id}',${e.active?'false':'true'})">${e.active?'Deactivate':'Activate'}</button> <button class="btn small danger" onclick="removeItem('studio_events','${e.id}')">Delete</button></span></div>`).join('')||'<div class="empty">No events yet.</div>'}</div><div class="card"><h3>Announcements</h3><div class="toolbar"><button class="btn primary" onclick="announcementModal()">+ Announcement</button></div>${db.announcements.map(a=>`<div class="cart-row"><span><b>${esc(a.title)}</b><small>${esc(a.message)} · ${esc(a.audience||'Everyone')} · ${a.active===false?'Inactive':'Active'}</small></span><span><button class="btn small" onclick="announcementModal('${a.id}')">Edit</button> <button class="btn small" onclick="toggleAnnouncement('${a.id}',${a.active===false?'true':'false'})">${a.active===false?'Activate':'Deactivate'}</button> <button class="btn small danger" onclick="removeItem('announcements','${a.id}')">Delete</button></span></div>`).join('')||'<div class="empty">No announcements.</div>'}</div><div class="card"><h3>Promo codes</h3><div class="toolbar"><button class="btn primary" onclick="promoModal()">+ Promo code</button></div>${db.promo_codes.map(p=>`<div class="cart-row"><span><b>${esc(p.code)}</b><small>${p.discount_type==='fixed'?money(p.discount_value):`${p.discount_value??p.discount_percent}% off`} · ${esc(p.studio_scope||'Both')} · ${p.one_use_per_client!==false?'One use/client':'Repeat allowed'} · ${p.active?'Active':'Inactive'}</small></span><span><button class="btn small" onclick="promoModal('${p.id}')">Edit</button> <button class="btn small" onclick="togglePromo('${p.id}',${p.active?'false':'true'})">${p.active?'Deactivate':'Activate'}</button> <button class="btn small danger" onclick="removeItem('promo_codes','${p.id}')">Delete</button></span></div>`).join('')||'<div class="empty">No promo codes.</div>'}</div><div class="card"><h3>Audit log</h3>${db.audit_log.slice(-20).reverse().map(a=>`<div class="cart-row"><span><b>${esc(a.action)}</b><small>${esc(a.details||'')} · ${new Date(a.created_at).toLocaleString()}</small></span></div>`).join('')||'<div class="empty">Activity will appear here.</div>'}</div></div>`,`Operations`,`Alerts, reports, coupons, events and announcements`)}


function clienthome(){const c=myClient(),packages=db.client_packages.filter(p=>String(p.client_id)===String(c?.id)),active=packages.find(p=>p.status==='active'),upcomingPkg=packages.find(p=>p.status==='upcoming'),rewards=db.client_rewards.filter(r=>String(r.client_id)===String(c?.id)&&r.status==='active'&&r.sessions_remaining>0&&r.valid_until>=today()),birthday=rewards.find(r=>r.reward_type==='birthday'),events=db.studio_events.filter(e=>e.active&&e.start_date<=today()&&e.end_date>=today()&&(e.audience==='Clients'||e.audience==='Everyone')),mine=db.bookings.filter(b=>String(b.client_id)===String(c?.id)&&!['cancelled','no_show'].includes(b.status)),upcoming=mine.map(b=>({b,cl:db.classes.find(x=>String(x.id)===String(b.class_id))})).filter(x=>x.cl&&!x.cl.cancelled&&new Date(`${x.cl.class_date}T${String(x.cl.class_time||'00:00').slice(0,8)}`)>=new Date()).sort((a,b)=>(a.cl.class_date+a.cl.class_time).localeCompare(b.cl.class_date+b.cl.class_time)),next=upcoming[0],pending=db.package_orders.find(o=>String(o.client_id)===String(c?.id)&&o.status==='pending'),warn=packageWarning(c),history=(db.client_payments||[]).slice(0,5);layout(`<div class="grid three"><div class="card kpi"><div class="label">Current package</div><div class="value" style="font-size:20px">${esc(active?.package_name||c?.package||'None')}</div></div><div class="card kpi"><div class="label">Sessions left</div><div class="value">${active?.sessions_remaining??c?.sessions??0}</div></div><div class="card kpi"><div class="label">Expiry</div><div class="value" style="font-size:20px">${esc(active?.expiry||c?.expiry||'—')}</div></div></div>${birthday?`<div class="notice card" style="margin-top:12px"><b>🎂 Happy Birthday from Core Theory!</b><p>You have 1 free session of your choice, valid until ${esc(birthday.valid_until)}.</p></div>`:''}${events.map(e=>`<div class="notice card" style="margin-top:12px"><b>${esc(e.title)}</b><p>${esc(e.description||'')} · Valid ${esc(e.start_date)} to ${esc(e.end_date)}</p></div>`).join('')}${upcomingPkg?`<div class="notice card" style="margin-top:12px"><b>Upcoming package</b><p>${esc(upcomingPkg.package_name)} · ${upcomingPkg.sessions_total===999?'Unlimited':upcomingPkg.sessions_total+' sessions'} · activates after your current package finishes.</p></div>`:''}${warn?`<div class="warning" style="margin-top:12px">${esc(warn)}</div>`:''}${pending?`<div class="notice card" style="margin-top:12px"><b>Payment pending</b><p>Your selected package is waiting for payment at Core Theory.</p></div>`:''}<div class="spacer"></div><div class="card"><h3>Next class</h3>${next?`<div class="booking-person"><span><b>${esc(next.cl.class_type||'Class')}</b><small>${esc(next.cl.class_date)} · ${formatTime((next.cl.class_time||'00:00').slice(0,5))} · ${esc(next.cl.studio_type||'Pilates')}</small></span><button class="btn" onclick="page='mybookings';render()">My bookings</button></div>`:'<div class="empty">No upcoming booking.</div>'}<button class="btn primary" onclick="page='book';render()">Book a Class</button></div><div class="spacer"></div><div class="card"><h3>Recent payments</h3>${history.map(p=>`<div class="cart-row"><span><b>${esc(p.description||'Payment')}</b><small>${new Date(p.created_at).toLocaleDateString()} · ${esc(p.payment_method||'')}${p.coupon_code?` · Coupon ${esc(p.coupon_code)}`:''}</small></span><b>${money(p.total)}</b></div>`).join('')||'<div class="empty">No payment history yet.</div>'}</div>`,`Home`,`Your Core Theory account`)}







// ================= CORE THEORY V9 DAILY OPERATIONS =================

function ym(d){return String(d||'').slice(0,7)}
function currentYM(){return ym(today())}
function prevYM(){const d=new Date();d.setMonth(d.getMonth()-1);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`}
function monthLabel(v){if(!v)return '';const [y,m]=v.split('-').map(Number);return new Date(y,m-1,1).toLocaleDateString(undefined,{month:'long',year:'numeric'})}
function instructorForClass(c){const sub=(db.class_substitutions||[]).find(s=>String(s.class_id)===String(c.id)&&s.active);return sub?.substitute_instructor||c.instructor_user_id||null}
function classCheckedInCount(c){return db.bookings.filter(b=>String(b.class_id)===String(c.id)&&b.status==='checked_in').length+(db.guest_bookings||[]).filter(g=>String(g.class_id)===String(c.id)&&g.status==='checked_in').length}
function classWasTaught(c){return !c.cancelled&&new Date(`${c.class_date}T${String(c.class_time||'00:00').slice(0,8)}`)<new Date()&&classCheckedInCount(c)>0}
function instructorStats(uid,month=currentYM()){
  const own=db.classes.filter(c=>String(instructorForClass(c)||'')===String(uid||''));
  const monthClasses=own.filter(c=>ym(c.class_date)===month&&!c.cancelled&&new Date(`${c.class_date}T${String(c.class_time||'00:00').slice(0,8)}`)<new Date());
  return {scheduled:monthClasses.length,taught:monthClasses.filter(classWasTaught).length,total:own.filter(classWasTaught).length};
}
function teachingMonths(uid,count=8){const out=[];for(let i=0;i<count;i++){const d=new Date();d.setMonth(d.getMonth()-i);const key=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`,s=instructorStats(uid,key);out.push({key,label:monthLabel(key),...s})}return out}
function classesTaughtCount(t){return instructorStats(t.auth_user_id).total}

function instructorhome(){
  const uid=session.user.id,now=new Date(),mine=[...db.classes].filter(c=>!c.cancelled),todayClasses=mine.filter(c=>c.class_date===today()).sort((a,b)=>String(a.class_time).localeCompare(String(b.class_time))),upcoming=mine.filter(c=>new Date(`${c.class_date}T${String(c.class_time||'00:00').slice(0,8)}`)>=now).sort((a,b)=>(a.class_date+a.class_time).localeCompare(b.class_date+b.class_time)),next=upcoming[0],cur=instructorStats(uid,currentYM()),last=instructorStats(uid,prevYM()),hist=teachingMonths(uid);
  layout(`<div class="grid three"><div class="card kpi"><div class="label">Taught this month</div><div class="value">${cur.taught}</div><small>${cur.scheduled} scheduled</small></div><div class="card kpi"><div class="label">Taught last month</div><div class="value">${last.taught}</div><small>${last.scheduled} scheduled</small></div><div class="card kpi"><div class="label">Total taught</div><div class="value">${cur.total}</div><small>Requires ≥1 checked-in client</small></div></div><div class="spacer"></div><div class="grid two"><div class="card"><h3>Today</h3><div class="cart-row"><span>Classes today</span><b>${todayClasses.length}</b></div><div class="cart-row"><span>Front Desk Duty</span><b>${db.frontDeskDuty?'Active':'Off'}</b></div>${next?`<div class="cart-row"><span><b>Next class</b><small>${esc(next.class_type||'Class')} · ${formatTime((next.class_time||'00:00').slice(0,5))}</small></span><button class="btn" onclick="page='schedule';render()">Open</button></div>`:''}</div><div class="card"><h3>Monthly Teaching History</h3>${hist.map(h=>`<div class="cart-row"><span>${esc(h.label)}</span><span><b>${h.taught}</b><small>${h.scheduled} scheduled</small></span></div>`).join('')}</div></div><div class="spacer"></div><div class="card"><h3>Today's classes</h3>${todayClasses.map(classCard).join('')||'<div class="empty">No classes today.</div>'}</div>`,`Home`,`A class counts as taught only when at least one client or event guest checked in.`)
}

function team(){
  const month=currentYM();
  layout(`<div class="card"><div class="toolbar"><button class="btn primary" onclick="inviteInstructorModal()">+ Invite Instructor</button><button class="btn" onclick="teamModal()">+ Add non-login team member</button><input type="month" id="teamMonth" value="${month}" onchange="team()"></div><div class="warning" style="margin-bottom:14px">Classes taught only count after the class time passes and at least one person actually checks in.</div><table><thead><tr><th>Name</th><th>Role</th><th>This month</th><th>Scheduled</th><th>Total taught</th><th>Class rate</th><th>Est. pay</th><th></th></tr></thead><tbody>${db.team.filter(t=>!t.archived_at).map(t=>{const s=t.auth_user_id?instructorStats(t.auth_user_id,month):{taught:0,scheduled:0,total:0},rate=Number(t.class_rate||0);return `<tr><td><b>${esc(t.name)}</b><div class="muted">${esc(t.email||'')}</div></td><td>${esc(t.role||'')}</td><td><b>${s.taught}</b></td><td>${s.scheduled}</td><td>${s.total}</td><td>${money(rate)}</td><td><b>${money(s.taught*rate)}</b></td><td><button class="btn small" onclick="editTeamMember('${t.id}')">Edit</button>${t.auth_user_id?` <button class="btn small" onclick="payrollModal('${t.id}')">Payroll</button> <button class="btn small" onclick="setFrontDeskDuty('${t.auth_user_id}',true)">Front Desk today</button> <button class="btn small" onclick="setFrontDeskDuty('${t.auth_user_id}',false)">End duty</button>`:` <button class="btn small danger" onclick="archiveRecord('team','${t.id}')">Archive</button>`}</td></tr>`}).join('')}</tbody></table></div>`,`Team`,`Monthly teaching and payroll tracking`)}
function payrollModal(teamId){const t=db.team.find(x=>String(x.id)===String(teamId));if(!t)return;const m=currentYM(),s=instructorStats(t.auth_user_id,m),adjs=db.payroll_adjustments.filter(a=>String(a.team_id)===String(teamId)&&a.pay_month===m),adj=adjs.reduce((a,x)=>a+Number(x.amount||0),0),base=s.taught*Number(t.class_rate||0);modal(`${esc(t.name)} payroll`,`<label>Month</label><input id="payMonth" type="month" value="${m}" onchange="payrollMonthRefresh('${teamId}')"><div id="payrollBody"><div class="cart-row"><span>Classes taught</span><b>${s.taught}</b></div><div class="cart-row"><span>Rate / class</span><b>${money(t.class_rate||0)}</b></div><div class="cart-row"><span>Base pay</span><b>${money(base)}</b></div><div class="cart-row"><span>Adjustments</span><b>${money(adj)}</b></div><div class="cart-row"><span><b>Estimated total</b></span><b>${money(base+adj)}</b></div></div><h3>Add adjustment</h3><label>Amount (+ or -)</label><input id="payAdj" type="number" step=".01"><label>Reason</label><input id="payReason"><button class="btn primary full" onclick="addPayrollAdjustment('${teamId}')">Add adjustment</button>`)}
async function payrollMonthRefresh(teamId){const m=$("#payMonth").value,t=db.team.find(x=>String(x.id)===String(teamId)),s=instructorStats(t.auth_user_id,m),adjs=db.payroll_adjustments.filter(a=>String(a.team_id)===String(teamId)&&a.pay_month===m),adj=adjs.reduce((a,x)=>a+Number(x.amount||0),0),base=s.taught*Number(t.class_rate||0);$("#payrollBody").innerHTML=`<div class="cart-row"><span>Classes taught</span><b>${s.taught}</b></div><div class="cart-row"><span>Rate / class</span><b>${money(t.class_rate||0)}</b></div><div class="cart-row"><span>Base pay</span><b>${money(base)}</b></div><div class="cart-row"><span>Adjustments</span><b>${money(adj)}</b></div><div class="cart-row"><span><b>Estimated total</b></span><b>${money(base+adj)}</b></div>`}
async function addPayrollAdjustment(teamId){const amount=Number($("#payAdj").value),reason=$("#payReason").value.trim(),pay_month=$("#payMonth").value;if(!reason||!Number.isFinite(amount))return alert('Enter an amount and reason.');const {error}=await sb.from('payroll_adjustments').insert({team_id:teamId,pay_month,amount,reason,created_by:session.user.id});if(error)return alert(error.message);$("#modal").remove();await loadAll();payrollModal(teamId)}
function editTeamMember(id){const t=db.team.find(x=>String(x.id)===String(id));if(!t)return;modal('Edit team member',`<div class="form"><div><label>Name</label><input id="tname" value="${esc(t.name||'')}"></div><div><label>Role</label><input id="trole" value="${esc(t.role||'')}"></div><div><label>Phone</label><input id="tphone" value="${esc(t.phone||'')}"></div><div><label>Rate / commission note</label><input id="trate" value="${esc(t.rate||'')}"></div><div><label>Class rate</label><input id="tclassrate" type="number" step=".01" value="${t.class_rate??0}"></div><div class="full"><button class="btn primary" onclick="saveTeamMember('${t.id}')">Save changes</button></div></div>`)}
async function saveTeamMember(id){const {error}=await sb.from('team').update({name:$("#tname").value.trim(),role:$("#trole").value.trim(),phone:$("#tphone").value.trim(),rate:$("#trate").value.trim(),class_rate:+$("#tclassrate").value||0}).eq('id',id);if(error)return alert(error.message);$("#modal").remove();await loadAll();alert('Team member updated.')}

function clientStatus(c){if(db.package_orders.some(o=>String(o.client_id)===String(c.id)&&o.status==='pending'))return ['Payment pending','warning'];if(c.package_frozen_until&&c.package_frozen_until>=today())return ['Frozen','badge'];if(!c.package||Number(c.sessions||0)<=0)return ['No package','badge'];if(c.expiry&&c.expiry<=dateISO(new Date(Date.now()+7*86400000)))return ['Expiring soon','warning'];return ['Active','good']}
function clients(){const q=($("#clientSearch")?.value||'').toLowerCase(),rows=db.clients.filter(c=>!c.archived_at&&(!q||[c.name,c.email,c.phone].join(' ').toLowerCase().includes(q)));layout(`<div class="card"><div class="toolbar"><button class="btn primary" onclick="clientModal()">+ Add client</button><input id="clientSearch" placeholder="Search clients…" oninput="clients()" value="${esc(q)}"></div>${rows.length?`<table><thead><tr><th>Client</th><th>Status</th><th>Package</th><th>Sessions</th><th>Expiry</th><th></th></tr></thead><tbody>${rows.map(c=>{const st=clientStatus(c);return `<tr><td><b>${esc(c.name)}</b><div class="muted">${esc(c.email||'')} · ${esc(c.phone||'')}</div></td><td><span class="badge ${st[1]}">${st[0]}</span></td><td>${esc(c.package||'—')}</td><td>${c.sessions??0}</td><td>${esc(c.expiry||'—')}</td><td><button class="btn small" onclick="clientProfile('${c.id}')">Open</button> <button class="btn small" onclick="clientModal('${c.id}')">Edit</button> <button class="btn small" onclick="sellMembership('${c.id}')">Add package</button> <button class="btn small danger" onclick="deleteClient('${c.id}')">Delete</button></td></tr>`}).join('')}</tbody></table>`:'<div class="empty">No matching clients.</div>'}</div>`,`Clients`,`Searchable profiles, packages, attendance, payments and notes`)}

function clientProfile(id,tab='overview'){const c=db.clients.find(x=>String(x.id)===String(id));if(!c)return;const bookings=db.bookings.filter(b=>String(b.client_id)===String(id)),packages=db.client_packages.filter(p=>String(p.client_id)===String(id)).sort((a,b)=>String(b.purchased_at||'').localeCompare(String(a.purchased_at||''))),payments=db.sales.filter(s=>String(s.client_id)===String(id)).sort((a,b)=>String(b.created_at||'').localeCompare(String(a.created_at||''))),notes=db.client_notes.filter(n=>String(n.client_id)===String(id)).sort((a,b)=>String(b.created_at||'').localeCompare(String(a.created_at||''))),visits=bookings.filter(b=>b.status==='checked_in').length;const tabs=`<div class="schedule-tabs"><button class="tab ${tab==='overview'?'active':''}" onclick="clientProfile('${id}','overview')">Overview</button><button class="tab ${tab==='packages'?'active':''}" onclick="clientProfile('${id}','packages')">Packages</button><button class="tab ${tab==='attendance'?'active':''}" onclick="clientProfile('${id}','attendance')">Attendance</button><button class="tab ${tab==='payments'?'active':''}" onclick="clientProfile('${id}','payments')">Payments</button><button class="tab ${tab==='notes'?'active':''}" onclick="clientProfile('${id}','notes')">Notes</button></div>`;let body='';if(tab==='overview')body=`<div class="grid two"><div><p><b>Email:</b> ${esc(c.email||'—')}</p><p><b>Phone:</b> ${esc(c.phone||'—')}</p><p><b>Birthday:</b> ${esc(c.birthday||'—')}</p><p><b>Emergency:</b> ${esc(c.emergency_contact_name||'—')} ${esc(c.emergency_contact_phone||'')}</p><p><b>Waiver:</b> ${c.waiver_accepted_at?'Accepted '+new Date(c.waiver_accepted_at).toLocaleDateString():'Not recorded'}</p></div><div><p><b>Current package:</b> ${esc(c.package||'—')}</p><p><b>Sessions:</b> ${c.sessions??0}</p><p><b>Expiry:</b> ${esc(c.expiry||'—')}</p><p><b>Total visits:</b> ${visits}</p></div></div><div class="toolbar"><button class="btn" onclick="clientModal('${id}')">Edit client</button><button class="btn" onclick="sellMembership('${id}')">Add package</button><button class="btn" onclick="sessionAdjustmentModal('${id}')">Adjust sessions</button><button class="btn" onclick="freezeClientModal('${id}')">Freeze</button></div>`;if(tab==='packages')body=packages.map(p=>`<div class="cart-row"><span><b>${esc(p.package_name)}</b><small>${esc(p.status)} · ${p.sessions_remaining===999?'Unlimited':p.sessions_remaining+' / '+p.sessions_total+' left'} · ${esc(p.studio_scope||'Both')} · ${p.expiry||'No expiry'}</small></span><span>${p.price_paid!=null?money(p.price_paid):''}${p.status==='upcoming'&&p.sessions_remaining===p.sessions_total?` <button class="btn small" onclick="transferPackageModal('${p.id}')">Transfer</button>`:''}</span></div>`).join('')||'<div class="empty">No package history.</div>';if(tab==='attendance')body=bookings.map(b=>{const cl=db.classes.find(x=>String(x.id)===String(b.class_id));return `<div class="cart-row"><span><b>${esc(cl?.class_type||'Class')}</b><small>${esc(cl?.class_date||'')} · ${esc(cl?.studio_type||'')}</small></span><span class="badge">${esc(b.cancel_type||b.status)}</span></div>`}).join('')||'<div class="empty">No attendance history.</div>';if(tab==='payments')body=payments.map(s=>`<div class="cart-row"><span><b>${esc(saleWhat(s))}</b><small>${new Date(s.created_at).toLocaleString()} · ${esc(s.payment_method||'')}${s.voided_at?' · VOIDED':''}</small></span><span><b>${money(s.total)}</b> <button class="btn small" onclick="printReceipt('${s.id}')">Receipt</button></span></div>`).join('')||'<div class="empty">No payment history.</div>';if(tab==='notes')body=`<div class="toolbar"><button class="btn primary" onclick="clientNoteModal('${id}')">+ Add note</button></div>${notes.map(n=>`<div class="cart-row"><span><b>${esc(n.category)}</b>${n.teaching_visible?' <span class="badge">Instructor-visible</span>':''}<small>${esc(n.note)}</small><small>${new Date(n.created_at).toLocaleString()}</small></span><button class="btn small danger" onclick="removeItem('client_notes','${n.id}')">Delete</button></div>`).join('')||'<div class="empty">No notes.</div>'}`;modal(esc(c.name),tabs+`<div style="margin-top:14px">${body}</div>`)}
function clientNoteModal(clientId){modal('Add client note',`<label>Category</label><select id="noteCategory"><option>General</option><option>Injury / limitation</option><option>Payment</option><option>Preference</option></select><label>Note</label><textarea id="noteText"></textarea><label><input id="noteTeaching" type="checkbox"> Instructor may see this note when client is in their class</label><button class="btn primary full" onclick="saveClientNote('${clientId}')">Save note</button>`)}
async function saveClientNote(clientId){const note=$("#noteText").value.trim();if(!note)return alert('Enter a note.');const {error}=await sb.from('client_notes').insert({client_id:clientId,category:$("#noteCategory").value,note,teaching_visible:$("#noteTeaching").checked,created_by:session.user.id});if(error)return alert(error.message);$("#modal").remove();await loadAll();clientProfile(clientId,'notes')}
function sessionAdjustmentModal(clientId){modal('Adjust sessions',`<label>Adjustment</label><input id="sessionAdj" type="number" step="1" placeholder="+1 or -1"><label>Reason</label><input id="sessionAdjReason" placeholder="Required"><button class="btn primary full" onclick="saveSessionAdjustment('${clientId}')">Apply adjustment</button>`)}
async function saveSessionAdjustment(clientId){const amount=Number($("#sessionAdj").value),reason=$("#sessionAdjReason").value.trim();if(!Number.isInteger(amount)||amount===0||!reason)return alert('Enter a whole-number adjustment and a reason.');const {error}=await sb.rpc('owner_adjust_sessions',{p_client_id:clientId,p_adjustment:amount,p_reason:reason});if(error)return alert(error.message);$("#modal").remove();await loadAll();clientProfile(clientId)}
function transferPackageModal(packageId){const p=db.client_packages.find(x=>String(x.id)===String(packageId));modal('Transfer unused upcoming package',`<p>${esc(p?.package_name||'Package')}</p><label>Transfer to client</label><select id="transferTo"><option value="">Choose client</option>${db.clients.filter(c=>String(c.id)!==String(p.client_id)).map(c=>`<option value="${c.id}">${esc(c.name)}</option>`).join('')}</select><label>Reason</label><input id="transferReason"><button class="btn primary full" onclick="transferPackage('${packageId}')">Transfer</button>`)}
async function transferPackage(packageId){const to=$("#transferTo").value,reason=$("#transferReason").value.trim();if(!to||!reason)return alert('Choose a client and enter a reason.');const {error}=await sb.rpc('owner_transfer_unused_package',{p_package_id:packageId,p_to_client_id:to,p_reason:reason});if(error)return alert(error.message);$("#modal").remove();await loadAll();alert('Package transferred.')}

function clientModal(id=''){const c=id?db.clients.find(x=>String(x.id)===String(id)):null;modal(c?'Edit client':'Add client',`<div class="form"><div><label>Name</label><input id="cname" value="${esc(c?.name||'')}"></div><div><label>Birthday</label><input id="cbirthday" type="date" value="${esc(c?.birthday||'')}"></div><div><label>Phone</label><input id="cphone" value="${esc(c?.phone||'')}"></div><div><label>Email</label><input id="cemail" type="email" value="${esc(c?.email||'')}"></div><div><label>Emergency contact name</label><input id="cemergencyname" value="${esc(c?.emergency_contact_name||'')}"></div><div><label>Emergency contact phone</label><input id="cemergencyphone" value="${esc(c?.emergency_contact_phone||'')}"></div><div class="full"><button class="btn primary" onclick="${c?`saveClient('${c.id}')`:'addClient()'}">${c?'Save changes':'Save'}</button></div></div>`)}
async function addClient(){const {error}=await sb.from('clients').insert({name:$("#cname").value.trim(),birthday:$("#cbirthday").value||null,phone:$("#cphone").value.trim(),email:$("#cemail").value.trim(),emergency_contact_name:$("#cemergencyname").value.trim(),emergency_contact_phone:$("#cemergencyphone").value.trim(),sessions:0});if(error)return alert(error.message);$("#modal").remove();await loadAll()}
async function saveClient(id){const {error}=await sb.from('clients').update({name:$("#cname").value.trim(),birthday:$("#cbirthday").value||null,phone:$("#cphone").value.trim(),email:$("#cemail").value.trim(),emergency_contact_name:$("#cemergencyname").value.trim(),emergency_contact_phone:$("#cemergencyphone").value.trim()}).eq('id',id);if(error)return alert(error.message);$("#modal").remove();await loadAll();alert('Client updated.')}

function signupScreen(msg=""){$("#app").innerHTML=`<div class="auth-shell"><div class="auth-card"><div class="auth-brand">CORE THEORY<small>CLIENT ACCOUNT</small></div><h2>Create account</h2><form id="signupForm"><label>Full name</label><input id="suName" required><label>Birthday</label><input id="suBirthday" type="date" required><label>Email</label><input id="suEmail" type="email" required><label>Country / calling code</label><select id="suCountry" required>${countryOptions()}</select><label>Phone number</label><input id="suPhone" type="tel" placeholder="e.g. 70123456" required><small class="muted">Choose your country first. Core Theory saves the full international number.</small><label>Password</label><input id="suPass" type="password" minlength="8" required><label style="margin-top:12px"><input id="suWaiver" type="checkbox" required> I accept Core Theory's studio terms, cancellation/no-show policy and participation waiver.</label><button class="btn primary full" type="submit">Create account</button><div class="auth-error" id="authError">${esc(msg)}</div></form><button class="link-btn" onclick="authScreen()">← Back to sign in</button></div></div>`;$("#signupForm").onsubmit=signup}
async function signup(e){e.preventDefault();const code=$("#suCountry").value.trim(),raw=$("#suPhone").value.trim().replace(/^0+/,'').replace(/\s+/g,''),birthday=$("#suBirthday").value;if(!birthday)return $("#authError").textContent="Birthday is required.";if(!$("#suWaiver").checked)return $("#authError").textContent="Please accept the studio terms and waiver.";if(!code)return $("#authError").textContent="Please choose a country with a calling code.";if(!raw)return $("#authError").textContent="Phone number is required.";const phone=code+raw;const {error}=await sb.auth.signUp({email:$("#suEmail").value.trim(),password:$("#suPass").value,options:{emailRedirectTo:location.origin,data:{full_name:$("#suName").value.trim(),birthday,phone,phone_country_code:code,waiver_accepted:true,waiver_version:'2026-09'}}});if(error)return $("#authError").textContent=error.message;authScreen("Account created. Check your email to confirm, then sign in.")}

function teachingNotesForClass(classId){const clientIds=activeBookings(classId).map(b=>String(b.client_id));return db.client_notes.filter(n=>n.teaching_visible&&clientIds.includes(String(n.client_id)))}
function openClass(id){const c=db.classes.find(x=>String(x.id)===String(id));if(!c)return;const bs=activeBookings(id),guests=isOwner()?(db.guest_bookings||[]).filter(g=>String(g.class_id)===String(id)&&g.status!=='cancelled'):(db.guestRoster||[]).filter(g=>String(g.class_id)===String(id)&&g.status!=='cancelled'),checked=bs.filter(b=>b.status==='checked_in').length+guests.filter(g=>g.status==='checked_in').length,noShows=bs.filter(b=>b.status==='no_show').length+guests.filter(g=>g.status==='no_show').length,wait=bs.filter(b=>b.status==='waitlist').length,pending=bs.filter(b=>b.payment_status==='pending').length,notes=teachingNotesForClass(id);const rows=bs.map(b=>{const roster=db.roster?.find(r=>String(r.booking_id)===String(b.id)),cl=isOwner()?db.clients.find(x=>String(x.id)===String(b.client_id)):null,clientName=cl?.name||roster?.client_name||'Client',n=notes.filter(x=>String(x.client_id)===String(b.client_id));return `<div class="booking-person"><span><b>${esc(clientName)}</b><small>${esc(b.status)} · ${b.payment_status==='pending'?'<b>Payment Pending</b>':esc(b.payment_status||'paid')}</small>${n.map(x=>`<small>⚑ ${esc(x.category)}: ${esc(x.note)}</small>`).join('')}</span>${isStaff()?`<span>${b.status==='booked'?`<button class="btn small" onclick="checkIn('${b.id}')">Check in</button>`:''}<button class="btn small" onclick="setBookingStatus('${b.id}','no_show')">No-show</button></span>`:''}</div>`}).join('');const guestRows=guests.map(g=>`<div class="booking-person"><span><b>${esc(g.guest_name||'Guest')}</b><small>Guest · ${esc(g.status)}${g.host_name?' · invited by '+esc(g.host_name):''}</small></span>${isStaff()&&g.status==='booked'?`<button class="btn small" onclick="checkInGuest('${g.booking_id||g.id}')">Check in guest</button>`:''}</div>`).join('');modal(`${esc(c.class_type)} · ${formatTime((c.class_time||'00:00').slice(0,5))}`,`<p><span class="badge" style="background:${levelColor(c.level)}">${esc(c.level||'Open Level')}</span> ${esc(c.studio_type||'Pilates')} · ${esc(c.instructor||'')}</p><div class="grid three"><div class="card kpi"><div class="label">Booked</div><div class="value">${bs.length+guests.length}</div></div><div class="card kpi"><div class="label">Checked in</div><div class="value">${checked}</div></div><div class="card kpi"><div class="label">Waitlist</div><div class="value">${wait}</div></div></div><p class="muted">No-shows: ${noShows} · Payment pending: ${pending} · Capacity: ${c.capacity||0}</p>${rows}${guestRows||''}${!rows&&!guestRows?'<div class="empty">No bookings yet.</div>':''}${isOwner()?`<div class="toolbar"><button class="btn primary" onclick="addBookingModal('${c.id}')">+ Add client</button><button class="btn" onclick="$('#modal').remove();editClassModal('${c.id}')">Edit class</button><button class="btn" onclick="substituteClassModal('${c.id}')">Substitute</button></div>`:''}`)}
async function checkInGuest(id){const {error}=await sb.rpc('check_in_guest_booking',{p_guest_booking_id:id});if(error)return alert(error.message);$("#modal")?.remove();await loadAll();alert('Guest checked in.')}

function clienthome(){const c=myClient(),packages=db.client_packages.filter(p=>String(p.client_id)===String(c?.id)),active=packages.find(p=>p.status==='active'),upcomingPkg=packages.find(p=>p.status==='upcoming'),rewards=db.client_rewards.filter(r=>String(r.client_id)===String(c?.id)&&r.status==='active'&&r.sessions_remaining>0&&r.valid_until>=today()),birthday=rewards.find(r=>r.reward_type==='birthday'),events=db.studio_events.filter(e=>!e.archived_at&&e.active&&e.start_date<=today()&&e.end_date>=today()&&(e.audience==='Clients'||e.audience==='Everyone')),notifs=(db.client_notifications||[]).filter(n=>String(n.client_id)===String(c?.id)&&!n.dismissed_at),mine=db.bookings.filter(b=>String(b.client_id)===String(c?.id)&&!['cancelled','no_show'].includes(b.status)),upcoming=mine.map(b=>({b,cl:db.classes.find(x=>String(x.id)===String(b.class_id))})).filter(x=>x.cl&&!x.cl.cancelled&&new Date(`${x.cl.class_date}T${String(x.cl.class_time||'00:00').slice(0,8)}`)>=new Date()).sort((a,b)=>(a.cl.class_date+a.cl.class_time).localeCompare(b.cl.class_date+b.cl.class_time)),next=upcoming[0],pending=db.package_orders.find(o=>String(o.client_id)===String(c?.id)&&o.status==='pending'),warn=packageWarning(c),history=(db.client_payments||[]).slice(0,5);layout(`${notifs.map(n=>`<div class="notice card" style="margin-bottom:12px"><b>${esc(n.title)}</b><p>${esc(n.message)}</p></div>`).join('')}<div class="grid three"><div class="card kpi"><div class="label">Current package</div><div class="value" style="font-size:20px">${esc(active?.package_name||c?.package||'None')}</div></div><div class="card kpi"><div class="label">Sessions left</div><div class="value">${active?.sessions_remaining??c?.sessions??0}</div></div><div class="card kpi"><div class="label">Expiry</div><div class="value" style="font-size:20px">${esc(active?.expiry||c?.expiry||'—')}</div></div></div>${birthday?`<div class="notice card" style="margin-top:12px"><b>🎂 Happy Birthday from Core Theory!</b><p>You have 1 free session of your choice, valid until ${esc(birthday.valid_until)}.</p></div>`:''}${events.map(e=>`<div class="notice card" style="margin-top:12px"><b>${esc(e.title)}</b><p>${esc(e.description||'')} · Valid ${esc(e.start_date)} to ${esc(e.end_date)}</p>${e.event_type==='guest_pass'?`<button class="btn primary" onclick="guestEventModal('${e.id}')">Bring a guest</button>`:''}</div>`).join('')}${upcomingPkg?`<div class="notice card" style="margin-top:12px"><b>Upcoming package</b><p>${esc(upcomingPkg.package_name)} · ${upcomingPkg.sessions_total===999?'Unlimited':upcomingPkg.sessions_total+' sessions'} · activates after your current package finishes.</p></div>`:''}${warn?`<div class="warning" style="margin-top:12px">${esc(warn)}</div>`:''}${pending?`<div class="notice card" style="margin-top:12px"><b>Payment pending</b><p>Your selected package is waiting for payment at Core Theory.</p></div>`:''}<div class="spacer"></div><div class="card"><h3>Next class</h3>${next?`<div class="booking-person"><span><b>${esc(next.cl.class_type||'Class')}</b><small>${esc(next.cl.class_date)} · ${formatTime((next.cl.class_time||'00:00').slice(0,5))} · ${esc(next.cl.studio_type||'Pilates')}</small></span><button class="btn" onclick="page='mybookings';render()">My bookings</button></div>`:'<div class="empty">No upcoming booking.</div>'}<button class="btn primary" onclick="page='book';render()">Book a Class</button></div><div class="spacer"></div><div class="card"><h3>Recent payments</h3>${history.map(p=>`<div class="cart-row"><span><b>${esc(p.description||'Payment')}</b><small>${new Date(p.created_at).toLocaleDateString()} · ${esc(p.payment_method||'')}${p.coupon_code?` · Coupon ${esc(p.coupon_code)}`:''}</small></span><b>${money(p.total)}</b></div>`).join('')||'<div class="empty">No payment history yet.</div>'}</div>`,`Home`,`Your Core Theory account`)}

function guestEventModal(eventId){const e=db.studio_events.find(x=>String(x.id)===String(eventId));if(!e)return;const eligible=db.classes.filter(c=>!c.cancelled&&c.class_date>=today()&&c.class_date>=e.start_date&&c.class_date<=e.end_date&&(e.studio_scope==='Both'||c.studio_type===e.studio_scope));modal(e.title,`<label>Guest name</label><input id="guestName"><label>Guest phone (optional)</label><input id="guestPhone"><label>Class</label><select id="guestClass">${eligible.map(c=>`<option value="${c.id}">${esc(c.class_date)} · ${formatTime((c.class_time||'00:00').slice(0,5))} · ${esc(c.class_type)}</option>`).join('')}</select><button class="btn primary full" onclick="bookEventGuest('${eventId}')">Book guest</button>`)}
async function bookEventGuest(eventId){const name=$("#guestName").value.trim(),classId=$("#guestClass").value;if(!name||!classId)return alert('Enter the guest name and choose a class.');const {error}=await sb.rpc('book_event_guest',{p_event_id:eventId,p_class_id:classId,p_guest_name:name,p_guest_phone:$("#guestPhone").value.trim()||null});if(error)return alert(error.message);$("#modal").remove();await loadAll();alert('Guest booked. The guest counts toward class capacity.')}

function eventPerformance(e){const rows=(db.guest_bookings||[]).filter(g=>String(g.event_id)===String(e.id));return {booked:rows.filter(x=>x.status!=='cancelled').length,checked:rows.filter(x=>x.status==='checked_in').length,converted:(db.guest_profiles||[]).filter(g=>String(g.source_event_id||'')===String(e.id)&&g.converted_client_id).length}}
function operations(){const ss=db.studio_settings[0]||{},low=db.clients.filter(c=>Number(c.sessions||0)<=1),expiring=db.clients.filter(c=>c.expiry&&c.expiry>=today()&&c.expiry<=dateISO(new Date(Date.now()+7*86400000))),unassigned=db.classes.filter(c=>c.class_date>=today()&&!c.cancelled&&!c.instructor_user_id),occ=occupancyStats(),birthdays=db.clients.filter(c=>c.birthday&&String(c.birthday).slice(5,7)===String(new Date().getMonth()+1).padStart(2,'0')),birthdayUsed=db.client_rewards.filter(r=>r.reward_type==='birthday'&&r.status==='used'&&r.issued_year===new Date().getFullYear()).length;layout(`<div class="grid two"><div class="card"><h3>Studio alerts</h3><div class="cart-row"><span>Pending payments</span><b>${db.package_orders.filter(o=>o.status==='pending').length}</b></div><div class="cart-row"><span>Clients with ≤1 session</span><b>${low.length}</b></div><div class="cart-row"><span>Packages expiring in 7 days</span><b>${expiring.length}</b></div><div class="cart-row"><span>Low-stock products</span><b>${db.products.filter(p=>Number(p.stock||0)<=Number(p.minimum_stock||0)).length}</b></div><div class="cart-row"><span>Classes without instructor</span><b>${unassigned.length}</b></div><div class="cart-row"><span>Zero-attendance past classes</span><b>${db.classes.filter(c=>!c.cancelled&&new Date(`${c.class_date}T${String(c.class_time||'00:00').slice(0,8)}`)<new Date()&&classCheckedInCount(c)===0).length}</b></div></div><div class="card"><h3>Birthdays</h3><div class="cart-row"><span>Birthdays this month</span><b>${birthdays.length}</b></div><div class="cart-row"><span>Birthday gifts used this year</span><b>${birthdayUsed}</b></div>${birthdays.slice(0,12).map(c=>`<div class="cart-row"><span>${esc(c.name)}</span><small>${esc(String(c.birthday).slice(5))}</small></div>`).join('')}</div><div class="card"><h3>Events & Specials</h3><div class="toolbar"><button class="btn primary" onclick="eventModal()">+ Event</button></div>${db.studio_events.filter(e=>!e.archived_at).map(e=>{const p=eventPerformance(e);return `<div class="cart-row"><span><b>${esc(e.title)}</b><small>${esc(e.start_date)} → ${esc(e.end_date)} · ${esc(e.studio_scope)} · ${e.active?'Active':'Inactive'}</small><small>Booked guests: ${p.booked} · Checked in: ${p.checked} · Converted: ${p.converted}</small></span><span><button class="btn small" onclick="eventModal('${e.id}')">Edit</button> <button class="btn small" onclick="toggleEvent('${e.id}',${e.active?'false':'true'})">${e.active?'Deactivate':'Activate'}</button> <button class="btn small danger" onclick="archiveRecord('studio_events','${e.id}')">Archive</button></span></div>`}).join('')||'<div class="empty">No events yet.</div>'}</div><div class="card"><h3>Promo codes</h3><div class="toolbar"><button class="btn primary" onclick="promoModal()">+ Promo code</button></div>${db.promo_codes.filter(p=>!p.archived_at).map(p=>{const uses=(db.promo_code_uses||[]).filter?.(u=>String(u.promo_id)===String(p.id))||[];return `<div class="cart-row"><span><b>${esc(p.code)}</b><small>${p.discount_type==='fixed'?money(p.discount_value):`${p.discount_value??p.discount_percent}% off`} · ${p.one_use_per_client!==false?'One use/client':'Repeat allowed'} · ${p.active?'Active':'Inactive'}</small></span><span><button class="btn small" onclick="promoModal('${p.id}')">Edit</button> <button class="btn small" onclick="togglePromo('${p.id}',${p.active?'false':'true'})">${p.active?'Deactivate':'Activate'}</button> <button class="btn small danger" onclick="archiveRecord('promo_codes','${p.id}')">Archive</button></span></div>`}).join('')||'<div class="empty">No promo codes.</div>'}</div><div class="card"><h3>Reports & backup</h3><div class="cart-row"><span>Overall occupancy</span><b>${occ.pct}%</b></div><div class="toolbar"><input id="reportFrom" type="date" value="${monthStart()}"><input id="reportTo" type="date" value="${today()}"><button class="btn" onclick="exportDateRangeReport()">Export date-range CSV</button><button class="btn" onclick="exportData()">Full backup JSON</button></div></div><div class="card"><h3>Announcements</h3><div class="toolbar"><button class="btn primary" onclick="announcementModal()">+ Announcement</button></div>${db.announcements.map(a=>`<div class="cart-row"><span><b>${esc(a.title)}</b><small>${esc(a.message)} · ${esc(a.audience||'Everyone')} · ${a.active===false?'Inactive':'Active'}</small></span><span><button class="btn small" onclick="announcementModal('${a.id}')">Edit</button> <button class="btn small" onclick="toggleAnnouncement('${a.id}',${a.active===false?'true':'false'})">${a.active===false?'Activate':'Deactivate'}</button> <button class="btn small danger" onclick="removeItem('announcements','${a.id}')">Delete</button></span></div>`).join('')||'<div class="empty">No announcements.</div>'}</div><div class="card"><h3>Audit log</h3>${db.audit_log.slice(-30).reverse().map(a=>`<div class="cart-row"><span><b>${esc(a.action)}</b><small>${esc(a.details||'')} · ${new Date(a.created_at).toLocaleString()}</small></span></div>`).join('')||'<div class="empty">Activity will appear here.</div>'}</div></div>`,`Operations`,`Alerts, events, birthdays, reports and audit trail`)}

function exportDateRangeReport(){const from=$("#reportFrom").value,to=$("#reportTo").value,rows=[['Type','Date','Client/Category','Description','Method','Amount']];db.sales.filter(s=>!s.voided_at&&String(s.created_at).slice(0,10)>=from&&String(s.created_at).slice(0,10)<=to).forEach(s=>rows.push(['Sale',String(s.created_at).slice(0,10),saleClientName(s),saleWhat(s),s.payment_method,s.total]));db.expenses.filter(e=>e.expense_date>=from&&e.expense_date<=to).forEach(e=>rows.push(['Expense',e.expense_date,e.category,e.description||'',e.payment_method||'',-Number(e.amount||0)]));const csv=rows.map(r=>r.map(v=>`"${String(v??'').replaceAll('"','""')}"`).join(',')).join('\n'),blob=new Blob([csv],{type:'text/csv'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`core-theory-report-${from}-to-${to}.csv`;a.click();URL.revokeObjectURL(a.href)}

async function archiveRecord(table,id){if(!confirm('Archive this item? It will disappear from active use but its history will be kept.'))return;const {error}=await sb.from(table).update({archived_at:new Date().toISOString()}).eq('id',id);if(error)return alert(error.message);await loadAll()}
function memberships(){const ms=sortedMemberships();layout(`<div class="card"><div class="toolbar"><button class="btn primary" onclick="membershipModal()">+ Add membership</button></div>${ms.length?ms.map((m,i)=>`<div class="cart-row"><span><b>${esc(m.name)}</b>${m.is_private?' <span class="badge">Private Session</span>':''}<small>${m.is_private?'Private Session':(m.sessions===999?'Unlimited':m.sessions+' sessions')} · ${m.validity_days} days · ${esc(m.studio_scope||'Both')}</small></span><span class="row"><b>${money(m.price)}</b><button class="btn small" ${i===0?'disabled':''} onclick="moveMembership('${m.id}',-1)">↑</button><button class="btn small" ${i===ms.length-1?'disabled':''} onclick="moveMembership('${m.id}',1)">↓</button><button class="btn small" onclick="editMembership('${m.id}')">Edit</button><button class="btn small danger" onclick="archiveRecord('memberships','${m.id}')">Archive</button></span></div>`).join(''):'<div class="empty">No memberships yet.</div>'}</div>`,`Memberships`,`Archive used memberships instead of deleting historical records`)}



// ================= CORE THEORY V9.1 CLICKABLE STUDIO ALERTS =================
function studioAlertData(type){
  const end7=dateISO(new Date(Date.now()+7*86400000));
  if(type==='pending')return db.package_orders.filter(o=>o.status==='pending');
  if(type==='low_sessions')return db.clients.filter(c=>!c.archived_at&&Number(c.sessions||0)<=1);
  if(type==='expiring')return db.clients.filter(c=>!c.archived_at&&c.expiry&&c.expiry>=today()&&c.expiry<=end7);
  if(type==='low_stock')return db.products.filter(p=>p.active!==false&&Number(p.stock||0)<=Number(p.minimum_stock||0));
  if(type==='unassigned')return db.classes.filter(c=>c.class_date>=today()&&!c.cancelled&&!c.instructor_user_id);
  if(type==='zero_attendance')return db.classes.filter(c=>!c.cancelled&&new Date(`${c.class_date}T${String(c.class_time||'00:00').slice(0,8)}`)<new Date()&&classCheckedInCount(c)===0);
  if(type==='waitlist')return db.bookings.filter(b=>b.status==='waitlist');
  return [];
}
function alertRow(label,type){
  const count=studioAlertData(type).length;
  return `<button type="button" class="cart-row alert-click-row" onclick="showStudioAlert('${type}')"><span>${esc(label)}<small>Tap to view details</small></span><b>${count} ›</b></button>`;
}
function showStudioAlert(type){
  const rows=studioAlertData(type);
  let title='',html='';
  if(type==='pending'){
    title='Pending payments';
    html=rows.map(o=>{const c=db.clients.find(x=>String(x.id)===String(o.client_id)),m=db.memberships.find(x=>String(x.id)===String(o.membership_id));return `<div class="booking-person"><span><b>${esc(c?.name||'Client')}</b><small>${esc(m?.name||'Package')} · ${money(o.amount)}${o.coupon_code?` · Coupon ${esc(o.coupon_code)}`:''}</small></span><button class="btn small" onclick="$('#modal').remove();page='finance';render()">Finance</button></div>`}).join('');
  }else if(type==='low_sessions'){
    title='Clients with 1 session or less';
    html=rows.map(c=>`<div class="booking-person"><span><b>${esc(c.name)}</b><small>${esc(c.package||'No package')} · ${c.sessions??0} session${Number(c.sessions)===1?'':'s'} left · Expiry ${esc(c.expiry||'—')}</small></span><button class="btn small" onclick="$('#modal').remove();clientProfile('${c.id}')">Open client</button></div>`).join('');
  }else if(type==='expiring'){
    title='Packages expiring within 7 days';
    html=rows.sort((a,b)=>String(a.expiry).localeCompare(String(b.expiry))).map(c=>{const days=Math.max(0,Math.ceil((new Date(c.expiry+'T12:00:00')-new Date(today()+'T12:00:00'))/86400000));return `<div class="booking-person"><span><b>${esc(c.name)}</b><small>${esc(c.package||'Package')} · ${c.sessions??0} sessions left · Expires ${esc(c.expiry)} (${days} day${days===1?'':'s'})</small></span><button class="btn small" onclick="$('#modal').remove();clientProfile('${c.id}')">Open client</button></div>`}).join('');
  }else if(type==='low_stock'){
    title='Low-stock products';
    html=rows.sort((a,b)=>Number(a.stock||0)-Number(b.stock||0)).map(p=>`<div class="booking-person"><span><b>${esc(p.name)}</b><small>Current stock: ${p.stock??0} · Minimum: ${p.minimum_stock??0} · ${esc(p.category||'')}</small></span><button class="btn small" onclick="$('#modal').remove();page='inventory';render()">Inventory</button></div>`).join('');
  }else if(type==='unassigned'){
    title='Classes without an instructor';
    html=rows.sort((a,b)=>(a.class_date+a.class_time).localeCompare(b.class_date+b.class_time)).map(c=>`<div class="booking-person"><span><b>${esc(c.class_type||'Class')}</b><small>${esc(c.class_date)} · ${formatTime((c.class_time||'00:00').slice(0,5))} · ${esc(c.studio_type||'')}</small></span><button class="btn small" onclick="$('#modal').remove();editClassModal('${c.id}')">Assign</button></div>`).join('');
  }else if(type==='zero_attendance'){
    title='Past classes with zero attendance';
    html=rows.sort((a,b)=>(b.class_date+b.class_time).localeCompare(a.class_date+a.class_time)).map(c=>`<div class="booking-person"><span><b>${esc(c.class_type||'Class')}</b><small>${esc(c.class_date)} · ${formatTime((c.class_time||'00:00').slice(0,5))} · ${esc(c.instructor||'No instructor')} · 0 checked in</small></span><button class="btn small" onclick="$('#modal').remove();openClass('${c.id}')">Open class</button></div>`).join('');
  }else if(type==='waitlist'){
    title='Waitlisted bookings';
    html=rows.map(b=>{const c=db.clients.find(x=>String(x.id)===String(b.client_id)),cl=db.classes.find(x=>String(x.id)===String(b.class_id));return `<div class="booking-person"><span><b>${esc(c?.name||'Client')}</b><small>${esc(cl?.class_type||'Class')} · ${esc(cl?.class_date||'')} · ${cl?.class_time?formatTime(String(cl.class_time).slice(0,5)):''}</small></span><button class="btn small" onclick="$('#modal').remove();openClass('${b.class_id}')">Open class</button></div>`}).join('');
  }
  modal(title,html||'<div class="empty">Nothing needs attention here.</div>');
}

function dashboard(){
  const activeSales=salesActive(),rev=activeSales.reduce((a,s)=>a+Number(s.total||0),0),exp=db.expenses.reduce((a,e)=>a+Number(e.amount||0),0),todayRev=activeSales.filter(s=>String(s.created_at||'').slice(0,10)===today()).reduce((a,s)=>a+Number(s.total||0),0),monthRev=activeSales.filter(s=>String(s.created_at||'').slice(0,10)>=monthStart()).reduce((a,s)=>a+Number(s.total||0),0),monthExp=db.expenses.filter(e=>String(e.expense_date||'')>=monthStart()).reduce((a,e)=>a+Number(e.amount||0),0),occ=occupancyStats();
  layout(`<div class="grid kpis"><div class="card kpi"><div class="label">Revenue today</div><div class="value">${money(todayRev)}</div></div><div class="card kpi"><div class="label">Revenue this month</div><div class="value">${money(monthRev)}</div></div><div class="card kpi"><div class="label">Month profit</div><div class="value">${money(monthRev-monthExp)}</div></div><div class="card kpi"><div class="label">Occupancy</div><div class="value">${occ.pct}%</div></div></div><div class="spacer"></div><div class="grid three"><div class="card"><h3>Studio alerts</h3>${alertRow('Pending payments','pending')}${alertRow('Clients with ≤1 session','low_sessions')}${alertRow('Packages expiring in 7 days','expiring')}${alertRow('Low-stock products','low_stock')}${alertRow('Classes without instructor','unassigned')}${alertRow('Zero-attendance past classes','zero_attendance')}${alertRow('Waitlisted bookings','waitlist')}</div><div class="card"><h3>Revenue mix</h3><div class="cart-row"><span>Pilates</span><b>${money(revenueForScope('Pilates'))}</b></div><div class="cart-row"><span>Megacore</span><b>${money(revenueForScope('Megacore'))}</b></div><div class="cart-row"><span>Both packages</span><b>${money(revenueForScope('Both'))}</b></div></div><div class="card"><h3>Totals</h3><div class="cart-row"><span>All revenue</span><b>${money(rev)}</b></div><div class="cart-row"><span>All expenses</span><b>${money(exp)}</b></div><div class="cart-row"><span>Estimated profit</span><b>${money(rev-exp)}</b></div></div></div><div class="spacer"></div><div class="card"><h3>Today's classes</h3>${db.classes.filter(c=>c.class_date===today()&&!c.cancelled).map(classCard).join('')||'<div class="empty">No classes today.</div>'}</div>`,`Dashboard`,`Studio performance, alerts and today's operations`)
}

function operations(){
  const occ=occupancyStats(),birthdays=db.clients.filter(c=>c.birthday&&String(c.birthday).slice(5,7)===String(new Date().getMonth()+1).padStart(2,'0')),birthdayUsed=db.client_rewards.filter(r=>r.reward_type==='birthday'&&r.status==='used'&&r.issued_year===new Date().getFullYear()).length;
  layout(`<div class="grid two"><div class="card"><h3>Studio alerts</h3>${alertRow('Pending payments','pending')}${alertRow('Clients with ≤1 session','low_sessions')}${alertRow('Packages expiring in 7 days','expiring')}${alertRow('Low-stock products','low_stock')}${alertRow('Classes without instructor','unassigned')}${alertRow('Zero-attendance past classes','zero_attendance')}${alertRow('Waitlisted bookings','waitlist')}</div><div class="card"><h3>Birthdays</h3><div class="cart-row"><span>Birthdays this month</span><b>${birthdays.length}</b></div><div class="cart-row"><span>Birthday gifts used this year</span><b>${birthdayUsed}</b></div>${birthdays.slice(0,12).map(c=>`<div class="cart-row"><span>${esc(c.name)}</span><small>${esc(String(c.birthday).slice(5))}</div>`).join('')}</div><div class="card"><h3>Events & Specials</h3><div class="toolbar"><button class="btn primary" onclick="eventModal()">+ Event</button></div>${db.studio_events.filter(e=>!e.archived_at).map(e=>{const p=eventPerformance(e);return `<div class="cart-row"><span><b>${esc(e.title)}</b><small>${esc(e.start_date)} → ${esc(e.end_date)} · ${esc(e.studio_scope)} · ${e.active?'Active':'Inactive'}</small><small>Booked guests: ${p.booked} · Checked in: ${p.checked} · Converted: ${p.converted}</small></span><span><button class="btn small" onclick="eventModal('${e.id}')">Edit</button> <button class="btn small" onclick="toggleEvent('${e.id}',${e.active?'false':'true'})">${e.active?'Deactivate':'Activate'}</button> <button class="btn small danger" onclick="archiveRecord('studio_events','${e.id}')">Archive</button></span></div>`}).join('')||'<div class="empty">No events yet.</div>'}</div><div class="card"><h3>Promo codes</h3><div class="toolbar"><button class="btn primary" onclick="promoModal()">+ Promo code</button></div>${db.promo_codes.filter(p=>!p.archived_at).map(p=>`<div class="cart-row"><span><b>${esc(p.code)}</b><small>${p.discount_type==='fixed'?money(p.discount_value):`${p.discount_value??p.discount_percent}% off`} · ${p.one_use_per_client!==false?'One use/client':'Repeat allowed'} · ${p.active?'Active':'Inactive'}</small></span><span><button class="btn small" onclick="promoModal('${p.id}')">Edit</button> <button class="btn small" onclick="togglePromo('${p.id}',${p.active?'false':'true'})">${p.active?'Deactivate':'Activate'}</button> <button class="btn small danger" onclick="archiveRecord('promo_codes','${p.id}')">Archive</button></span></div>`).join('')||'<div class="empty">No promo codes.</div>'}</div><div class="card"><h3>Reports & backup</h3><div class="cart-row"><span>Overall occupancy</span><b>${occ.pct}%</b></div><div class="toolbar"><input id="reportFrom" type="date" value="${monthStart()}"><input id="reportTo" type="date" value="${today()}"><button class="btn" onclick="exportDateRangeReport()">Export date-range CSV</button><button class="btn" onclick="exportData()">Full backup JSON</button></div></div><div class="card"><h3>Announcements</h3><div class="toolbar"><button class="btn primary" onclick="announcementModal()">+ Announcement</button></div>${db.announcements.map(a=>`<div class="cart-row"><span><b>${esc(a.title)}</b><small>${esc(a.message)} · ${esc(a.audience||'Everyone')} · ${a.active===false?'Inactive':'Active'}</small></span><span><button class="btn small" onclick="announcementModal('${a.id}')">Edit</button> <button class="btn small" onclick="toggleAnnouncement('${a.id}',${a.active===false?'true':'false'})">${a.active===false?'Activate':'Deactivate'}</button> <button class="btn small danger" onclick="removeItem('announcements','${a.id}')">Delete</button></span></div>`).join('')||'<div class="empty">No announcements.</div>'}</div><div class="card"><h3>Audit log</h3>${db.audit_log.slice(-30).reverse().map(a=>`<div class="cart-row"><span><b>${esc(a.action)}</b><small>${esc(a.details||'')} · ${new Date(a.created_at).toLocaleString()}</small></span></div>`).join('')||'<div class="empty">Activity will appear here.</div>'}</div></div>`,`Operations`,`Tap any studio alert to see exactly what needs attention.`)
}

function applyClickableAlertStyle(){
  if(document.getElementById('coreTheoryAlertStyle'))return;
  const s=document.createElement('style');s.id='coreTheoryAlertStyle';
  s.textContent=`
    .alert-click-row{
      width:100%;border:0;background:transparent;font:inherit;text-align:left;
      cursor:pointer;color:#333 !important;-webkit-text-fill-color:#333 !important;
      padding-left:0;padding-right:0;
    }
    .alert-click-row:hover{background:rgba(0,0,0,.035)}
    .alert-click-row b{white-space:nowrap}
  `;
  document.head.appendChild(s);
}


function frontdesk(){
  if(!isFrontDeskStaff()||!db.frontDeskDuty)return account();
  const rows=(db.frontDeskToday||[]),byClass={};
  rows.forEach(r=>{const k=r.class_id;if(!byClass[k])byClass[k]={name:r.class_name,time:r.class_time,instructor:r.instructor_name,rows:[]};byClass[k].rows.push(r)});
  const payments=Object.values(byClass).map(g=>`<div class="card"><h3>${esc(g.name)} · ${g.time?formatTime(String(g.time).slice(0,5)):''}</h3><p class="muted">${esc(g.instructor||'')}</p>${g.rows.map(r=>`<div class="booking-person"><span><b>${esc(r.client_name)}</b><small>${esc(r.booking_status)} · ${r.payment_status==='pending'?'<b>Payment Pending</b>':'Paid'}${r.membership_name?' · '+esc(r.membership_name):''}${r.coupon_code?` · Coupon ${esc(r.coupon_code)} (${r.discount_percent||0}% off)`:''}</small></span><span>${r.payment_status==='pending'?(r.package_order_id?`<button class="btn small primary" onclick="frontDeskPayment('${r.package_order_id}')">Collect payment</button>`:`<button class="btn small primary" onclick="manualBookingPayment('${r.booking_id}',decodeURIComponent('${encodeURIComponent(r.client_name||'Client')}'))">Add package / collect</button>`):''}</span></div>`).join('')}</div>`).join('');
  layout(`<div class="notice card"><b>Booking / Front Desk Duty is active today.</b><p>You can add clients to classes even when they have no sessions. If they do not have a valid session, the booking is marked Payment Pending and no session is deducted until payment/package is resolved.</p></div><div class="card"><h3>Add a WhatsApp / phone booking</h3><label>Class</label><select id="fdBookClass">${(db.frontDeskBookingClasses||[]).map(c=>`<option value="${c.class_id}">${esc(c.class_date)} · ${c.class_time?formatTime(String(c.class_time).slice(0,5)):''} · ${esc(c.class_name)} · ${esc(c.studio_type||'')}</option>`).join('')}</select><label>Client</label><input id="fdClientSearch" placeholder="Type client name…" oninput="frontDeskBookingClientSearch(this.value)"><div id="fdClientSearchResults"></div><div id="fdSelectedClient" class="muted">No client selected.</div><button class="btn primary" onclick="frontDeskManualBook()">Add client to class</button></div><div class="spacer"></div>${payments||'<div class="card empty">No bookings today.</div>'}`,'Front Desk','Bookings and payments without access to private client contact information');
}
let fdBookingClient=null;
async function frontDeskBookingClientSearch(q){const box=$("#fdClientSearchResults");if(!box)return;const term=String(q||'').trim();fdBookingClient=null;if(term.length<2){box.innerHTML='';return}const {data,error}=await sb.rpc('front_desk_client_search',{p_query:term});if(error){box.innerHTML=`<div class="warning">${esc(error.message)}</div>`;return}box.innerHTML=(data||[]).map(c=>`<button type="button" class="btn small full" style="text-align:left;margin-top:6px" onclick="chooseFrontDeskBookingClient('${c.id}',decodeURIComponent('${encodeURIComponent(c.name||'')}'))">${esc(c.name)}</button>`).join('')||'<div class="muted">No matching client.</div>'}
function chooseFrontDeskBookingClient(id,name){fdBookingClient={id:String(id),name:String(name)};$("#fdClientSearch").value=name;$("#fdClientSearchResults").innerHTML='';$("#fdSelectedClient").innerHTML=`Selected: <b>${esc(name)}</b>`}
async function frontDeskManualBook(){const classId=$("#fdBookClass")?.value;if(!classId||!fdBookingClient)return alert('Choose a class and client.');const {data,error}=await sb.rpc('staff_book_client',{p_class_id:classId,p_client_id:fdBookingClient.id});if(error)return alert(error.message);fdBookingClient=null;await loadAll();alert(data?.payment_status==='pending'?(data?.status==='waitlist'?'Client added to waitlist. Payment is pending.':'Client booked. Payment is pending because there is no valid session/package.'):(data?.status==='waitlist'?'Client added to waitlist.':'Client booked using their valid package.'))}
function manualBookingPayment(bookingId,clientName){const ms=db.frontDeskMemberships||[];modal('Add package / collect payment',`<p><b>${esc(clientName)}</b></p><label>Package</label><select id="manualMembership">${ms.map(m=>`<option value="${m.id}">${esc(m.name)} — ${money(m.price)}</option>`).join('')}</select><label>Coupon code <span class="muted">(optional)</span></label><input id="manualCoupon"><label>Payment method</label><select id="manualMethod"><option>Cash</option><option>Card</option><option>Whish</option><option>Transfer</option></select><button class="btn primary full" onclick="settleManualBooking('${bookingId}')">Collect payment & link package</button>`)}
async function settleManualBooking(bookingId){const membershipId=$("#manualMembership").value,method=$("#manualMethod").value,coupon=$("#manualCoupon").value.trim();const {error}=await sb.rpc('settle_manual_booking_with_membership',{p_booking_id:bookingId,p_membership_id:membershipId,p_payment_method:method,p_coupon_code:coupon||null});if(error)return alert(error.message);$("#modal").remove();await loadAll();alert('Payment recorded, package linked, and the booking reconciled.')}


function openClass(id){const c=db.classes.find(x=>String(x.id)===String(id));if(!c)return;const bs=activeBookings(id),guests=isOwner()?(db.guest_bookings||[]).filter(g=>String(g.class_id)===String(id)&&g.status!=='cancelled'):(db.guestRoster||[]).filter(g=>String(g.class_id)===String(id)&&g.status!=='cancelled'),checked=bs.filter(b=>b.status==='checked_in').length+guests.filter(g=>g.status==='checked_in').length,noShows=bs.filter(b=>b.status==='no_show').length+guests.filter(g=>g.status==='no_show').length,wait=bs.filter(b=>b.status==='waitlist').length,pending=bs.filter(b=>b.payment_status==='pending').length,notes=teachingNotesForClass(id);const rows=bs.map(b=>{const roster=db.roster?.find(r=>String(r.booking_id)===String(b.id)),cl=isOwner()?db.clients.find(x=>String(x.id)===String(b.client_id)):null,clientName=cl?.name||roster?.client_name||'Client',n=notes.filter(x=>String(x.client_id)===String(b.client_id));return `<div class="booking-person"><span><b>${esc(clientName)}</b><small>${esc(b.status)} · ${b.payment_status==='pending'?'<b>Payment Pending</b>':esc(b.payment_status||'paid')}</small>${n.map(x=>`<small>⚑ ${esc(x.category)}: ${esc(x.note)}</small>`).join('')}</span>${isStaff()?`<span>${b.status==='booked'?`<button class="btn small" onclick="checkIn('${b.id}')">Check in</button>`:''}<button class="btn small" onclick="setBookingStatus('${b.id}','no_show')">No-show</button>${isOwner()&&b.payment_status==='pending'&&!b.package_order_id?` <button class="btn small primary" onclick="manualOwnerBookingPayment('${b.id}',decodeURIComponent('${encodeURIComponent(clientName)}'))">Add package / collect</button>`:''}</span>`:''}</div>`}).join('');const guestRows=guests.map(g=>`<div class="booking-person"><span><b>${esc(g.guest_name||'Guest')}</b><small>Guest · ${esc(g.status)}${g.host_name?' · invited by '+esc(g.host_name):''}</small></span>${isStaff()&&g.status==='booked'?`<button class="btn small" onclick="checkInGuest('${g.booking_id||g.id}')">Check in guest</button>`:''}</div>`).join('');modal(`${esc(c.class_type)} · ${formatTime((c.class_time||'00:00').slice(0,5))}`,`<p><span class="badge" style="background:${levelColor(c.level)}">${esc(c.level||'Open Level')}</span> ${esc(c.studio_type||'Pilates')} · ${esc(c.instructor||'')}</p><div class="grid three"><div class="card kpi"><div class="label">Booked</div><div class="value">${bs.length+guests.length}</div></div><div class="card kpi"><div class="label">Checked in</div><div class="value">${checked}</div></div><div class="card kpi"><div class="label">Waitlist</div><div class="value">${wait}</div></div></div><p class="muted">No-shows: ${noShows} · Payment pending: ${pending} · Capacity: ${c.capacity||0}</p>${rows}${guestRows||''}${!rows&&!guestRows?'<div class="empty">No bookings yet.</div>':''}${isOwner()?`<div class="toolbar"><button class="btn primary" onclick="addBookingModal('${c.id}')">+ Add client</button><button class="btn" onclick="$('#modal').remove();editClassModal('${c.id}')">Edit class</button><button class="btn" onclick="substituteClassModal('${c.id}')">Substitute</button></div>`:''}`)}
function manualOwnerBookingPayment(bookingId,clientName){const ms=sortedMemberships();modal('Add package / collect payment',`<p><b>${esc(clientName)}</b></p><label>Package</label><select id="manualMembership">${ms.map(m=>`<option value="${m.id}">${esc(m.name)} — ${money(m.price)}</option>`).join('')}</select><label>Coupon code <span class="muted">(optional)</span></label><input id="manualCoupon"><label>Payment method</label><select id="manualMethod"><option>Cash</option><option>Card</option><option>Whish</option><option>Transfer</option></select><button class="btn primary full" onclick="settleManualBooking('${bookingId}')">Collect payment & link package</button>`)}


function team(){
  const month=currentYM();
  layout(`<div class="card"><div class="toolbar"><button class="btn primary" onclick="inviteInstructorModal()">+ Invite Staff</button><button class="btn" onclick="teamModal()">+ Add non-login team member</button></div><div class="warning" style="margin-bottom:14px">You can give Booking / Front Desk Duty to an Instructor or Receptionist for the day. Only instructors receive teaching/payroll statistics.</div><table><thead><tr><th>Name</th><th>Role</th><th>This month</th><th>Scheduled</th><th>Total taught</th><th>Class rate</th><th>Est. pay</th><th></th></tr></thead><tbody>${db.team.filter(t=>!t.archived_at).map(t=>{const instructor=String(t.role||'').toLowerCase()==='instructor',s=instructor&&t.auth_user_id?instructorStats(t.auth_user_id,month):{taught:0,scheduled:0,total:0},rate=Number(t.class_rate||0);return `<tr><td><b>${esc(t.name)}</b><div class="muted">${esc(t.email||'')}</div></td><td>${esc(t.role||'')}</td><td>${instructor?`<b>${s.taught}</b>`:'—'}</td><td>${instructor?s.scheduled:'—'}</td><td>${instructor?s.total:'—'}</td><td>${instructor?money(rate):'—'}</td><td>${instructor?`<b>${money(s.taught*rate)}</b>`:'—'}</td><td><button class="btn small" onclick="editTeamMember('${t.id}')">Edit</button>${t.auth_user_id?`${instructor?` <button class="btn small" onclick="payrollModal('${t.id}')">Payroll</button>`:''} <button class="btn small" onclick="setFrontDeskDuty('${t.auth_user_id}',true)">Booking Desk today</button> <button class="btn small" onclick="setFrontDeskDuty('${t.auth_user_id}',false)">End duty</button> <button class="btn small danger" onclick="toggleInstructorAccess('${t.id}',${t.invite_status==='disabled'?'true':'false'})">${t.invite_status==='disabled'?'Reactivate':'Deactivate login'}</button>`:` <button class="btn small danger" onclick="archiveRecord('team','${t.id}')">Archive</button>`}</td></tr>`}).join('')}</tbody></table></div>`,`Team`,`Teaching, payroll and delegated booking/front-desk access`)}
function inviteInstructorModal(){modal('Invite Staff',`<div class="form"><div><label>Full name</label><input id="iname" required></div><div><label>Email</label><input id="iemail" type="email" required></div><div><label>Phone number</label><input id="iphone" type="tel" required></div><div><label>Access role</label><select id="istaffrole"><option value="instructor">Instructor</option><option value="receptionist">Receptionist</option></select></div><div><label>Rate / commission</label><input id="irate" placeholder="For instructors, e.g. $20/class"></div><div class="full"><p class="muted">Receptionists only receive Booking / Front Desk and POS access on days you activate their duty. They do not receive Finance, Clients, Expenses, Team or Settings.</p><button class="btn primary" onclick="inviteInstructor()">Send invitation</button></div></div>`)}
async function inviteInstructor(){const name=$("#iname").value.trim(),email=$("#iemail").value.trim().toLowerCase(),phone=$("#iphone").value.trim(),rate=$("#irate").value.trim(),role=$("#istaffrole").value;if(!name||!email||!phone)return alert('Name, email and phone are required.');const btn=document.querySelector('#modal .btn.primary');btn.disabled=true;btn.textContent='Sending…';try{const r=await callStaffAdmin({action:'invite',name,email,phone,role,redirectTo:location.origin});const {error}=await sb.from('team').insert({name,email,phone,role:role==='receptionist'?'Receptionist':'Instructor',rate,auth_user_id:r.user_id,invite_status:'pending'});if(error)throw error;$("#modal").remove();await loadAll();alert((role==='receptionist'?'Receptionist':'Instructor')+' invitation sent.')}catch(e){alert(e.message)}finally{if(btn){btn.disabled=false;btn.textContent='Send invitation'}}}
async function setFrontDeskDuty(userId,active){if(!isOwner())return;const {error}=await sb.rpc('set_front_desk_duty',{p_user_id:userId,p_active:active});if(error)return alert(error.message);alert(active?'Booking / Front Desk Duty is active for this staff member today.':'Booking / Front Desk Duty ended.');await loadAll();}


// ================= CORE THEORY V9.4 FRONT DESK CLOSEOUT =================
function frontDeskAttendanceState(row){
  const status=String(row.booking_status||'');
  const checked=status==='checked_in';
  const pending=String(row.payment_status||'paid')==='pending';
  const deducted=!!row.session_deducted_at;
  const unlimited=Number(row.client_sessions)===999;
  if(!checked)return {label:status==='no_show'?'No-show':'Not checked in',kind:'neutral',cleared:false};
  if(pending)return {label:'Checked in · Payment pending',kind:'warning',cleared:false};
  if(unlimited)return {label:'Checked in · Unlimited package',kind:'good',cleared:true};
  if(deducted)return {label:'Checked in · Session deducted',kind:'good',cleared:true};
  return {label:'Checked in · Session NOT deducted',kind:'warning',cleared:false};
}
function frontDeskReconciliationRows(){
  return (db.frontDeskToday||[]).map(r=>({...r,_state:frontDeskAttendanceState(r)}));
}
function frontDeskCloseoutStats(){
  const rows=frontDeskReconciliationRows().filter(r=>r.booking_status==='checked_in');
  return {
    attended:rows.length,
    cleared:rows.filter(r=>r._state.cleared).length,
    unresolved:rows.filter(r=>!r._state.cleared).length
  };
}
function frontDeskReconciliationHtml(){
  const rows=frontDeskReconciliationRows();
  const byClass={};
  rows.forEach(r=>{if(!byClass[r.class_id])byClass[r.class_id]={name:r.class_name,time:r.class_time,instructor:r.instructor_name,rows:[]};byClass[r.class_id].rows.push(r)});
  return Object.entries(byClass).map(([classId,g])=>{
    const attended=g.rows.filter(r=>r.booking_status==='checked_in');
    const cleared=attended.filter(r=>r._state.cleared).length;
    const unresolved=attended.filter(r=>!r._state.cleared).length;
    const reconciled=attended.length>0&&unresolved===0;
    return `<div class="card"><div class="toolbar"><div><h3 style="margin:0">${esc(g.name)} · ${g.time?formatTime(String(g.time).slice(0,5)):''}</h3><p class="muted">${esc(g.instructor||'')}</p></div><span class="badge ${reconciled?'good':'warning'}">${reconciled?'Reconciled ✓':`${unresolved} unresolved`}</span></div><div class="cart-row"><span>Attended</span><b>${attended.length}</b></div><div class="cart-row"><span>Cleared</span><b>${cleared}</b></div><div class="cart-row"><span>Needs attention</span><b>${unresolved}</b></div>${g.rows.map(r=>`<div class="booking-person"><span><b>${esc(r.client_name)}</b><small>${r._state.label}${r.membership_name?' · '+esc(r.membership_name):''}</small></span><span>${r.booking_status==='checked_in'&&!r._state.cleared?(r.package_order_id?`<button class="btn small primary" onclick="frontDeskPayment('${r.package_order_id}')">Resolve payment</button>`:`<button class="btn small primary" onclick="manualBookingPayment('${r.booking_id}',decodeURIComponent('${encodeURIComponent(r.client_name||'Client')}'))">Resolve</button>`):''}</span></div>`).join('')}</div>`;
  }).join('');
}
function showFrontDeskUnresolved(){
  const rows=frontDeskReconciliationRows().filter(r=>r.booking_status==='checked_in'&&!r._state.cleared);
  modal('Unresolved attendees',rows.length?rows.map(r=>`<div class="booking-person"><span><b>${esc(r.client_name)}</b><small>${esc(r.class_name)} · ${r.class_time?formatTime(String(r.class_time).slice(0,5)):''} · ${r._state.label}</small></span><span>${r.package_order_id?`<button class="btn small primary" onclick="frontDeskPayment('${r.package_order_id}')">Resolve payment</button>`:`<button class="btn small primary" onclick="manualBookingPayment('${r.booking_id}',decodeURIComponent('${encodeURIComponent(r.client_name||'Client')}'))">Resolve</button>`}</span></div>`).join(''):'<div class="empty">Everything is reconciled.</div>')}
function frontdesk(){
  if(!isFrontDeskStaff()||!db.frontDeskDuty)return account();
  const s=frontDeskCloseoutStats();
  layout(`<div class="notice card"><b>Booking / Front Desk Duty is active today.</b><p>Your job is to make sure every person who attended is financially/session cleared. Attendance itself remains with the class instructor/substitute.</p></div><div class="grid three"><div class="card kpi"><div class="label">Attended today</div><div class="value">${s.attended}</div></div><div class="card kpi"><div class="label">Cleared</div><div class="value">${s.cleared}</div></div><div class="card kpi"><div class="label">Unresolved</div><div class="value">${s.unresolved}</div><button class="btn small" onclick="showFrontDeskUnresolved()">View unresolved</button></div></div><div class="spacer"></div><div class="card"><h3>Add a WhatsApp / phone booking</h3><label>Class</label><select id="fdBookClass">${(db.frontDeskBookingClasses||[]).map(c=>`<option value="${c.class_id}">${esc(c.class_date)} · ${c.class_time?formatTime(String(c.class_time).slice(0,5)):''} · ${esc(c.class_name)} · ${esc(c.studio_type||'')}</option>`).join('')}</select><label>Client</label><input id="fdClientSearch" placeholder="Type client name…" oninput="frontDeskBookingClientSearch(this.value)"><div id="fdClientSearchResults"></div><div id="fdSelectedClient" class="muted">No client selected.</div><button class="btn primary" onclick="frontDeskManualBook()">Add client to class</button></div><div class="spacer"></div><div class="card"><h3>Today's reconciliation</h3><p class="muted">A class is reconciled only when every checked-in client is cleared by a deducted session, unlimited package, reward, or settled payment.</p></div>${frontDeskReconciliationHtml()||'<div class="card empty">No bookings today.</div>'}`,'Front Desk','All of today’s classes, attendance/payment status, and closeout')}



// ================= CORE THEORY V9.5 PACKAGE CLARITY =================
function packageScopeLabel(scope){
  return scope==='Pilates'?'Pilates':scope==='Megacore'?'Megacore':'Mix';
}
function packageScopeClass(scope){
  return scope==='Pilates'?'pilates':scope==='Megacore'?'megacore':'mix';
}
function packageDisplayName(m){
  return `${m.name} · ${packageScopeLabel(m.studio_scope||'Both')} · ${m.sessions===999?'Unlimited':m.sessions+' sessions'} · ${m.validity_days} days · ${money(m.price)}`;
}
function packageSortForClient(arr){
  return [...(arr||[])].filter(x=>!x.archived_at&&x.active!==false).sort((a,b)=>{
    const sa=Number(a.sort_order||0),sb=Number(b.sort_order||0);
    if(sa!==sb)return sa-sb;
    const aa=Number(a.sessions===999?9999:a.sessions||0),bb=Number(b.sessions===999?9999:b.sessions||0);
    if(aa!==bb)return aa-bb;
    return Number(a.price||0)-Number(b.price||0);
  });
}
let clientPackageTab='Pilates';
function packageTabButton(scope,label){
  return `<button class="tab ${clientPackageTab===scope?'active':''}" onclick="clientPackageTab='${scope}';packages()">${label}</button>`;
}
function packages(){
  const c=myClient();
  const scope=clientPackageTab;
  const list=packageSortForClient(db.memberships.filter(m=>(m.studio_scope||'Both')===scope));
  layout(`<div class="schedule-tabs package-scope-tabs">
    ${packageTabButton('Pilates','Pilates')}
    ${packageTabButton('Megacore','Megacore')}
    ${packageTabButton('Both','Mix')}
  </div>
  <div class="spacer"></div>
  <div class="grid three">${list.map(m=>`<div class="card package-card">
    <div class="toolbar"><span class="badge">${esc(packageScopeLabel(m.studio_scope||'Both'))}</span>${m.is_private?'<span class="badge">Private</span>':''}</div>
    <h3>${esc(m.name)}</h3>
    <div class="package-price">${money(m.price)}</div>
    <p><b>${m.sessions===999?'Unlimited':m.sessions+' sessions'}</b> · ${m.validity_days} days</p>
    <p class="muted">Valid for ${esc(packageScopeLabel(m.studio_scope||'Both'))}${m.is_private?' private sessions':''}</p>
    <button class="btn primary" onclick="packageRequestModal('${m.id}')">Choose package</button>
  </div>`).join('')||`<div class="card empty">No ${esc(scope==='Both'?'Mix':scope)} packages available.</div>`}</div>
  <div class="card notice"><b>Pay at Core Theory</b><p>Choose a package and optionally enter an active coupon code. Your request stays Payment Pending until payment is collected.</p></div>`,
  `Packages · ${scope==='Both'?'Mix':scope}`,
  `Current package: ${esc(c?.package||'None')} · ${esc(packageScopeLabel(c?.package_scope||'Both'))} · ${c?.sessions??0} sessions remaining`)
}
function packageRequestModal(id){
  const m=db.memberships.find(x=>String(x.id)===String(id));if(!m)return;
  modal('Request package',`<div class="card" style="margin-bottom:12px">
    <span class="badge">${esc(packageScopeLabel(m.studio_scope||'Both'))}</span>
    <h3>${esc(m.name)}</h3>
    <div class="package-price">${money(m.price)}</div>
    <p>${m.sessions===999?'Unlimited':m.sessions+' sessions'} · ${m.validity_days} days</p>
  </div>
  <label>Coupon code <span class="muted">(optional)</span></label>
  <input id="requestCoupon" placeholder="Enter coupon code">
  <button class="btn primary full" onclick="requestPackage('${m.id}')">Request ${esc(packageScopeLabel(m.studio_scope||'Both'))} package</button>`)
}
function clientBook(classId){
  const c=myClient(),cl=db.classes.find(x=>String(x.id)===String(classId));
  if(!c||!cl)return alert('Booking details are not ready. Refresh and try again.');
  if(db.bookings.some(b=>String(b.class_id)===String(classId)&&String(b.client_id)===String(c.id)&&b.status!=='cancelled'))return alert('You are already booked.');
  const classScope=cl.studio_type||'Pilates';
  const eligible=packageSortForClient(db.memberships.filter(m=>packageEligible(m,cl)));
  const exact=eligible.filter(m=>(m.studio_scope||'Both')===classScope);
  const mix=eligible.filter(m=>(m.studio_scope||'Both')==='Both');
  const rewards=db.client_rewards.filter(r=>String(r.client_id)===String(c.id)&&r.status==='active'&&Number(r.sessions_remaining)>0&&r.valid_from<=today()&&r.valid_until>=today()&&(r.studio_scope==='Both'||r.studio_scope===classScope));
  const currentOk=(Number(c.sessions)===999||Number(c.sessions)>0)&&(!c.package_scope||c.package_scope==='Both'||c.package_scope===classScope);
  const option=(m)=>`<option value="buy:${m.id}">${esc(m.name)} · ${esc(packageScopeLabel(m.studio_scope||'Both'))} · ${m.sessions===999?'Unlimited':m.sessions+' sessions'} · ${money(m.price)}</option>`;
  modal('How would you like to book?',`<div class="card" style="margin-bottom:12px">
    <b>${esc(cl.class_type)}</b>
    <p class="muted">${esc(classScope)} · ${esc(cl.class_date)} · ${formatTime(String(cl.class_time||'00:00').slice(0,5))}</p>
  </div>
  <label>Booking option</label>
  <select id="bookPackage">
    ${rewards.map(r=>`<option value="reward:${r.id}">${esc(r.title)} · ${esc(packageScopeLabel(r.studio_scope||'Both'))} · FREE</option>`).join('')}
    ${currentOk?`<option value="current">Use current package · ${esc(packageScopeLabel(c.package_scope||'Both'))} · ${c.sessions===999?'Unlimited':c.sessions+' sessions left'}</option>`:''}
    ${exact.length?`<optgroup label="${esc(classScope)} packages">${exact.map(option).join('')}</optgroup>`:''}
    ${mix.length?`<optgroup label="Mix packages">${mix.map(option).join('')}</optgroup>`:''}
  </select>
  <p class="muted">Only packages valid for this ${esc(classScope)} class are shown. Package type, sessions and price are always displayed so same-name packages are easy to tell apart.</p>
  <label>Coupon code <span class="muted">(optional, when buying a package)</span></label>
  <input id="bookCoupon" placeholder="Enter coupon code">
  <button class="btn primary full" onclick="confirmClientBooking('${classId}')">Confirm booking</button>`)
}
function frontDeskMembershipOption(m,selected=''){
  return `<option value="${m.id}" ${String(m.id)===String(selected)?'selected':''}>${esc(m.name)} · ${esc(packageScopeLabel(m.studio_scope||'Both'))} · ${m.sessions===999?'Unlimited':m.sessions+' sessions'} · ${money(m.price)}</option>`;
}
function manualBookingPayment(bookingId,clientName){
  const ms=packageSortForClient(db.frontDeskMemberships||[]);
  modal('Add package / collect payment',`<p><b>${esc(clientName)}</b></p>
  <label>Package</label><select id="manualMembership">${ms.map(m=>frontDeskMembershipOption(m)).join('')}</select>
  <label>Coupon code <span class="muted">(optional)</span></label><input id="manualCoupon">
  <label>Payment method</label><select id="manualMethod"><option>Cash</option><option>Card</option><option>Whish</option><option>Transfer</option></select>
  <button class="btn primary full" onclick="settleManualBooking('${bookingId}')">Collect payment & link package</button>`)
}
function manualOwnerBookingPayment(bookingId,clientName){
  const ms=packageSortForClient(sortedMemberships());
  modal('Add package / collect payment',`<p><b>${esc(clientName)}</b></p>
  <label>Package</label><select id="manualMembership">${ms.map(m=>frontDeskMembershipOption(m)).join('')}</select>
  <label>Coupon code <span class="muted">(optional)</span></label><input id="manualCoupon">
  <label>Payment method</label><select id="manualMethod"><option>Cash</option><option>Card</option><option>Whish</option><option>Transfer</option></select>
  <button class="btn primary full" onclick="settleManualBooking('${bookingId}')">Collect payment & link package</button>`)
}
function frontDeskPayment(orderId){
  const r=(db.frontDeskToday||[]).find(x=>String(x.package_order_id)===String(orderId));
  const opts=packageSortForClient(db.frontDeskMemberships||[]).map(m=>frontDeskMembershipOption(m,r?.membership_id)).join('');
  modal('Collect payment',`<p><b>${esc(r?.client_name||'Client')}</b></p>
  <label>Package</label><select id="fdMembership">${opts}</select>
  <div class="toolbar"><button class="btn" onclick="changeFrontDeskPackage('${orderId}')">Change pending package</button></div>
  <label>Payment method</label><select id="fdPayMethod"><option>Cash</option><option>Card</option><option>Whish</option><option>Transfer</option></select>
  <button class="btn primary full" onclick="settleFrontDeskPayment('${orderId}')">Collect payment</button>`)
}
function ownerChangePendingPackage(orderId){
  const o=db.package_orders.find(x=>String(x.id)===String(orderId));
  modal('Change pending package',`<label>Package / session</label>
  <select id="ownerPendingMembership">${packageSortForClient(db.memberships).map(m=>frontDeskMembershipOption(m,o?.membership_id)).join('')}</select>
  <button class="btn primary full" onclick="ownerSavePendingPackage('${orderId}')">Save change</button>
  <p class="muted">Package type, sessions and price are shown to avoid mixing up same-name Pilates, Megacore and Mix packages.</p>`)
}
function memberships(){
  const ms=sortedMemberships();
  layout(`<div class="card"><div class="toolbar"><button class="btn primary" onclick="membershipModal()">+ Add membership</button></div>${ms.length?ms.map((m,i)=>`<div class="cart-row"><span><b>${esc(m.name)}</b> <span class="badge">${esc(packageScopeLabel(m.studio_scope||'Both'))}</span>${m.is_private?' <span class="badge">Private Session</span>':''}<small>${m.is_private?'Private Session':(m.sessions===999?'Unlimited':m.sessions+' sessions')} · ${m.validity_days} days · ${esc(packageScopeLabel(m.studio_scope||'Both'))} · ${money(m.price)}</small></span><span class="row"><button class="btn small" ${i===0?'disabled':''} onclick="moveMembership('${m.id}',-1)">↑</button><button class="btn small" ${i===ms.length-1?'disabled':''} onclick="moveMembership('${m.id}',1)">↓</button><button class="btn small" onclick="editMembership('${m.id}')">Edit</button><button class="btn small danger" onclick="archiveRecord('memberships','${m.id}')">Archive</button></span></div>`).join(''):'<div class="empty">No memberships yet.</div>'}</div>`,`Memberships`,`Pilates, Megacore and Mix packages are clearly labelled`)}

function applyPackageClarityStyle(){
  if(document.getElementById('coreTheoryPackageClarity'))return;
  const s=document.createElement('style');s.id='coreTheoryPackageClarity';
  s.textContent=`
    .package-scope-tabs{display:flex;gap:8px;flex-wrap:wrap}
    .package-scope-tabs .tab{min-width:110px}
    .package-card .badge{margin-right:6px}
    .package-card h3{margin-top:14px}
  `;
  document.head.appendChild(s);
}


// ================= CORE THEORY V9.6 PACKAGE FLOW POLISH =================
function packageScopeOrder(scope){
  return scope==='Pilates'?0:scope==='Megacore'?1:2;
}
function packageSortForClient(arr){
  return [...(arr||[])].filter(x=>!x.archived_at&&x.active!==false).sort((a,b)=>{
    const scopeDiff=packageScopeOrder(a.studio_scope||'Both')-packageScopeOrder(b.studio_scope||'Both');
    if(scopeDiff!==0)return scopeDiff;
    const sa=Number(a.sort_order||0),sb=Number(b.sort_order||0);
    if(sa!==sb)return sa-sb;
    const aa=Number(a.sessions===999?9999:a.sessions||0),bb=Number(b.sessions===999?9999:b.sessions||0);
    if(aa!==bb)return aa-bb;
    return Number(a.price||0)-Number(b.price||0);
  });
}
function packageSummaryHtml(m){
  if(!m)return '';
  return `<div class="package-confirm-card">
    <div class="toolbar">
      <span class="badge">${esc(packageScopeLabel(m.studio_scope||'Both'))}</span>
      ${m.is_private?'<span class="badge">Private</span>':''}
    </div>
    <h3>${esc(m.name)}</h3>
    <div class="package-price">${money(m.price)}</div>
    <p><b>${m.sessions===999?'Unlimited':m.sessions+' sessions'}</b> · ${m.validity_days} days</p>
    <p class="muted">Valid for ${esc(packageScopeLabel(m.studio_scope||'Both'))}${m.is_private?' private sessions':''}</p>
  </div>`;
}
function packageRequestModal(id){
  const m=db.memberships.find(x=>String(x.id)===String(id));if(!m)return;
  modal('Confirm package',`${packageSummaryHtml(m)}
  <label>Coupon code <span class="muted">(optional)</span></label>
  <input id="requestCoupon" placeholder="Enter coupon code">
  <button class="btn primary full" onclick="requestPackage('${m.id}')">Confirm package request</button>
  <button class="btn full" onclick="$('#modal').remove()">Go back</button>`)
}
function confirmClientBooking(classId){
  const choice=$("#bookPackage")?.value||'',coupon=$("#bookCoupon")?.value.trim()||'';
  const cl=db.classes.find(x=>String(x.id)===String(classId));
  if(!cl)return alert('Class not found.');
  if(!choice)return alert('Choose how you would like to book.');

  if(choice.startsWith('buy:')){
    const membershipId=choice.split(':')[1];
    const m=db.memberships.find(x=>String(x.id)===String(membershipId));
    if(!m)return alert('Package not found.');
    const classScope=cl.studio_type||'Pilates';
    if(!((m.studio_scope||'Both')==='Both'||(m.studio_scope||'Both')===classScope)){
      return alert(`This ${packageScopeLabel(m.studio_scope||'Both')} package cannot be used for a ${classScope} class.`);
    }
    modal('Confirm booking',`<div class="card" style="margin-bottom:12px">
      <b>${esc(cl.class_type)}</b>
      <p class="muted">${esc(classScope)} · ${esc(cl.class_date)} · ${formatTime(String(cl.class_time||'00:00').slice(0,5))}</p>
    </div>
    ${packageSummaryHtml(m)}
    ${coupon?`<p><b>Coupon:</b> ${esc(coupon)}</p>`:''}
    <p class="muted">Your booking/package request will remain payment pending until Core Theory collects payment.</p>
    <button class="btn primary full" onclick="submitClientBooking('${classId}','${choice}','${encodeURIComponent(coupon)}')">Confirm booking</button>
    <button class="btn full" onclick="$('#modal').remove();clientBook('${classId}')">Change option</button>`);
    return;
  }

  const c=myClient();
  const text=choice==='current'
    ?`Use current package · ${packageScopeLabel(c?.package_scope||'Both')} · ${c?.sessions===999?'Unlimited':(c?.sessions??0)+' sessions left'}`
    :`Use free reward`;
  modal('Confirm booking',`<div class="card" style="margin-bottom:12px">
    <b>${esc(cl.class_type)}</b>
    <p class="muted">${esc(cl.studio_type||'Pilates')} · ${esc(cl.class_date)} · ${formatTime(String(cl.class_time||'00:00').slice(0,5))}</p>
  </div>
  <p><b>${esc(text)}</b></p>
  <button class="btn primary full" onclick="submitClientBooking('${classId}','${choice}','')">Confirm booking</button>
  <button class="btn full" onclick="$('#modal').remove();clientBook('${classId}')">Change option</button>`);
}
async function submitClientBooking(classId,choice,couponEncoded){
  const coupon=decodeURIComponent(couponEncoded||'');
  let packageChoice='current',membershipId=null,rewardId=null;
  if(choice.startsWith('buy:')){packageChoice='buy';membershipId=choice.split(':')[1]}
  else if(choice.startsWith('reward:')){packageChoice='reward';rewardId=choice.split(':')[1]}
  const {data,error}=await sb.rpc('book_class_v3',{
    p_class_id:String(classId),
    p_choice:packageChoice,
    p_membership_id:membershipId,
    p_coupon_code:coupon||null,
    p_reward_id:rewardId
  });
  if(error)return alert(error.message);
  $("#modal")?.remove();
  await loadAll();
  alert(data?.status==='waitlist'?'You are on the waitlist.':packageChoice==='buy'?'Class booked. Package payment is pending.':'Class booked.');
}
function clienthome(){
  const c=myClient(),packages=db.client_packages.filter(p=>String(p.client_id)===String(c?.id)),active=packages.find(p=>p.status==='active'),upcomingPkg=packages.find(p=>p.status==='upcoming'),rewards=db.client_rewards.filter(r=>String(r.client_id)===String(c?.id)&&r.status==='active'&&r.sessions_remaining>0&&r.valid_until>=today()),birthday=rewards.find(r=>r.reward_type==='birthday'),events=db.studio_events.filter(e=>!e.archived_at&&e.active&&e.start_date<=today()&&e.end_date>=today()&&(e.audience==='Clients'||e.audience==='Everyone')),notifs=(db.client_notifications||[]).filter(n=>String(n.client_id)===String(c?.id)&&!n.dismissed_at),mine=db.bookings.filter(b=>String(b.client_id)===String(c?.id)&&!['cancelled','no_show'].includes(b.status)),upcoming=mine.map(b=>({b,cl:db.classes.find(x=>String(x.id)===String(b.class_id))})).filter(x=>x.cl&&!x.cl.cancelled&&new Date(`${x.cl.class_date}T${String(x.cl.class_time||'00:00').slice(0,8)}`)>=new Date()).sort((a,b)=>(a.cl.class_date+a.cl.class_time).localeCompare(b.cl.class_date+b.cl.class_time)),next=upcoming[0],pending=db.package_orders.find(o=>String(o.client_id)===String(c?.id)&&o.status==='pending'),warn=packageWarning(c),history=(db.client_payments||[]).slice(0,5);
  layout(`${notifs.map(n=>`<div class="notice card" style="margin-bottom:12px"><b>${esc(n.title)}</b><p>${esc(n.message)}</p></div>`).join('')}
  <div class="grid three">
    <div class="card kpi"><div class="label">Current package</div><div class="value" style="font-size:20px">${esc(active?.package_name||c?.package||'None')}</div><small>${esc(packageScopeLabel(active?.studio_scope||c?.package_scope||'Both'))}</small></div>
    <div class="card kpi"><div class="label">Sessions left</div><div class="value">${active?.sessions_remaining??c?.sessions??0}</div></div>
    <div class="card kpi"><div class="label">Expiry</div><div class="value" style="font-size:20px">${esc(active?.expiry||c?.expiry||'—')}</div></div>
  </div>
  ${birthday?`<div class="notice card" style="margin-top:12px"><b>🎂 Happy Birthday from Core Theory!</b><p>You have 1 free session of your choice, valid until ${esc(birthday.valid_until)}.</p></div>`:''}
  ${events.map(e=>`<div class="notice card" style="margin-top:12px"><b>${esc(e.title)}</b><p>${esc(e.description||'')} · Valid ${esc(e.start_date)} to ${esc(e.end_date)}</p>${e.event_type==='guest_pass'?`<button class="btn primary" onclick="guestEventModal('${e.id}')">Bring a guest</button>`:''}</div>`).join('')}
  ${upcomingPkg?`<div class="notice card" style="margin-top:12px"><b>Upcoming package</b><p>${esc(upcomingPkg.package_name)} · ${esc(packageScopeLabel(upcomingPkg.studio_scope||'Both'))} · ${upcomingPkg.sessions_total===999?'Unlimited':upcomingPkg.sessions_total+' sessions'} · activates after your current package finishes.</p></div>`:''}
  ${warn?`<div class="warning" style="margin-top:12px">${esc(warn)}</div>`:''}
  ${pending?`<div class="notice card" style="margin-top:12px"><b>Payment pending</b><p>Your selected package is waiting for payment at Core Theory.</p></div>`:''}
  <div class="spacer"></div>
  <div class="card"><h3>Next class</h3>${next?`<div class="booking-person"><span><b>${esc(next.cl.class_type||'Class')}</b><small>${esc(next.cl.class_date)} · ${formatTime((next.cl.class_time||'00:00').slice(0,5))} · ${esc(next.cl.studio_type||'Pilates')}</small></span><button class="btn" onclick="page='mybookings';render()">My bookings</button></div>`:'<div class="empty">No upcoming booking.</div>'}<button class="btn primary" onclick="page='book';render()">Book a Class</button></div>
  <div class="spacer"></div>
  <div class="card"><h3>Recent payments</h3>${history.map(p=>`<div class="cart-row"><span><b>${esc(p.description||'Payment')}</b><small>${new Date(p.created_at).toLocaleDateString()} · ${esc(p.payment_method||'')}${p.coupon_code?` · Coupon ${esc(p.coupon_code)}`:''}</small></span><b>${money(p.total)}</b></div>`).join('')||'<div class="empty">No payment history yet.</div>'}</div>`,
  `Home`,`Your Core Theory account`)
}
function applyPackageFlowStyle(){
  if(document.getElementById('coreTheoryPackageFlow'))return;
  const s=document.createElement('style');s.id='coreTheoryPackageFlow';
  s.textContent=`
    .package-confirm-card{border:1px solid rgba(0,0,0,.08);border-radius:14px;padding:14px;margin:12px 0;background:#fff}
    .package-confirm-card h3{margin:10px 0 6px}
    .package-confirm-card .badge{margin-right:6px}
  `;
  document.head.appendChild(s);
}


// ================= CORE THEORY V9.7 CLIENT BOOKING CUTOFF =================
function clientClassStart(c){
  return new Date(`${c.class_date}T${String(c.class_time||'00:00').slice(0,8)}`);
}
function clientMinutesUntilClass(c){
  return Math.floor((clientClassStart(c).getTime()-Date.now())/60000);
}
function clientBookingClosed(c){
  const ms=clientClassStart(c).getTime()-Date.now();
  return ms < 60*60*1000; // exactly 60 minutes is still bookable; 59:59 or less is closed
}
function clientClassIsPast(c){
  return clientClassStart(c).getTime()<=Date.now();
}
function book(){
  const days=[];
  for(let i=0;i<14;i++){const d=new Date();d.setDate(d.getDate()+i);days.push(dateISO(d))}
  const cs=db.classes
    .filter(c=>days.includes(c.class_date)&&!c.cancelled&&!clientClassIsPast(c))
    .filter(c=>(c.studio_type||'Pilates')===studioTab)
    .sort((a,b)=>(a.class_date+a.class_time).localeCompare(b.class_date+b.class_time));

  layout(`<div class="schedule-tabs">
    <button class="tab ${studioTab==='Pilates'?'active':''}" onclick="studioTab='Pilates';book()">PILATES</button>
    <button class="tab ${studioTab==='Megacore'?'active':''}" onclick="studioTab='Megacore';book()">MEGACORE</button>
  </div>
  <div class="client-class-grid">${cs.map(c=>{
    const n=bookingCount(c.id),full=n>=Number(c.capacity||0),closed=clientBookingClosed(c);
    return `<div class="card client-class">
      <div class="date">${new Date(c.class_date+'T12:00').toLocaleDateString(undefined,{weekday:'short',month:'short',day:'numeric'})}</div>
      <h3>${esc(c.class_type)}</h3>
      <span class="badge" style="background:${levelColor(c.level)}">${esc(c.level||'Open Level')}</span>
      <p>${formatTime((c.class_time||'00:00').slice(0,5))} · ${esc(c.instructor||'')}</p>
      <p class="muted">${Math.max(0,Number(c.capacity||0)-n)} spots remaining</p>
      ${closed
        ? `<button class="btn" disabled>Booking closed</button><small class="muted">Bookings close 1 hour before class.</small>`
        : `<button class="btn primary" ${full?'disabled':''} onclick="clientBook('${c.id}')">${full?'Full':'Book'}</button>`
      }
    </div>`;
  }).join('')||'<div class="empty">No upcoming classes.</div>'}</div>`,
  `Book a Class`,
  `Only upcoming classes are shown. Online booking closes 1 hour before class.`)
}
function clientBook(classId){
  const c=myClient(),cl=db.classes.find(x=>String(x.id)===String(classId));
  if(!c||!cl)return alert('Booking details are not ready. Refresh and try again.');
  if(clientClassIsPast(cl))return alert('This class has already started.');
  if(clientBookingClosed(cl))return alert('Online booking closes 1 hour before class. Please contact Core Theory directly if you need help.');
  if(db.bookings.some(b=>String(b.class_id)===String(classId)&&String(b.client_id)===String(c.id)&&b.status!=='cancelled'))return alert('You are already booked.');

  const classScope=cl.studio_type||'Pilates';
  const eligible=packageSortForClient(db.memberships.filter(m=>packageEligible(m,cl)));
  const exact=eligible.filter(m=>(m.studio_scope||'Both')===classScope);
  const mix=eligible.filter(m=>(m.studio_scope||'Both')==='Both');
  const rewards=db.client_rewards.filter(r=>String(r.client_id)===String(c.id)&&r.status==='active'&&Number(r.sessions_remaining)>0&&r.valid_from<=today()&&r.valid_until>=today()&&(r.studio_scope==='Both'||r.studio_scope===classScope));
  const currentOk=(Number(c.sessions)===999||Number(c.sessions)>0)&&(!c.package_scope||c.package_scope==='Both'||c.package_scope===classScope);
  const option=(m)=>`<option value="buy:${m.id}">${esc(m.name)} · ${esc(packageScopeLabel(m.studio_scope||'Both'))} · ${m.sessions===999?'Unlimited':m.sessions+' sessions'} · ${money(m.price)}</option>`;

  modal('How would you like to book?',`<div class="card" style="margin-bottom:12px">
    <b>${esc(cl.class_type)}</b>
    <p class="muted">${esc(classScope)} · ${esc(cl.class_date)} · ${formatTime(String(cl.class_time||'00:00').slice(0,5))}</p>
  </div>
  <label>Booking option</label>
  <select id="bookPackage">
    ${rewards.map(r=>`<option value="reward:${r.id}">${esc(r.title)} · ${esc(packageScopeLabel(r.studio_scope||'Both'))} · FREE</option>`).join('')}
    ${currentOk?`<option value="current">Use current package · ${esc(packageScopeLabel(c.package_scope||'Both'))} · ${c.sessions===999?'Unlimited':c.sessions+' sessions left'}</option>`:''}
    ${exact.length?`<optgroup label="${esc(classScope)} packages">${exact.map(option).join('')}</optgroup>`:''}
    ${mix.length?`<optgroup label="Mix packages">${mix.map(option).join('')}</optgroup>`:''}
  </select>
  <p class="muted">Only packages valid for this ${esc(classScope)} class are shown. Online booking closes 1 hour before the class starts.</p>
  <label>Coupon code <span class="muted">(optional, when buying a package)</span></label>
  <input id="bookCoupon" placeholder="Enter coupon code">
  <button class="btn primary full" onclick="confirmClientBooking('${classId}')">Confirm booking</button>`)
}


// ================= CORE THEORY V9.8 CAPACITY + OWNER OVERRIDE =================
function clientBookingCapacityState(c){
  const booked=bookingCount(c.id);
  const capacity=Number(c.capacity||0);
  return {booked,capacity,spaces:Math.max(0,capacity-booked),full:booked>=capacity};
}
function book(){
  const days=[];
  for(let i=0;i<14;i++){const d=new Date();d.setDate(d.getDate()+i);days.push(dateISO(d))}
  const cs=db.classes
    .filter(c=>days.includes(c.class_date)&&!c.cancelled&&!clientClassIsPast(c))
    .filter(c=>(c.studio_type||'Pilates')===studioTab)
    .sort((a,b)=>(a.class_date+a.class_time).localeCompare(b.class_date+b.class_time));

  layout(`<div class="schedule-tabs">
    <button class="tab ${studioTab==='Pilates'?'active':''}" onclick="studioTab='Pilates';book()">PILATES</button>
    <button class="tab ${studioTab==='Megacore'?'active':''}" onclick="studioTab='Megacore';book()">MEGACORE</button>
  </div>
  <div class="client-class-grid">${cs.map(c=>{
    const cap=clientBookingCapacityState(c),closed=clientBookingClosed(c);
    return `<div class="card client-class">
      <div class="date">${new Date(c.class_date+'T12:00').toLocaleDateString(undefined,{weekday:'short',month:'short',day:'numeric'})}</div>
      <h3>${esc(c.class_type)}</h3>
      <span class="badge" style="background:${levelColor(c.level)}">${esc(c.level||'Open Level')}</span>
      <p>${formatTime((c.class_time||'00:00').slice(0,5))} · ${esc(c.instructor||'')}</p>
      <p class="muted">${cap.full?'Class is full':`${cap.spaces} spot${cap.spaces===1?'':'s'} remaining`}</p>
      ${closed
        ? `<button class="btn" disabled>Booking closed</button><small class="muted">Bookings close 1 hour before class.</small>`
        : cap.full
          ? `<button class="btn" disabled>Full</button>`
          : `<button class="btn primary" onclick="clientBook('${c.id}')">Book</button>`
      }
    </div>`;
  }).join('')||'<div class="empty">No upcoming classes.</div>'}</div>`,
  `Book a Class`,
  `Clients can only book if a spot is available. Online booking closes 1 hour before class.`)
}
function clientBook(classId){
  const c=myClient(),cl=db.classes.find(x=>String(x.id)===String(classId));
  if(!c||!cl)return alert('Booking details are not ready. Refresh and try again.');
  if(clientClassIsPast(cl))return alert('This class has already started.');
  if(clientBookingClosed(cl))return alert('Online booking closes 1 hour before class. Please contact Core Theory directly if you need help.');
  const cap=clientBookingCapacityState(cl);
  if(cap.full)return alert('This class is full.');
  if(db.bookings.some(b=>String(b.class_id)===String(classId)&&String(b.client_id)===String(c.id)&&b.status!=='cancelled'))return alert('You are already booked.');

  const classScope=cl.studio_type||'Pilates';
  const eligible=packageSortForClient(db.memberships.filter(m=>packageEligible(m,cl)));
  const exact=eligible.filter(m=>(m.studio_scope||'Both')===classScope);
  const mix=eligible.filter(m=>(m.studio_scope||'Both')==='Both');
  const rewards=db.client_rewards.filter(r=>String(r.client_id)===String(c.id)&&r.status==='active'&&Number(r.sessions_remaining)>0&&r.valid_from<=today()&&r.valid_until>=today()&&(r.studio_scope==='Both'||r.studio_scope===classScope));
  const currentOk=(Number(c.sessions)===999||Number(c.sessions)>0)&&(!c.package_scope||c.package_scope==='Both'||c.package_scope===classScope);
  const option=(m)=>`<option value="buy:${m.id}">${esc(m.name)} · ${esc(packageScopeLabel(m.studio_scope||'Both'))} · ${m.sessions===999?'Unlimited':m.sessions+' sessions'} · ${money(m.price)}</option>`;

  modal('How would you like to book?',`<div class="card" style="margin-bottom:12px">
    <b>${esc(cl.class_type)}</b>
    <p class="muted">${esc(classScope)} · ${esc(cl.class_date)} · ${formatTime(String(cl.class_time||'00:00').slice(0,5))}</p>
    <p class="muted">${cap.spaces} spot${cap.spaces===1?'':'s'} remaining</p>
  </div>
  <label>Booking option</label>
  <select id="bookPackage">
    ${rewards.map(r=>`<option value="reward:${r.id}">${esc(r.title)} · ${esc(packageScopeLabel(r.studio_scope||'Both'))} · FREE</option>`).join('')}
    ${currentOk?`<option value="current">Use current package · ${esc(packageScopeLabel(c.package_scope||'Both'))} · ${c.sessions===999?'Unlimited':c.sessions+' sessions left'}</option>`:''}
    ${exact.length?`<optgroup label="${esc(classScope)} packages">${exact.map(option).join('')}</optgroup>`:''}
    ${mix.length?`<optgroup label="Mix packages">${mix.map(option).join('')}</optgroup>`:''}
  </select>
  <p class="muted">Only packages valid for this ${esc(classScope)} class are shown. Online booking closes 1 hour before class.</p>
  <label>Coupon code <span class="muted">(optional, when buying a package)</span></label>
  <input id="bookCoupon" placeholder="Enter coupon code">
  <button class="btn primary full" onclick="confirmClientBooking('${classId}')">Confirm booking</button>`)
}
async function staffBook(classId){
  const clientId=$("#bkclient").value;if(!clientId)return;
  const {data,error}=await sb.rpc('staff_book_client',{p_class_id:String(classId),p_client_id:String(clientId),p_owner_force:isOwner()});
  if(error)return alert(error.message);
  $("#modal").remove();await loadAll();
  alert(data?.payment_status==='pending'
    ?(data?.status==='waitlist'?'Client added to waitlist. Payment is pending.':'Client booked. Payment is pending because there is no valid session/package.')
    :(data?.status==='waitlist'?'Client added to waitlist.':'Client booked.'));
  openClass(classId)
}
async function frontDeskManualBook(){
  const classId=$("#fdBookClass")?.value;
  if(!classId||!fdBookingClient)return alert('Choose a class and client.');
  const {data,error}=await sb.rpc('staff_book_client',{p_class_id:classId,p_client_id:fdBookingClient.id,p_owner_force:false});
  if(error)return alert(error.message);
  fdBookingClient=null;await loadAll();
  alert(data?.payment_status==='pending'
    ?(data?.status==='waitlist'?'Client added to waitlist. Payment is pending.':'Client booked. Payment is pending because there is no valid session/package.')
    :(data?.status==='waitlist'?'Client added to waitlist.':'Client booked using their valid package.'))
}


let deferredInstallPrompt=null;
function isStandalonePWA(){return window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone===true}
function isiOSDevice(){return /iphone|ipad|ipod/i.test(navigator.userAgent)}
function showPWAInstallHelp(){
  if(isStandalonePWA())return alert('Core Theory is already installed on this device.');
  if(deferredInstallPrompt){
    deferredInstallPrompt.prompt();
    deferredInstallPrompt.userChoice.finally(()=>{deferredInstallPrompt=null;updatePWAInstallButton()});
    return;
  }
  if(isiOSDevice()){
    modal('Install Core Theory',`<div class="card"><h3>Add Core Theory to your Home Screen</h3><p>1. Open Core Theory in <b>Safari</b>.</p><p>2. Tap the <b>Share</b> button.</p><p>3. Tap <b>Add to Home Screen</b>.</p><p>4. Tap <b>Add</b>.</p><p class="muted">It will open like an app in its own window.</p></div>`);
  }else{
    modal('Install Core Theory',`<div class="card"><h3>Install Core Theory</h3><p>Use your browser menu and choose <b>Install app</b> or <b>Add to Home Screen</b>.</p></div>`);
  }
}
function updatePWAInstallButton(){
  let b=document.getElementById('coreTheoryInstallButton');
  if(isStandalonePWA()){if(b)b.remove();return}
  if(!window.matchMedia('(max-width: 900px)').matches)return;
  if(!b){
    b=document.createElement('button');
    b.id='coreTheoryInstallButton';
    b.type='button';
    b.className='core-pwa-install';
    b.textContent='Install Core Theory';
    b.onclick=showPWAInstallHelp;
    document.body.appendChild(b);
  }
}
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredInstallPrompt=e;updatePWAInstallButton()});
window.addEventListener('appinstalled',()=>{deferredInstallPrompt=null;updatePWAInstallButton()});
window.addEventListener('load',()=>setTimeout(updatePWAInstallButton,700));
function applyPWAStyles(){
  if(document.getElementById('coreTheoryPWAStyle'))return;
  const s=document.createElement('style');s.id='coreTheoryPWAStyle';
  s.textContent=`.core-pwa-install{position:fixed;right:14px;bottom:14px;z-index:9999;border:0;border-radius:999px;padding:11px 15px;background:#722F37;color:#fff!important;-webkit-text-fill-color:#fff!important;font:600 14px/1.1 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.18);cursor:pointer}@media(min-width:901px){.core-pwa-install{display:none}}@media(display-mode:standalone){.core-pwa-install{display:none!important}}body{padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom)}`;
  document.head.appendChild(s);
}


// ================= CORE THEORY V9.10 MOBILE SIDE NAV =================
function applyMobileSideNav(){
  if(document.getElementById('coreTheoryMobileSideNav'))return;
  const s=document.createElement('style');
  s.id='coreTheoryMobileSideNav';
  s.textContent=`
    @media(max-width:760px){
      /* Keep navigation as a visible vertical sidebar instead of a horizontal top strip */
      .sidebar{
        position:fixed !important;
        left:0 !important;
        top:0 !important;
        bottom:0 !important;
        width:190px !important;
        height:100dvh !important;
        overflow-y:auto !important;
        overflow-x:hidden !important;
        z-index:1000 !important;
        padding-top:env(safe-area-inset-top) !important;
        padding-bottom:env(safe-area-inset-bottom) !important;
      }

      .sidebar .nav,
      .nav{
        display:flex !important;
        flex-direction:column !important;
        flex-wrap:nowrap !important;
        overflow:visible !important;
        width:100% !important;
        gap:8px !important;
      }

      .sidebar .nav button,
      .sidebar .nav .nav-item{
        width:100% !important;
        min-width:0 !important;
        white-space:normal !important;
        text-align:left !important;
        justify-content:flex-start !important;
        color:#fff !important;
        -webkit-text-fill-color:#fff !important;
      }

      .main,
      main,
      .content,
      .page-content{
        margin-left:190px !important;
        width:calc(100% - 190px) !important;
        max-width:calc(100% - 190px) !important;
      }

      /* Prevent top horizontal nav behavior on phone */
      .mobile-nav,
      .top-nav,
      .nav-scroll,
      .nav-wrapper{
        overflow-x:visible !important;
        white-space:normal !important;
      }

      /* Make content usable on narrow phones beside the sidebar */
      .grid,
      .grid.two,
      .grid.three,
      .grid.kpis{
        grid-template-columns:1fr !important;
      }

      table{
        display:block;
        overflow-x:auto;
        max-width:100%;
      }

      .card{
        max-width:100%;
        box-sizing:border-box;
      }
    }

    @media(max-width:430px){
      .sidebar{
        width:165px !important;
      }
      .main,
      main,
      .content,
      .page-content{
        margin-left:165px !important;
        width:calc(100% - 165px) !important;
        max-width:calc(100% - 165px) !important;
      }
    }
  `;
  document.head.appendChild(s);
}


// ================= CORE THEORY V9.11 MOBILE DRAWER NAV =================
function openMobileMenu(){
  document.body.classList.add('mobile-menu-open');
}
function closeMobileMenu(){
  document.body.classList.remove('mobile-menu-open');
}
function toggleMobileMenu(){
  document.body.classList.toggle('mobile-menu-open');
}

function layout(content,title,subtitle=''){
  const role=isOwner()?'Owner':isInstructor()?'Instructor':isReceptionist()?'Receptionist':'Client';
  $("#app").innerHTML=`
    <div class="app">
      <div class="mobile-menu-backdrop" onclick="closeMobileMenu()"></div>
      <aside class="sidebar">
        <div class="mobile-drawer-head">
          <div class="drawer-wordmark" aria-label="Core Theory">
            <div class="drawer-wordmark-core">CORE</div>
            <div class="drawer-wordmark-theory">THEORY</div>
          </div>
          <button class="drawer-close" type="button" aria-label="Close menu" onclick="closeMobileMenu()">×</button>
        </div>
        <div class="brand desktop-brand">CORE THEORY<small>${role} Portal</small></div>
        <div class="mobile-role-label">${role} Portal</div>
        <div class="nav">${nav()}</div>
        <div class="role-chip">${esc(profile?.full_name||profile?.email||'')}<small>${role}</small></div>
        <button class="btn logout" onclick="logout()">Log out</button>
      </aside>
      <main class="main">
        <div class="topbar">
          <div class="mobile-title-row">
            <button class="mobile-menu-button" type="button" aria-label="Open menu" onclick="toggleMobileMenu()">☰</button>
            <div>
              <h1>${title}</h1>
              <p>${subtitle}</p>
              <div class="sync-note">☁ Cloud connected</div>
            </div>
          </div>
          <button class="btn" onclick="loadAll()">Refresh</button>
        </div>
        ${activeAnnouncementBanners()}
        ${content}
      </main>
    </div>`;

  document.querySelectorAll('[data-page]').forEach(b=>b.onclick=()=>{
    page=b.dataset.page;
    closeMobileMenu();
    render();
  });
  document.querySelectorAll('[data-custom]').forEach(b=>b.onclick=()=>{
    page='custom:'+b.dataset.custom;
    closeMobileMenu();
    render();
  });
}

function applyMobileDrawerNav(){
  if(document.getElementById('coreTheoryMobileDrawerNav'))return;
  const s=document.createElement('style');
  s.id='coreTheoryMobileDrawerNav';
  s.textContent=`
    .mobile-menu-button,.mobile-menu-backdrop,.drawer-close,.mobile-drawer-head,.mobile-role-label{display:none}

    @media(max-width:760px){
      body.mobile-menu-open{overflow:hidden}

      .app{display:block !important}

      .main,main,.content,.page-content{
        margin-left:0 !important;
        width:100% !important;
        max-width:100% !important;
        padding-left:14px !important;
        padding-right:14px !important;
        box-sizing:border-box !important;
      }

      .sidebar{
        position:fixed !important;
        left:0 !important;
        top:0 !important;
        bottom:0 !important;
        width:min(82vw,300px) !important;
        height:100dvh !important;
        z-index:1200 !important;
        overflow-y:auto !important;
        overflow-x:hidden !important;
        transform:translateX(-102%) !important;
        transition:transform .22s ease !important;
        padding:calc(14px + env(safe-area-inset-top)) 14px calc(18px + env(safe-area-inset-bottom)) !important;
        box-sizing:border-box !important;
        box-shadow:8px 0 28px rgba(0,0,0,.22) !important;
      }

      body.mobile-menu-open .sidebar{
        transform:translateX(0) !important;
      }

      .mobile-menu-backdrop{
        display:block !important;
        position:fixed;
        inset:0;
        background:rgba(0,0,0,.36);
        z-index:1190;
        opacity:0;
        visibility:hidden;
        transition:opacity .22s ease,visibility .22s ease;
      }

      body.mobile-menu-open .mobile-menu-backdrop{
        opacity:1;
        visibility:visible;
      }

      .mobile-menu-button{
        display:inline-grid !important;
        place-items:center;
        flex:0 0 auto;
        width:42px;
        height:42px;
        border:0;
        border-radius:12px;
        background:#722F37;
        color:#fff !important;
        -webkit-text-fill-color:#fff !important;
        font-size:23px !important;
        line-height:1;
        padding:0;
      }

      .mobile-title-row{
        display:flex;
        align-items:flex-start;
        gap:10px;
        min-width:0;
      }

      .topbar{
        align-items:flex-start !important;
        gap:10px !important;
      }

      .topbar h1{
        font-size:24px !important;
        line-height:1.15 !important;
        margin-top:2px !important;
      }

      .mobile-drawer-head{
        display:flex !important;
        align-items:center;
        justify-content:space-between;
        gap:10px;
        margin-bottom:8px;
      }

      .drawer-wordmark{
        display:flex;
        flex-direction:column;
        align-items:flex-start;
        justify-content:center;
        line-height:1;
        padding:2px 0 4px;
      }

      .drawer-wordmark-core{
        color:#722F37 !important;
        -webkit-text-fill-color:#722F37 !important;
        font-family:Georgia,"Times New Roman",serif;
        font-size:31px;
        font-weight:700;
        letter-spacing:-1.8px;
        line-height:.86;
      }

      .drawer-wordmark-theory{
        margin-top:6px;
        color:#8a8a86 !important;
        -webkit-text-fill-color:#8a8a86 !important;
        font-family:"Helvetica Neue",Arial,sans-serif;
        font-size:11px;
        font-weight:600;
        letter-spacing:7.2px;
        line-height:1;
        padding-left:2px;
      }

      .drawer-close{
        display:grid !important;
        place-items:center;
        width:38px;
        height:38px;
        border:0;
        background:rgba(255,255,255,.08);
        border-radius:10px;
        color:#fff !important;
        -webkit-text-fill-color:#fff !important;
        font-size:28px !important;
        line-height:1;
        padding:0;
      }

      .desktop-brand{display:none !important}

      .mobile-role-label{
        display:block !important;
        color:rgba(255,255,255,.68);
        font-size:12px;
        text-transform:uppercase;
        letter-spacing:.08em;
        padding:0 8px 10px;
      }

      .sidebar .nav,.nav{
        display:flex !important;
        flex-direction:column !important;
        gap:5px !important;
        width:100% !important;
        overflow:visible !important;
      }

      .sidebar .nav button,.sidebar .nav .nav-item{
        width:100% !important;
        min-width:0 !important;
        padding:12px 13px !important;
        border-radius:10px !important;
        text-align:left !important;
        justify-content:flex-start !important;
        white-space:normal !important;
        font-size:15px !important;
        color:#fff !important;
        -webkit-text-fill-color:#fff !important;
      }

      .sidebar .nav button.active{
        background:#722F37 !important;
        color:#fff !important;
        -webkit-text-fill-color:#fff !important;
      }

      .role-chip{
        margin-top:16px !important;
      }

      .logout{
        width:100% !important;
        margin-top:8px !important;
        color:#333 !important;
        -webkit-text-fill-color:#333 !important;
      }

      .grid,.grid.two,.grid.three,.grid.kpis{
        grid-template-columns:1fr !important;
      }

      table{
        display:block;
        overflow-x:auto;
        max-width:100%;
      }

      .card{
        max-width:100%;
        box-sizing:border-box;
      }
    }
  `;
  document.head.appendChild(s);
}


// ================= CORE THEORY V9.15 FLEXIBLE RECURRING CLASSES =================
const CLASS_DAY_NAMES=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

function classRepeatControls(){
  const start=new Date((document.getElementById('cldate')?.value||today())+'T12:00:00');
  const startDay=start.getDay();
  const baseTime=document.getElementById('cltime')?.value||'08:00';
  return `
    <div class="full">
      <label>How should this class be added?</label>
      <select id="clrepeatmode" onchange="toggleClassRepeatControls()">
        <option value="single">One class only</option>
        <option value="weekly">Repeat weekly</option>
        <option value="days">Choose days & times</option>
      </select>
    </div>

    <div id="clweeklycontrols" class="full" style="display:none">
      <div class="form">
        <div>
          <label>Repeat for</label>
          <select id="clweeklyweeks">
            <option value="4">4 weeks</option>
            <option value="8">8 weeks</option>
            <option value="12">12 weeks</option>
            <option value="16">16 weeks</option>
            <option value="24">24 weeks</option>
          </select>
        </div>
        <div>
          <label>Same day & time</label>
          <div class="muted" style="padding-top:11px">Every ${CLASS_DAY_NAMES[startDay]} at ${baseTime?formatTime(baseTime):'—'}</div>
        </div>
      </div>
    </div>

    <div id="cldaycontrols" class="full" style="display:none">
      <label>Choose the days and time for each class</label>
      <div class="repeat-day-list">
        ${[1,2,3,4,5,6,0].map(day=>`
          <div class="repeat-day-row">
            <label class="repeat-day-check">
              <input type="checkbox" class="cldaycheck" data-day="${day}" ${day===startDay?'checked':''} onchange="toggleRepeatDayTime(${day})">
              <span>${CLASS_DAY_NAMES[day]}</span>
            </label>
            <input type="time" id="cldaytime_${day}" value="${baseTime}" ${day===startDay?'':'disabled'}>
          </div>
        `).join('')}
      </div>
      <div class="form" style="margin-top:12px">
        <div>
          <label>Repeat selected days for</label>
          <select id="cldaysweeks">
            <option value="1">This week only</option>
            <option value="4">4 weeks</option>
            <option value="8">8 weeks</option>
            <option value="12">12 weeks</option>
            <option value="16">16 weeks</option>
          </select>
        </div>
        <div>
          <label>Start from</label>
          <div class="muted" style="padding-top:11px">${start.toLocaleDateString(undefined,{weekday:'long',month:'short',day:'numeric'})}</div>
        </div>
      </div>
      <p class="muted">For the first week, days before the start date are skipped.</p>
    </div>
  `;
}

function toggleClassRepeatControls(){
  const mode=$("#clrepeatmode")?.value||'single';
  const weekly=$("#clweeklycontrols"),days=$("#cldaycontrols");
  if(weekly)weekly.style.display=mode==='weekly'?'block':'none';
  if(days)days.style.display=mode==='days'?'block':'none';
}

function toggleRepeatDayTime(day){
  const cb=document.querySelector(`.cldaycheck[data-day="${day}"]`);
  const input=document.getElementById(`cldaytime_${day}`);
  if(input)input.disabled=!cb?.checked;
}

function syncClassRepeatStart(){
  const date=$("#cldate")?.value,time=$("#cltime")?.value;
  const mode=$("#clrepeatmode")?.value;
  if(mode!=='days')return;
  const d=new Date((date||today())+'T12:00:00'),day=d.getDay();
  document.querySelectorAll('.cldaycheck').forEach(cb=>{
    if(Number(cb.dataset.day)===day){
      cb.checked=true;
      const t=document.getElementById(`cldaytime_${day}`);
      if(t){t.disabled=false;if(time)t.value=time}
    }
  });
}

function classForm(c={}){
  return `<div class="form">
    <div><label>Date</label><input type="date" id="cldate" value="${c.class_date||today()}" onchange="syncClassRepeatStart()"></div>
    <div><label>Time</label><input type="time" id="cltime" value="${(c.class_time||'').slice(0,5)}" onchange="syncClassRepeatStart()"></div>
    <div><label>Studio</label><select id="clstudio"><option ${c.studio_type==='Pilates'?'selected':''}>Pilates</option><option ${c.studio_type==='Megacore'?'selected':''}>Megacore</option></select></div>
    <div><label>Level</label><select id="cllevel">${db.class_levels.map(l=>`<option ${c.level===l.name?'selected':''}>${esc(l.name)}</option>`).join('')}</select></div>
    <div><label>Class name</label><input id="cltype" value="${esc(c.class_type||'')}" placeholder="Rise & Shine"></div>
    <div><label>Instructor</label><select id="clinstructor">${db.team.filter(t=>t.role==='Instructor'&&t.auth_user_id).map(t=>`<option value="${t.auth_user_id}" data-name="${esc(t.name)}" ${String(c.instructor_user_id||'')===String(t.auth_user_id)?'selected':''}>${esc(t.name)}</option>`).join('')}<option value="" ${!c.instructor_user_id?'selected':''}>Unassigned</option></select></div>
    <div><label>Capacity</label><input type="number" id="clcap" min="1" value="${c.capacity||10}"></div>
    ${!c.id?classRepeatControls():''}
    <div class="full">
      <button class="btn primary" onclick="${c.id?`saveClass('${c.id}')`:'addClass()'}">${c.id?'Save changes':'Add class'}</button>
      ${c.id?` <button class="btn danger" onclick="deleteClass('${c.id}')">Delete</button>`:''}
    </div>
  </div>`;
}

function classModal(){
  modal('Add class',classForm());
  setTimeout(()=>toggleClassRepeatControls(),0);
}

function mondayDate(d){
  const x=new Date(d);
  const day=(x.getDay()+6)%7;
  x.setDate(x.getDate()-day);
  x.setHours(12,0,0,0);
  return x;
}

function selectedClassDayRows(base){
  const weeks=Math.max(1,Number($("#cldaysweeks")?.value||1));
  const startDate=new Date(base);
  const firstMonday=mondayDate(startDate);
  const selections=[...document.querySelectorAll('.cldaycheck:checked')].map(cb=>({
    day:Number(cb.dataset.day),
    time:document.getElementById(`cldaytime_${cb.dataset.day}`)?.value
  })).filter(x=>x.time);

  if(!selections.length)throw new Error('Choose at least one day.');

  const rows=[];
  const jsDayToMondayOffset=day=>day===0?6:day-1;

  for(let w=0;w<weeks;w++){
    for(const s of selections){
      const d=new Date(firstMonday);
      d.setDate(firstMonday.getDate()+w*7+jsDayToMondayOffset(s.day));
      if(d<startDate)continue;
      rows.push({date:dateISO(d),time:s.time});
    }
  }
  return rows;
}

async function addClass(){
  const date=$("#cldate")?.value,time=$("#cltime")?.value,name=$("#cltype")?.value.trim();
  if(!date||!time||!name)return alert('Date, time and class name are required.');

  const mode=$("#clrepeatmode")?.value||'single';
  const base=new Date(date+'T12:00:00');
  const group=crypto.randomUUID();
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

  const instructor=$("#clinstructor");
  const common={
    class_type:name,
    instructor:instructor.selectedOptions[0]?.dataset.name||'',
    instructor_user_id:instructor.value||null,
    capacity:+$("#clcap").value||10,
    studio_type:$("#clstudio").value,
    level:$("#cllevel").value,
    recurring_group:instances.length>1?group:null
  };

  const rows=instances.map(x=>({...common,class_date:x.date,class_time:x.time}));

  // Prevent accidental duplicate entries that already exist at the exact same studio/date/time.
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
applyInstructorShiftStyles();
init();


// ================= CORE THEORY — EXACT INSTRUCTOR CLASS HOURS FIX =================
const CT_SLOT_DAYS=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

function ctInstructorSlotSummary(t){
  const slots=(db.instructor_class_slots||[])
    .filter(s=>String(s.team_id)===String(t.id))
    .sort((a,b)=>(Number(a.weekday)-Number(b.weekday))||String(a.class_time).localeCompare(String(b.class_time)));

  if(!slots.length)return '<span class="muted">No class hours set</span>';

  const grouped={};
  slots.forEach(s=>{
    const d=Number(s.weekday);
    (grouped[d]??=[]).push(String(s.class_time||'').slice(0,5));
  });

  return Object.entries(grouped).map(([day,times])=>`
    <div class="ct-slot-summary">
      <b>${CT_SLOT_DAYS[Number(day)]}</b>
      <span>${times.map(t=>formatTime(t)).join(', ')}</span>
    </div>`).join('');
}

function instructorSlotsModal(teamId){
  const t=db.team.find(x=>String(x.id)===String(teamId));
  if(!t)return alert('Instructor not found.');

  const slots=(db.instructor_class_slots||[])
    .filter(s=>String(s.team_id)===String(t.id))
    .sort((a,b)=>(Number(a.weekday)-Number(b.weekday))||String(a.class_time).localeCompare(String(b.class_time)));

  modal(`${esc(t.name)} · Class hours`,`
    <p>Choose the <b>exact class hours</b> ${esc(t.name)} covers on each day.</p>
    <p class="muted">Example: Monday 8:00 AM, 9:00 AM and 11:00 AM. A Monday 10:00 AM class will stay unassigned unless you add that exact hour.</p>

    <div id="ctSlotRows">
      ${slots.map(ctSlotRowHtml).join('')}
    </div>

    <button class="btn" type="button" onclick="ctAddSlotRow()">+ Add class hour</button>

    <div style="margin-top:16px">
      <button class="btn primary full" type="button" onclick="saveInstructorSlots('${t.id}')">
        Save class hours & assign schedule
      </button>
    </div>
  `);

  if(!slots.length)ctAddSlotRow();
}

function ctSlotRowHtml(s={}){
  return `
    <div class="ct-slot-row" data-ct-slot-row>
      <div>
        <label>Day</label>
        <select class="ct-slot-day">
          ${CT_SLOT_DAYS.map((d,i)=>`<option value="${i}" ${Number(s.weekday)===i?'selected':''}>${d}</option>`).join('')}
        </select>
      </div>
      <div>
        <label>Class time</label>
        <input class="ct-slot-time" type="time" value="${String(s.class_time||'08:00').slice(0,5)}">
      </div>
      <div>
        <label>Studio</label>
        <select class="ct-slot-studio">
          <option value="All" ${(s.studio_scope||'All')==='All'?'selected':''}>All</option>
          <option value="Pilates" ${s.studio_scope==='Pilates'?'selected':''}>Pilates</option>
          <option value="Megacore" ${s.studio_scope==='Megacore'?'selected':''}>Megacore</option>
        </select>
      </div>
      <button class="btn small danger" type="button" onclick="this.closest('[data-ct-slot-row]').remove()">×</button>
    </div>`;
}

function ctAddSlotRow(){
  const box=document.getElementById('ctSlotRows');
  if(box)box.insertAdjacentHTML('beforeend',ctSlotRowHtml({weekday:1,class_time:'08:00',studio_scope:'All'}));
}

async function saveInstructorSlots(teamId){
  const rows=[...document.querySelectorAll('[data-ct-slot-row]')].map(r=>({
    weekday:Number(r.querySelector('.ct-slot-day').value),
    class_time:r.querySelector('.ct-slot-time').value,
    studio_scope:r.querySelector('.ct-slot-studio').value
  }));

  if(rows.some(r=>!r.class_time))return alert('Choose a time for every class hour.');

  const seen=new Set();
  for(const r of rows){
    const k=`${r.weekday}|${r.class_time}|${r.studio_scope}`;
    if(seen.has(k))return alert(`You added ${CT_SLOT_DAYS[r.weekday]} ${formatTime(r.class_time)} more than once.`);
    seen.add(k);
  }

  const btn=document.querySelector('#modal .btn.primary');
  if(btn){btn.disabled=true;btn.textContent='Saving…'}

  const {data,error}=await sb.rpc('set_instructor_class_slots',{
    p_team_id:String(teamId),
    p_slots:rows
  });

  if(error){
    if(btn){btn.disabled=false;btn.textContent='Save class hours & assign schedule'}
    return alert(error.message);
  }

  $("#modal")?.remove();
  await loadAll();

  const assigned=Number(data?.assigned||0);
  const ambiguous=Number(data?.ambiguous||0);
  let msg=`Class hours saved. ${assigned} class${assigned===1?' was':'es were'} assigned automatically.`;
  if(ambiguous)msg+=` ${ambiguous} overlapping exact-time slot${ambiguous===1?' was':'s were'} left unassigned.`;
  alert(msg);
}

async function autoAssignUnassignedClasses(showResult=true){
  const {data,error}=await sb.rpc('auto_assign_classes_from_slots');
  if(error)return alert(error.message);
  await loadAll();
  if(showResult){
    const assigned=Number(data?.assigned||0);
    const ambiguous=Number(data?.ambiguous||0);
    alert(`${assigned} class${assigned===1?'':'es'} assigned.${ambiguous?` ${ambiguous} overlapping exact-time slot${ambiguous===1?'':'s'} left unassigned.`:''}`);
  }
}

function team(){
  const month=currentYM();

  layout(`
    <div class="card">
      <div class="toolbar">
        <button class="btn primary" onclick="inviteInstructorModal()">+ Invite Instructor</button>
        <button class="btn" onclick="teamModal()">+ Add non-login team member</button>
        <button class="btn" onclick="autoAssignUnassignedClasses()">↻ Assign schedule from class hours</button>
        <input type="month" id="teamMonth" value="${month}" onchange="team()">
      </div>

      <div class="warning" style="margin-bottom:14px">
        Choose the exact day and class time each instructor covers. Core Theory only auto-assigns an instructor when that exact slot matches.
      </div>

      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Role</th>
            <th>Class hours</th>
            <th>This month</th>
            <th>Scheduled</th>
            <th>Total taught</th>
            <th>Class rate</th>
            <th>Est. pay</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          ${db.team.filter(t=>!t.archived_at).map(t=>{
            const s=t.auth_user_id?instructorStats(t.auth_user_id,month):{taught:0,scheduled:0,total:0};
            const rate=Number(t.class_rate||0);
            return `
              <tr>
                <td>
                  <b>${esc(t.name)}</b>
                  <div class="muted">${esc(t.email||'')}</div>
                </td>
                <td>${esc(t.role||'')}</td>
                <td>${t.role==='Instructor'?ctInstructorSlotSummary(t):'<span class="muted">—</span>'}</td>
                <td><b>${s.taught}</b></td>
                <td>${s.scheduled}</td>
                <td>${s.total}</td>
                <td>${money(rate)}</td>
                <td><b>${money(s.taught*rate)}</b></td>
                <td>
                  <button class="btn small" onclick="editTeamMember('${t.id}')">Edit</button>
                  ${t.role==='Instructor'?` <button class="btn small" onclick="instructorSlotsModal('${t.id}')">Class hours</button>`:''}
                  ${t.auth_user_id?`
                    <button class="btn small" onclick="payrollModal('${t.id}')">Payroll</button>
                    <button class="btn small" onclick="setFrontDeskDuty('${t.auth_user_id}',true)">Front Desk today</button>
                    <button class="btn small" onclick="setFrontDeskDuty('${t.auth_user_id}',false)">End duty</button>
                  `:` <button class="btn small danger" onclick="archiveRecord('team','${t.id}')">Archive</button>`}
                </td>
              </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>`,
    `Team`,
    `Exact class-hour coverage, monthly teaching and payroll tracking`
  );
}

(function ctExactSlotStyles(){
  if(document.getElementById('ctExactSlotStyles'))return;
  const s=document.createElement('style');
  s.id='ctExactSlotStyles';
  s.textContent=`
    .ct-slot-summary{display:grid;grid-template-columns:80px 1fr;gap:8px;font-size:12px;margin:3px 0}
    .ct-slot-row{display:grid;grid-template-columns:1.2fr 1fr 1.1fr auto;gap:8px;align-items:end;padding:10px 0;border-bottom:1px solid rgba(0,0,0,.08)}
    @media(max-width:700px){
      .ct-slot-row{grid-template-columns:1fr 1fr}
      .ct-slot-row>div:nth-child(3){grid-column:1/-1}
      .ct-slot-row>.btn{width:100%}
    }
  `;
  document.head.appendChild(s);
})();


// ================= CORE THEORY — SMART SUBSTITUTE PICKER =================
function ctClassDow(dateStr){
  return new Date(`${dateStr}T12:00:00`).getDay();
}

function ctInstructorMatchesSavedSlot(t,c){
  if(!t?.id||!c)return false;
  const day=ctClassDow(c.class_date);
  const time=String(c.class_time||'').slice(0,5);
  const studio=c.studio_type||'Pilates';

  return (db.instructor_class_slots||[]).some(s=>
    String(s.team_id)===String(t.id) &&
    Number(s.weekday)===day &&
    String(s.class_time||'').slice(0,5)===time &&
    ((s.studio_scope||'All')==='All' || s.studio_scope===studio)
  );
}

function ctInstructorTimeConflict(t,c){
  if(!t?.auth_user_id||!c)return null;

  return (db.classes||[]).find(other=>
    String(other.id)!==String(c.id) &&
    !other.cancelled &&
    other.class_date===c.class_date &&
    String(other.class_time||'').slice(0,5)===String(c.class_time||'').slice(0,5) &&
    String(instructorForClass(other)||'')===String(t.auth_user_id)
  )||null;
}

function ctSubstituteCandidateHtml(t,c,currentSub){
  const slotMatch=ctInstructorMatchesSavedSlot(t,c);
  const conflict=ctInstructorTimeConflict(t,c);
  const selected=String(currentSub||'')===String(t.auth_user_id||'');

  let badge='';
  if(conflict){
    badge=`<span class="ct-sub-badge conflict">Already teaching ${esc(conflict.class_type||'another class')}</span>`;
  }else if(slotMatch){
    badge='<span class="ct-sub-badge good">Available · saved class hour</span>';
  }else{
    badge='<span class="ct-sub-badge neutral">Manual option</span>';
  }

  return `
    <label class="ct-sub-option ${conflict?'is-conflict':''}">
      <input
        type="radio"
        name="ctSubInstructor"
        value="${esc(t.auth_user_id||'')}"
        ${selected?'checked':''}
        ${conflict&&!selected?'disabled':''}
      >
      <span class="ct-sub-copy">
        <b>${esc(t.name)}</b>
        ${badge}
      </span>
    </label>`;
}

function substituteClassModal(classId){
  const c=db.classes.find(x=>String(x.id)===String(classId));
  if(!c)return;

  const current=(db.class_substitutions||[]).find(s=>
    String(s.class_id)===String(classId) && s.active
  );
  const currentSub=current?.substitute_instructor||null;

  const original=db.team.find(t=>String(t.auth_user_id||'')===String(c.instructor_user_id||''));
  const instructors=(db.team||[])
    .filter(t=>t.role==='Instructor'&&t.auth_user_id&&!t.archived_at)
    .filter(t=>String(t.auth_user_id)!==String(c.instructor_user_id||''));

  const ranked=instructors.map(t=>({
    t,
    slot:ctInstructorMatchesSavedSlot(t,c),
    conflict:ctInstructorTimeConflict(t,c)
  })).sort((a,b)=>{
    if(Boolean(a.conflict)!==Boolean(b.conflict))return a.conflict?1:-1;
    if(a.slot!==b.slot)return a.slot?-1:1;
    return String(a.t.name||'').localeCompare(String(b.t.name||''));
  });

  const recommended=ranked.filter(x=>x.slot&&!x.conflict);
  const other=ranked.filter(x=>!x.slot&&!x.conflict);
  const busy=ranked.filter(x=>x.conflict);

  modal('Assign substitute',`
    <div class="ct-sub-class">
      <b>${esc(c.class_type||'Class')}</b>
      <span>${new Date(c.class_date+'T12:00:00').toLocaleDateString(undefined,{weekday:'long',month:'short',day:'numeric'})}
      · ${formatTime(String(c.class_time||'00:00').slice(0,5))}
      · ${esc(c.studio_type||'Pilates')}</span>
    </div>

    <div class="ct-sub-original">
      <span>Original instructor</span>
      <b>${esc(original?.name||c.instructor||'Unassigned')}</b>
    </div>

    <label class="ct-sub-option remove-option">
      <input type="radio" name="ctSubInstructor" value="" ${!currentSub?'checked':''}>
      <span class="ct-sub-copy">
        <b>No substitute</b>
        <span class="ct-sub-badge neutral">Keep original instructor</span>
      </span>
    </label>

    ${recommended.length?`
      <h3 class="ct-sub-heading">Available for this class</h3>
      <p class="muted">These instructors have this exact day, time and studio saved in Class hours.</p>
      <div class="ct-sub-list">
        ${recommended.map(x=>ctSubstituteCandidateHtml(x.t,c,currentSub)).join('')}
      </div>`:''}

    ${other.length?`
      <h3 class="ct-sub-heading">Other instructors</h3>
      <p class="muted">You can still choose them manually even though this exact class hour is not in their saved schedule.</p>
      <div class="ct-sub-list">
        ${other.map(x=>ctSubstituteCandidateHtml(x.t,c,currentSub)).join('')}
      </div>`:''}

    ${busy.length?`
      <h3 class="ct-sub-heading">Unavailable at this time</h3>
      <div class="ct-sub-list">
        ${busy.map(x=>ctSubstituteCandidateHtml(x.t,c,currentSub)).join('')}
      </div>`:''}

    ${!instructors.length?'<div class="empty">No other active instructors are available in Team yet.</div>':''}

    <div style="margin-top:18px">
      <button class="btn primary full" onclick="saveSubstitute('${classId}')">Save substitute</button>
    </div>
  `);
}

async function saveSubstitute(classId){
  const picked=document.querySelector('input[name="ctSubInstructor"]:checked');
  const uid=picked?.value||null;

  if(uid){
    const c=db.classes.find(x=>String(x.id)===String(classId));
    const t=db.team.find(x=>String(x.auth_user_id||'')===String(uid));
    const conflict=ctInstructorTimeConflict(t,c);
    if(conflict){
      return alert(`${t?.name||'This instructor'} is already teaching ${conflict.class_type||'another class'} at that time.`);
    }
  }

  const btn=document.querySelector('#modal .btn.primary');
  if(btn){btn.disabled=true;btn.textContent='Saving…'}

  const {error}=await sb.rpc('set_class_substitute',{
    p_class_id:classId,
    p_substitute_user_id:uid
  });

  if(error){
    if(btn){btn.disabled=false;btn.textContent='Save substitute'}
    return alert(error.message);
  }

  $("#modal")?.remove();
  await loadAll();
  alert(uid?'Substitute assigned. This class will count under the substitute for teaching statistics.':'Substitute removed. The original instructor is back on the class.');
}

(function ctSmartSubstituteStyles(){
  if(document.getElementById('ctSmartSubstituteStyles'))return;
  const s=document.createElement('style');
  s.id='ctSmartSubstituteStyles';
  s.textContent=`
    .ct-sub-class{
      display:flex;
      flex-direction:column;
      gap:4px;
      padding:12px 14px;
      border-radius:12px;
      background:rgba(114,47,55,.07);
      margin-bottom:12px;
    }
    .ct-sub-original{
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:12px;
      padding:10px 2px 14px;
      border-bottom:1px solid rgba(0,0,0,.08);
      margin-bottom:10px;
    }
    .ct-sub-original span{color:#6B6B6B;font-size:13px}
    .ct-sub-heading{margin:18px 0 4px}
    .ct-sub-list{display:grid;gap:8px;margin-top:8px}
    .ct-sub-option{
      display:flex;
      align-items:center;
      gap:11px;
      padding:12px 13px;
      border:1px solid rgba(0,0,0,.10);
      border-radius:12px;
      cursor:pointer;
      background:#fff;
    }
    .ct-sub-option:has(input:checked){
      border-color:#722F37;
      box-shadow:0 0 0 1px #722F37 inset;
      background:rgba(114,47,55,.04);
    }
    .ct-sub-option.is-conflict{
      opacity:.58;
      cursor:not-allowed;
    }
    .ct-sub-option input{
      width:auto;
      margin:0;
      flex:0 0 auto;
    }
    .ct-sub-copy{
      display:flex;
      flex-wrap:wrap;
      align-items:center;
      justify-content:space-between;
      gap:8px;
      width:100%;
    }
    .ct-sub-badge{
      font-size:11px;
      padding:4px 7px;
      border-radius:999px;
      font-weight:600;
    }
    .ct-sub-badge.good{background:rgba(114,47,55,.09);color:#722F37}
    .ct-sub-badge.neutral{background:#eeeae3;color:#666}
    .ct-sub-badge.conflict{background:#f3dddd;color:#8b2f38}
    .remove-option{margin-bottom:6px}
    @media(max-width:600px){
      .ct-sub-copy{align-items:flex-start;flex-direction:column}
      .ct-sub-original{align-items:flex-start;flex-direction:column}
    }
  `;
  document.head.appendChild(s);
})();

