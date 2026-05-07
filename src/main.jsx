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

const bookingsStorageKey = 'domino-booking-planner-bookings-v2';
const today = parseDate('2026-05-05');
const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const seedBookings = [];
const defaultSquareCheckoutUrl = 'https://square.link/u/uS1Gm7Gx';

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
  const [showBookingDetails, setShowBookingDetails] = useState(false);

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

  function openBooking(id) {
    setSelectedId(id);
    setActiveView('Party Planner');
    setShowMonthList(false);
    setShowBookingDetails(true);
  }

  function submitBooking(event) {
    event.preventDefault();
    const next = {
      id: Math.max(0, ...bookings.map((booking) => booking.id)) + 1,
      ...form,
      deposit: Number(form.deposit),
      status: form.paymentStatus === 'Paid in Square' ? 'Confirmed' : 'Pending',
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
        <Topbar
          title={activeView}
          bookings={bookings}
          onAdd={() => setShowForm(true)}
          onOpenNotification={(status) => {
            setStatusFilter(status);
            setActiveView(status === 'Pending' ? 'Party Planner' : 'Payments');
          }}
        />
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
              {showMonthList && <MonthBookingsList bookings={visibleBookings} month={visibleMonth} year={visibleYear} onClose={() => setShowMonthList(false)} onSelect={openBooking} />}
              <div className="workspace-grid">
                <CalendarPanel
                  bookings={visibleBookings}
                  month={visibleMonth}
                  year={visibleYear}
                  selectedId={selected?.id}
                  onSelect={openBooking}
                  onPrev={() => changeMonth(-1)}
                  onNext={() => changeMonth(1)}
                  onToday={() => {
                    setVisibleMonth(today.getMonth());
                    setVisibleYear(today.getFullYear());
                  }}
                />
                <DetailPanel booking={selected} onUpdate={updateBooking} onClose={() => setSelectedId(null)} />
              </div>
              <QueuePanel bookings={filteredBookings} statusFilter={statusFilter} setStatusFilter={setStatusFilter} onSelect={openBooking} onUpdate={updateBooking} />
            </>
          )}
          {activeView === 'Payments' && <PaymentsView bookings={bookings} statusFilter={statusFilter} setStatusFilter={setStatusFilter} onSelect={openBooking} onUpdate={updateBooking} />}
          {activeView === 'Customers' && <CustomersView customers={customerRows} bookings={bookings} onSelectBooking={openBooking} />}
          {activeView === 'Settings' && <SettingsView onClearBookings={() => {
            setBookings([]);
            setSelectedId(null);
            localStorage.removeItem(bookingsStorageKey);
          }} />}
        </section>
      </main>
      {showForm && <BookingModal form={form} setForm={setForm} onClose={() => setShowForm(false)} onSubmit={submitBooking} />}
      {showBookingDetails && selected && (
        <BookingDetailsModal
          booking={selected}
          onClose={() => setShowBookingDetails(false)}
          onUpdate={updateBooking}
        />
      )}
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

function Topbar({ title, bookings, onAdd, onOpenNotification }) {
  const [showNotifications, setShowNotifications] = useState(false);
  const notifications = buildNotifications(bookings);

  return (
    <header className="topbar">
      <div className="page-title">
        <button className="icon-button"><Menu size={19} /></button>
        <div>
          <h1>{title}</h1>
          <p>Calendar, event details, Square deposits and refunds</p>
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
                <button
                  className="notification-item"
                  key={item.title}
                  onClick={() => {
                    onOpenNotification(item.status);
                    setShowNotifications(false);
                  }}
                >
                  <span>{item.title}</span>
                  <small>{item.detail}</small>
                </button>
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
      <Stat icon={Banknote} value={formatMoney(stats.depositsHeld)} label="Square Deposits Paid" onClick={() => onOpenStatus('Paid in Square')} />
      <Stat icon={CreditCard} value={formatMoney(stats.cardHolds)} label="Deposits To Take" onClick={() => onOpenStatus('Pending')} />
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
            <div
              className={`calendar-cell ${day.muted ? 'muted' : ''} ${isSameDate(parseDate(day.iso), today) ? 'today' : ''}`}
              key={day.iso}
              onClick={() => {
                if (dayBookings.length === 1) {
                  onSelect(dayBookings[0].id);
                }
              }}
            >
              <span className="cell-date">{day.date.getDate()}</span>
              <span className="cell-events">
                {dayBookings.map((booking) => (
                  <button
                    type="button"
                    className={`calendar-event ${slug(booking.status)} ${booking.id === selectedId ? 'selected' : ''}`}
                    key={booking.id}
                    onClick={(event) => {
                      event.stopPropagation();
                      onSelect(booking.id);
                    }}
                  >
                    {booking.eventName}
                  </button>
                ))}
              </span>
            </div>
          );
        })}
      </div>
      <div className="legend">
        <span><i className="dot confirmed" /> Confirmed</span>
        <span><i className="dot pending" /> Pending</span>
        <span><i className="dot hold" /> Paid in Square</span>
        <span><i className="dot refund" /> Refund due</span>
        <span><i className="dot released" /> Refunded</span>
      </div>
    </section>
  );
}

function DetailPanel({ booking, onUpdate, onClose }) {
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
        <button className="icon-button" aria-label="Close detail" onClick={onClose}><X size={18} /></button>
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
        <button className="dark" onClick={() => onUpdate(booking.id, { paymentStatus: 'Paid in Square', status: 'Confirmed' })}><CreditCard size={16} /> Mark Square Paid</button>
        <button className="danger" onClick={() => onUpdate(booking.id, { releaseStatus: 'Refunded', status: 'Confirmed' })}><RefreshCcw size={16} /> Refund Done</button>
      </div>
    </aside>
  );
}

function BookingDetailsModal({ booking, onClose, onUpdate }) {
  return (
    <div className="modal-backdrop booking-detail-backdrop" onClick={onClose}>
      <div className="booking-detail-modal" onClick={(event) => event.stopPropagation()}>
        <DetailPanel booking={booking} onUpdate={onUpdate} onClose={onClose} />
      </div>
    </div>
  );
}

function Details({ booking }) {
  const fields = [
    ['Customer Name', booking.customerName],
    ['Event Name', booking.eventName],
    ['Email', booking.email],
    ['Phone', booking.phone],
    ['Deposit / Hold Amount', formatMoney(booking.deposit)],
    ['Square Checkout Link', booking.squareCheckoutUrl ? 'Added' : 'Not added'],
    ['Square Receipt / Payment Ref', booking.squareReference || 'Not added'],
    ['Date', formatDisplayDate(booking.date)],
    ['Square Payment Status', booking.paymentStatus],
    ['Time', `${booking.start} - ${booking.end}`],
    ['Refund Status', booking.releaseStatus],
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
  const checkoutUrl = booking.squareCheckoutUrl || defaultSquareCheckoutUrl;

  return (
    <div className="payment-stack">
      <div className="payment-card">
        <CreditCard size={22} />
        <div>
          <strong>{formatMoney(booking.deposit)}</strong>
          <span>{booking.paymentStatus}</span>
        </div>
      </div>
      <a className="primary payment-open-link" href={checkoutUrl} target="_blank" rel="noreferrer">Open Square Payment</a>
      <p>This screen records what you do in Square. Square is not connected yet, so take or refund the deposit in Square first, then mark it here.</p>
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
      <span><RefreshCcw size={15} /> Refund status: {booking.releaseStatus}</span>
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
            {['All Statuses', 'Confirmed', 'Pending', 'Refund due', 'Paid in Square', 'Refunded'].map((status) => <option key={status}>{status}</option>)}
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
              <th>Status</th>
              <th>Deposit / Hold</th>
              <th>Square Ref</th>
              <th>Square Payment</th>
              <th>Refund</th>
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
                <td><StatusPill value={booking.status} /></td>
                <td>{formatMoney(booking.deposit)}</td>
                <td>{booking.squareReference || 'Not added'}</td>
                <td><StatusPill value={booking.paymentStatus} /></td>
                <td><StatusPill value={booking.releaseStatus} /></td>
                <td>
                  <div className="row-actions">
                    <button aria-label="View booking" onClick={(event) => { event.stopPropagation(); onSelect(booking.id); }}>View</button>
                    <a className="table-link" href={booking.squareCheckoutUrl || defaultSquareCheckoutUrl} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()}>Pay Link</a>
                    <button aria-label="Approve" onClick={(event) => { event.stopPropagation(); onUpdate(booking.id, { status: 'Confirmed' }); }}><Check size={15} /></button>
                    <button aria-label="Mark Square paid" onClick={(event) => { event.stopPropagation(); onUpdate(booking.id, { paymentStatus: 'Paid in Square', status: 'Confirmed' }); }}><CreditCard size={15} /></button>
                    <button aria-label="Mark refunded" onClick={(event) => { event.stopPropagation(); onUpdate(booking.id, { releaseStatus: 'Refunded', status: 'Confirmed' }); }}><RefreshCcw size={15} /></button>
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
    const isPaymentRow = ['Pending', 'Paid in Square'].includes(booking.paymentStatus) || ['Refund due', 'Refunded'].includes(booking.releaseStatus);
    const matchesFilter = statusFilter === 'All Statuses' || booking.paymentStatus === statusFilter || booking.releaseStatus === statusFilter || booking.status === statusFilter;
    return isPaymentRow && matchesFilter;
  });

  return (
    <section className="panel queue-panel">
      <div className="panel-title">
        <h2>Payments <span>{paymentRows.length}</span></h2>
        <div className="panel-actions">
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            {['All Statuses', 'Pending', 'Paid in Square', 'Refund due', 'Refunded'].map((status) => <option key={status}>{status}</option>)}
          </select>
        </div>
      </div>
      <div className="payment-guide">
        <div>
          <strong>What happens to the card payment?</strong>
          <p>At the moment these buttons only update the booking record. Take the deposit or refund in Square first, then use the buttons here to keep the planner up to date.</p>
        </div>
        <div>
          <strong>Square connection later</strong>
          <p>When connected, the planner can send the customer to Square checkout, save the Square payment ID, and mark payments/refunds automatically.</p>
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
              <th>Square Ref</th>
              <th>Square Payment</th>
              <th>Refund</th>
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
                <td>{booking.squareReference || 'Not added'}</td>
                <td><StatusPill value={booking.paymentStatus} /></td>
                <td><StatusPill value={booking.releaseStatus} /></td>
                <td>
                  <div className="row-actions text-actions">
                    <button onClick={(event) => { event.stopPropagation(); onSelect(booking.id); }}>View</button>
                    <a className="table-link" href={booking.squareCheckoutUrl || defaultSquareCheckoutUrl} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()}>Open Link</a>
                    <button onClick={(event) => { event.stopPropagation(); onUpdate(booking.id, { paymentStatus: 'Paid in Square', status: 'Confirmed' }); }}>Square Paid</button>
                    <button onClick={(event) => { event.stopPropagation(); onUpdate(booking.id, { releaseStatus: 'Refund due', status: 'Refund due' }); }}>Refund Due</button>
                    <button onClick={(event) => { event.stopPropagation(); onUpdate(booking.id, { releaseStatus: 'Refunded', status: 'Confirmed' }); }}>Refund Done</button>
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

function CustomersView({ customers, bookings, onSelectBooking }) {
  const [selectedCustomer, setSelectedCustomer] = useState(customers[0]?.name || '');
  const customerBookings = bookings.filter((booking) => booking.customerName === selectedCustomer);

  return (
    <div className="customers-layout">
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
                <tr className={selectedCustomer === customer.name ? 'selected-row' : ''} key={customer.name} onClick={() => setSelectedCustomer(customer.name)}>
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
      <div className="panel customer-bookings">
        <div className="panel-title">
          <h2>{selectedCustomer || 'Customer'} Bookings <span>{customerBookings.length}</span></h2>
        </div>
        {customerBookings.length > 0 ? (
          <div className="month-bookings">
            {customerBookings.map((booking) => (
              <button key={booking.id} onClick={() => onSelectBooking(booking.id)}>
                <strong>{booking.eventName}</strong>
                <span>{formatDisplayDate(booking.date)} · {booking.start} - {booking.end}</span>
                <StatusPill value={booking.status} />
              </button>
            ))}
          </div>
        ) : (
          <div className="empty-list">
            <UserRound size={26} />
            <strong>No customer selected</strong>
            <span>Click a customer to see their bookings.</span>
          </div>
        )}
      </div>
    </div>
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
          <div><dt>Square deposits paid</dt><dd>{formatMoney(stats.depositsHeld)}</dd></div>
          <div><dt>Refunds due</dt><dd>{formatMoney(stats.refundsDue)}</dd></div>
        </dl>
      </div>
    </section>
  );
}

function SettingsView({ onClearBookings }) {
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
          <input value="Square not connected yet" readOnly />
        </label>
        <label>
          <span>Booking storage</span>
          <input value="This browser only until database is added" readOnly />
        </label>
        <button className="danger settings-action" type="button" onClick={onClearBookings}>Clear All Saved Bookings</button>
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
          <Field label="Start time" type="time" value={form.start} onChange={(value) => setField('start', value)} />
          <Field label="End time" type="time" value={form.end} onChange={(value) => setField('end', value)} />
          <Field label="Deposit / hold (£)" type="number" min="0" value={form.deposit} onChange={(value) => setField('deposit', value)} />
          <Field label="Square checkout link" type="url" value={form.squareCheckoutUrl} onChange={(value) => setField('squareCheckoutUrl', value)} />
          <div className="payment-link-row">
            <span>Take payment</span>
            <a className="primary" href={form.squareCheckoutUrl || defaultSquareCheckoutUrl} target="_blank" rel="noreferrer">Open Square Payment</a>
          </div>
          <Field label="Square receipt / payment ref" value={form.squareReference} onChange={(value) => setField('squareReference', value)} />
          <label>
            <span>Square payment</span>
            <select value={form.paymentStatus} onChange={(event) => setField('paymentStatus', event.target.value)}>
              {['Pending', 'Paid in Square'].map((status) => <option key={status}>{status}</option>)}
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
    start: '18:00',
    end: '23:00',
    deposit: 100,
    squareCheckoutUrl: defaultSquareCheckoutUrl,
    squareReference: '',
    paymentStatus: 'Pending',
    notes: '',
  };
}

function loadBookings() {
  try {
    localStorage.removeItem('domino-booking-planner-bookings-v1');
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
    depositsHeld: bookings.filter((booking) => booking.paymentStatus === 'Paid in Square').reduce((sum, booking) => sum + booking.deposit, 0),
    cardHolds: bookings.filter((booking) => booking.paymentStatus === 'Pending').reduce((sum, booking) => sum + booking.deposit, 0),
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
  const holdsOpen = bookings.filter((booking) => booking.paymentStatus === 'Pending').length;
  const notifications = [];

  if (pending) {
    notifications.push({ title: `${pending} pending booking${pending === 1 ? '' : 's'}`, detail: 'Review and approve the party details.', status: 'Pending' });
  }
  if (refundsDue) {
    notifications.push({ title: `${refundsDue} refund due`, detail: 'Refund the deposit in Square, then mark it done here.', status: 'Refund due' });
  }
  if (holdsOpen) {
    notifications.push({ title: `${holdsOpen} deposit to take`, detail: 'Take the deposit in Square, then mark it paid here.', status: 'Pending' });
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
