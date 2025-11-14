import EstimatedIncome from '../models/EstimatedIncome.js';
import EstimatedExpense from '../models/EstimatedExpense.js';
import { logActivity } from '../middleware/activityLogger.js';

export const estimationController = {
  getAllEstimatedIncomes: async (req, res) => {
    try {
      const { sortOrder, sortField, belongsTo, status, search } = req.query;
      const query = {};

      if (belongsTo) query.belongsTo = belongsTo;
      if (status) query.status = status;

      if (search) {
        const searchRegex = new RegExp(search.trim(), 'i');
        const searchConditions = [{ name: searchRegex }];

        if (!isNaN(Number(search))) {
          searchConditions.push({
            $expr: {
              $regexMatch: { input: { $toString: "$presentAmount" }, regex: search }
            }
          });
        }
        query.$or = searchConditions;
      }

      const sortOptions =
        sortOrder && sortField
          ? { [sortField]: sortOrder === 'desc' ? -1 : 1 }
          : { createdAt: -1 };

      const incomes = await EstimatedIncome.find(query)
        .select('estimatedIncomeId name presentAmount belongsTo status createdAt registerId')
        .sort(sortOptions)
        .lean();

      res.json(incomes);
    } catch (error) {
      console.error('Error fetching estimated incomes:', error);
      res.status(500).json({ message: 'Failed to fetch estimated incomes' });
    }
  },
  

  createEstimatedIncome: async (req, res) => {
    try {
      const { name } = req.body;

      const normalizedName = name.trim().replace(/\s+/g, ' ');
      const existingIncome = await EstimatedIncome.findOne({
        name: { $regex: `^${normalizedName}$`, $options: 'i' }
      }).lean();

      if (existingIncome) {
        return res.status(400).json({ message: 'Name already exists' });
      }

      if (!req.body.registerId) {
        return res.status(400).json({ message: 'registerId is required' });
      }

      const income = await EstimatedIncome.create(req.body);

      await logActivity(
        req,
        'CREATE',
        'EstimatedIncome',
        income.estimatedIncomeId,
        { before: null, after: income.toObject() },
        `Estimated Income ${income.estimatedIncomeId} created by ${req.user.name}`
      );

      res.status(201).json(income);
    } catch (error) {
      console.error('Error creating estimated income:', error);
      res.status(500).json({ message: 'Failed to create estimated income' });
    }
  },


  updateEstimatedIncome: async (req, res) => {
    try {
      const { name } = req.body;

      const originalIncome = await EstimatedIncome.findById(req.params.id);
      if (!originalIncome) {
        return res.status(404).json({ message: 'Estimated income not found' });
      }

      let normalizedName;
      if (name) {
        normalizedName = name.trim().replace(/\s+/g, ' ');
        const existingIncome = await EstimatedIncome.findOne({
          name: { $regex: `^${normalizedName}$`, $options: 'i' },
          _id: { $ne: req.params.id }
        }).lean();

        if (existingIncome) {
          return res.status(400).json({ message: 'Name already exists' });
        }
      }

      const originalData = originalIncome.toObject();

      const income = await EstimatedIncome.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
      );

      await logActivity(
        req,
        'UPDATE',
        'EstimatedIncome',
        income.estimatedIncomeId,
        { before: originalData, after: income.toObject() },
        `Estimated Income ${income.estimatedIncomeId} updated by ${req.user.name}`
      );

      res.json(income);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update estimated income' });
    }
  },


  deleteEstimatedIncome: async (req, res) => {
    try {
      const income = await EstimatedIncome.findById(req.params.id);
      if (!income) {
        return res.status(404).json({ message: 'Estimated income not found' });
      }

      const originalData = income.toObject();

      await logActivity(
        req,
        'DELETE',
        'EstimatedIncome',
        income.estimatedIncomeId,
        { before: originalData, after: null },
        `Estimated Income ${income.estimatedIncomeId} deleted by ${req.user.name}`
      );

      await EstimatedIncome.findByIdAndDelete(req.params.id);

      res.json({ message: 'Estimated income deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete estimated income' });
    }
  },


  getAllEstimatedExpenses: async (req, res) => {
    try {
      const { sortOrder, sortField, search } = req.query;
      const query = {};

      if (search) {
        const searchRegex = new RegExp(search.trim(), 'i');
        const searchConditions = [{ purpose: searchRegex }];

        if (!isNaN(Number(search))) {
          searchConditions.push({
            $expr: {
              $regexMatch: { input: { $toString: "$presentAmount" }, regex: search }
            }
          });
        }

        query.$or = searchConditions;
      }

      const sortOptions =
        sortOrder && sortField
          ? { [sortField]: sortOrder === 'desc' ? -1 : 1 }
          : { createdAt: -1 };

      const expenses = await EstimatedExpense.find(query)
        .select('estimatedExpenseId purpose presentAmount createdAt registerId')
        .sort(sortOptions)
        .lean();

      res.json(expenses);
    } catch (error) {
      console.error('Error fetching estimated expenses:', error);
      res.status(500).json({ message: 'Failed to fetch estimated expenses' });
    }
  },


  createEstimatedExpense: async (req, res) => {
    try {
      if (!req.body.registerId) {
        return res.status(400).json({ message: 'registerId is required' });
      }

      const expense = await EstimatedExpense.create(req.body);

      await logActivity(
        req,
        'CREATE',
        'EstimatedExpense',
        expense.estimatedExpenseId,
        { before: null, after: expense.toObject() },
        `Estimated Expense ${expense.estimatedExpenseId} created by ${req.user.name}`
      );

      res.status(201).json(expense);
    } catch (error) {
      res.status(500).json({ message: 'Failed to create estimated expense' });
    }
  },


  updateEstimatedExpense: async (req, res) => {
    try {
      const originalExpense = await EstimatedExpense.findById(req.params.id);
      if (!originalExpense) {
        return res.status(404).json({ message: 'Estimated expense not found' });
      }

      const originalData = originalExpense.toObject();

      const expense = await EstimatedExpense.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
      );

      await logActivity(
        req,
        'UPDATE',
        'EstimatedExpense',
        expense.estimatedExpenseId,
        { before: originalData, after: expense.toObject() },
        `Estimated Expense ${expense.estimatedExpenseId} updated by ${req.user.name}`
      );

      res.json(expense);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update estimated expense' });
    }
  },


  deleteEstimatedExpense: async (req, res) => {
    try {
      const expense = await EstimatedExpense.findById(req.params.id);
      if (!expense) {
        return res.status(404).json({ message: 'Estimated expense not found' });
      }

      const originalData = expense.toObject();

      await logActivity(
        req,
        'DELETE',
        'EstimatedExpense',
        expense.estimatedExpenseId,
        { before: originalData, after: null },
        `Estimated Expense ${expense.estimatedExpenseId} deleted by ${req.user.name}`
      );

      await EstimatedExpense.findByIdAndDelete(req.params.id);

      res.json({ message: 'Estimated expense deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete estimated expense' });
    }
  },


  getEstimationStats: async (req, res) => {
    try {
      const [incomes, expenses] = await Promise.all([
        EstimatedIncome.find().lean(),
        EstimatedExpense.find().lean()
      ]);

      const totalEstimatedIncome = incomes.reduce((sum, i) => sum + i.presentAmount, 0);
      const totalEstimatedPaidIncome = incomes
        .filter(i => i.status === 'paid')
        .reduce((sum, i) => sum + i.presentAmount, 0);

      const totalEstimatedNotPaidIncome = totalEstimatedIncome - totalEstimatedPaidIncome;
      const totalEstimatedExpense = expenses.reduce((sum, e) => sum + e.presentAmount, 0);
      const balance = totalEstimatedIncome - totalEstimatedExpense;

      const incomeCount = incomes.length;
      const expenseCount = expenses.length;

      const overallPaidCount = incomes.filter(i => i.status === 'paid').length;
      const overallNotPaidCount = incomes.filter(i => i.status !== 'paid').length;

      const youthIncomes = incomes.filter(i => i.belongsTo === 'youth');
      const youthPaid = youthIncomes.filter(i => i.status === 'paid').reduce((a, b) => a + b.presentAmount, 0);
      const youthNotPaid = youthIncomes.filter(i => i.status !== 'paid').reduce((a, b) => a + b.presentAmount, 0);
      const youthCount = youthIncomes.length;
      const youthPaidCount = youthIncomes.filter(i => i.status === 'paid').length;
      const youthNotPaidCount = youthIncomes.filter(i => i.status !== 'paid').length;

      const villagersIncomes = incomes.filter(i => i.belongsTo === 'villagers');
      const villagersPaid = villagersIncomes.filter(i => i.status === 'paid').reduce((a, b) => a + b.presentAmount, 0);
      const villagersNotPaid = villagersIncomes.filter(i => i.status !== 'paid').reduce((a, b) => a + b.presentAmount, 0);
      const villagersCount = villagersIncomes.length;
      const villagersPaidCount = villagersIncomes.filter(i => i.status === 'paid').length;
      const villagersNotPaidCount = villagersIncomes.filter(i => i.status !== 'paid').length;

      res.json({
        totalEstimatedIncome,
        totalEstimatedPaidIncome,
        totalEstimatedNotPaidIncome,
        totalEstimatedExpense,
        balance,
        incomeCount,
        expenseCount,
        overallPaidCount,
        overallNotPaidCount,
        youthPaid,
        youthNotPaid,
        youthCount,
        youthPaidCount,
        youthNotPaidCount,
        villagersPaid,
        villagersNotPaid,
        villagersCount,
        villagersPaidCount,
        villagersNotPaidCount
      });
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch estimation stats' });
    }
  }
};
