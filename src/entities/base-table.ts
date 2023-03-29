import { Expose } from 'class-transformer';
import {
  Column,
  BaseEntity,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryColumn,
} from 'typeorm';

abstract class BaseTable extends BaseEntity {
  @PrimaryColumn('uuid')
  @Expose()
  id: string;

  @Column()
  @CreateDateColumn()
  createdAt: Date;

  @Column()
  @UpdateDateColumn()
  updatedAt: Date;
}

export default BaseTable;
