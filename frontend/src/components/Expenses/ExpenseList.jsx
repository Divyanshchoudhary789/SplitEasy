import { useState } from 'react';
import { expenseService } from '../../services/api';

function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

export default function ExpenseList({ expenses, onUpdate, onError, onSuccess }) {
    const [deletingId, setDeletingId] = useState(null);

    const handleDelete = async (id, description) => {
        if (deletingId) return;
        setDeletingId(id);
        try {
            await expenseService.remove(id);
            onUpdate();
            onSuccess(`"${description}" deleted`);
        } catch (err) {
            onError(err.message);
        } finally {
            setDeletingId(null);
        }
    };

    if (expenses.length === 0) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 text-center text-sm text-gray-400">
                No expenses yet.
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Expenses</h2>

            <ul className="divide-y divide-gray-50">
                {expenses.map((expense) => (
                    <li key={expense._id} className="py-3 first:pt-0 last:pb-0">
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-800 truncate">
                                    {expense.description}
                                </p>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    Paid by{' '}
                                    <span className="text-gray-600 font-medium">
                                        {expense.paidBy.name}
                                    </span>
                                    {' · '}
                                    {formatDate(expense.createdAt)}
                                </p>
                                <div className="flex flex-wrap gap-1.5 mt-1.5">
                                    {expense.splits.map((s) => (
                                        <span
                                            key={s.member._id}
                                            className="text-xs bg-gray-50 border border-gray-100 text-gray-500 px-2 py-0.5 rounded-full"
                                        >
                                            {s.member.name}: ₹{s.amount.toFixed(2)}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="flex flex-col items-end gap-2 shrink-0">
                                <span className="text-sm font-semibold text-gray-900">
                                    ₹{expense.amount.toFixed(2)}
                                </span>
                                <button
                                    onClick={() => handleDelete(expense._id, expense.description)}
                                    disabled={deletingId === expense._id}
                                    className="text-xs text-red-400 hover:text-red-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                    aria-label={`Delete expense: ${expense.description}`}
                                >
                                    {deletingId === expense._id ? 'Deleting...' : 'Delete'}
                                </button>
                            </div>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}
