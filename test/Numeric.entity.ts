import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Numeric {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  value: number;
}
