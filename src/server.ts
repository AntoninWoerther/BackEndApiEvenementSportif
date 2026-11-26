import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import { makeCancelEvenementUseCase } from './profile/evenement/app/usecases/cancel-evenement.usecase';
import { makeCleanupEvenementsUseCase } from './profile/evenement/app/usecases/cleanup-evenements.usecase';
import { makeCreateEvenementUseCase } from './profile/evenement/app/usecases/create-evenement.usecase';
import { makeDeleteEvenementUseCase } from './profile/evenement/app/usecases/delete-evenement.usecase';
import { makeGetEvenementByIdUseCase } from './profile/evenement/app/usecases/get-evenement-by-id.usecase';
import { makeGetEvenementsUseCase } from './profile/evenement/app/usecases/get-evenements.usecase';
import { makeUpdateEvenementDateUseCase } from './profile/evenement/app/usecases/update-evenement-date.usecase';
import { makeUpdateEvenementDetailsUseCase } from './profile/evenement/app/usecases/update-evenement-details.usecase';
import { typeormEvenementCleanupGateway } from './profile/evenement/infra/persistance/repositories/typeorm-evenement-cleanup.gateway';
import { typeormEvenementGateway } from './profile/evenement/infra/persistance/repositories/typeorm-evenement.gateway';
import { startEvenementCleanupScheduler } from './profile/evenement/infra/scheduling/evenement-cleanup.scheduler';
import { registerEvenementCancellationEmailListener } from './profile/evenement/infra/mailer/evenement-cancellation-email.listener';
import { registerEvenementDateEmailListener } from './profile/evenement/infra/mailer/evenement-date-email.listener';
import { registerEvenementDeletionWarningEmailListener } from './profile/evenement/infra/mailer/evenement-deletion-warning-email.listener';
import { createEvenementRouter } from './profile/evenement/presentation/routes/evenement.route';
import { makeCancelReservationUseCase } from './reservation/app/usecases/cancel-reservation.usecase';
import { makeCreateReservationUseCase } from './reservation/app/usecases/create-reservation.usecase';
import { makeGetEventParticipantsUseCase } from './reservation/app/usecases/get-event-participants.usecase';
import { makeGetMyReservationsUseCase } from './reservation/app/usecases/get-my-reservations.usecase';
import { makeRemoveEventParticipantUseCase } from './reservation/app/usecases/remove-event-participant.usecase';
import { typeormReservationGateway } from './reservation/infra/persistance/repositories/typeorm-reservation.gateway';
import { createReservationRouter } from './reservation/presentation/routes/reservation.route';
import { createChangePasswordUseCase } from './profile/user/app/usecases/change-password.usecase';
import { makeChangeUserAccountStatusUseCase } from './profile/user/app/usecases/change-user-account-status.usecase';
import { typeormUserAccountStatusGateway } from './profile/user/infra/persistance/repositories/typeorm-user-account-status.gateway';
import { makeChangeUserPermissionUseCase } from './profile/user/app/usecases/change-user-permission.usecase';
import { makeExportUserPermissionChangesUseCase } from './profile/user/app/usecases/export-user-permission-changes.usecase';
import { typeormUserPermissionsGateway } from './profile/user/infra/persistance/repositories/typeorm-user-permissions.gateway';
import { makeAuthMiddleware } from './auth/infra/gards/auth.middleware';
import { makeLoadUserPermissions } from './auth/infra/gards/user-permissions.middleware';
import { typeormUserPasswordGateway } from './profile/user/infra/persistance/repositories/typeorm-user-password.gateway';
import { makeCreateUserUseCase } from './profile/user/app/usecases/create-user.usecase';
import { makeDeleteUserUseCase } from './profile/user/app/usecases/delete-user.usecase';
import { makeGetUserByIdUseCase } from './profile/user/app/usecases/get-user-by-id.usecase';
import { makeGetUsersUseCase } from './profile/user/app/usecases/get-users.usecase';
import { typeormUserGateway } from './profile/user/infra/persistance/repositories/typeorm-user.gateway';
import { bcryptPasswordHasherGateway } from './profile/user/infra/security/bcrypt-password-hasher.gateway';
import { createUserRouter } from './profile/user/presentation/routes/user.route';
import { makeCleanupRefreshTokensUseCase } from './auth/app/usecases/cleanup-refresh-tokens.usecase';
import { createIssueRefreshTokenUseCase } from './auth/app/usecases/create-refresh-token.usecase';
import { makeGetAuthenticatedUserUseCase } from './auth/app/usecases/get-authenticated-user.usecase';
import { createLoginUseCase } from './auth/app/usecases/login.usecase';
import { createLogoutAllUseCase } from './auth/app/usecases/logout-all.usecase';
import { createLogoutUseCase } from './auth/app/usecases/logout.usecase';
import { createRefreshUseCase } from './auth/app/usecases/refresh.usecase';
import { typeormRefreshTokenGateway } from './auth/infra/persistance/repositories/typeorm-refresh-token.gateway';
import { startRefreshTokenCleanupScheduler } from './auth/infra/scheduling/refresh-token-cleanup.scheduler';
import { nodeTokenSecurityGateway } from './auth/infra/security/node-token-security.gateway';
import { createAuthRouter } from './auth/presentation/routes/auth.route';
import { db } from './core/dataBase.config';
import { errorMiddleware } from './core/middleware/erreur.middleware';
import { AppError } from './core/http/error.response';
import { registerSignupEmailListeners } from './profile/user/infra/mailer/signup-email.listener';
import { registerUserDeletionEmailListener } from './profile/user/infra/mailer/user-deletion-email.listener';



const app = express();
const port = 3000;
const cancelEvenement = makeCancelEvenementUseCase(typeormEvenementGateway);
const createEvenement = makeCreateEvenementUseCase(typeormEvenementGateway);
const deleteEvenement = makeDeleteEvenementUseCase(typeormEvenementGateway);
const getEvenementById = makeGetEvenementByIdUseCase(typeormEvenementGateway);
const getEvenements = makeGetEvenementsUseCase(typeormEvenementGateway);
const updateEvenementDate = makeUpdateEvenementDateUseCase(typeormEvenementGateway);
const updateEvenementDetails = makeUpdateEvenementDetailsUseCase(typeormEvenementGateway);
const createReservation = makeCreateReservationUseCase(typeormReservationGateway);
const cancelReservation = makeCancelReservationUseCase(typeormReservationGateway);
const getMyReservations = makeGetMyReservationsUseCase(typeormReservationGateway);
const getEventParticipants = makeGetEventParticipantsUseCase(typeormReservationGateway);
const removeEventParticipant = makeRemoveEventParticipantUseCase(typeormReservationGateway);
const changePassword = createChangePasswordUseCase(typeormUserPasswordGateway, bcryptPasswordHasherGateway);
const suspendUserAccount = makeChangeUserAccountStatusUseCase(typeormUserAccountStatusGateway, 'SUSPEND');
const reactivateUserAccount = makeChangeUserAccountStatusUseCase(typeormUserAccountStatusGateway, 'REACTIVATE');
const grantUserPermission = makeChangeUserPermissionUseCase(typeormUserPermissionsGateway, 'grant');
const revokeUserPermission = makeChangeUserPermissionUseCase(typeormUserPermissionsGateway, 'revoke');
const exportUserPermissionChanges = makeExportUserPermissionChangesUseCase(typeormUserPermissionsGateway);
const authMiddleware = makeAuthMiddleware(typeormRefreshTokenGateway);
const loadUserPermissions = makeLoadUserPermissions(typeormUserPermissionsGateway);
const issueRefreshToken = createIssueRefreshTokenUseCase(typeormRefreshTokenGateway, nodeTokenSecurityGateway);


app.use(cors());
app.use(express.json());
app.use('/evenements', createEvenementRouter({
  cancelEvenement,
  createEvenement,
  deleteEvenement,
  getEvenementById,
  getEvenements,
  updateEvenementDate,
  updateEvenementDetails,
  authMiddleware,
  loadUserPermissions
}));
app.use('/', createReservationRouter({
  createReservation,
  cancelReservation,
  getMyReservations,
  getEventParticipants,
  removeEventParticipant,
  authMiddleware,
  loadUserPermissions
}));
app.use('/', createUserRouter({
  createUser: makeCreateUserUseCase(typeormUserGateway, bcryptPasswordHasherGateway),
  deleteUser: makeDeleteUserUseCase(typeormUserGateway),
  getUserById: makeGetUserByIdUseCase(typeormUserGateway),
  getUsers: makeGetUsersUseCase(typeormUserGateway),
  changePassword,
  grantUserPermission,
  revokeUserPermission,
  exportUserPermissionChanges,
  suspendUserAccount,
  reactivateUserAccount,
  authMiddleware,
  loadUserPermissions
}));
app.use('/auth', createAuthRouter({
  login: createLoginUseCase(typeormUserGateway, bcryptPasswordHasherGateway, nodeTokenSecurityGateway, issueRefreshToken),
  getAuthenticatedUser: makeGetAuthenticatedUserUseCase(typeormUserGateway),
  authMiddleware,
  logout: createLogoutUseCase(typeormRefreshTokenGateway, nodeTokenSecurityGateway),
  logoutAll: createLogoutAllUseCase(typeormRefreshTokenGateway),
  refresh: createRefreshUseCase(typeormRefreshTokenGateway, nodeTokenSecurityGateway)
}));

app.use((_req, _res, next) => {
  next(new AppError('Route introuvable.', 404, 'ERR_ROUTE_NOT_FOUND'));
});
app.use(errorMiddleware);

const startServer = async (): Promise<void> => {
  await db.initialize();
  registerSignupEmailListeners(typeormUserGateway);
  registerUserDeletionEmailListener();
  registerEvenementCancellationEmailListener();
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
