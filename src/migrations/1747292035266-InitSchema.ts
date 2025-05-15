import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitSchema1747292035266 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "subscription" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "email" character varying NOT NULL,
                "city" character varying NOT NULL,
                "frequency" character varying NOT NULL,
                "confirmed" boolean NOT NULL DEFAULT false,
                "confirmationToken" character varying NOT NULL,
                "unsubscribeToken" character varying NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_10c55c4237375813aa5acce99c7" UNIQUE ("confirmationToken"),
                CONSTRAINT "UQ_59abeb29cd830895c3cbdeca54a" UNIQUE ("unsubscribeToken"),
                CONSTRAINT "PK_8c3e00ebd02103caa1174cd5d9d" PRIMARY KEY ("id")
            )`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "subscription"`);
  }
}
