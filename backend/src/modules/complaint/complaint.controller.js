const complaintService = require("./complaint.service");

// Same response shape as the other modules:
// success -> { success: true, data }
// failure -> { success: false, error }

const handle =
  (action, successStatus = 200) =>
  async (req, res) => {
    try {
      const data = await action(req);

      return res.status(successStatus).json({
        success: true,
        data,
      });
    } catch (error) {
      const status = error.statusCode || 500;

      if (status >= 500 && !error.statusCode) {
        console.error(
          "[complaint] unexpected error:",
          error
        );
      }

      return res.status(status).json({
        success: false,
        error: error.statusCode
          ? error.message
          : "Something went wrong. Please try again.",
      });
    }
  };

// =====================================================
// PARENT
// =====================================================

const createComplaint = handle(
  (req) =>
    complaintService.createComplaint(
      req.user,
      req.body
    ),
  201
);

const listMyComplaints = handle((req) =>
  complaintService.listMyComplaints(
    req.user,
    req.query
  )
);

const getMyComplaint = handle((req) =>
  complaintService.getMyComplaint(
    req.user,
    req.params.id
  )
);

// =====================================================
// ADMIN
// =====================================================

const getAnalytics = handle((req) =>
  complaintService.getAnalytics(
    req.user,
    req.query
  )
);

const listComplaints = handle((req) =>
  complaintService.listComplaints(
    req.user,
    req.query
  )
);

const getComplaint = handle((req) =>
  complaintService.getComplaint(
    req.user,
    req.params.id
  )
);

const updateComplaint = handle((req) =>
  complaintService.updateComplaint(
    req.user,
    req.params.id,
    req.body
  )
);

const decideSuggestion = handle((req) =>
  complaintService.decideSuggestion(
    req.user,
    req.params.id,
    req.body
  )
);

const generateReply = handle((req) =>
  complaintService.generateReplyDraft(
    req.user,
    req.params.id,
    req.body
  )
);

const sendReply = handle((req) =>
  complaintService.sendReply(
    req.user,
    req.params.id,
    req.body
  )
);

const reanalyze = handle((req) =>
  complaintService.reanalyzeComplaint(
    req.user,
    req.params.id
  )
);

module.exports = {
  createComplaint,
  listMyComplaints,
  getMyComplaint,
  getAnalytics,
  listComplaints,
  getComplaint,
  updateComplaint,
  decideSuggestion,
  generateReply,
  sendReply,
  reanalyze,
};