import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Banknote,
  Bell,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Filter,
  Menu,
  MoreVertical,
  Plus,
  RefreshCcw,
  Search,
  Settings,
  ShieldCheck,
  Store,
  UserRound,
  UsersRound,
  X,
} from 'lucide-react';
import './styles.css';

const bookingsStorageKey = 'domino-booking-planner-bookings-v1';
const today = parseDate('2026-05-05');
const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const seedBookings = [];

function App() {
  const [bookings, setBookings] = useState(loadBookings);
  const [visibleMonth, setVisibleMonth] = useState(today.getMonth());
  const [visibleYear, setVisibleYear] = useState(today.getFullYear());
  const [selectedId, setSelectedId] = useState(bookings[0]?.id || null);
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(defaultForm());
  const [activeView, setActiveView] = useState('Party Planner');
  const [showMonthList, setShowMonthList] = useState(false);

  useEffect(() => {
    localStorage.setItem(bookingsStorageKey, JSON.stringify(bookings));
  }, [bookings]);

  const selected = bookings.find((booking) => booking.id === selectedId) || bookings[0];
  const visibleBookings = bookings.filter((booking) => {
    const date = parseDate(booking.date);
    return date.getMonth() === visibleMonth && date.getFullYear() === visibleYear;
  });
  const filteredBookings = bookings.filter((booking) => statusFilter === 'All Statuses' || booking.status === statusFilter || booking.paymentStatus === statusFilter || booking.releaseStatus === statusFilter);
  const customerRows = useMemo(() => buildCustomers(bookings), [bookings]);
  const stats = buildStats(bookings, visibleMonth, visibleYear);

  function changeMonth(direction) {
    const next = new Date(visibleYear, visibleMonth + direction, 1);
    setVisibleMonth(next.getMonth());
    setVisibleYear(next.getFullYear());
  }

  function updateBooking(id, patch) {
    setBookings((items) => items.map((booking) => (booking.id === id ? { ...booking, ...patch } : booking)));
  }

  function submitBooking(event) {
    event.preventDefault();
    const next = {
      id: Math.max(0, ...bookings.map((booking) => booking.id)) + 1,
      ...form,
      guests: Number(form.guests),
      deposit: Number(form.deposit),
      status: form.paymentStatus === 'Hold authorised' ? 'Confirmed' : 'Pending',
      releaseStatus: 'Not released',
      createdBy: 'Sharon Bull',
      createdAt: '05/05/2026 16:10',
    };
    setBookings((items) => [next, ...items]);
    setSelectedId(next.id);
    setShowForm(false);
    setForm(defaultForm());
  }

  return (
    <div className="app-shell">
      <Sidebar activeView={activeView} onNavigate={setActiveView} />
      <main className="main">
        <Topbar title={activeView} bookings={bookings} onAdd={() => setShowForm(true)} />
        <section className="content">
          {activeView === 'Party Planner' && (
            <>
              <Stats stats={stats} onOpenStatus={(status) => {
                if (status === 'This Month') {
                  setShowMonthList(true);
                  return;
                }
                setStatusFilter(status);
                setShowMonthList(false);
                setActiveView(status === 'All Statuses' ? 'Party Planner' : 'Payments');
              }} />
              {showMonthList && <MonthBookingsList bookings={visibleBookings} month={visibleMonth} year={visibleYear} onClose={() => setShowMonthList(false)} onSelect={setSelectedId} />}
              <div className="workspace-grid">
                <CalendarPanel
                  bookings={visibleBookings}
                  month={visibleMonth}
                  year={visibleYear}
                  selectedId={selected?.id}
                  onSelect={setSelectedId}
                  onPrev={() => changeMonth(-1)}
                  onNext={() => changeMonth(1)}
                  onToday={() => {
                    setVisibleMonth(today.getMonth());
                    setVisibleYear(today.getFullYear());
                  }}
                />
                <DetailPanel booking={selected} onUpdate={updateBooking} />
              </div>
              <QueuePanel bookings={filteredBookings} statusFilter={statusFilter} setStatusFilter={setStatusFilter} onSelect={setSelectedId} onUpdate={updateBooking} />
            </>
          )}
          {activeView === 'Payments' && <PaymentsView bookings={bookings} statusFilter={statusFilter} setStatusFilter={setStatusFilter} onSelect={setSelectedId} onUpdate={updateBooking} />}
          {activeView === 'Customers' && <CustomersView customers={customerRows} />}
          {activeView === 'Settings' && <SettingsView />}
        </section>
      </main>
      {showForm && <BookingModal form={form} setForm={setForm} onClose={() => setShowForm(false)} onSubmit={submitBooking} />}
    </div>
  );
}

function Sidebar({ activeView, onNavigate }) {
  const nav = [
    [UsersRound, 'Party Planner'],
    [CreditCard, 'Payments'],
    [UserRound, 'Customers'],
    [Settings, 'Settings'],
  ];

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark"><Store size={22} /></div>
        <span>The Domino Booking Planner</span>
      </div>
      <nav className="nav-list" aria-label="Main navigation">
        {nav.map(([Icon, label]) => (
          <button className={`nav-item ${activeView === label ? 'active' : ''}`} key={label} onClick={() => onNavigate(label)}>
            <Icon size={18} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}

function Topbar({ title, bookings, onAdd }) {
  const [showNotifications, setShowNotifications] = useState(false);
  const notifications = buildNotifications(bookings);

  return (
    <header className="topbar">
      <div className="page-title">
        <button className="icon-button"><Menu size={19} /></button>
        <div>
          <h1>{title}</h1>
          <p>Calendar, event details, deposits, card holds and refunds</p>
        </div>
      </div>
      <div className="topbar-actions">
        <label className="search"><Search size={17} /><input placeholder="Search bookings..." /></label>
        <div className="notification-wrap">
          <button className="icon-button alert" aria-label="Notifications" onClick={() => setShowNotifications((open) => !open)}>
            <Bell size={19} />
            {notifications.length > 0 && <b>{notifications.length}</b>}
          </button>
          {showNotifications && (
            <div className="notification-menu">
              <strong>Notifications</strong>
              {notifications.map((item) => (
                <div className="notification-item" key={item.title}>
                  <span>{item.title}</span>
                  <small>{item.detail}</small>
                </div>
              ))}
              {notifications.length === 0 && <p>Nothing needs attention.</p>}
            </div>
          )}
        </div>
        <button className="primary" onClick={onAdd}><Plus size={18} /> Add Booking</button>
      </div>
    </header>
  );
}

function Stats({ stats, onOpenStatus }) {
  return (
    <section className="stats-row" aria-label="Booking summary">
      <Stat icon={CalendarDays} value={stats.monthBookings} label="Bookings This Month" onClick={() => onOpenStatus('This Month')} />
      <Stat icon={Banknote} value={formatMoney(stats.depositsHeld)} label="Deposits Held" onClick={() => onOpenStatus('Captured')} />
      <Stat icon={CreditCard} value={formatMoney(stats.cardHolds)} label="Card Holds" onClick={() => onOpenStatus('Hold authorised')} />
      <Stat icon={RefreshCcw} value={formatMoney(stats.refundsDue)} label="Refunds Due" tone="danger" onClick={() => onOpenStatus('Refund due')} />
    </section>
  );
}

function Stat({ icon: Icon, value, label, tone = 'normal', onClick }) {
  return (
    <button className={`stat ${tone}`} onClick={onClick}>
      <span className="stat-icon"><Icon size={23} /></span>
      <div>
        <strong>{value}</strong>
        <small>{label}</small>
      </div>
    </button>
  );
}

function MonthBookingsList({ bookings, month, year, onClose, onSelect }) {
  return (
    <section className="panel month-list">
      <div className="panel-title">
        <h2>{monthNames[month]} {year} Bookings <span>{bookings.length}</span></h2>
        <button className="icon-button" onClick={onClose} aria-label="Close month bookings"><X size={18} /></button>
      </div>
      {bookings.length > 0 ? (
        <div className="month-bookings">
          {bookings.map((booking) => (
            <button key={booking.id} onClick={() => onSelect(booking.id)}>
              <strong>{booking.eventName}</strong>
              <span>{formatDisplayDate(booking.date)} · {booking.start} - {booking.end} · {booking.customerName}</span>
              <StatusPill value={booking.status} />
            </button>
          ))}
        </div>
      ) : (
        <div className="empty-list">
          <CalendarDays size={26} />
          <strong>No bookings this month</strong>
          <span>Add a booking and it will appear in this list.</span>
        </div>
      )}
    </section>
  );
}

function CalendarPanel({ bookings, month, year, selectedId, onSelect, onPrev, onNext, onToday }) {
  const days = getCalendarDays(year, month);

  return (
    <section className="panel calendar-panel">
      <div className="panel-title">
        <div className="month-switch">
          <button onClick={onPrev} aria-label="Previous month"><ChevronLeft size={18} /></button>
          <strong>{monthNames[month]} {year}</strong>
          <button onClick={onNext} aria-label="Next month"><ChevronRight size={18} /></button>
        </div>
        <button className="secondary" onClick={onToday}>Today</button>
      </div>
      <div className="calendar-grid">
        {weekdays.map((day) => <div className="day-head" key={day}>{day}</div>)}
        {days.map((day) => {
          const dayBookings = bookings.filter((booking) => booking.date === day.iso);
          return (
            <button className={`calendar-cell ${day.muted ? 'muted' : ''} ${isSameDate(parseDate(day.iso), today) ? 'today' : ''}`} key={day.iso}>
              <span className="cell-date">{day.date.getDate()}</span>
              <span className="cell-events">
                {dayBookings.map((booking) => (
                  <span
                    className={`calendar-event ${slug(booking.status)} ${booking.id === selectedId ? 'selected' : ''}`}
                    key={booking.id}
                    onClick={(event) => {
                      event.stopPropagation();
                      onSelect(booking.id);
                    }}
                  >
                    {booking.eventName}
                  </span>
                ))}
              </span>
            </button>
          );
        })}
      </div>
      <div className="legend">
        <span><i className="dot confirmed" /> Confirmed</span>
        <span><i className="dot pending" /> Pending</span>
        <span><i className="dot hold" /> Hold authorised</span>
        <span><i className="dot refund" /> Refund due</span>
        <span><i className="dot released" /> Released</span>
      </div>
    </section>
  );
}

function DetailPanel({ booking, onUpdate }) {
  const [activeTab, setActiveTab] = useState('Details');

  if (!booking) {
    return (
      <aside className="panel detail-panel empty-state">
        <ShieldCheck size={36} />
        <strong>No booking selected</strong>
        <span>Add or choose a private party to see event and payment details.</span>
      </aside>
    );
  }

  return (
    <aside className="panel detail-panel">
      <div className="detail-heading">
        <div>
          <h2><i className={`dot ${slug(booking.status)}`} /> {booking.eventName}</h2>
          <StatusPill value={booking.status} />
        </div>
        <button className="icon-button" aria-label="Close detail"><X size={18} /></button>
      </div>
      <div className="tabs">
        {['Details', 'Payments', 'Notes', 'History'].map((tab) => (
          <button className={activeTab === tab ? 'active' : ''} key={tab} onClick={() => setActiveTab(tab)}>{tab}</button>
        ))}
      </div>
      {activeTab === 'Details' && <Details booking={booking} />}
      {activeTab === 'Payments' && <Payments booking={booking} />}
      {activeTab === 'Notes' && <Notes booking={booking} />}
      {activeTab === 'History' && <History booking={booking} />}
      <div className="detail-actions">
        <button className="secondary" onClick={() => onUpdate(booking.id, { status: 'Confirmed' })}><Check size={16} /> Approve</button>
        <button className="dark" onClick={() => onUpdate(booking.id, { paymentStatus: 'Captured', releaseStatus: 'Refund due', status: 'Refund due' })}><CreditCard size={16} /> Capture</button>
        <button className="danger" onClick={() => onUpdate(booking.id, { releaseStatus: 'Released', status: 'Confirmed' })}><RefreshCcw size={16} /> Release / Refund</button>
      </div>
    </aside>
  );
}

function Details({ booking }) {
  const fields = [
    ['Customer Name', booking.customerName],
    ['Event Name', booking.eventName],
    ['Email', booking.email],
    ['Space / Area', booking.area],
    ['Phone', booking.phone],
    ['Deposit / Hold Amount', formatMoney(booking.deposit)],
    ['Date', formatDisplayDate(booking.date)],
    ['Card Hold / Payment Status', booking.paymentStatus],
    ['Time', `${booking.start} - ${booking.end}`],
    ['Refund / Release Status', booking.releaseStatus],
    ['Party Size', `${booking.guests} guests`],
    ['Created', `${booking.createdAt} by ${booking.createdBy}`],
  ];

  return (
    <div className="detail-grid">
      {fields.map(([label, value]) => (
        <label key={label}>
          <span>{label}</span>
          <output>{value}</output>
        </label>
      ))}
    </div>
  );
}

function Payments({ booking }) {
  return (
    <div className="payment-stack">
      <div className="payment-card">
        <CreditCard size={22} />
        <div>
          <strong>{formatMoney(booking.deposit)}</strong>
          <span>{booking.paymentStatus}</span>
        </div>
      </div>
      <p>This screen is recording the payment status only. Real card holds need Stripe connected: the customer enters their card in Stripe, Stripe authorises the hold, then this app can capture it or release/refund it.</p>
    </div>
  );
}

function Notes({ booking }) {
  return <div className="notes-box">{booking.notes}</div>;
}

function History({ booking }) {
  return (
    <div className="history-list">
      <span><Check size={15} /> Booking created by {booking.createdBy}</span>
      <span><CreditCard size={15} /> Payment status set to {booking.paymentStatus}</span>
      <span><RefreshCcw size={15} /> Release status: {booking.releaseStatus}</span>
    </div>
  );
}

function QueuePanel({ bookings, statusFilter, setStatusFilter, onSelect, onUpdate }) {
  return (
    <section className="panel queue-panel">
      <div className="panel-title">
        <h2>Bookings & Payment Queue <span>{bookings.length}</span></h2>
        <div className="panel-actions">
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            {['All Statuses', 'Confirmed', 'Pending', 'Refund due', 'Hold authorised', 'Captured', 'Released'].map((status) => <option key={status}>{status}</option>)}
          </select>
          <button className="secondary"><Filter size={15} /> Filter</button>
        </div>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Event</th>
              <th>Customer</th>
              <th>Time</th>
              <th>Guests</th>
              <th>Status</th>
              <th>Deposit / Hold</th>
              <th>Card Hold / Payment</th>
              <th>Refund / Release</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((booking) => (
              <tr key={booking.id} onClick={() => onSelect(booking.id)}>
                <td>{formatDisplayDate(booking.date)}</td>
                <td><strong>{booking.eventName}</strong></td>
                <td>{booking.customerName}</td>
                <td>{booking.start} - {booking.end}</td>
                <td>{booking.guests}</td>
                <td><StatusPill value={booking.status} /></td>
                <td>{formatMoney(booking.deposit)}</td>
                <td><StatusPill value={booking.paymentStatus} /></td>
                <td><StatusPill value={booking.releaseStatus} /></td>
                <td>
                  <div className="row-actions">
                    <button aria-label="Approve" onClick={(event) => { event.stopPropagation(); onUpdate(booking.id, { status: 'Confirmed', paymentStatus: 'Hold authorised' }); }}><Check size={15} /></button>
                    <button aria-label="Capture" onClick={(event) => { event.stopPropagation(); onUpdate(booking.id, { paymentStatus: 'Captured', releaseStatus: 'Refund due', status: 'Refund due' }); }}><CreditCard size={15} /></button>
                    <button aria-label="Release or refund" onClick={(event) => { event.stopPropagation(); onUpdate(booking.id, { releaseStatus: 'Released', status: 'Confirmed' }); }}><RefreshCcw size={15} /></button>
                    <button aria-label="More"><MoreVertical size={15} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <footer className="table-footer">Showing {bookings.length} bookings</footer>
    </section>
  );
}

function PaymentsView({ bookings, statusFilter, setStatusFilter, onSelect, onUpdate }) {
  const paymentRows = bookings.filter((booking) => {
    const isPaymentRow = ['Pending', 'Hold authorised', 'Captured'].includes(booking.paymentStatus) || booking.releaseStatus === 'Refund due';
    const matchesFilter = statusFilter === 'All Statuses' || booking.paymentStatus === statusFilter || booking.releaseStatus === statusFilter || booking.status === statusFilter;
    return isPaymentRow && matchesFilter;
  });

  return (
    <section className="panel queue-panel">
      <div className="panel-title">
        <h2>Payments <span>{paymentRows.length}</span></h2>
        <div className="panel-actions">
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            {['All Statuses', 'Pending', 'Hold authorised', 'Captured', 'Refund due', 'Released'].map((status) => <option key={status}>{status}</option>)}
          </select>
        </div>
      </div>
      <div className="payment-guide">
        <div>
          <strong>What happens to the card payment?</strong>
          <p>At the moment these buttons only update the booking record. To take real money, we connect Stripe so the customer pays through a secure Stripe checkout page.</p>
        </div>
        <div>
          <strong>Card hold flow</strong>
          <p>Stripe authorises the deposit on the customer card. If the party is fine, you release it. If you need to keep it, you capture it. If already captured, you refund it.</p>
        </div>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Event</th>
              <th>Customer</th>
              <th>Date</th>
              <th>Deposit / Hold</th>
              <th>Card Hold / Payment</th>
              <th>Refund / Release</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paymentRows.map((booking) => (
              <tr key={booking.id} onClick={() => onSelect(booking.id)}>
                <td><strong>{booking.eventName}</strong></td>
                <td>{booking.customerName}</td>
                <td>{formatDisplayDate(booking.date)}</td>
                <td>{formatMoney(booking.deposit)}</td>
                <td><StatusPill value={booking.paymentStatus} /></td>
                <td><StatusPill value={booking.releaseStatus} /></td>
                <td>
                  <div className="row-actions text-actions">
                    <button onClick={(event) => { event.stopPropagation(); onUpdate(booking.id, { paymentStatus: 'Hold authorised', status: 'Confirmed' }); }}>Mark Hold</button>
                    <button onClick={(event) => { event.stopPropagation(); onUpdate(booking.id, { paymentStatus: 'Captured', releaseStatus: 'Refund due', status: 'Refund due' }); }}>Capture</button>
                    <button onClick={(event) => { event.stopPropagation(); onUpdate(booking.id, { releaseStatus: 'Released', status: 'Confirmed' }); }}>Release</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function CustomersView({ customers }) {
  return (
    <section className="panel queue-panel">
      <div className="panel-title">
        <h2>Customers <span>{customers.length}</span></h2>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Bookings</th>
              <th>Last Event</th>
              <th>Total Deposits</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr key={customer.name}>
                <td><strong>{customer.name}</strong></td>
                <td>{customer.email}</td>
                <td>{customer.phone}</td>
                <td>{customer.bookings}</td>
                <td>{customer.lastEvent}</td>
                <td>{formatMoney(customer.totalDeposits)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ReportsView({ stats, bookings }) {
  const confirmed = bookings.filter((booking) => booking.status === 'Confirmed').length;
  const pending = bookings.filter((booking) => booking.status === 'Pending').length;

  return (
    <section className="report-grid">
      <Stats stats={stats} />
      <div className="panel report-panel">
        <h2>Booking Snapshot</h2>
        <dl>
          <div><dt>Confirmed parties</dt><dd>{confirmed}</dd></div>
          <div><dt>Pending parties</dt><dd>{pending}</dd></div>
          <div><dt>Deposits captured</dt><dd>{formatMoney(stats.depositsHeld)}</dd></div>
          <div><dt>Refunds due</dt><dd>{formatMoney(stats.refundsDue)}</dd></div>
        </dl>
      </div>
    </section>
  );
}

function SettingsView() {
  return (
    <section className="panel settings-panel">
      <div className="panel-title">
        <h2>Settings</h2>
      </div>
      <div className="settings-list">
        <label>
          <span>Default deposit / hold amount</span>
          <input value="£100" readOnly />
        </label>
        <label>
          <span>Payment provider</span>
          <input value="Stripe not connected yet" readOnly />
        </label>
        <label>
          <span>Booking storage</span>
          <input value="This browser only until database is added" readOnly />
        </label>
      </div>
    </section>
  );
}

function BookingModal({ form, setForm, onClose, onSubmit }) {
  function setField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  return (
    <div className="modal-backdrop">
      <form className="modal" onSubmit={onSubmit}>
        <header>
          <h2>Add private party</h2>
          <button type="button" onClick={onClose}><X size={18} /></button>
        </header>
        <div className="field-grid">
          <Field label="Customer name" value={form.customerName} onChange={(value) => setField('customerName', value)} />
          <Field label="Event name" value={form.eventName} onChange={(value) => setField('eventName', value)} />
          <Field label="Email" type="email" value={form.email} onChange={(value) => setField('email', value)} />
          <Field label="Phone" value={form.phone} onChange={(value) => setField('phone', value)} />
          <Field label="Date" type="date" value={form.date} onChange={(value) => setField('date', value)} />
          <label>
            <span>Space / Area</span>
            <select value={form.area} onChange={(event) => setField('area', event.target.value)}>
              {['Function Room', 'Dining Snug', 'Back Bar', 'Garden Room', 'Whole Pub'].map((area) => <option key={area}>{area}</option>)}
            </select>
          </label>
          <Field label="Start time" type="time" value={form.start} onChange={(value) => setField('start', value)} />
          <Field label="End time" type="time" value={form.end} onChange={(value) => setField('end', value)} />
          <Field label="Party size" type="number" min="1" value={form.guests} onChange={(value) => setField('guests', value)} />
          <Field label="Deposit / hold (£)" type="number" min="0" value={form.deposit} onChange={(value) => setField('deposit', value)} />
          <label>
            <span>Card hold / payment</span>
            <select value={form.paymentStatus} onChange={(event) => setField('paymentStatus', event.target.value)}>
              {['Pending', 'Hold authorised', 'Captured'].map((status) => <option key={status}>{status}</option>)}
            </select>
          </label>
          <label className="wide">
            <span>Notes</span>
            <textarea value={form.notes} onChange={(event) => setField('notes', event.target.value)} />
          </label>
        </div>
        <footer>
          <button type="button" className="secondary" onClick={onClose}>Cancel</button>
          <button className="primary" type="submit"><ShieldCheck size={17} /> Save Booking</button>
        </footer>
      </form>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', ...rest }) {
  return (
    <label>
      <span>{label}</span>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} {...rest} />
    </label>
  );
}

function StatusPill({ value }) {
  return <span className={`status-pill ${slug(value)}`}>{value}</span>;
}

function defaultForm() {
  return {
    date: '2026-05-30',
    eventName: 'Private party',
    customerName: '',
    email: '',
    phone: '',
    area: 'Function Room',
    start: '18:00',
    end: '23:00',
    guests: 20,
    deposit: 100,
    paymentStatus: 'Pending',
    notes: '',
  };
}

function loadBookings() {
  try {
    const stored = JSON.parse(localStorage.getItem(bookingsStorageKey));
    return Array.isArray(stored) && stored.length ? stored : seedBookings;
  } catch {
    return seedBookings;
  }
}

function buildStats(bookings, month, year) {
  const monthBookings = bookings.filter((booking) => {
    const date = parseDate(booking.date);
    return date.getMonth() === month && date.getFullYear() === year;
  });
  return {
    monthBookings: monthBookings.length,
    depositsHeld: bookings.filter((booking) => booking.paymentStatus === 'Captured').reduce((sum, booking) => sum + booking.deposit, 0),
    cardHolds: bookings.filter((booking) => booking.paymentStatus === 'Hold authorised').reduce((sum, booking) => sum + booking.deposit, 0),
    refundsDue: bookings.filter((booking) => booking.releaseStatus === 'Refund due').reduce((sum, booking) => sum + booking.deposit, 0),
  };
}

function buildCustomers(bookings) {
  const customers = new Map();

  bookings.forEach((booking) => {
    const current = customers.get(booking.customerName) || {
      name: booking.customerName,
      email: booking.email,
      phone: booking.phone,
      bookings: 0,
      lastEvent: booking.eventName,
      totalDeposits: 0,
    };
    current.bookings += 1;
    current.lastEvent = booking.eventName;
    current.totalDeposits += booking.deposit;
    customers.set(booking.customerName, current);
  });

  return Array.from(customers.values());
}

function buildNotifications(bookings) {
  const pending = bookings.filter((booking) => booking.status === 'Pending').length;
  const refundsDue = bookings.filter((booking) => booking.releaseStatus === 'Refund due').length;
  const holdsOpen = bookings.filter((booking) => booking.paymentStatus === 'Hold authorised' && booking.releaseStatus !== 'Released').length;
  const notifications = [];

  if (pending) {
    notifications.push({ title: `${pending} pending booking${pending === 1 ? '' : 's'}`, detail: 'Review and approve the party details.' });
  }
  if (refundsDue) {
    notifications.push({ title: `${refundsDue} refund due`, detail: 'Release or refund the deposit after checks.' });
  }
  if (holdsOpen) {
    notifications.push({ title: `${holdsOpen} card hold to review`, detail: 'Capture only if you need to keep the deposit.' });
  }

  return notifications;
}

function getCalendarDays(year, month) {
  const first = new Date(year, month, 1);
  const offset = (first.getDay() + 6) % 7;
  const start = new Date(year, month, 1 - offset);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return { date, iso: isoDate(date), muted: date.getMonth() !== month };
  });
}

function parseDate(value) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function isoDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function formatDisplayDate(value) {
  const date = parseDate(value);
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatMoney(value) {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(value);
}

function isSameDate(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function slug(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

createRoot(document.getElementById('root')).render(<App />);
