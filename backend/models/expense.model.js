const mongoose = require('mongoose');

const splitSchema = new mongoose.Schema(
    {
        member: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Member',
            required: true,
        },
        amount: {
            type: Number,
            required: true,
            min: [0, 'Split amount cannot be negative'],
        },
    },
    { _id: false }
);

const expenseSchema = new mongoose.Schema(
    {
        description: {
            type: String,
            required: [true, 'Description is required'],
            trim: true,
            maxlength: [200, 'Description cannot exceed 200 characters'],
        },
        amount: {
            type: Number,
            required: [true, 'Amount is required'],
            min: [0.01, 'Amount must be greater than 0'],
        },
        paidBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Member',
            required: [true, 'Payer is required'],
        },
        splits: {
            type: [splitSchema],
            validate: {
                validator: function (splits) {
                    return splits && splits.length > 0;
                },
                message: 'At least one split entry is required',
            },
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Expense', expenseSchema);
