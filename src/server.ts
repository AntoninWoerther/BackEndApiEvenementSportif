import 'reflect-metadata';
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { makeCleanupEvenementsUseCase } from './profile/evenement/app/usecases/cleanup-evenements.usecase';
import { makeCreateEvenementUseCase } from './profile/evenement/app/usecases/create-evenement.usecase';
import { makeDeleteEvenementUseCase } from './profile/evenement/app/usecases/delete-evenement.usecase';
import { makeGetEvenementByIdUseCase } from './profile/evenement/app/usecases/get-evenement-by-id.usecase';
import { makeGetEvenementsUseCase } from './profile/evenement/app/usecases/get-evenements.usecase';
import { makeUpdateEvenementDateUseCase } from './profile/evenement/app/usecases/update-evenement-date.usecase';
import { typeormEvenementCleanupGateway } from './profile/evenement/infra/persistance/repositories/typeorm-evenement-cleanup.gateway';
import { typeormEvenementGateway } from './profile/evenement/infra/persistance/repositories/typeorm-evenement.gateway';
import { startEvenementCleanupScheduler } from './profile/evenement/infra/scheduling/evenement-cleanup.scheduler';
import { registerEvenementDateEmailListener } from './profile/evenement/infra/mailer/evenement-date-email.listener';
import { registerEvenementDeletionWarningEmailListener } from './profile/evenement/infra/mailer/evenement-deletion-warning-email.listener';
import { createEvenementRouter } from './profile/evenement/presentation/routes/evenement.route';
import { makeCancelReservationUseCase } from './reservation/app/usecases/cancel-reservation.usecase';
import { makeCreateReservationUseCase } from './reservation/app/usecases/create-reservation.usecase';
import { makeGetMyReservationsUseCase } from './reservation/app/usecases/get-my-reservations.usecase';
import { makeRemoveEventParticipantUseCase } from './reservation/app/usecases/remove-event-participant.usecase';
import { typeormReservationGateway } from './reservation/infra/persistance/repositories/typeorm-reservation.gateway';
import { createReservationRouter } from './reservation/presentation/routes/reservation.route';
import { createChangePasswordUseCase } from './profile/user/app/usecases/change-password.usecase';
import { makeChangeUserPermissionUseCase } from './profile/user/app/usecases/change-user-permission.usecase';
import { makeExportUserPermissionChangesUseCase } from './profile/user/app/usecases/export-user-permission-changes.usecase';
import { typeormUserPermissionsGateway } from './profile/user/infra/persistance/repositories/typeorm-user-permissions.gateway';
import { makeLoadUserPermissions } from './auth/infra/gards/user-permissions.middleware';
import { typeormUserPasswordGateway } from './profile/user/infra/persistance/repositories/typeorm-user-password.gateway';
import { createUserRouter } from './profile/user/presentation/routes/user.route';
import { makeCleanupRefreshTokensUseCase } from './auth/app/usecases/cleanup-refresh-tokens.usecase';
import { createIssueRefreshTokenUseCase } from './auth/app/usecases/create-refresh-token.usecase';
import { createLoginUseCase } from './auth/app/usecases/login.usecase';
import { createRefreshUseCase } from './auth/app/usecases/refresh.usecase';
import { typeormRefreshTokenGateway } from './auth/infra/persistance/repositories/typeorm-refresh-token.gateway';
import { startRefreshTokenCleanupScheduler } from './auth/infra/scheduling/refresh-token-cleanup.scheduler';
import { createAuthRouter } from './auth/presentation/routes/auth.route';
import { db } from './core/dataBase.config';
import { errorMiddleware } from './core/middleware/erreur.middleware';
import { AppError } from './core/http/error.response';
import { registerSignupEmailListeners } from './profile/user/infra/mailer/signup-email.listener';
import { registerUserDeletionEmailListener } from './profile/user/infra/mailer/user-deletion-email.listener';



const app = express();
const port = 3000;
const createEvenement = makeCreateEvenementUseCase(typeormEvenementGateway);
const deleteEvenement = makeDeleteEvenementUseCase(typeormEvenementGateway);
const getEvenementById = makeGetEvenementByIdUseCase(typeormEvenementGateway);
const getEvenements = makeGetEvenementsUseCase(typeormEvenementGateway);
const updateEvenementDate = makeUpdateEvenementDateUseCase(typeormEvenementGateway);
const createReservation = makeCreateReservationUseCase(typeormReservationGateway);
const cancelReservation = makeCancelReservationUseCase(typeormReservationGateway);
const getMyReservations = makeGetMyReservationsUseCase(typeormReservationGateway);
const removeEventParticipant = makeRemoveEventParticipantUseCase(typeormReservationGateway);
const changePassword = createChangePasswordUseCase(typeormUserPasswordGateway);
const grantUserPermission = makeChangeUserPermissionUseCase(typeormUserPermissionsGateway, 'grant');
const revokeUserPermission = makeChangeUserPermissionUseCase(typeormUserPermissionsGateway, 'revoke');
const exportUserPermissionChanges = makeExportUserPermissionChangesUseCase(typeormUserPermissionsGateway);
const loadUserPermissions = makeLoadUserPermissions(typeormUserPermissionsGateway);
const issueRefreshToken = createIssueRefreshTokenUseCase(typeormRefreshTokenGateway);


app.use(cors());
app.use(express.json());
app.use('/evenements', createEvenementRouter({
  createEvenement,
  deleteEvenement,
  getEvenementById,
  getEvenements,
  updateEvenementDate,
  loadUserPermissions
}));
app.use('/', createReservationRouter({
  createReservation,
  cancelReservation,
  getMyReservations,
  removeEventParticipant,
  loadUserPermissions
}));
app.use('/', createUserRouter({
  changePassword,
  grantUserPermission,
  revokeUserPermission,
  exportUserPermissionChanges,
  loadUserPermissions
}));
app.use('/auth', createAuthRouter({
  login: createLoginUseCase(issueRefreshToken),
  refresh: createRefreshUseCase(typeormRefreshTokenGateway, issueRefreshToken)
}));

app.use((_req, _res, next) => {
  next(new AppError('Route introuvable.', 404, 'ERR_ROUTE_NOT_FOUND'));
});
app.use(errorMiddleware);

const startServer = async (): Promise<void> => {
  await db.initialize();
  registerSignupEmailListeners();
  registerUserDeletionEmailListener();
  registerEvenementDateEmailListener(typeormReservationGateway);
  registerEvenementDeletionWarningEmailListener();
  startEvenementCleanupScheduler(makeCleanupEvenementsUseCase(typeormEvenementCleanupGateway));
  startRefreshTokenCleanupScheduler(makeCleanupRefreshTokensUseCase(typeormRefreshTokenGateway));
  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
};

startServer().catch((error) => {
  console.error('Error starting the server:', error);
});
