import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../common/base.entity';

@Entity()
export class Character extends BaseEntity {
  @Column()
  name: string;

  @Column({ default: 'unknown' })
  status: string;

  @Column({ default: 'unknown' })
  species: string;

  @Column({ default: '' })
  type: string;

  @Column({ default: 'unknown' })
  gender: string;

  @Column({ default: '' })
  originName: string;

  @Column({ default: '' })
  originUrl: string;

  @Column({ default: '' })
  locationName: string;

  @Column({ default: '' })
  locationUrl: string;

  @Column({ default: '' })
  imageFile: string;

  @Column({ type: 'simple-json', default: '[]' })
  episodeUrls: string[];

  @Column({ default: '' })
  url: string;

  @Column({ default: '' })
  created: string;
}
