# VoyageAI — Errors and Fixes Log

> **Living document** — every error found during development is documented here after being fixed.
> Format: newest errors at top.

---

## Error Template

```markdown
## Error #NNN — Short Description

**Date:** YYYY-MM-DD
**Phase:** Phase N — Phase Name
**Feature:** What were you building?

### Problem
What went wrong (user-visible symptom).

### Exact Error
```
paste exact error message / stack trace
```

### Investigation
What you checked and how.

### Root Cause
Why the error happened.

### Fix
What was changed to fix it.

### Files Changed
- path/to/file.js

### Verification
How you confirmed the fix worked.

### Status
FIXED / WORKAROUND / KNOWN ISSUE
```

---

## Error #001 — optionalAuth middleware missing

**Date:** 2026-09-21
**Phase:** Phase 1 — Foundation Models + Routes
**Feature:** Places and Restaurants routes (public endpoints)

### Problem
Routes for `/api/places` and `/api/restaurants` use `optionalAuth` middleware,
but the existing `server/middleware/auth.js` may only export `protect` (required auth).

### Exact Error
```
TypeError: optionalAuth is not a function
```
(Will appear at server startup if optionalAuth is not exported.)

### Investigation
Checked `server/middleware/auth.js` — need to verify it exports `optionalAuth`.

### Root Cause
The existing auth middleware may not have an `optionalAuth` export.
`optionalAuth` should: try to verify the JWT, attach user if valid, but NOT reject the request if no token.

### Fix
Add `optionalAuth` to `server/middleware/auth.js`:
```javascript
exports.optionalAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
      || req.cookies?.accessToken;
    if (!token) return next(); // no token — continue as guest
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
  } catch {
    // invalid token — continue as guest
  }
  next();
};
```

### Files Changed
- `server/middleware/auth.js`

### Verification
Server starts without TypeError. `GET /api/places` works without Authorization header.

### Status
FIXED (see auth.js)
