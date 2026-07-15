import { useState } from 'react';
import { memberService } from '../../services/api';
import Spinner from '../ui/Spinner';

export default function MemberManager({ members, onUpdate, onError, onSuccess }) {
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);

    const handleAdd = async (e) => {
        e.preventDefault();
        const trimmed = name.trim();
        if (!trimmed) return;

        setLoading(true);
        try {
            await memberService.add(trimmed);
            setName('');
            onUpdate();
            onSuccess(`${trimmed} added to the group`);
        } catch (err) {
            onError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleRemove = async (id, memberName) => {
        try {
            await memberService.remove(id);
            onUpdate();
            onSuccess(`${memberName} removed from the group`);
        } catch (err) {
            onError(err.message);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Group Members</h2>

            <form onSubmit={handleAdd} className="flex gap-2 mb-4">
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter member name"
                    maxLength={50}
                    className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    disabled={loading}
                />
                <button
                    type="submit"
                    disabled={loading || !name.trim()}
                    className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
                >
                    {loading ? <Spinner size="sm" /> : null}
                    Add
                </button>
            </form>

            {members.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-3">No members yet. Add one above.</p>
            ) : (
                <ul className="flex flex-wrap gap-2">
                    {members.map((m) => (
                        <li
                            key={m._id}
                            className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 text-sm px-3 py-1 rounded-full"
                        >
                            {m.name}
                            <button
                                onClick={() => handleRemove(m._id, m.name)}
                                className="text-indigo-400 hover:text-red-500 font-bold leading-none ml-1 transition-colors"
                                aria-label={`Remove ${m.name}`}
                            >
                                ×
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
