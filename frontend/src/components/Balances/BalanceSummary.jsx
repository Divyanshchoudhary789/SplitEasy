export default function BalanceSummary({ balances }) {
    if (balances.length === 0) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 text-center text-sm text-gray-400">
                Add expenses to see balances.
            </div>
        );
    }

    const sorted = [...balances].sort((a, b) => b.balance - a.balance);
    const maxAbsBalance = balances.reduce((max, b) => Math.max(max, Math.abs(b.balance)), 0);

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h2 className="text-lg font-semibold text-gray-800 mb-1">Net Balances</h2>
            <p className="text-xs text-gray-400 mb-4">
                Positive means owed money · Negative means owes money
            </p>

            <ul className="space-y-3">
                {sorted.map((b) => {
                    const isPositive = b.balance > 0;
                    const isNeutral = Math.abs(b.balance) < 0.01;
                    const barWidth = maxAbsBalance > 0 ? (Math.abs(b.balance) / maxAbsBalance) * 100 : 0;

                    return (
                        <li key={b.id}>
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium text-gray-700">{b.name}</span>
                                <span
                                    className={`text-sm font-semibold tabular-nums ${
                                        isNeutral
                                            ? 'text-gray-400'
                                            : isPositive
                                            ? 'text-emerald-600'
                                            : 'text-red-500'
                                    }`}
                                >
                                    {isNeutral
                                        ? 'Settled'
                                        : isPositive
                                        ? `+₹${b.balance.toFixed(2)}`
                                        : `-₹${Math.abs(b.balance).toFixed(2)}`}
                                </span>
                            </div>
                            {!isNeutral && (
                                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all ${
                                            isPositive ? 'bg-emerald-400' : 'bg-red-400'
                                        }`}
                                        style={{ width: `${barWidth}%` }}
                                    />
                                </div>
                            )}
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
