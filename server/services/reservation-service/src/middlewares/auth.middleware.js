const httpError = require("../utils/httpError");
const { verifyToken } = require("../utils/auth");
const prisma = require("../utils/prisma");

function authRequired(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const [type, token] = header.split(" ");

    if (type !== "Bearer" || !token) {
      throw httpError(401, "Nevtreh erh shaardlagatai");
    }

    req.user = verifyToken(token);
    next();
  } catch (error) {
    next(error.statusCode ? error : httpError(401, "Token buruu esvel hugatsaa duussan baina"));
  }
}

function roleGuard(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.type)) {
      return next(httpError(403, "Ene uildliig hiih erhgui"));
    }

    next();
  };
}

const ownerGuard = [authRequired, roleGuard("owner")];
const adminGuard = [authRequired, roleGuard("admin")];

async function subscriptionRequired(req, res, next) {
  try {
    const organization = await prisma.organization.findUnique({
      where: { id: req.user.organizationId },
      select: { subscriptionStatus: true, subscriptionExpiry: true, isApproved: true },
    });

    const isActive =
      organization?.isApproved === true &&
      organization?.subscriptionStatus === "active" &&
      organization?.subscriptionExpiry &&
      new Date(organization.subscriptionExpiry).getTime() > Date.now();

    if (!isActive) {
      return next(httpError(402, "Subscription duussan baina. Tulbur tulj 30 honogiin erh idevhjuulne uu."));
    }

    next();
  } catch (error) {
    next(error);
  }
}

const ownerActiveGuard = [...ownerGuard, subscriptionRequired];

module.exports = {
  authRequired,
  roleGuard,
  ownerGuard,
  ownerActiveGuard,
  adminGuard,
};
