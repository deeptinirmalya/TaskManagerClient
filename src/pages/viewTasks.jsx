import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getItemWithExpiry } from './loginPage';
import { BASE_API_URL } from '../config';
import '../styles/viewTasks.css';

export default function ViewTasks() {
  const navigate = useNavigate();
  // Pending tasks state
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const [processingId, setProcessingId] = useState(null);

  // Add task state
  const [showAddTaskForm, setShowAddTaskForm] = useState(false);
  const [newTaskName, setNewTaskName] = useState('');
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [addTaskError, setAddTaskError] = useState(null);

  // Completed tasks state
  const [showCompletedTasks, setShowCompletedTasks] = useState(false);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [loadingCompleted, setLoadingCompleted] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const fetchTasks = async () => {
    setLoading(true);
    const token = getItemWithExpiry('authToken');
    if (!token) {
      localStorage.clear();
      navigate('/login');
      return;
    }
    try {
      const response = await fetch(`${BASE_API_URL}/taskmanager/view-tasks`, {
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
        setTasks(result.data);
      } else {
        setError(result.message || 'SYS_ERR: DATA CORRUPTION');
      }
    } catch (err) {
      setError('SYS_ERR: NETWORK OFFLINE');
    } finally {
      setLoading(false);
    }
  };

  const fetchCompletedTasks = async () => {
    setLoadingCompleted(true);
    const token = getItemWithExpiry('authToken');
    if (!token) {
      navigate('/login');
      return;
    }
    try {
      const response = await fetch(`${BASE_API_URL}/taskmanager/view-completed-tasks`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.status === 401 || response.status === 403) {
        localStorage.clear();
        navigate('/login');
        return;
      }
      const result = await response.json();
      if (response.ok && result.success) {
        setCompletedTasks(result.data);
      } else {
        setError(result.message || 'SYS_ERR: FAILED TO FETCH COMPLETED TASKS');
      }
    } catch (err) {
      setError('SYS_ERR: NETWORK OFFLINE');
    } finally {
      setLoadingCompleted(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [navigate]);

  const toggleCompletedTasks = () => {
    if (!showCompletedTasks) {
      fetchCompletedTasks();
    }
    setShowCompletedTasks(!showCompletedTasks);
  };

  const handleMarkComplete = async (taskId) => {
    setProcessingId(taskId);
    setError(null);
    const token = getItemWithExpiry('authToken');
    if (!token) {
      navigate('/login');
      return;
    }
    try {
      const response = await fetch(`${BASE_API_URL}/taskmanager/mark-task-as-complete?task_id=${taskId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.status === 401 || response.status === 403) {
        localStorage.clear();
        navigate('/login');
        return;
      }
      if (response.ok) {
        fetchTasks();
      } else {
        const result = await response.json();
        setError(result.message || 'SYS_ERR: FAILED TO MARK COMPLETE');
      }
    } catch (err) {
      setError('SYS_ERR: NETWORK OFFLINE');
    } finally {
      setProcessingId(null);
      setConfirmId(null);
    }
  };

  const handleClearCompleted = async () => {
    setIsClearing(true);
    const token = getItemWithExpiry('authToken');
    if (!token) {
      navigate('/login');
      return;
    }
    try {
      const response = await fetch(`${BASE_API_URL}/taskmanager/clear-completed-task`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        fetchCompletedTasks();
      } else {
        const result = await response.json();
        setError(result.message || 'SYS_ERR: FAILED TO CLEAR TASKS');
      }
    } catch (err) {
      setError('SYS_ERR: NETWORK OFFLINE');
    } finally {
      setIsClearing(false);
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    setAddTaskError(null);
    if (!newTaskName.trim()) {
      setAddTaskError("SYS_ERR: TASK NAME REQUIRED");
      return;
    }
    setIsAddingTask(true);
    const token = getItemWithExpiry('authToken');
    if (!token) {
      navigate('/login');
      return;
    }
    try {
      const response = await fetch(`${BASE_API_URL}/taskmanager/add-task?task=${encodeURIComponent(newTaskName.trim())}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.status === 401 || response.status === 403) {
        localStorage.clear();
        navigate('/login');
        return;
      }
      if (response.ok) {
        setShowAddTaskForm(false);
        setNewTaskName('');
        fetchTasks();
      } else {
        const result = await response.json();
        setAddTaskError(result.message || 'SYS_ERR: FAILED TO ADD TASK');
      }
    } catch (err) {
      setAddTaskError('SYS_ERR: NETWORK OFFLINE');
    } finally {
      setIsAddingTask(false);
    }
  };

  return (
    <div className="brutal-task-body">
      <div className="brutal-task-container">
        <div style={{ marginBottom: '20px' }}>
          <button className="brutal-nav-btn" onClick={() => navigate('/')}>
            &lt; BACK_TO_DASHBOARD
          </button>
        </div>
        <header className="brutal-task-header">
          <h1>TASK_MANAGER__</h1>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button className="brutal-action-btn" style={{ padding: '10px 20px', fontSize: '1.2rem' }} onClick={() => setShowAddTaskForm(!showAddTaskForm)}>
              {showAddTaskForm ? 'CANCEL_' : 'ADD_TASK'}
            </button>
            <button
              className="brutal-action-btn"
              style={{
                padding: '10px 20px',
                fontSize: '1.2rem',
                backgroundColor: showCompletedTasks ? '#000' : '#fff',
                color: showCompletedTasks ? '#fff' : '#000'
              }}
              onClick={toggleCompletedTasks}
            >
              {showCompletedTasks ? 'PENDING_VIEW' : 'COMPLETED_VIEW'}
            </button>
          </div>
        </header>

        {showAddTaskForm && (
          <div className="brutal-add-form">
            <h2>NEW_TASK_</h2>
            {addTaskError && <div className="brutal-alert error" style={{ padding: '15px', border: '4px solid #000', marginBottom: '20px', background: '#ff0000', color: '#fff', fontWeight: 'bold' }}>{addTaskError}</div>}

            <form onSubmit={handleAddTask}>
              <div className="brutal-input-group">
                <label className="brutal-label">TASK DESCRIPTION</label>
                <input type="text" className="brutal-input" value={newTaskName} onChange={e => setNewTaskName(e.target.value)} required />
              </div>
              <button type="submit" className="brutal-button" disabled={isAddingTask}>
                {isAddingTask ? 'PROCESSING...' : 'SUBMIT_TASK'}
              </button>
            </form>
          </div>
        )}

        {error && (
          <div className="brutal-alert error" style={{ padding: '15px', border: '4px solid #000', marginBottom: '20px', background: '#ff0000', color: '#fff', fontWeight: 'bold' }}>
            {error}
          </div>
        )}

        {!showCompletedTasks ? (
          loading ? (
            <div className="brutal-alert" style={{ padding: '15px', border: '4px solid #000', marginBottom: '20px', fontWeight: 'bold' }}>
              FETCHING TASKS...
            </div>
          ) : (
            <>
              {/* <h2 className="brutal-section-title">PENDING_TASKS_</h2> */}

              <div className="brutal-table-wrapper">
                <table className="brutal-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>TASK_NAME</th>
                      <th style={{ textAlign: 'right' }}>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.map((task, idx) => (
                      <tr key={idx}>
                        <td style={{ color: '#000', width: '80px', fontWeight: 'bold' }}>#{task.id}</td>
                        <td style={{ color: '#000' }}>{task.task_name}</td>
                        <td style={{ textAlign: 'right', width: '150px' }}>
                          {confirmId === task.id ? (
                            <div style={{ display: 'flex', gap: '5px', justifyContent: 'flex-end' }}>
                              <span style={{ fontWeight: 'bold', marginRight: '5px', alignSelf: 'center' }}>SURE?</span>
                              <button className="brutal-btn-small confirm-yes" onClick={() => handleMarkComplete(task.id)} disabled={processingId === task.id}>
                                {processingId === task.id ? '..' : 'Y'}
                              </button>
                              <button className="brutal-btn-small confirm-no" onClick={() => setConfirmId(null)} disabled={processingId === task.id}>
                                N
                              </button>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', gap: '5px', justifyContent: 'flex-end' }}>
                              <button className="brutal-btn-small" onClick={() => setConfirmId(task.id)}>DONE_</button>
                              <button className="brutal-3dot-btn" title="Options">⋮</button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                    {tasks.length === 0 && (
                      <tr>
                        <td colSpan="3" style={{ textAlign: 'center', color: '#000' }}>NO PENDING TASKS</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
              <h2 className="brutal-section-title" style={{ margin: 0 }}>COMPLETED_TASKS_</h2>
              <button className="brutal-btn-small" style={{ backgroundColor: '#ff0000', color: '#fff', padding: '10px 15px', fontSize: '1rem', border: '4px solid #000' }} onClick={handleClearCompleted} disabled={isClearing || completedTasks.length === 0}>
                {isClearing ? 'CLEARING...' : 'CLEAR_ALL_COMPLETED'}
              </button>
            </div>

            {loadingCompleted ? (
              <div className="brutal-alert" style={{ padding: '15px', border: '4px solid #000', fontWeight: 'bold' }}>
                FETCHING COMPLETED TASKS...
              </div>
            ) : (
              <div className="brutal-table-wrapper">
                <table className="brutal-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>TASK_NAME</th>
                    </tr>
                  </thead>
                  <tbody>
                    {completedTasks.map((task, idx) => (
                      <tr key={idx}>
                        <td style={{ color: '#000', width: '80px', fontWeight: 'bold', textDecoration: 'line-through' }}>#{task.id}</td>
                        <td style={{ color: '#000', textDecoration: 'line-through' }}>{task.task_name}</td>
                      </tr>
                    ))}
                    {completedTasks.length === 0 && (
                      <tr>
                        <td colSpan="2" style={{ textAlign: 'center', color: '#000' }}>NO COMPLETED TASKS</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
