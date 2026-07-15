import { useState, useEffect, useMemo } from 'react';
import { expenseService } from '../../services/api';
import Spinner from '../ui/Spinner';

const SPLIT_MODES = {
    EQUAL: 'equal',
    AMOUNT: 'amount',
    PERCENT: 'percent',
};

function buildSplitState(members) {
    return members.map((m) => ({ member: m._id, value: '' }));
}

function roundTo2(n) {
    return Math.round(n * 100) / 100;
}

export default function AddExpenseForm({ members, onExpenseAdded, onError }) {
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [paidBy, setPaidBy] = useState('');
    const [splitMode, setSplitMode] = useState(SPLIT_MODES.EQUAL);
    const [selectedIds, setSelectedIds] = useState([]);
    const [splitValues, setSplitValues] = useState([]);
    const [fieldErrors, setFieldErrors] = useState({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (members.length > 0) {
            setPaidBy((prev) => {
                const stillExists = members.some((m) => m._id === prev);
                return stillExists ? prev : members[0]._id;
            });
            setSelectedIds((prev) => {
                const existingIds = new Set(members.map((m) => m._id));
                const kept = prev.filter((id) => existingIds.has(id));
                const newOnes = members.filter((m) => !prev.includes(m._id)).map((m) => m._id);
                return [...kept, ...newOnes];
            });
            setSplitValues((prev) => {
                const existingMap = Object.fromEntries(prev.map((s) => [s.member, s.value]));
                return members.map((m) => ({
                    member: m._id,
                    value: existingMap[m._id] ?? '',
                }));
            });
        }
    }, [members]);

    const parsedAmount = useMemo(() => {
        const v = parseFloat(amount);
        return isNaN(v) ? 0 : v;
    }, [amount]);

    const selectedMembers = useMemo(
        () => members.filter((m) => selectedIds.includes(m._id)),
        [members, selectedIds]
    );

    const perPersonEqual = useMemo(() => {
        if (!parsedAmount || selectedMembers.length === 0) return 0;
        return roundTo2(parsedAmount / selectedMembers.length);
    }, [parsedAmount, selectedMembers]);

    const customRunningTotal = useMemo(() => {
        if (splitMode === SPLIT_MODES.EQUAL) return parsedAmount;

        return splitValues
            .filter((s) => selectedIds.includes(s.member))
            .reduce((sum, s) => {
                const v = parseFloat(s.value);
                return sum + (isNaN(v) ? 0 : v);
            }, 0);
    }, [splitMode, splitValues, selectedIds, parsedAmount]);

    const splitRemaining = useMemo(() => {
        if (splitMode === SPLIT_MODES.AMOUNT) {
            return roundTo2(parsedAmount - customRunningTotal);
        }
        if (splitMode === SPLIT_MODES.PERCENT) {
            return roundTo2(100 - customRunningTotal);
        }
        return 0;
    }, [splitMode, parsedAmount, customRunningTotal]);

    const toggleMember = (id) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    const handleSplitValueChange = (memberId, value) => {
        setSplitValues((prev) =>
            prev.map((s) => (s.member === memberId ? { ...s, value } : s))
        );
        setFieldErrors((prev) => ({ ...prev, [memberId]: null }));
    };

    const handleSplitModeChange = (mode) => {
        setSplitMode(mode);
        setSplitValues(buildSplitState(members));
        setFieldErrors({});
    };

    const validate = () => {
        const errors = {};

        if (!description.trim()) {
            errors.description = 'Description is required';
        }

        if (!parsedAmount || parsedAmount <= 0) {
            errors.amount = 'Enter a valid positive amount';
        }

        if (!paidBy) {
            errors.paidBy = 'Select who paid';
        }

        if (selectedIds.length === 0) {
            errors.members = 'Select at least one member to split with';
        }

        if (splitMode === SPLIT_MODES.AMOUNT && parsedAmount > 0) {
            let total = 0;
            selectedMembers.forEach((m) => {
                const s = splitValues.find((x) => x.member === m._id);
                const v = parseFloat(s?.value);
                if (!s?.value || isNaN(v) || v < 0) {
                    errors[m._id] = 'Enter a valid amount';
                } else {
                    total += v;
                }
            });
            if (!errors.members && Object.keys(errors).filter((k) => selectedIds.includes(k)).length === 0) {
                if (Math.abs(total - parsedAmount) > 0.01) {
                    errors.splitTotal = `Splits total ₹${roundTo2(total).toFixed(2)} must equal ₹${parsedAmount.toFixed(2)}`;
                }
            }
        }

        if (splitMode === SPLIT_MODES.PERCENT && parsedAmount > 0) {
            let total = 0;
            selectedMembers.forEach((m) => {
                const s = splitValues.find((x) => x.member === m._id);
                const v = parseFloat(s?.value);
                if (!s?.value || isNaN(v) || v < 0 || v > 100) {
                    errors[m._id] = 'Enter a valid percentage (0–100)';
                } else {
                    total += v;
                }
            });
            if (!errors.members && Object.keys(errors).filter((k) => selectedIds.includes(k)).length === 0) {
                if (Math.abs(total - 100) > 0.01) {
                    errors.splitTotal = `Percentages total ${roundTo2(total)}% must equal 100%`;
                }
            }
        }

        return errors;
    };

    const computeFinalSplits = () => {
        if (splitMode === SPLIT_MODES.EQUAL) {
            return selectedMembers.map((m, idx) => ({
                member: m._id,
                amount:
                    idx === selectedMembers.length - 1
                        ? roundTo2(parsedAmount - perPersonEqual * (selectedMembers.length - 1))
                        : perPersonEqual,
            }));
        }

        if (splitMode === SPLIT_MODES.AMOUNT) {
            return selectedMembers.map((m) => {
                const s = splitValues.find((x) => x.member === m._id);
                return { member: m._id, amount: roundTo2(parseFloat(s.value)) };
            });
        }

        if (splitMode === SPLIT_MODES.PERCENT) {
            return selectedMembers.map((m, idx) => {
                const s = splitValues.find((x) => x.member === m._id);
                const pct = parseFloat(s.value) / 100;
                const computed = roundTo2(parsedAmount * pct);
                if (idx === selectedMembers.length - 1) {
                    const allocated = selectedMembers.slice(0, -1).reduce((sum, om) => {
                        const os = splitValues.find((x) => x.member === om._id);
                        return sum + roundTo2(parsedAmount * (parseFloat(os.value) / 100));
                    }, 0);
                    return { member: m._id, amount: roundTo2(parsedAmount - allocated) };
                }
                return { member: m._id, amount: computed };
            });
        }

        return [];
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const errors = validate();
        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            const firstMsg = Object.values(errors)[0];
            onError(firstMsg);
            return;
        }

        const splits = computeFinalSplits();
        setLoading(true);
        try {
            await expenseService.add({
                description: description.trim(),
                amount: parsedAmount,
                paidBy,
                splits,
            });
            setDescription('');
            setAmount('');
            setPaidBy(members[0]?._id || '');
            setSplitMode(SPLIT_MODES.EQUAL);
            setSelectedIds(members.map((m) => m._id));
            setSplitValues(buildSplitState(members));
            setFieldErrors({});
            onExpenseAdded();
        } catch (err) {
            onError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (members.length === 0) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 text-center text-sm text-gray-400">
                Add at least one member before logging expenses.
            </div>
        );
    }

    const inputBase =
        'w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400';
    const inputNormal = `${inputBase} border-gray-200`;
    const inputError = `${inputBase} border-red-400 bg-red-50`;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Add Expense</h2>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                            Description
                        </label>
                        <input
                            type="text"
                            value={description}
                            onChange={(e) => {
                                setDescription(e.target.value);
                                setFieldErrors((p) => ({ ...p, description: null }));
                            }}
                            placeholder="e.g. Dinner at restaurant"
                            maxLength={200}
                            className={fieldErrors.description ? inputError : inputNormal}
                        />
                        {fieldErrors.description && (
                            <p className="text-xs text-red-500 mt-1">{fieldErrors.description}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                            Amount (₹)
                        </label>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => {
                                setAmount(e.target.value);
                                setFieldErrors((p) => ({ ...p, amount: null }));
                            }}
                            placeholder="0.00"
                            min="0.01"
                            step="0.01"
                            className={fieldErrors.amount ? inputError : inputNormal}
                        />
                        {fieldErrors.amount && (
                            <p className="text-xs text-red-500 mt-1">{fieldErrors.amount}</p>
                        )}
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Paid by</label>
                    <select
                        value={paidBy}
                        onChange={(e) => {
                            setPaidBy(e.target.value);
                            setFieldErrors((p) => ({ ...p, paidBy: null }));
                        }}
                        className={`${fieldErrors.paidBy ? inputError : inputNormal} bg-white`}
                    >
                        {members.map((m) => (
                            <option key={m._id} value={m._id}>
                                {m.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2">
                        Split between
                    </label>

                    <div className="flex flex-wrap gap-2 mb-3">
                        {members.map((m) => (
                            <button
                                key={m._id}
                                type="button"
                                onClick={() => {
                                    toggleMember(m._id);
                                    setFieldErrors((p) => ({ ...p, members: null }));
                                }}
                                className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                                    selectedIds.includes(m._id)
                                        ? 'bg-indigo-600 text-white border-indigo-600'
                                        : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
                                }`}
                            >
                                {m.name}
                            </button>
                        ))}
                    </div>
                    {fieldErrors.members && (
                        <p className="text-xs text-red-500 mb-2">{fieldErrors.members}</p>
                    )}

                    <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit mb-3">
                        {[
                            { key: SPLIT_MODES.EQUAL, label: 'Equal' },
                            { key: SPLIT_MODES.AMOUNT, label: 'By Amount' },
                            { key: SPLIT_MODES.PERCENT, label: 'By %' },
                        ].map(({ key, label }) => (
                            <button
                                key={key}
                                type="button"
                                onClick={() => handleSplitModeChange(key)}
                                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                                    splitMode === key
                                        ? 'bg-white text-indigo-700 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    {splitMode === SPLIT_MODES.EQUAL && selectedMembers.length > 0 && parsedAmount > 0 && (
                        <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
                            ₹{perPersonEqual.toFixed(2)} per person ({selectedMembers.length} people)
                        </p>
                    )}

                    {(splitMode === SPLIT_MODES.AMOUNT || splitMode === SPLIT_MODES.PERCENT) && (
                        <div className="space-y-2">
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {selectedMembers.map((m) => {
                                    const sv = splitValues.find((s) => s.member === m._id);
                                    const hasError = !!fieldErrors[m._id];
                                    return (
                                        <div key={m._id}>
                                            <label className="block text-xs text-gray-500 mb-1">
                                                {m.name}
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    placeholder="0"
                                                    min="0"
                                                    step={splitMode === SPLIT_MODES.PERCENT ? '0.01' : '0.01'}
                                                    max={splitMode === SPLIT_MODES.PERCENT ? '100' : undefined}
                                                    value={sv?.value || ''}
                                                    onChange={(e) =>
                                                        handleSplitValueChange(m._id, e.target.value)
                                                    }
                                                    className={`w-full pl-2 pr-6 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 ${
                                                        hasError
                                                            ? 'border-red-400 bg-red-50'
                                                            : 'border-gray-200'
                                                    }`}
                                                />
                                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">
                                                    {splitMode === SPLIT_MODES.PERCENT ? '%' : '₹'}
                                                </span>
                                            </div>
                                            {hasError && (
                                                <p className="text-xs text-red-500 mt-0.5">
                                                    {fieldErrors[m._id]}
                                                </p>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            <div
                                className={`flex items-center justify-between text-xs px-3 py-2 rounded-lg ${
                                    Math.abs(splitRemaining) < 0.01
                                        ? 'bg-emerald-50 text-emerald-700'
                                        : 'bg-amber-50 text-amber-700'
                                }`}
                            >
                                <span>
                                    {splitMode === SPLIT_MODES.AMOUNT
                                        ? `Total entered: ₹${roundTo2(customRunningTotal).toFixed(2)} of ₹${parsedAmount.toFixed(2)}`
                                        : `Total: ${roundTo2(customRunningTotal).toFixed(2)}% of 100%`}
                                </span>
                                <span className="font-medium">
                                    {Math.abs(splitRemaining) < 0.01
                                        ? 'Balanced'
                                        : splitRemaining > 0
                                        ? `${splitMode === SPLIT_MODES.AMOUNT ? `₹${splitRemaining.toFixed(2)}` : `${splitRemaining.toFixed(2)}%`} remaining`
                                        : `${splitMode === SPLIT_MODES.AMOUNT ? `₹${Math.abs(splitRemaining).toFixed(2)}` : `${Math.abs(splitRemaining).toFixed(2)}%`} over`}
                                </span>
                            </div>

                            {fieldErrors.splitTotal && (
                                <p className="text-xs text-red-500">{fieldErrors.splitTotal}</p>
                            )}
                        </div>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
                >
                    {loading && <Spinner size="sm" />}
                    Add Expense
                </button>
            </form>
        </div>
    );
}
