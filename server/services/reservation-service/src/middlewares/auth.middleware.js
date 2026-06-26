const httpError = require("../utils/httpError");
const { verifyToken } = require("../utils/auth");
const prisma = require("../utils/prisma");

function authRequired(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const [type, token] = header.split(" ");

    if (type !== "Bearer" || !token) {
      throw httpError(401, "Нэвтрэх эрх шаардлагатай.");
    }

    req.user = verifyToken(token);
    next();
  } catch (error) {
    next(error.statusCode ? error : httpError(401, "Token буруу эсвэл хугацаа дууссан байна."));
  }
}

function roleGuard(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.type)) {
      return next(httpError(403, "Энэ үйлдлийг хийх эрхгүй байна."));
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
      return next(httpError(402, "Subscription дууссан байна. Төлбөр төлж 30 хоногийн эрхээ идэвхжүүлнэ үү."));
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
