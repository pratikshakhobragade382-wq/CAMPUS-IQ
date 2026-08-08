const holidayService = require('./holiday.service');

const createHoliday = async (req, res, next) => {
  try {
    const data = await holidayService.createHoliday(req.body, req.user.tenantId, req.user);
    return res.status(201).json({ success: true, message: 'Holiday created', data });
  } catch (error) {
    return next(error);
  }
};

const getAllHolidays = async (req, res, next) => {
  try {
    const { academicYearId } = req.query;
    const data = await holidayService.getAllHolidays(req.user.tenantId, academicYearId);
    return res.status(200).json({ success: true, message: 'Holidays fetched', data });
  } catch (error) {
    return next(error);
  }
};

const updateHoliday = async (req, res, next) => {
  try {
    const data = await holidayService.updateHoliday(req.params.id, req.body, req.user.tenantId, req.user);
    return res.status(200).json({ success: true, message: 'Holiday updated', data });
  } catch (error) {
    return next(error);
  }
};

const deleteHoliday = async (req, res, next) => {
  try {
    const result = await holidayService.deleteHoliday(req.params.id, req.user.tenantId, req.user);
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    return next(error);
  }
};

module.exports = { createHoliday, getAllHolidays, updateHoliday, deleteHoliday };
