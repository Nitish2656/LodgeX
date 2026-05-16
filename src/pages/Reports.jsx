import { useState, useEffect } from 'react';
import { FileText, Download, Calendar, BarChart2, Users, CreditCard, Zap, Receipt, FileSpreadsheet, Printer } from 'lucide-react';
import { useStore } from '../data/store';
import Modal from '../components/Modal';
import './Pages.css';

const reportTypes = [
  { id: 1, title: 'Tenant Summary Report', desc: 'All active and archived tenants with payment history', icon: Users, color: '#8b5cf6' },
  { id: 2, title: 'Payment Collection Report', desc: 'Detailed transaction logs for the entire rental period', icon: CreditCard, color: '#34d399' },
  { id: 3, title: 'Pending Dues Report', desc: 'Detailed list of outstanding payments with tenant contacts', icon: BarChart2, color: '#fb923c' }
];

export default function ReportsPage() {
  const { tenants, payments, rooms, pageAction, setPageAction } = useStore();

  const [selectedReport, setSelectedReport] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const openDownloadModal = (report) => {
    setSelectedReport(report);
    setShowModal(true);
  };

  const getReportData = (reportId) => {
    switch(reportId) {
        case 1: // Tenant Summary
            return {
                headers: ['Name', 'Phone', 'Room', 'Rent', 'Deposit', 'Pending Dues'],
                rows: tenants.map(t => [t.name, t.phone, t.roomNumber || '-', t.rent || 0, t.deposit || 0, t.pendingDues || 0])
            };
        case 2: // Payment Collection
            return {
                headers: ['Date', 'Tenant', 'Room', 'Amount Paid', 'Method'],
                rows: payments.map(p => {
                    const t = tenants.find(t => (t._id || t.id) === p.tenantId);
                    const name = p.tenantName || t?.name || '-';
                    const room = p.roomNumber || t?.roomNumber || '-';
                    return [new Date(p.date).toLocaleString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }), name, room, p.paidAmount, p.method];
                })
            };
        case 3: // Pending Dues
            const withDues = tenants.filter(t => (t.pendingDues || 0) > 0);
            return {
                headers: ['Tenant Name', 'Room', 'Contact', 'Pending Amount'],
                rows: withDues.map(t => [t.name, t.roomNumber || '-', t.phone, t.pendingDues])
            };
        default:
            return { headers: [], rows: [] };
    }
  };

  const downloadCSV = () => {
    if (!selectedReport) return;
    const data = getReportData(selectedReport.id);
    let csvContent = data.headers.join(',') + '\n';
    data.rows.forEach(row => {
        csvContent += row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',') + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `${selectedReport.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowModal(false);
  };

  const downloadPDF = () => {
    // In a real app we'd use jspdf. For now, trigger browser print of a styled hidden element or just print page
    alert(`This will open the browser print dialog to save as PDF for ${selectedReport.title}`);
    window.print();
    setShowModal(false);
  };

  return (
    <div className="page">
      <div className="page-header animate-in">
        <div>
          <h1 className="page-title">Reports</h1>
          <p className="page-subtitle">Generate and download business reports</p>
        </div>
      </div>

      <div className="reports-grid">
        {reportTypes.map((r, idx) => {
          const Icon = r.icon;
          return (
            <div key={r.id} className={`report-card animate-in stagger-${(idx % 8) + 1}`}>
              <div className="report-card-icon" style={{ background: `${r.color}15`, color: r.color }}>
                <Icon size={24} />
              </div>
              <div className="report-card-info">
                <h3>{r.title}</h3>
                <p>{r.desc}</p>
              </div>
              <button className="report-generate-btn" onClick={() => openDownloadModal(r)}>
                <Download size={16} />
                Generate
              </button>
            </div>
          );
        })}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={`Generate ${selectedReport?.title}`} maxWidth="450px">
        <div style={{ color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: '1.6', fontSize: '14px' }}>
            Choose your preferred export format. **CSV** is perfect for data analysis in Excel, while **PDF** is optimized for printing and formal documentation.
        </div>
        <div style={{ display: 'flex', gap: '14px', flexDirection: 'column' }}>
            <button className="btn btn-primary" onClick={downloadCSV} style={{ display: 'flex', justifyContent: 'center', padding: '14px', gap: '12px', borderRadius: '14px' }}>
                <FileSpreadsheet size={20} />
                <span style={{ fontWeight: 700 }}>Download Excel (CSV)</span>
            </button>
            <button className="btn btn-ghost" onClick={downloadPDF} style={{ display: 'flex', justifyContent: 'center', padding: '14px', gap: '12px', border: '1px solid var(--border-primary)', borderRadius: '14px', color: 'var(--text-primary)' }}>
                <Printer size={20} />
                <span style={{ fontWeight: 600 }}>Print / Save as PDF</span>
            </button>
        </div>
      </Modal>
    </div>
  );
}
