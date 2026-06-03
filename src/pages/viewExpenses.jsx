import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getItemWithExpiry } from './loginPage';
import '../styles/viewExpenses.css';
import { BASE_API_URL } from '../config';

export default function ViewExpenses() {
  const navigate = useNavigate();
  const [data, setData] = useState({ expenses: [], account_balance: {}, total_credit: 0, total_debit: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showAddForm, setShowAddForm] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [showInitModal, setShowInitModal] = useState(false);
  const [initData, setInitData] = useState({
    ippb_balance: 0,
    sbi_balance: 0,
    cash_balance: 0,
    password: ''
  });
  const [initError, setInitError] = useState(null);
  const [isInitializing, setIsInitializing] = useState(false);

  const [formData, setFormData] = useState({
    type: 'debit',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toISOString().split('T')[1].substring(0, 5),
    mode: 'upi',
    bucket_name: 'sbi',
    amount: '',
    purpose: ''
  });
  const [formError, setFormError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchExpenses = async () => {
    setLoading(true);
    const token = getItemWithExpiry('authToken');
    if (!token) {
      localStorage.clear();
      navigate('/login');
      return;
    }

    try {
      const response = await fetch(`${BASE_API_URL}/expenses/view-expenses`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 401 || response.status === 403) {
        localStorage.clear();
        navigate('/login');
        return;
      }

      const result = await response.json();
      if (response.ok && result.success) {
        setData(result.data);
      } else {
        setError(result.message || 'SYS_ERR: DATA CORRUPTION');
      }
    } catch (err) {
      setError('SYS_ERR: NETWORK OFFLINE');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [navigate]);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    // Validations based on conditional rules
    if (formData.mode === 'cash' && formData.bucket_name !== 'cash') {
      setFormError("SYS_ERR: IF MODE IS CASH, BUCKET MUST BE CASH");
      return;
    }
    if (formData.mode === 'card') {
      if (formData.bucket_name !== 'sbi') {
        setFormError("SYS_ERR: IF MODE IS CARD, BUCKET MUST BE SBI");
        return;
      }
      if (formData.type !== 'debit') {
        setFormError("SYS_ERR: IF MODE IS CARD, TYPE MUST BE DEBIT");
        return;
      }
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setFormError("SYS_ERR: AMOUNT MUST BE GREATER THAN 0");
      return;
    }
    if (!formData.purpose || formData.purpose.length > 200) {
      setFormError("SYS_ERR: PURPOSE REQUIRED (MAX 200 CHARS)");
      return;
    }

    setIsSubmitting(true);
    const token = getItemWithExpiry('authToken');
    
    try {
      const response = await fetch(`${BASE_API_URL}/expenses/add-expense`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount)
        })
      });
      
      const result = await response.json();
      if (response.ok) {
        setShowAddForm(false);
        // Reset form to defaults
        setFormData({
          type: 'debit',
          date: new Date().toISOString().split('T')[0],
          time: new Date().toISOString().split('T')[1].substring(0, 5),
          mode: 'upi',
          bucket_name: 'sbi',
          amount: '',
          purpose: ''
        });
        fetchExpenses();
      } else {
        setFormError(result.message || 'SYS_ERR: FAILED TO ADD EXPENSE');
      }
    } catch (err) {
      setFormError('SYS_ERR: NETWORK OFFLINE');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInitialize = async (e) => {
    e.preventDefault();
    setInitError(null);
    setIsInitializing(true);
    
    const token = getItemWithExpiry('authToken');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const response = await fetch(`${BASE_API_URL}/expenses/initialize-account-balance`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ippb_balance: parseFloat(initData.ippb_balance),
          sbi_balance: parseFloat(initData.sbi_balance),
          cash_balance: parseFloat(initData.cash_balance),
          password: initData.password
        })
      });

      if (response.status === 401 || response.status === 403) {
        localStorage.clear();
        navigate('/login');
        return;
      }

      const result = await response.json();
      if (response.ok) {
        setShowInitModal(false);
        setInitData({ ippb_balance: 0, sbi_balance: 0, cash_balance: 0, password: '' });
        fetchExpenses();
      } else {
        setInitError(result.message || 'SYS_ERR: FAILED TO INITIALIZE');
      }
    } catch (err) {
      setInitError('SYS_ERR: NETWORK OFFLINE');
    } finally {
      setIsInitializing(false);
    }
  };

  return (
    <div className="brutal-exp-body">
      <div className="brutal-exp-container">
        <div style={{ marginBottom: '20px' }}>
          <button className="brutal-nav-btn" onClick={() => navigate('/')}>
            &lt; BACK_TO_DASHBOARD
          </button>
        </div>
        <header className="brutal-exp-header">
          <h1>EXPENSES__</h1>
          <div style={{ display: 'flex', gap: '10px', position: 'relative' }}>
            {showMore && (
              <div style={{ position: 'absolute', top: '-45px', right: '0', display: 'flex', gap: '5px' }}>
                <button className="brutal-action-btn" style={{ padding: '5px 10px', fontSize: '1rem', backgroundColor: '#ffff00', color: '#000' }} onClick={() => { setShowInitModal(true); setShowMore(false); }}>INITIALIZE</button>
                <button className="brutal-action-btn" style={{ padding: '5px 10px', fontSize: '1rem' }} disabled>RESET</button>
                <button className="brutal-action-btn" style={{ padding: '5px 10px', fontSize: '1rem' }} disabled>LOGS</button>
              </div>
            )}
            <button className="brutal-action-btn" style={{ padding: '10px', fontSize: '1.2rem' }} onClick={() => setShowMore(!showMore)}>
              MORE_
            </button>
            <button className="brutal-action-btn" style={{ padding: '10px 20px', fontSize: '1.2rem' }} onClick={() => setShowAddForm(!showAddForm)}>
              {showAddForm ? 'CANCEL_' : 'ADD_EXPENSE'}
            </button>
          </div>
        </header>

        {showAddForm && (
          <div className="brutal-add-form">
            <h2>NEW_TRANSACTION_</h2>
            {formError && <div className="brutal-alert error" style={{ padding: '15px', border: '4px solid #000', marginBottom: '20px', background: '#ff0000', color: '#fff', fontWeight: 'bold' }}>{formError}</div>}
            
            <form onSubmit={handleAddSubmit}>
              <div className="brutal-form-grid">
                <div className="brutal-input-group">
                  <label className="brutal-label">TYPE</label>
                  <select className="brutal-input" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                    <option value="debit">DEBIT</option>
                    <option value="credit">CREDIT</option>
                  </select>
                </div>
                <div className="brutal-input-group">
                  <label className="brutal-label">DATE</label>
                  <input type="date" className="brutal-input" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required />
                </div>
                <div className="brutal-input-group">
                  <label className="brutal-label">TIME</label>
                  <input type="time" className="brutal-input" value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} required />
                </div>
                <div className="brutal-input-group">
                  <label className="brutal-label">MODE</label>
                  <select className="brutal-input" value={formData.mode} onChange={e => setFormData({...formData, mode: e.target.value})}>
                    <option value="upi">UPI</option>
                    <option value="bank_transaction">BANK_TXN</option>
                    <option value="cash">CASH</option>
                    <option value="card">CARD</option>
                  </select>
                </div>
                <div className="brutal-input-group">
                  <label className="brutal-label">BUCKET</label>
                  <select className="brutal-input" value={formData.bucket_name} onChange={e => setFormData({...formData, bucket_name: e.target.value})}>
                    <option value="sbi">SBI</option>
                    <option value="cash">CASH</option>
                    <option value="ippb">IPPB</option>
                  </select>
                </div>
                <div className="brutal-input-group">
                  <label className="brutal-label">AMOUNT</label>
                  <input type="number" step="0.01" className="brutal-input" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} required />
                </div>
              </div>
              <div className="brutal-input-group">
                <label className="brutal-label">PURPOSE</label>
                <input type="text" className="brutal-input" value={formData.purpose} onChange={e => setFormData({...formData, purpose: e.target.value})} maxLength={200} required />
              </div>
              <button type="submit" className="brutal-button" disabled={isSubmitting}>
                {isSubmitting ? 'PROCESSING...' : 'SUBMIT_TXN'}
              </button>
            </form>
          </div>
        )}

        {error && (
          <div className="brutal-alert error" style={{ padding: '15px', border: '4px solid #000', marginBottom: '20px', background: '#ff0000', color: '#fff', fontWeight: 'bold' }}>
            {error}
          </div>
        )}

        {loading ? (
          <div className="brutal-alert" style={{ padding: '15px', border: '4px solid #000', marginBottom: '20px', fontWeight: 'bold' }}>
            FETCHING RECORDS...
          </div>
        ) : (
          <>
            <div className="brutal-grid-3">
              <div className="brutal-card">
                <h2>TOT_DEBIT</h2>
                <div className="brutal-val text-red">-{data.total_debit.toFixed(2)}</div>
              </div>
              <div className="brutal-card">
                <h2>TOT_CREDIT</h2>
                <div className="brutal-val text-green">+{data.total_credit.toFixed(2)}</div>
              </div>
              <div className="brutal-card">
                <h2>BALANCES</h2>
                <div className="brutal-subval">IPPB: {data.account_balance.ippb ?? 0}</div>
                <div className="brutal-subval">SBI: {data.account_balance.sbi ?? 0}</div>
                <div className="brutal-subval">CASH: {data.account_balance.cash ?? 0}</div>
              </div>
            </div>

            <h2 className="brutal-section-title">TRANSACTIONS_</h2>
            
            <div className="brutal-table-wrapper">
              <table className="brutal-table">
                <thead>
                  <tr>
                    <th>DATE/TIME</th>
                    <th>PURPOSE</th>
                    <th>MODE</th>
                    <th>BUCKET</th>
                    <th>TYPE</th>
                    <th>AMOUNT</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {data.expenses.map((exp, idx) => (
                    <tr key={idx} className={exp.type === 'debit' ? 'row-debit' : 'row-credit'}>
                      <td style={{ color: '#000' }}>{exp.date} <br /><small>{exp.time}</small></td>
                      <td style={{ color: '#000' }}>{exp.purpose}</td>
                      <td style={{ color: '#000' }}>{exp.mode}</td>
                      <td style={{ color: '#000' }}>{exp.bucket_name}</td>
                      <td>{exp.type.toUpperCase()}</td>
                      <td className="brutal-amount">
                        {exp.type === 'debit' ? '-' : '+'}{parseFloat(exp.amount).toFixed(2)}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button className="brutal-3dot-btn" title="Options">⋮</button>
                      </td>
                    </tr>
                  ))}
                  {data.expenses.length === 0 && (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', color: '#000' }}>NO RECORDS FOUND</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {showInitModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(255,255,255,0.7)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div className="brutal-exp-container" style={{ width: '100%', maxWidth: '500px', backgroundColor: '#ffffff', padding: '30px', margin: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '4px solid #000000', marginBottom: '20px', paddingBottom: '10px' }}>
              <h2 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 900 }}>INITIALIZE_BALANCES_</h2>
              <button className="brutal-action-btn" style={{ padding: '5px 10px', fontSize: '1.2rem' }} onClick={() => setShowInitModal(false)}>X</button>
            </div>
            
            {initError && <div className="brutal-alert error" style={{ padding: '15px', border: '4px solid #000', marginBottom: '20px', background: '#ff0000', color: '#fff', fontWeight: 'bold' }}>{initError}</div>}
            
            <form onSubmit={handleInitialize}>
              <div className="brutal-input-group">
                <label className="brutal-label">IPPB BALANCE</label>
                <input type="number" step="0.01" min="0" className="brutal-input" value={initData.ippb_balance} onChange={e => setInitData({...initData, ippb_balance: e.target.value})} required />
              </div>
              <div className="brutal-input-group">
                <label className="brutal-label">SBI BALANCE</label>
                <input type="number" step="0.01" min="0" className="brutal-input" value={initData.sbi_balance} onChange={e => setInitData({...initData, sbi_balance: e.target.value})} required />
              </div>
              <div className="brutal-input-group">
                <label className="brutal-label">CASH BALANCE</label>
                <input type="number" step="0.01" min="0" className="brutal-input" value={initData.cash_balance} onChange={e => setInitData({...initData, cash_balance: e.target.value})} required />
              </div>
              <div className="brutal-input-group">
                <label className="brutal-label">PASSWORD</label>
                <input type="password" minLength="1" maxLength="128" className="brutal-input" value={initData.password} onChange={e => setInitData({...initData, password: e.target.value})} required />
              </div>
              <button type="submit" className="brutal-button" disabled={isInitializing}>
                {isInitializing ? 'INITIALIZING...' : 'CONFIRM_INIT_'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
