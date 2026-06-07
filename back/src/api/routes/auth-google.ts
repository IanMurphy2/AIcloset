import { Router, Request, Response } from 'express';
import passport from '../../passportInstance';
import config from '../../Config';
import { signToken } from '../../lib/auth/signToken';
import { User } from '../../lib/models/User';

export function createAuthGoogleRouter(): Router {
  const router = Router();
  const frontendUrl = config.get('app.frontendUrl') as string;

  // Step 1: kick off the OAuth flow, redirecting the user to Google.
  router.get(
    '/google',
    passport.authenticate('google', { scope: ['profile', 'email'], session: false })
  );

  // Step 2: Google redirects back here. Passport runs the verify callback
  // (find-or-create user), then we sign the SAME JWT as local login and
  // redirect to the frontend with the token.
  router.get(
    '/google/callback',
    passport.authenticate('google', {
      session: false,
      failureRedirect: `${frontendUrl}/login?error=oauth`,
    }),
    (req: Request, res: Response) => {
      const user = req.user as User;
      const token = signToken(user);
      res.redirect(`${frontendUrl}/auth/callback?token=${encodeURIComponent(token)}`);
    }
  );

  return router;
}
