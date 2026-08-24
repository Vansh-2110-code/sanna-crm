const PLAN_LEVELS = {
  "Starter": 1,
  "Basic": 1,
  "Standard": 2,
  "Professional": 2,
  "Pro": 2,
  "Business": 3,
  "Enterprise": 3,
  "Enterprise Suite": 3,
  "Ultimate": 3,
  "Custom": 3
};

const FEATURE_PLANS = {
  // Level 1: Core standard features available to all
  "leads": "Starter",
  "deals": "Starter",
  "quotes": "Starter",
  "orders": "Starter",
  "employees": "Starter",
  "roles": "Starter",
  "tickets": "Starter",
  "integrations": "Starter",

  // Level 2: Advanced features
  "auditLogs": "Starter",
  "tenants": "Starter"
};

function checkFeature(featureName) {
  return (req, res, next) => {
    // If tenant context is not set, allow or handle gracefully
    if (!req.tenant) {
      return next();
    }

    // System super admins bypass all plan restrictions
    if (req.user?.isSystemAdmin) {
      return next();
    }

    const tenantPlan = req.tenant.plan || "Enterprise Suite";
    const requiredPlan = FEATURE_PLANS[featureName];

    if (!requiredPlan) {
      // If a feature is not mapped, default to allowing it
      return next();
    }

    const tenantLevel = PLAN_LEVELS[tenantPlan] || 3;
    const requiredLevel = PLAN_LEVELS[requiredPlan] || 1;

    if (tenantLevel < requiredLevel) {
      return res.status(403).json({
        error: `Feature Lock: The '${featureName}' module is restricted. Your company is currently on the '${tenantPlan}' plan. Please upgrade to the '${requiredPlan}' plan or above to unlock this functionality.`,
        requiredPlan,
        currentPlan: tenantPlan
      });
    }

    next();
  };
}

module.exports = {
  checkFeature
};
