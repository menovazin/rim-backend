import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../common/base.entity';

@Entity()
export class Episode extends BaseEntity {
  @Column()
  name: string;

  @Column({ default: '' })
  airDate: string;

  @Column({ default: '' })
  episode: string;

  @Column({ type: 'simple-json', default: '[]' })
  characterUrls: string[];

  @Column({ default: '' })
  url: string;

  @Column({ default: '' })
  created: string;
}
