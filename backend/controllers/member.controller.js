const mongoose = require('mongoose');
const Member = require('../models/member.model');
const Expense = require('../models/expense.model');

const getMembers = async (req, res, next) => {
    try {
        const members = await Member.find().sort({ createdAt: 1 });
        res.status(200).json({ success: true, data: members });
    } catch (err) {
        next(err);
    }
};

const addMember = async (req, res, next) => {
    try {
        const { name } = req.body;

        if (!name || typeof name !== 'string' || !name.trim()) {
            return res.status(400).json({ success: false, message: 'Valid member name is required' });
        }

        const existingMember = await Member.findOne({ name: name.trim() });
        if (existingMember) {
            return res.status(409).json({ success: false, message: 'A member with this name already exists' });
        }

        const member = await Member.create({ name: name.trim() });
        res.status(201).json({ success: true, data: member });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(409).json({ success: false, message: 'A member with this name already exists' });
        }
        next(err);
    }
};

const deleteMember = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: 'Invalid member ID' });
        }

        const referencedInExpense = await Expense.findOne({
            $or: [{ paidBy: id }, { 'splits.member': id }],
        });

        if (referencedInExpense) {
            return res.status(409).json({
                success: false,
                message: 'Cannot remove this member — they are part of one or more expenses. Delete those expenses first.',
            });
        }

        const member = await Member.findByIdAndDelete(id);

        if (!member) {
            return res.status(404).json({ success: false, message: 'Member not found' });
        }

        res.status(200).json({ success: true, message: 'Member removed' });
    } catch (err) {
        next(err);
    }
};

module.exports = { getMembers, addMember, deleteMember };
