import { Router } from 'express';
import passport from '../config/passport';
import { config } from '../config/index';

const router = Router();

router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get(
  '/callback',
  passport.authenticate('google', {
    failureRedirect: config.frontendUrl,
  }),
  (req, res) => {
    res.redirect(config.frontendUrl + '/dashboard');
  }
);

router.post('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: 'Session destroy failed' });
      }
      res.clearCookie('connect.sid');
      return res.json({ message: 'Logged out' });
    });
  });
});

router.get('/me', (req, res) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return res.json({ user: req.user });
  }
  return res.status(401).json({ error: 'Not authenticated' });
});

export default router;
