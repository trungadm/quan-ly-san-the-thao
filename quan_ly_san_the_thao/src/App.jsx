import React from "react";
import { useCallback, useEffect, useState } from 'react';
import {
  Activity, CircleDollarSign, Clock3, LayoutDashboard, MapPin, Pencil, Plus,
  Search, Tags, Trash2, Users, UserRound, X, Check, RefreshCw, Menu
} from 'lucide-react';
import { api } from './api.js';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard },
  { id: 'fields', label: 'Quản lý sân', icon: MapPin },
  { id: 'types', label: 'Loại sân', icon: Tags },
  { id: 'slots', label: 'Khung giờ', icon: Clock3 },
  { id: 'customers', label: 'Khách hàng', icon: Users },
  { id: 'users', label: 'Tài khoản', icon: UserRound },
];

const DATA_KEYS = ['fields', 'types', 'slots', 'customers', 'users'];

const EMPTY = {
  fields: { name: '', typeId: '', location: '', price: '', status: 'Hoạt động' },
  types: { name: '', description: '' },
  slots: { start: '06:00', end: '07:00', price: '' },
  customers: { name: '', phone: '', email: '', address: '' },
  users: { name: '', username: '', role: 'Nhân viên', status: 'Hoạt động' },
};

const PAGE_INFO = {
  fields: { title: 'Quản lý sân', subtitle: 'Theo dõi thông tin và trạng thái các sân thể thao.' },
  types: { title: 'Loại sân', subtitle: 'Quản lý các loại hình sân thể thao.' },
  slots: { title: 'Khung giờ', subtitle: 'Thiết lập khung giờ và giá tham khảo.' },
  customers: { title: 'Khách hàng', subtitle: 'Lưu trữ và quản lý thông tin khách hàng.' },
  users: { title: 'Tài khoản người dùng', subtitle: 'Danh sách tài khoản mẫu của hệ thống.' },
};

function money(value) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(Number(value) || 0);
}

function Badge({ children }) {
  const cls = children === 'Hoạt động' ? 'green' : children === 'Bảo trì' ? 'orange' : 'gray';
  return <span className={`badge ${cls}`}><span className="badge-dot" />{children}</span>;
}

function Modal({ title, onClose, children }) {
  useEffect(() => {
    const onKey = (event) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="modal">
        <div className="modal-heading">
          <div><h2>{title}</h2><p>Nhập thông tin vào biểu mẫu bên dưới.</p></div>
          <button className="icon-button" onClick={onClose} aria-label="Đóng"><X size={19} /></button>
        </div>
        {children}
      </section>
    </div>
  );
}

function FieldForm({ kind, initial, types, existing, onSave, onClose }) {
  const [form, setForm] = useState({ ...EMPTY[kind], ...initial });
  const [error, setError] = useState('');

  const update = (key, value) => setForm((old) => ({ ...old, [key]: value }));

  function submit(event) {
    event.preventDefault();
    const records = existing[kind] || [];
    const normalized = (value) => String(value ?? '').trim().toLocaleLowerCase('vi');
    const duplicate = (key, value) => records.some((record) =>
      record.id !== initial?.id && normalized(record[key]) === normalized(value)
    );

    if (kind === 'fields' && !form.typeId) return setError('Vui lòng chọn loại sân.');
    if (kind === 'slots' && form.start >= form.end) return setError('Giờ kết thúc phải sau giờ bắt đầu.');
    if (kind === 'customers' && !form.phone.trim()) return setError('Vui lòng nhập số điện thoại.');
    if (kind === 'users' && !form.username.trim()) return setError('Vui lòng nhập tên đăng nhập.');
    if (kind === 'types' && duplicate('name', form.name)) return setError('Tên loại sân đã tồn tại.');
    if (kind === 'customers' && duplicate('phone', form.phone)) return setError('Số điện thoại này đã được sử dụng.');
    if (kind === 'users' && duplicate('username', form.username)) return setError('Tên đăng nhập này đã tồn tại.');
    if (kind === 'slots' && records.some((slot) =>
      slot.id !== initial?.id && form.start < slot.end && form.end > slot.start
    )) return setError('Khung giờ bị trùng với một khung giờ đã có.');
    if (['fields', 'slots'].includes(kind) && (!Number.isFinite(Number(form.price)) || Number(form.price) < 0)) {
      return setError('Giá phải là số hợp lệ và không được âm.');
    }

    setError('');
    const cleanForm = Object.fromEntries(
      Object.entries(form).map(([key, value]) => [key, typeof value === 'string' ? value.trim() : value])
    );
    onSave({
      ...cleanForm,
      ...(kind === 'fields' ? { typeId: Number(form.typeId), price: Number(form.price) } : {}),
      ...(kind === 'slots' ? { price: Number(form.price) } : {}),
    });
  }

  const labelMap = {
    fields: { name: 'Tên sân', typeId: 'Loại sân', location: 'Vị trí', price: 'Giá tham khảo (VNĐ/giờ)', status: 'Trạng thái' },
    types: { name: 'Tên loại sân', description: 'Mô tả' },
    slots: { start: 'Giờ bắt đầu', end: 'Giờ kết thúc', price: 'Giá tham khảo (VNĐ)' },
    customers: { name: 'Họ và tên', phone: 'Số điện thoại', email: 'Email', address: 'Địa chỉ' },
    users: { name: 'Tên hiển thị', username: 'Tên đăng nhập', role: 'Vai trò', status: 'Trạng thái' },
  };

  function inputFor(key, value) {
    if (key === 'typeId') return <select value={value} onChange={(e) => update(key, e.target.value)} required><option value="">Chọn loại sân</option>{types.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}</select>;
    if (key === 'status') return <select value={value} onChange={(e) => update(key, e.target.value)}><option>Hoạt động</option><option>Bảo trì</option><option>Ngừng hoạt động</option></select>;
    if (key === 'role') return <select value={value} onChange={(e) => update(key, e.target.value)}><option>Nhân viên</option><option>Quản trị viên</option></select>;
    if (key === 'description' || key === 'address') return <textarea value={value} onChange={(e) => update(key, e.target.value)} rows="3" />;
    if (key === 'start' || key === 'end') return <input type="time" value={value} onChange={(e) => update(key, e.target.value)} required />;
    if (key === 'price') return <input type="number" min="0" value={value} onChange={(e) => update(key, e.target.value)} required />;
    if (key === 'email') return <input type="email" value={value} onChange={(e) => update(key, e.target.value)} placeholder="email@example.com" />;
    return <input value={value} onChange={(e) => update(key, e.target.value)} required={['name', 'username', 'phone', 'location'].includes(key)} />;
  }

  return (
    <Modal title={initial?.id ? 'Cập nhật thông tin' : 'Thêm mới'} onClose={onClose}>
      <form className="form" onSubmit={submit}>
        <div className="form-grid">
          {Object.entries(labelMap[kind]).map(([key, label]) => (
            <label className={['description', 'address'].includes(key) ? 'full' : ''} key={key}>
              <span>{label}</span>{inputFor(key, form[key] ?? '')}
            </label>
          ))}
        </div>
        {error && <p className="form-error">{error}</p>}
        <div className="modal-actions">
          <button type="button" className="button secondary" onClick={onClose}>Hủy</button>
          <button type="submit" className="button primary"><Check size={16} /> Lưu thông tin</button>
        </div>
      </form>
    </Modal>
  );
}

function ConfirmModal({ message, onCancel, onConfirm }) {
  return <Modal title="Xác nhận xóa" onClose={onCancel}><p className="confirm-text">{message}</p><div className="modal-actions"><button className="button secondary" onClick={onCancel}>Hủy</button><button className="button danger" onClick={onConfirm}><Trash2 size={16} /> Xóa dữ liệu</button></div></Modal>;
}

export default function App() {
  const [page, setPage] = useState('dashboard');
  const [data, setData] = useState({ fields: [], types: [], slots: [], customers: [], users: [] });
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState('');
  const [query, setQuery] = useState('');
  const [modal, setModal] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [mobileNav, setMobileNav] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (!toast) return undefined;
    const timeout = window.setTimeout(() => setToast(''), 2600);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const refresh = useCallback(async (message = '') => {
    setDataLoading(true);
    try {
      const entries = await Promise.all(
        DATA_KEYS.map(async (key) => [key, await api.getAll(key)])
      );
      setData(Object.fromEntries(entries));
      setDataError('');
      if (message) setToast(message);
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      setDataError(detail);
      setToast(`Lỗi tải dữ liệu: ${detail}`);
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const currentNav = NAV_ITEMS.find((item) => item.id === page);
  const filtered = (data[page] || []).filter((item) => Object.values(item).some((value) => String(value ?? '').toLowerCase().includes(query.toLowerCase())));
  const typeName = (id) => data.types.find((type) => type.id === Number(id))?.name || 'Chưa phân loại';

  async function saveItem(item) {
    try {
      await api.save(page, item);
      setModal(null);
      await refresh(item.id ? 'Đã cập nhật thông tin.' : 'Đã thêm dữ liệu mới.');
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      setToast(`Lỗi lưu dữ liệu: ${detail}`);
    }
  }

  async function deleteItem() {
    if (!deleteTarget) return;
    // Không cho xóa loại sân đang được sân khác sử dụng.
    if (deleteTarget.key === 'types' && data.fields.some((field) => Number(field.typeId) === Number(deleteTarget.item.id))) {
      setDeleteTarget(null);
      setToast('Không thể xóa loại sân đang được sử dụng.');
      return;
    }

    try {
      await api.remove(deleteTarget.key, deleteTarget.item.id);
      setDeleteTarget(null);
      await refresh('Đã xóa dữ liệu.');
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      setToast(`Lỗi xóa dữ liệu: ${detail}`);
    }
  }

  function renderTable() {
    const rows = filtered;
    if (dataLoading) return <div className="empty"><strong>Đang tải dữ liệu từ máy chủ...</strong></div>;
    if (dataError) return <div className="empty"><strong>Không thể tải dữ liệu</strong><span>{dataError}</span></div>;
    if (!rows.length) return <div className="empty"><Search size={26} /><strong>Không tìm thấy dữ liệu</strong><span>Thử từ khóa khác hoặc thêm dữ liệu mới.</span></div>;

    if (page === 'fields') return <div className="table-wrap"><table><thead><tr><th>Tên sân</th><th>Loại sân</th><th>Vị trí</th><th>Giá tham khảo</th><th>Trạng thái</th><th className="action-col">Thao tác</th></tr></thead><tbody>{rows.map((r) => <tr key={r.id}><td><div className="primary-cell">{r.name}</div><div className="sub-cell">Mã sân: SAN-{String(r.id).padStart(3, '0')}</div></td><td>{typeName(r.typeId)}</td><td><span className="location-cell"><MapPin size={14} />{r.location}</span></td><td className="money">{money(r.price)}<span>/giờ</span></td><td><Badge>{r.status}</Badge></td><td><ActionButtons onEdit={() => setModal({ kind: page, item: r })} onDelete={() => setDeleteTarget({ key: page, item: r })} /></td></tr>)}</tbody></table></div>;

    if (page === 'types') return <div className="table-wrap"><table><thead><tr><th>Loại sân</th><th>Mô tả</th><th>Số sân sử dụng</th><th className="action-col">Thao tác</th></tr></thead><tbody>{rows.map((r) => <tr key={r.id}><td><div className="type-name"><span className="type-icon"><Tags size={17} /></span><span className="primary-cell">{r.name}</span></div></td><td>{r.description || '—'}</td><td>{data.fields.filter((f) => f.typeId === r.id).length} sân</td><td><ActionButtons onEdit={() => setModal({ kind: page, item: r })} onDelete={() => setDeleteTarget({ key: page, item: r })} /></td></tr>)}</tbody></table></div>;

    if (page === 'slots') return <div className="table-wrap"><table><thead><tr><th>Khung giờ</th><th>Thời lượng</th><th>Giá tham khảo</th><th className="action-col">Thao tác</th></tr></thead><tbody>{rows.map((r) => <tr key={r.id}><td><span className="slot-time"><Clock3 size={16} />{r.start} – {r.end}</span></td><td>{duration(r.start, r.end)}</td><td className="money">{money(r.price)}</td><td><ActionButtons onEdit={() => setModal({ kind: page, item: r })} onDelete={() => setDeleteTarget({ key: page, item: r })} /></td></tr>)}</tbody></table></div>;

    if (page === 'customers') return <div className="table-wrap"><table><thead><tr><th>Khách hàng</th><th>Số điện thoại</th><th>Email</th><th>Địa chỉ</th><th className="action-col">Thao tác</th></tr></thead><tbody>{rows.map((r) => <tr key={r.id}><td><div className="customer-cell"><span className="avatar">{r.name.split(' ').map((part) => part[0]).slice(-2).join('').toUpperCase()}</span><div><div className="primary-cell">{r.name}</div><div className="sub-cell">KH-{String(r.id).padStart(3, '0')}</div></div></div></td><td>{r.phone}</td><td>{r.email || '—'}</td><td>{r.address || '—'}</td><td><ActionButtons onEdit={() => setModal({ kind: page, item: r })} onDelete={() => setDeleteTarget({ key: page, item: r })} onView={() => setModal({ kind: page, item: r, view: true })} /></td></tr>)}</tbody></table></div>;

    if (page === 'users') return <div className="table-wrap"><table><thead><tr><th>Người dùng</th><th>Tên đăng nhập</th><th>Vai trò</th><th>Trạng thái</th><th className="action-col">Thao tác</th></tr></thead><tbody>{rows.map((r) => <tr key={r.id}><td><div className="customer-cell"><span className="avatar user-avatar"><UserRound size={17} /></span><div className="primary-cell">{r.name}</div></div></td><td><code>{r.username}</code></td><td><span className="role-tag">{r.role}</span></td><td><Badge>{r.status}</Badge></td><td><ActionButtons onEdit={() => setModal({ kind: page, item: r })} onDelete={() => setDeleteTarget({ key: page, item: r })} /></td></tr>)}</tbody></table></div>;
    return null;
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNav ? 'mobile-open' : ''}`}>
        <div className="brand"><div className="brand-mark"><Activity size={22} /></div><div><strong>Sportiva</strong><span>SPORTS MANAGEMENT</span></div><button className="close-nav" onClick={() => setMobileNav(false)}><X size={18} /></button></div>
        <div className="nav-caption">MENU CHÍNH</div>
        <nav>{NAV_ITEMS.map((item) => { const Icon = item.icon; return <button key={item.id} className={`nav-item ${page === item.id ? 'active' : ''}`} onClick={() => { setPage(item.id); setQuery(''); setMobileNav(false); }}><Icon size={18} /><span>{item.label}</span>{page === item.id && <span className="active-mark" />}</button>; })}</nav>
        <div className="sidebar-bottom"><div className="help-card"><div className="help-icon"><Activity size={18} /></div><strong>Quản lý dễ dàng</strong><p>Quản lý dữ liệu sân thể thao tại một nơi.</p></div><div className="profile"><div className="profile-avatar">QT</div><div className="profile-info"><strong>Quản trị viên</strong><span>Quản lý hệ thống</span></div><span className="online-dot" /></div></div>
      </aside>
      {mobileNav && <div className="nav-overlay" onClick={() => setMobileNav(false)} />}
      <main className="main-area">
        <header className="topbar"><button className="mobile-menu" onClick={() => setMobileNav(true)}><Menu size={21} /></button><div className="breadcrumb">Trang chủ <span>/</span> <strong>{currentNav?.label}</strong></div><div className="topbar-right"><span className="today-label">Hệ thống quản lý sân</span><div className="topbar-avatar">QT</div></div></header>
        <div className="content">
          {page === 'dashboard' ? <Dashboard data={data} setPage={(nextPage) => { setPage(nextPage); setQuery(''); }} /> : <>
            <div className="page-heading"><div><div className="eyebrow">DỮ LIỆU HỆ THỐNG</div><h1>{PAGE_INFO[page]?.title}</h1><p>{PAGE_INFO[page]?.subtitle}</p></div><button className="button primary" onClick={() => setModal({ kind: page, item: null })}><Plus size={17} /> Thêm mới</button></div>
            <div className="toolbar"><div className="search-box"><Search size={18} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={`Tìm kiếm ${page === 'fields' ? 'tên sân, vị trí...' : page === 'types' ? 'loại sân...' : page === 'slots' ? 'khung giờ...' : page === 'customers' ? 'tên, số điện thoại...' : 'tài khoản...'}`} /></div><div className="result-count">Tổng số: <strong>{filtered.length}</strong> bản ghi</div></div>
            <section className="panel"><div className="panel-heading"><div><h2>{page === 'fields' ? 'Danh sách sân thể thao' : PAGE_INFO[page]?.title}</h2><p>Dữ liệu được tải từ cơ sở dữ liệu MySQL.</p></div><button className="icon-button refresh-button" title="Tải lại dữ liệu" onClick={() => refresh()}><RefreshCw size={17} /></button></div>{renderTable()}</section>
            <p className="data-note">Dữ liệu được đồng bộ với cơ sở dữ liệu MySQL.</p>
          </>}
        </div>
      </main>

      {modal && (modal.view ? <Modal title="Thông tin khách hàng" onClose={() => setModal(null)}><div className="detail-list">{[['Họ và tên', modal.item.name], ['Số điện thoại', modal.item.phone], ['Email', modal.item.email || 'Chưa cập nhật'], ['Địa chỉ', modal.item.address || 'Chưa cập nhật'], ['Mã khách hàng', `KH-${String(modal.item.id).padStart(3, '0')}`]].map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div><div className="modal-actions"><button className="button primary" onClick={() => setModal({ kind: 'customers', item: modal.item })}><Pencil size={16} /> Chỉnh sửa</button></div></Modal> : <FieldForm key={`${modal.kind}-${modal.item?.id || 'new'}`} kind={modal.kind} initial={modal.item} types={data.types} existing={data} onSave={saveItem} onClose={() => setModal(null)} />)}
      {deleteTarget && <ConfirmModal message={`Bạn có chắc muốn xóa "${deleteTarget.item.name || deleteTarget.item.username || `${deleteTarget.item.start} – ${deleteTarget.item.end}`}" không? Thao tác này không thể hoàn tác.`} onCancel={() => setDeleteTarget(null)} onConfirm={deleteItem} />}
      {toast && <div className="toast"><Check size={17} />{toast}</div>}
    </div>
  );
}

function ActionButtons({ onEdit, onDelete, onView }) {
  return <div className="row-actions">{onView && <button className="action-btn view" title="Xem chi tiết" onClick={onView}><Search size={16} /></button>}<button className="action-btn edit" title="Sửa" onClick={onEdit}><Pencil size={16} /></button><button className="action-btn delete" title="Xóa" onClick={onDelete}><Trash2 size={16} /></button></div>;
}

function duration(start, end) {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  const mins = eh * 60 + em - (sh * 60 + sm);
  if (mins <= 0) return 'Không hợp lệ';
  return mins % 60 === 0 ? `${mins / 60} giờ` : `${Math.floor(mins / 60)} giờ ${mins % 60} phút`;
}

function Dashboard({ data, setPage }) {
  const activeFields = data.fields.filter((field) => field.status === 'Hoạt động').length;
  const stats = [
    { title: 'Tổng số sân', value: data.fields.length, note: `${activeFields} sân đang hoạt động`, icon: MapPin, className: 'blue' },
    { title: 'Loại sân', value: data.types.length, note: 'Loại hình thể thao', icon: Tags, className: 'purple' },
    { title: 'Khách hàng', value: data.customers.length, note: 'Hồ sơ khách hàng', icon: Users, className: 'green' },
    { title: 'Khung giờ', value: data.slots.length, note: 'Khung giờ đã thiết lập', icon: Clock3, className: 'orange' },
  ];
  return <><div className="welcome"><div><div className="eyebrow">BẢNG ĐIỀU KHIỂN</div><h1>Tổng quan hệ thống</h1><p>Xin chào! Đây là tình hình dữ liệu sân thể thao của bạn.</p></div><div className="welcome-art"><Activity size={58} strokeWidth={1.3} /></div></div><div className="stats-grid">{stats.map((stat) => { const Icon = stat.icon; return <div className="stat-card" key={stat.title}><div className={`stat-icon ${stat.className}`}><Icon size={21} /></div><span className="stat-title">{stat.title}</span><strong className="stat-value">{stat.value}</strong><span className="stat-note">{stat.note}</span></div>; })}</div><div className="dashboard-grid"><section className="panel quick-panel"><div className="panel-heading"><div><h2>Truy cập nhanh</h2><p>Chọn chức năng bạn muốn quản lý.</p></div></div><div className="quick-links">{NAV_ITEMS.filter((item) => item.id !== 'dashboard').map((item) => { const Icon = item.icon; return <button key={item.id} className="quick-link" onClick={() => setPage(item.id)}><span className="quick-icon"><Icon size={19} /></span><span>{item.label}</span><span className="quick-arrow">↗</span></button>; })}</div></section><section className="panel status-panel"><div className="panel-heading"><div><h2>Tình trạng sân</h2><p>Thống kê theo trạng thái hiện tại.</p></div></div><div className="status-summary"><div className="status-number"><span className="status-bullet green-bullet" /><span>Hoạt động</span><strong>{activeFields}</strong></div><div className="progress"><span style={{ width: `${data.fields.length ? activeFields / data.fields.length * 100 : 0}%` }} /></div><div className="status-number"><span className="status-bullet orange-bullet" /><span>Bảo trì</span><strong>{data.fields.filter((field) => field.status === 'Bảo trì').length}</strong></div><div className="status-number"><span className="status-bullet gray-bullet" /><span>Ngừng hoạt động</span><strong>{data.fields.filter((field) => field.status === 'Ngừng hoạt động').length}</strong></div></div><button className="text-link" onClick={() => setPage('fields')}>Xem danh sách sân <span>→</span></button></section></div><div className="demo-note"><CircleDollarSign size={18} /><div><strong>Kết nối dữ liệu</strong><p>Toàn bộ danh sách sân, loại sân, khung giờ, khách hàng và tài khoản được tải từ MySQL.</p></div></div></>;
}
