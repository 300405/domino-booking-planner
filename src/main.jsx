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
  LayoutDashboard,
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

const seedBookings = [
  {
    id: 1,
    date: '2026-05-08',
    eventName: 'Lewis birthday',
    customerName: 'Lewis Clarke',
    email: 'lewis.clarke@example.com',
    phone: '07712 345678',
    area: 'Function Room',
    start: '19:00',
    end: '23:00',
    guests: 28,
    deposit: 150,
    status: 'Confirmed',
    paymentStatus: 'Hold authorised',
    releaseStatus: 'Released',
    createdBy: 'Sharon Bull',
    createdAt: '05/05/2026 12:18',
    notes: 'Birthday decorations allowed from 17:00. Pre-order required for food.',
  },
  {
    id: 2,
    date: '2026-05-10',
    eventName: 'Anniversary meal',
    customerName: 'Sarah & Mark Davies',
    email: 'sarah.davies@example.com',
    phone: '07902 112233',
    area: 'Dining Snug',
    start: '18:30',
    end: '22:30',
    guests: 18,
    deposit: 100,
    status: 'Confirmed',
    paymentStatus: 'Hold authorised',
    releaseStatus: 'Released',
    createdBy: 'Paul Brown',
    createdAt: '04/05/2026 15:40',
    notes: 'Quiet table plan. Sparkling wine on arrival.',
  },
  {
    id: 3,
    date: '2026-05-14',
    eventName: 'Quiz night hire',
    customerName: 'Tom Reynolds',
    email: 'tom.reynolds@example.com',
    phone: '07881 340900',
    area: 'Back Bar',
    start: '19:00',
    end: '22:30',
    guests: 40,
    deposit: 100,
    status: 'Confirmed',
    paymentStatus: 'Hold authorised',
    releaseStatus: 'Not released',
    createdBy: 'Sharon Bull',
    createdAt: '03/05/2026 10:05',
    notes: 'Microphone and screen needed. Bar tab paid separately.',
  },
  {
    id: 4,
    date: '2026-05-17',
    eventName: 'Engagement party',
    customerName: 'Emily Watson',
    email: 'emily.watson@example.com',
    phone: '07798 551200',
    area: 'Function Room',
    start: '17:00',
    end: '23:00',
    guests: 30,
    deposit: 150,
    status: 'Pending',
    paymentStatus: 'Pending',
    releaseStatus: 'Not released',
    createdBy: 'Paul Brown',
    createdAt: '05/05/2026 09:27',
    notes: 'Awaiting final guest count and card authorisation.',
  },
  {
    id: 5,
    date: '2026-05-26',
    eventName: 'Half term hire',
    customerName: 'Lucy Bennett',
    email: 'lucy.bennett@example.com',
    phone: '07776 661809',
    area: 'Garden Room',
    start: '12:00',
    end: '16:00',
    guests: 25,
    deposit: 100,
    status: 'Refund due',
    paymentStatus: 'Captured',
    releaseStatus: 'Refund due',
    createdBy: 'Sharon Bull',
    createdAt: '02/05/2026 13:11',
    notes: 'Deposit captured after damage check. Refund now due.',
  },
];

function App() {
  const [bookings, setBookings] = useState(loadBookings);
  const [visibleMonth, setVisibleMonth] = useState(today.getMonth());
  const [visibleYear, setVisibleYear] = useState(today.getFullYear());
  const [selectedId, setSelectedId] = useState(bookings[0]?.id || null);
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(defaultForm());

  useEffect(() => {
    localStorage.setItem(bookingsStorageKey, JSON.stringify(bookings));
  }, [bookings]);

  const selected = bookings.find((booking) => booking.id === selectedId) || bookings[0];
  const visibleBookings = bookings.filter((booking) => {
    const date = parseDate(booking.date);
    return date.getMonth() === visibleMonth && date.getFullYear() === visibleYear;
  });
  const filteredBookings = bookings.filter((booking) => statusFilter === 'All Statuses' || booking.status === statusFilter || booking.paymentStatus === statusFilter || booking.releaseStatus === statusFilter);
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
      <Sidebar />
      <main className="main">
        <Topbar onAdd={() => setShowForm(true)} />
        <section className="content">
          <Stats stats={stats} />
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
        </section>
      </main>
      {showForm && <BookingModal form={form} setForm={setForm} onClose={() => setShowForm(false)} onSubmit={submitBooking} />}
    </div>
  );
}

function Sidebar() {
  const nav = [
    [LayoutDashboard, 'Dashboard'],
    [UsersRound, 'Party Planner', true],
    [CalendarDays, 'Calendar'],
    [CreditCard, 'Payments'],
    [UserRound, 'Customers'],
    [Banknote, 'Reports'],
    [Settings, 'Settings'],
  ];

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark"><Store size={22} /></div>
        <span>The Domino Booking Planner</span>
      </div>
      <nav className="nav-list" aria-label="Main navigation">
        {nav.map(([Icon, label, active]) => (
          <button className={`nav-item ${active ? 'active' : ''}`} key={label}>
            <Icon size={18} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}

function Topbar({ onAdd }) {
  return (
    <header className="topbar">
      <div className="page-title">
        <button className="icon-button"><Menu size={19} /></button>
        <div>
          <h1>The Domino Booking Planner</h1>
          <p>Calendar, event details, deposits, card holds and refunds</p>
        </div>
      </div>
      <div className="topbar-actions">
        <label className="search"><Search size={17} /><input placeholder="Search bookings..." /></label>
        <button className="icon-button alert" aria-label="Notifications"><Bell size={19} /><b>3</b></button>
        <button className="primary" onClick={onAdd}><Plus size={18} /> Add Booking</button>
      </div>
    </header>
  );
}

function Stats({ stats }) {
  return (
    <section className="stats-row" aria-label="Booking summary">
      <Stat icon={CalendarDays} value={stats.monthBookings} label="Bookings This Month" />
      <Stat icon={Banknote} value={formatMoney(stats.depositsHeld)} label="Deposits Held" />
      <Stat icon={CreditCard} value={formatMoney(stats.cardHolds)} label="Card Holds" />
      <Stat icon={RefreshCcw} value={formatMoney(stats.refundsDue)} label="Refunds Due" tone="danger" />
    </section>
  );
}

function Stat({ icon: Icon, value, label, tone = 'normal' }) {
  return (
    <div className={`stat ${tone}`}>
      <span className="stat-icon"><Icon size={23} /></span>
      <div>
        <strong>{value}</strong>
        <small>{label}</small>
      </div>
    </div>
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
      <p>Stripe setup: create a Checkout Session or PaymentIntent with manual capture for an authorised card hold. Release by cancelling the uncaptured PaymentIntent, or refund after capture.</p>
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
