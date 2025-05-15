import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  email: string;

  @Column()
  city: string;

  @Column()
  frequency: string;

  @Column({ default: false })
  confirmed: boolean;

  @Column({ unique: true })
  confirmationToken: string;

  @Column({ unique: true })
  unsubscribeToken: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
