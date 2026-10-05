import * as argon2 from 'argon2';
import { AppDataSource } from '../data-source';
import { Organization } from '../../modules/organizations/entities/organization.entity';
import { User } from '../../modules/users/entities/user.entity';
import { UserRole } from '../../modules/users/enums/user-role.enum';

async function runSeed(): Promise<void> {
  if ((process.env.NODE_ENV ?? 'development') === 'production') {
    throw new Error('Development seed data is disabled in production.');
  }

  const adminEmail = process.env.DEMO_ADMIN_EMAIL?.trim().toLowerCase();
  const adminPassword = process.env.DEMO_ADMIN_PASSWORD;
  if (!adminEmail || !adminPassword || adminPassword.length < 12) {
    throw new Error(
      'Set DEMO_ADMIN_EMAIL and a DEMO_ADMIN_PASSWORD of at least 12 characters in the root .env file.',
    );
  }

  await AppDataSource.initialize();
  try {
    await AppDataSource.transaction(async (manager) => {
      const organizationRepository = manager.getRepository(Organization);
      const userRepository = manager.getRepository(User);
      const organizationName = process.env.SEED_ORGANIZATION_NAME?.trim() || 'WorkforceIQ Local';
      const countryCode = (process.env.SEED_COUNTRY_CODE?.trim() || 'ET').toUpperCase();
      const currencyCode = (process.env.SEED_CURRENCY_CODE?.trim() || 'ETB').toUpperCase();

      let organization = await organizationRepository.findOne({
        where: { name: organizationName, countryCode },
      });
      if (!organization) {
        organization = await organizationRepository.save(
          organizationRepository.create({
            name: organizationName,
            countryCode,
            currencyCode,
          }),
        );
      }

      const existingUser = await userRepository.findOne({ where: { email: adminEmail } });
      if (existingUser) {
        if (existingUser.organizationId !== organization.id || existingUser.role !== UserRole.ORG_ADMIN) {
          throw new Error(
            `The configured seed admin email ${adminEmail} already belongs to a different organization or role.`,
          );
        }
        console.log(`Development organization and admin already exist (${organizationName}, ${adminEmail}).`);
        return;
      }

      const passwordHash = await argon2.hash(adminPassword, { type: argon2.argon2id });
      const user = userRepository.create({
        email: adminEmail,
        passwordHash,
        role: UserRole.ORG_ADMIN,
        organizationId: organization.id,
      });
      user.organization = organization;
      await userRepository.save(
        user,
      );
      console.log(`Created development organization and admin (${organizationName}, ${adminEmail}).`);
    });
  } finally {
    await AppDataSource.destroy();
  }
}

runSeed().catch((error: unknown) => {
  console.error('Database seeding failed:', error);
  process.exitCode = 1;
});
