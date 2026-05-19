'use strict';

// ===== Constants =====
const WEEKDAYS        = ['周日','周一','周二','周三','周四','周五','周六'];
const ADMIN_PASSWORD  = 'admin123';
const LEVEL_CLASS_MAP = { '初级':'beginner','中级':'intermediate','高级':'advanced','全级':'all','儿童班':'kids' };
const COURSE_COLORS   = ['#e94560','#4a90e2','#9b59b6','#27ae60','#f39c12','#e67e22','#c0392b','#16a085','#2980b9','#8e44ad'];

// ===== Date Helpers =====
function getWeekday(dateStr) {
  const [y,m,d] = dateStr.split('-').map(Number);
  return WEEKDAYS[new Date(y, m-1, d).getDay()];
}
function fmtCourseDate(dateStr) {
  const [y,m,d] = dateStr.split('-').map(Number);
  return `${y}年${m}月${d}日 ${getWeekday(dateStr)}`;
}
function todayIso() { return new Date().toISOString().split('T')[0]; }
function relDate(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

// ===== Default Courses (relative to today so they are always upcoming) =====
function buildDefaultCourses() {
  const tmpl = [
    { name:'Jazz Funk',     emoji:'💃', teacher:'Alex 老师', da:2,  time:'19:00–20:30', dur:90, level:'初级',  lc:'beginner',     cap:20, room:'舞室 A', color:'#e94560', desc:'Jazz Funk 融合爵士舞与街舞元素，节奏感强，动作帅气。专为初学者设计，从基础律动开始逐步掌握核心技巧。', req:'无舞蹈基础要求，穿着舒适运动服和运动鞋即可' },
    { name:'Hip Hop',       emoji:'🤸', teacher:'Ray 老师',  da:3,  time:'18:30–20:00', dur:90, level:'中级',  lc:'intermediate', cap:15, room:'舞室 B', color:'#4a90e2', desc:'正宗 Hip Hop 文化与舞蹈，涵盖 Popping、Locking 等多种街舞风格，适合有一定基础的学员。', req:'需有 6 个月以上舞蹈学习经历' },
    { name:'芭蕾基础',       emoji:'🩰', teacher:'小华 老师', da:4,  time:'10:00–11:30', dur:90, level:'初级',  lc:'beginner',     cap:20, room:'舞室 A', color:'#9b59b6', desc:'经典芭蕾舞基础训练，培养优雅姿态、柔韧性和身体协调能力，适合零基础成人。', req:'无基础要求，需穿芭蕾软鞋（可在场馆购买）' },
    { name:'当代舞',         emoji:'🎭', teacher:'Ming 老师', da:5,  time:'19:00–20:30', dur:90, level:'中级',  lc:'intermediate', cap:15, room:'舞室 C', color:'#27ae60', desc:'当代舞融合芭蕾、现代舞和即兴舞蹈精华，注重情感表达与身体创意。', req:'需有芭蕾或现代舞基础' },
    { name:'Popping 机械舞', emoji:'🤖', teacher:'Ray 老师',  da:6,  time:'14:00–15:30', dur:90, level:'全级',  lc:'all',          cap:20, room:'舞室 B', color:'#f39c12', desc:'Popping 利用肌肉快速收缩制造"爆破"感，从基础 hit 开始涵盖 waving、tutting 等进阶技巧。', req:'无基础要求，老少皆宜' },
    { name:'儿童舞蹈',       emoji:'⭐', teacher:'小华 老师', da:7,  time:'10:00–11:00', dur:60, level:'儿童班', lc:'kids',         cap:15, room:'舞室 A', color:'#e67e22', desc:'专为 4–12 岁儿童设计的趣味舞蹈课程，培养节奏感、协调能力和表演信心。', req:'适合 4–12 岁儿童，家长可陪同观课' },
    { name:'爵士舞进阶',     emoji:'🌟', teacher:'Alex 老师', da:8,  time:'16:00–17:30', dur:90, level:'高级',  lc:'advanced',     cap:12, room:'舞室 B', color:'#c0392b', desc:'为有一定基础的学员打造，系统学习复杂编排和技巧提升，包含专业表演技巧和舞台表现力训练。', req:'需有 1 年以上爵士舞学习经历' },
    { name:'Jazz Funk',     emoji:'💃', teacher:'Alex 老师', da:10, time:'19:00–20:30', dur:90, level:'初级',  lc:'beginner',     cap:20, room:'舞室 A', color:'#e94560', desc:'Jazz Funk 融合爵士舞与街舞元素，节奏感强，动作帅气。专为初学者设计，从基础律动开始逐步掌握核心技巧。', req:'无舞蹈基础要求，穿着舒适运动服和运动鞋即可' },
    { name:'Hip Hop',       emoji:'🤸', teacher:'Ray 老师',  da:11, time:'18:30–20:00', dur:90, level:'中级',  lc:'intermediate', cap:15, room:'舞室 B', color:'#4a90e2', desc:'正宗 Hip Hop 文化与舞蹈，涵盖 Popping、Locking 等多种街舞风格，适合有一定基础的学员。', req:'需有 6 个月以上舞蹈学习经历' },
    { name:'芭蕾基础',       emoji:'🩰', teacher:'小华 老师', da:12, time:'10:00–11:30', dur:90, level:'初级',  lc:'beginner',     cap:20, room:'舞室 A', color:'#9b59b6', desc:'经典芭蕾舞基础训练，培养优雅姿态、柔韧性和身体协调能力，适合零基础成人。', req:'无基础要求，需穿芭蕾软鞋（可在场馆购买）' },
    { name:'当代舞',         emoji:'🎭', teacher:'Ming 老师', da:13, time:'19:00–20:30', dur:90, level:'中级',  lc:'intermediate', cap:15, room:'舞室 C', color:'#27ae60', desc:'当代舞融合芭蕾、现代舞和即兴舞蹈精华，注重情感表达与身体创意。', req:'需有芭蕾或现代舞基础' },
    { name:'Popping 机械舞', emoji:'🤖', teacher:'Ray 老师',  da:14, time:'14:00–15:30', dur:90, level:'全级',  lc:'all',          cap:20, room:'舞室 B', color:'#f39c12', desc:'Popping 利用肌肉快速收缩制造"爆破"感，从基础 hit 开始涵盖 waving、tutting 等进阶技巧。', req:'无基础要求，老少皆宜' },
  ];
  return tmpl.map((t, i) => ({
    id: i + 1,
    name: t.name, emoji: t.emoji, teacher: t.teacher,
    date: relDate(t.da), time: t.time, duration: t.dur,
    level: t.level, levelClass: t.lc, capacity: t.cap,
    room: t.room, color: t.color,
    description: t.desc, requirements: t.req,
    teacherIntro: '', videoUrl: '', localVideoData: '', localVideoName: ''
  }));
}

// ===== App State =====
let currentPage         = 'home';
let currentDateFilter   = 'all';
let adminLoggedIn       = false;
let adminTab            = 'bookings';
let adminBookingFilter  = '';
let mineTab             = 'bookings';
let _editingCourseId    = null;
let _videoState         = { data:'', name:'', reading:false, cleared:false };
let _pendingBookingId   = null; // course to book after login

// ===== Storage =====
function getCourses() {
  const raw = localStorage.getItem('scs_courses');
  if (raw) {
    const p = JSON.parse(raw);
    if (p.length > 0 && !p[0].date) { const d = buildDefaultCourses(); saveCourses(d); return d; }
    return p;
  }
  return buildDefaultCourses();
}
function saveCourses(list) { localStorage.setItem('scs_courses', JSON.stringify(list)); }

function getBookings() { return JSON.parse(localStorage.getItem('scs_bookings') || '[]'); }
function saveBookings(b) { localStorage.setItem('scs_bookings', JSON.stringify(b)); }

function getCards() { return JSON.parse(localStorage.getItem('scs_cards') || '[]'); }
function saveCards(c) { localStorage.setItem('scs_cards', JSON.stringify(c)); }

function getUsers() { return JSON.parse(localStorage.getItem('scs_users') || '[]'); }
function saveUsers(u) { localStorage.setItem('scs_users', JSON.stringify(u)); }

function getSession() {
  const raw = localStorage.getItem('scs_session');
  return raw ? JSON.parse(raw) : null;
}
function saveSession(s) { localStorage.setItem('scs_session', JSON.stringify(s)); }
function clearSession()  { localStorage.removeItem('scs_session'); }

// ===== Helpers =====
function getBookedCount(courseId) {
  return getBookings().filter(b => String(b.courseId) === String(courseId) && b.status === 'confirmed').length;
}
function getCourse(id) { return getCourses().find(c => String(c.id) === String(id)) || null; }
function findUserByPhone(phone) { return getUsers().find(u => u.phone === phone) || null; }

function fmtTs(ts) {
  const d = new Date(ts);
  return `${d.getMonth()+1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2,'0')}`;
}
function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2,6); }

function getCardStatus(card) {
  const today = todayIso();
  if (card.type === 'period') {
    if (today < card.startDate) return { text:'未生效', cls:'status-pending' };
    if (today > card.endDate)   return { text:'已过期', cls:'status-cancelled' };
    return { text:'有效', cls:'status-confirmed' };
  }
  if (card.remainingCredits <= 0) return { text:'已用完', cls:'status-cancelled' };
  return { text:`余 ${card.remainingCredits} 次`, cls:'status-confirmed' };
}

function getValidCardForPhone(phone) {
  const today = todayIso(), cards = getCards();
  for (const c of cards)
    if (c.phone === phone && c.type === 'period' && c.startDate <= today && today <= c.endDate) return c;
  for (const c of cards)
    if (c.phone === phone && c.type === 'credit' && c.remainingCredits > 0) return c;
  return null;
}

function matchesDateFilter(dateStr, filter) {
  if (filter === 'all') return true;
  const today = new Date(); today.setHours(0,0,0,0);
  const [y,m,d] = dateStr.split('-').map(Number);
  const cd = new Date(y, m-1, d);
  if (filter === 'today') return cd.getFullYear()===today.getFullYear() && cd.getMonth()===today.getMonth() && cd.getDate()===today.getDate();
  if (filter === 'week') {
    const dow = today.getDay();
    const ws  = new Date(today); ws.setDate(today.getDate()-(dow===0?6:dow-1));
    const we  = new Date(ws);   we.setDate(ws.getDate()+6);
    return cd >= ws && cd <= we;
  }
  if (filter === 'month') return cd.getFullYear()===today.getFullYear() && cd.getMonth()===today.getMonth();
  return true;
}

function _esc(str) {
  return String(str||'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ===== Data Migration =====
function migrateData() {
  // Migrate bookings: add userId from phone
  const bookings = getBookings();
  let users = getUsers();
  let changed = false;
  const newBookings = bookings.map(b => {
    if (b.userId) return b;
    if (!b.phone) return b;
    let u = users.find(x => x.phone === b.phone);
    if (!u) {
      u = { id: genId(), phone: b.phone, name: b.userName || `用户${b.phone.slice(-4)}`, createdAt: b.createdAt || Date.now() };
      users.push(u);
      changed = true;
    }
    return { ...b, userId: u.id };
  });
  if (changed) saveUsers(users);
  const anyChanged = newBookings.some((b,i) => b !== bookings[i]);
  if (anyChanged) saveBookings(newBookings);
}

// ===== Auth =====
function loginWithPhone(phone, name) {
  const users = getUsers();
  let user = users.find(u => u.phone === phone);
  if (!user) {
    user = { id: genId(), phone, name: name || `用户${phone.slice(-4)}`, createdAt: Date.now() };
    users.push(user);
    saveUsers(users);
  } else if (name && (!user.name || user.name === `用户${phone.slice(-4)}`)) {
    user = { ...user, name };
    const idx = users.findIndex(u => u.phone === phone);
    users[idx] = user;
    saveUsers(users);
  }
  saveSession({ userId: user.id, phone: user.phone, name: user.name });
  return user;
}

function logoutUser() {
  clearSession();
  renderHeaderUser();
  if (currentPage === 'mybookings') renderMine();
  showToast('已退出登录');
}

// ===== Header User =====
function renderHeaderUser() {
  const el   = document.getElementById('header-user');
  if (!el) return;
  const user = getSession();
  if (user) {
    el.innerHTML = `
      <span class="header-user-name">${_esc(user.name || user.phone)}</span>
      <button class="header-logout-btn" onclick="logoutUser()">退出</button>`;
  } else {
    el.innerHTML = `<button class="header-login-btn" onclick="openLoginModal(null)">登录</button>`;
  }
}

// ===== Login Modal =====
function openLoginModal(pendingCourseId) {
  _pendingBookingId = pendingCourseId || null;
  document.getElementById('modal-login-body').innerHTML = `
    <div class="modal-body">
      <div class="modal-icon">👤</div>
      <h3 class="modal-title">登录 / 注册</h3>
      <p class="login-hint">输入手机号即可登录，首次登录自动创建账户</p>
      <div class="form-group">
        <label class="form-label">手机号 *</label>
        <input id="login-phone" class="form-input" type="tel" placeholder="请输入手机号" maxlength="11"
          onkeydown="if(event.key==='Enter') submitLogin()">
      </div>
      <div class="form-group">
        <label class="form-label">姓名（首次登录请填写）</label>
        <input id="login-name" class="form-input" type="text" placeholder="你的姓名"
          onkeydown="if(event.key==='Enter') submitLogin()">
      </div>
      <div id="login-error" class="error-msg" style="display:none"></div>
      <button class="btn-primary" onclick="submitLogin()">登录 / 注册</button>
      <button class="btn-outline" style="margin-top:10px;width:100%;display:block" onclick="closeModal('login')">取消</button>
    </div>`;
  openModal('login');
}

function submitLogin() {
  const phone = document.getElementById('login-phone').value.trim();
  const name  = document.getElementById('login-name').value.trim();
  const errEl = document.getElementById('login-error');
  if (!phone || !/^1\d{10}$/.test(phone)) { showErr(errEl,'请输入正确的手机号（11位）'); return; }
  const user = loginWithPhone(phone, name);
  closeModal('login');
  renderHeaderUser();
  if (currentPage === 'mybookings') renderMine();
  showToast(`欢迎，${user.name || user.phone}！`);
  if (_pendingBookingId) {
    const id = _pendingBookingId;
    _pendingBookingId = null;
    setTimeout(() => openBookingForm(id), 320);
  }
}

// ===== Toast =====
function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2600);
}

// ===== Navigation =====
function navigate(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById(`page-${page}`).classList.add('active');
  const nb = document.querySelector(`.nav-item[data-page="${page}"]`);
  if (nb) nb.classList.add('active');
  currentPage = page;
  window.scrollTo(0, 0);
  if (page === 'schedule')   renderSchedule();
  if (page === 'mybookings') renderMine();
  if (page === 'admin')      renderAdmin();
}

// ===== Video Player =====
function renderVideoPlayer(localVideoData, videoUrl) {
  if (localVideoData) {
    return `<div class="video-container">
      <video controls playsinline
        onerror="this.insertAdjacentHTML('afterend','<div style=\\'padding:20px;text-align:center;color:#aaa;font-size:0.8rem\\'>该格式暂不支持播放，建议使用 MP4 格式</div>');this.remove()">
        <source src="${localVideoData}">
      </video></div>`;
  }
  if (!videoUrl) return `<div class="video-placeholder"><div class="vp-icon">🎬</div><div class="vp-text">暂无预览视频</div></div>`;
  const ytM = videoUrl.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&\s?\/]+)/);
  if (ytM) return `<div class="video-container"><iframe src="https://www.youtube.com/embed/${ytM[1]}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`;
  const biM = videoUrl.match(/bilibili\.com\/video\/(BV[a-zA-Z0-9]+)/);
  if (biM) return `<div class="video-container"><iframe src="https://player.bilibili.com/player.html?bvid=${biM[1]}&page=1&high_quality=1&danmaku=0" frameborder="0" allowfullscreen></iframe></div>`;
  if (/\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(videoUrl)) return `<div class="video-container"><video src="${videoUrl}" controls playsinline></video></div>`;
  const safe = encodeURIComponent(videoUrl);
  return `<div class="video-placeholder" style="cursor:pointer" onclick="window.open(decodeURIComponent('${safe}'),'_blank')"><div class="vp-icon">▶️</div><div class="vp-text">点击查看视频</div></div>`;
}

// ===== Schedule =====
function renderSchedule() {
  const list = document.getElementById('courses-list');
  const filtered = getCourses()
    .filter(c => matchesDateFilter(c.date, currentDateFilter))
    .sort((a,b) => a.date !== b.date ? a.date.localeCompare(b.date) : a.time.localeCompare(b.time));

  if (!filtered.length) {
    const labels = { all:'暂无课程', today:'今天没有课程', week:'本周没有课程', month:'本月没有课程' };
    list.innerHTML = `<div class="empty-state"><div class="empty-icon">📭</div><div class="empty-text">${labels[currentDateFilter]||'暂无课程'}</div></div>`;
    return;
  }
  list.innerHTML = filtered.map(c => {
    const booked = getBookedCount(c.id), left = c.capacity - booked, full = left <= 0;
    return `
      <div class="course-card" onclick="openCourseDetail('${c.id}')">
        <div class="course-bar" style="background:${c.color}"></div>
        <div class="course-body">
          <div class="course-date-badge">${fmtCourseDate(c.date)}</div>
          <div class="course-row1">
            <div class="course-emoji">${c.emoji}</div>
            <div class="course-info">
              <div class="course-name">${c.name}</div>
              <div class="course-teacher">${c.teacher}</div>
            </div>
            <span class="level-badge level-${c.levelClass}">${c.level}</span>
          </div>
          <div class="course-meta">
            <span class="meta-tag">🕐 ${c.time}</span>
            <span class="meta-tag">📍 ${c.room}</span>
            <span class="meta-tag">${c.duration||90} 分钟</span>
          </div>
          <div class="course-footer">
            <span class="spots${full?' full':''}">${full?'名额已满':`余 ${left} / ${c.capacity} 位`}</span>
            <button class="btn-book" ${full?'disabled':''} onclick="event.stopPropagation(); openBookingForm('${c.id}')">
              ${full?'已满':'立即预约'}
            </button>
          </div>
        </div>
      </div>`;
  }).join('');
}

function initDateFilter() {
  document.getElementById('day-filter').addEventListener('click', e => {
    const btn = e.target.closest('.day-btn');
    if (!btn) return;
    document.querySelectorAll('.day-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentDateFilter = btn.dataset.day;
    renderSchedule();
  });
}

// ===== Course Detail =====
function openCourseDetail(courseId) {
  const c = getCourse(courseId);
  if (!c) return;
  const booked = getBookedCount(c.id), left = c.capacity - booked, full = left <= 0;
  document.getElementById('modal-detail-body').innerHTML = `
    <div class="detail-header">
      <div class="detail-emoji">${c.emoji}</div>
      <div class="detail-title">${c.name}</div>
      <div class="detail-teacher">${c.teacher}</div>
      <div class="detail-badges">
        <span class="level-badge level-${c.levelClass}">${c.level}</span>
        <span class="meta-tag">${c.duration||90} 分钟</span>
      </div>
    </div>
    <div class="detail-meta">
      <div class="detail-meta-row"><span class="detail-meta-label">上课日期</span><span class="detail-meta-val">${fmtCourseDate(c.date)}</span></div>
      <div class="detail-meta-row"><span class="detail-meta-label">上课时间</span><span class="detail-meta-val">${c.time}</span></div>
      <div class="detail-meta-row"><span class="detail-meta-label">上课地点</span><span class="detail-meta-val">${c.room}</span></div>
      <div class="detail-meta-row"><span class="detail-meta-label">名额</span><span class="detail-meta-val">${full?'<span style="color:#e94560">名额已满</span>':`余 ${left} 位（共 ${c.capacity} 位）`}</span></div>
    </div>
    ${renderVideoPlayer(c.localVideoData, c.videoUrl)}
    <div class="detail-desc">
      <h4>课程介绍</h4><p>${c.description||'暂无介绍'}</p>
      ${c.teacherIntro?`<br><h4>教练介绍</h4><p>${c.teacherIntro}</p>`:''}
      ${c.requirements ?`<br><h4>报名要求</h4><p>${c.requirements}</p>` :''}
    </div>
    <div class="detail-footer">
      <button class="btn-primary" ${full?'disabled style="background:#ccc"':''} onclick="closeModal('detail'); openBookingForm('${c.id}')">
        ${full?'名额已满':'立即预约'}
      </button>
    </div>`;
  openModal('detail');
}

// ===== Booking =====
function openBookingForm(courseId) {
  const user = getSession();
  if (!user) { openLoginModal(courseId); return; }

  const c = getCourse(courseId);
  if (!c) return;

  const booked  = getBookedCount(c.id);
  const full    = booked >= c.capacity;
  const dup     = getBookings().some(b =>
    String(b.courseId) === String(courseId) &&
    (b.userId === user.userId || b.phone === user.phone) &&
    b.status === 'confirmed'
  );
  const validCard = getValidCardForPhone(user.phone);

  let statusHtml = '', canBook = false;
  if (full) {
    statusHtml = `<div class="bk-warn">该课程名额已满</div>`;
  } else if (dup) {
    statusHtml = `<div class="bk-warn">你已预约了该场次，不可重复预约</div>`;
  } else if (!validCard) {
    statusHtml = `<div class="bk-warn">暂无可用课卡，请联系管理员开通。</div>`;
  } else {
    canBook = true;
    const cardDesc = validCard.type === 'credit'
      ? `次数卡（剩余 ${validCard.remainingCredits} 次）`
      : `期限卡（有效至 ${validCard.endDate}）`;
    statusHtml = `<div class="bk-card-ok">🎟️ ${cardDesc}</div>`;
  }

  document.getElementById('modal-booking-body').innerHTML = `
    <div class="modal-body">
      <div class="modal-icon">${c.emoji}</div>
      <h3 class="modal-title">${c.name}</h3>
      <div class="booking-session-info">
        <div class="bsi-date">${fmtCourseDate(c.date)}</div>
        <div class="bsi-detail">${c.time} · ${c.room}</div>
      </div>
      <div class="booking-user-info">👤 ${_esc(user.name || user.phone)} · ${user.phone}</div>
      ${statusHtml}
      <div id="bk-error" class="error-msg" style="display:none"></div>
      ${canBook ? `<button class="btn-primary" onclick="submitBooking('${c.id}')">确认预约</button>` : ''}
      <button class="btn-outline" style="margin-top:10px;width:100%;display:block" onclick="closeModal('booking')">关闭</button>
    </div>`;
  openModal('booking');
}

function submitBooking(courseId) {
  const user  = getSession();
  const errEl = document.getElementById('bk-error');
  if (!user) { showErr(errEl,'请先登录'); return; }

  const c = getCourse(courseId);
  if (!c || getBookedCount(courseId) >= c.capacity) { showErr(errEl,'名额已满'); return; }

  const dup = getBookings().some(b =>
    String(b.courseId) === String(courseId) &&
    (b.userId === user.userId || b.phone === user.phone) &&
    b.status === 'confirmed'
  );
  if (dup) { showErr(errEl,'你已预约了该场次'); return; }

  const validCard = getValidCardForPhone(user.phone);
  if (!validCard) { showErr(errEl,'暂无可用课卡，请联系管理员开通。'); return; }

  let cardNote = '';
  if (validCard.type === 'credit') {
    const newRem = validCard.remainingCredits - 1;
    saveCards(getCards().map(card => card.id === validCard.id ? {...card, remainingCredits:newRem} : card));
    cardNote = `已消耗 1 次课卡，剩余 ${newRem} 次`;
  } else {
    cardNote = '期限卡有效，本次课程已记录';
  }

  const bookings = getBookings();
  bookings.push({
    id: genId(), courseId: String(c.id),
    userId: user.userId, phone: user.phone,
    courseName: c.name, courseEmoji: c.emoji, teacher: c.teacher,
    date: c.date, day: getWeekday(c.date), time: c.time, room: c.room,
    userName: user.name || `用户${user.phone.slice(-4)}`,
    status: 'confirmed', cardId: validCard.id, cardType: validCard.type, createdAt: Date.now()
  });
  saveBookings(bookings);

  document.getElementById('modal-booking-body').innerHTML = `
    <div class="success-state">
      <div class="success-icon">🎉</div>
      <div class="success-title">预约成功！</div>
      <div class="success-sub">${c.name}<br>${fmtCourseDate(c.date)} ${c.time}<br>${c.room}</div>
      <div class="success-card-note">${cardNote}</div>
      <button class="btn-primary" onclick="closeModal('booking'); navigate('mybookings')">查看我的预约</button>
    </div>`;
  showToast('预约成功 🎉');
}

function showErr(el, msg) { el.textContent = msg; el.style.display = 'block'; }

// ===== Mine Page =====
function switchMineTab(tab) { mineTab = tab; renderMine(); }

function renderMine() {
  const user = getSession();
  const el   = document.getElementById('mine-content');
  if (!user) {
    el.innerHTML = `
      <div class="page-top"><h2 class="page-title">我的</h2></div>
      <div class="empty-state" style="padding:60px 20px">
        <div class="empty-icon">👤</div>
        <div class="empty-text">请先登录</div>
        <div class="empty-hint">登录后可查看预约记录、课卡和账户信息</div>
        <br>
        <button class="btn-primary" style="display:inline-block;width:auto;padding:12px 32px" onclick="openLoginModal(null)">立即登录 / 注册</button>
      </div>`;
    return;
  }
  let content = '';
  if (mineTab === 'bookings') content = renderMineBookings(user);
  if (mineTab === 'cards')    content = renderMineCards(user);
  if (mineTab === 'account')  content = renderMineAccount(user);

  el.innerHTML = `
    <div class="page-top" style="padding-bottom:0"><h2 class="page-title">我的</h2></div>
    <div class="mine-tabs">
      <button class="mine-tab ${mineTab==='bookings'?'active':''}" onclick="switchMineTab('bookings')">预约</button>
      <button class="mine-tab ${mineTab==='cards'   ?'active':''}" onclick="switchMineTab('cards')">课卡</button>
      <button class="mine-tab ${mineTab==='account' ?'active':''}" onclick="switchMineTab('account')">账户</button>
    </div>
    ${content}`;
}

function renderMineBookings(user) {
  const myBookings = getBookings()
    .filter(b => b.userId === user.userId || b.phone === user.phone)
    .slice().reverse();

  if (!myBookings.length) {
    return `<div class="mine-body"><div class="empty-state" style="padding:40px 0">
      <div class="empty-icon">🗓️</div>
      <div class="empty-text">暂无预约记录</div>
      <div class="empty-hint">去课程表选一节课开始吧！</div>
      <br><button class="btn-outline" onclick="navigate('schedule')">浏览课程</button>
    </div></div>`;
  }
  return `<div class="mine-body">${myBookings.map(b => {
    const dateDisplay = b.date ? fmtCourseDate(b.date) : (b.day || '');
    return `
      <div class="booking-card">
        <div class="booking-header">
          <div>
            <div class="booking-name">${b.courseEmoji} ${b.courseName}</div>
            <div class="booking-day">${dateDisplay} · ${b.time}</div>
          </div>
          <span class="status-badge status-${b.status}">${b.status==='confirmed'?'已确认':'已取消'}</span>
        </div>
        <div class="booking-meta">📍 ${b.room}<br>👨‍🏫 ${b.teacher}<br>🕐 预约于 ${fmtTs(b.createdAt)}</div>
        ${b.status==='confirmed' ? `<button class="btn-cancel" onclick="cancelMyBooking('${b.id}')">取消预约</button>` : ''}
      </div>`;
  }).join('')}</div>`;
}

function renderMineCards(user) {
  const myCards = getCards().filter(c => c.phone === user.phone);
  if (!myCards.length) {
    return `<div class="mine-body"><div class="empty-state" style="padding:40px 0">
      <div class="empty-icon">🎟️</div>
      <div class="empty-text">暂无课卡</div>
      <div class="empty-hint">请联系管理员开通课卡后方可预约</div>
    </div></div>`;
  }
  return `<div class="mine-body">${myCards.map(card => {
    const st = getCardStatus(card);
    const typeLabel = card.type === 'period' ? '期限卡' : '次数卡';
    const detail    = card.type === 'period'
      ? `${card.startDate} 至 ${card.endDate}`
      : `剩余 ${card.remainingCredits} / ${card.totalCredits} 次`;
    return `
      <div class="mine-card-item">
        <div class="mine-card-icon">🎟️</div>
        <div class="mine-card-info">
          <div class="mine-card-type">${typeLabel}</div>
          <div class="mine-card-detail">${detail}</div>
        </div>
        <span class="status-badge ${st.cls}">${st.text}</span>
      </div>`;
  }).join('')}</div>`;
}

function renderMineAccount(user) {
  return `
    <div class="mine-body">
      <div class="account-card">
        <div class="account-avatar">👤</div>
        <div class="account-info">
          <div class="account-name">${_esc(user.name || '未设置姓名')}</div>
          <div class="account-phone">${user.phone}</div>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">修改姓名</label>
        <input id="mine-name-input" class="form-input" type="text" placeholder="你的姓名" value="${_esc(user.name||'')}">
      </div>
      <button class="btn-primary" onclick="saveMineProfile()">保存姓名</button>
      <button class="btn-outline" style="margin-top:10px;width:100%;display:block" onclick="logoutUser()">退出登录</button>
    </div>`;
}

function saveMineProfile() {
  const name    = document.getElementById('mine-name-input').value.trim();
  const session = getSession();
  if (!session) return;
  const users = getUsers().map(u => u.id === session.userId ? {...u, name} : u);
  saveUsers(users);
  saveSession({...session, name});
  renderHeaderUser();
  renderMine();
  showToast('姓名已更新');
}

function cancelMyBooking(id) {
  const session = getSession();
  const booking = getBookings().find(b => b.id === id);
  if (!booking) return;
  if (session && booking.userId && booking.userId !== session.userId && booking.phone !== session.phone) {
    showToast('无权操作他人预约'); return;
  }
  if (!confirm('确定要取消该预约吗？')) return;
  let toastMsg = '预约已取消';
  if (booking.cardType === 'credit' && booking.cardId) {
    const cards = getCards(), idx = cards.findIndex(c => c.id === booking.cardId);
    if (idx >= 0) { cards[idx] = {...cards[idx], remainingCredits: cards[idx].remainingCredits + 1}; saveCards(cards); toastMsg = '预约已取消，课卡次数已退还'; }
  }
  saveBookings(getBookings().map(b => b.id === id ? {...b, status:'cancelled'} : b));
  renderMine();
  showToast(toastMsg);
}

// ===== Admin =====
function switchAdminTab(tab) { adminTab = tab; renderAdmin(); }

function renderAdmin() {
  const el = document.getElementById('admin-content');
  if (!adminLoggedIn) {
    el.innerHTML = `
      <div class="admin-login-prompt">
        <div class="al-icon">🔐</div><h3>管理员入口</h3>
        <p>请登录管理员账户以查看预约数据和管理课程</p>
        <button class="btn-primary" onclick="openModal('adminlogin')">管理员登录</button>
      </div>`;
    return;
  }
  let content = '';
  if (adminTab === 'courses')  content = renderAdminCoursesHTML();
  if (adminTab === 'bookings') content = renderAdminBookingsHTML();
  if (adminTab === 'cards')    content = renderAdminCardsHTML();
  if (adminTab === 'users')    content = renderAdminUsersHTML();

  el.innerHTML = `
    <div class="admin-tabs">
      <button class="admin-tab ${adminTab==='courses' ?'active':''}" onclick="switchAdminTab('courses')">课程</button>
      <button class="admin-tab ${adminTab==='bookings'?'active':''}" onclick="switchAdminTab('bookings')">预约</button>
      <button class="admin-tab ${adminTab==='cards'   ?'active':''}" onclick="switchAdminTab('cards')">课卡</button>
      <button class="admin-tab ${adminTab==='users'   ?'active':''}" onclick="switchAdminTab('users')">用户</button>
    </div>
    <div class="admin-body">${content}<button class="btn-logout" onclick="adminLogout()">退出管理员</button></div>`;
}

// ── Admin: Courses ──
function renderAdminCoursesHTML() {
  const courses = getCourses().slice().sort((a,b) => a.date !== b.date ? a.date.localeCompare(b.date) : a.time.localeCompare(b.time));
  const rows = courses.map(c => {
    const left = c.capacity - getBookedCount(c.id);
    let vt = c.localVideoData ? '本地视频 📹' : c.videoUrl ? '视频链接 🔗' : '暂无视频';
    return `
      <div class="admin-booking-item">
        <div class="admin-booking-info">
          <div class="admin-booking-name">${c.emoji} ${c.name}</div>
          <div class="admin-booking-detail">${fmtCourseDate(c.date)} · ${c.time} · ${c.teacher} · ${c.room} · 余${left}/${c.capacity} · ${vt}</div>
        </div>
        <div class="admin-item-actions">
          <button class="admin-toggle" onclick="openCourseForm('${c.id}')">编辑</button>
          <button class="admin-toggle admin-toggle-danger" onclick="deleteCourse('${c.id}')">删除</button>
        </div>
      </div>`;
  }).join('');
  return `
    <div class="admin-card">
      <div class="admin-card-title">
        <span>🎓 课程管理（${courses.length}）</span>
        <button class="btn-book" style="font-size:0.78rem;padding:6px 14px;border-radius:16px" onclick="openCourseForm(null)">+ 新增</button>
      </div>
      ${rows || '<div style="text-align:center;color:#aaa;padding:20px">暂无课程</div>'}
    </div>`;
}

// ── Admin: Bookings ──
function renderAdminBookingsHTML() {
  const all      = getBookings();
  const conf     = all.filter(b => b.status === 'confirmed');
  const canc     = all.filter(b => b.status === 'cancelled');
  const filtered = adminBookingFilter
    ? all.filter(b => b.phone && b.phone.includes(adminBookingFilter))
    : all;

  const capRows = getCourses().slice().sort((a,b) => a.date.localeCompare(b.date)).map(c => {
    const n = getBookedCount(c.id), pct = Math.round(n/c.capacity*100);
    return `<div class="admin-booking-item"><div class="admin-booking-info">
      <div class="admin-booking-name">${c.emoji} ${c.name}</div>
      <div class="admin-booking-detail">${fmtCourseDate(c.date)} · ${c.teacher} · ${n}/${c.capacity} 人（${pct}%）</div>
    </div></div>`;
  }).join('');

  const bkRows = filtered.length === 0
    ? `<div style="text-align:center;color:#aaa;padding:20px">${adminBookingFilter?'无匹配预约':'暂无预约'}</div>`
    : filtered.slice().reverse().map(b => {
        const dateDisplay = b.date ? fmtCourseDate(b.date) : (b.day||'');
        const user = findUserByPhone(b.phone);
        const userName = user ? (user.name||user.phone) : (b.userName||b.phone||'未知');
        return `
        <div class="admin-booking-item">
          <div class="admin-booking-info">
            <div class="admin-booking-name">${b.courseEmoji||''} ${b.courseName} · ${dateDisplay}</div>
            <div class="admin-booking-detail">${userName} · ${b.phone||''} · ${fmtTs(b.createdAt)}</div>
          </div>
          <div class="admin-item-actions">
            <button class="admin-toggle status-${b.status}" onclick="adminToggleBooking('${b.id}')">
              ${b.status==='confirmed'?'已确认':'已取消'}
            </button>
          </div>
        </div>`;
      }).join('');

  return `
    <div class="admin-card">
      <div class="admin-card-title">📊 数据概览</div>
      <div class="admin-stats">
        <div class="admin-stat"><div class="admin-stat-num">${all.length}</div><div class="admin-stat-lbl">总预约</div></div>
        <div class="admin-stat"><div class="admin-stat-num">${conf.length}</div><div class="admin-stat-lbl">已确认</div></div>
        <div class="admin-stat"><div class="admin-stat-num">${canc.length}</div><div class="admin-stat-lbl">已取消</div></div>
      </div>
    </div>
    <div class="admin-card">
      <div class="admin-card-title">📋 课程容量</div>
      ${capRows}
    </div>
    <div class="admin-card">
      <div class="admin-card-title">
        <span>📝 预约记录（${all.length}）</span>
      </div>
      <input class="form-input" style="margin-bottom:10px;font-size:0.82rem" placeholder="按手机号筛选…"
        value="${adminBookingFilter}" oninput="adminBookingFilter=this.value; renderAdmin()">
      ${bkRows}
    </div>`;
}

function adminToggleBooking(id) {
  const bookings = getBookings();
  const b = bookings.find(bk => bk.id === id);
  if (!b) return;
  // Refund credits when cancelling
  if (b.status === 'confirmed' && b.cardType === 'credit' && b.cardId) {
    const cards = getCards(), idx = cards.findIndex(c => c.id === b.cardId);
    if (idx >= 0) { cards[idx] = {...cards[idx], remainingCredits: cards[idx].remainingCredits + 1}; saveCards(cards); }
  }
  saveBookings(bookings.map(bk => bk.id === id ? {...bk, status: bk.status==='confirmed'?'cancelled':'confirmed'} : bk));
  renderAdmin();
}

// ── Admin: Cards ──
function renderAdminCardsHTML() {
  const cards = getCards();
  const rows = cards.length === 0
    ? '<div style="text-align:center;color:#aaa;padding:28px 0">暂无课卡记录</div>'
    : cards.map(card => {
        const st = getCardStatus(card);
        const user = findUserByPhone(card.phone);
        const displayName = user ? (user.name || user.phone) : (card.userName || card.phone);
        const typeLabel = card.type === 'period' ? '期限卡' : '次数卡';
        const detail    = card.type === 'period' ? `${card.startDate} ~ ${card.endDate}` : `${card.remainingCredits}/${card.totalCredits} 次`;
        return `
          <div class="admin-booking-item">
            <div class="admin-booking-info">
              <div class="admin-booking-name">${displayName} · ${card.phone}</div>
              <div class="admin-booking-detail">${typeLabel} · ${detail}</div>
            </div>
            <div class="admin-item-actions">
              <span class="status-badge ${st.cls}">${st.text}</span>
              <button class="admin-toggle" onclick="openCardModal('${card.id}')">编辑</button>
              <button class="admin-toggle admin-toggle-danger" onclick="deleteCard('${card.id}')">删除</button>
            </div>
          </div>`;
      }).join('');

  return `
    <div class="admin-card">
      <div class="admin-card-title">
        <span>🎟️ 课卡管理（${cards.length}）</span>
        <button class="btn-book" style="font-size:0.78rem;padding:6px 14px;border-radius:16px" onclick="openCardModal('')">+ 新建</button>
      </div>
      ${rows}
    </div>`;
}

function openCardModal(cardId) {
  const card = cardId ? getCards().find(c => c.id === cardId) : null;
  const isPeriod = !card || card.type === 'period';
  const existingUser = card ? findUserByPhone(card.phone) : null;

  document.getElementById('modal-card-body').innerHTML = `
    <div class="modal-body">
      <h3 class="modal-title">${card ? '编辑课卡' : '新建课卡'}</h3>
      <div class="form-group">
        <label class="form-label">用户手机号</label>
        <input id="cd-phone" class="form-input" type="tel" placeholder="请输入手机号"
          value="${card ? card.phone : ''}" ${card ? 'readonly' : ''}
          oninput="lookupUserForCard(this.value)">
        <div id="cd-user-lookup" style="margin-top:6px;font-size:0.8rem">
          ${existingUser ? `<span class="user-found">✓ 用户：${_esc(existingUser.name||existingUser.phone)}</span>` : ''}
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">课卡类型</label>
        <select id="cd-type" class="form-input" onchange="toggleCardTypeFields()">
          <option value="period" ${isPeriod?'selected':''}>期限卡（按有效期）</option>
          <option value="credit" ${card&&card.type==='credit'?'selected':''}>次数卡（按次数）</option>
        </select>
      </div>
      <div id="cd-period-fields" style="${isPeriod?'':'display:none'}">
        <div class="form-group"><label class="form-label">开始日期</label>
          <input id="cd-start" class="form-input" type="date" value="${card&&card.type==='period'?card.startDate:''}"></div>
        <div class="form-group"><label class="form-label">结束日期</label>
          <input id="cd-end" class="form-input" type="date" value="${card&&card.type==='period'?card.endDate:''}"></div>
      </div>
      <div id="cd-credit-fields" style="${card&&card.type==='credit'?'':'display:none'}">
        <div class="form-group"><label class="form-label">总次数</label>
          <input id="cd-total" class="form-input" type="number" min="1" placeholder="例：10" value="${card&&card.type==='credit'?card.totalCredits:''}"></div>
        <div class="form-group"><label class="form-label">剩余次数</label>
          <input id="cd-remaining" class="form-input" type="number" min="0" placeholder="例：10" value="${card&&card.type==='credit'?card.remainingCredits:''}"></div>
      </div>
      <div id="cd-error" class="error-msg" style="display:none"></div>
      <button class="btn-primary" onclick="saveCard('${cardId||''}')">保存课卡</button>
    </div>`;
  openModal('card');
}

function lookupUserForCard(phone) {
  const el = document.getElementById('cd-user-lookup');
  if (!el) return;
  if (!phone || phone.length < 11) { el.innerHTML = ''; return; }
  const user = findUserByPhone(phone);
  el.innerHTML = user
    ? `<span class="user-found">✓ 用户：${_esc(user.name||user.phone)}</span>`
    : `<span class="user-not-found">该手机号未注册，保存时将自动创建用户账户</span>`;
}

function toggleCardTypeFields() {
  const t = document.getElementById('cd-type').value;
  document.getElementById('cd-period-fields').style.display = t==='period' ? '' : 'none';
  document.getElementById('cd-credit-fields').style.display = t==='credit' ? '' : 'none';
}

function saveCard(cardId) {
  const phone  = document.getElementById('cd-phone').value.trim();
  const type   = document.getElementById('cd-type').value;
  const errEl  = document.getElementById('cd-error');

  if (!phone || !/^1\d{10}$/.test(phone)) { showErr(errEl,'请输入正确的手机号（11位）'); return; }

  // Ensure user exists
  let user = findUserByPhone(phone);
  if (!user) {
    user = { id: genId(), phone, name:`用户${phone.slice(-4)}`, createdAt: Date.now() };
    const users = getUsers(); users.push(user); saveUsers(users);
  }

  let cardData = { userId: user.id, userName: user.name, phone, type };

  if (type === 'period') {
    const start = document.getElementById('cd-start').value;
    const end   = document.getElementById('cd-end').value;
    if (!start||!end) { showErr(errEl,'请填写有效期的开始和结束日期'); return; }
    if (start > end)  { showErr(errEl,'开始日期不能晚于结束日期'); return; }
    cardData = {...cardData, startDate:start, endDate:end};
  } else {
    const total     = parseInt(document.getElementById('cd-total').value, 10);
    const remaining = parseInt(document.getElementById('cd-remaining').value, 10);
    if (!total||total<1)               { showErr(errEl,'请输入有效的总次数（≥1）'); return; }
    if (isNaN(remaining)||remaining<0) { showErr(errEl,'剩余次数不能为负数'); return; }
    if (remaining > total)             { showErr(errEl,'剩余次数不能大于总次数'); return; }
    cardData = {...cardData, totalCredits:total, remainingCredits:remaining};
  }

  const cards = getCards();
  if (cardId) {
    const idx = cards.findIndex(c => c.id === cardId);
    if (idx >= 0) cards[idx] = {...cards[idx], ...cardData};
  } else {
    cards.push({ id:genId(), ...cardData, createdAt:Date.now() });
  }
  saveCards(cards);
  closeModal('card');
  renderAdmin();
  showToast(cardId ? '课卡已更新' : '课卡已创建 🎟️');
}

function deleteCard(cardId) {
  if (!confirm('确定要删除该课卡吗？此操作不可撤销。')) return;
  saveCards(getCards().filter(c => c.id !== cardId));
  renderAdmin();
  showToast('课卡已删除');
}

// ── Admin: Users ──
function renderAdminUsersHTML() {
  const users    = getUsers();
  const cards    = getCards();
  const bookings = getBookings();

  const rows = users.map(u => {
    const cardCnt = cards.filter(c => c.phone === u.phone).length;
    const bkCnt   = bookings.filter(b => b.userId===u.id || b.phone===u.phone).length;
    return `
      <div class="admin-booking-item">
        <div class="admin-booking-info">
          <div class="admin-booking-name">${_esc(u.name||'未命名')} · ${u.phone}</div>
          <div class="admin-booking-detail">注册：${fmtTs(u.createdAt)} · 课卡 ${cardCnt} 张 · 预约 ${bkCnt} 条</div>
        </div>
        <div class="admin-item-actions">
          <button class="admin-toggle" onclick="openEditUserModal('${u.id}')">编辑</button>
          <button class="admin-toggle admin-toggle-danger" onclick="deleteUser('${u.id}')">删除</button>
        </div>
      </div>`;
  }).join('');

  return `
    <div class="admin-card">
      <div class="admin-card-title">
        <span>👥 用户管理（${users.length}）</span>
        <button class="btn-book" style="font-size:0.78rem;padding:6px 14px;border-radius:16px" onclick="openCreateUserModal()">+ 创建用户</button>
      </div>
      ${rows || '<div style="text-align:center;color:#aaa;padding:20px">暂无用户</div>'}
    </div>`;
}

function openCreateUserModal() {
  document.getElementById('modal-user-body').innerHTML = `
    <div class="modal-body">
      <h3 class="modal-title">创建用户</h3>
      <div class="form-group"><label class="form-label">手机号 *</label>
        <input id="mu-phone" class="form-input" type="tel" placeholder="请输入手机号"></div>
      <div class="form-group"><label class="form-label">姓名</label>
        <input id="mu-name" class="form-input" type="text" placeholder="用户姓名（可选）"></div>
      <div id="mu-error" class="error-msg" style="display:none"></div>
      <button class="btn-primary" onclick="saveUserAdmin(null)">创建</button>
    </div>`;
  openModal('user');
}

function openEditUserModal(userId) {
  const user = getUsers().find(u => u.id === userId);
  if (!user) return;
  document.getElementById('modal-user-body').innerHTML = `
    <div class="modal-body">
      <h3 class="modal-title">编辑用户</h3>
      <div class="form-group"><label class="form-label">手机号</label>
        <input class="form-input" value="${user.phone}" disabled></div>
      <div class="form-group"><label class="form-label">姓名</label>
        <input id="mu-name" class="form-input" type="text" value="${_esc(user.name||'')}"></div>
      <div id="mu-error" class="error-msg" style="display:none"></div>
      <button class="btn-primary" onclick="saveUserAdmin('${userId}')">保存</button>
    </div>`;
  openModal('user');
}

function saveUserAdmin(userId) {
  const errEl = document.getElementById('mu-error');
  const name  = document.getElementById('mu-name').value.trim();
  if (userId) {
    // Edit
    const users = getUsers().map(u => u.id === userId ? {...u, name} : u);
    saveUsers(users);
    const session = getSession();
    if (session && session.userId === userId) { saveSession({...session, name}); renderHeaderUser(); }
    closeModal('user'); renderAdmin(); showToast('用户信息已更新');
  } else {
    // Create
    const phone = document.getElementById('mu-phone').value.trim();
    if (!phone || !/^1\d{10}$/.test(phone)) { showErr(errEl,'请输入正确的手机号（11位）'); return; }
    if (findUserByPhone(phone)) { showErr(errEl,'该手机号已注册'); return; }
    const users = getUsers();
    users.push({ id:genId(), phone, name:name||`用户${phone.slice(-4)}`, createdAt:Date.now() });
    saveUsers(users);
    closeModal('user'); renderAdmin(); showToast('用户已创建');
  }
}

function deleteUser(userId) {
  const user = getUsers().find(u => u.id === userId);
  if (!user) return;
  const cards    = getCards().filter(c => c.phone === user.phone);
  const bookings = getBookings().filter(b => b.userId===userId || b.phone===user.phone);
  if (!confirm(`确定删除用户「${user.name||user.phone}」吗？\n将同时删除 ${cards.length} 张课卡和 ${bookings.length} 条预约记录，此操作不可撤销。`)) return;
  saveUsers(getUsers().filter(u => u.id !== userId));
  saveCards(getCards().filter(c => c.phone !== user.phone));
  saveBookings(getBookings().filter(b => b.userId !== userId && b.phone !== user.phone));
  const session = getSession();
  if (session && session.userId === userId) { clearSession(); renderHeaderUser(); }
  renderAdmin(); showToast('用户已删除');
}

// ── Admin: Course Form ──
function openCourseForm(courseId) {
  const isNew = courseId == null;
  const c     = isNew ? null : getCourse(courseId);
  _editingCourseId = isNew ? null : courseId;

  _videoState = { data: isNew?'':(c.localVideoData||''), name: isNew?'':(c.localVideoName||''), reading:false, cleared:false };

  const minDate  = isNew ? ` min="${todayIso()}"` : '';
  const videoInfo = _videoState.name
    ? `<div class="video-file-info" id="ce-video-info">当前：<strong>${_esc(_videoState.name)}</strong><button class="video-clear-btn" onclick="clearLocalVideo()">清除</button></div>`
    : `<div id="ce-video-info"></div>`;

  document.getElementById('modal-courseedit-body').innerHTML = `
    <div class="modal-body">
      <h3 class="modal-title">${isNew?'新增课程场次':'编辑课程场次'}</h3>
      <div class="form-group"><label class="form-label">Emoji / 图标</label>
        <input id="ce-emoji" class="form-input" type="text" placeholder="如 💃" value="${isNew?'🎵':_esc(c.emoji)}"></div>
      <div class="form-group"><label class="form-label">课程名称 *</label>
        <input id="ce-name" class="form-input" type="text" placeholder="课程名称" value="${isNew?'':_esc(c.name)}"></div>
      <div class="form-group"><label class="form-label">教练姓名 *</label>
        <input id="ce-teacher-name" class="form-input" type="text" placeholder="如：Alex 老师" value="${isNew?'':_esc(c.teacher)}"></div>
      <div class="form-group"><label class="form-label">上课日期 *</label>
        <input id="ce-date" class="form-input" type="date" value="${isNew?'':(c.date||'')}"${minDate}></div>
      <div class="form-group"><label class="form-label">上课时间 *</label>
        <input id="ce-time" class="form-input" type="text" placeholder="如 19:00–20:30" value="${isNew?'':_esc(c.time)}"></div>
      <div class="form-group"><label class="form-label">地点</label>
        <input id="ce-room" class="form-input" type="text" placeholder="如 舞室 A" value="${isNew?'':_esc(c.room)}"></div>
      <div class="form-group"><label class="form-label">容量人数 *</label>
        <input id="ce-capacity" class="form-input" type="number" min="1" placeholder="如 20" value="${isNew?'':c.capacity}"></div>
      <div class="form-group"><label class="form-label">难度</label>
        <select id="ce-level" class="form-input">
          ${['初级','中级','高级','全级','儿童班'].map(lv=>`<option value="${lv}" ${!isNew&&c.level===lv?'selected':''}>${lv}</option>`).join('')}
        </select></div>
      <div class="form-group"><label class="form-label">课程介绍</label>
        <textarea id="ce-desc" class="form-input" rows="4" placeholder="课程介绍...">${isNew?'':_esc(c.description||'')}</textarea></div>
      <div class="form-group"><label class="form-label">教练介绍</label>
        <textarea id="ce-teacherintro" class="form-input" rows="3" placeholder="教练背景、经历等...">${isNew?'':_esc(c.teacherIntro||'')}</textarea></div>
      <div class="form-group"><label class="form-label">视频链接</label>
        <input id="ce-video" class="form-input" type="url" placeholder="YouTube / Bilibili / 直链 .mp4 URL" value="${isNew?'':_esc(c.videoUrl||'')}"></div>
      <div class="form-group">
        <label class="form-label">本地视频上传</label>
        <div class="video-upload-hint">本地视频优先显示，演示版建议 5MB 以内，正式上线请使用云存储。</div>
        ${videoInfo}
        <label class="video-file-label">
          <input id="ce-video-file" type="file" accept="video/mp4,video/quicktime,video/webm" style="display:none" onchange="handleVideoFile(this)">
          <span class="video-file-btn">选择视频文件</span>
        </label>
        <div id="ce-video-pending" style="font-size:0.8rem;color:var(--text2);margin-top:6px;display:none">⏳ 处理中…</div>
      </div>
      <div id="ce-error" class="error-msg" style="display:none"></div>
      <button class="btn-primary" onclick="saveCourseForm()">保存</button>
      <button class="btn-outline" style="margin-top:10px;width:100%;display:block" onclick="closeModal('courseedit')">取消</button>
    </div>`;
  openModal('courseedit');
}

function handleVideoFile(input) {
  const file = input.files[0]; if (!file) return;
  if (file.size > 5*1024*1024) {
    alert(`文件过大（${(file.size/1024/1024).toFixed(1)} MB）。\n演示版建议 5MB 以内，正式上线请使用云存储。`);
    input.value = ''; return;
  }
  _videoState.reading = true;
  const p = document.getElementById('ce-video-pending'); if (p) p.style.display='';
  const reader = new FileReader();
  reader.onload = e => {
    _videoState.data = e.target.result; _videoState.name = file.name;
    _videoState.reading = false; _videoState.cleared = false;
    if (p) p.textContent = `✓ 已选择：${file.name}`;
    const info = document.getElementById('ce-video-info');
    if (info) info.innerHTML = `当前：<strong>${_esc(file.name)}</strong> <button class="video-clear-btn" onclick="clearLocalVideo()">清除</button>`;
  };
  reader.onerror = () => { _videoState.reading = false; if (p) p.textContent = '❌ 读取失败，请重试'; };
  reader.readAsDataURL(file);
}

function clearLocalVideo() {
  _videoState = { data:'', name:'', reading:false, cleared:true };
  const info = document.getElementById('ce-video-info');
  if (info) info.innerHTML = '<span style="font-size:0.8rem;color:#aaa">已清除本地视频</span>';
  const fi = document.getElementById('ce-video-file'); if (fi) fi.value = '';
  const p  = document.getElementById('ce-video-pending'); if (p) p.style.display = 'none';
}

function saveCourseForm() {
  const errEl        = document.getElementById('ce-error');
  const name         = document.getElementById('ce-name').value.trim();
  const emoji        = document.getElementById('ce-emoji').value.trim() || '🎵';
  const teacher      = document.getElementById('ce-teacher-name').value.trim();
  const date         = document.getElementById('ce-date').value;
  const time         = document.getElementById('ce-time').value.trim();
  const room         = document.getElementById('ce-room').value.trim();
  const capacity     = parseInt(document.getElementById('ce-capacity').value, 10);
  const level        = document.getElementById('ce-level').value;
  const description  = document.getElementById('ce-desc').value.trim();
  const teacherIntro = document.getElementById('ce-teacherintro').value.trim();
  const videoUrl     = document.getElementById('ce-video').value.trim();

  errEl.style.display = 'none';
  if (!name)                     { showErr(errEl,'请填写课程名称'); return; }
  if (!teacher)                  { showErr(errEl,'请填写教练姓名'); return; }
  if (!date)                     { showErr(errEl,'请选择上课日期'); return; }
  if (!time)                     { showErr(errEl,'请填写上课时间'); return; }
  if (!capacity || capacity < 1) { showErr(errEl,'请填写有效的容量人数（≥1）'); return; }
  if (_videoState.reading)       { showErr(errEl,'视频处理中，请稍候…'); return; }

  const localVideoData = _videoState.cleared ? '' : _videoState.data;
  const localVideoName = _videoState.cleared ? '' : _videoState.name;
  const levelClass     = LEVEL_CLASS_MAP[level] || 'beginner';
  const courses        = getCourses();
  const isNew          = _editingCourseId == null;

  if (isNew) {
    courses.push({ id:genId(), name, emoji, teacher, date, time, room, capacity, level, levelClass, description, teacherIntro, videoUrl, localVideoData, localVideoName, duration:90, requirements:'', color:COURSE_COLORS[Math.floor(Math.random()*COURSE_COLORS.length)] });
    saveCourses(courses); showToast('新课程场次已添加 🎉');
  } else {
    const idx = courses.findIndex(c => String(c.id) === String(_editingCourseId));
    if (idx >= 0) courses[idx] = {...courses[idx], name, emoji, teacher, date, time, room, capacity, level, levelClass, description, teacherIntro, videoUrl, localVideoData, localVideoName};
    saveCourses(courses); showToast('课程场次已更新 ✓');
  }
  closeModal('courseedit');
  renderAdmin();
  if (currentPage === 'schedule') renderSchedule();
}

function deleteCourse(courseId) {
  const c = getCourse(courseId); if (!c) return;
  const related = getBookings().filter(b => String(b.courseId) === String(courseId));
  const msg = related.length > 0
    ? `该课程已有 ${related.length} 条预约，删除后相关预约也会移除，是否继续？`
    : `确定要删除「${c.name}」（${fmtCourseDate(c.date)}）吗？此操作不可撤销。`;
  if (!confirm(msg)) return;
  saveCourses(getCourses().filter(c2 => String(c2.id) !== String(courseId)));
  saveBookings(getBookings().filter(b => String(b.courseId) !== String(courseId)));
  renderAdmin();
  if (currentPage === 'schedule')   renderSchedule();
  if (currentPage === 'mybookings') renderMine();
  showToast(`已删除「${c.name}」${fmtCourseDate(c.date)}`);
}

// ── Admin Auth ──
function adminLogin() {
  const pwd = document.getElementById('admin-pwd').value;
  if (pwd === ADMIN_PASSWORD) {
    adminLoggedIn = true;
    document.getElementById('admin-pwd').value = '';
    document.getElementById('admin-login-err').style.display = 'none';
    closeModal('adminlogin'); renderAdmin(); showToast('已登录管理员账户');
  } else {
    document.getElementById('admin-login-err').style.display = 'block';
  }
}
function adminLogout() { adminLoggedIn = false; renderAdmin(); showToast('已退出管理员账户'); }

// ===== Modal =====
function openModal(name)  { document.getElementById(`modal-${name}-bg`).classList.add('open'); }
function closeModal(name) { document.getElementById(`modal-${name}-bg`).classList.remove('open'); }

// ===== Init =====
function init() {
  migrateData();
  initDateFilter();
  renderHeaderUser();
}
document.addEventListener('DOMContentLoaded', init);
