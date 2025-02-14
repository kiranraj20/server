const admin = (req, res, next) => {
  console.log('Admin middleware');
  if (!req.admin || req.admin.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin only.' });
  }
  next();
};

module.exports = admin; 