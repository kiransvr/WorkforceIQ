import { MigrationInterface, QueryRunner } from 'typeorm';
import {
  decryptSensitiveString,
  encryptSensitiveString,
  getFieldEncryptionKey,
  isEncryptedString,
} from '../../common/transformers/encrypted-string.transformer';

interface BankAccountRow {
  id: string;
  bank_account_number: string;
}

export class EncryptEmployeeBankAccounts20261005110000
  implements MigrationInterface
{
  name = 'EncryptEmployeeBankAccounts20261005110000';

  async up(queryRunner: QueryRunner): Promise<void> {
    getFieldEncryptionKey();
    const rows: BankAccountRow[] = await queryRunner.query(
      'SELECT id, bank_account_number FROM employees',
    );

    for (const row of rows) {
      if (!isEncryptedString(row.bank_account_number)) {
        await queryRunner.query(
          'UPDATE employees SET bank_account_number = $1 WHERE id = $2',
          [encryptSensitiveString(row.bank_account_number), row.id],
        );
      }
    }
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    getFieldEncryptionKey();
    const rows: BankAccountRow[] = await queryRunner.query(
      'SELECT id, bank_account_number FROM employees',
    );

    for (const row of rows) {
      if (isEncryptedString(row.bank_account_number)) {
        await queryRunner.query(
          'UPDATE employees SET bank_account_number = $1 WHERE id = $2',
          [decryptSensitiveString(row.bank_account_number), row.id],
        );
      }
    }
  }
}
