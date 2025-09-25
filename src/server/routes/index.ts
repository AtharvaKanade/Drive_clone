import { Router } from 'express';
import { authRouter } from './auth.js';
import { filesRouter } from './files.js';
import { foldersRouter } from './folders.js';
import { trashRouter } from './trash.js';
import { shareRouter } from './share.js';
import { searchRouter } from './search.js';

export const router = Router();

router.get('/', (_req, res) => {
  res.json({ ok: true });
});

router.use('/auth', authRouter);
router.use('/files', filesRouter);
router.use('/folders', foldersRouter);
router.use('/trash', trashRouter);
router.use('/share', shareRouter);
router.use('/search', searchRouter);


