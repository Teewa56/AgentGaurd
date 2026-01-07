import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

@Entity()
export class Dispute {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    txId!: number;

    @Column()
    agentAddress!: string;

    @Column()
    userAddress!: string;

    @Column({ type: "decimal", precision: 20, scale: 0 })
    amount!: string;

    @Column()
    status!: string; // Pending, Arbitrating, Resolved, Appealed

    @Column({ nullable: true })
    claudeAnalysis?: string;

    @Column({ nullable: true })
    refundPercent?: number;

    @Column({ nullable: true })
    slashAmount?: string;

    @CreateDateColumn()
    createdAt!: Date;
}
