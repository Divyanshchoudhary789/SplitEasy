export default function SettleUp({ settlements, balances }) {
    const allSettled =
        settlements.length === 0 &&
        balances.length > 0 &&
        balances.every((b) => Math.abs(b.balance) < 0.01);

    const noData = balances.length === 0;

    if (noData) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 text-center text-sm text-gray-400">
                Add expenses to see settlement suggestions.
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h2 className="text-lg font-semibold text-gray-800 mb-1">Settle Up</h2>
            <p className="text-xs text-gray-400 mb-4">
                Minimum transactions needed to clear all debts
            </p>

            {allSettled ? (
                <div className="flex flex-col items-center justify-center py-8 gap-2">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                        <svg
                            className="w-6 h-6 text-emerald-600"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <p className="text-sm font-medium text-emerald-700">Everyone is settled up</p>
                    <p className="text-xs text-gray-400">No payments needed</p>
                </div>
            ) : (
                <ul className="space-y-3">
                    {settlements.map((t, idx) => (
                        <li
                            key={idx}
                            className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100"
                        >
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                <div className="flex flex-col items-center">
                                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide leading-none mb-0.5">
                                        from
                                    </span>
                                    <span className="text-sm font-medium text-red-600 truncate max-w-[80px]">
                                        {t.from.name}
                                    </span>
                                </div>

                                <div className="flex-1 flex flex-col items-center gap-0.5">
                                    <span className="text-base font-bold text-gray-900 tabular-nums">
                                        ₹{t.amount.toFixed(2)}
                                    </span>
                                    <svg
                                        className="w-16 h-3 text-gray-300"
                                        viewBox="0 0 64 12"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth={1.5}
                                    >
                                        <line x1="0" y1="6" x2="56" y2="6" />
                                        <polyline points="50,2 58,6 50,10" fill="none" />
                                    </svg>
                                </div>

                                <div className="flex flex-col items-center">
                                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide leading-none mb-0.5">
                                        to
                                    </span>
                                    <span className="text-sm font-medium text-emerald-600 truncate max-w-[80px]">
                                        {t.to.name}
                                    </span>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
