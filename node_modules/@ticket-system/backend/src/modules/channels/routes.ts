import { Router } from 'express';
import { validate, validateParams, validateQuery } from '../../common/middleware.js';
import * as channelController from './controller.js';
import * as channelSchemas from './schemas.js';
import { authorize } from '../../common/auth.js';

const router = Router();

router.use(authorize('ADMIN'));

router.get('/active', channelController.getActiveChannels);
router.get('/', validateQuery(channelSchemas.channelQuerySchema), channelController.getChannels);
router.post('/', validate(channelSchemas.createChannelSchema), channelController.createChannel);
router.get('/:id', validateParams(channelSchemas.channelParamsSchema), channelController.getChannelById);
router.patch('/:id', validateParams(channelSchemas.updateChannelSchema), validate(channelSchemas.updateChannelSchema), channelController.updateChannel);
router.delete('/:id', validateParams(channelSchemas.channelParamsSchema), channelController.deleteChannel);
router.patch('/:id/status', validateParams(channelSchemas.channelParamsSchema), channelController.toggleChannelStatus);

export default router;