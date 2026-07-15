const mongoose = require('mongoose');
const Expense = require('../models/expense.model');
const Member = require('../models/member.model');

const getExpenses = async (req, res, next) => {
    try {
        const expenses = await Expense.find()
            .populate('paidBy', 'name')
            .populate('splits.member', 'name')
            .sort({ createdAt: -1 });

        const valid = expenses.filter(
            (e) => e.paidBy !== null && e.splits.every((s) => s.member !== null)
        );

        res.status(200).json({ success: true, data: valid });
    } catch (err) {
        next(err);
    }
};

const addExpense = async (req, res, next) => {
    try {
        const { description, amount, paidBy, splits } = req.body;

        if (!description || typeof description !== 'string' || !description.trim()) {
            return res.status(400).json({ success: false, message: 'Description is required' });
        }

        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            return res.status(400).json({ success: false, message: 'Amount must be a positive number' });
        }

        if (!paidBy) {
            return res.status(400).json({ success: false, message: 'Payer is required' });
        }

        if (!mongoose.Types.ObjectId.isValid(paidBy)) {
            return res.status(400).json({ success: false, message: 'Invalid payer ID' });
        }

        if (!splits || !Array.isArray(splits) || splits.length === 0) {
            return res.status(400).json({ success: false, message: 'At least one split entry is required' });
        }

        for (const s of splits) {
            if (!mongoose.Types.ObjectId.isValid(s.member)) {
                return res.status(400).json({ success: false, message: 'Invalid member ID in splits' });
            }
            const splitAmount = parseFloat(s.amount);
            if (isNaN(splitAmount) || splitAmount < 0) {
                return res.status(400).json({ success: false, message: 'Each split amount must be a non-negative number' });
            }
        }

        const payer = await Member.findById(paidBy);
        if (!payer) {
            return res.status(404).json({ success: false, message: 'Payer member not found' });
        }

        const memberIds = splits.map((s) => s.member);
        const foundMembers = await Member.find({ _id: { $in: memberIds } });
        if (foundMembers.length !== new Set(memberIds).size) {
            return res.status(404).json({ success: false, message: 'One or more split members not found' });
        }

        const totalSplit = splits.reduce((sum, s) => sum + parseFloat(s.amount), 0);
        if (Math.abs(totalSplit - parsedAmount) > 0.01) {
            return res.status(400).json({
                success: false,
                message: `Split amounts (${totalSplit.toFixed(2)}) must equal total amount (${parsedAmount.toFixed(2)})`,
            });
        }

        const formattedSplits = splits.map((s) => ({
            member: s.member,
            amount: parseFloat(parseFloat(s.amount).toFixed(2)),
        }));

        const expense = await Expense.create({
            description: description.trim(),
            amount: parseFloat(parsedAmount.toFixed(2)),
            paidBy,
            splits: formattedSplits,
        });

        const populated = await expense.populate([
            { path: 'paidBy', select: 'name' },
            { path: 'splits.member', select: 'name' },
        ]);

        res.status(201).json({ success: true, data: populated });
    } catch (err) {
        next(err);
    }
};

const deleteExpense = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: 'Invalid expense ID' });
        }

        const expense = await Expense.findByIdAndDelete(id);

        if (!expense) {
            return res.status(404).json({ success: false, message: 'Expense not found' });
        }

        res.status(200).json({ success: true, message: 'Expense deleted' });
    } catch (err) {
        next(err);
    }
};

const getBalances = async (req, res, next) => {
    try {
        const [expenses, members] = await Promise.all([
            Expense.find()
                .populate('paidBy', 'name')
                .populate('splits.member', 'name'),
            Member.find(),
        ]);

        const balanceMap = {};
        members.forEach((m) => {
            balanceMap[m._id.toString()] = { id: m._id, name: m.name, balance: 0 };
        });

        expenses.forEach((expense) => {
            if (!expense.paidBy) return;
            const payerId = expense.paidBy._id.toString();

            expense.splits.forEach((split) => {
                if (!split.member) return;
                const memberId = split.member._id.toString();

                if (memberId !== payerId) {
                    if (balanceMap[payerId]) balanceMap[payerId].balance += split.amount;
                    if (balanceMap[memberId]) balanceMap[memberId].balance -= split.amount;
                }
            });
        });

        const balances = Object.values(balanceMap).map((b) => ({
            ...b,
            balance: parseFloat(b.balance.toFixed(2)),
        }));

        const settlements = computeSettlements(balances);

        res.status(200).json({ success: true, data: { balances, settlements } });
    } catch (err) {
        next(err);
    }
};

function computeSettlements(balances) {
    const creditors = balances
        .filter((b) => b.balance > 0.01)
        .map((b) => ({ ...b }))
        .sort((a, b) => b.balance - a.balance);

    const debtors = balances
        .filter((b) => b.balance < -0.01)
        .map((b) => ({ ...b }))
        .sort((a, b) => a.balance - b.balance);

    const transactions = [];
    let i = 0;
    let j = 0;

    while (i < creditors.length && j < debtors.length) {
        const credit = creditors[i];
        const debt = debtors[j];

        const amount = Math.min(credit.balance, Math.abs(debt.balance));
        transactions.push({
            from: { id: debt.id, name: debt.name },
            to: { id: credit.id, name: credit.name },
            amount: parseFloat(amount.toFixed(2)),
        });

        credit.balance -= amount;
        debt.balance += amount;

        if (Math.abs(credit.balance) < 0.01) i++;
        if (Math.abs(debt.balance) < 0.01) j++;
    }

    return transactions;
}

module.exports = { getExpenses, addExpense, deleteExpense, getBalances };
