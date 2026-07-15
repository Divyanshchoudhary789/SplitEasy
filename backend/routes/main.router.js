const express = require('express');
const mainRouter = express.Router();

const { getMembers, addMember, deleteMember } = require('../controllers/member.controller');
const { getExpenses, addExpense, deleteExpense, getBalances } = require('../controllers/expense.controller');

mainRouter.get('/members', getMembers);
mainRouter.post('/members', addMember);
mainRouter.delete('/members/:id', deleteMember);

mainRouter.get('/expenses', getExpenses);
mainRouter.post('/expenses', addExpense);
mainRouter.delete('/expenses/:id', deleteExpense);

mainRouter.get('/balances', getBalances);

module.exports = mainRouter;
