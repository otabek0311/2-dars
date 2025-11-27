import { Column, DataType, Model, Table } from "sequelize-typescript";


@Table({timestamps:true})
export class User extends Model {
    @Column
    username:string

    @Column
    email:string
    
    @Column
    password:string
    
    @Column({ allowNull:true, defaultValue:null})
    otp:string
    
    @Column({defaultValue:false})
    isVerify:string
    
    @Column({ allowNull:true, type:DataType.BIGINT})
    otpTime:number
    
}