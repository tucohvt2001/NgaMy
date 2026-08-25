import { Router } from 'express';
import { eventTypeController } from '../controllers/eventType.controller';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';
import { validate } from '../middlewares/validate';
import { createEventTypeSchema, updateEventTypeSchema } from '../validators/eventType.validator';
import { PERMISSIONS } from '../types/enums';

const router = Router();
router.use(authenticate);

router
  .route('/event-types')
  .get(authorize(PERMISSIONS.EVENT_READ), eventTypeController.list)
  .post(
    authorize(PERMISSIONS.EVENT_CREATE),
    validate({ body: createEventTypeSchema }),
    eventTypeController.create,
  );

router
  .route('/event-types/:id')
  .get(authorize(PERMISSIONS.EVENT_READ), eventTypeController.getById)
  .put(
    authorize(PERMISSIONS.EVENT_UPDATE),
    validate({ body: updateEventTypeSchema }),
    eventTypeController.update,
  )
  .delete(
    authorize(PERMISSIONS.EVENT_DELETE),
    eventTypeController.remove,
  );

export default router;
