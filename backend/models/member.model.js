const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Member name is required'],
            trim: true,
            minlength: [1, 'Name cannot be empty'],
            maxlength: [50, 'Name cannot exceed 50 characters'],
            unique: true,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Member', memberSchema);
