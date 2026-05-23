'use strict';

// ===== Constants ===== v2

const WEEKDAYS        = ['周日','周一','周二','周三','周四','周五','周六'];
const ADMIN_PASSWORD  = 'scs123123';
const COACH_PASSWORD  = 'woshijiaolian';
const LEVEL_CLASS_MAP = { '初级':'beginner','中级':'intermediate','高级':'advanced','全级':'all','儿童班':'kids' };
const COURSE_COLORS   = ['#e94560','#4a90e2','#9b59b6','#27ae60','#f39c12','#e67e22','#c0392b','#16a085','#2980b9','#8e44ad'];
const MONTH_EN        = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const WDAY_EN         = { '周日':'Sun','周一':'Mon','周二':'Tue','周三':'Wed','周四':'Thu','周五':'Fri','周六':'Sat' };

// ===== Supabase Config =====
const SB_URL = 'https://iodfxczhadjoarnobazq.supabase.co';
const SB_KEY = 'sb_publishable_3SRRf666jucZ8vZPD4KuGg_x_Ng6bOh';
const REST   = `${SB_URL}/rest/v1`;

const HG = { 'apikey': SB_KEY, 'Authorization': `Bearer ${SB_KEY}` };
const H  = { ...HG, 'Content-Type': 'application/json', 'Prefer': 'return=representation' };

async function sbGet(path) {
  const r = await fetch(`${REST}/${path}`, { headers: HG });
  if (!r.ok) { const t = await r.text(); throw new Error(`GET ${path} → ${r.status}: ${t}`); }
  return r.json();
}
async function sbPost(table, data) {
  const r = await fetch(`${REST}/${table}`, { method:'POST', headers: H, body: JSON.stringify(data) });
  if (!r.ok) {
    const t = await r.text();
    const err = Object.assign(new Error(`POST ${table} → ${r.status}: ${t}`), { status: r.status, body: t });
    throw err;
  }
  return r.json();
}
async function sbPatch(table, filter, data) {
  const r = await fetch(`${REST}/${table}?${filter}`, { method:'PATCH', headers: H, body: JSON.stringify(data) });
  if (!r.ok) { const t = await r.text(); throw new Error(`PATCH ${table} → ${r.status}: ${t}`); }
  return r.json();
}
async function sbDelete(table, filter) {
  const r = await fetch(`${REST}/${table}?${filter}`, { method:'DELETE', headers: HG });
  if (!r.ok) { const t = await r.text(); throw new Error(`DELETE ${table} → ${r.status}: ${t}`); }
}

// ===== Row Mappers =====
function rowToCourse(r) {
  return {
    id: r.id, name: r.name, emoji: r.emoji || '🎵', teacher: r.teacher,
    date: r.date, time: r.time, duration: r.duration || 90,
    level: r.level, levelClass: r.level_class || 'all',
    capacity: r.capacity, room: r.room || '', color: r.color || '#8c1a2b',
    description: r.description || '', requirements: r.requirements || '',
    teacherIntro: r.teacher_intro || '', videoUrl: r.video_url || '',
    localVideoData: '', localVideoName: ''
  };
}
function rowToCard(r) {
  return {
    id: r.id, userId: r.user_id, phone: r.phone, type: r.type,
    startDate: r.start_date, endDate: r.end_date,
    totalCredits: r.total_credits, remainingCredits: r.remaining_credits
  };
}
function rowToUser(r) {
  return { id: r.id, phone: r.phone, name: r.name || '' };
}
function rowToBooking(r) {
  return {
    id: r.id, courseId: r.course_id, userId: r.user_id, phone: r.phone,
    userName: r.user_name || '', status: r.status,
    cardId: r.card_id, cardType: r.card_type,
    createdAt: new Date(r.created_at).getTime(),
    courseName:  r.courses?.name    || '',
    courseEmoji: r.courses?.emoji   || '',
    teacher:     r.courses?.teacher || '',
    date:        r.courses?.date    || '',
    time:        r.courses?.time    || '',
    room:        r.courses?.room    || ''
  };
}

// ===== Fetch Functions =====
async function fetchCourses() {
  const rows = await sbGet('courses?order=date,time');
  return rows.map(rowToCourse);
}
async function fetchCourse(id) {
  const rows = await sbGet(`courses?id=eq.${id}`);
  return rows.length ? rowToCourse(rows[0]) : null;
}
async function fetchBookedCounts() {
  const rows = await sbGet('bookings?status=eq.confirmed&select=course_id');
  const m = {};
  rows.forEach(r => { m[r.course_id] = (m[r.course_id] || 0) + 1; });
  return m;
}
async function fetchBookedCountForCourse(courseId) {
  const rows = await sbGet(`bookings?course_id=eq.${courseId}&status=eq.confirmed&select=id`);
  return rows.length;
}
async function fetchUserBookings(userId) {
  const rows = await sbGet(
    `bookings?user_id=eq.${userId}&order=created_at.desc` +
    `&select=*,courses(name,emoji,teacher,date,time,room)`
  );
  return rows.map(rowToBooking);
}
async function fetchCards() {
  const rows = await sbGet('course_cards?order=created_at.desc');
  return rows.map(rowToCard);
}
async function fetchCardsByPhone(phone) {
  const rows = await sbGet(`course_cards?phone=eq.${encodeURIComponent(phone)}&order=created_at.desc`);
  return rows.map(rowToCard);
}
async function fetchValidCardForPhone(phone) {
  const today = todayIso();
  const cards = await fetchCardsByPhone(phone);
  for (const c of cards)
    if (c.type === 'period' && c.startDate <= today && today <= c.endDate) return c;
  for (const c of cards)
    if (c.type === 'credit' && c.remainingCredits > 0) return c;
  return null;
}
async function fetchUsers() {
  const rows = await sbGet('app_users?order=created_at.desc');
  return rows.map(rowToUser);
}
async function fetchUserByPhone(phone) {
  const rows = await sbGet(`app_users?phone=eq.${encodeURIComponent(phone)}&limit=1`);
  return rows.length ? rowToUser(rows[0]) : null;
}

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
  const d = new Date(); d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

// ===== App State =====
let currentPage        = 'home';
let currentDateFilter  = 'all';
let adminLoggedIn      = false;
let adminRole          = 'admin'; // 'admin' | 'coach'
let adminTab           = 'bookings';
let adminBookingFilter = '';
let mineTab            = 'bookings';
let _editingCourseId   = null;
let _pendingBookingId  = null;

// ===== Session (localStorage only — no course/card/booking data) =====
function getSession()    { const r = localStorage.getItem('scs_session'); return r ? JSON.parse(r) : null; }
function saveSession(s)  { localStorage.setItem('scs_session', JSON.stringify(s)); }
function clearSession()  { localStorage.removeItem('scs_session'); }

// ===== Utilities =====
function _esc(str) {
  return String(str||'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
function matchesDateFilter(dateStr, filter) {
  if (filter === 'all') return true;
  const today = new Date(); today.setHours(0,0,0,0);
  const [y,m,d] = dateStr.split('-').map(Number);
  const cd = new Date(y, m-1, d);
  if (filter === 'today') return cd.toDateString() === today.toDateString();
  if (filter === 'week') {
    const dow = today.getDay();
    const ws  = new Date(today); ws.setDate(today.getDate() - (dow===0?6:dow-1));
    const we  = new Date(ws);   we.setDate(ws.getDate() + 6);
    return cd >= ws && cd <= we;
  }
  if (filter === 'month') return cd.getFullYear()===today.getFullYear() && cd.getMonth()===today.getMonth();
  return true;
}
function fmtTs(ts) {
  const d = new Date(ts);
  return `${d.getMonth()+1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2,'0')}`;
}
function parseCourseStartTime(dateStr, timeStr) {
  const startStr = (timeStr || '').split(/[–\-]/)[0].trim();
  const m = startStr.match(/^(\d{1,2}):(\d{2})$/);
  if (!m || !dateStr) return null;
  const [y, mo, d] = dateStr.split('-').map(Number);
  return new Date(y, mo - 1, d, +m[1], +m[2], 0);
}
function isWithinCancelDeadline(dateStr, timeStr) {
  const start = parseCourseStartTime(dateStr, timeStr);
  if (!start) return false;
  return Date.now() >= start.getTime() - 2 * 60 * 60 * 1000;
}
function parseCourseEndTime(dateStr, timeStr) {
  const parts = (timeStr || '').split(/[–\-]/);
  const endStr = (parts[1] || '').trim();
  const m = endStr.match(/^(\d{1,2}):(\d{2})$/);
  if (!m || !dateStr) return null;
  const [y, mo, d] = dateStr.split('-').map(Number);
  return new Date(y, mo - 1, d, +m[1], +m[2], 0);
}
function calcDurationMins(timeStr) {
  const parts = (timeStr || '').split(/[–\-]/);
  const parse = s => { const [h,m] = (s||'').trim().split(':').map(Number); return (isNaN(h)||isNaN(m)) ? null : h*60+m; };
  const start = parse(parts[0]), end = parse(parts[1]);
  return (start != null && end != null && end > start) ? end - start : null;
}
function isCourseOver(dateStr, timeStr) {
  const today = todayIso();
  if (dateStr < today) return true;
  if (dateStr > today) return false;
  const end = parseCourseEndTime(dateStr, timeStr);
  return end ? Date.now() >= end.getTime() : false;
}
function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2,6); }
function showErr(el, msg) { if (el) { el.textContent = msg; el.style.display = 'block'; } }

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

// ===== Loading helpers =====
function loadingHTML() {
  return '<div class="empty-state"><div class="empty-text" style="color:var(--text2);letter-spacing:1px">加载中…</div></div>';
}
function errorHTML(msg) {
  return `<div class="empty-state"><div class="empty-text">${msg||'加载失败，请刷新重试'}</div></div>`;
}

// ===== Auth =====
async function loginWithPhone(phone, name) {
  let user = await fetchUserByPhone(phone);
  if (!user) {
    const rows = await sbPost('app_users', { phone, name: name || `用户${phone.slice(-4)}` });
    user = rowToUser(rows[0]);
  } else if (name && (!user.name || user.name === `用户${phone.slice(-4)}`)) {
    await sbPatch('app_users', `id=eq.${user.id}`, { name });
    user = { ...user, name };
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
      <button class="btn-primary" id="login-submit-btn" onclick="submitLogin()">登录 / 注册</button>
      <button class="btn-outline" style="margin-top:10px;width:100%;display:block" onclick="closeModal('login')">取消</button>
    </div>`;
  openModal('login');
}

async function submitLogin() {
  const phone = document.getElementById('login-phone').value.trim();
  const name  = document.getElementById('login-name').value.trim();
  const errEl = document.getElementById('login-error');
  if (!phone || !/^1\d{10}$/.test(phone)) { showErr(errEl,'请输入正确的手机号（11位）'); return; }
  const btn = document.getElementById('login-submit-btn');
  if (btn) { btn.disabled = true; btn.textContent = '登录中…'; }
  try {
    const user = await loginWithPhone(phone, name);
    closeModal('login');
    renderHeaderUser();
    if (currentPage === 'mybookings') renderMine();
    showToast(`欢迎，${user.name || user.phone}！`);
    if (_pendingBookingId) {
      const id = _pendingBookingId;
      _pendingBookingId = null;
      setTimeout(() => openBookingForm(id), 320);
    }
  } catch(e) {
    if (btn) { btn.disabled = false; btn.textContent = '登录 / 注册'; }
    showErr(errEl, '登录失败，请稍后重试');
    console.error(e);
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
        onerror="this.insertAdjacentHTML('afterend','<div style=\\'padding:20px;text-align:center;color:#aaa;font-size:0.8rem\\'>该格式暂不支持播放</div>');this.remove()">
        <source src="${localVideoData}">
      </video></div>`;
  }
  if (!videoUrl) return `<div class="video-placeholder"><div class="vp-icon">▷</div><div class="vp-text">No preview video</div></div>`;
  const ytM = videoUrl.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&\s?\/]+)/);
  if (ytM) return `<div class="video-container"><iframe src="https://www.youtube.com/embed/${ytM[1]}" frameborder="0" allowfullscreen></iframe></div>`;
  const biM = videoUrl.match(/bilibili\.com\/video\/(BV[a-zA-Z0-9]+)/);
  if (biM) return `<div class="video-container"><iframe src="https://player.bilibili.com/player.html?bvid=${biM[1]}&page=1&high_quality=1&danmaku=0" frameborder="0" allowfullscreen></iframe></div>`;
  if (/\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(videoUrl)) return `<div class="video-container"><video src="${videoUrl}" controls playsinline></video></div>`;
  const safe = encodeURIComponent(videoUrl);
  return `<div class="video-placeholder" style="cursor:pointer" onclick="window.open(decodeURIComponent('${safe}'),'_blank')"><div class="vp-icon">▷</div><div class="vp-text">点击查看视频</div></div>`;
}

// ===== Schedule =====
async function renderSchedule() {
  const list = document.getElementById('courses-list');
  list.innerHTML = loadingHTML();
  try {
    const [courses, bookedCounts] = await Promise.all([fetchCourses(), fetchBookedCounts()]);
    const filtered = courses
      .filter(c => !isCourseOver(c.date, c.time) && matchesDateFilter(c.date, currentDateFilter))
      .sort((a,b) => a.date !== b.date ? a.date.localeCompare(b.date) : a.time.localeCompare(b.time));

    if (!filtered.length) {
      const labels = { all:'暂无课程', today:'今天没有课程', week:'本周没有课程', month:'本月没有课程' };
      list.innerHTML = `<div class="empty-state"><div class="empty-icon">—</div><div class="empty-text">${labels[currentDateFilter]||'暂无课程'}</div><div class="empty-hint">No classes in this period</div></div>`;
      return;
    }
    list.innerHTML = filtered.map(c => {
      const booked = bookedCounts[c.id] || 0, left = c.capacity - booked, full = left <= 0;
      const [,m,d] = c.date.split('-');
      const wdEn = WDAY_EN[getWeekday(c.date)] || '';
      return `
        <div class="course-row" onclick="openCourseDetail('${c.id}')">
          <div class="cr-date">
            <div class="cr-dn">${parseInt(d,10)}</div>
            <div class="cr-month">${MONTH_EN[parseInt(m,10)-1]}</div>
            <div class="cr-wday">${wdEn}</div>
          </div>
          <div class="cr-body">
            <div class="cr-name">${_esc(c.name)}</div>
            <div class="cr-meta">${_esc(c.teacher)} · ${_esc(c.time)} · ${_esc(c.room)}</div>
          </div>
          <div class="cr-end">
            <span class="level-badge level-${c.levelClass}">${c.level}</span>
            <div class="cr-book-row">
              <span class="cr-spots${full?' cr-full':''}">${full?'已满':`余 ${left}`}</span>
              <button class="cr-btn" ${full?'disabled':''} onclick="event.stopPropagation(); openBookingForm('${c.id}')">
                ${full?'—':'预约'}
              </button>
            </div>
          </div>
        </div>`;
    }).join('');
  } catch(e) {
    list.innerHTML = errorHTML('课程加载失败，请检查网络后刷新');
    console.error(e);
  }
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
async function openCourseDetail(courseId) {
  openModal('detail');
  document.getElementById('modal-detail-body').innerHTML = '<div style="padding:48px;text-align:center;color:var(--text2)">加载中…</div>';
  try {
    const [c, bookedCount] = await Promise.all([fetchCourse(courseId), fetchBookedCountForCourse(courseId)]);
    if (!c) { closeModal('detail'); return; }
    const left = c.capacity - bookedCount, full = left <= 0;
    document.getElementById('modal-detail-body').innerHTML = `
      ${renderVideoPlayer(c.localVideoData, c.videoUrl)}
      <div class="detail-kicker">
        <span class="level-badge level-${c.levelClass}">${c.level}</span>
        <span class="detail-dur">${calcDurationMins(c.time) ?? c.duration ?? 90} min</span>
      </div>
      <div class="detail-header">
        <div class="detail-title">${_esc(c.name)}</div>
        <div class="detail-teacher">${_esc(c.teacher)}</div>
      </div>
      <div class="detail-meta">
        <div class="detail-meta-row"><span class="detail-meta-label">日期</span><span class="detail-meta-val">${fmtCourseDate(c.date)}</span></div>
        <div class="detail-meta-row"><span class="detail-meta-label">时间</span><span class="detail-meta-val">${_esc(c.time)}</span></div>
        <div class="detail-meta-row"><span class="detail-meta-label">地点</span><span class="detail-meta-val">${_esc(c.room)}</span></div>
        <div class="detail-meta-row"><span class="detail-meta-label">名额</span><span class="detail-meta-val">${full?`<span style="color:var(--accent)">名额已满</span>`:`余 ${left} 位（共 ${c.capacity} 位）`}</span></div>
      </div>
      ${c.description ? `<div class="detail-desc"><h4>课程介绍</h4><p>${_esc(c.description)}</p></div>` : ''}
      ${c.teacherIntro ? `<div class="detail-desc"><h4>教练介绍</h4><p>${_esc(c.teacherIntro)}</p></div>` : ''}
      ${c.requirements ? `<div class="detail-desc"><h4>报名要求</h4><p>${_esc(c.requirements)}</p></div>` : ''}
      <div class="detail-footer">
        <button class="btn-primary" ${full?'disabled':''} onclick="closeModal('detail'); openBookingForm('${c.id}')">
          ${full?'名额已满':'立即预约'}
        </button>
      </div>`;
  } catch(e) {
    document.getElementById('modal-detail-body').innerHTML = errorHTML('加载失败');
    console.error(e);
  }
}

// ===== Booking =====
async function openBookingForm(courseId) {
  const user = getSession();
  if (!user) { openLoginModal(courseId); return; }
  openModal('booking');
  document.getElementById('modal-booking-body').innerHTML = '<div style="padding:48px;text-align:center;color:var(--text2)">加载中…</div>';
  try {
    const [c, bookedCount, myBookings, validCard] = await Promise.all([
      fetchCourse(courseId),
      fetchBookedCountForCourse(courseId),
      fetchUserBookings(user.userId),
      fetchValidCardForPhone(user.phone)
    ]);
    if (!c) { closeModal('booking'); return; }
    const full = bookedCount >= c.capacity;
    const dup  = myBookings.some(b => b.courseId === courseId && b.status === 'confirmed');
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
      statusHtml = `<div class="bk-card-ok">◈ ${cardDesc}</div>`;
    }
    document.getElementById('modal-booking-body').innerHTML = `
      <div class="modal-body">
        <h3 class="modal-title">${_esc(c.name)}</h3>
        <div class="booking-session-info">
          <div class="bsi-date">${fmtCourseDate(c.date)}</div>
          <div class="bsi-detail">${_esc(c.time)} · ${_esc(c.room)}</div>
        </div>
        <div class="booking-user-info">${_esc(user.name || user.phone)} &nbsp;·&nbsp; ${user.phone}</div>
        ${statusHtml}
        <div class="bk-cancel-policy">开课前 2 小时不可取消预约</div>
        <div id="bk-error" class="error-msg" style="display:none"></div>
        ${canBook ? `<button class="btn-primary" id="bk-confirm-btn" onclick="submitBooking('${c.id}')">确认预约</button>` : ''}
        <button class="btn-outline" style="margin-top:10px;width:100%;display:block" onclick="closeModal('booking')">关闭</button>
      </div>`;
  } catch(e) {
    document.getElementById('modal-booking-body').innerHTML = errorHTML('加载失败，请重试');
    console.error(e);
  }
}

async function submitBooking(courseId) {
  const user  = getSession();
  const errEl = document.getElementById('bk-error');
  if (!user) { showErr(errEl,'请先登录'); return; }
  const btn = document.getElementById('bk-confirm-btn');
  if (btn) { btn.disabled = true; btn.textContent = '处理中…'; }
  try {
    const [c, bookedCount, myBookings, validCard] = await Promise.all([
      fetchCourse(courseId),
      fetchBookedCountForCourse(courseId),
      fetchUserBookings(user.userId),
      fetchValidCardForPhone(user.phone)
    ]);
    if (!c) { showErr(errEl,'课程不存在'); if(btn){btn.disabled=false;btn.textContent='确认预约';} return; }
    if (bookedCount >= c.capacity) { showErr(errEl,'名额已满'); if(btn){btn.disabled=false;btn.textContent='确认预约';} return; }
    if (myBookings.some(b => b.courseId === courseId && b.status === 'confirmed')) { showErr(errEl,'你已预约了该场次'); if(btn){btn.disabled=false;btn.textContent='确认预约';} return; }
    if (!validCard) { showErr(errEl,'暂无可用课卡'); if(btn){btn.disabled=false;btn.textContent='确认预约';} return; }

    let cardNote = '';
    if (validCard.type === 'credit') {
      const newRem = validCard.remainingCredits - 1;
      await sbPatch('course_cards', `id=eq.${validCard.id}`, { remaining_credits: newRem });
      cardNote = `已消耗 1 次课卡，剩余 ${newRem} 次`;
    } else {
      cardNote = '期限卡有效，本次课程已记录';
    }

    await sbPost('bookings', {
      course_id: c.id, user_id: user.userId, phone: user.phone,
      user_name: user.name || `用户${user.phone.slice(-4)}`,
      status: 'confirmed', card_id: validCard.id, card_type: validCard.type
    });

    document.getElementById('modal-booking-body').innerHTML = `
      <div class="success-state">
        <div class="success-icon">✓</div>
        <div class="success-title">预约成功</div>
        <div class="success-sub">${_esc(c.name)}<br>${fmtCourseDate(c.date)} ${_esc(c.time)}<br>${_esc(c.room)}</div>
        <div class="success-card-note">${_esc(cardNote)}</div>
        <button class="btn-primary" onclick="closeModal('booking'); navigate('mybookings')">查看我的预约</button>
      </div>`;
    showToast('预约成功');
    if (currentPage === 'schedule') renderSchedule();
  } catch(e) {
    if (btn) { btn.disabled = false; btn.textContent = '确认预约'; }
    const isDup = e.status === 409 || (e.body||'').includes('bookings_no_dup');
    showErr(errEl, isDup ? '你已预约了该场次' : '预约失败，请重试');
    console.error(e);
  }
}

// ===== Mine Page =====
function switchMineTab(tab) { mineTab = tab; renderMine(); }

async function renderMine() {
  const user = getSession();
  const el   = document.getElementById('mine-content');
  if (!user) {
    el.innerHTML = `
      <div class="page-top"><h2 class="page-title">我的</h2></div>
      <div class="mine-login-prompt">
        <div class="ml-icon">—</div>
        <h3>登录查看</h3>
        <p>登录后可查看预约记录、课卡和账户信息</p>
        <button class="btn-primary" style="display:inline-block;width:auto;padding:12px 32px" onclick="openLoginModal(null)">登录 / 注册</button>
      </div>`;
    return;
  }
  el.innerHTML = `
    <div class="page-top" style="padding-bottom:0"><h2 class="page-title">我的</h2></div>
    <div class="mine-tabs">
      <button class="mine-tab ${mineTab==='bookings'?'active':''}" onclick="switchMineTab('bookings')">预约</button>
      <button class="mine-tab ${mineTab==='cards'   ?'active':''}" onclick="switchMineTab('cards')">课卡</button>
      <button class="mine-tab ${mineTab==='account' ?'active':''}" onclick="switchMineTab('account')">账户</button>
    </div>
    <div id="mine-tab-content">${loadingHTML()}</div>`;
  try {
    let content = '';
    if (mineTab === 'bookings') content = await renderMineBookings(user);
    if (mineTab === 'cards')    content = await renderMineCards(user);
    if (mineTab === 'account')  content = renderMineAccount(user);
    const tc = document.getElementById('mine-tab-content');
    if (tc) { tc.innerHTML = content; if (mineTab === 'account') initQRCode(); }
  } catch(e) {
    const tc = document.getElementById('mine-tab-content');
    if (tc) tc.innerHTML = errorHTML('加载失败，请重试');
    console.error(e);
  }
}

async function renderMineBookings(user) {
  const myBookings = await fetchUserBookings(user.userId);
  if (!myBookings.length) {
    return `<div class="mine-body"><div class="empty-state">
      <div class="empty-icon">—</div>
      <div class="empty-text">暂无预约记录</div>
      <div class="empty-hint">去课程表选一节课开始吧</div>
      <button class="btn-outline" onclick="navigate('schedule')">浏览课程</button>
    </div></div>`;
  }
  return `<div class="mine-body">${myBookings.map(b => {
    const dateDisplay = b.date ? fmtCourseDate(b.date) : '';
    return `
      <div class="booking-card">
        <div class="booking-header">
          <div>
            <div class="booking-name">${_esc(b.courseName)}</div>
            <div class="booking-day">${dateDisplay}${b.time?' · '+_esc(b.time):''}</div>
          </div>
          <span class="status-badge status-${b.status}">${b.status==='confirmed'?'已确认':'已取消'}</span>
        </div>
        <div class="booking-meta">${b.room?_esc(b.room)+' · ':''}${_esc(b.teacher)}<br>预约于 ${fmtTs(b.createdAt)}</div>
        ${b.status==='confirmed' ? `<button class="btn-cancel" onclick="cancelMyBooking('${b.id}')">取消预约</button>` : ''}
      </div>`;
  }).join('')}</div>`;
}

async function renderMineCards(user) {
  const myCards = await fetchCardsByPhone(user.phone);
  if (!myCards.length) {
    return `<div class="mine-body"><div class="empty-state">
      <div class="empty-icon">—</div>
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
        <div class="mine-card-icon">◈</div>
        <div class="mine-card-info">
          <div class="mine-card-type">${typeLabel}</div>
          <div class="mine-card-detail">${detail}</div>
        </div>
        <span class="status-badge ${st.cls}">${st.text}</span>
      </div>`;
  }).join('')}</div>`;
}

function renderMineAccount(user) {
  const initials = (user.name || user.phone).trim().slice(0,2).toUpperCase();
  return `
    <div class="mine-body">
      <div class="account-card">
        <div class="account-avatar">${initials}</div>
        <div class="account-info">
          <div class="account-name">${_esc(user.name || '未设置姓名')}</div>
          <div class="account-phone">${user.phone}</div>
        </div>
      </div>
      <div class="mine-form-pad">
        <div class="form-group">
          <label class="form-label">修改姓名</label>
          <input id="mine-name-input" class="form-input" type="text" placeholder="你的姓名" value="${_esc(user.name||'')}">
        </div>
        <button class="btn-primary" onclick="saveMineProfile()">保存姓名</button>
        <button class="btn-outline" style="margin-top:10px;width:100%;display:block" onclick="logoutUser()">退出登录</button>
      </div>
      <div class="qr-section">
        <div class="qr-label">扫码访问本站</div>
        <div id="qr-canvas"></div>
        <div class="qr-url">${_esc(location.origin + location.pathname)}</div>
      </div>
    </div>`;
}

async function saveMineProfile() {
  const name    = document.getElementById('mine-name-input').value.trim();
  const session = getSession();
  if (!session) return;
  try {
    await sbPatch('app_users', `id=eq.${session.userId}`, { name });
    saveSession({...session, name});
    renderHeaderUser();
    renderMine();
    showToast('姓名已更新');
  } catch(e) {
    showToast('更新失败，请重试'); console.error(e);
  }
}

async function cancelMyBooking(id) {
  if (!confirm('确定要取消该预约吗？')) return;
  try {
    const rows = await sbGet(`bookings?id=eq.${id}&select=*,courses(date,time)`);
    const b = rows[0]; if (!b) return;
    if (isWithinCancelDeadline(b.courses?.date, b.courses?.time)) {
      showToast('开课前 2 小时内不可取消预约');
      return;
    }
    let toastMsg = '预约已取消';
    if (b.card_type === 'credit' && b.card_id) {
      const cardRows = await sbGet(`course_cards?id=eq.${b.card_id}`);
      if (cardRows.length) {
        await sbPatch('course_cards', `id=eq.${b.card_id}`, { remaining_credits: cardRows[0].remaining_credits + 1 });
        toastMsg = '预约已取消，课卡次数已退还';
      }
    }
    await sbPatch('bookings', `id=eq.${id}`, { status: 'cancelled' });
    showToast(toastMsg);
    renderMine();
    if (currentPage === 'schedule') renderSchedule();
  } catch(e) {
    showToast('操作失败，请重试'); console.error(e);
  }
}

// ===== Admin =====
function switchAdminTab(tab) { adminTab = tab; renderAdmin(); }

async function renderAdmin() {
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
  const isCoach = adminRole === 'coach';
  if (isCoach) adminTab = 'courses';
  const tabsHTML = isCoach
    ? `<button class="admin-tab active">课程</button>`
    : `<button class="admin-tab ${adminTab==='courses' ?'active':''}" onclick="switchAdminTab('courses')">课程</button>
      <button class="admin-tab ${adminTab==='bookings'?'active':''}" onclick="switchAdminTab('bookings')">预约</button>
      <button class="admin-tab ${adminTab==='cards'   ?'active':''}" onclick="switchAdminTab('cards')">课卡</button>
      <button class="admin-tab ${adminTab==='users'   ?'active':''}" onclick="switchAdminTab('users')">用户</button>`;
  el.innerHTML = `
    <div class="admin-tabs">${tabsHTML}</div>
    <div class="admin-body" id="admin-tab-body">${loadingHTML()}</div>`;
  try {
    let content = '';
    if (adminTab === 'courses')            content = await renderAdminCoursesHTML();
    if (adminTab === 'bookings' && !isCoach) content = await renderAdminBookingsHTML();
    if (adminTab === 'cards'    && !isCoach) content = await renderAdminCardsHTML();
    if (adminTab === 'users'    && !isCoach) content = await renderAdminUsersHTML();
    const body = document.getElementById('admin-tab-body');
    if (body) body.innerHTML = content + `<button class="btn-logout" onclick="adminLogout()">退出管理员</button>`;
  } catch(e) {
    const body = document.getElementById('admin-tab-body');
    if (body) body.innerHTML = errorHTML('加载失败，请重试');
    console.error(e);
  }
}

// ── Admin: Courses ──
async function renderAdminCoursesHTML() {
  const [courses, bookedCounts] = await Promise.all([fetchCourses(), fetchBookedCounts()]);
  const sorted = courses
    .filter(c => !isCourseOver(c.date, c.time))
    .sort((a,b) => a.date !== b.date ? a.date.localeCompare(b.date) : a.time.localeCompare(b.time));
  const rows = sorted.map(c => {
    const left = c.capacity - (bookedCounts[c.id] || 0);
    const vt   = c.videoUrl ? '视频链接' : '无视频';
    return `
      <div class="admin-booking-item">
        <div class="admin-booking-info">
          <div class="admin-booking-name">${_esc(c.name)}</div>
          <div class="admin-booking-detail">${fmtCourseDate(c.date)} · ${_esc(c.time)} · ${_esc(c.teacher)} · ${_esc(c.room)} · 余${left}/${c.capacity} · ${vt}</div>
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
        <span>课程管理（${sorted.length}）</span>
        <button class="btn-add" onclick="openCourseForm(null)">+ 新增</button>
      </div>
      ${rows || '<div style="text-align:center;color:var(--text2);padding:20px;font-size:0.8rem">暂无课程，点击新增添加</div>'}
    </div>`;
}

async function openCourseForm(courseId) {
  const isNew = courseId == null;
  let c = null;
  if (!isNew) {
    c = await fetchCourse(courseId);
    if (!c) return;
  }
  _editingCourseId = isNew ? null : courseId;
  const minDate = isNew ? ` min="${todayIso()}"` : '';
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
        <div class="time-range-picker">
          <input id="ce-time-start" class="form-input" type="time" value="${isNew?'':(c.time||'').split(/[–\-]/)[0].trim()}">
          <span class="time-range-sep">–</span>
          <input id="ce-time-end" class="form-input" type="time" value="${isNew?'':((c.time||'').split(/[–\-]/)[1]||'').trim()}">
        </div></div>
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
      <div class="form-group"><label class="form-label">或上传本地视频</label>
        <input id="ce-video-file" class="form-input" type="file" accept="video/mp4,video/webm,video/ogg,video/quicktime"
          onchange="handleVideoUpload(this)">
        <div id="ce-video-upload-status" style="margin-top:6px;font-size:0.8rem;color:var(--text2)"></div>
      </div>
      <div id="ce-error" class="error-msg" style="display:none"></div>
      <button class="btn-primary" id="ce-save-btn" onclick="saveCourseForm()">保存</button>
      <button class="btn-outline" style="margin-top:10px;width:100%;display:block" onclick="closeModal('courseedit')">取消</button>
    </div>`;
  openModal('courseedit');
}

async function handleVideoUpload(input) {
  const file = input.files[0];
  if (!file) return;
  const statusEl = document.getElementById('ce-video-upload-status');
  const urlEl    = document.getElementById('ce-video');
  if (statusEl) statusEl.textContent = '上传中…';
  try {
    const ext  = file.name.split('.').pop().toLowerCase();
    const path = `${Date.now()}_${Math.random().toString(36).slice(2,8)}.${ext}`;
    const r = await fetch(`${SB_URL}/storage/v1/object/course-videos/${path}`, {
      method: 'POST',
      headers: { 'apikey': SB_KEY, 'Authorization': `Bearer ${SB_KEY}`, 'Content-Type': file.type, 'x-upsert': 'true' },
      body: file
    });
    if (!r.ok) { const t = await r.text(); throw new Error(`${r.status}: ${t}`); }
    const publicUrl = `${SB_URL}/storage/v1/object/public/course-videos/${path}`;
    if (urlEl)    urlEl.value = publicUrl;
    if (statusEl) statusEl.textContent = `✓ 上传成功`;
    input.value = '';
  } catch(e) {
    if (statusEl) statusEl.textContent = `上传失败：${e.message}`;
    console.error(e);
  }
}

async function saveCourseForm() {
  const errEl        = document.getElementById('ce-error');
  const name         = document.getElementById('ce-name').value.trim();
  const emoji        = document.getElementById('ce-emoji').value.trim() || '🎵';
  const teacher      = document.getElementById('ce-teacher-name').value.trim();
  const date         = document.getElementById('ce-date').value;
  const timeStart    = document.getElementById('ce-time-start').value;
  const timeEnd      = document.getElementById('ce-time-end').value;
  const time         = timeStart && timeEnd ? `${timeStart}–${timeEnd}` : (timeStart || '');
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
  if (!timeStart || !timeEnd)    { showErr(errEl,'请选择上课开始和结束时间'); return; }
  if (!capacity || capacity < 1) { showErr(errEl,'请填写有效的容量人数（≥1）'); return; }
  const btn = document.getElementById('ce-save-btn');
  if (btn) { btn.disabled = true; btn.textContent = '保存中…'; }
  const levelClass = LEVEL_CLASS_MAP[level] || 'all';
  try {
    if (_editingCourseId == null) {
      await sbPost('courses', {
        name, emoji, teacher, date, time, room: room||'', capacity,
        level, level_class: levelClass, duration: calcDurationMins(time) ?? 90,
        description: description||'', requirements: '',
        teacher_intro: teacherIntro||'', video_url: videoUrl||'',
        color: COURSE_COLORS[Math.floor(Math.random()*COURSE_COLORS.length)]
      });
      showToast('新课程场次已添加');
    } else {
      await sbPatch('courses', `id=eq.${_editingCourseId}`, {
        name, emoji, teacher, date, time, room: room||'', capacity,
        level, level_class: levelClass,
        description: description||'', teacher_intro: teacherIntro||'', video_url: videoUrl||''
      });
      showToast('课程场次已更新');
    }
    closeModal('courseedit');
    renderAdmin();
    if (currentPage === 'schedule') renderSchedule();
  } catch(e) {
    if (btn) { btn.disabled = false; btn.textContent = '保存'; }
    showErr(errEl, '保存失败，请重试');
    console.error(e);
  }
}

async function deleteCourse(courseId) {
  try {
    const c = await fetchCourse(courseId); if (!c) return;
    const bkRows = await sbGet(`bookings?course_id=eq.${courseId}&select=id`);
    const msg = bkRows.length > 0
      ? `该课程已有 ${bkRows.length} 条预约，删除后相关预约也会移除，是否继续？`
      : `确定要删除「${c.name}」（${fmtCourseDate(c.date)}）吗？`;
    if (!confirm(msg)) return;
    await sbDelete('courses', `id=eq.${courseId}`);
    renderAdmin();
    if (currentPage === 'schedule')   renderSchedule();
    if (currentPage === 'mybookings') renderMine();
    showToast(`已删除「${c.name}」`);
  } catch(e) {
    showToast('删除失败，请重试'); console.error(e);
  }
}

// ── Admin: Bookings ──
async function renderAdminBookingsHTML() {
  const [allBookings, courses] = await Promise.all([
    sbGet('bookings?order=created_at.desc&select=*,courses(name,date,teacher,time,room),app_users(name)'),
    fetchCourses()
  ]);
  const conf = allBookings.filter(b => b.status === 'confirmed').length;
  const canc = allBookings.filter(b => b.status === 'cancelled').length;
  const bookedCounts = {};
  allBookings.filter(b => b.status === 'confirmed').forEach(b => {
    bookedCounts[b.course_id] = (bookedCounts[b.course_id] || 0) + 1;
  });
  const today = todayIso();
  const sorted = courses.slice().sort((a,b) => a.date.localeCompare(b.date));
  const pastCourses     = sorted.filter(c => isCourseOver(c.date, c.time)).reverse();
  const upcomingCourses = sorted.filter(c => !isCourseOver(c.date, c.time));
  function courseRow(c) {
    const n = bookedCounts[c.id] || 0, pct = Math.round(n/c.capacity*100);
    return `<div class="admin-booking-item admin-course-row" onclick="openCourseBookings('${c.id}')">
      <div class="admin-booking-info">
        <div class="admin-booking-name">${_esc(c.name)}</div>
        <div class="admin-booking-detail">${fmtCourseDate(c.date)} · ${_esc(c.teacher)} · ${n}/${c.capacity} 人（${pct}%）</div>
      </div>
      <div class="admin-item-actions"><span style="color:var(--text2);font-size:0.8rem">查看 →</span></div>
    </div>`;
  }
  return `
    <div class="admin-card">
      <div class="admin-card-title">课程预约</div>
      ${upcomingCourses.map(courseRow).join('') || '<div style="padding:16px;color:var(--text2);font-size:0.8rem;text-align:center">暂无即将开始的课程</div>'}
    </div>
    <div class="admin-card">
      <div class="admin-card-title">历史课程</div>
      ${pastCourses.map(courseRow).join('') || '<div style="padding:16px;color:var(--text2);font-size:0.8rem;text-align:center">暂无历史课程</div>'}
    </div>
    <div class="admin-card">
      <div class="admin-card-title">数据总览</div>
      <div class="admin-stats">
        <div class="admin-stat"><div class="admin-stat-num">${allBookings.length}</div><div class="admin-stat-lbl">总预约</div></div>
        <div class="admin-stat"><div class="admin-stat-num">${conf}</div><div class="admin-stat-lbl">已确认</div></div>
        <div class="admin-stat"><div class="admin-stat-num">${canc}</div><div class="admin-stat-lbl">已取消</div></div>
      </div>
    </div>`;
}

async function adminToggleBooking(id) {
  try {
    const rows = await sbGet(`bookings?id=eq.${id}`);
    const b = rows[0]; if (!b) return;
    if (b.status === 'confirmed' && b.card_type === 'credit' && b.card_id) {
      const cardRows = await sbGet(`course_cards?id=eq.${b.card_id}`);
      if (cardRows.length) {
        await sbPatch('course_cards', `id=eq.${b.card_id}`, { remaining_credits: cardRows[0].remaining_credits + 1 });
      }
    }
    await sbPatch('bookings', `id=eq.${id}`, { status: b.status==='confirmed'?'cancelled':'confirmed' });
    renderAdmin();
  } catch(e) {
    showToast('操作失败，请重试'); console.error(e);
  }
}

async function openCourseBookings(courseId) {
  openModal('coursebookings');
  const el = document.getElementById('modal-coursebookings-body');
  el.innerHTML = '<div style="padding:48px;text-align:center;color:var(--text2)">加载中…</div>';
  try {
    const [c, bookings] = await Promise.all([
      fetchCourse(courseId),
      sbGet(`bookings?course_id=eq.${courseId}&order=created_at.desc&select=*,app_users(name)`)
    ]);
    if (!c) { el.innerHTML = errorHTML('课程不存在'); return; }
    const conf = bookings.filter(b => b.status === 'confirmed').length;
    const rows = bookings.length === 0
      ? '<div style="text-align:center;color:var(--text2);padding:20px;font-size:0.8rem">暂无预约记录</div>'
      : bookings.map(b => {
          const userName = b.app_users?.name || b.user_name || b.phone || '未知';
          const ts = fmtTs(new Date(b.created_at).getTime());
          return `
            <div class="admin-booking-item">
              <div class="admin-booking-info">
                <div class="admin-booking-name">${_esc(userName)} · ${_esc(b.phone||'')}</div>
                <div class="admin-booking-detail">${ts}</div>
              </div>
              <div class="admin-item-actions">
                <span class="status-badge status-${b.status}">${b.status==='confirmed'?'已确认':'已取消'}</span>
                <button class="admin-toggle" onclick="adminToggleCourseBooking('${b.id}','${courseId}')">
                  ${b.status==='confirmed'?'取消':'恢复'}
                </button>
              </div>
            </div>`;
        }).join('');
    el.innerHTML = `
      <div class="modal-body">
        <h3 class="modal-title">${_esc(c.emoji)} ${_esc(c.name)}</h3>
        <div style="color:var(--text2);font-size:0.85rem;margin-bottom:16px">${fmtCourseDate(c.date)} · ${_esc(c.time)} · ${_esc(c.teacher)}</div>
        <div class="admin-stats" style="margin-bottom:16px">
          <div class="admin-stat"><div class="admin-stat-num">${bookings.length}</div><div class="admin-stat-lbl">总预约</div></div>
          <div class="admin-stat"><div class="admin-stat-num">${conf}</div><div class="admin-stat-lbl">已确认</div></div>
          <div class="admin-stat"><div class="admin-stat-num">${bookings.length-conf}</div><div class="admin-stat-lbl">已取消</div></div>
        </div>
        ${rows}
      </div>`;
  } catch(e) {
    el.innerHTML = errorHTML('加载失败，请重试');
    console.error(e);
  }
}

async function adminToggleCourseBooking(id, courseId) {
  try {
    const rows = await sbGet(`bookings?id=eq.${id}`);
    const b = rows[0]; if (!b) return;
    if (b.status === 'confirmed' && b.card_type === 'credit' && b.card_id) {
      const cardRows = await sbGet(`course_cards?id=eq.${b.card_id}`);
      if (cardRows.length) {
        await sbPatch('course_cards', `id=eq.${b.card_id}`, { remaining_credits: cardRows[0].remaining_credits + 1 });
      }
    }
    await sbPatch('bookings', `id=eq.${id}`, { status: b.status==='confirmed'?'cancelled':'confirmed' });
    openCourseBookings(courseId);
    renderAdmin();
  } catch(e) {
    showToast('操作失败，请重试'); console.error(e);
  }
}

// ── Admin: Cards ──
async function renderAdminCardsHTML() {
  const [cards, users] = await Promise.all([fetchCards(), fetchUsers()]);
  const userMap = {};
  users.forEach(u => { userMap[u.phone] = u; });
  const rows = cards.length === 0
    ? '<div style="text-align:center;color:var(--text2);padding:28px;font-size:0.8rem">暂无课卡记录</div>'
    : cards.map(card => {
        const st = getCardStatus(card);
        const u  = userMap[card.phone];
        const displayName = u ? (u.name || u.phone) : card.phone;
        const typeLabel   = card.type === 'period' ? '期限卡' : '次数卡';
        const detail      = card.type === 'period'
          ? `${card.startDate} ~ ${card.endDate}`
          : `${card.remainingCredits}/${card.totalCredits} 次`;
        return `
          <div class="admin-booking-item">
            <div class="admin-booking-info">
              <div class="admin-booking-name">${_esc(displayName)} · ${card.phone}</div>
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
        <span>课卡管理（${cards.length}）</span>
        <button class="btn-add" onclick="openCardModal('')">+ 新建</button>
      </div>
      ${rows}
    </div>`;
}

async function openCardModal(cardId) {
  let card = null, existingUser = null;
  if (cardId) {
    try {
      const rows = await sbGet(`course_cards?id=eq.${cardId}`);
      if (rows.length) { card = rowToCard(rows[0]); existingUser = await fetchUserByPhone(card.phone); }
    } catch(e) { console.error(e); }
  }
  const isPeriod = !card || card.type === 'period';
  document.getElementById('modal-card-body').innerHTML = `
    <div class="modal-body">
      <h3 class="modal-title">${card ? '编辑课卡' : '新建课卡'}</h3>
      <div class="form-group">
        <label class="form-label">用户手机号</label>
        <input id="cd-phone" class="form-input" type="tel" placeholder="请输入手机号"
          value="${card ? card.phone : ''}" ${card ? 'readonly' : ''}
          oninput="lookupUserForCard(this.value)">
        <div id="cd-user-lookup" style="margin-top:6px">
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
      <button class="btn-primary" id="cd-save-btn" onclick="saveCard('${cardId||''}')">保存课卡</button>
    </div>`;
  openModal('card');
}

async function lookupUserForCard(phone) {
  const el = document.getElementById('cd-user-lookup');
  if (!el) return;
  if (!phone || phone.length < 11) { el.innerHTML = ''; return; }
  try {
    const user = await fetchUserByPhone(phone);
    el.innerHTML = user
      ? `<span class="user-found">✓ 用户：${_esc(user.name||user.phone)}</span>`
      : `<span class="user-not-found">该手机号未注册，保存时将自动创建用户账户</span>`;
  } catch(e) { el.innerHTML = ''; }
}

function toggleCardTypeFields() {
  const t = document.getElementById('cd-type').value;
  document.getElementById('cd-period-fields').style.display = t==='period' ? '' : 'none';
  document.getElementById('cd-credit-fields').style.display = t==='credit' ? '' : 'none';
}

async function saveCard(cardId) {
  const phone = document.getElementById('cd-phone').value.trim();
  const type  = document.getElementById('cd-type').value;
  const errEl = document.getElementById('cd-error');
  const btn   = document.getElementById('cd-save-btn');
  if (!phone || !/^1\d{10}$/.test(phone)) { showErr(errEl,'请输入正确的手机号（11位）'); return; }
  if (btn) { btn.disabled = true; btn.textContent = '保存中…'; }
  try {
    let user = await fetchUserByPhone(phone);
    if (!user) {
      const rows = await sbPost('app_users', { phone, name:`用户${phone.slice(-4)}` });
      user = rowToUser(rows[0]);
    }
    let cardData = { user_id: user.id, phone, type };
    if (type === 'period') {
      const start = document.getElementById('cd-start').value;
      const end   = document.getElementById('cd-end').value;
      if (!start||!end) { showErr(errEl,'请填写有效期的开始和结束日期'); if(btn){btn.disabled=false;btn.textContent='保存课卡';} return; }
      if (start > end)  { showErr(errEl,'开始日期不能晚于结束日期'); if(btn){btn.disabled=false;btn.textContent='保存课卡';} return; }
      cardData = {...cardData, start_date:start, end_date:end};
    } else {
      const total     = parseInt(document.getElementById('cd-total').value, 10);
      const remaining = parseInt(document.getElementById('cd-remaining').value, 10);
      if (!total||total<1)               { showErr(errEl,'请输入有效的总次数（≥1）'); if(btn){btn.disabled=false;btn.textContent='保存课卡';} return; }
      if (isNaN(remaining)||remaining<0) { showErr(errEl,'剩余次数不能为负数'); if(btn){btn.disabled=false;btn.textContent='保存课卡';} return; }
      if (remaining > total)             { showErr(errEl,'剩余次数不能大于总次数'); if(btn){btn.disabled=false;btn.textContent='保存课卡';} return; }
      cardData = {...cardData, total_credits:total, remaining_credits:remaining};
    }
    if (cardId) {
      await sbPatch('course_cards', `id=eq.${cardId}`, cardData);
    } else {
      await sbPost('course_cards', cardData);
    }
    closeModal('card');
    renderAdmin();
    showToast(cardId ? '课卡已更新' : '课卡已创建');
  } catch(e) {
    if (btn) { btn.disabled = false; btn.textContent = '保存课卡'; }
    showErr(errEl, '保存失败，请重试');
    console.error(e);
  }
}

async function deleteCard(cardId) {
  if (!confirm('确定要删除该课卡吗？此操作不可撤销。')) return;
  try {
    await sbDelete('course_cards', `id=eq.${cardId}`);
    renderAdmin(); showToast('课卡已删除');
  } catch(e) {
    showToast('删除失败，请重试'); console.error(e);
  }
}

// ── Admin: Users ──
async function renderAdminUsersHTML() {
  const [users, allCards, allBookings] = await Promise.all([
    fetchUsers(),
    fetchCards(),
    sbGet('bookings?select=id,user_id,phone')
  ]);
  const rows = users.map(u => {
    const cardCnt = allCards.filter(c => c.phone === u.phone).length;
    const bkCnt   = allBookings.filter(b => b.user_id===u.id || b.phone===u.phone).length;
    return `
      <div class="admin-booking-item">
        <div class="admin-booking-info">
          <div class="admin-booking-name">${_esc(u.name||'未命名')} · ${u.phone}</div>
          <div class="admin-booking-detail">课卡 ${cardCnt} 张 · 预约 ${bkCnt} 条</div>
        </div>
        <div class="admin-item-actions">
          <button class="admin-toggle" onclick="openEditUserModal('${u.id}','${_esc(u.name||'')}')">编辑</button>
          <button class="admin-toggle admin-toggle-danger" onclick="deleteUser('${u.id}')">删除</button>
        </div>
      </div>`;
  }).join('');
  return `
    <div class="admin-card">
      <div class="admin-card-title">
        <span>用户管理（${users.length}）</span>
        <button class="btn-add" onclick="openCreateUserModal()">+ 创建</button>
      </div>
      ${rows || '<div style="text-align:center;color:var(--text2);padding:20px;font-size:0.8rem">暂无用户</div>'}
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
      <button class="btn-primary" id="mu-save-btn" onclick="saveUserAdmin(null)">创建</button>
    </div>`;
  openModal('user');
}

function openEditUserModal(userId, currentName) {
  document.getElementById('modal-user-body').innerHTML = `
    <div class="modal-body">
      <h3 class="modal-title">编辑用户</h3>
      <div class="form-group"><label class="form-label">姓名</label>
        <input id="mu-name" class="form-input" type="text" value="${_esc(currentName||'')}"></div>
      <div id="mu-error" class="error-msg" style="display:none"></div>
      <button class="btn-primary" id="mu-save-btn" onclick="saveUserAdmin('${userId}')">保存</button>
    </div>`;
  openModal('user');
}

async function saveUserAdmin(userId) {
  const errEl = document.getElementById('mu-error');
  const name  = document.getElementById('mu-name').value.trim();
  const btn   = document.getElementById('mu-save-btn');
  if (btn) { btn.disabled = true; btn.textContent = '保存中…'; }
  try {
    if (userId) {
      await sbPatch('app_users', `id=eq.${userId}`, { name });
      const session = getSession();
      if (session && session.userId === userId) { saveSession({...session, name}); renderHeaderUser(); }
      closeModal('user'); renderAdmin(); showToast('用户信息已更新');
    } else {
      const phone = document.getElementById('mu-phone').value.trim();
      if (!phone || !/^1\d{10}$/.test(phone)) { showErr(errEl,'请输入正确的手机号（11位）'); if(btn){btn.disabled=false;btn.textContent='创建';} return; }
      const existing = await fetchUserByPhone(phone);
      if (existing) { showErr(errEl,'该手机号已注册'); if(btn){btn.disabled=false;btn.textContent='创建';} return; }
      await sbPost('app_users', { phone, name: name || `用户${phone.slice(-4)}` });
      closeModal('user'); renderAdmin(); showToast('用户已创建');
    }
  } catch(e) {
    if (btn) { btn.disabled = false; btn.textContent = userId?'保存':'创建'; }
    showErr(errEl, '操作失败，请重试'); console.error(e);
  }
}

async function deleteUser(userId) {
  try {
    const rows = await sbGet(`app_users?id=eq.${userId}`);
    const u = rows[0]; if (!u) return;
    const [cardRows, bkRows] = await Promise.all([
      sbGet(`course_cards?phone=eq.${encodeURIComponent(u.phone)}&select=id`),
      sbGet(`bookings?user_id=eq.${userId}&select=id`)
    ]);
    if (!confirm(`确定删除用户「${u.name||u.phone}」吗？\n将同时删除 ${cardRows.length} 张课卡和 ${bkRows.length} 条预约记录，此操作不可撤销。`)) return;
    await sbDelete('app_users', `id=eq.${userId}`);
    const session = getSession();
    if (session && session.userId === userId) { clearSession(); renderHeaderUser(); }
    renderAdmin(); showToast('用户已删除');
  } catch(e) {
    showToast('删除失败，请重试'); console.error(e);
  }
}

// ── Admin Auth ──
function adminLogin() {
  const pwd = document.getElementById('admin-pwd').value;
  if (pwd === ADMIN_PASSWORD) {
    adminLoggedIn = true; adminRole = 'admin';
    document.getElementById('admin-pwd').value = '';
    document.getElementById('admin-login-err').style.display = 'none';
    closeModal('adminlogin'); renderAdmin(); showToast('已登录管理员账户');
  } else if (pwd === COACH_PASSWORD) {
    adminLoggedIn = true; adminRole = 'coach';
    document.getElementById('admin-pwd').value = '';
    document.getElementById('admin-login-err').style.display = 'none';
    closeModal('adminlogin'); renderAdmin(); showToast('已登录教练账户');
  } else {
    document.getElementById('admin-login-err').style.display = 'block';
  }
}
function adminLogout() { adminLoggedIn = false; adminRole = 'admin'; renderAdmin(); showToast('已退出'); }

// ===== Modal =====
function openModal(name)  { document.getElementById(`modal-${name}-bg`).classList.add('open'); }
function closeModal(name) { document.getElementById(`modal-${name}-bg`).classList.remove('open'); }

// ===== QR Code =====
function initQRCode() {
  const el = document.getElementById('qr-canvas');
  if (!el || typeof QRCode === 'undefined') return;
  el.innerHTML = '';
  new QRCode(el, {
    text: location.href,
    width: 168,
    height: 168,
    colorDark: '#0d0d0d',
    colorLight: '#f4f2ed'
  });
}

// ===== Init =====
function init() {
  initDateFilter();
  renderHeaderUser();
}
document.addEventListener('DOMContentLoaded', init);
