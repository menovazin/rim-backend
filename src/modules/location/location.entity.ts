import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../common/base.entity';

@Entity()
export class Location extends BaseEntity {
  @Column()
  name: string;

  @Column({ default: 'unknown' })
  type: string;

  @Column({ default: 'unknown' })
  dimension: string;

  @Column({ type: 'simple-json', default: '[]' })
  residentUrls: string[];

  @Column({ default: '' })
  url: string;

  @Column({ default: '' })
  created: string;
}
