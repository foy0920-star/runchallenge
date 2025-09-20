import React, { useState, useEffect, useCallback } from 'react';
import { HashRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { Participant, RunRecord } from './types';
import RegisterPage from './pages/RegisterPage';
import SubmitRecordPage from './pages/SubmitRecordPage';
import DashboardPage from './pages/DashboardPage';
import { AdminPanel } from './components/AdminPanel';
import { HomeIcon, TrophyIcon, UserPlusIcon } from './components/icons';

const App: React.FC = () => {
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [runRecords, setRunRecords] = useState<RunRecord[]>([]);
    const [lastDeleted, setLastDeleted] = useState<{ type: 'participant' | 'record', data: any } | null>(null);
    const [isAdminVisible, setIsAdminVisible] = useState(false);
    const [isPasswordPromptVisible, setIsPasswordPromptVisible] = useState(false);
    const [passwordInput, setPasswordInput] = useState('');
    const [passwordError, setPasswordError] = useState('');

    useEffect(() => {
        try {
            const savedParticipants = localStorage.getItem('participants');
            const savedRunRecords = localStorage.getItem('runRecords');
            if (savedParticipants) {
                setParticipants(JSON.parse(savedParticipants));
            }
            if (savedRunRecords) {
                setRunRecords(JSON.parse(savedRunRecords));
            }
        } catch (error) {
            console.error("Failed to parse from localStorage", error);
        }
    }, []);

    useEffect(() => {
        try {
            localStorage.setItem('participants', JSON.stringify(participants));
        } catch (error) {
            console.error("Failed to save participants to localStorage", error);
        }
    }, [participants]);

    useEffect(() => {
        try {
            localStorage.setItem('runRecords', JSON.stringify(runRecords));
        } catch (error) {
            console.error("Failed to save run records to localStorage", error);
        }
    }, [runRecords]);

    const addParticipant = useCallback((participant: Omit<Participant, 'id'>) => {
        setParticipants(prev => [...prev, { ...participant, id: Date.now().toString() }]);
    }, []);

    const addRunRecord = useCallback((record: Omit<RunRecord, 'id'>) => {
        setRunRecords(prev => [...prev, { ...record, id: Date.now().toString(), date: new Date().toISOString() }]);
    }, []);

    const updateRunRecord = useCallback((updatedRecord: RunRecord) => {
        setRunRecords(prev => prev.map(r => r.id === updatedRecord.id ? updatedRecord : r));
    }, []);

    const deleteRunRecord = useCallback((recordId: string) => {
        const recordToDelete = runRecords.find(r => r.id === recordId);
        if (recordToDelete) {
            setLastDeleted({ type: 'record', data: recordToDelete });
            setRunRecords(prev => prev.filter(r => r.id !== recordId));
        }
    }, [runRecords]);

    const deleteParticipant = useCallback((participantId: string) => {
        const participantToDelete = participants.find(p => p.id === participantId);
        if (participantToDelete) {
            const associatedRecords = runRecords.filter(r => r.participantId === participantId);
            setLastDeleted({ type: 'participant', data: { participant: participantToDelete, records: associatedRecords } });
            setParticipants(prev => prev.filter(p => p.id !== participantId));
            setRunRecords(prev => prev.filter(r => r.participantId !== participantId));
        }
    }, [participants, runRecords]);

    const undoLastDelete = useCallback(() => {
        if (!lastDeleted) return;
        if (lastDeleted.type === 'record') {
            setRunRecords(prev => [...prev, lastDeleted.data]);
        } else if (lastDeleted.type === 'participant') {
            setParticipants(prev => [...prev, lastDeleted.data.participant]);
            setRunRecords(prev => [...prev, ...lastDeleted.data.records]);
        }
        setLastDeleted(null);
    }, [lastDeleted]);
    
    const handlePasswordSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordInput === 'gkgkgh12!@') {
            setIsAdminVisible(true);
            setIsPasswordPromptVisible(false);
            setPasswordInput('');
            setPasswordError('');
        } else {
            setPasswordError('비밀번호가 올바르지 않습니다.');
            setPasswordInput('');
        }
    };

    return (
        <HashRouter>
            <div className="min-h-screen bg-gray-900 text-gray-100 font-sans">
                <header className="sticky top-0 bg-gray-800 border-b border-gray-700 z-10">
                    <nav className="max-w-4xl mx-auto flex justify-around">
                        <NavLink to="/" className={({ isActive }) => `flex flex-col items-center justify-center p-3 transition-colors ${isActive ? 'text-yellow-400' : 'text-gray-400 hover:text-yellow-300'}`}><HomeIcon /><span className="text-xs mt-1">기록 제출</span></NavLink>
                        <NavLink to="/dashboard" className={({ isActive }) => `flex flex-col items-center justify-center p-3 transition-colors ${isActive ? 'text-yellow-400' : 'text-gray-400 hover:text-yellow-300'}`}><TrophyIcon /><span className="text-xs mt-1">대시보드</span></NavLink>
                        <NavLink to="/register" className={({ isActive }) => `flex flex-col items-center justify-center p-3 transition-colors ${isActive ? 'text-yellow-400' : 'text-gray-400 hover:text-yellow-300'}`}><UserPlusIcon /><span className="text-xs mt-1">참가자 등록</span></NavLink>
                    </nav>
                </header>
                <main className="pt-4 pb-12">
                    <Routes>
                        <Route path="/" element={<SubmitRecordPage participants={participants} addRunRecord={addRunRecord} />} />
                        <Route path="/register" element={<RegisterPage addParticipant={addParticipant} />} />
                        <Route path="/dashboard" element={<DashboardPage participants={participants} runRecords={runRecords} updateRunRecord={updateRunRecord} deleteRunRecord={deleteRunRecord} />} />
                    </Routes>
                </main>
                <div 
                    onClick={() => setIsPasswordPromptVisible(true)}
                    className="fixed bottom-4 right-4 bg-indigo-600 w-8 h-8 rounded-full cursor-pointer hover:bg-indigo-500 transition-colors opacity-10"
                    title="Admin Panel">
                </div>
                
                {isPasswordPromptVisible && (
                    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
                        <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-sm">
                            <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                                <h2 className="text-xl font-bold text-yellow-400">관리자 접근</h2>
                                <button
                                    onClick={() => {
                                        setIsPasswordPromptVisible(false);
                                        setPasswordError('');
                                        setPasswordInput('');
                                    }}
                                    className="text-gray-400 hover:text-white text-2xl"
                                >
                                    &times;
                                </button>
                            </div>
                            <form onSubmit={handlePasswordSubmit} className="p-6 space-y-4">
                                <label htmlFor="password-input" className="block text-sm font-medium text-gray-300">비밀번호를 입력하세요</label>
                                <input
                                    id="password-input"
                                    type="password"
                                    value={passwordInput}
                                    onChange={(e) => setPasswordInput(e.target.value)}
                                    className="bg-gray-700 border border-gray-600 text-white block w-full px-3 py-2 rounded-md focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm"
                                    autoFocus
                                />
                                {passwordError && <p className="text-red-500 text-sm">{passwordError}</p>}
                                <button
                                    type="submit"
                                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-gray-900 bg-yellow-400 hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 focus:ring-offset-gray-900"
                                >
                                    확인
                                </button>
                            </form>
                        </div>
                    </div>
                )}
                
                <AdminPanel 
                    isVisible={isAdminVisible}
                    onClose={() => setIsAdminVisible(false)}
                    participants={participants}
                    runRecords={runRecords}
                    deleteParticipant={deleteParticipant}
                    lastDeleted={lastDeleted}
                    undoLastDelete={undoLastDelete}
                />
            </div>
        </HashRouter>
    );
};

export default App;