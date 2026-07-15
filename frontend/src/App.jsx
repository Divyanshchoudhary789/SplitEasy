import { useState, useEffect, useCallback } from 'react';
import { memberService, expenseService, balanceService } from './services/api';

import MemberManager from './components/Members/MemberManager';
import AddExpenseForm from './components/Expenses/AddExpenseForm';
import ExpenseList from './components/Expenses/ExpenseList';
import BalanceSummary from './components/Balances/BalanceSummary';
import SettleUp from './components/Balances/SettleUp';
import Toast from './components/ui/Toast';
import Spinner from './components/ui/Spinner';

const TABS = [
    { id: 'expenses', label: 'Expenses' },
    { id: 'balances', label: 'Balances' },
    { id: 'settle', label: 'Settle Up' },
];

export default function App() {
    const [members, setMembers] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [balances, setBalances] = useState([]);
    const [settlements, setSettlements] = useState([]);
    const [activeTab, setActiveTab] = useState('expenses');
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);

    const showToast = useCallback((message, type = 'error') => {
        setToast({ message, type });
    }, []);

    const refreshAll = useCallback(async () => {
        try {
            const [membersRes, expensesRes, balancesRes] = await Promise.all([
                memberService.getAll(),
                expenseService.getAll(),
                balanceService.get(),
            ]);
            setMembers(membersRes.data);
            setExpenses(expensesRes.data);
            setBalances(balancesRes.data.balances);
            setSettlements(balancesRes.data.settlements);
        } catch (err) {
            showToast(err.message);
        }
    }, [showToast]);

    useEffect(() => {
        refreshAll().finally(() => setLoading(false));
    }, [refreshAll]);

    const handleMembersUpdate = useCallback(async () => {
        try {
            const [membersRes, balancesRes] = await Promise.all([
                memberService.getAll(),
                balanceService.get(),
            ]);
            setMembers(membersRes.data);
            setBalances(balancesRes.data.balances);
            setSettlements(balancesRes.data.settlements);
        } catch (err) {
            showToast(err.message);
        }
    }, [showToast]);

    const handleExpensesUpdate = useCallback(async () => {
        try {
            const [expensesRes, balancesRes] = await Promise.all([
                expenseService.getAll(),
                balanceService.get(),
            ]);
            setExpenses(expensesRes.data);
            setBalances(balancesRes.data.balances);
            setSettlements(balancesRes.data.settlements);
        } catch (err) {
            showToast(err.message);
        }
    }, [showToast]);

    const pendingSettlements = settlements.filter((s) => s.amount > 0).length;

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white border-b border-gray-100 shadow-sm">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-indigo-600 tracking-tight">SplitEasy</h1>
                        <p className="text-xs text-gray-400 mt-0.5">Group expense splitter</p>
                    </div>
                    {members.length > 0 && (
                        <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                            {members.length} member{members.length !== 1 ? 's' : ''}
                        </span>
                    )}
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Spinner size="lg" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <aside className="lg:col-span-1">
                            <MemberManager
                                members={members}
                                onUpdate={handleMembersUpdate}
                                onError={showToast}
                                onSuccess={(msg) => showToast(msg, 'success')}
                            />
                        </aside>

                        <section className="lg:col-span-2 space-y-4">
                            <div className="flex border-b border-gray-200">
                                {TABS.map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`relative px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                                            activeTab === tab.id
                                                ? 'border-indigo-600 text-indigo-600'
                                                : 'border-transparent text-gray-500 hover:text-gray-700'
                                        }`}
                                    >
                                        {tab.label}
                                        {tab.id === 'settle' && pendingSettlements > 0 && (
                                            <span className="ml-1.5 inline-flex items-center justify-center h-4 w-4 rounded-full bg-red-500 text-white text-[10px] font-bold">
                                                {pendingSettlements}
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>

                            {activeTab === 'expenses' && (
                                <div className="space-y-4">
                                    <AddExpenseForm
                                        members={members}
                                        onExpenseAdded={() => {
                                            handleExpensesUpdate();
                                            showToast('Expense added successfully', 'success');
                                        }}
                                        onError={showToast}
                                    />
                                    <ExpenseList
                                        expenses={expenses}
                                        onUpdate={handleExpensesUpdate}
                                        onError={showToast}
                                        onSuccess={(msg) => showToast(msg, 'success')}
                                    />
                                </div>
                            )}

                            {activeTab === 'balances' && (
                                <BalanceSummary balances={balances} />
                            )}

                            {activeTab === 'settle' && (
                                <SettleUp settlements={settlements} balances={balances} />
                            )}
                        </section>
                    </div>
                )}
            </main>

            {toast && (
                <Toast
                    key={toast.message + toast.type}
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
        </div>
    );
}
